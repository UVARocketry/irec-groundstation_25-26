import { ChildProcess, spawn } from "node:child_process";
import { InputReader } from "./inputReader.js";
import { Strings } from "./ansi.js";
import fs from "node:fs";

export class StdinReader extends InputReader {
    /** @type {"stdout"|"stderr"} */
    watchStream = "stdout";
    cmd = "pio";
    args = ["run"];
    /** @type {string|URL|undefined} */
    cwd = undefined;
    /** @type {ChildProcess?} */
    process = null;

    /**@type {string?} */
    saveFolder = null;

    msgI = 0;

    restart = true;

    /**
     * @param {(_: Uint8Array) => Promise<void>} update
     * @param {"stdout" | "stderr"} watchStream
     * @param {string} cmd
     * @param {string[]} args
     * @param {string | URL | undefined} cwd
     */
    constructor(update, watchStream, cmd, args, cwd) {
        super(update);
        this.watchStream = watchStream;
        this.cmd = cmd;
        this.args = args;
        this.cwd = cwd;
    }
    reset() {
        this.restart = true;
        if (this.process !== null) {
            this.process.kill(9);
        }
    }
    start() {
        if (this.process !== null) {
            console.log(`${Strings.Warn}: Stdin process already exists!`);
            this.restart = true;
            this.process.kill(9);
            return;
        }
        this.process = spawn(this.cmd, this.args, { cwd: this.cwd });
        if (!fs.existsSync(this.saveFolder ?? process.cwd())) {
            fs.mkdir(
                this.saveFolder ?? process.cwd(),
                { recursive: true },
                () => {},
            );
        }
        if (this.process === null) {
            console.log(
                `${Strings.Error}: Failed to spawn child process: ${this.cmd} ${this.args.join(" ")}`,
            );
            return;
        }
        var stream = this.process[this.watchStream];
        if (stream === null) {
            console.log(
                `${Strings.Error}: error in starting read process: stream ${this.watchStream} does not exist`,
            );
            return;
        }
        // @ts-ignore
        this.process.stdout.on("data", (v) => {});
        stream.on("data", (v) => {
            /** @type {string[]} */
            const strs = v.toString().split("\n");
            for (const s of strs) {
                // console.log(`"${s}": ${s.startsWith("ABCD")}`);
                if (!s.startsWith("ABCD")) {
                    continue;
                }
                const newV = s.substring(4, s.length);
                if (this.saveFolder !== null) {
                    fs.writeFile(
                        this.saveFolder + "/msg-" + this.msgI,
                        newV,
                        function () {},
                    );
                    this.msgI++;
                }
                this.onUpdate(new Uint8Array(Buffer.from(newV)));
            }
            // console.log(v.toString());
        });
        stream.on("close", () => {
            setTimeout(() => {
                var code = this.process?.exitCode;
                var str = Strings.Info;
                if (code !== 0) {
                    str = Strings.Warn;
                }
                console.log(
                    `${str}: ${this.cmd} ${this.args.join(" ")} ended with exit code ${this.process?.exitCode}`,
                );
                this.process = null;
                if (this.restart) {
                    this.restart = false;
                    this.start();
                }
            }, 10);
        });
        console.log(
            `${Strings.Ok}: Started process ${this.cmd} ${this.args.join(" ")}`,
        );
    }
    stop() {
        this.process?.kill();
    }
}
