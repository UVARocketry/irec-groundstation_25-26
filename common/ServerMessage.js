/**
 * @typedef {"event"|"state"|"command"} EventType
 */

export class ServerMessage {
    /** @type EventType */
    type = "event";

    /** @type (string|object) */
    data = "";

    /**
     * @param {EventType} type
     * @param {string|object} data
     */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}
