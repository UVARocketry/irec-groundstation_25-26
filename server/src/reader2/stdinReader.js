import { ChildProcess } from "child_process";
import { Configuration } from "../configuration.js";

class Config {
	/** @type {"stdout"|"stderr"} */
	stream = "stdout";

	/** @type {string} */
	cmd = "pio";

	/** @type {string[]} */
	args = ["device", "monitor"];

	/** @type {string} */
	pwd = ".";
}

/** @implements {Reader} */
export class StdinReader {
	config = new Configuration(new Config());

	/** @type {(v: Uint8Array<ArrayBuffer>) => void}*/
	onData = () => {};
	_onDone = () => {};

	/** @type {ChildProcess?} */
	process = null;

	/**
	 * @param {"stdout" | "stderr"} stream
	 * @param {string} cmd
	 * @param {string[]} args
	 * @param {string} pwd
	 */
	constructor(cmd, args, stream, pwd) {
		this.config.setField("stream", stream);
		this.config.setField("pwd", pwd);
		this.config.setField("cmd", cmd);
		this.config.setField("args", args);

		this.config.getConfigurable("stream").setConfigGetter(async () => {
			return ["stdout", "stderr"];
		});
		this.config.getConfigurable("cmd").setConfigGetter(async () => {
			return "";
		});
		this.config.getConfigurable("args").setConfigGetter(async () => {
			return [];
		});
		this.config.getConfigurable("pwd").setConfigGetter(async () => {
			return "";
		});
	}

	shouldSave() {
		return true;
	}
}
