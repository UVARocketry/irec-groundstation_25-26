import { browser } from '$app/environment';

const WS_PORT = 42069; 

// TOGGLE THIS: 
// true  -> Automatically forces the server to loop your test files.
// false -> Listens to raw live radio packets from the transceiver hardware.
const IS_SIMULATION_MODE = true; 

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
            console.log("🚀 [GS-WS] Connected to Ground Station Hub.");

            if (IS_SIMULATION_MODE) {
                console.log("📁 Simulation Mode: Overriding log configurations...");
                
                // 1. Point backend file reader to the test folder logs
                this.sendJson("setConfiguration", {
                    manager: {
                        readerConfig: {
                            dir: "../out_ssl2", 
                            shouldSave: false
                        }
                    }
                });

                // 2. Queue up the playback engine restarts
                setTimeout(() => {
                    this.sendJson("command", "restart");
                }, 500);

                setTimeout(() => {
                    this.sendJson("command", "restart");
                }, 1500);
            } else {
                console.log("📡 LIVE FLIGHT MODE ACTIVE: Awaiting hardware telemetry...");
            }
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

    sendJson(type: string, data: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            const message = { type, data };
            this.socket.send(JSON.stringify(message));
            console.log(`🛰️ [GS-WS] Sent ${type}:`, data);
        }
    }

    get missionTime() {
        const raw = this.data?.timeSinceLaunch ?? this.data?.timestamp_ms ?? 0;
        
        const totalSeconds = Math.floor(raw / 1000);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        
        return `${mins}:${secs}`;
    }
}

export const telemetry = new TelemetryStore();