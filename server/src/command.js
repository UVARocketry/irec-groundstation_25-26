// Exports a function to handle a request from the UI
// The request is expected to be encoded as a JSON string that follows the type `ServerMessage`
import { ServerMessage } from "../../common/ServerMessage.js";
import { Strings } from "./ansi.js";
import {
	broadcast,
	broadcastState,
	getRootConfig,
	reconfigure,
	resetMessageReader,
} from "./index.js";
import { log } from "./log.js";
import readerManager from "./readerManager.js";
/**@param {string} req */
function handleUiRequest(req) {
	/** @type {ServerMessage} */
	var obj;
	try {
		obj = JSON.parse(req);
	} catch (e) {
		log(`${Strings.Error}: Invalid json packet from ui: ${req}`);
		return;
	}
	if (obj.type === "setConfiguration") {
		console.log("setConfiguration req");
		// @ts-ignore
		reconfigure(obj.data);
	} else if (obj.type === "command") {
		if (typeof obj.data !== "string") {
			log(
				`${Strings.Warn}: commands must be a string, instead got type ${typeof obj.data}`,
			);
			return;
		}
		if (obj.data === "restart") {
			resetMessageReader();
		} else if (obj.data === "switch") {
			readerManager.switchReader();
			broadcastState();
		} else if (obj.data === "getConfiguration") {
			getRootConfig()
				.getConfigOptions()
				.then((val) => {
					console.log(val);
					broadcast({
						type: "configuration",
						data: val,
					});
				});
		} else {
			log(`${Strings.Warn}: Unknown command message "${obj.data}"`);
		}
	} else {
		log(`${Strings.Warn}: Unknown message request type "${obj.type}"`);
	}
}

export default {
	handleUiRequest,
};
