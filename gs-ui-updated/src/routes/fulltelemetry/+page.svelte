<script lang="ts">
    import { onMount } from 'svelte';
    import { telemetry } from '$lib/telemetry.svelte';
    import { Canvas } from '@threlte/core';

    import PhaseSlider from '$lib/components/PhaseSlider.svelte';
    import RocketScene from '$lib/components/RocketScene.svelte';
    import TelemetryChart from '$lib/components/TelemetryChart.svelte';
    import uvaLogo from '$lib/assets/rocketry-split-v-logo.png';

    type ChartPoint = { time: number; alt: number; vel: number; accel: number; horizVel: number };
    let history = $state<ChartPoint[]>([]);
    
    const mtoft = 3.28084;

    let nearZeroDuration = 0; 
    let lastPacketTime: number | null = null;
    let calculatedLanding = $state(false);

    $effect(() => {
        const currentData = telemetry.data;
        
        if (currentData) {
            const packetTime = currentData.timeSinceLaunch !== undefined 
                ? currentData.timeSinceLaunch / 1000 
                : (currentData.timestamp_ms / 1000);

            const vx = currentData.kalmanVel_mps_x ?? 0;
            const vy = currentData.kalmanVel_mps_y ?? 0;
            const horizontalVelMps = Math.sqrt(vx * vx + vy * vy);

            const newPoint: ChartPoint = {
                time: packetTime,
                alt: (currentData.kalmanPos_m_z ?? 0) * mtoft,
                vel: (currentData.kalmanVel_mps_z ?? 0) * mtoft,
                accel: (currentData.obAcc_mps2_z ?? 0) / 9.81,
                horizVel: horizontalVelMps * mtoft 
            };

            if (history.length === 0 || history[history.length - 1].time !== newPoint.time) {
                history = [...history, newPoint].slice(-150);
            }

            // --- CALIBRATED CUSTOM LANDING FILTER ---
            const currentPhase = currentData.event ?? 'Startup';
            const flightIsDescending = ["Parachute", "Landing", "AwaitRecovery"].includes(currentPhase);

            if (flightIsDescending && !calculatedLanding) {
                const verticalVelAbs = Math.abs(newPoint.vel);
                const horizontalVelAbs = Math.abs(newPoint.horizVel);

                // 7.0 FPS threshold to absorb sensor noise & ground wind drift
                const VELOCITY_THRESHOLD_FPS = 7.0; 

                // Both vertical drop speed and horizontal drift must stay below the threshold
                if (verticalVelAbs < VELOCITY_THRESHOLD_FPS && horizontalVelAbs < VELOCITY_THRESHOLD_FPS) {
                    if (lastPacketTime !== null) {
                        const timeDelta = packetTime - lastPacketTime;
                        nearZeroDuration += timeDelta;
                    }
                } else {
                    // If a massive telemetry glitch spikes out of the 7 FPS box, reset the timer
                    nearZeroDuration = 0;
                }

                // Require 5 consecutive seconds of stability to officially declare touchdown
                if (nearZeroDuration >= 5.0) {
                    calculatedLanding = true;
                }
            }

            lastPacketTime = packetTime;
        }
    });
</script>

