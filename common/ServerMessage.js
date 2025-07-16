/**
 * @typedef {"event"|"state"|"command"|"renameResponse"|"rename"|"message"} EventType
 */

/** @import { LogItem } from "./LogItem" */

export class RenameResponse {
	/**
	 * @type {"name"|"choice"}
	 */
	type = "name";
	/**
	 * @type {string[]}
	 */
	data = [];
}

export class ServerMessage {
	/** @type EventType */
	type = "event";

	/** @type (string|LogItem|RenameResponse|RocketMessage) */
	data = "";

	/**
	 * @param {EventType} type
	 * @param {string|LogItem|RenameResponse|RocketMessage} data
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
