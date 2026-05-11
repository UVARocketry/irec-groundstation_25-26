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
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80">
            <div class="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-6"></div>
            
            <div class="text-center">
                <p class="text-red-500 font-black text-sm tracking-[0.5em] uppercase">No Signal</p>
                <p class="text-white/20 font-bold text-[10px] tracking-[0.3em] mt-2 uppercase">vtx offline // awaiting connection</p>
            </div>
        </div>
    {/if}
    <video 
        bind:this={video} 
        autoplay 
        muted 
        playsinline
        class="w-full h-full object-cover object-top transition-opacity duration-500 {hasSignal ? 'opacity-100' : 'opacity-0'}"
    ></video>
</div>
