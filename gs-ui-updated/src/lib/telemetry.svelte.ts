import { browser } from "$app/environment";
import { port } from "../../../common/web.js";

const WS_PORT = port;

class TelemetryStore {
    data = $state<any>(null);
    currentEvent = $state<string>("disconnected");
    socket: WebSocket | null = null;

    // CENTRALIZED LANDING STATE
    calculatedLanding = $state<boolean>(false);

    // Internal state variables for tracking noise stability windows
    #nearZeroDuration = 0;
    #lastPacketTime: number | null = null;

    constructor() {
        if (browser) {
            this.connect();
        }
    }

    connect() {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = window.location.hostname;
        const url = `${protocol}://${host}:${WS_PORT}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            this.currentEvent = "connected";
            console.log("🚀 [GS-WS] Connected to Ground Station.");
        };

        this.socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "state") {
                    this.data = msg.data;
                    this.currentEvent = msg.data.event;

                    // EXECUTE THE CALCULATED TOUCHDOWN GATING
                    this.updateLandingFilter();
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

    private updateLandingFilter() {
        if (!this.data) return;

        const mtoft = 3.28084;
        const VELOCITY_THRESHOLD_FPS = 7.0;
        const REQUIRED_STABLE_TIME_SEC = 5.0;

        const packetTime =
            this.data.timeSinceLaunch !== undefined
                ? this.data.timeSinceLaunch / 1000
                : this.data.timestamp_ms / 1000;

        const currentPhase = this.data.event ?? "Startup";
        const flightIsDescending = [
            "Parachute",
            "Landing",
            "AwaitRecovery",
        ].includes(currentPhase);

        // Only trigger a state rewrite during a reset if it isn't already false
        if (currentPhase === "Startup" || currentPhase === "AwaitLaunch") {
            if (this.calculatedLanding !== false)
                this.calculatedLanding = false;
            this.#nearZeroDuration = 0;
            this.#lastPacketTime = null;
            return;
        }

        if (flightIsDescending && !this.calculatedLanding) {
            const verticalVelAbs = Math.abs(
                (this.data.kalmanVel_mps_z ?? 0) * mtoft,
            );

            const vx = this.data.kalmanVel_mps_x ?? 0;
            const vy = this.data.kalmanVel_mps_y ?? 0;
            const horizontalVelAbs = Math.sqrt(vx * vx + vy * vy) * mtoft;

            if (
                verticalVelAbs < VELOCITY_THRESHOLD_FPS &&
                horizontalVelAbs < VELOCITY_THRESHOLD_FPS
            ) {
                if (this.#lastPacketTime !== null) {
                    const timeDelta = packetTime - this.#lastPacketTime;
                    if (timeDelta > 0) {
                        this.#nearZeroDuration += timeDelta;
                    }
                }
            } else {
                this.#nearZeroDuration = 0;
            }

            // Gatekeeper lock. Only write to the state rune ONCE when threshold passes
            if (this.#nearZeroDuration >= REQUIRED_STABLE_TIME_SEC) {
                this.calculatedLanding = true;
            }
        }

        this.#lastPacketTime = packetTime;
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
        const mins = Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, "0");
        const secs = (totalSeconds % 60).toString().padStart(2, "0");

        return `${mins}:${secs}`;
    }
}

export const telemetry = new TelemetryStore();
