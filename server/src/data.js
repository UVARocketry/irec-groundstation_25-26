import { Message, MessageType } from "./message.js";

import { Strings } from "./ansi.js";
import { setEvent, setState } from "./state.js";
/** @type {string[]} */
var schema = [];
var fieldSize = 0;
/**
 * @param payload {string}
 */
function parseSchema(payload) {
    // fieldSize = payload.charCodeAt(0);

    schema = payload.split(",").filter((v) => v.length !== 0);

    console.log(Strings.Ok + ": RECEIVED SCHEMA: " + schema.join(", "));
}

/**
 * @param payload {string}
 */
function parseMetadata(payload) {
    var mtype = payload.charCodeAt(0);
    if (mtype === 0) {
        fieldSize = payload.charCodeAt(1);
        // console.log(payload.charCodeAt(1));
        // console.log(payload.charCodeAt(2));
        // console.log(payload.charCodeAt(3));
        // console.log(payload.charCodeAt(4));
        if (fieldSize !== 4 && fieldSize !== 8) {
            console.log(
                Strings.Error +
                    ": INVALID sizeof(FLOAT): " +
                    fieldSize +
                    ". Defaulting to 4",
            );
            fieldSize = 4;
        } else {
            console.log(Strings.Ok + ": sizeof(FLOAT): " + fieldSize);
        }
    } else {
        console.log(Strings.Warn + ": UNKNOWN METADATA TYPE " + mtype);
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
    setState(obj);
    JSON.stringify(obj);
}
/**
 * @param msg {Message}
 * @return {"state"|"event"|""}
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
        setEvent("waiting");
        return "event";
    } else if (msg.type === MessageType.Metadata) {
        parseMetadata(str);
        return "";
    } else if (msg.type === MessageType.DataUpdate) {
        parseData(msg.data);
        return "state";
    } else if (msg.type === MessageType.Event) {
        console.error(`${Strings.Error}: Currently cant handle event updates`);
        return "event";
    }
    return "";
}
