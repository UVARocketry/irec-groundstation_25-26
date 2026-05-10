import { browser } from '$app/environment';
import type { LogItem } from '$lib/types';

export class TelemetryStore {
    // Reactive state using Svelte 5 Runes
    data = $state<LogItem | null>(null);
    connected = $state(false);
    
    private ws: WebSocket | null = null;

    connect(url: string = "ws://localhost:42069") {
        if (!browser || this.ws?.readyState === WebSocket.OPEN) return;

        this.ws = new WebSocket(url);
        this.ws.onopen = () => { this.connected = true; };
        this.ws.onclose = () => { 
            this.connected = false;
            setTimeout(() => this.connect(url), 2000); 
        };
        this.ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === "state") {
                this.data = msg.data;
            }
        };
    }

    sendCommand(cmd: string) {
        this.ws?.send(JSON.stringify({ type: "command", data: cmd }));
    }

    startMock() {
        this.connected = true;
        let alt = 0;
        this.startTimer(); // Ensure timer starts with mock

        setInterval(() => {
            alt += Math.random() * 60;
            const isBoost = alt < 8000;
            
            this.data = {
                timestamp_ms: Date.now(),
                event: isBoost ? "BOOST" : "COAST",
                kalmanPos_m_z: alt / 3.28,
                kalmanVel_mps_z: isBoost ? (150 + Math.random() * 20) : (80 - Math.random() * 10),
                obAcc_mps2_z: isBoost ? (45 + Math.random() * 5) : -9.8,
                // Mock GPS drifting slightly
                vnLat_deg: 32.9904 + (Math.random() * 0.0001),
                vnLon_deg: -106.9750 + (Math.random() * 0.0001),
                // Mock Battery draining 
                mainBat_pct: Math.max(0, 98 - (alt / 1000)),
                // Mock RSSI fluctuating
                rssi_dBm: -65 - Math.floor(Math.random() * 15),
                predictedApogee_m_agl: 10500 / 3.28,
                representativeAxis_x: 0,
                representativeAxis_y: Math.sin(Date.now() / 1000) * 0.1,
                representativeAxis_z: 1,
            } as any;
        }, 100);
    }

    // Inside TelemetryStore class
    missionTime = $state("00:00:00");
    private startTime: number | null = null;

    startTimer() {
        this.startTime = Date.now();
        setInterval(() => {
            if (!this.startTime) return;
            const diff = Date.now() - this.startTime;
            const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            this.missionTime = `${m}:${s}`; // Just M:S for layout
        }, 1000);
    }
}

// Global singleton so all pages share the same stream
export const telemetry = new TelemetryStore();