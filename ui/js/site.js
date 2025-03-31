import { Button } from "./button.js";
import { Dial } from "./dial.js";
import { Graph } from "./graph.js";
/** @import p5 from "p5"; */
import { Quaternion, quatmult, quatnormalize } from "./quaternion.js";
import { limDecimal } from "./utils.js";
import {
	getCurrentState,
	getCurrentEvent,
	wsTryConnect,
	sendWsCommand,
	messageQueue,
	errorQueue,
} from "./websocket.js";

/// converts meters to feet
const mtoft = 3.28084;

// global width and height of canvas
var width, height;
export var light = true;

export var TEXT_COL = "#000000";
export var COL1 = "#ff0000";
export var BG = "#ffffff";

/** @type {p5}*/
var p;

/** @type {Graph} */
export var altitudeGraph;

/** @type {Dial} */
var velocityDial,
	accelerationDial,
	actualDeplDial,
	expectedDeplDial,
	deploymentDiffDial;

/** @type {Button} */
var reqButton, switchButton, renameButton;

export function getP5() {
	return p;
}
export function getHeight() {
	return height;
}

/**
 * @param {string} label
 * @param {number} level
 * @param {number} x
 * @param {number} y
 * @param {number} w1
 * @param {number} h1
 * @param {number} r1
 * @param {number} w2
 * @param {number} h2
 * @param {number} r2
 */
function drawBattery(label, level, x, y, w1, h1, r1, w2, h2, r2) {
	if (level < 0) {
		level = 0;
	}

	p.stroke(0);
	p.strokeWeight(2);
	p.fill(255);
	p.rect(
		(x + w1 - w2 * 0.1) * height,
		(y + h1 / 2 - h2 / 2) * height,
		w2 * height,
		h2 * height,
		r2,
	);
	p.noStroke();
	p.fill(255);
	p.rect(x * height, y * height, w1 * height, h1 * height, r1);
	if (level <= 30) {
		p.fill(255, 0, 0);
	} else if (level <= 60) {
		p.fill(255, 255, 0);
	} else {
		p.fill(0, 255, 0);
	}
	p.rect(
		x * height,
		y * height,
		((w1 * (level + 10)) / 110) * height,
		h1 * height,
		r1,
	);
	p.stroke(0);
	p.noFill();
	p.rect(x * height, y * height, w1 * height, h1 * height, r1);
	p.textAlign(p.CENTER);
	p.noStroke();
	p.fill(0);
	p.textSize(h1 * height * 0.9);
	p.text(level + "%", (x + w1 / 2) * height, (y + h1 * 0.85) * height);
	p.textAlign(p.LEFT);
	p.text(label, x * height - 10, y * height - 5);
	p.noStroke();
}

/**
 * @param {string} label
 * @param {number} level
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function drawSignalStrength(label, level, x, y, w, h) {
	const dw = w / 4;
	// p.noStroke();
	p.strokeWeight(1);
	p.stroke(0);
	const radius = 3;
	const widthMul = 0.81;
	const heightMul = 1 / 4;
	level *= 10;
	// y += h;
	for (var i = 0; i < 4; i++) {
		if (level > i * 25) {
			p.fill("#7dfa82");
		} else {
			p.fill("#a0a0a0");
		}
		p.rect(
			(x + i * dw) * height,
			(y + h) * height,
			dw * height * widthMul,
			-h * height * (i + 1) * heightMul,
			radius,
		);
	}
	// p.rect(
	//     (x + dw) * height,
	//     y * height,
	//     dw * height * widthMul,
	//     -h * height * 2 * heightMul,
	//     radius,
	// );
	// p.rect(
	//     (x + 2 * dw) * height,
	//     y * height,
	//     dw * height * widthMul,
	//     -h * height * 3 * heightMul,
	//     radius,
	// );
	// p.rect(
	//     (x + 3 * dw) * height,
	//     y * height,
	//     dw * height * widthMul,
	//     -h * height * 4 * heightMul,
	//     radius,
	// );
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} sweep
 * @param {number} abSweep
 * @param {number} deplActual
 */
