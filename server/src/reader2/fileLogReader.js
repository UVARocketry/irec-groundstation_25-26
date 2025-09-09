/** @import {Reader} from "../readerManager.js" */
import fs from "node:fs";

import { ReaderUtils } from "../readerManager.js";

import { Configuration } from "../configuration.js";
import { getSysTime } from "../data.js";
import { log } from "../log.js";
import { Strings } from "../ansi.js";

class Config {
	/** @type {string} */
	dir = "../out";

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

	/** @type {(v: Uint8Array<ArrayBuffer>) => void}*/
	onData = () => {};
	_onDone = () => {};

	shouldEnd = false;

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

			return items;
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
		var ceil = 10000;
		while (await this.saveFileExists(ceil)) {
			ceil *= 2;
		}
		var floor = 1;

		while (ceil - 1 >= floor) {
			var middle = Math.floor((ceil - 1 + floor) / 2);
			var exists = await this.saveFileExists(middle);
			if (exists) {
				if (floor == middle) {
					break;
				}
				floor = middle;
			} else {
				if (ceil == middle) {
					ceil = middle - 1;
				}
				ceil = middle;
			}
		}
		this.config.setField("maxI", floor);
	}

	async readMessage() {
		let path = ReaderUtils.getSaveItemName(
			this.config.get("dir"),
			this.config.get("i"),
		);
		console.log(this.shouldEnd);
		// if (this.shouldEnd) {
		// 	this.onDone();
		// 	return;
		// }
		console.log("i: " + this.config.get("i"));
		console.log("Path: " + path);
		if (this.config.get("i") === 0) {
			this.determineNewMaxI();
		}
		console.log("maxI: " + this.config.get("maxI"));
		if (this.config.get("i") > this.config.get("maxI")) {
			this.onDone();
			return;
		}
		if (!fs.existsSync(path)) {
			this.config.setField("i", this.config.get("i") + 1);
			await this.determineNewMaxI();
			setTimeout(() => {
				this.readMessage();
			}, 1);
			return;
		}

		const file = await fs.openAsBlob(path);

		const buf = new Uint8Array(await file.arrayBuffer());

		this.config.setField("i", this.config.get("i") + 1);
		var currentTime = getSysTime();
		this.onData(buf);
		const delta = getSysTime() - currentTime;
		// if (delta > 1000) {
		log(`${Strings.Info}: Waiting for ${delta}ms`);
		// }

		setTimeout(() => {
			this.readMessage();
		}, delta);
	}

	async start() {
		this.shouldEnd = false;
		this.readMessage();
		return true;
	}

	/**
	 * @param {(v: Uint8Array<ArrayBuffer>) => void} fn
	 */
	setDataCallback(fn) {
		this.onData = fn;
	}

	shouldSave() {
		return this.config.get("shouldSave");
	}
}
