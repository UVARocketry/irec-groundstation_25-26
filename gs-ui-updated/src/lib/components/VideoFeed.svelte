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
            console.warn("Hardware capture device not detected. Showing fallback standby view.");
            hasSignal = false;
        }
    });
</script>

<div class="relative w-full h-full bg-slate-100 flex items-center justify-center">
    {#if !hasSignal}
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
            <div class="w-14 h-14 border-4 border-slate-200 border-t-uva-orange rounded-full animate-spin mb-5"></div>
            
            <div class="text-center">
                <p class="text-uva-blue font-black text-xs tracking-[0.5em] uppercase">No Signal</p>
                <p class="text-slate-400 font-bold text-[9px] tracking-[0.25em] mt-2 uppercase">vtx offline // awaiting connectionk</p>
            </div>
        </div>
    {/if}
    
    <video 
        bind:this={video} 
        autoplay 
        muted 
        playsinline
        //  object-contain to preserve the native aspect ratio 
        class="w-full h-full object-cover object-center bg-slate-900 transition-opacity duration-500 {hasSignal ? 'opacity-100' : 'opacity-0'}"
    ></video>
</div>