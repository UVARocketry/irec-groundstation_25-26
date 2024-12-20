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
var velocityDial, accelerationDial, actualDeplDial, expectedDeplDial;

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
        var ap = 0;
        var expAp = 0;
        var alt = 0;
        var vel = p.createVector(0, 0, 0);
        var acc = p.createVector(0, 0, 0);
        var deplExp = 0;
        var deplActual = 0;
        if (
            currentState !== null &&
            currentState.startState !== null &&
            currentState.startState !== undefined
        ) {
            deplExp = currentState.pidDeployment;
            deplActual = currentState.actualDeployment;
            ap = currentState.apogee - currentState.startState.kalmanPosZ;
            ap *= mtoft;

            expAp =
                currentState.predictedApogee -
                currentState.startState.kalmanPosZ;
            expAp *= mtoft;

            alt = currentState.kalmanPosZ - currentState.startState.kalmanPosZ;
            alt *= mtoft;

            altitudeGraph.addDatapoint(ap, [expAp]);
            acc = p.createVector(
                currentState.accX / 9.8,
                currentState.accY / 9.8,
                currentState.accZ / 9.8,
            );
            vel = p.createVector(
                currentState.kalmanVelX * mtoft,
                currentState.kalmanVelY * mtoft,
                currentState.kalmanVelZ * mtoft,
            );
            /** @type {Quaternion} */
            // show the rockets
            var quat = {
                w: currentState.orientationW,
                x: currentState.orientationX,
                y: currentState.orientationY,
                z: currentState.orientationZ,
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
        accelerationDial.update(acc.mag());
        accelerationDial.draw();
        actualDeplDial.update(deplActual * 100);
        actualDeplDial.draw();
        actualDeplDial.update(deplExp * 100);
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