// function deploymentVisual(x, y, w, sweep, abSweep, deplActual) {
//     p.fill("#999999");
//     var startAngle = -p.radians(90 - sweep / 2);
//     var abAngleStart = -p.radians(90 - abSweep / 2);
//     p.rect(
//         (x - (Math.cos(abAngleStart) * w) / 2) * height,
//         ((w / 2) * Math.sin(abAngleStart) + y) * height - deplActual * 30,
//         ((Math.cos(abAngleStart) * w) / 2) * 2 * height,
//         (Math.sin(abAngleStart) * w) / 2 + deplActual * 30,
//     );
//     p.arc(
//         x * height,
//         y * height - deplActual * 30,
//         w * height,
//         w * height,
//         -Math.PI - abAngleStart,
//         abAngleStart,
//     );
//
//     p.fill("#ff8000");
//
//     p.arc(
//         x * height,
//         y * height,
//         w * height,
//         w * height,
//         -Math.PI - startAngle,
//         startAngle,
//     );
//     p.fill("#ffffff");
//     p.rect(
//         (x - w / 2) * height,
//         y * height,
//         w * height,
//         ((Math.sin(startAngle) * w) / 2) * height,
//     );
// }

/**
 * @param {number} x
 * @param {number} y
 * @param {number} size1
 * @param {string[]} names
 * @param {boolean[]} values
 * @param {number?} [size2]
 */
function status(x, y, size1, names, values, size2) {
	p.noStroke();
	p.textAlign(p.LEFT);
	size2 ??= size1;
	p.textSize(size1 * height);
	p.fill(0);
	p.text("System Status: ", x * height, y * height);
	for (var i = 0; i < names.length; i++) {
		p.textSize(size2 * height);
		p.strokeWeight(0.0015 * height);
		p.stroke(0);
		if (values[i]) {
			p.fill(0, 255, 0);
		} else if (values[i] === undefined) {
			p.fill(255, 255, 0);
		} else {
			p.fill(255, 0, 0);
		}
		p.ellipse(
			(x + 0.01) * height,
			(y + i * size2 * 1.3 + size2 - 0.001) * height,
			0.01 * height,
			0.01 * height,
		);
		p.noStroke();
		p.fill(0);
		p.text(
			names[i],
			(x + 0.03) * height,
			(y + i * size2 * 1.3 + size2 * 1.3) * height,
		);
	}
}

/**@type {p5.Image}*/
let logo;

/**
 * @param {string} str1
 * @param {number} size1
 * @param {string} str2
 * @param {number} size2
 * @param {number} x
 * @param {number} y
 */
function centerString(str1, size1, str2, size2, x, y) {
	p.textSize(size1);
	var w1 = p.textWidth(str1);
	p.textSize(size2);
	var w2 = p.textWidth(str2);
	var w = w1 + w2;
	p.textSize(size1);
	p.textAlign(p.LEFT);
	p.text(str1, x - w / 2, y);
	p.textSize(size2);
	p.text(str2, x - w / 2 + w1, y);
}
/**
 * @param {string} str1
 * @param {number} size1
 * @param {string} str2
 * @param {number} size2
 * @param {number} x
 * @param {number} y
 */
function unitString(str1, size1, str2, size2, x, y) {
	p.textSize(size1);
	var w1 = p.textWidth(str1);
	p.textSize(size2);
	p.textSize(size1);
	p.textAlign(p.LEFT);
	p.text(str1, x, y);
	p.textSize(size2);
	p.text(str2, x + w1, y);
}
/**
 * @param {string[]} strs
 * @param {number} size1
 * @param {number} size2
 * @param {number} x
 * @param {number} y
 */
function multiUnitString(strs, size1, size2, x, y) {
	var w = 0;
	for (var i = 0; i < strs.length; i++) {
		if (i % 2 == 0) {
			p.textSize(size1);
		} else {
			p.textSize(size2);
		}
		p.text(strs[i], x + w, y);
		w += p.textWidth(strs[i]);
	}
}

