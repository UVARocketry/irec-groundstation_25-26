// Exports a function to handle a request from the UI
// The request is expected to be encoded as a JSON string that follows the type `ServerMessage` 
import { ServerMessage } from "../../common/ServerMessage.js";
import { Strings } from "./ansi.js";
import {
    broadcast,
    broadcastState,
    getReader,
    resetMessageReader,
    switchReader,
} from "./index.js";
import { log } from "./log.js";
/**@param {string} req */
export function handleUiRequest(req) {
    /** @type {ServerMessage} */
    var obj;
    try {
        obj = JSON.parse(req);
    } catch (e) {
        log(`${Strings.Error}: Invalid json packet from ui: ${req}`);
        return;
    }
    if (obj.type === "rename") {
        // @ts-ignore
        getReader().rename(obj.data);
        broadcastState();
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
            switchReader();
        } else if (obj.data === "getRenameData") {
            getReader()
                .getRenameOptions()
                .then((options) => {
                    /** @type {ServerMessage} */
                    const reply = new ServerMessage("renameResponse", options);
                    broadcast(reply);
                });
        } else {
            log(`${Strings.Warn}: Unknown command message "${obj.data}"`);
        }
    } else {
        log(`${Strings.Warn}: Unknown message request type "${obj.type}"`);
    }
}
