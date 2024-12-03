/** @import { Vector } from "p5"; */
/** @import p5 from p5 */

var width, height;
var startState = null;
var light = true;
const port = 42069;
/** @type {WebSocket?} */
var ws = null;

var currentState = {};
var currentEvent = "disconnected";
/**
 * @param event {MessageEvent}
 */
function onWsMessage(event) {
    console.log(event.data);
    var msg = JSON.parse(event.data);
    if (msg.type == "event") {
        currentEvent = msg.data;
    } else if (msg.type == "state") {
        currentState = msg.data;
        if (startState == null) {
            startState = currentState;
        }
    }
}

class Quaternion {
    /** @type {number}*/
    w = 0;
    /** @type {number}*/
    x = 0;
    /** @type {number}*/
    y = 0;
    /** @type {number}*/
    z = 0;
}

//The rotation quaternion, set in the draw function
var q1 = { w: 0, x: 0, y: 0, z: 0 };
//Multiply 2 quaternions
/**
 * @param q1 {Quaternion}
 * @param q2 {Quaternion}
 */
function mult(q1, q2) {
    var a = q1.w;
    var b = q1.x;
    var c = q1.y;
    var d = q1.z;
    var e = q2.w;
    var f = q2.x;
    var g = q2.y;
    var h = q2.z;

    return {
        w: a * e - b * f - c * g - d * h,
        x: a * f + b * e + c * h - d * g,
        y: a * g - b * h + c * e + d * f,
        z: a * h + b * g - c * f + d * e,
    };
}
//Convert a quaternion to a string
/**
 * @param q {Quaternion}
 */
function qtoString(q) {
    return "w: " + q.w + ", \nx: " + q.x + ",\ny: " + q.y + ",\nz: " + q.z;
}
//Get the conjugate of a quaternion
/**
 * @param q {Quaternion}
 */
function conj(q) {
    return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
}
//Get the norm of a quaternion
/**
 * @param q {Quaternion}
 */
function qnorm(q) {
    return Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
}
//Normalize a quaternion
/**
 * @param q {Quaternion}
 */
function normalize(q) {
    var n = qnorm(q);
    q.w /= n;
    q.y /= n;
    q.x /= n;
    q.z /= n;
}
//Get the inverse of a quaternion
/**
 * @param q {Quaternion}
 */
function inverse(q) {
    var c = conj(q);
    var qn = Math.pow(qnorm(q), 2);
    c.w /= qn;
    c.x /= qn;
    c.y /= qn;
    c.z /= qn;
    return c;
}

function wsTryConnect() {
    if (ws === null || ws.readyState === ws.CLOSED) {
        var url = "ws://localhost:" + port;
        console.log("Attempting connection to " + url);
        ws = new WebSocket(url);
        ws.onmessage = onWsMessage;
        ws.binaryType = "blob";
        ws.onopen = function () {
            console.log("Connected");

            if (ws !== null) {
                ws.onclose = function () {
                    console.log("Connection gone");
                    currentEvent = "disconnected";
                };
            }
            currentEvent = "connected";
        };
    }
}
/** @type {p5}*/
var p;

/** @type {Vector[]} */
var points = [];

//Just dont look in here
const s = (pi) => {
    p = pi;
    pi.setup = function () {
        pi.createCanvas(p.windowWidth, p.windowHeight);
        width = p.windowWidth;
        height = p.windowHeight;
        $("canvas").contextmenu((e) => {
            e.preventDefault();
        });
        p.angleMode(p.DEGREES);
        wsTryConnect();
    };

    pi.draw = function () {
        if (light) {
            p.background(255);
            p.strokeWeight(0);
            p.fill(0);
        } else {
            p.fill(255);
            p.background(4 * 16);
        }
        p.textSize(30);
        p.text("Event: " + currentEvent, 10, 40);
        /** @type {Quaternion[]} */
        var points = [];
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
                y: 0,
                z: 40 + i,
            };
            points.push(point);
            point = {
                w: 0,
                x: (i + 10) * Math.sin(-Math.PI / 6),
                y: (i + 10) * Math.sin(-Math.PI / 6),
                z: 40 + i,
            };
            points.push(point);
            point = {
                w: 0,
                x: (i + 10) * Math.sin(Math.PI / 6),
                y: (i + 10) * Math.sin(Math.PI / 6),
                z: 40 + i,
            };
            points.push(point);
        }
        // for (var i = 0; i < 100; i++) {
        //     for (var t = 0; t < 2 * Math.PI; t += 0.4) {
        //         /** @type {Quaternion} */
        //         var point = {
        //             w: 0,
        //             x: Math.sin(t) * i,
        //             y: Math.cos(t) * i,
        //             z: -currentState?.kalmanPosZ || 0,
        //         };
        //         points.push(point);
        //     }
        // }
        if (
            currentState.orientationW !== null &&
            currentState.orientationW !== undefined
        ) {
            var vel = p.createVector(
                currentState.kalmanVelX,
                currentState.kalmanVelY,
                currentState.kalmanVelZ,
            );
            p.text("Velocity: " + Math.round(vel.mag()) + " m/s", 300, 40);
            /** @type {Quaternion} */
            var quat = {
                w: currentState?.orientationW,
                x: currentState?.orientationX,
                y: currentState?.orientationY,
                z: currentState?.orientationZ,
            };
            normalize(quat);
            var i = 0;
            var z = currentState.kalmanPosZ - 1050;
            console.log(z);
            var m = (3500 - z) / 3000;
            p.strokeWeight(3 * m);
            p.stroke(0);
            for (var i = 0; i < 100; i++) {
                for (var t = 0; t < 2 * Math.PI; t += 0.4) {
                    var rad = i * m;
                    p.point(Math.sin(t) * rad + 200, Math.cos(t) * rad + 400);
                }
            }
            p.stroke(255, 0, 0);
            p.strokeWeight(3);
            for (const point of points) {
                var p2 = mult(mult(quat, point), inverse(quat));
                p.point(p2.x + 200, p2.z + 200);
                p.point(p2.x + 200, p2.y + 400);
                p.point(p2.y + 200, p2.z + 600);
            }
            p.noStroke();
        }
        // console.log(currentEvent);
        try {
            wsTryConnect();
        } catch (_) {}
    };
    pi.mouseDragged = function () {};
    pi.mouseClicked = function () {};
    pi.mouseReleased = function () {};
};
console.log("init");
