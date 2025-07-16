// this file holds all the state that gets sent in to the groundstation ui
import { broadcastState, getReader } from "./index.js";
import { AddedData } from "../../common/AddedData.js";
import { LogItem } from "../../common/LogItem.js";

// the first state gotten from the reader
// (there for the purposes of determining stuff like travel distance)
/* @type {LogItem} */
var startingState = null;

// the current rocket state
/* @type {object} */
var currentState = new LogItem();

// the rocket timestamp that the launch happened at
var launchTime = 0;

// extra data added by the server to provide info about the rocket
var addedData = new AddedData();

// the current rocket state machine state
/** @type {string} */
var currentEvent = "offline";

// a timer. if it finishes before we get a rocket message then the rocket
// is deemed "disconnected". gets restarted when we get a message to not mistakenly
// set the rocket as "disconnected" when it isnt
/** @type {NodeJS.Timeout?} */
var connectionTimeout = null;

// Returns the current state machine state of the rocket
/** @return {string} */
export function getEvent() {
	return currentEvent;
}

// Resets this module's state variables
export function resetInternalState() {
	clearStartingState();
	clearConnected();
	currentState = new LogItem();
}

// Sets the connection status of an on-rocket device (eg accelerometer)
/**
 * @param item {string}
 * @param c {boolean}
 */
export function setConnected(item, c) {
	var i = 0;
	for (; i < addedData.connected.length; i++) {
		if (addedData.connected[i][0] === item) {
			addedData.connected[i][1] = c;
			break;
		}
	}
	// if this device has not been encountered before, add it to our connection list
	if (i === addedData.connected.length) {
		addedData.connected.push([item, c]);
	}
	// we need to update the ui's about our new state
	broadcastState();
}

// clears the devices connected (for when changing the reader)
export function clearConnected() {
	addedData.connected = [];
}

/**
 * @template {keyof AddedData} K
 * @param {K} k
 * @param {AddedData[K]} v
 */
export function setAdd(k, v) {
	if (addedData[k] !== v) {
		addedData[k] = v;
		broadcastState();
	}
}

/**
 * @param e {string}
 */
export function setEvent(e) {
	currentEvent = e;
	if (e == "MotorBurn") {
		launchNow();
	}
}

/** @return {Object} */
export function getState() {
	for (const k in addedData) {
		currentState[k] = addedData[k];
	}
	currentState.startState = startingState;
	currentState.readerName = getReader().getName();
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

export function launchNow() {
	// if (startingState !== null) {
	launchTime = currentState.i_timestamp ?? startingState?.i_timestamp ?? 0;
	// }
}
