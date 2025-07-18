/** @import { RenameResponse } from "common/ServerMessage.js"; */
import { InputReader } from "./inputReader.js";
import { Strings } from "../ansi.js";
import fs from "node:fs";
import { clearConnected } from "../state.js";
import { log } from "../log.js";

export class FileUpdateReader extends InputReader {
	/** @type {string} */
	path = "";

	/**@type {string?} */
	saveFolder = null;

	/**@type {() => string? } */
	genSaveFolder = () => null;

	msgI = 0;

	restart = false;
	lastMessageTime = 0;

	lastLineChecked = 0;
	updateInterval = 10;
	lastLineCount = 0;
	/** @type {NodeJS.Timeout|undefined} */
	intervalId = undefined;

	renamed = false;

	/**
	 * @param {(_: Uint8Array) => Promise<void>} update
	 * @param {string} path
	 * @param {number} updateTime
	 * @param {() => string ?} genSaveFolder
	 */
	constructor(update, path, updateTime, genSaveFolder) {
		super(update);
		this.genSaveFolder = genSaveFolder;
		this.path = path;
		this.updateInterval = updateTime;
	}
	reset() {
		this.lastLineChecked = 0;
		this.start();
	}
	/**
	 * @param {string} name
	 */
	rename(name) {
		const newFolder = "../" + name;
		// if (this.saveFolder !== null) {
		//     fs.cpSync(this.saveFolder, newFolder);
		//     fs.rmdir(this.saveFolder, () => {});
		// }
		this.saveFolder = newFolder;
		this.renamed = true;
	}
	async getRenameOptions() {
		/** @type {RenameResponse} */
		const ret = {
			type: "name",
			data: [],
		};
		return ret;
	}
	getName() {
		return this.saveFolder ?? this.genSaveFolder() ?? "NONE";
	}
	async start() {
		clearConnected();

		this.signalWake();
		this.msgI = 0;
		if (!this.renamed) {
			this.saveFolder = this.genSaveFolder();
			this.renamed = false;
		}
		this.saveFolder = this.saveFolder ?? "out_no_save";
		await this.createSaveFolder(this.saveFolder);
		if (!fs.existsSync(this.path)) {
			log(`${Strings.Warn}: File ${this.path} does not exist yet`);
		}
		this.intervalId = setInterval(() => {
			if (!fs.existsSync(this.path)) {
				return;
			}
			const lines = fs.readFileSync(this.path).toString().split("\n");
			if (lines.length < this.lastLineCount) {
				this.lastLineChecked = 0;
			}
			this.lastLineCount = lines.length;
			for (var i = this.lastLineChecked; i < lines.length; i++) {
				const s = lines[i];
				// log(s);
				if (!s.startsWith("ABCD")) {
					continue;
				}
				this.signalActive();
				const newV = s.substring(4, s.length);
				if (this.saveFolder !== null) {
					this.saveItem(this.saveFolder, newV, this.msgI);
					this.msgI++;
				}
				this.onUpdate(new Uint8Array(Buffer.from(newV)));
				this.lastMessageTime = new Date().getTime();
			}
			this.lastLineChecked = lines.length;
		}, this.updateInterval);
		log(`${Strings.Ok}: Started file read ${this.path}`);
	}
	stop() {
		try {
			clearInterval(this.intervalId);
		} catch (_) {}
	}
}
