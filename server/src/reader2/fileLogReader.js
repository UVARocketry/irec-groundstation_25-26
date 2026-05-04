/** @import {Reader} from "../readerManager.js" */
import fs from "node:fs";

import { ReaderUtils } from "../readerManager.js";

import {
	Configuration,
	InputConfigOptions,
	SelectConfigOptions,
} from "../configuration.js";
import { getSysTime } from "../data.js";
import { log } from "../log.js";
import { Strings } from "../ansi.js";

class Config {
	/** @type {string} */
	dir = "../out_testlaunch";

	/** @type {number} */
	i = 0;

	/** @type {number} */
	maxI = 0;

	/** @type {boolean} */
	shouldSave = false;
}

/** @implements {Reader} */
export class FileLogReader {
	config = new Configuration(new Config());

	/** @type {(v: Uint8Array<ArrayBuffer>) => Promise<void>}*/
	onData;
	_onDone = () => {};

	shouldEnd = false;

	active = false;

	constructor() {
		this.config.getConfigurable("dir").setConfigGetter(async () => {
			var items = [];

			const files = await fs.promises.readdir("..");
			files
				.map((f) => "../" + f)
				.forEach((f) => {
					const name = ReaderUtils.getSaveItemName(f, 0);

					// lowkey bothers me a lil that we are putting this sync call
					// inside an async function, but the "fixed" version would be
					// way more complicated
					if (fs.existsSync(name)) {
						items.push(f);
					}
				});

			return new SelectConfigOptions(items);
		});
		this.config.getConfigurable("shouldSave").setConfigGetter(async () => {
			return new InputConfigOptions("boolean", "false");
		});
	}

	onDone() {
		this._onDone();
	}

	getConfig() {
		return this.config;
	}

	recover() {
		return true;
	}

	postReconfigure() {
		// we dont really need to do anything post reconfigure for this reader.
		// just wait for the start signal
	}

	/**
	 * @param {() => void} doneCallback
	 */
	setDoneCallback(doneCallback) {
		this._onDone = doneCallback;
	}

	signalStop() {
		this.shouldEnd = true;
		this.onDone();
	}

	async reset() {
		this.config.setField("i", 0);
	}

	/**
	 * @param {number} i
	 */
	async saveFileExists(i) {
		try {
			await fs.promises.access(
				ReaderUtils.getSaveItemName(this.config.get("dir"), i),
				fs.constants.R_OK,
			);
			return true;
		} catch (_) {
			return false;
		}
	}

	async determineNewMaxI() {
		const dir = this.config.get("dir");
		const files = await fs.promises.readdir(dir);

		let maxI = -1;
		for (const file of files) {
			const match = file.match(/^msg-(\d+)$/);
			if (match) {
				const i = parseInt(match[1], 10);
				if (i > maxI) {
					maxI = i;
				}
			}
		}

		this.config.setField("maxI", maxI);
		console.log(`maxI: ${maxI}`);
	}

	async readMessage() {
		let path = ReaderUtils.getSaveItemName(
			this.config.get("dir"),
			this.config.get("i"),
		);
		if (this.shouldEnd) {
			this.onDone();
			return;
		}
		// console.log("i: " + this.config.get("i"));
		// console.log("Path: " + path);
		if (this.config.get("i") === 0) {
			this.determineNewMaxI();
		}
		// console.log("maxI: " + this.config.get("maxI"));
		if (this.config.get("i") > this.config.get("maxI")) {
			console.log("Done");
			this.onDone();
			return;
		}
		if (!fs.existsSync(path)) {
			this.config.setField("i", this.config.get("i") + 1);
			setTimeout(() => {
				this.readMessage();
			}, 1);
			return;
		}

		const file = await fs.openAsBlob(path);

		const buf = new Uint8Array(await file.arrayBuffer());

		this.config.setField("i", this.config.get("i") + 1);
		var currentTime = getSysTime();
		await this.onData(buf);
		const delta = getSysTime() - currentTime;
		if (delta > 1000 && delta < 20000) {
			log(`${Strings.Info}: Waiting for ${delta}ms`);
		}

		setTimeout(
			() => {
				this.readMessage();
			},
			delta > 20000 ? 0 : delta,
		);
	}

	async start() {
		this.shouldEnd = false;
		this.readMessage();
		return true;
	}

	/**
	 * @param {(v: Uint8Array<ArrayBuffer>) => Promise<void>} fn
	 */
	setDataCallback(fn) {
		this.onData = fn;
	}

	shouldSave() {
		return this.config.get("shouldSave");
	}
}
