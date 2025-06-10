import fs from "node:fs";
/** @import { RenameResponse } from "common/ServerMessage.js"; */
import { setReaderConnected, setRocketConnected } from "../state.js";

/**
 * @interface
 */
export class InputReader {
	onUpdate = async function (/** @type {Uint8Array} */ _) {};
	itemI = 0;
	saveFileNumLength = 5;
	/**
	 * @param {(_: Uint8Array) => Promise<void>} onUpdate
	 */
	constructor(onUpdate) {
		this.onUpdate = onUpdate;
	}
	reset() {}

	async start() {}

	stop() {}

	/** @param {string} _ */
	rename(_) {}

	/** @return string */
	getName() {
		return "";
	}

	/** @return {Promise<RenameResponse>} */
	async getRenameOptions() {
		// @ts-ignore
		return {};
	}

	/** @param {string} saveFolder */
	async createSaveFolder(saveFolder) {
		/** @type {boolean} */
		var existsProm = await new Promise((resolve, _) => {
			fs.access(saveFolder ?? process.cwd(), (exists) => {
				resolve(exists == null);
			});
		});
		// need to synchrounously create the file bc we dont want to accidentally try creating files in there and crash
		if (!existsProm) {
			await new Promise((res, _) => {
				fs.mkdir(saveFolder ?? process.cwd(), { recursive: true }, () =>
					res(null),
				);
			});
		}
	}

	/**
	 * @param {string} saveFolder
	 * @param {number} i
	 * @return string
	 */
	getSaveItemName(saveFolder, i) {
		return (
			saveFolder + "/msg-" + (i + "").padStart(this.saveFileNumLength, "0")
		);
	}

	/** @param {string} saveFolder
	 * @param {string} msg
	 * @param {number} i*/
	async saveItem(saveFolder, msg, i) {
		await new Promise((res, _) => {
			fs.writeFile(this.getSaveItemName(saveFolder, i), msg, () => res(null));
		});
	}

	signalDone() {
		setReaderConnected(false);
		setRocketConnected(false);
	}

	signalWake() {
		setReaderConnected(true);
	}

	signalActive() {
		setReaderConnected(true);
		setRocketConnected(true);
	}
}
