import { broadcastState } from "./index.js";

/* @type {LogItem} */
var startingState = null;
/* @type {LogItem} */
var currentState = {};
var readerConnected = false;
var rocketConnected = false;
var launchTime = 0;

/** @type {string} */
var currentEvent = "offline";

/** @return {string} */
export function getEvent() {
    return currentEvent;
}

/**
 * @param e {string}
 */
export function setEvent(e) {
    currentEvent = e;
}

/** @return {Object} */
export function getState() {
    currentState.startState = startingState;
    currentState.rocketConnected = rocketConnected;
    currentState.readerConnected = readerConnected;
    currentState.timeSinceLaunch = currentState.i_timestamp - launchTime;
    return currentState;
}

/**
 * @param s {Object} */
export function setState(s) {
    currentState = s;
    if (startingState == null) {
        startingState = { ...s };
    }
}

export function clearStartingState() {
    startingState = null;
}

/**
 * @param {boolean} v
 */
export function setReaderConnected(v) {
    if (v !== readerConnected) {
        readerConnected = v;
        broadcastState();
    }
}

/**
 * @param {boolean} v
 */
export function setRocketConnected(v) {
    if (v !== rocketConnected) {
        rocketConnected = v;
        broadcastState();
    }
}

export function launchNow() {
    if (startingState !== null) {
        launchTime = startingState.i_timestamp;
    }
}
