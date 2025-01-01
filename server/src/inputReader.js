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
