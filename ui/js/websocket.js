/** @type {WebSocket?} */
var ws = null;

/** @type {LogItem?} */
var currentState = null;
var currentEvent = "disconnected";
/**
 * @param event {MessageEvent}
 */
function onWsMessage(event) {
    var msg = JSON.parse(event.data);
    if (msg.type == "event") {
        currentEvent = msg.data;
    } else if (msg.type == "state") {
        currentState = msg.data;
    }
}

function wsTryConnect() {
    try {
        if (ws === null || ws.readyState === ws.CLOSED) {
            var url = "ws://localhost:" + port;
            console.log("Attempting connection to " + url);
            ws = new WebSocket(url);
            ws.onmessage = onWsMessage;
            ws.binaryType = "blob";
            ws.onopen = function () {
                console.log("Connected");
                altitudeGraph.inputData([], [[]]);

                if (ws !== null) {
                    ws.onclose = function () {
                        console.log("Connection gone");
                        currentEvent = "disconnected";
                    };
                }
                currentEvent = "connected";
            };
        }
    } catch (_) {
        console.log("Error in ws connection attempt");
        ws = null;
    }
}
