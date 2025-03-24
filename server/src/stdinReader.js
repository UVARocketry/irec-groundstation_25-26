import { ChildProcess, spawn } from "node:child_process";
/** @import { RenameResponse } from "common/ServerMessage.js"; */
import { InputReader } from "./inputReader.js";
import { Strings } from "./ansi.js";
import fs from "node:fs";
import { clearConnected, setRocketConnected } from "./state.js";
import { log } from "./log.js";

export class StdinReader extends InputReader {
    /** @type {"stdout"|"stderr"} */
    watchStream = "stdout";
    cmd = "pio";
    args = ["device", "monitor"];
    /** @type {string|URL|undefined} */
    cwd = undefined;
    /** @type {ChildProcess?} */
    process = null;

    /**@type {string?} */
    saveFolder = null;

    /**@type {() => string? } */
    genSaveFolder = () => null;

    msgI = 0;

    restart = false;
    lastMessageTime = 0;

    /** @type {NodeJS.Timeout?}*/
    lastTimeout = null;

    renamed = false;

    /**
     * @param {(_: Uint8Array) => Promise<void>} update
     * @param {"stdout" | "stderr"} watchStream
     * @param {string} cmd
     * @param {string[]} args
     * @param {string | URL | undefined} cwd
     * @param {() => string ?} genSaveFolder
     */
    constructor(update, watchStream, cmd, args, cwd, genSaveFolder) {
        super(update);
        this.genSaveFolder = genSaveFolder;
        this.watchStream = watchStream;
        this.cmd = cmd;
        this.args = args;
        this.cwd = cwd;
    }
    reset() {
        if (this.process !== null) {
            this.restart = true;
            this.process.kill(9);
        } else {
            this.start();
        }
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
        if (this.process !== null) {
            log(`${Strings.Warn}: Stdin process already exists!`);
            this.restart = true;
            this.process.kill(9);
            return;
        }
        this.signalWake();
        this.process = spawn(this.cmd, this.args, {
            cwd: this.cwd,
            env: {
                GPG_TTY: "/dev/pts/6",
            },
        });
        this.msgI = 0;
        if (!this.renamed) {
            this.saveFolder = this.genSaveFolder();
            this.renamed = false;
        }
        this.saveFolder = this.saveFolder ?? process.cwd() + "/out";
        await this.createSaveFolder(this.saveFolder);
        if (this.process === null) {
            log(
                `${Strings.Error}: Failed to spawn child process: ${this.cmd} ${this.args.join(" ")}`,
            );
            return;
        }
        var stream = this.process[this.watchStream];
        if (stream === null) {
            log(
                `${Strings.Error}: error in starting read process: stream ${this.watchStream} does not exist`,
            );
            return;
        }
        stream.on("data", (v) => {
            /** @type {string[]} */
            const strs = v.toString().split("\n");
            for (const s of strs) {
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
                if (this.lastTimeout !== null) {
                    clearTimeout(this.lastTimeout);
                } else {
                    setRocketConnected(true);
                }

                this.lastTimeout = setTimeout(() => {
                    this.lastTimeout = null;
                    setRocketConnected(false);
                }, 300);
            }
            // log(v.toString());
        });
        stream.on("close", () => {
            this.signalDone();
            setTimeout(() => {
                var code = this.process?.exitCode;
                var str = Strings.Info;
                if (code !== 0) {
                    str = Strings.Warn;
                }
                log(
                    `${str}: ${this.cmd} ${this.args.join(" ")} ended with exit code ${this.process?.exitCode}`,
                );
                this.process = null;
                if (this.restart) {
                    this.restart = false;
                    this.start();
                }
            }, 10);
        });
        log(
            `${Strings.Ok}: Started process ${this.cmd} ${this.args.join(" ")}`,
        );
    }
    stop() {
        this.process?.kill();
    }
}