/** @type {p5.Vector[]}*/
var pastPos = [];
var altBelowForReset = -1;
var travelMeterDiv = 1;
function init() {
	pastPos.push(p.createVector(0, 0, 0));
	// setup globals
	p.createCanvas(p.windowWidth, p.windowHeight);
	width = p.windowWidth;
	height = p.windowHeight;
	// $("canvas").contextmenu((e) => {
	//     e.preventDefault();
	// });
	p.angleMode(p.RADIANS);

	// attempt websocket connection
	wsTryConnect();

	p.textSize(0.015 * height);
	var btnText = "restart dbg run";
	reqButton = new Button(
		0.01,
		0.9,
		p.textWidth(btnText) / height + 0.05,
		0.04,
		p.color(0, 0, 0),
		p.color(255, 0, 0),
		p.color(230, 0, 0),
		p.color(200, 0, 0),
		btnText,
		0.005,
		0.02,
		0.015 * height,
	);
	btnText = "rename";
	renameButton = new Button(
		0.01,
		0.85,
		p.textWidth(btnText) / height + 0.05,
		0.04,
		p.color(0, 0, 0),
		p.color(255, 0, 0),
		p.color(230, 0, 0),
		p.color(200, 0, 0),
		btnText,
		0.005,
		0.02,
		0.015 * height,
	);
	btnText = "dbg switch reader";
	switchButton = new Button(
		0.01,
		0.95,
		p.textWidth(btnText) / height + 0.05,
		0.04,
		p.color(0, 0, 0),
		p.color(255, 0, 0),
		p.color(230, 0, 0),
		p.color(200, 0, 0),
		btnText,
		0.005,
		0.02,
		0.015 * height,
	);

	// create altitude graph
	altitudeGraph = new Graph(
		width / height - 0.8,
		0.78,
		0.8,
		0.2,
		p.color(255, 0, 0),
		"Altitude",
		[10300, 0],
		4,
	);
	altitudeGraph.withMaxDatapoints(1000);
	altitudeGraph.withAlternateSeries(1, [p.color(0, 255, 255)]);

	velocityDial = new Dial(
		width / height - 0.8,
		0.45,
		0.2,
		0.2,
		(270 * Math.PI) / 180,
		p.color(255, 0, 0),
		p.color(125, 0, 0),
		[0, 1000],
		"VELOCITY\n(ft\\s)",
		5,
	);
	accelerationDial = new Dial(
		width / height - 0.53,
		0.45,
		0.2,
		0.2,
		(270 * Math.PI) / 180,
		p.color(255, 0, 0),
		p.color(125, 0, 0),
		[0, 10],
		"ACCEL\n(g)",
		5,
	);
	actualDeplDial = new Dial(
		width / height - 0.26,
		0.45,
		0.2,
		0.2,
		(270 * Math.PI) / 180,
		p.color(255, 0, 0),
		p.color(125, 0, 0),
		[0, 100],
		"DEPLOYMENT\n(actual %)",
		5,
	);
	expectedDeplDial = new Dial(
		width / height - 0.26,
		0.18,
		0.2,
		0.2,
		(270 * Math.PI) / 180,
		p.color(255, 0, 0),
		p.color(125, 0, 0),
		[0, 100],
		"DEPLOYMENT\n(expected %)",
		5,
	);
	deploymentDiffDial = new Dial(
		width / height - 0.53,
		0.18,
		0.2,
		0.2,
		(270 * Math.PI) / 180,
		p.color(255, 0, 0),
		p.color(125, 0, 0),
		[-100, 100],
		"DEPLOYMENT ERR\n(%)",
		5,
	);
	document.fonts.ready.then(() => {
		if (document.fonts.check("16px TX-02-Trial")) {
			p.textFont("TX-02-Trial");
		} else {
			p.textFont("monospace");
		}
	});
	logo = p.loadImage("assets/logo.webp");
}

