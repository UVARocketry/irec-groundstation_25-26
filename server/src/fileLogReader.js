import fs from "node:fs";
import { InputReader } from "./inputReader.js";
import { broadcastEvent } from "./index.js";
import { clearConnected, setEvent } from "./state.js";
import { sysTime } from "./data.js";
/** @import { RenameResponse } from "common/ServerMessage.js"; */

export class FileLogReader extends InputReader {
    i = 0;
    readFirst = false;
    path = "../out";
    cancel = false;
    currentTime = 0;
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
            if (fs.existsSync(`../${f}/msg-0`)) {
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
        this.signalActive();
        let path = this.path + "/msg-" + this.i;
        if (!fs.existsSync(path)) {
            setEvent("done");
            broadcastEvent();
            this.signalDone();
            return;
        }
        const file = await fs.openAsBlob(path);

        const buf = new Uint8Array(await file.arrayBuffer());

        this.i++;
        this.onUpdate(buf);
        const delta = sysTime - this.currentTime;
        // log(`${Strings.Info}: Waiting for ${delta}ms`);
        setTimeout(() => {
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
