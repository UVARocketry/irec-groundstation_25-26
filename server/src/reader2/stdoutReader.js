import { ChildProcess, spawn } from "child_process";
/** @import {Reader} from "../readerManager.js" */
import {
	Configuration,
	InputConfigOptions,
	SelectConfigOptions,
} from "../configuration.js";
import { log } from "../log.js";
import { Strings } from "../ansi.js";

class Config {
	/** @type {"stdout"|"stderr"} */
	stream = "stdout";

	/** @type {string} */
	cmd = "pio";

	/** @type {string} */
	validMessageHeader = "ABCD";

	/** @type {string[]} */
	args = ["device", "monitor"];

	/** @type {string} */
	pwd = ".";
}

/** @implements {Reader} */
export class StdoutReader {
	config = new Configuration(new Config());

	/** @type {(v: Uint8Array<ArrayBuffer>) => void}*/
	onData = () => {};
	_onDone = () => {};

	/** @type {ChildProcess?} */
	process = null;

	restart = false;

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
		this.config.setField("validMessageHeader", "ABCD");

		this.config.getConfigurable("stream").setConfigGetter(async () => {
			return new SelectConfigOptions(["stdout", "stderr"]);
		});
		this.config.getConfigurable("cmd").setConfigGetter(async () => {
			return new InputConfigOptions("string", "");
		});
		this.config.getConfigurable("args").setConfigGetter(async () => {
			return new InputConfigOptions("string[]", "[]");
		});
		this.config.getConfigurable("pwd").setConfigGetter(async () => {
			return new InputConfigOptions("string", "");
		});
		this.config
			.getConfigurable("validMessageHeader")
			.setConfigGetter(async () => {
				return new InputConfigOptions("string", "ABCD");
			});
	}

	postReconfigure() {
		this.signalStop();
	}

	/**
	 * @param {() => void} fn
	 */
	setDoneCallback(fn) {
		this._onDone = fn;
	}

	signalStop() {
		if (this.process === null || this.process.killed) {
			return;
		}
		this.process.kill();
	}

	reset() {
		this.signalStop();
	}

	/**
	 * @param {(v: Uint8Array<ArrayBuffer>) => void} fn
	 */
	setDataCallback(fn) {
		this.onData = fn;
	}

	getConfig() {
		return this.config;
	}

	shouldSave() {
		return true;
	}

	async start() {
		if (this.process != null) {
			log(`${Strings.Warn}: Stdin process already exists!`);
			this.restart = true;
			this.signalStop();
			return false;
		}

		const cmd = this.config.get("cmd");
		const args = this.config.get("args");
		this.process = spawn(cmd, args, {
			cwd: this.config.get("pwd"),
		});

		if (this.process.exitCode != null) {
			return false;
		}

		var stream = this.process[this.config.get("stream")];
		if (stream == null) {
			log(
				`${Strings.Error}: error in starting read process: stream ${this.config.get("stream")} does not exist`,
			);
			return false;
		}

		if (this.config.get("stream") === "stdout") {
			this.process.stderr?.on("data", () => {});
		} else if (this.config.get("stream") == "stderr") {
			this.process.stdout?.on("data", () => {});
		} else {
			this.process.stderr?.on("data", () => {});
			this.process.stdout?.on("data", () => {});
		}

		const header = this.config.get("validMessageHeader");
		stream.on("data", (v) => {
			const strs = v.toString().split("\n");
			for (const s of strs) {
				if (!s.startsWith(header)) {
					continue;
				}
				const newV = s.substring(header.length, s.length);
				this.onData(new Uint8Array(Buffer.from(newV)));
			}
		});
		stream.on("close", () => {
			setTimeout(() => {
				var code = this.process?.exitCode;
				var str = Strings.Info;
				if (code !== 0) {
					str = Strings.Warn;
				}
				log(
					`${str}: ${cmd} ${args.join(" ")} ended with exit code ${this.process?.exitCode}`,
				);
				this.process = null;
				if (this.restart) {
					this.restart = false;
					this.start();
				}
			}, 10);
		});
		return true;
	}

	recover() {
		return true;
	}
}
