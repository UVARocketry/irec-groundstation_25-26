import { Message, MessageType } from "./message.js";

import { Strings } from "./ansi.js";
/** @type {string[]} */
var schema = [];
var fieldSize = 0;
/**
 * @param payload {string}
 */
function parseSchema(payload) {
    fieldSize = payload.charCodeAt(0);

    schema = payload.slice(1, -1).split(",");

    console.log(Strings.Ok + ": RECEIVED SCHEMA: " + schema.join(", "));
    if (fieldSize !== 4 && fieldSize !== 8) {
        console.log(Strings.Error + ": INVALID sizeof(FLOAT): " + fieldSize);
    } else {
        console.log(Strings.Ok + ": sizeof(FLOAT): " + fieldSize);
    }
}

/**
 * @param float {number}
 * @return {number}
 */
function floatToInt32(float) {
    const buffer = new ArrayBuffer(4); // Create a 4-byte buffer
    const dataView = new DataView(buffer); // Create a DataView to manipulate the buffer
    dataView.setFloat32(0, float); // Set the float into the buffer
    return dataView.getInt32(0); // Read the buffer as an Int32
}
/**
 * @param payload {Uint8Array}
 * @return {string}
 */
function parseData(payload) {
    /** @type{Float32Array|Float64Array} */
    let array;
    if (fieldSize === 4) {
        array = new Float32Array(payload.buffer);
    } else {
        array = new Float64Array(payload.buffer);
    }

    if (array.length !== schema.length) {
        console.log(
            `${Strings.Warn}: Expected a float ${fieldSize * 8} array of ${schema.length} elements, but got ${array.length}. Ignoring this data point`,
        );
        return "";
    }

    var obj = {};
    for (var i = 0; i < array.length; i++) {
        obj[schema[i]] = array[i];
        if (schema[i].startsWith("i_")) {
            obj[schema[i]] = floatToInt32(array[i]);
        }
    }
    return JSON.stringify(obj);
}
/**
 * @param msg {Message}
 * @return {string}
 */
export function parseMessage(msg) {
    if (msg.version !== 0) {
        console.error(
            `${Strings.Error}: received a message that does not have currect version number (0) (got version ${msg.version}). Packet parse skipped`,
        );
        return "";
    }
    if (!msg.valid) {
        console.error(
            `${Strings.Error}: Received invalid packet. Packet parse skipped`,
        );
        return "";
    }
    var str = new TextDecoder().decode(msg.data);
    if (msg.type === MessageType.Schema) {
        parseSchema(str);
    } else if (msg.type === MessageType.DataUpdate) {
        return parseData(msg.data);
    }
    return "";
}
