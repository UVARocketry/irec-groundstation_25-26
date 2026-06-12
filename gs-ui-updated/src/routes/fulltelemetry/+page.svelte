<script lang="ts">
	import { telemetry } from '$lib/telemetry.svelte';
	import { Canvas } from '@threlte/core';

	import PhaseSlider from '$lib/components/PhaseSlider.svelte';
	import RocketScene from '$lib/components/RocketScene.svelte';
	import TelemetryChart from '$lib/components/TelemetryChart.svelte';
	import uvaLogo from '$lib/assets/rocketry-split-v-logo.png';

	type ChartPoint = { time: number; alt: number; vel: number; accel: number; horizVel: number };
	let history = $state<ChartPoint[]>([]);
	let refTime = $state<number | null>(null);

	const mtoft = 3.28084;

	// Temporary mapping for displaying Coast instead of AirbrakesDeploy
	const phaseDisplayMap: Record<string, string> = {
		AirbrakesDeploy: 'Coast'
	};

	// STREAMLINED: Keeps chart history running, deletes duplicate noise filtering math
	$effect(() => {
		const currentData = telemetry.data;

		if (currentData) {
			const ts = currentData.timestamp_ms;
			if (refTime === null && ts != null) refTime = ts;
			const packetTime = refTime !== null && ts != null
				? (ts - refTime) / 1000
				: 0;

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
				history.push(newPoint);
				// history = [...history, newPoint].slice(-150);
			}
			while (history.length > 150) {
				history.shift();
			}
		}
	});
	function handleRestart() {
        history = [];   // Clears out the 150-point telemetry chart history array instantly
        refTime = null; // Forces the chart time tracking delta axis to start fresh back at zero
        telemetry.sendJson("command", "restart");
    }

    function handleSwitch() {
        history = [];   // Clears old hardware buffer paths
        refTime = null;
        telemetry.sendJson("command", "switch");
    }

    function handleStop() {
        telemetry.sendJson("command", "stop");
    }
</script>

<main
	class="grid h-screen w-screen grid-rows-[80px_1fr_120px] overflow-hidden bg-slate-100 font-mono text-uva-blue"
