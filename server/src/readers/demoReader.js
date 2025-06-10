import fs from "node:fs";
import { InputReader } from "./inputReader.js";
import { broadcastEvent } from "../index.js";
import {
	clearConnected,
	getState,
	setEvent,
	setRocketConnected,
} from "../state.js";
import { clearSysTime, sysTime } from "../data.js";
import { log } from "../log.js";
import { Strings } from "../ansi.js";
import { ReadlineParser, SerialPort } from "serialport";
/** @import { RenameResponse } from "common/ServerMessage.js"; */

export class DemoReader extends InputReader {
	i = 0;
	readFirst = false;
	path = "../out";
	stream = "/dev/ttyACM0";
	cancel = false;
	currentTime = 0;
	maxI = 0;
	/** @type {ReadlineParser?} */
	parser = null;
	/** @type {SerialPort?} */
	port = null;
	/**
	 * @param {(_: Uint8Array) => Promise<void>} fn
	 * @param {string?} path
	 */
	constructor(fn, path) {
		super(fn);
		this.path = path ?? this.path;
	}
	stop() {
		this.cancel = true;
		clearConnected();
		this.readMessage();
	}
	async start() {
		if (!this.readFirst) {
			clearConnected();
			this.readFirst = true;
			this.signalWake();
			setTimeout(() => this.readMessage(), 1000);
		}
	}

	/**
	 * @param {string} name
	 */
	rename(name) {
		this.stream = name;
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
	async readMessage() {
		if (this.cancel) {
			this.parser?.destroy();
			this.cancel = false;
			this.signalDone();
			return;
		}
		if (this.parser === null) {
			const portInfo = await SerialPort.list();
			const ports = portInfo.map((v) => v.path);

			if (!ports.some((v) => v === this.stream)) {
				log(
					`${Strings.Error}: Could not find serial port at path ${this.stream}`,
				);
				return;
			}
			try {
				this.port = new SerialPort({
					path: this.stream,
					baudRate: 96000,
				});
			} catch (_) {
				this.port = null;
				log(`${Strings.Error}: Failed to open serial port ${this.stream}`);
				return;
			}
			if (!this.port.isOpen) {
				// this.port.destroy();
				// this.port = null;
				log(`${Strings.Error}: Failed to open serial port ${this.stream}`);
				// return;
			}
			this.signalWake();
			this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

			this.parser.on("close", () => {
				this.signalDone();
				var str = Strings.Info;
				log(`${str}: Serial stream from ${this.stream}  ended`);
				setTimeout(() => {
					this.parser = null;
					this.port = null;
					if (this.restart) {
						this.restart = false;
						this.start();
					}
				}, 10);
			});
			log(`${Strings.Ok}: Started stream at ${this.stream}`);
			this.signalWake();
		}

		let path = this.getSaveItemName(this.path, this.i);
		if (this.maxI === 0) {
			const files = fs.readdirSync(this.path);
			this.maxI = 0;
			files.forEach((f) => {
				if (/^msg-\d*$/.test(f)) {
					const numStr = f.substring("msg-".length);
					const num = parseInt(numStr, 10);
					if (num > this.maxI) {
						this.maxI = num;
					}
				}
			});
		}
		if (this.i === 0) {
			this.currentTime = 0;
			clearSysTime();
		}
		if (this.i > this.maxI) {
			this.maxI = 0;
			setEvent("done");
			broadcastEvent();
			this.signalDone();
			return;
		}
		if (!fs.existsSync(path)) {
			this.i++;
			setTimeout(() => {
				this.readMessage();
			}, 1);
			return;
		}
		this.signalActive();
		const file = await fs.openAsBlob(path);

		const buf = new Uint8Array(await file.arrayBuffer());

		this.port.write(
			"DEPLOYMENT:'" +
				Math.floor((getState().pidDeployment ?? 0) * 100) +
				"'\r\n",
		);

		this.i++;
		this.onUpdate(buf);
		const delta = sysTime - this.currentTime;
		if (delta > 1000) {
			log(`${Strings.Info}: Waiting for ${delta}ms`);
		}

		setTimeout(() => {
			setRocketConnected(true);
			if (delta > 1000) {
				log(`${Strings.Info}: Done waiting for ${delta}ms`);
			}
			this.currentTime += delta;
			this.readMessage();
		}, delta);
	}
	async reset() {
		this.i = 0;
		this.signalWake();
		this.readMessage();
	}
}
