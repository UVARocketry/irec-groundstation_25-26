/** @import { LogItem } from "../../common/LogItem" */
/** @import { ServerCommandType} from "../../common/serverCommands" */

import { ServerMessage, RocketMessage } from "../../common/ServerMessage.js";
import { port } from "../../common/web.js";
import { altitudeGraph } from "./site.js";

var host = null;

/** @type {WebSocket?} */
var ws = null;

/** @type {LogItem?} */
var currentState = null;
var currentEvent = "disconnected";

export function getWs() {
	return ws;
}

/** @type {RocketMessage[]} */
export var messageQueue = [];
/** @type {RocketMessage[]} */
export var errorQueue = [];

export function getCurrentState() {
	return currentState;
}
export function getCurrentEvent() {
	return currentEvent;
}
/**
 * @param event {MessageEvent}
 */
function onWsMessage(event) {
	/** @type {ServerMessage} */
	var msg = JSON.parse(event.data);
	if (msg.type == "event") {
		// @ts-ignore
		currentEvent = msg.data;
	} else if (msg.type == "state") {
		// @ts-ignore
		currentState = msg.data;
		// } else if (msg.type === "renameResponse") {
		// 	/** @type {RenameResponse} */
		// 	var data = msg.data;
		// 	if (msg.data.type === "choice") {
		// 		var res = prompt("Select name index from " + data.data.join(", "));
		// 		var i = parseInt(res ?? "", 10) ?? -1;
		// 		if (i < 0 || i > data.data.length) {
		// 			alert("bad index " + i);
		// 			return;
		// 		}
		// 		sendWsMessage("rename", data.data[i]);
		// 	} else if (msg.data.type === "name") {
		// 		var res = prompt("Change name: ");
		// 		if (res === null) {
		// 			alert("rename failed bc u not send name");
		// 			return;
		// 		}
		// 		sendWsMessage("rename", res);
		// 	}
	} else if (msg.type === "message") {
		const m = msg.data;
		m.left = 100;
		m.time = Math.floor(m.time / 100) / 10;
		if (m.type == "Error") {
			console.log("yo", m);
			errorQueue.push(m);
		} else {
			messageQueue.push(m);
		}
	}
	// draw();
	// console.log(currentState);
}

export function wsTryConnect() {
	window.setTimeout(function () {
		try {
			if (ws === null || ws.readyState === ws.CLOSED) {
				if (host === null) {
					const val = window.prompt(
						"Please input the websocket host (leave blank if same host as this site)",
					);

					if (val === null || val === "") {
						host = window.location.hostname;
					} else {
						host = val;
					}
				}
				var url = "ws://" + host + ":" + port;
				console.log("Attempting connection to " + url);
				ws = new WebSocket(url);
				ws.onmessage = onWsMessage;
				ws.binaryType = "blob";
				ws.onopen = function () {
					console.log("Connected");
					altitudeGraph.inputData([], [[]]);

					if (ws === null) {
						return;
					}
					ws.onclose = function () {
						console.log("Connection gone");
						currentEvent = "disconnected";
					};
					currentEvent = "connected";
				};
			}
		} catch (_) {
			console.log("Error in ws connection attempt");
			ws = null;
		}
	}, 200);
}

/**
 * @param {import("../../common/ServerMessage.js").EventType} type
 * @param {string | LogItem } data
 */
export function sendWsMessage(type, data) {
	if (ws === null) {
		return;
	}
	var item = new ServerMessage(type, data);
	ws.send(JSON.stringify(item));
}

/** @param {ServerCommandType} cmd */
export function sendWsCommand(cmd) {
	if (ws === null) {
		return;
	}
	if (!ws.OPEN) {
		console.log("Websocket is closed");
		return;
	}
	var logitem = new ServerMessage("command", cmd);
	if (cmd === "restart" || cmd == "switch") {
		altitudeGraph.inputData([], [[]]);
	}
	var str = JSON.stringify(logitem);
	ws.send(str);
}
