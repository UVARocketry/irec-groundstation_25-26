/**
 * @typedef {"event"|"state"|"command"|"setConfiguration"|"configuration"|"message"} EventType
 */

/** @import { LogItem } from "./LogItem" */

export class ServerMessage {
	/** @type EventType */
	type = "event";

	/** @type (string|LogItem|RocketMessage|any) */
	data = "";

	/**
	 * @param {EventType} type
	 * @param {string|LogItem|RocketMessage} data
	 */
	constructor(type, data) {
		this.type = type;
		this.data = data;
	}
}

export class RocketMessage {
	/** @type string */
	type = "";
	device = "";
	subject = "";
	verb = "";
	time = 0;
	left = 0;
}
