import fs from "node:fs";

import http from "node:http";
import path from "node:path";

import { Message } from "./message.js";
import { parseMessage } from "./data.js";

import { getState, getEvent, setAdd } from "./state.js";

import { WebSocketServer } from "ws";
import { Strings } from "./ansi.js";
import { ServerMessage } from "../../common/ServerMessage.js";
import { handleUiRequest } from "./command.js";
import { port } from "../../common/web.js";
import { FileLogReader } from "./fileLogReader.js";
import { StdinReader } from "./stdinReader.js";
import { InputReader } from "./inputReader.js";

const wss = new WebSocketServer({ port: port, host: "localhost" });
/**@type {InputReader}*/
var reader;
var useStdin = false;

/** @param msg {ServerMessage} */
export function broadcast(msg) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
}

/**
 * @param {Uint8Array<ArrayBuffer>} buf
 */
async function onUpdate(buf) {
    const msg = new Message(buf);

    var ret = parseMessage(msg);
    var send = null;
    if (ret === "event") {
        send = new ServerMessage("event", getEvent());
    } else if (ret === "state") {
        send = new ServerMessage("state", getState());
    }
    if (send !== null) {
        broadcast(send);
    }
}

export function broadcastState() {
    var send = new ServerMessage("state", getState());
    broadcast(send);
}
export function broadcastEvent() {
    var send = new ServerMessage("event", getEvent());
    broadcast(send);
}

const logReader = new FileLogReader(onUpdate, null);
// logReader.path = "../out2";

/**
 * @param {boolean} v
 */
export function useStdinReader(v) {
    if (v) {
        reader = procReader;
    } else {
        reader = logReader;
    }
}

export function switchReader() {
    reader.stop();
    if (reader == procReader) {
        reader = logReader;
        setAdd("readerType", "DEBUG");
    } else {
        reader = procReader;
        setAdd("readerType", "LIVE");
    }
    reader.start();
}
export function resetMessageReader() {
    reader.reset();
    // readMessage(0);
}

// await readMessage(0);
console.log(
    `${Strings.Ok}: Starting websocket server at ws://localhost:${port}`,
);

var read1 = false;
const procReader = new StdinReader(
    onUpdate,
    "stderr",
    "./run",
    [],
    "../../sac_24-25/lib",
    () => "../out_" + new Date().toISOString().slice(0, 19).replace("T", "_"),
);

wss.on("connection", function (ws) {
    if (!read1) {
        useStdinReader(useStdin);
        read1 = true;
    }
    setTimeout(function () {
        reader.start();
        // logReader.start();
        // readMessage(0);
        // read1 = true;
    }, 100);
    // }
    ws.on("message", function (v) {
        handleUiRequest(v.toString());
        // console.log(
        //     `${Strings.Warn}: Messages from the browser ui are currently not supported`,
        // );
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
    // leave off the common/ because that's in the url
    const commonDir = process.cwd() + "/../";
    if (req.url === "/") {
        const indexPath = path.join(searchDir, "index.html");

        // Serve index.html file
        fs.readFile(indexPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end("Error loading index.html");
                console.log(`${Strings.Warn}: Request for ${indexPath} failed`);
            } else {
                console.log(`${Strings.Ok}: Request for ${indexPath}`);
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html");
                res.end(data);
            }
        });
    } else {
        // Serve other files from the file system
        var url = req.url ?? "index.html";
        let filePath = path.join(searchDir, url);

        if (url.startsWith("/common") || url.startsWith("common")) {
            filePath = path.join(commonDir, url);
        }
        const prettyPath = filePath.replace(process.cwd(), "");

        // Check if file exists
        fs.exists(filePath, (exists) => {
            if (exists) {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.statusCode = 500;
                        res.end("Error reading the file");
                        console.log(
                            `${Strings.Warn}: Request for ${prettyPath} failed`,
                        );
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
                        console.log(`${Strings.Ok}: Request for ${prettyPath}`);
                    }
                });
            } else {
                console.log(
                    `${Strings.Error}: Request for ${prettyPath} failed`,
                );
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
