<script lang="ts">
    import { onMount } from 'svelte';
    let video: HTMLVideoElement;
    let hasSignal = $state(false);

    onMount(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            hasSignal = true;
        } catch (e) {
            console.warn("Hardware not detected. Using placeholder.");
            hasSignal = false;
        }
    });
</script>

<div class="relative w-full h-full bg-zinc-900 flex items-center justify-center">
    {#if !hasSignal}
        <div class="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,#666,#666_10%,#444_10%,#444_20%)]"></div>
        <div class="z-10 flex flex-col items-center gap-2">
            <div class="w-12 h-12 border-4 border-t-red-600 border-zinc-700 rounded-full animate-spin"></div>
            <p class="text-zinc-500 font-mono text-xs tracking-[0.2em]">NO SIGNAL // VTX_OFFLINE</p>
        </div>
    {/if}
    <video bind:this={video} autoplay muted class="w-full h-full object-cover {hasSignal ? 'opacity-100' : 'opacity-0'}"></video>
</div>
