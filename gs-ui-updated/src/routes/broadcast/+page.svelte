<script lang="ts">
    import { onMount } from 'svelte';
    import { telemetry } from '$lib/telemetry.svelte';
    import { Canvas } from '@threlte/core';

    import VideoFeed from '$lib/components/VideoFeed.svelte';
    import TelemetryDial from '$lib/components/TelemetryDial.svelte';
    import PhaseSlider from '$lib/components/PhaseSlider.svelte';
    import RocketScene from '$lib/components/RocketScene.svelte';

    import uvaLogo from '$lib/assets/rocketry-split-v-logo.png';

    onMount(() => {
        // Use this for testing without the ab board connected
        telemetry.startMock();
        telemetry.startTimer();

        // Use this to connect to a real telemetry server. Make sure to
        // Update this URL if your server uses a different port
        // telemetry.connect("ws://localhost:42069"); 
    });

    const mtoft = 3.28084;
</script>

<main class="h-screen w-screen bg-white text-uva-blue font-mono grid grid-rows-[90px_1fr_160px] overflow-hidden">
  
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
        <p class="text-3xl font-black text-uva-orange leading-none">+T:{telemetry.missionTime}</p>
      </div>

      <div class="text-right border-l border-white/20 pl-10">
        <p class="text-[9px] text-uva-blue-light uppercase font-bold tracking-widest">Current Phase</p>
        <p class="text-2xl font-black text-white uppercase tracking-tighter leading-none">
            {telemetry.data?.event ?? 'IDLE'}
        </p>
      </div>

      <div class="text-right border-l border-white/20 pl-10">
        <p class="text-[10px] font-bold text-white leading-none">
          {telemetry.data?.vnLat_deg.toFixed(4)}°N {telemetry.data?.vnLon_deg.toFixed(4)}°W
        </p>
        <div class="flex justify-end gap-3 text-[11px] font-black mt-1 uppercase">
          <span class="text-green-400">BAT {telemetry.data?.mainBat_pct.toFixed(0)}%</span>
          <span class="text-uva-orange-light">{telemetry.data?.rssi_dBm} dBm</span>
        </div>
      </div>
    </div>
  </header>

  <section class="grid grid-cols-[1fr_320px] bg-black overflow-hidden relative">
    <div class="relative flex items-center justify-center bg-zinc-950">
        <VideoFeed />
        <div class="absolute bottom-6 left-6 opacity-40">
            <p class="text-[10px] text-white font-black tracking-[0.4em]">KK7UTE</p>
        </div>
    </div>

    <div class="bg-slate-50 border-l-4 border-uva-blue flex flex-col items-center shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-10">
        <header class="w-full py-4 border-b border-slate-200 text-center">
            <p class="text-xs font-black text-uva-blue uppercase tracking-[0.4em]">Live Orientation</p>
        </header>

        <div class="flex-1 w-full bg-gradient-to-b from-slate-100 to-white">
            <Canvas>
                <RocketScene />
            </Canvas>
        </div>

        <footer class="w-full px-6 py-4 border-t border-slate-200">
            <p class="text-[10px] text-slate-400 font-bold uppercase mb-1 text-center tracking-widest">Est. Apogee</p>
            <p class="text-3xl font-black text-uva-blue text-center leading-none tracking-tighter">
                {((telemetry.data?.predictedApogee_m_agl ?? 0) * 3.28).toFixed(0)}<span class="text-sm ml-1 uppercase">ft</span>
            </p>
        </footer>
    </div>
  </section>

  <footer class="bg-white border-t-8 border-uva-blue grid grid-cols-[1.2fr_2fr_1.2fr] items-center px-12 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
    
    <div class="flex gap-6">
      <TelemetryDial title="Altitude" unit="ft" value={(telemetry.data?.kalmanPos_m_z ?? 0) * 3.28} max={11000} />
      <TelemetryDial title="Velocity" unit="fps" value={(telemetry.data?.kalmanVel_mps_z ?? 0) * 3.28} max={1000} />
    </div>

    <div class="flex flex-col items-center justify-center border-x-2 border-slate-100 h-full px-8">
      <PhaseSlider currentEvent={telemetry.data?.event} scale={1.2} />
    </div>

    <div class="flex items-center justify-end gap-10">
      <TelemetryDial title="Accel" unit="G" value={(telemetry.data?.obAcc_mps2_z ?? 0) / 9.81} max={15} />
      <div class="text-right">
        <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Station ID</p>
        <p class="text-3xl font-black text-uva-blue italic tracking-widest">KK7UTE</p>
      </div>
    </div>
  </footer>
</main>