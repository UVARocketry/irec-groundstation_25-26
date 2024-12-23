import { ServerMessage } from "../../common/ServerMessage.js";
import { Strings } from "./ansi.js";
import { resetMessageReader } from "./index.js";
/**@param {string} req */
export function handleUiRequest(req) {
    /** @type {ServerMessage} */
    var obj;
    try {
        obj = JSON.parse(req);
    } catch (e) {
        console.log(`${Strings.Error}: Invalid json packet from ui: ${req}`);
        return;
    }
    if (obj.type === "command") {
        if (typeof obj.data !== "string") {
            console.log(
                `${Strings.Warn}: commands must be a string, instead got type ${typeof obj.data}`,
            );
            return;
        }
        if (obj.data === "restart") {
            resetMessageReader();
        } else {
            console.log(
                `${Strings.Warn}: Unknown command message "${obj.data}"`,
            );
        }
    } else {
        console.log(
            `${Strings.Warn}: Unknown message request type "${obj.type}"`,
        );
    }
}
