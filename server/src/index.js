import fs from "node:fs";

import { Message } from "./message.js";
import { parseMessage } from "./data.js";

import { WebSocketServer } from "ws";
import { Strings } from "./ansi.js";

/** @param n {number} */
async function readMessage(n) {
    const file = await fs.openAsBlob("../../sac_24-25/lib/pid_py/out/msg-" + n);

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
    // if (ret !== "") {
    //     console.log(ret);
    // }
}

await readMessage(0);
await readMessage(1);
await readMessage(2);
await readMessage(3);
console.log(`${Strings.Ok}: Starting websocket server`);

const wss = new WebSocketServer({ port: 42069, host: "localhost" });

wss.on("connection", function (ws) {
    ws.on("message", function (msg) {
        console.log(
            `${Strings.Warn}: Messages from the browser ui are currently not supported`,
        );
    });
    ws.on("close", function () {
        console.log(`${Strings.Warn}: Websocket connection closing`);
    });
    ws.send("sup");
    console.log(`${Strings.Ok}: Websocket connection successful`);
});
