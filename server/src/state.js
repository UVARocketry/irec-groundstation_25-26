import { broadcastState } from "./index.js";
import { AddedData } from "../../common/AddedData.js";

/* @type {LogItem} */
var startingState = null;
/* @type {LogItem} */
var currentState = {};
var launchTime = 0;

var addedData = new AddedData();

/** @type {string} */
var currentEvent = "offline";

/** @return {string} */
export function getEvent() {
    return currentEvent;
}

/**
 * @template {keyof AddedData} K
 * @param {K} k
 * @param {AddedData[K]} v
 */
export function setAdd(k, v) {
    addedData[k] = v;
}

/**
 * @param e {string}
 */
export function setEvent(e) {
    currentEvent = e;
}

/** @return {Object} */
export function getState() {
    for (const k in addedData) {
        currentState[k] = addedData[k];
    }
    currentState.startState = startingState;
    // currentState.rocketConnected = rocketConnected;
    // currentState.readerConnected = readerConnected;
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
    if (v !== addedData.readerConnected) {
        setAdd("readerConnected", v);
        broadcastState();
    }
}

/**
 * @param {boolean} v
 */
export function setRocketConnected(v) {
    if (v !== addedData.rocketConnected) {
        setAdd("rocketConnected", v);
        broadcastState();
    }
}

export function launchNow() {
    if (startingState !== null) {
        launchTime = startingState.i_timestamp;
    }
}
