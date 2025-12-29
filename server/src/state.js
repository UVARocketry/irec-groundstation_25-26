// this file holds all the state that gets sent in to the groundstation ui
import { broadcastState } from "./index.js";
import { AddedData } from "../../common/AddedData.js";
import { LogItem } from "../../common/LogItem.js";

import mgr from "./readerManager.js";

// export class Config {
/** @type {LogItem?} */
var startingState = null;

/** @type {LogItem} */
var currentState = new LogItem();

/** @type {number} */
var launchTime = 0;

var addedData = new AddedData();

/** @type {string} */
var currentEvent = "offline";
// }

// /** @typedef {Configuration<Config>} StateConfig */
//
// /** @return {StateConfig} */
// function config() {
// 	return getConfigField("state");
// }

// config.setRoot("idk.json");

// config.setField("startingState", null);
// config.setField("currentState", new LogItem());
// config.setField("launchTime", 0);
// config.setField("addedData", new Configuration(new AddedData()));
// config.setField("currentEvent", "offline");

// a timer. if it finishes before we get a rocket message then the rocket
// is deemed "disconnected". gets restarted when we get a message to not mistakenly
// set the rocket as "disconnected" when it isnt
/** @type {NodeJS.Timeout?} */
var connectionTimeout = null;

// Returns the current state machine state of the rocket
/** @return {string} */
function getEvent() {
	return currentEvent;
}

// Resets this module's state variables
function resetInternalState() {
	clearStartingState();
	clearConnected();
	currentState = new LogItem();
	// currentState = new LogItem();
	currentState = new LogItem();
}

// Sets the connection status of an on-rocket device (eg accelerometer)
/**
 * @param item {string}
 * @param c {boolean}
 */
function setConnected(item, c) {
	var i = 0;
	var connected = addedData.connected;
	for (; i < connected.length; i++) {
		if (connected[i][0] === item) {
			connected[i][1] = c;
			break;
		}
	}
	// if this device has not been encountered before, add it to our connection list
	if (i === connected.length) {
		connected.push([item, c]);
	}
	// we need to update the ui's about our new state
	broadcastState();
}

// clears the devices connected (for when changing the reader)
function clearConnected() {
	addedData.connected = [];
}

/**
 * @template {keyof AddedData} K
 * @param {K} k
 * @param {AddedData[K]} v
 */
function setAdd(k, v) {
	if (addedData[k] !== v) {
		addedData[k] = v;
		broadcastState();
	}
}

/**
 * @param e {string}
 */
function setEvent(e) {
	currentEvent = e;
	// currentEvent = e;
	if (e == "MotorBurn") {
		launchNow();
	}
}

/** @return {Object} */
function getState() {
	/** @type {LogItem} */
	var ret = currentState;
	for (const k in addedData) {
		// @ts-ignore
		ret[k] = addedData[k];
	}
	ret.startState = startingState;
	ret.readerName = mgr.getCurrentReaderType();
	// currentState.rocketConnected = rocketConnected;
	// currentState.readerConnected = readerConnected;
	ret.timeSinceLaunch = ret.timestamp_ms - launchTime;
	if (ret.timeSinceLaunch < 0) {
		ret.timeSinceLaunch = 0;
	}
	return ret;
}

/**
 * @param s {Object} */
function setState(s) {
	currentState = s;
	if (startingState == null) {
		startingState = { ...s };
		// startingState = { ...s };
	}
}

function clearStartingState() {
	startingState = null;
	// startingState = null;
}

/**
 * @param {boolean} v
 */
function setReaderConnected(v) {
	if (v !== addedData.readerConnected) {
		setAdd("readerConnected", v);
		broadcastState();
	}
}

/**
 * @param {boolean} v
 */
function setRocketConnected(v) {
	if (connectionTimeout !== null && v) {
		clearTimeout(connectionTimeout);
		connectionTimeout = null;
	}
	if (v) {
		connectionTimeout = setTimeout(() => {
			connectionTimeout = null;
			console.log("yo no");
			setRocketConnected(false);
		}, 1000);
	}
	if (v !== addedData.rocketConnected) {
		setAdd("rocketConnected", v);
		broadcastState();
	}
}

function launchNow() {
	// if (startingState !== null) {
	launchTime = currentState.timestamp_ms ?? 0;
	// }
}

export default {
	// Config,
	getEvent,
	resetInternalState,
	setConnected,
	clearConnected,
	setAdd,
	setEvent,
	getState,
	setState,
	clearStartingState,
	setReaderConnected,
	setRocketConnected,
	launchNow,
};