>
	<header class="z-30 flex items-center justify-between bg-uva-blue px-10 text-white shadow-xl">
		<div class="flex items-center gap-6">
			<img src={uvaLogo} alt="UVA" class="h-16 w-auto" />
			<div class="border-l-2 border-uva-orange/40 pl-6">
				<h1 class="text-2xl leading-none font-black tracking-tighter uppercase">
					University of Virginia
				</h1>
				<p class="mt-2 text-sm font-black tracking-[0.3em] text-uva-orange uppercase">
					Team 99 // 10K COTS // SABRE III
				</p>
			</div>
		</div>

		<div class="flex items-center gap-10">
			<div class="text-right">
				<p class="text-[9px] font-bold tracking-widest text-uva-blue-light uppercase">
					Mission Time
				</p>
				<p class="text-3xl leading-none font-black text-uva-orange">
					+T:{telemetry.data ? telemetry.missionTime : '00:00'}
				</p>
			</div>

			<div class="border-l border-white/20 pl-10 text-right">
				<p class="text-[9px] font-bold tracking-widest text-uva-blue-light uppercase">
					Current Phase
				</p>
			    <p class="text-2xl leading-none font-black tracking-tighter text-white uppercase">
					{#if telemetry.calculatedLanding}
						LANDING
					{:else if ['Startup', 'AwaitGps', 'AwaitLaunch'].includes(telemetry.data?.event ?? 'Startup')}
						PRE-FLIGHT
					{:else}
						{phaseDisplayMap[telemetry.data?.event] ?? telemetry.data?.event ?? 'OFFLINE'}
					{/if}
				</p>	
			</div>

			<div class="flex min-w-[220px] flex-col justify-center border-l border-white/20 pr-4 pl-10">
				<p class="text-sm font-black tracking-widest text-white uppercase tabular-nums">
					{telemetry.data?.vnLat_deg?.toFixed(4) ?? '00.0000'}°N
					<span class="mx-1 text-white/40">|</span>
					{telemetry.data?.vnLon_deg?.toFixed(4) ?? '00.0000'}°W
				</p>

				<div
					class="mt-2 flex items-center justify-between text-xs font-black uppercase tabular-nums"
				>
					<div class="flex items-center gap-2">
						<div
							class="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
						></div>
						<span class="text-white">BAT {telemetry.data?.mainBat_pct?.toFixed(0) ?? 0}%</span>
					</div>

					<div class="rounded border border-white/10 bg-white/10 px-2 py-0.5">
						<span class="text-uva-orange-light">{telemetry.data?.rssi_dBm ?? 0} DBM</span>
					</div>
				</div>
			</div>
		</div>
	</header>

	<section class="grid min-h-0 grid-cols-[1fr_450px] overflow-hidden bg-slate-100">
		<div class="grid min-h-0 grid-cols-2 grid-rows-2 gap-4 overflow-y-auto p-6">
			<div
				class="relative flex flex-col rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm"
			>
				<div class="mb-1 flex items-center justify-between">
					<span class="text-xs font-black tracking-wider text-slate-400 uppercase"
						>Altitude History</span
					>
					<span class="font-mono text-xl font-black text-uva-orange"
						>{((telemetry.data?.kalmanPos_m_z ?? 0) * mtoft).toFixed(0)} FT</span
					>
				</div>
				<TelemetryChart data={history} dataKey="alt" strokeColor="#e57200" unit="ft" />
			</div>

			<div
				class="relative flex flex-col rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm"
			>
				<div class="mb-1 flex items-center justify-between">
					<span class="text-xs font-black tracking-wider text-slate-400 uppercase"
						>Vertical Velocity</span
					>
					<span class="font-mono text-xl font-black text-cyan-600"
						>{((telemetry.data?.kalmanVel_mps_z ?? 0) * mtoft).toFixed(1)} FPS</span
					>
				</div>
				<TelemetryChart data={history} dataKey="vel" strokeColor="#0891b2" unit="fps" />
			</div>

			<div
				class="relative flex flex-col rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm"
			>
				<div class="mb-1 flex items-center justify-between">
					<span class="text-xs font-black tracking-wider text-slate-400 uppercase"
						>Z-Axis Acceleration</span
					>
					<span class="font-mono text-xl font-black text-emerald-600"
						>{((telemetry.data?.obAcc_mps2_z ?? 0) / 9.81).toFixed(2)} G</span
					>
				</div>
				<TelemetryChart data={history} dataKey="accel" strokeColor="#059669" unit="G" />
			</div>

			<div
				class="relative flex flex-col rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm"
			>
				<div class="mb-1 flex items-center justify-between">
					<span class="text-xs font-black tracking-wider text-slate-400 uppercase"
						>Horizontal Velocity</span
					>
					<span class="font-mono text-xl font-black text-indigo-600">
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

		<div class="flex min-h-0 flex-col border-l-2 border-slate-200 bg-white">
			<header class="w-full border-b-2 border-slate-200 bg-slate-50 py-3 text-center">
				<p class="text-xs font-black tracking-[0.4em] text-uva-blue uppercase">Live Orientation</p>
			</header>
			<div class="relative w-full flex-1 bg-gradient-to-b from-slate-50 to-white">
				<Canvas>
					<RocketScene calculatedLanding={telemetry.calculatedLanding} />
				</Canvas>
			</div>
			<div
				class="grid grid-cols-3 gap-3 border-t-2 border-slate-200 bg-slate-50 p-4 font-mono text-[10px] text-slate-600"
			>
				<div class="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
					<p class="mb-1 text-[9px] font-black tracking-wider text-uva-blue opacity-60">
						IMU ACCEL
					</p>
					X: {telemetry.data?.obAcc_mps2_x?.toFixed(2) ?? '0.00'}<br />
					Y: {telemetry.data?.obAcc_mps2_y?.toFixed(2) ?? '0.00'}<br />
					Z: {telemetry.data?.obAcc_mps2_z?.toFixed(2) ?? '0.00'}
				</div>
				<div class="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
					<p class="mb-1 text-[9px] font-black tracking-wider text-uva-blue opacity-60">
						KALMAN VEL
					</p>
					X: {telemetry.data?.kalmanVel_mps_x?.toFixed(1) ?? '0.0'}<br />
					Y: {telemetry.data?.kalmanVel_mps_y?.toFixed(1) ?? '0.0'}<br />
					Z: {telemetry.data?.kalmanVel_mps_z?.toFixed(1) ?? '0.0'}
				</div>
				<div class="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
					<p class="mb-1 text-[9px] font-black tracking-wider text-uva-blue opacity-60">
						BARO STATE
					</p>
					TEMP: {telemetry.data?.baroTemperature_C?.toFixed(1) ?? '0.0'}°C<br />
					APOGEE: {((telemetry.data?.apogee_m_agl ?? 0) * mtoft).toFixed(0)} FT
				</div>
			</div>
		</div>
	</section>

	<footer
        class="z-30 relative h-full w-full border-t-4 border-slate-200 bg-white px-8 shadow-inner flex items-center justify-center"
    >
        <div class="absolute left-8 top-1/2 -translate-y-1/2 w-[400px] flex flex-col gap-3.5 justify-center h-4/5">
            <div class="text-xs font-black tracking-wider text-slate-400 uppercase">
                SYSTEM ENV: 
                <span class="text-sm font-black text-uva-blue ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 tabular-nums">
                    {telemetry.data?.readerType ?? telemetry.data?.environment ?? telemetry.currentEvent}
                </span>
            </div>
            
            <div class="flex items-center gap-1">
                <button 
                    onclick={handleRestart}
                    class="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded border border-slate-300/70 transition-all tracking-wider shadow-sm"
                >
                    RESTART
                </button>
                <button 
                    onclick={handleSwitch}
                    class="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded border border-slate-300/70 transition-all tracking-wider shadow-sm"
                >
                    SWITCH MODE
                </button>
                <button 
                    onclick={handleStop}
                    class="bg-rose-50/50 hover:bg-rose-100 text-rose-700 active:scale-95 font-bold text-[10px] px-2.5 py-1.5 rounded border border-rose-200 transition-all tracking-wider shadow-sm"
                >
                    STOP
                </button>
            </div>
        </div>

        <div class="w-full max-w-3xl px-4 mx-auto">
			<PhaseSlider currentEvent={telemetry.calculatedLanding ? 'Landing' : (phaseDisplayMap[telemetry.data?.event] ?? telemetry.data?.event)} />
        </div>

        <div class="absolute right-8 top-1/2 -translate-y-1/2 w-[220px] text-right h-4/5 flex flex-col justify-center">
            <p class="mb-0.5 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Station ID
            </p>
            <p class="text-3xl font-black tracking-widest text-uva-blue italic">KK7UTE</p>
        </div>
    </footer>
</main>