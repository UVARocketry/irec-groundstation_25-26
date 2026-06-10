import { port } from "../common/web.js";
var host = null;
if (host === null) {
	const val = window.prompt(
		"Please input the websocket host (leave blank if same host as this site)",
	);

	if (val === null || val === "") {
		host = window.location.hostname;
	} else {
		host = val;
	}
}
var switchBtn = document.getElementById("switchReader");
if (switchBtn) {
	switchBtn.onclick = function () {
		ws.send(
			JSON.stringify({
				type: "command",
				data: "switch",
			}),
		);
	};
}
function sendCommand(cmd) {
	ws.send(JSON.stringify({ type: "command", data: cmd }));
}
var startBtn = document.getElementById("startRun");
if (startBtn) {
	startBtn.onclick = function () { sendCommand("restart"); };
}
var stopBtn = document.getElementById("stopRun");
if (stopBtn) {
	stopBtn.onclick = function () { sendCommand("stop"); };
}
var getButton = document.getElementById("get");
if (getButton) {
	getButton.onclick = function () {
		ws.send(
			JSON.stringify({
				type: "command",
				data: "getConfigurationOptions",
			}),
		);
	};
}
var url = "ws://" + host + ":" + port;
var ws = new WebSocket(url);

ws.binaryType = "blob";

ws.onopen = function () {
	const conn = document.getElementById("connection");
	if (conn) {
		conn.classList.add("connected");
		conn.textContent = "connected";
	}

	ws.onclose = function () {
		if (conn) {
			conn.classList.remove("connected");
			conn.textContent = "disconnected";
		}
	};
};

/**
 * @param {object} obj
 * @param {string} field
 * @param {any} value
 * @param {string} tp
 */
function setObjectField(obj, field, value, tp) {
	const split = field.split(".");
	var currentObj = obj;
	for (var i = 0; i < split.length - 1; i++) {
		var fieldName = split[i];
		currentObj[fieldName] = currentObj[fieldName] ?? {};
		currentObj = currentObj[fieldName];
	}
	const key = split.at(-1) ?? "";
	if (tp == "string") {
		currentObj[key] = value;
	} else if (tp == "number") {
		currentObj[key] = Number(value);
	} else if (tp == "boolean") {
		currentObj[key] = value == "true";
	} else {
		currentObj[key] = JSON.parse(value);
	}
}

const submitBtn = document.getElementById("submit");
if (submitBtn) {
	submitBtn.onclick = function () {
		const els = document.querySelectorAll("#configurationplace [id]");
		var obj = {};
		for (const el of els) {
			// console.log(el.value + ", " + el.getAttribute("id"));
			setObjectField(
				obj,
				el.getAttribute("id") ?? "",
				// @ts-ignore
				el.value ?? "",
				el.getAttribute("type") ?? "string",
			);
		}
		console.log(JSON.stringify(obj));
		ws.send(
			JSON.stringify({
				type: "setConfiguration",
				data: obj,
			}),
		);
		var root = document.getElementById("configurationplace");
		if (root) {
			while (root.firstChild) {
				root.removeChild(root.firstChild);
			}
		}
	};
}

/**
 * @param {HTMLElement} root
 * @param {{ [x: string]: any; }} currentOpts
 * @param {string} rootName
 */
function addOpts(root, currentOpts, rootName) {
	for (const key in currentOpts) {
		var name = rootName + key;
		const expected = currentOpts[key];
		const config = expected[0];
		if (config && config.element == "select") {
			const label = document.createElement("label");
			label.setAttribute("for", name);
			label.textContent = key + ": ";
			const input = document.createElement("select");
			input.setAttribute("name", name);
			input.setAttribute("id", name);
			for (const v of config.options) {
				const option = document.createElement("option");
				option.setAttribute("value", v);
				option.textContent = v;
				input.appendChild(option);
			}
			input.setAttribute("value", "NOO");
			root.appendChild(label);
			root.appendChild(input);
			root.appendChild(document.createElement("br"));
		} else if (config && config.element == "input") {
			const label = document.createElement("label");
			label.setAttribute("for", name);
			label.textContent = key + ": ";
			const input = document.createElement("input");
			input.setAttribute("name", name);
			input.setAttribute("id", name);
			input.value = config.default;
			input.setAttribute("type", config.type);
			root.appendChild(label);
			root.appendChild(input);
			root.appendChild(document.createElement("br"));
		} else {
			const nameEl = document.createElement("div");
			nameEl.textContent = key + ": ";
			nameEl.classList.add("name");
			root.appendChild(nameEl);
			const newRoot = document.createElement("div");
			root.appendChild(newRoot);
			addOpts(newRoot, expected, name + ".");
		}
	}
}

/** @param event {any} */
ws.onmessage = function (event) {
	var msg = JSON.parse(event.data);
	console.log(event.data);

	if (msg.type == "state") {
		const readerEl = document.getElementById("currentReader");
		if (readerEl) {
			readerEl.textContent = msg.data?.readerType ?? "unknown";
		}
	} else if (msg.type == "configurationOptions") {
		var opts = msg.data;
		var root = document.getElementById("configurationplace");
		if (root) {
			while (root.firstChild) {
				root.removeChild(root.firstChild);
			}
			addOpts(root, opts, "");
		}
	}
};

export default {};
