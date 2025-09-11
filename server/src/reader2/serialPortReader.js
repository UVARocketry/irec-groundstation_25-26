/** @import {Reader} from "../readerManager.js" */
import { ReadlineParser, SerialPort } from "serialport";
import { Strings } from "../ansi.js";
import { log } from "../log.js";
import { Configuration, SelectConfigOptions } from "../configuration.js";

class Config {
	/** @type {string} */
	portPath = "";
}

/** @implements {Reader} */
export class SerialPortReader {
	config = new Configuration(new Config());

	/** @type {(v: Uint8Array<ArrayBuffer>) => void}*/
	onData = () => {};
	_onDone = () => {};

	/** @type {SerialPort?} */
	port = null;

	restart = false;

	/** @type {ReadlineParser?} */
	parser = null;

	/**
	 * @param {string} path
	 */
	constructor(path) {
		this.config.getConfigurable("portPath").setConfigGetter(async () => {
			const portInfo = await SerialPort.list();
			const ports = portInfo.map((v) => v.path);

			return new SelectConfigOptions(ports);
		});
		this.config.setField("portPath", path);
	}

	shouldSave() {
		return true;
	}

	recover() {
		return true;
	}

	postReconfigure() {
		this.signalStop();
	}

	/**
	 * @param {(v: Uint8Array<ArrayBuffer>) => void} fn
	 */
	setDataCallback(fn) {
		this.onData = fn;
	}

	/**
	 * @param {() => void} fn
	 */
	setDoneCallback(fn) {
		this._onDone = fn;
	}

	getConfig() {
		return this.config;
	}
	reset() {
		this.signalStop();
	}

	getPath() {
		return this.config.get("portPath");
	}
	async start() {
		if (this.port !== null) {
			console.log("restarting...");
			log(`${Strings.Warn}: Stdin process already exists!`);
			this.restart = true;
			// this.port.close();
			this.parser?.destroy();
			this.port.close();
			// this.port = null;
			// this.port = null;
			return false;
		}
		console.log("starting");
		const portInfo = await SerialPort.list();
		const ports = portInfo.map((v) => v.path);

		if (!ports.some((v) => v === this.getPath())) {
			log(
				`${Strings.Error}: Could not find serial port at path ${this.getPath()}`,
			);
			return false;
		}
		try {
			this.port = new SerialPort({
				path: this.config.get("portPath"),
				baudRate: 96000,
			});
		} catch (_) {
			this.port = null;
			log(`${Strings.Error}: Failed to open serial port ${this.getPath()}`);
			return false;
		}
		if (!this.port.isOpen) {
			// this.port.destroy();
			// this.port = null;
			log(`${Strings.Error}: Failed to open serial port ${this.getPath()}`);
			// return;
		}
		this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

		this.parser.on("data", (v) => {
			/** @type {string} */
			const str = v;
			console.log(str);
			if (!str.startsWith("ABCD")) {
				return;
			}
			const newV = str.substring(4, str.length);
			this.onData(new Uint8Array(Buffer.from(newV)));
			this.lastMessageTime = new Date().getTime();
		});
		this.parser.on("close", () => {
			var str = Strings.Info;
			log(`${str}: Serial stream from ${this.getPath()}  ended`);
			if (!this.restart) {
				this._onDone();
			}
			setTimeout(() => {
				this.parser = null;
				this.port = null;
				if (this.restart) {
					this.restart = false;
					this.start();
				}
			}, 10);
		});
		log(`${Strings.Ok}: Started stream at ${this.getPath()}`);
		return true;
	}
	signalStop() {
		if (this.parser !== null) {
			this.parser.destroy();
		}
		if (this.port !== null) {
			this.port.destroy();
		}
	}
}
