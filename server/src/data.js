// This file exports a function (parseMessage) that takes in a `Message` parameter and parses out the payload to set global variables
import { Message, MessageType } from "./message.js";

import { Strings } from "./ansi.js";
import state from "./state.js";
import { log } from "./log.js";
import { ServerMessage } from "../../common/ServerMessage.js";
import { broadcast, broadcastState } from "./index.js";

/** @import { EventType, RocketMessage } from '../../common/ServerMessage.js' */

var fieldSize = 4;
var sysTime = 0;
/** @type {string[]} */
var schema = [];
/** @type {string[]} */
var events = [];
// export class Config {
// 	/** @type {number} */
// 	fieldSize = 4;
//
// 	/** @type {number} */
// 	sysTime = 0;
//
// 	/** @type {string[]} */
// 	schema = [];
//
// 	/** @type {string[]} */
// 	events = [];
// }

// /** @return {Configuration<Config>} */
// function getConfig() {
// 	return getConfigField("data");
// }

// config.setRoot("idk2.json");

export function getSysTime() {
	return sysTime;
}

export function clearSysTime() {
	// getConfig().setField("sysTime", 0);
	sysTime = 0;
}

/**
 * @param msg {Message}
 * @param cb {(v: string) => Promise<void>}
 * @return {EventType|""} What kind of data was sent
 */
export function parseMessage(msg, cb) {
	if (msg.version !== 0 && msg.version !== 1) {
		log(
			`${Strings.Error}: received a message that does not have currect version number (0 or 1) (got version ${msg.version}). Packet parse skipped`,
		);
		return "";
	}
	if (!msg.valid) {
		log(`${Strings.Error}: Received invalid packet. Packet parse skipped`);
		return "";
	}
	var str = new TextDecoder().decode(msg.data);
	if (msg.type === MessageType.Schema) {
		parseSchema(str, cb);
		state.setEvent("waiting");
		return "event";
	} else if (msg.type === MessageType.EventSchema) {
		parseEventSchema(str, cb);
	} else if (msg.type === MessageType.Metadata) {
		parseMetadata(str, cb);
		return "";
	} else if (msg.type === MessageType.DataUpdate) {
		if (msg.version == 0) {
			parseData_v0(msg.data, cb);
		} else if (msg.version == 1) {
			parseData_v1(msg.data, cb);
		}
		return "state";
	} else if (msg.type === MessageType.Event) {
		parseEvent(str, cb);
		return "event";
	} else if (msg.type === MessageType.Message) {
		parseMsg(str, cb);
	} else {
		log(`${Strings.Error}: Unknown message type ${msg.type}`);
	}
	return "";
}
/**
 * @param payload {string}
 * @param cb {(v: string) => Promise<void>}
 */
function parseEvent(payload, cb) {
	if (payload.length < 8) {
		console.log(
			`${Strings.Warn}: payload is too small in parseEvent (got length ${payload.length})`,
		);
		return;
	}
	const [c4, c3, c2, c1] = [
		payload[0],
		payload[1],
		payload[2],
		payload[3],
	].map((v) => v.charCodeAt(0) & 0xff);
	const eventIndex = (c1 << 24) | (c2 << 16) | (c3 << 8) | c4;
	const [t4, t3, t2, t1] = [
		payload[4],
		payload[5],
		payload[6],
		payload[7],
	].map((v) => v.charCodeAt(0) & 0xff);
	const timestamp = (t1 << 24) | (t2 << 16) | (t3 << 8) | t4;

	const event = events[eventIndex] ?? "NO";
	if (event == "MotorBurn") {
		state.launchNow();
	}
	if (event === "NO") {
		log(`${Strings.Warn}: Received invalid event index ${eventIndex}`);
		return;
	}
	cb(`Received event (index ${eventIndex}) (event name '${event}')`);

	state.setEvent(event);
	sysTime = Math.max(timestamp, sysTime);
}
/**
 * @param payload {string}
 * @param cb {(v: string) => Promise<void>}
 */
