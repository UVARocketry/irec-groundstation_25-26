/** @import { RenameResponse } from "common/ServerMessage.js"; */
import { setReaderConnected, setRocketConnected } from "./state.js";

/**
 * @interface
 */
export class InputReader {
    onUpdate = async function (/** @type {Uint8Array} */ _) {};
    /**
     * @param {(_: Uint8Array) => Promise<void>} onUpdate
     */
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
    }
    reset() {}

    start() {}

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

    done() {
        setReaderConnected(false);
        setRocketConnected(false);
    }

    wake() {
        setReaderConnected(true);
    }

    active() {
        setReaderConnected(true);
        setRocketConnected(true);
    }
}
