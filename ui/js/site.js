/** @import { Vector } from "p5"; */
import { Button } from "./button.js";
import { Dial } from "./dial.js";
import { Graph } from "./graph.js";
/** @import p5 from "p5"; */
import {
    Quaternion,
    quatinverse,
    quatmult,
    quatnormalize,
} from "./quaternion.js";
import { limDecimal } from "./utils.js";
import {
    getCurrentState,
    getCurrentEvent,
    wsTryConnect,
    sendWsCommand,
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
var velocityDial, accelerationDial, actualDeplDial, expectedDeplDial;

/** @type {Button} */
var reqButton, switchButton;

export function getP5() {
    return p;
}
export function getHeight() {
    return height;
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
export const s = (/** @type {p5} */ pi) => {
    p = pi;
    pi.setup = function () {
        // setup globals
        pi.createCanvas(p.windowWidth, p.windowHeight);
        width = p.windowWidth;
        height = p.windowHeight;
        $("canvas").contextmenu((e) => {
            e.preventDefault();
        });
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
            pi.color(255, 0, 0),
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
            [0, 1300],
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
            [0, 30],
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
            0.22,
            0.2,
            0.2,
            (270 * Math.PI) / 180,
            p.color(255, 0, 0),
            p.color(125, 0, 0),
            [0, 100],
            "DEPLOYMENT\n(expected %)",
            5,
        );
        p.textFont("TX-02-Trial");
        logo = p.loadImage("assets/logo.webp");
    };

    pi.draw = function () {
        // light mode/dark mode bg
        if (light) {
            p.background(255);
            p.strokeWeight(0);
            p.fill(0);
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
        var ap = 0;
        var expAp = 0;
        var alt = 0;
        var vel = p.createVector(0, 0, 0);
        var acc = p.createVector(0, 0, 0);
        var deplExp = 0;
        var deplActual = 0;
        var state = getCurrentState();
        var uptime = 0;
        var airTime = 0;
        var pos = p.createVector(0, 0, 0);
        var readerActive = false;
        var rocketActive = false;
        if (
            state !== null &&
            state.startState !== null &&
            state.startState !== undefined
        ) {
            readerActive = state.readerConnected;
            rocketActive = state.rocketConnected;
            pos = p.createVector(
                state.kalmanPosX,
                state.kalmanPosY,
                state.kalmanPosZ,
            );
            uptime = state.i_timestamp;
            airTime = state.timeSinceLaunch;
            deplExp = state.pidDeployment;
            deplActual = state.actualDeployment;
            ap = state.apogee - state.startState.kalmanPosZ;
            ap *= mtoft;

            expAp = state.predictedApogee - state.startState.kalmanPosZ;
            expAp *= mtoft;

            alt = state.kalmanPosZ - state.startState.kalmanPosZ;
            alt *= mtoft;

            altitudeGraph.addDatapoint(ap, [expAp]);
            acc = p.createVector(
                state.accX / 9.8,
                state.accY / 9.8,
                state.accZ / 9.8,
            );
            vel = p.createVector(
                state.kalmanVelX * mtoft,
                state.kalmanVelY * mtoft,
                state.kalmanVelZ * mtoft,
            );
            /** @type {Quaternion} */
            // show the rockets
            var quat = {
                w: state.orientationW,
                x: state.orientationX,
                y: state.orientationY,
                z: state.orientationZ,
            };
            quatnormalize(quat);
            var z = state.kalmanPosZ - 1050;
            var m = (3500 - z) / 3000;
            p.strokeWeight(3 * m);
            p.stroke(COL1);
            p.strokeWeight(3);
            p.noStroke();
        }

        p.strokeWeight(0.0015 * height);
        p.stroke(0);
        if (rocketActive) {
            p.fill(0, 255, 0);
        } else {
            p.fill(255, 0, 0);
        }
        p.ellipse(0.025 * height, 0.135 * height, 0.01 * height, 0.01 * height);
        if (readerActive) {
            p.fill(0, 255, 0);
        } else {
            p.fill(255, 0, 0);
        }
        p.ellipse(0.025 * height, 0.185 * height, 0.01 * height, 0.01 * height);
        p.fill(0);
        p.noStroke();
        p.textSize(0.03 * height);
        p.text("System Status:", 0.01 * height, 0.1 * height);
        p.textSize(0.04 * height);
        p.text("Rocket", 0.05 * height, 0.15 * height);
        p.text("Reader", 0.05 * height, 0.2 * height);
        {
            let z = pos.z;
            pos.z = 0;
            unitString(
                "Travel: " + `${Math.floor(pos.mag())}`,
                0.04 * height,
                "ft",
                0.03 * height,
                0.6 * width,
                0.05 * height,
            );
            pos.z = z;
        }
        unitString(
            "Uptime:  " + Math.floor(uptime / 1000),
            0.04 * height,
            "s",
            0.03 * height,
            0.82 * width,
            0.1 * height,
        );
        unitString(
            "Airtime: " + Math.floor(airTime / 1000),
            0.04 * height,
            "s",
            0.03 * height,
            0.82 * width,
            0.05 * height,
        );

        p.fill("#999999");
        var abAngleStart = 70;
        p.rect(
            (0.5 - Math.cos((abAngleStart * Math.PI) / 180) * 0.05) * height,
            (-0.05 * Math.sin((abAngleStart * Math.PI) / 180) + 0.5) * height -
                deplActual * 30,
            Math.cos((abAngleStart * Math.PI) / 180) * 0.05 * 2 * height,
            // 100,
            Math.sin((abAngleStart * Math.PI) / 180) * 0.05 + deplActual * 30,
        );
        p.arc(
            0.5 * height,
            0.5 * height - deplActual * 30,
            0.1 * height,
            0.1 * height,
            -p.radians(180 - abAngleStart),
            -p.radians(abAngleStart),
        );

        p.fill("#ff8000");

        p.arc(
            0.5 * height,
            0.5 * height,
            0.1 * height,
            0.1 * height,
            -p.radians(170),
            -p.radians(10),
        );
        p.fill("#ffffff");
        p.rect(
            0.45 * height,
            0.5 * height,
            0.1 * height,
            -Math.sin((10 * Math.PI) / 180) * 0.05 * height,
        );

        p.fill(0);

        // p.textSize(0.015 * height);
        p.textAlign(p.LEFT);
        reqButton.draw();
        reqButton.handlePress();
        if (reqButton.isDone()) {
            sendWsCommand("restart");
        }
        switchButton.draw();
        switchButton.handlePress();
        if (switchButton.isDone()) {
            sendWsCommand("switch");
        }
        altitudeGraph.draw();

        velocityDial.update(vel.mag());
        velocityDial.draw();
        accelerationDial.update(acc.mag());
        accelerationDial.draw();
        actualDeplDial.update(deplActual * 100);
        actualDeplDial.draw();
        expectedDeplDial.update(deplExp * 100);
        expectedDeplDial.draw();

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

        // reset stuff
        p.noStroke();
        p.fill(TEXT_COL);

        // apogee and expected apogee
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
        // p.text(apStr, width - 0.7 * height, 0.75 * height);
        // p.text(expApStr, width - 0.43 * height, 0.75 * height);
        // p.text(altStr, width - 0.16 * height, 0.75 * height);
        p.textSize(height * 0.035);
        p.textAlign(p.LEFT);
        p.fill(100, 100, 100);
        // velocity view

        // try ws connection if we dont have one
        wsTryConnect();
    };
    pi.mouseDragged = function () {};
    pi.mouseClicked = function () {};
    pi.mouseReleased = function () {};
};