<main class="h-screen w-screen bg-slate-100 text-uva-blue font-mono grid grid-rows-[80px_1fr_120px] overflow-hidden">
  
  <header class="bg-uva-blue text-white flex items-center justify-between px-10 shadow-xl z-30">
    <div class="flex items-center gap-6">
      <img src={uvaLogo} alt="UVA" class="h-16 w-auto" />
      <div class="border-l-2 border-uva-orange/40 pl-6">
        <h1 class="text-2xl font-black tracking-tighter leading-none uppercase">University of Virginia</h1>
        <p class="text-sm text-uva-orange font-black uppercase tracking-[0.3em] mt-2">
          Team 99 // 10K COTS // SABRE III
        </p>
      </div>
    </div>

    <div class="flex items-center gap-10">
      <div class="text-right">
        <p class="text-[9px] text-uva-blue-light uppercase font-bold tracking-widest">Mission Time</p>
        <p class="text-3xl font-black text-uva-orange leading-none">+T:{telemetry.data ? telemetry.missionTime : '00:00'}</p>
      </div>

      <div class="text-right border-l border-white/20 pl-10">
          <p class="text-[9px] text-uva-blue-light uppercase font-bold tracking-widest">Current Phase</p>
          <p class="text-2xl font-black text-white uppercase tracking-tighter leading-none">
            {#if calculatedLanding}
                LANDING
            {:else if ['Startup', 'AwaitGps'].includes(telemetry.data?.event)}
                PRE-FLIGHT
            {:else}
                {telemetry.data?.event ?? 'OFFLINE'}
            {/if}
          </p>  
      </div>

      <div class="flex flex-col justify-center border-l border-white/20 pl-10 pr-4 min-w-[220px]">
          <p class="text-sm font-black text-white tabular-nums tracking-widest uppercase">
              {telemetry.data?.vnLat_deg?.toFixed(4) ?? '00.0000'}°N 
              <span class="text-white/40 mx-1">|</span>
              {telemetry.data?.vnLon_deg?.toFixed(4) ?? '00.0000'}°W
          </p>
          
          <div class="flex items-center justify-between mt-2 font-black tabular-nums text-xs uppercase">
              <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  <span class="text-white">BAT {telemetry.data?.mainBat_pct?.toFixed(0) ?? 0}%</span>
              </div>
              
              <div class="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  <span class="text-uva-orange-light">{telemetry.data?.rssi_dBm ?? 0} DBM</span>
              </div>
          </div>
      </div>
    </div>
  </header>

  <section class="grid grid-cols-[1fr_450px] min-h-0 overflow-hidden bg-slate-100">
    <div class="p-6 grid grid-cols-2 grid-rows-2 gap-4 min-h-0 overflow-y-auto">
        <div class="bg-white border-2 border-slate-200 p-4 rounded-xl flex flex-col relative shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-black tracking-wider text-slate-400 uppercase">Altitude History</span>
                <span class="text-xl font-black text-uva-orange font-mono">{((telemetry.data?.kalmanPos_m_z ?? 0) * mtoft).toFixed(0)} FT</span>
            </div>
            <TelemetryChart data={history} dataKey="alt" strokeColor="#e57200" unit="ft" />
        </div>

        <div class="bg-white border-2 border-slate-200 p-4 rounded-xl flex flex-col relative shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-black tracking-wider text-slate-400 uppercase">Vertical Velocity</span>
                <span class="text-xl font-black text-cyan-600 font-mono">{((telemetry.data?.kalmanVel_mps_z ?? 0) * mtoft).toFixed(1)} FPS</span>
            </div>
            <TelemetryChart data={history} dataKey="vel" strokeColor="#0891b2" unit="fps" />
        </div>

        <div class="bg-white border-2 border-slate-200 p-4 rounded-xl flex flex-col relative shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-black tracking-wider text-slate-400 uppercase">Z-Axis Acceleration</span>
                <span class="text-xl font-black text-emerald-600 font-mono">{((telemetry.data?.obAcc_mps2_z ?? 0) / 9.81).toFixed(2)} G</span>
            </div>
            <TelemetryChart data={history} dataKey="accel" strokeColor="#059669" unit="G" />
        </div>

        <div class="bg-white border-2 border-slate-200 p-4 rounded-xl flex flex-col relative shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-black tracking-wider text-slate-400 uppercase">Horizontal Velocity</span>
                <span class="text-xl font-black text-indigo-600 font-mono">
                    {(() => {
                        const vx = telemetry.data?.kalmanVel_mps_x ?? 0;
                        const vy = telemetry.data?.kalmanVel_mps_y ?? 0;
                        return (Math.sqrt(vx * vx + vy * vy) * mtoft).toFixed(1);
                    })()} FPS
                </span>
            </div>
            <TelemetryChart data={history} dataKey="horizVel" strokeColor="#4f46e5" unit="fps" />
        </div>
    </div>

    <div class="bg-white border-l-2 border-slate-200 flex flex-col min-h-0">
        <header class="w-full py-3 bg-slate-50 border-b-2 border-slate-200 text-center">
            <p class="text-xs font-black text-uva-blue uppercase tracking-[0.4em]">Live Orientation</p>
        </header>
        <div class="flex-1 w-full relative bg-gradient-to-b from-slate-50 to-white">
            <Canvas>
                <RocketScene />
            </Canvas>
        </div>
        <div class="p-4 bg-slate-50 border-t-2 border-slate-200 grid grid-cols-3 gap-3 font-mono text-[10px] text-slate-600">
            <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <p class="text-uva-blue font-black mb-1 text-[9px] tracking-wider opacity-60">IMU ACCEL</p>
                X: {telemetry.data?.obAcc_mps2_x?.toFixed(2) ?? '0.00'}<br/>
                Y: {telemetry.data?.obAcc_mps2_y?.toFixed(2) ?? '0.00'}<br/>
                Z: {telemetry.data?.obAcc_mps2_z?.toFixed(2) ?? '0.00'}
            </div>
            <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <p class="text-uva-blue font-black mb-1 text-[9px] tracking-wider opacity-60">KALMAN VEL</p>
                X: {telemetry.data?.kalmanVel_mps_x?.toFixed(1) ?? '0.0'}<br/>
                Y: {telemetry.data?.kalmanVel_mps_y?.toFixed(1) ?? '0.0'}<br/>
                Z: {telemetry.data?.kalmanVel_mps_z?.toFixed(1) ?? '0.0'}
            </div>
            <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <p class="text-uva-blue font-black mb-1 text-[9px] tracking-wider opacity-60">BARO STATE</p>
                TEMP: {telemetry.data?.baroTemperature_K ? (telemetry.data.baroTemperature_K - 273.15).toFixed(1) : '0.0'}°C<br/>
                APOGEE: {((telemetry.data?.apogee_m_agl ?? 0) * mtoft).toFixed(0)} FT
            </div>
        </div>
    </div>
  </section>

  <footer class="bg-white border-t-4 border-slate-200 grid grid-cols-[1fr_800px_1fr] items-center px-12 z-30 shadow-inner h-full">
    <div></div>
    <div class="w-full px-4">
      <PhaseSlider currentEvent={calculatedLanding ? 'Landing' : telemetry.data?.event} />
    </div>
    <div class="text-right">
      <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Station ID</p>
      <p class="text-3xl font-black text-uva-blue italic tracking-widest">KK7UTE</p>
    </div>
  </footer>
</main>