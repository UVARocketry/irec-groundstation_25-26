// This file exists entirely to parse a Message payload and return an action to be done
import { Message, MessageType } from "./message.js";

import { Strings } from "./ansi.js";
import { setEvent, setState } from "./state.js";
import { log } from "./log.js";
import { ServerMessage } from "../../common/ServerMessage.js";
import { broadcast } from "./index.js";

/** @import { EventType } from '../../common/ServerMessage.js' */

// some data to store
/** @type {string[]} */
var schema = [];
var fieldSize = 0;

/** @type {string[]} */
var events = [];

/**
 * @param msg {Message}
 * @return {EventType|""}
 */
export function parseMessage(msg) {
    if (msg.version !== 0) {
        log(
            `${Strings.Error}: received a message that does not have currect version number (0) (got version ${msg.version}). Packet parse skipped`,
        );
        return "";
    }
    if (!msg.valid) {
        log(`${Strings.Error}: Received invalid packet. Packet parse skipped`);
        return "";
    }
    var str = new TextDecoder().decode(msg.data);
    if (msg.type === MessageType.Schema) {
        parseSchema(str);
        setEvent("waiting");
        return "event";
    } else if (msg.type === MessageType.EventSchema) {
        parseEventSchema(str);
    } else if (msg.type === MessageType.Metadata) {
        parseMetadata(str);
        return "";
    } else if (msg.type === MessageType.DataUpdate) {
        parseData(msg.data);
        return "state";
    } else if (msg.type === MessageType.Event) {
        parseEvent(str);
        return "event";
    } else if (msg.type === MessageType.Message) {
        parseMsg(str);
    } else {
        log(`${Strings.Error}: Unknown message type ${msg.type}`);
    }
    return "";
}
/**
 * @param payload {string}
 */
function parseEvent(payload) {
    const [c4, c3, c2, c1] = [
        payload[0],
        payload[1],
        payload[2],
        payload[3],
    ].map((v) => v.charCodeAt(0) & 0xff);
    const eventIndex = (c1 << 24) | (c2 << 16) | (c3 << 8) | c4;

    const event = events[eventIndex] ?? "NO";
    if (event === "NO") {
        log(`${Strings.Warn}: Received invalid event index ${eventIndex}`);
        return;
    }
    setEvent(event);
}
/**
 * @param payload {string}
 */
function parseSchema(payload) {
    schema = payload.split(",").filter((v) => v.length !== 0);

    log(Strings.Ok + ": RECEIVED SCHEMA: " + schema.join(", "));
}
/**
 * @param payload {string}
 */
function parseMsg(payload) {
    var message = JSON.parse(payload);

    const serverMsg = new ServerMessage("message", message);
    broadcast(serverMsg);
}
/**
 * @param payload {string}
 */
function parseEventSchema(payload) {
    events = payload.split(",").filter((v) => v.length !== 0);

    log(Strings.Ok + ": RECEIVED EVENT SCHEMA: " + events.join(", "));
}

/**
 * @param payload {string}
 */
function parseMetadata(payload) {
    var mtype = payload.charCodeAt(0);
    if (mtype === 0) {
        fieldSize = payload.charCodeAt(1);
        if (fieldSize !== 4 && fieldSize !== 8) {
            log(
                Strings.Error +
                    ": INVALID sizeof(FLOAT): " +
                    fieldSize +
                    ". Defaulting to 4",
            );
            fieldSize = 4;
        } else {
            log(Strings.Ok + ": sizeof(FLOAT): " + fieldSize);
        }
    } else {
        log(Strings.Warn + ": UNKNOWN METADATA TYPE " + mtype);
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
        log(
            `${Strings.Warn}: Expected a float ${fieldSize * 8} array of ${schema.length} elements, but got ${array.length}. Ignoring this data point`,
        );
        return "";
    }

    var obj = {};
    for (var i = 0; i < array.length; i++) {
        obj[schema[i]] = array[i];

        if (schema[i].startsWith("i_")) {
            // i cant believe im actually doing bitwise marshalling in js
            obj[schema[i]] = floatToInt32(array[i]);
        }
    }
    setState(obj);
    JSON.stringify(obj);
}
