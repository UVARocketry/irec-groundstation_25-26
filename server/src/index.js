import fs from "node:fs";

import http from "node:http";
import path from "node:path";

import { clearSysTime } from "./data.js";

import { WebSocketServer } from "ws";
import { Strings } from "./ansi.js";
import { ServerMessage } from "../../common/ServerMessage.js";
import command from "./command.js";
import { port } from "../../common/web.js";
// import { FileLogReader } from "./readers/fileLogReader.js";
// import { InputReader } from "./readers/inputReader.js";
import child_process from "node:child_process";
import { log } from "./log.js";
// import { SerialPortReader } from "./readers/serialportReader.js";
// import { StdinReader } from "./readers/stdinReader.js";

import mgr from "./readerManager.js";
import state from "./state.js";
// import data from "./data.js";
import { Configuration } from "./configuration.js";

export const argv = process.argv.slice(2);

class Config {
	manager = new Configuration(new mgr.Config());
}

var config = new Configuration(new Config());
config.setRoot("save.json");

mgr.init();

config.getConfigOptions().then((res) => {
	console.log(JSON.stringify(res));
});

/** @template {keyof Config} K
 * @param key {K}
 * @return {Config[K]}
 */
export function getConfigField(key) {
	return config.get(key);
}

export function getRootConfig() {
	return config;
}

var wsConnected = false;
const wss = new WebSocketServer({ port: port });
// var useStdin = false;

/** @param msg {ServerMessage} */
export function broadcast(msg) {
	if (!wsConnected) {
		return;
	}
	wss.clients.forEach(function (client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(msg));
		}
	});
}

export function stopReader() {
	mgr.stop();
}

/**
 * @param {Config} obj
 */
export function reconfigure(obj) {
	mgr.stop();
	config.useConfigOptions(obj);
	mgr.postReconfigure();
}

export function broadcastState() {
	var send = new ServerMessage("state", state.getState());
	broadcast(send);
}
export function broadcastEvent() {
	var send = new ServerMessage("event", state.getEvent());
	broadcast(send);
}

export function resetMessageReader() {
	state.resetInternalState();
	clearSysTime();
	mgr.reset();
	mgr.start();
	// reader.reset();
	// readMessage(0);
}

// await readMessage(0);
log(`${Strings.Ok}: Starting websocket server at ws://localhost:${port}`);

// var read1 = false;
// const procReader = new SerialPortReader(
// 	onUpdate,
// 	"/dev/ttyACM0",
// 	() => "../out_" + new Date().toISOString().slice(0, 19).replace("T", "_"),
// );
// const procReader = new StdinReader(
// 	onUpdate,
// 	"stderr",
// 	"./run",
// 	[],
// 	"../../irec_25-26/lib",
// 	() => "../out_" + new Date().toISOString().slice(0, 19).replace("T", "_"),
// );
// const procReader = new FileUpdateReader(
//     onUpdate,
//     "cat.txt",
//     1,
//     () => "../out_" + new Date().toISOString().slice(0, 19).replace("T", "_"),
// );

wss.on("connection", function (ws) {
	wsConnected = true;
	// if (!read1) {
	// useStdinReader(useStdin);
	// 	read1 = true;
	// }
	// setTimeout(function () {
	//     // reader.start();
	//     // logReader.start();
	//     // readMessage(0);
	//     // read1 = true;
	// }, 100);
	// }
	ws.on("message", function (v) {
		command.handleUiRequest(v.toString());
	});
	ws.on("close", function () {
		log(`${Strings.Warn}: Websocket connection closing`);
	});
	var msg = new ServerMessage("event", state.getEvent());
	ws.send(JSON.stringify(msg));
	msg = new ServerMessage("state", state.getState());
	ws.send(JSON.stringify(msg));
	log(`${Strings.Ok}: Websocket connection successful`);
});

// a server to send off the files
const server = http.createServer((req, res) => {
	// If the user requests the root '/'
	const searchDir = process.cwd() + "/../";
	// leave off the common/ because that's in the url
	// const commonDir = process.cwd() + "/../";
	if (req.url === "/") {
		const indexPath = path.join(searchDir, "ui/index.html");

		// Serve index.html file
		fs.readFile(indexPath, (err, data) => {
			if (err) {
				res.statusCode = 500;
				res.end("Error loading index.html");
				log(`${Strings.Warn}: Request for ${indexPath} failed`);
			} else {
				log(`${Strings.Ok}: Request for ${indexPath}`);
				res.statusCode = 200;
				res.setHeader("Content-Type", "text/html");
				res.end(data);
			}
		});
	} else {
		// Serve other files from the file system
		var url = req.url ?? "/ui/index.html";
		let filePath = path.join(searchDir, url);

		// if (url.startsWith("/common") || url.startsWith("common")) {
		// 	filePath = path.join(commonDir, url);
		// }

		try {
			if (fs.statSync(filePath).isDirectory()) {
				if (!filePath.endsWith("/")) {
					filePath += "/";
				}
				filePath += "index.html";
			}
		} catch (_) {}
		const prettyPath = filePath.replace(process.cwd(), "");

		// Check if file exists
		fs.exists(filePath, (exists) => {
			if (exists) {
				fs.readFile(filePath, (err, data) => {
					if (err) {
						res.statusCode = 500;
						res.end("Error reading the file");
						log(
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
						log(`${Strings.Ok}: Request for ${prettyPath}`);
					}
				});
			} else {
				log(`${Strings.Error}: Request for ${prettyPath} failed`);
				res.statusCode = 404;
				res.end("File not found");
			}
		});
	}
});

/**
 * @param {string} url
 */
function openUrl(url) {
	var start =
		process.platform == "darwin"
			? "open"
			: process.platform == "win32"
				? "start"
				: "xdg-open";
	if (process.platform === "win32") {
		url = url.replaceAll("&", "^&");
	}
	child_process.exec(start + " " + url);
}

// Set the server to listen on port 3000
const PORT = 3000;
server.listen(PORT, () => {
	log(`${Strings.Ok}: Server running at http://localhost:${PORT}`);
	var url = "http://localhost:" + PORT;
	if (argv.indexOf("--nowin") !== 0) {
		openUrl(url);
		openUrl(url + "/uiforconfig");
	}
});

log(`${Strings.Ok}: Data pipe active on ws://localhost:${port}`);
log(`${Strings.Ok}: New Ground Station ready for connection.`);

