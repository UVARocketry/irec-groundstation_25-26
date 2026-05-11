import { browser } from '$app/environment';

const WS_PORT = 42069; 

class TelemetryStore {
    data = $state<any>(null);
    currentEvent = $state<string>("disconnected");
    socket: WebSocket | null = null;

    constructor() {
        if (browser) {
            this.connect();
        }
    }

    connect() {
        const url = `ws://localhost:${WS_PORT}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            this.currentEvent = "connected";
            console.log("🚀 [GS-WS] Connected. Initializing Log Environment...");

            // 1. SET CONFIGURATION (Replacing "env log")
            // We tell the manager to point its reader to the ssl2 output folder
            this.sendJson("setConfiguration", {
                manager: {
                    readerConfig: {
                        dir: "../out_ssl2", // Match the path from your server logs
                        shouldSave: false
                    }
                }
            });

            // 2. RESTART (The actual command string)
            // Giving it a short delay to ensure the config is processed first
            setTimeout(() => {
                this.sendJson("command", "restart");
            }, 500);

            setTimeout(() => {
                this.sendJson("command", "restart");
            }, 1500);
        };

        this.socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "state") {
                    this.data = msg.data;
                    this.currentEvent = msg.data.event;
                }
            } catch (e) {
                console.error("[GS-WS] Parse error", e);
            }
        };

        this.socket.onclose = () => {
            this.currentEvent = "disconnected";
            setTimeout(() => this.connect(), 3000);
        };
    }

    /**
     * Replicates the ServerMessage constructor from your common/ServerMessage.js
     */
    sendJson(type: string, data: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            const message = { type, data };
            this.socket.send(JSON.stringify(message));
            console.log(`🛰️ [GS-WS] Sent ${type}:`, data);
        }
    }

    get missionTime() {
        // LogItem.js uses 'timeSinceLaunch' for the mission clock
        const raw = this.data?.timeSinceLaunch ?? 0;
        
        // Assuming the server sends this in milliseconds
        const totalSeconds = Math.floor(raw / 1000);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        
        return `${mins}:${secs}`;
    }
}

export const telemetry = new TelemetryStore();