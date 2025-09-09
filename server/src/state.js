// this file holds all the state that gets sent in to the groundstation ui
import { broadcastState, getConfigField } from "./index.js";
import { AddedData } from "../../common/AddedData.js";
import { LogItem } from "../../common/LogItem.js";
import { Configuration } from "./configuration.js";

import mgr from "./readerManager.js";

export class Config {
	/** @type {LogItem?} */
	startingState = null;

	/** @type {LogItem} */
	currentState = new LogItem();

	/** @type {number} */
	launchTime = 0;

	/** @type {Configuration<AddedData>} */
	addedData = new Configuration(new AddedData());

	/** @type {string} */
	currentEvent = "offline";
}

/** @typedef {Configuration<Config>} StateConfig */

/** @return {StateConfig} */
function config() {
	return getConfigField("state");
}

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
	return config().get("currentEvent");
}

// Resets this module's state variables
function resetInternalState() {
	clearStartingState();
	clearConnected();
	config().setField("currentState", new LogItem());
	// currentState = new LogItem();
	config().setField("currentState", new LogItem());
}

/** @return {StateConfig} */
function getConfig() {
	return config();
}

// Sets the connection status of an on-rocket device (eg accelerometer)
/**
 * @param item {string}
 * @param c {boolean}
 */
function setConnected(item, c) {
	var i = 0;
	var connected = config().get("addedData").get("connected");
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
	config().get("addedData").setField("connected", []);
}

/**
 * @template {keyof AddedData} K
 * @param {K} k
 * @param {AddedData[K]} v
 */
function setAdd(k, v) {
	if (config().get("addedData").get(k) !== v) {
		config().get("addedData").setField(k, v);
		broadcastState();
	}
}

/**
 * @param e {string}
 */
function setEvent(e) {
	config().setField("currentEvent", e);
	// currentEvent = e;
	if (e == "MotorBurn") {
		launchNow();
	}
}

/** @return {Object} */
function getState() {
	/** @type {LogItem} */
	var ret = config().get("currentState");
	for (const k in config().get("addedData").convertToObject()) {
		// @ts-ignore
		ret[k] = config().get("addedData").get(k);
	}
	ret.startState = config().get("startingState");
	ret.readerName = mgr.getCurrentReaderType();
	// currentState.rocketConnected = rocketConnected;
	// currentState.readerConnected = readerConnected;
	ret.timeSinceLaunch = ret.i_timestamp - config().get("launchTime");
	return ret;
}

/**
 * @param s {Object} */
function setState(s) {
	config().setField("currentState", s);
	if (config().get("startingState") == null) {
		config().setField("startingState", { ...s });
		// startingState = { ...s };
	}
}

function clearStartingState() {
	config().setField("startingState", null);
	// startingState = null;
}

/**
 * @param {boolean} v
 */
function setReaderConnected(v) {
	if (v !== config().get("addedData").get("readerConnected")) {
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
	if (v !== config().get("addedData").get("rocketConnected")) {
		setAdd("rocketConnected", v);
		broadcastState();
	}
}

function launchNow() {
	// if (startingState !== null) {
	config().setField(
		"launchTime",
		config().get("currentState").i_timestamp ?? 0,
	);
	// }
}

export default {
	Config,
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
