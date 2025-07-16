// this file is for parsing a raw binary messages (from the teensy) into something with a little bit more structure (aka Message)
import { Strings } from "./ansi.js";
import { log } from "./log.js";
/**
 * @readonly
 * @enum {number}
 *  NOTE: This type MUST be kept in sync with the c++ logging system
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
    /// for sending eventSchema
    EventSchema: 4,
    /// For saying that yes, we have received everything
    Acknowledgement: 5,
    /// For receiving messages
    Message: 6,
    Undefined: -1,
};
// NOTE: This type is a typed represenation of the radio protocol. MUST be kept in sync with the actual protocol
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
     * @param {Uint8Array<ArrayBuffer>} msg A 4-bit message string (not a complete binary string)
     */
    constructor(msg) {
        const aCode = "a".charCodeAt(0);

        var newBuf = [];
        // convert msg from half-packed binary to full-packed binary
        // (AKA 4 bits of info per byte to 8 bits)

        for (var i = 0; i < msg.length; i += 2) {
            var left = msg[i];
            var right = msg[i + 1];
            left -= aCode;
            left = left & 0x0f;
            left <<= 4;
            right -= aCode;
            right = right & 0x0f;
            newBuf.push(left + right);
        }
        msg = new Uint8Array(newBuf);
        // check if a msg is at least 5 bytes (required by the protocol)
        // idrk why i put the *8 in here originally
        if (msg.length * 8 < 40) {
            log(`${Strings.Error}: Message is too small!`);
            return;
        }
        // version is first four bits
        this.version = (msg[0] & 0xf0) >> 4;
        // msg type is second four bits
        this.type = msg[0] & 0x0f;

        // get len (second and third bytes)
        var len = (msg[1] << 8) + msg[2];
        // if the message is too big, then chop of the end. 
        // we do this rather than discarding the message 
        // because the end might be a transmission artifact 
        // like a newline or carriage return character. 
        if (msg.length - 5 > len) {
            msg = msg.slice(0, len + 5);
        }
        // -5 because of 5 byte header
        if (msg.length - 5 !== len) {
            log(
                `${Strings.Error}: MESSAGE SIZE DOES NOT MATCH: ${len}, ${msg.length - 5}`,
            );
            // dont discard. I'm not sure why i did this
            // but ig its because there might be a mistake and 
            // we will just discard farther up the line if so

            // return;
        }

        // NOTE: bitwise & in js casts the result to an integer, NOT a float

        // do `0 & 0` to cast it to 32 (or 64 (idrk, doesnt matter)) bit integers
        // this is just some js weirdness
        var actualChecksum = [0 & 0, 0 & 0];

        // whether we are adding to left or right checksum
        var parity = 0;
        // the actual data bytes of the message
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
            log(
                `${Strings.Error}: CHECKSUM VALIDATION FAILED: ${checksum}, ${actualChecksum}`,
            );
            // return;
        }
        // YAY the message is valid
        this.valid = true;
        // YAY we have data
        this.data = new Uint8Array(data);
    }
}