function draw() {
	// light mode/dark mode bg
	if (light) {
		// p.background(255);
		p.fill(255);
		p.noStroke();
		p.clear();
		const vidHeight = 0.55;
		const vidWidth = (height * vidHeight * 4) / 3;
		const vidLeft = 0.15;
		const vidBottom = 0.35;
		p.rect(0, 0, vidLeft * width, height);
		p.rect(0, 0, width, (1 - vidBottom - vidHeight) * height);
		p.rect(0, height, width, -vidBottom * height);
		p.rect(vidLeft * width + vidWidth, 0, width, height);
	} else {
		p.fill(255);
		p.background(0);
		TEXT_COL = "#ffffff";
		BG = "#000000";
	}

	// tell everyone our current event
	p.textSize(0.04 * height);
	var ce = getCurrentEvent();
	p.fill(TEXT_COL);
	p.text("Event: " + ce, 0.01 * height, 0.05 * height);

	// parse data packets
	// aka state unpacking
	var state = getCurrentState();
	var ap = 0;
	var expAp = 0;
	var alt = 0;
	var vel = p.createVector(0, 0, 0);
	var acc = p.createVector(0, 0, 0);
	const deplActual = state?.actualDeployment ?? 0;
	const deplExp = state?.pidDeployment ?? 0;
	const uptime = state?.i_timestamp ?? 0;
	const airTime = state?.timeSinceLaunch ?? 0;
	var pos = p
		.createVector(state?.vnPosX ?? 0, state?.vnPosY ?? 0, state?.vnPosZ ?? 0)
		.mult(mtoft);
	const vnGps = p.createVector(state?.vnGpsX ?? 0, state?.vnGpsY ?? 0, 0);
	const readerActive = state?.readerConnected ?? false;
	const rocketActive = state?.rocketConnected ?? false;
	const environment = state?.readerType ?? "NONE";
	const connected = state?.connected ?? [];
	const mainBat = state?.mainBat ?? 0;
	const servoBat = state?.servoBat ?? 0;
	// var vnGps = p.createVector(0, 0, 0);
	const rssi = state?.rssi ?? 0;

	if (
		state !== null &&
		state.startState !== null &&
		state.startState !== undefined
	) {
		ap = state.apogee - state.startState.vnPosZ;
		ap *= mtoft;

		expAp = state.predictedApogee - state.startState.vnPosZ;
		expAp *= mtoft;

		alt = state.vnPosZ - state.startState.vnPosZ;
		alt *= mtoft;

		altitudeGraph.addDatapoint(ap, [expAp]);
		acc = p.createVector(
			state.vnAccX / 9.8,
			state.vnAccY / 9.8,
			state.vnAccZ / 9.8,
		);
		vel = p.createVector(
			state.vnVelX * mtoft,
			state.vnVelY * mtoft,
			state.vnVelZ * mtoft,
		);
	}

	if (alt < altBelowForReset) {
		altBelowForReset = -1;
	}

	// rocket rotation thingy
	{
		p.strokeWeight(1);
		p.stroke(0);
		// p.line(0.8 * height, 0.7 * height, 0.9 * height, 0.7 * height);
		p.noFill();
		var angle = 0;
		if (state != null) {
			/** @type {Quaternion} */
			var quat = {
				w: state.orientationW,
				x: state.orientationX,
				y: state.orientationY,
				z: state.orientationZ,
			};
			quatnormalize(quat);
			/** @type {Quaternion} */
			var dir = {
				w: 0,
				x: 0,
				y: 0,
				z: 1,
			};

			const quatPrime = {
				w: quat.w,
				x: -quat.x,
				y: -quat.y,
				z: -quat.z,
			};

			const newquat = quatmult(quatmult(quat, dir), quatPrime);

			// the y of the triangle
			var z = -newquat.z;
			var x = newquat.x;
			angle = Math.acos(z);
		}

		p.push();
		var x = 0.7;
		var yTip = 0.7;

		var hBody = 0.07;
		var wBody = 0.013;
		var wb2 = wBody / 2;
		var hb2 = hBody / 2;
		p.translate(x * height, (yTip + hBody / 2) * height);
		p.rotate(angle);

		var cp1y = 0.02;

		var slope = 3;

		var finW = wBody / 1.9;
		var finBase = (hBody * 119) / 124;
		var finBlock = (hBody * 112) / 124;
		var finEndY = (hBody * 93) / 124;

		// rescaling so that we dont have to repeat '* height' so much
		wb2 *= height;
		hb2 *= height;
		cp1y *= height;
		finW *= height;
		finBase *= height;
		finBlock *= height;
		finEndY *= height;
		hBody *= height;
		wBody *= height;

		// the two main beziers that form the rocket body
		p.bezier(
			-wb2,
			hb2,
			-wb2,
			-hb2 + hBody - cp1y,
			-wb2,
			-hb2 + slope * wb2,
			0,
			-hb2,
		);
		p.bezier(
			wb2,
			hb2,
			wb2,
			-hb2 + hBody - cp1y,
			wb2,
			-hb2 + slope * wb2,
			0,
			-hb2,
		);
		// the base line of the rocket
		p.line(-wb2, hb2, wb2, hb2);

		// LEFT fin

		// the bottom line of the fin
		p.line(-wb2, -hb2 + finBase, -wb2 - finW, -hb2 + finBase);
		// the outer vertical line of the fin
		p.line(-wb2 - finW, -hb2 + finBase, -wb2 - finW, -hb2 + finBlock);
		// the sloped line back to the body
		p.line(-wb2 - finW, -hb2 + finBlock, -wb2, -hb2 + finEndY);

		// RIGHT fin (same thing but mirrored)
		p.line(wb2, -hb2 + finBase, -wb2 + wBody + finW, -hb2 + finBase);
		p.line(
			-wb2 + wBody + finW,
			-hb2 + finBase,
			-wb2 + wBody + finW,
			-hb2 + finBlock,
		);
		p.line(-wb2 + wBody + finW, -hb2 + finBlock, wb2, -hb2 + finEndY);

		p.pop();
	}

	// compass map display thing
	{
		if (pos.x !== 0 && pos.y !== 0 && altBelowForReset === -1) {
			pastPos.push(pos);
		}
		const w = 0.2;
		const x = width / height - 0.7;
		const y = 0.27;
		p.strokeWeight(0.001 * height);
		p.stroke(0);
		const extra = 0.05 * w * height;
		p.line(
			(x - w / 2) * height - extra,
			y * height,
			(x + w / 2) * height + extra,
			y * height,
		);
		p.line(
			x * height,
			(y - w / 2) * height - extra,
			x * height,
			(y + w / 2) * height + extra,
		);
		var biggestDist = 0;
		for (const p of pastPos) {
			p.z = 0;
			biggestDist = Math.max(biggestDist, p.mag());
		}
		if (biggestDist / travelMeterDiv > 8) {
			travelMeterDiv *= 2;
		}
		p.textSize(0.01 * height);
		for (
			var dist = travelMeterDiv;
			dist <= biggestDist;
			dist += travelMeterDiv
		) {
			p.noFill();
			p.stroke(0);
			p.ellipse(
				x * height,
				y * height,
				(dist / biggestDist) * w * height,
				(dist / biggestDist) * w * height,
			);
			p.fill(0);
			p.noStroke();
			p.text(
				dist,
				x * height + 1,
				(y - ((dist / biggestDist) * w) / 2) * height - 1,
			);
		}
		p.text(Math.floor(biggestDist), x * height + 1, (y - w / 2) * height - 1);
		p.textAlign(p.CENTER);
		p.textSize(0.015 * height);
		p.text("N", x * height, (y - w / 2) * height - extra - 2);
		p.text("S", x * height, (y + w / 2 + 0.015) * height + extra);
		p.textAlign(p.LEFT);
		p.text("E", (x + w / 2) * height + extra, (y + 0.015 / 2) * height - 2);
		p.text(
			"W",
			(x - w / 2) * height - extra - p.textWidth("W") - 1,
			(y + 0.015 / 2) * height - 2,
		);
		p.noFill();
		p.stroke(0);
		p.ellipse(x * height, y * height, w * height, w * height);
		p.fill(255, 0, 0);
		p.noStroke();
		for (const point of pastPos) {
			if (point === pastPos.at(-1)) {
				p.fill(0, 255, 255);
			}
			p.ellipse(
				(x + ((point.x / biggestDist) * w) / 2) * height,
				(y + ((point.y / biggestDist) * w) / 2) * height,
				5,
				5,
			);
		}
	}

	const envY = 0.83;

	// gps coords
	{
		p.fill(0);
		p.noStroke();
		p.textSize(0.04 * height);
		var x = 0.55 * width;
		p.text("GPS: ", x, 0.1 * height);
		x += p.textWidth("GPS:");
		p.textSize(0.025 * height);
		p.text(
			"(" + limDecimal(vnGps.x, 5) + "°, " + limDecimal(vnGps.y, 5) + "°)",
			x,
			0.1 * height,
		);
	}
	// notifications / messages
	{
		var mts = 0.014;
		p.textSize(mts * height);
		p.noStroke();
		p.fill(0);
		for (const v of messageQueue) {
			v.left--;
			if (v.left < 0) {
				messageQueue.shift();
				continue;
			}
		}
		var msgCount = Math.min(messageQueue.length, 8);
		for (var i = 0; i < msgCount && i < messageQueue.length; i++) {
			const m = messageQueue[messageQueue.length - 1 - i];
			// m.left--;

			var type = m.type + ":";
			if (m.type === "Info") {
				p.fill("#0035eb");
			} else if (m.type === "Success") {
				p.fill("#00ff00");
			} else if (m.type === "Warning") {
				p.fill("#d78200");
			} else {
				p.fill("#ffff00");
			}
			p.text(
				type,
				0.01 * height,
				(envY - mts * 1.01 * msgCount - 0.005) * height +
					i * (mts * 1.01 * height),
			);
			p.fill(0);
			p.text(
				` ${m.device} ${m.subject} ${m.verb}`,
				0.01 * height + p.textWidth(type),
				(envY - mts * 1.01 * msgCount - 0.005) * height +
					i * (mts * 1.01 * height),
			);
		}
		mts = 0.028;
		p.textSize(mts * height);
		for (const v of errorQueue) {
			v.left -= 0.5;
			if (v.left < 0) {
				errorQueue.shift();
				continue;
			}
		}
		msgCount = errorQueue.length;
		const errorY = 0;
		for (var i = 0; i < msgCount && i < errorQueue.length; i++) {
			const m = errorQueue[errorQueue.length - 1 - i];
			// m.left--;
			var type = m.type + ":";
			p.fill("#ff0000");
			p.text(
				type,
				0.55 * height,
				(errorY + mts * 1.28) * height + i * (mts * 1.01 * height),
			);
			p.fill(0);
			p.text(
				` ${m.device} ${m.subject} ${m.verb}`,
				0.55 * height + p.textWidth(type),
				(errorY + mts * 1.28) * height + i * (mts * 1.01 * height),
			);
		}
	}

	// battery levels
	drawBattery(
		"Main:",
		Math.round(mainBat),
		width / height - 0.07,
		0.03,
		0.05,
		0.02,
		3,
		0.005,
		0.01,
		3,
	);
	drawBattery(
		"Servo:",
		Math.round(servoBat),
		width / height - 0.07,
		0.08,
		0.05,
		0.02,
		3,
		0.005,
		0.01,
		3,
	);
	drawSignalStrength("", rssi, width / height - 0.07, 0.12, 0.05, 0.035);

	// subsystem status
	status(
		0.01,
		0.1,
		0.03,
		[
			"Rocket",
			"Reader",
			// "Filters",
			// "Prediction",
			...connected.map((v) => v[0]),
		],
		[
			rocketActive,
			readerActive,
			// (state?.kalmanPosX ?? 0) !== 0,
			// (state?.predictedApogee ?? 0) !== 0,
			...connected.map((v) => v[1]),
		],
	);

	// show how far we have traveled
	{
		p.fill(0);
		let z = pos.z;
		pos.z = 0;
		unitString(
			"Travel: " + `${Math.floor(pos.mag())}`,
			0.04 * height,
			"ft",
			0.03 * height,
			0.55 * width,
			0.05 * height,
		);
		pos.z = z;
	}

	// uptime + airtime
	const uptimeMins = Math.floor(uptime / 1000 / 60) + "";
	const uptimeSecs = ((Math.floor(uptime / 1000) % 60) + "").padStart(2, "0");
	multiUnitString(
		[
			"Uptime:  ",
			"".padStart(3 - uptimeMins.length, " "),
			uptimeMins,
			":",
			uptimeSecs,
		],
		0.04 * height,
		0.03 * height,
		0.775 * width,
		0.1 * height,
	);
	const airTimeMins = Math.floor(airTime / 1000 / 60) + "";
	const airTimeSecs = ((Math.floor(airTime / 1000) % 60) + "").padStart(2, "0");
	multiUnitString(
		[
			"Airtime: ",
			"".padStart(3 - airTimeMins.length, " "),
			airTimeMins,
			":",
			airTimeSecs,
		],
		0.04 * height,
		0.03 * height,
		0.775 * width,
		0.05 * height,
	);

	// Draw buttons
	{
		p.textAlign(p.LEFT);
		p.noStroke();
		p.fill(0);
		p.textSize(0.02 * height);
		p.text("Environment: " + environment, 0.01 * height, envY * height);
		reqButton.draw();
		reqButton.handlePress();
		if (reqButton.isDone()) {
			altBelowForReset = alt * 0.95;
			pastPos = [];
			travelMeterDiv = 1;
			sendWsCommand("restart");
		}
		switchButton.draw();
		switchButton.handlePress();
		if (switchButton.isDone()) {
			pastPos = [];
			sendWsCommand("switch");
		}
		renameButton.handlePress();
		renameButton.draw();
		if (renameButton.isDone()) {
			sendWsCommand("getRenameData");
		}
	}

	// draw our altitude graph
	altitudeGraph.draw();

	// lotsa dials
	{
		velocityDial.update(vel.mag());
		velocityDial.draw();
		accelerationDial.update(acc.mag());
		accelerationDial.draw();
		actualDeplDial.update(deplActual * 100);
		actualDeplDial.draw();
		expectedDeplDial.update(deplExp * 100);
		expectedDeplDial.draw();
		deploymentDiffDial.update(deplActual * 100 - deplExp * 100);
		deploymentDiffDial.draw();

		// show the raw values for velocity and acceleration
		p.textSize(height * 0.013);
		p.textAlign(p.CENTER);
		p.noStroke();
		p.fill(TEXT_COL);
		p.text(
			`(${limDecimal(vel.x)}, ${limDecimal(vel.y)}, ${limDecimal(vel.z)})`,
			(velocityDial.x + velocityDial.width / 2) * height,
			(velocityDial.y + velocityDial.height) * height,
		);
		p.text(
			`(${limDecimal(acc.x)}, ${limDecimal(acc.y)}, ${limDecimal(acc.z)})`,
			(accelerationDial.x + accelerationDial.width / 2) * height,
			(accelerationDial.y + accelerationDial.height) * height,
		);
	}

	// reset stuff
	p.noStroke();
	p.fill(TEXT_COL);

	// apogee and expected apogee

	// send apogee, predicted, and altitude
	{
		p.textSize(height * 0.035);
		p.textAlign(p.CENTER);
		p.text("Apogee:", width - 0.7 * height, 0.72 * height);
		p.text("Predicted:", width - 0.43 * height, 0.72 * height);
		p.text("Altitude:", width - 0.16 * height, 0.72 * height);
		p.textSize(height * 0.025);
		p.textAlign(p.CENTER);
		const apStr = limDecimal(ap);
		const expApStr = limDecimal(expAp);
		const altStr = limDecimal(alt);
		centerString(
			apStr,
			0.025 * height,
			"ft",
			0.0175 * height,
			width - 0.7 * height,
			0.75 * height,
		);
		centerString(
			expApStr,
			0.025 * height,
			"ft",
			0.0175 * height,
			width - 0.43 * height,
			0.75 * height,
		);
		centerString(
			altStr,
			0.025 * height,
			"ft",
			0.0175 * height,
			width - 0.16 * height,
			0.75 * height,
		);
	}
	// p.text(apStr, width - 0.7 * height, 0.75 * height);
	// p.text(expApStr, width - 0.43 * height, 0.75 * height);
	// p.text(altStr, width - 0.16 * height, 0.75 * height);

	// output raw data
	{
		p.textAlign(p.LEFT);
		p.fill(0);
		p.textSize(0.02 * height);
		const dataY = 0.8;
		p.text("Raw Data: ", 0.31 * height, dataY * height);
		var x = 0.32 * height;
		var yInc = 0.015 * height;
		p.textSize(0.012 * height);
		var y = (dataY + 0.02) * height;
		const dataHeight = 1;
		var items = Math.floor((dataHeight - dataY - 0.02) / (0.012 + 0.002));
		var i = 0;
		var maxWidth = 0;
		if (state !== undefined && state !== null) {
			for (const k in state) {
				if (typeof state[k] === "object") {
					continue;
				}
				var leads = 4;
				var decimal = 2;
				if (k.indexOf("vnPos") === 0 && k.indexOf("Z") === -1) {
					decimal = 5;
				}
				if (
					k.indexOf("orientation") === 0 ||
					k.indexOf("vnOrientation") === 0
				) {
					leads = 1;
					decimal = 4;
				}
				if (k.indexOf("predictedApogee") === 0) {
					decimal = 0;
				}
				var str = k + ": " + limDecimal(state[k], decimal);
				maxWidth = Math.max(
					maxWidth,
					p.textWidth(k + ": ." + "".padStart(decimal + leads, "0")),
				);
				p.text(str, x, y + (i % items) * yInc);
				i++;
				if (i % items == 0) {
					x += maxWidth + 10;
					maxWidth = 0;
				}
			}
		}
	}

	// try ws connection if we dont have one
	wsTryConnect();
}

export const s = (/** @type {p5} */ pi) => {
	p = pi;
	pi.setup = init;

	pi.draw = draw;
	pi.mouseDragged = function () {};
	pi.mouseClicked = function () {};
	pi.mouseReleased = function () {};
};
