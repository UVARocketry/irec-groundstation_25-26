import { ServerMessage } from "../../common/ServerMessage.js";
import fs from "node:fs";
import { Configuration, InputConfigOptions } from "./configuration.js";
import { parseMessage } from "./data.js";
import { Message } from "./message.js";
import state from "./state.js";
import { broadcast, getConfigField } from "./index.js";
import { FileLogReader } from "./reader2/fileLogReader.js";
import { Strings } from "./ansi.js";
import { SerialPortReader } from "./reader2/serialPortReader.js";
import { StdoutReader } from "./reader2/stdoutReader.js";
import { FileCleanReader } from "./reader2/logCleanReader.js";

const nilFolder = "";

class ReaderMeta {
	/** @type {ReaderType}*/
	type;
	/** @type {Reader}*/
	reader;
	/** @type {boolean}*/
	isActive = false;

	/**
	 * @param {ReaderType} tp
	 * @param {Reader} reader
	 * @param {boolean?} isActive
	 */
	constructor(tp, reader, isActive) {
		this.type = tp;
		this.reader = reader;
		this.isActive = isActive ?? false;
	}
}

var active = false;

/** @typedef {"serial"|"stdout"|"log"|"fileupdate"|"clean"} ReaderType */

/** @type {ReaderMeta[]} */
var readers = [
	new ReaderMeta("log", new FileLogReader(), false),
	new ReaderMeta("clean", new FileCleanReader(), false),
	new ReaderMeta(
		"stdout",
		new StdoutReader("make", ["runsim"], "stderr", "../../irec_25-26/lib"),
		false,
	),
	new ReaderMeta("serial", new SerialPortReader("/dev/ttyACM0"), false),
];

var readerIndex = 0;

/** @return {ReaderType} */
function getCurrentReaderType() {
	return readers[readerIndex].type;
}

/** @return {Reader} */
function getCurrentReader() {
	return readers[readerIndex].reader;
}

export class Config {
	/** @type {string} */
	saveFolder = "";

	/** @type {ReaderType}*/
	readerType = "log";

	/** @type {Configuration<any>} */
	readerConfig = new Configuration({});

	/** @type {number} */
	msgI = 0;
}

export class ReaderUtils {
	static saveFileNumLength = 5;
	/**
	 * @param {string} saveFolder
	 * @param {number} i
	 * @return string
	 */
	static getSaveItemName(saveFolder, i) {
		return (
			saveFolder +
			"/msg-" +
			(i + "").padStart(ReaderUtils.saveFileNumLength, "0")
		);
	}
}

/**
 * @typedef Reader
 * @property {() => Configuration} getConfig
 * @property {(fn: (v: Uint8Array<ArrayBuffer>) => Promise<void>) => void} setDataCallback
 * @property {() => Promise<boolean>} start
 * @property {() => void} reset
 * @property {() => void} signalStop
 * @property {(fn: () => void) => void} setDoneCallback
 * @property {() => void} postReconfigure
 * @property {() => boolean} recover
 * @property {() => boolean} shouldSave
 */

function recover() {
	const neededType = config().get("readerType");
	var found = false;
	for (var i = 0; i < readers.length; i++) {
		useReader(i);
		if (readers[i].type == neededType) {
			found = true;
			break;
		}
	}
	if (!found) {
		console.log(
			`${Strings.Error}: Could not find reader type of ${neededType} in recovery`,
		);
		useReader(0);
		return;
	}
	getCurrentReader().recover();
}

/**
 * @param {number} index
 */
function useReader(index) {
	if (index >= readers.length) {
		index %= readers.length;
	}
	if (index == readerIndex) {
		state.setAdd("readerType", readers[index].type);
		return;
	}
	getCurrentReader().setDataCallback(async () => {});
	getCurrentReader().setDoneCallback(() => {});
	readerIndex = index;
	config().replaceField("readerConfig", getCurrentReader().getConfig());
	getCurrentReader().setDataCallback(onMessage);
	getCurrentReader().setDoneCallback(onDone);
	state.setAdd("readerType", readers[index].type);
}

