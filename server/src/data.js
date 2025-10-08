// This file exports a function (parseMessage) that takes in a `Message` parameter and parses out the payload to set global variables
import { Message, MessageType } from "./message.js";

import { Strings } from "./ansi.js";
import state from "./state.js";
import { log } from "./log.js";
import { ServerMessage } from "../../common/ServerMessage.js";
import { broadcast, broadcastState, getConfigField } from "./index.js";
import { Configuration } from "./configuration.js";

/** @import { EventType, RocketMessage } from '../../common/ServerMessage.js' */

export class Config {
	/** @type {number} */
	fieldSize = 4;

	/** @type {number} */
	sysTime = 0;

	/** @type {string[]} */
	schema = [];

	/** @type {string[]} */
	events = [];
}

/** @return {Configuration<Config>} */
function getConfig() {
	return getConfigField("data");
}

// config.setRoot("idk2.json");

export function getSysTime() {
	return getConfig().get("sysTime");
}

export function clearSysTime() {
	getConfig().setField("sysTime", 0);
	// sysTime = 0;
}

/**
 * @param msg {Message}
 * @return {EventType|""} What kind of data was sent
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
		state.setEvent("waiting");
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

	const event = getConfig().get("events")[eventIndex] ?? "NO";
	if (event === "NO") {
		log(`${Strings.Warn}: Received invalid event index ${eventIndex}`);
		return;
	}
	state.setEvent(event);
	var sysTime = getConfig().get("sysTime");
	getConfig().setField("sysTime", Math.max(timestamp, sysTime));
}
/**
 * @param payload {string}
 */
function parseSchema(payload) {
	getConfig().setField(
		"schema",
		payload.split(",").filter((v) => v.length !== 0),
	);

	log(
		Strings.Ok +
			": RECEIVED SCHEMA: " +
			getConfig().get("schema").join(", "),
	);
}
/**
 * @param payload {string}
 */
function parseMsg(payload) {
	/** @type {RocketMessage} */
	var message = JSON.parse(payload);
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
	var sysTime = getConfig().get("sysTime");
	getConfig().setField("sysTime", Math.max(message.time, sysTime));
	const serverMsg = new ServerMessage("message", message);
	broadcast(serverMsg);
}
/**
 * @param payload {string}
 */
function parseEventSchema(payload) {
	getConfig().setField(
		"events",
		payload.split(",").filter((v) => v.length !== 0),
	);

	var events = getConfig().get("events");
	log(Strings.Ok + ": RECEIVED EVENT SCHEMA: " + events.join(", "));
}

/**
 * @param payload {string}
 */
function parseMetadata(payload) {
	var mtype = payload.charCodeAt(0);
	if (mtype === 0) {
		var fieldSize = payload.charCodeAt(1);
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
		getConfig().setField("fieldSize", fieldSize);
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
	var fieldSize = getConfig().get("fieldSize");
	if (fieldSize === 4) {
		array = new Float32Array(payload.buffer);
	} else {
		array = new Float64Array(payload.buffer);
	}

	var schema = getConfig().get("schema");
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
	var sysTime = getConfig().get("sysTime");
	getConfig().setField("sysTime", Math.max(obj.i_timestamp, sysTime));
	state.setState(obj);
	JSON.stringify(obj);
}

export default {
	Config,
	getSysTime,
	clearSysTime,
	parseMessage,
};
