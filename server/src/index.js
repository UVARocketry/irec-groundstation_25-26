import fs from "node:fs";

import http from "node:http";
import path from "node:path";

import { Message } from "./message.js";
import { parseMessage } from "./data.js";

import { getState, getEvent } from "./state.js";

import { WebSocketServer } from "ws";
import { Strings } from "./ansi.js";
import { ServerMessage } from "../../common/ServerMessage.js";
const port = 42069;
const wss = new WebSocketServer({ port: port, host: "localhost" });

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
    let path = "../out/msg-" + n;
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
console.log(`${Strings.Ok}: Starting websocket server at port ${port}`);

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

// a server to send off the files
const server = http.createServer((req, res) => {
    // If the user requests the root '/'
    const searchDir = process.cwd() + "/../ui/";
    const commonDir = process.cwd() + "/../common/";
    if (req.url === "/") {
        const indexPath = path.join(searchDir, "index.html");
        console.log(indexPath);

        // Serve index.html file
        fs.readFile(indexPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end("Error loading index.html");
            } else {
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html");
                res.end(data);
            }
        });
    } else {
        // Serve other files from the file system
        var url = req.url ?? "index.html";
        let filePath = path.join(searchDir, url);

        console.log(url);
        if (url.startsWith("/common") || url.startsWith("common")) {
            filePath = path.join(commonDir, url);
        }

        // Check if file exists
        fs.exists(filePath, (exists) => {
            if (exists) {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.statusCode = 500;
                        res.end("Error reading the file");
                    } else {
                        // Guess the content type based on file extension
                        let contentType = "text/plain";
                        if (filePath.endsWith(".html")) {
                            contentType = "text/html";
                        } else if (filePath.endsWith(".css")) {
                            contentType = "text/css";
                        } else if (filePath.endsWith(".js")) {
                            contentType = "application/javascript";
                        }

                        res.statusCode = 200;
                        res.setHeader("Content-Type", contentType);
                        res.end(data);
                    }
                });
            } else {
                res.statusCode = 404;
                res.end("File not found");
            }
        });
    }
});

// Set the server to listen on port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`${Strings.Ok}: Server running at http://localhost:${PORT}`);
});
