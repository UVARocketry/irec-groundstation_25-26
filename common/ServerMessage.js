export class ServerMessage {
    /** @type ("event"|"state") */
    type = "event";

    /** @type (string|object) */
    data = "";

    /**
     * @param {"event"|"state"} type
     * @param {string|object} data
     */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}
