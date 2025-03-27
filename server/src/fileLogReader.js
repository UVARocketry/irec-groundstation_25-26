import fs from "node:fs";
import { InputReader } from "./inputReader.js";
import { broadcastEvent } from "./index.js";
import { clearConnected, setEvent, setRocketConnected } from "./state.js";
import { clearSysTime, sysTime } from "./data.js";
import { log } from "./log.js";
import { Strings } from "./ansi.js";
/** @import { RenameResponse } from "common/ServerMessage.js"; */

export class FileLogReader extends InputReader {
	i = 0;
	readFirst = false;
	path = "../out";
	cancel = false;
	currentTime = 0;
	maxI = 0;
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
	}
	async start() {
		if (!this.readFirst) {
			clearConnected();
			this.readFirst = true;
			this.signalWake();
			setTimeout(() => this.readMessage(), 1000);
		}
	}

	/** @param {string} name */
	rename(name) {
		this.path = "../" + name;
	}

	async getRenameOptions() {
		var items = [];

		const files = fs.readdirSync("..");
		files.forEach((f) => {
			const name = this.getSaveItemName("../" + f, 0);
			if (fs.existsSync(name)) {
				items.push(f);
			}
		});

		/** @type {RenameResponse} */
		const ret = {
			type: "choice",
			data: items,
		};
		return ret;
	}

	getName() {
		return this.path;
	}
	async readMessage() {
		if (this.cancel) {
			this.cancel = false;
			this.signalDone();
			return;
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
