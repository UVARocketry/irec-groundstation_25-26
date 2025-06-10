import { ReadlineParser, SerialPort } from "serialport";
/** @import { RenameResponse } from "common/ServerMessage.js"; */
import { InputReader } from "./inputReader.js";
import { Strings } from "../ansi.js";
import { clearConnected, setRocketConnected } from "../state.js";
import { log } from "../log.js";

export class SerialPortReader extends InputReader {
	/** @type {string} */
	path = "";

	/**@type {string?} */
	saveFolder = null;
	/** @type {SerialPort?} */
	port = null;

	/**@type {() => string? } */
	genSaveFolder = () => null;

	msgI = 0;

	restart = false;
	lastMessageTime = 0;

	lastLineChecked = 0;
	lastLineCount = 0;

	/** @type {ReadlineParser?} */
	parser = null;

	renamed = false;

	/**
	 * @param {(_: Uint8Array) => Promise<void>} update
	 * @param {string} path
	 * @param {() => string ?} genSaveFolder
	 */
	constructor(update, path, genSaveFolder) {
		super(update);
		this.genSaveFolder = genSaveFolder;
		this.path = path;
	}
	reset() {
		this.lastLineChecked = 0;
		this.start();
	}
	/**
	 * @param {string} name
	 */
	rename(name) {
		this.path = name;
	}
	async getRenameOptions() {
		const portInfo = await SerialPort.list();
		const ports = portInfo.map((v) => v.path);

		/** @type {RenameResponse} */
		const ret = {
			type: "choice",
			data: ports,
		};
		return ret;
	}
	getName() {
		return this.path;
	}
	async start() {
		if (this.port !== null) {
			console.log("restarting...");
			log(`${Strings.Warn}: Stdin process already exists!`);
			this.restart = true;
			// this.port.close();
			this.parser?.destroy();
			// this.port = null;
			// this.port = null;
			return;
		}
		clearConnected();
		console.log("starting");
		const portInfo = await SerialPort.list();
		const ports = portInfo.map((v) => v.path);

		if (!ports.some((v) => v === this.path)) {
			log(`${Strings.Error}: Could not find serial port at path ${this.path}`);
			return;
		}
		try {
			this.port = new SerialPort({
				path: this.path,
				baudRate: 96000,
			});
		} catch (_) {
			this.port = null;
			log(`${Strings.Error}: Failed to open serial port ${this.path}`);
			return;
		}
		if (!this.port.isOpen) {
			// this.port.destroy();
			// this.port = null;
			log(`${Strings.Error}: Failed to open serial port ${this.path}`);
			// return;
		}
		this.signalWake();
		this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

		this.msgI = 0;
		if (!this.renamed) {
			this.saveFolder = this.genSaveFolder();
			this.renamed = false;
		}
		this.saveFolder = this.saveFolder ?? "out_no_save";
		console.log("ayyo we got a folder: " + this.saveFolder);
		await this.createSaveFolder(this.saveFolder);
		console.log("yo folder now");

		this.parser.on("data", (v) => {
			/** @type {string} */
			const str = v;
			console.log(str);
			if (!str.startsWith("ABCD")) {
				return;
			}
			this.signalActive();
			const newV = str.substring(4, str.length);
			if (this.saveFolder !== null) {
				// can ignore the callback bc we have no dependency on having the new file exist
				this.saveItem(this.saveFolder, newV, this.msgI);
				this.msgI++;
			}
			this.onUpdate(new Uint8Array(Buffer.from(newV)));
			this.lastMessageTime = new Date().getTime();
			setRocketConnected(true);
		});
		this.parser.on("close", () => {
			this.signalDone();
			var str = Strings.Info;
			log(`${str}: Serial stream from ${this.path}  ended`);
			setTimeout(() => {
				this.parser = null;
				this.port = null;
				if (this.restart) {
					this.restart = false;
					this.start();
				}
			}, 10);
		});
		log(`${Strings.Ok}: Started stream at ${this.path}`);
		this.signalWake();
	}
	stop() {
		// this.port?.destroy();
		this.parser?.destroy();
	}
}
