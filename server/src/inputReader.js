import fs from "node:fs";
/** @import { RenameResponse } from "common/ServerMessage.js"; */
import { setReaderConnected, setRocketConnected } from "./state.js";

/**
 * @interface
 */
export class InputReader {
    onUpdate = async function (/** @type {Uint8Array} */ _) {};
    itemI = 0;
    /**
     * @param {(_: Uint8Array) => Promise<void>} onUpdate
     */
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
    }
    reset() {}

    async start() {}

    stop() {}

    /** @param {string} name */
    rename(name) {}

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
        var existsProm = new Promise((resolve, _) => {
            fs.exists(saveFolder ?? process.cwd(), (exists) => resolve(exists));
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