function parseSchema(payload, cb) {
	schema = payload.split(",").filter((v) => v.length !== 0);

	log(Strings.Ok + ": RECEIVED SCHEMA: " + schema.join(", "));
	cb(`RECEIVED SCHEMA: ${schema.join(", ")}`);
}
/**
 * @param payload {string}
 * @param cb {(v: string) => Promise<void>}
 */
function parseMsg(payload, cb) {
	/** @type {RocketMessage} */
	var message = JSON.parse(payload.trim());
	var stateSet = false;
	if (message.subject === "Init" || message.subject === "Connection") {
		if (message.verb === "Failed" || message.verb === "Started") {
			stateSet = true;
			state.setConnected(message.device, false);
		} else if (message.verb === "Succeeded") {
			stateSet = true;
			state.setConnected(message.device, true);
		}
	} else if (message.subject === "Deactivation") {
		if (message.verb === "Succeeded") {
			stateSet = true;
			state.setConnected(message.device, false);
		}
	}
	if (stateSet) {
		broadcastState();
	}
	cb(JSON.stringify(message));
	sysTime = Math.max(message.time, sysTime);
	const serverMsg = new ServerMessage("message", message);
	broadcast(serverMsg);
}
/**
 * @param payload {string}
 * @param cb {(v: string) => Promise<void>}
 */
function parseEventSchema(payload, cb) {
	events = payload.split(",").filter((v) => v.length !== 0);

	log(Strings.Ok + ": RECEIVED EVENT SCHEMA: " + events.join(", "));
	cb(`RECEIVED EVENT SCHEMA: ${events.join(", ")}`);
}

/**
 * @param payload {string}
 * @param cb {(v: string) => Promise<void>}
 */
