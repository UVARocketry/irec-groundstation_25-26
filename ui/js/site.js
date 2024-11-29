var width, height;
var light = false;
const port = 42069;
/** @type {WebSocket?} */
var ws = null;

function wsTryConnect() {
    if (ws === null || ws.readyState === ws.CLOSED) {
        ws = new WebSocket("ws://localhost:" + port);
        ws.onopen = function () {
            alert("connected");
            if (ws !== null) {
                ws.onclose = function () {
                    alert("connection closed");
                };
            }
        };
    }
}
var p;

//Just dont look in here
const s = (pi) => {
    p = pi;
    pi.setup = function () {
        wsTryConnect();
        pi.createCanvas(p.windowWidth, p.windowHeight);
        width = p.windowWidth;
        height = p.windowHeight;
        $("canvas").contextmenu((e) => {
            e.preventDefault();
        });
        p.angleMode(p.DEGREES);
    };

    pi.draw = function () {
        wsTryConnect();
        if (light) {
            p.background(255);
            p.strokeWeight(0);
        } else {
            p.fill(255);
            p.background(4 * 16);
        }
    };
    pi.mouseDragged = function () {};
    pi.mouseClicked = function () {};
    pi.mouseReleased = function () {};
};