function switchReader() {
	stop();
	state.setReaderConnected(false);
	useReader(readerIndex + 1);
	config().setField("saveFolder", nilFolder);
}

async function createSaveFolder() {
	if (!getCurrentReader().shouldSave()) {
		return;
	}
	const saveFolder = config().get("saveFolder");
	/** @type {boolean} */
	var exists = false;
	try {
		await fs.promises.access(saveFolder);
		exists = true;
	} catch (_) {}
	// need to synchrounously create the file bc we dont want to
	// accidentally try creating files in there and crash
	if (!exists) {
		await fs.promises.mkdir(saveFolder, { recursive: true });
	}
}

function genSaveFolder() {
	return "../out_" + new Date().toISOString().slice(0, 19).replace("T", "_");
}

function reset() {
	getCurrentReader().reset();
}

async function start() {
	if (config().get("saveFolder") === nilFolder) {
		config().setField("saveFolder", genSaveFolder());
	}
	const saveFolder = config().get("saveFolder");
	if (saveFolder.length > 2 && !saveFolder.startsWith("..")) {
		config().setField("saveFolder", "../" + saveFolder);
	}
	config().setField("msgI", 0);
	state.setReaderConnected(true);
	await createSaveFolder();
	console.log("Startin...");
	if (!(await getCurrentReader().start())) {
		state.setReaderConnected(false);
	}
	active = true;
}

function stop() {
	if (active) {
		getCurrentReader().signalStop();
	}
	config().setField("saveFolder", nilFolder);
}

function onDone() {
	active = false;
	state.setReaderConnected(false);
	state.setRocketConnected(false);
	config().setField("saveFolder", nilFolder);
}

function postReconfigure() {
	getCurrentReader().postReconfigure();
}

/**
 * @param {string} msg
 * @param {number} i
 */
async function saveItem(msg, i) {
	if (!getCurrentReader().shouldSave()) {
		return;
	}
	if (config().get("saveFolder") === nilFolder) {
		config().setField("saveFolder", genSaveFolder());
	}
	const saveFolder = config().get("saveFolder");
	await fs.promises.writeFile(
		ReaderUtils.getSaveItemName(saveFolder, i),
		msg,
	);
}

/**
 * @param {Uint8Array<ArrayBuffer>} buf
 */
async function onMessage(buf) {
	state.setRocketConnected(true);
	const msg = new Message(buf);
	const decoder = new TextDecoder("utf-8");
	const originalString = decoder.decode(buf);
	var msgI = config().get("msgI");
	config().setField("msgI", config().get("msgI") + 1);
	var command = parseMessage(msg, async function (str) {
		if (!getCurrentReader().shouldSave()) {
			return;
		}
		if (config().get("saveFolder") === nilFolder) {
			config().setField("saveFolder", genSaveFolder());
		}
		const saveFolder = config().get("saveFolder");
		await fs.promises.writeFile(
			ReaderUtils.getSaveItemName(saveFolder, msgI) + "-dump",
			str,
		);
	});
	var send = null;
	if (command === "event") {
		send = new ServerMessage("event", state.getEvent());
	} else if (command === "state") {
		send = new ServerMessage("state", state.getState());
	}
	if (send !== null) {
		broadcast(send);
	}

	// console.log("msgI: " + msgI);
	await saveItem(originalString, msgI);
}

/** @return {Configuration<Config>} */
function config() {
	return getConfigField("manager");
}

function init() {
	config()
		.getConfigurable("saveFolder")
		.setConfigGetter(async () => {
			return new InputConfigOptions("string", "");
		});

	config().replaceField("readerConfig", getCurrentReader().getConfig());
	useReader(0);
	getCurrentReader().setDataCallback(onMessage);
	getCurrentReader().setDoneCallback(onDone);
}

export default {
	Config,
	ReaderUtils,
	recover,
	switchReader,
	start,
	stop,
	postReconfigure,
	getCurrentReaderType,
	getCurrentReader,
	init,
	reset,
};
