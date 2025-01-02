import fs from "node:fs";
import { InputReader } from "./inputReader.js";
import { broadcastEvent } from "./index.js";
import { setEvent } from "./state.js";

export class FileLogReader extends InputReader {
    i = 0;
    readFirst = false;
    path = "../out";
    cancel = false;
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
    }
    start() {
        if (!this.readFirst) {
            this.readFirst = true;
            this.wake();
            setTimeout(() => this.readMessage(), 1000);
        }
    }
    async readMessage() {
        if (this.cancel) {
            this.cancel = false;
            this.done();
            return;
        }
        this.active();
        let path = this.path + "/msg-" + this.i;
        if (!fs.existsSync(path)) {
            setEvent("done");
            broadcastEvent();
            this.done();
            return;
        }
        const file = await fs.openAsBlob(path);

        const buf = new Uint8Array(await file.arrayBuffer());

        this.i++;
        this.onUpdate(buf);
        setTimeout(() => this.readMessage(), 10);
    }
    async reset() {
        this.i = 0;
        this.wake();
        this.readMessage();
    }
}
