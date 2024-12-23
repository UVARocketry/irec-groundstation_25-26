/** @import { Vector } from "p5"; */
/** @import p5 from p5 */
import { Button } from "./button.js";
import { Dial } from "./dial.js";
import { Graph } from "./graph.js";
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
export const port = 42069;

/** @type {p5}*/
var p;

/** @type {Graph} */
export var altitudeGraph;

/** @type {Dial} */
var velocityDial, accelerationDial, actualDeplDial, expectedDeplDial;

var reqButton;

export function getP5() {
    return p;
}
export function getHeight() {
    return height;
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

        reqButton = new Button(
            0.01,
            0.1,
            0.12,
            0.04,
            p.color(0, 0, 0),
            p.color(255, 0, 0),
            p.color(230, 0, 0),
            p.color(200, 0, 0),
            "restart dbg run",
            0.05,
            0.02,
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
            "VELOCITY\n(ft/s)",
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
            "DEPLOYMENT\n(actual pct)",
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
            "DEPLOYMENT\n(expected pct)",
            5,
        );
    };

    pi.draw = function () {
        // light mode/dark mode bg
        if (light) {
            p.background(255);
            p.strokeWeight(0);
            p.fill(0);
        } else {
            p.fill(255);
            p.background(4 * 16);
        }

        // tell everyone our current event
        p.textSize(30);
        var ce = getCurrentEvent();
        p.text("Event: " + ce, 10, 40);
        /** @type {Quaternion[]} */
        var points = [];

        // create a rocket as a bunch of quaternion points
        {
            for (var i = -50; i < 50; i += 10) {
                for (var t = 0; t < 2 * Math.PI; t += 1) {
                    /** @type {Quaternion} */
                    var point = {
                        w: 0,
                        x: Math.sin(t) * 10,
                        y: Math.cos(t) * 10,
                        z: i,
                    };
                    points.push(point);
                }
            }
            for (var o = 1; o < Math.PI; o += 0.5) {
                for (var t = 0; t < 2 * Math.PI; t += 1) {
                    /** @type {Quaternion} */
                    var point = {
                        w: 0,
                        x: Math.cos(o) * Math.sin(t) * 10,
                        y: Math.cos(o) * Math.cos(t) * 10,
                        z: -50 - Math.sin(o) * 10,
                    };
                    points.push(point);
                }
            }
            for (var i = 0; i < 20; i++) {
                /** @type {Quaternion} */
                var point = {
                    w: 0,
                    x: (i + 10) * Math.sin(Math.PI),
                    y: (i + 10) * Math.cos(Math.PI),
                    z: 40 + i,
                };
                points.push(point);
                point = {
                    w: 0,
                    x: (i + 10) * Math.sin(-Math.PI / 3),
                    y: (i + 10) * Math.cos(-Math.PI / 3),
                    z: 40 + i,
                };
                points.push(point);
                point = {
                    w: 0,
                    x: (i + 10) * Math.sin(Math.PI / 3),
                    y: (i + 10) * Math.cos(Math.PI / 3),
                    z: 40 + i,
                };
                points.push(point);
            }
        }

        // parse data packets
        var ap = 0;
        var expAp = 0;
        var alt = 0;
        var vel = p.createVector(0, 0, 0);
        var acc = p.createVector(0, 0, 0);
        var deplExp = 0;
        var deplActual = 0;
        var state = getCurrentState();
        if (
            state !== null &&
            state.startState !== null &&
            state.startState !== undefined
        ) {
            // console.log(state);
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
            var i = 0;
            var z = state.kalmanPosZ - 1050;
            var m = (3500 - z) / 3000;
            p.strokeWeight(3 * m);
            p.stroke(255, 0, 0);
            p.strokeWeight(3);
            for (const point of points) {
                var p2 = quatmult(quatmult(quat, point), quatinverse(quat));
                p.point(p2.x + 200, p2.z + 200);
                p.point(p2.x + 200, p2.y + 400);
                p.point(p2.y + 200, p2.z + 600);
            }
            p.noStroke();
        }

        p.textSize(0.015 * height);
        reqButton.draw();
        reqButton.handlePress();
        if (reqButton.isDone()) {
            sendWsCommand("restart");
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
        p.fill(0);
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
        p.fill(0, 0, 0);

        // apogee and expected apogee
        p.textSize(height * 0.035);
        p.textAlign(p.CENTER);
        p.text("Apogee: ", width - 0.7 * height, 0.72 * height);
        p.text("Predicted: ", width - 0.45 * height, 0.72 * height);
        p.text("Altitude: ", width - 0.2 * height, 0.72 * height);
        p.textSize(height * 0.025);
        const apStr = limDecimal(ap) + " ft";
        const expApStr = limDecimal(expAp) + " ft";
        const altStr = limDecimal(alt) + " ft";
        p.text(apStr, width - 0.7 * height, 0.75 * height);
        p.text(expApStr, width - 0.45 * height, 0.75 * height);
        p.text(altStr, width - 0.2 * height, 0.75 * height);
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
console.log("init");
