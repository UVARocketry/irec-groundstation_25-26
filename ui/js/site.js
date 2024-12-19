/** @import { Vector } from "p5"; */
/** @import p5 from p5 */

/// converts meters to feet
const mtoft = 3.28084;

// global width and height of canvas
var width, height;
var light = true;
const port = 42069;

/** @type {p5}*/
var p;

/** @type {Vector[]} */
var points = [];

/** @type {Graph} */
var altitudeGraph;

/** @type {Dial} */
var velocityDial;

const s = (/** @type {p5} */ pi) => {
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
            "VELOCITY",
            5,
        );
        velocityDial.update(100);
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
        p.text("Event: " + currentEvent, 10, 40);
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
        var alt = 0;
        var expAp = 0;
        var vel = p.createVector(0, 0, 0);
        if (
            // just use orientationW to check if everythings there
            currentState.orientationW !== null &&
            currentState.orientationW !== undefined
        ) {
            console.log(currentState);
            alt = currentState?.apogee - currentState?.startState?.kalmanPosZ;
            alt *= mtoft;

            expAp =
                currentState?.predictedApogee -
                currentState?.startState?.kalmanPosZ;
            expAp *= mtoft;

            altitudeGraph.addDatapoint(alt, [expAp]);
            vel = p.createVector(
                currentState.kalmanVelX * mtoft,
                currentState.kalmanVelY * mtoft,
                currentState.kalmanVelZ * mtoft,
            );
            /** @type {Quaternion} */
            // show the rockets
            var quat = {
                w: currentState?.orientationW,
                x: currentState?.orientationX,
                y: currentState?.orientationY,
                z: currentState?.orientationZ,
            };
            quatnormalize(quat);
            var i = 0;
            var z = currentState.kalmanPosZ - 1050;
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
        altitudeGraph.draw();

        velocityDial.update(vel.mag());
        velocityDial.draw();

        // reset stuff
        p.noStroke();
        p.fill(0, 0, 0);
        p.textAlign(p.RIGHT);

        // apogee and expected apogee
        p.textSize(height * 0.035);
        p.text("Apogee: ", width - 0.6 * height, 0.7 * height);
        p.text(limDecimal(alt), width - 0.55 * height, 0.75 * height);
        p.text("Predicted Apogee: ", width - 0.2 * height, 0.7 * height);
        p.text(limDecimal(expAp), width - 0.15 * height, 0.75 * height);
        p.textSize(height * 0.025);
        p.text("ft", width - 0.53 * height, 0.75 * height);
        p.text("ft", width - 0.13 * height, 0.75 * height);
        p.textSize(height * 0.035);
        p.textAlign(p.LEFT);
        // velocity view
        p.text("Velocity: " + Math.round(vel.mag()) + " ft/s", 300, 40);

        // try ws connection if we dont have one
        wsTryConnect();
    };
    pi.mouseDragged = function () {};
    pi.mouseClicked = function () {};
    pi.mouseReleased = function () {};
};
console.log("init");
