var logFile = "log";
import fs from "node:fs";
import { Strings } from "./ansi.js";
var appendQueue = [];
var appendDone = true;
/**
 * @param {string} status
 * @param {string} [msg]
 */
export function log(status, msg) {
    let full = status + ": " + msg;
    if (msg === undefined) {
        full = status;
    }
    console.log(full);
    appendToQueue(full + "\n");
}

/**
 * @param {string} msg
 */
function appendToQueue(msg) {
    const date = new Date().toISOString().slice(0, 19).replace("T", " ");
    msg = date + " " + msg;
    for (const k in Strings) {
        msg = msg.replaceAll(Strings[k], k);
    }
    appendQueue.push(msg);
    flushQueue();
}

function flushQueue() {
    if (!appendDone) {
        return;
    }
    appendDone = false;
    fs.appendFile(logFile, appendQueue[0], () => {
        appendQueue.shift();
        if (appendQueue.length > 0) {
            flushQueue();
        } else {
            appendDone = true;
        }
    });
}

/**
 * @param {string} str
 */
export function setLogFile(str) {
    logFile = str;
}

export function getLogFile() {
    return logFile;
}
