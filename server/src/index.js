import fs from "node:fs";

import { Message } from "./message.js";
import { parseMessage } from "./data.js";

import { getState, getEvent } from "./state.js";

import { WebSocketServer } from "ws";
import { Strings } from "./ansi.js";
import { ServerMessage } from "../../common/ServerMessage.js";
const wss = new WebSocketServer({ port: 42069, host: "localhost" });

/** @param msg {ServerMessage} */
function broadcast(msg) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
}

/** @param n {number} */
async function readMessage(n) {
    let path = "../../sac_24-25/lib/pid_py/out/msg-" + n;
    if (!fs.existsSync(path)) {
        var close = new ServerMessage("event", "done");
        broadcast(close);
        return;
    }
    const file = await fs.openAsBlob(path);

    const buf = new Uint8Array(await file.arrayBuffer());

    const aCode = "a".charCodeAt(0);

    var newBuf = [];

    for (var i = 0; i < buf.length; i += 2) {
        var left = buf[i];
        var right = buf[i + 1];
        left -= aCode;
        left = left & 0x0f;
        left <<= 4;
        right -= aCode;
        right = right & 0x0f;
        newBuf.push(left + right);
    }

    const msg = new Message(new Uint8Array(newBuf));

    var ret = parseMessage(msg);
    var send = null;
    if (ret === "event") {
        send = new ServerMessage("state", getEvent());
    } else if (ret === "state") {
        send = new ServerMessage("state", getState());
    }
    if (send !== null) {
        broadcast(send);
    }
    // if (n !== 0) {
    setTimeout(function () {
        readMessage(n + 1);
    }, 10);
    // }
}

// await readMessage(0);
console.log(`${Strings.Ok}: Starting websocket server`);

var read1 = false;

wss.on("connection", function (ws) {
    if (!read1) {
        setTimeout(function () {
            readMessage(0);
            read1 = true;
        }, 1000);
    }
    ws.on("message", function (_) {
        console.log(
            `${Strings.Warn}: Messages from the browser ui are currently not supported`,
        );
    });
    ws.on("close", function () {
        console.log(`${Strings.Warn}: Websocket connection closing`);
    });
    var msg = new ServerMessage("event", getEvent());
    ws.send(JSON.stringify(msg));
    msg = new ServerMessage("state", getState());
    ws.send(JSON.stringify(msg));
    console.log(`${Strings.Ok}: Websocket connection successful`);
});
