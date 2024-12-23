/** @import { LogItem } from "../../common/LogItem" */

import { ServerMessage } from "../../common/ServerMessage.js";
import { altitudeGraph, port } from "./site.js";

/** @type {WebSocket?} */
var ws = null;

/** @type {LogItem?} */
var currentState = null;
var currentEvent = "disconnected";

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
    var msg = JSON.parse(event.data);
    if (msg.type == "event") {
        currentEvent = msg.data;
    } else if (msg.type == "state") {
        currentState = msg.data;
    }
}

export function wsTryConnect() {
    try {
        if (ws === null || ws.readyState === ws.CLOSED) {
            var url = "ws://localhost:" + port;
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
                ws.send("asdf");
                currentEvent = "connected";
            };
        }
    } catch (_) {
        console.log("Error in ws connection attempt");
        ws = null;
    }
}

/** @param {string} cmd */
export function sendWsCommand(cmd) {
    if (ws === null) {
        return;
    }
    var logitem = new ServerMessage("command", cmd);
    ws.send(JSON.stringify(logitem));
}