function parseMetadata(payload, cb) {
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
		cb(
			`Received sizeof(FLOAT) ${payload.charAt(1)} (resolves to ${fieldSize})`,
		);
	} else {
		log(Strings.Warn + ": UNKNOWN METADATA TYPE " + mtype);
		cb(`Unknown metadata type ${mtype}`);
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
 * @param fieldName {string}
 * @return {{name: string, type: string, base: number, scale: number}}
 */
function parseFieldEncoding(fieldName) {
	const encodingStart = fieldName.indexOf("__");
	if (encodingStart === -1) {
		// No encoding specified, assume float32 (v0 compatibility)
		return { name: fieldName, type: "f32", base: 0, scale: 1 };
	}

	const baseName = fieldName.substring(0, encodingStart);
	const encoding = fieldName.substring(encodingStart + 2);

	// Parse type: u8, i16, u32, f32, etc.
	const typeMatch = encoding.match(/^(u|i|f)(8|16|32)/);
	if (!typeMatch) {
		throw new Error(`Invalid field encoding: ${fieldName}`);
	}

	const signedness = typeMatch[1];
	const bits = parseInt(typeMatch[2]);
	const type = `${signedness}${bits}`;

	// Parse base offset (_B[value])
	const baseMatch = encoding.match(/_Bn?(\d+(?:_\d+)?)/);
	let base = 0;
	if (baseMatch) {
		base = parseFloat(baseMatch[1].replace("_", "."));
		if (baseMatch[0].includes("_Bn")) {
			base = -base;
		}
	}

	// Parse scale (_S[value])
	const scaleMatch = encoding.match(/_Sn?(\d+(?:_\d+)?)/);
	let scale = 1;
	if (scaleMatch) {
		scale = parseFloat(scaleMatch[1].replace("_", "."));
		if (scaleMatch[0].includes("_Sn")) {
			scale = -scale;
		}
	}

	return { name: baseName, type, base, scale };
}

/**
 * @param dataView {DataView}
 * @param offset {number}
 * @param type {string}
 * @return {number}
 */
function readBinaryValue(dataView, offset, type) {
	switch (type) {
		case "u8":
			return dataView.getUint8(offset);
		case "i8":
			return dataView.getInt8(offset);
		case "u16":
			return dataView.getUint16(offset, true); // little-endian
		case "i16":
			return dataView.getInt16(offset, true);
		case "u32":
			return dataView.getUint32(offset, true);
		case "i32":
			return dataView.getInt32(offset, true);
		case "f32":
			return dataView.getFloat32(offset, true);
		default:
			throw new Error(`Unsupported type: ${type}`);
	}
}

/**
 * @param rawValue {number}
 * @param base {number}
 * @param scale {number}
 * @return {number}
 */
function convertFieldValue(rawValue, base, scale) {
	// Reverse the Zig conversion: scaled = (original - base) * scale
	// Therefore: original = (scaled / scale) + base
	return rawValue / scale + base;
}

/**
 * @param payload {Uint8Array}
 * @param cb {(v: string) => Promise<void>}
 */
function parseData_v1(payload, cb) {
	const dataView = new DataView(payload.buffer);
	const obj = {};
	let currentOffset = 0;
	let hasError = false;

	// console.log(dataView.buffer.byteLength);

	for (const fieldName of schema) {
		if (fieldName.trim() == "") {
			continue;
		}
		try {
			const encoding = parseFieldEncoding(fieldName);
			// console.log(
			// 	`PARSING ${encoding.name} with b ${encoding.base} and o ${encoding.scale} type ${encoding.type} @ ${currentOffset}`,
			// );
			if (encoding.name.trim() == "" || encoding.name.length < 3) {
				continue;
			}
			const rawValue = readBinaryValue(
				dataView,
				currentOffset,
				encoding.type,
			);
			const convertedValue = convertFieldValue(
				rawValue,
				encoding.base,
				encoding.scale,
			);

			obj[encoding.name] = convertedValue;

			// Advance offset by field size in bytes
			const bitsMatch = encoding.type.match(/\d+/);
			if (bitsMatch) {
				currentOffset += parseInt(bitsMatch[0]) / 8;
			} else {
				throw new Error(`Invalid type format: ${encoding.type}`);
			}
		} catch (error) {
			hasError = true;
			log(
				`${Strings.Error}: Failed to parse field ${fieldName} @ offset ${currentOffset}: ${error.message}`,
			);
			// Skip this field - advance by 1 byte as fallback
			currentOffset += 1;
			// break;
		}
	}
	if (hasError) {
		const serverMsg = new ServerMessage("message", {
			type: "Error",
			device: "Data",
			subject: "Decode",
			verb: "Failed",
			time: sysTime,
			left: 0,
		});
		broadcast(serverMsg);
		cb(JSON.stringify(serverMsg));
		return;
	}

	// Update system time and state (same pattern as v0)
	sysTime = Math.max(obj.timestamp_ms || 0, sysTime);
	// log(`${Strings.Info}: Updating system time to ${sysTime}`);
	state.setState(obj);

	if ((obj.stateId ?? -1) !== -1) {
		const event = events[obj.stateId] ?? "NO";
		if (event != "NO") {
			state.setEvent(event);
			cb(
				`Received event (index ${state.stateId}) (event name '${event}')`,
			);
		}
	}
	cb(JSON.stringify(obj));

	return obj;
}
/**
 * @param payload {Uint8Array}
 * @param cb {(v: string) => Promise<void>}
 */
function parseData_v0(payload, cb) {
	/** @type{Float32Array|Float64Array} */
	let array;
	if (fieldSize === 4) {
		log(`${Strings.Info}: Byte length: ${payload.length}`);
		// uint8_t* buffer;
		// float* array = (float*) buffe;
		array = new Float32Array(payload.buffer);
	} else {
		array = new Float64Array(payload.buffer);
	}

	if (array.length !== schema.length) {
		log(
			`${Strings.Warn}: Expected a float ${fieldSize * 8} array of ${schema.length} elements, but got ${array.length}. Ignoring this data point`,
		);
		cb(
			`Expected a float ${fieldSize * 8} array of ${schema.length} elements, but got ${array.length}. Ignoring this data point`,
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
	sysTime = Math.max(obj.i_timestamp, sysTime);
	state.setState(obj);
	cb(JSON.stringify(obj));
	JSON.stringify(obj);
}

export default {
	getSysTime,
	clearSysTime,
	parseMessage,
};
