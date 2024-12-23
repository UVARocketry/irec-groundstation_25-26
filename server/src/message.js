// this file is for parsing a raw binary message into something with a little bit more structure (aka Message)
import { Strings } from "./ansi.js";
/**
 * @readonly
 * @enum {number}
 */
export const MessageType = {
    /// list of comma seperated strings of field names
    Schema: 0,
    /// to be used for metadata if needed
    Metadata: 1,
    /// a struct with the update bits
    DataUpdate: 2,
    /// for sending an event (eg statemachine state change)
    Event: 3,
    Undefined: -1,
};
export class Message {
    /**
     * @type {number}
     */
    version = 0;
    /**
     * @type {boolean}
     */
    valid = false;
    /**
     * @type {MessageType}
     */
    type = MessageType.Undefined;
    /**
     * @type {Uint8Array}
     */
    data = new Uint8Array();

    /**
     * @param {Uint8Array<ArrayBuffer>} msg
     */
    constructor(msg) {
        if (msg.length * 8 < 40) {
            console.error(`${Strings.Error}: Message is too small!`);
            return;
        }
        // get version and type
        this.version = (msg[0] & 0xf0) >> 4;
        this.type = msg[0] & 0x0f;

        // get len
        var len = (msg[1] << 8) + msg[2];
        // -5 because of 5 byte header
        if (msg.length - 5 !== len) {
            console.error(
                `${Strings.Error}: MESSAGE SIZE DOES NOT MATCH: ${len}, ${msg.length - 5}`,
            );
            return;
        }

        // do `0 & 0` to cast it to 32 (or 64) bit integers
        // this is just some js weirdness
        var actualChecksum = [0 & 0, 0 & 0];

        var parity = 0;
        var data = [];
        for (var i = 5; i < msg.length; i++) {
            // &xff to cast it to int (and select bottom 8 bits)
            actualChecksum[parity] ^= msg[i] & 0xff;
            parity++;
            parity %= 2;
            data.push(msg[i]);
        }
        var checksum = [msg[3], msg[4]];
        if (
            actualChecksum[0] !== checksum[0] ||
            actualChecksum[1] !== checksum[1]
        ) {
            console.error(
                `${Strings.Error}: CHECKSUM VALIDATION FAILED: ${checksum}, ${actualChecksum}`,
            );
            return;
        }
        this.valid = true;
        this.data = new Uint8Array(data);
    }
}
