<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import uvaLogo from "$lib/assets/rocketry-split-v-logo.png";
</script>

<main class="h-screen bg-uva-blue text-white flex flex-col items-center justify-center gap-8 font-mono relative overflow-hidden">
    
    <div class="absolute w-[500px] h-[500px] bg-uva-orange/10 rounded-full blur-[120px] -z-10"></div>

    <div class="flex flex-col items-center gap-4 z-10">
        <img src={uvaLogo} alt="UVA Rocketry" class="h-32 w-auto drop-shadow-2xl" />
        <div class="text-center">
            <h1 class="text-5xl font-black tracking-tighter uppercase leading-none">Sabre III</h1>
            <p class="text-uva-orange font-black tracking-[0.3em] text-sm mt-2">Ground Station Control</p>
        </div>
    </div>

    <div class="flex gap-6 z-10">
        <Button 
            href="/fulltelemetry" 
            variant="outline" 
            class="bg-transparent border-2 border-white text-white hover:bg-white hover:text-uva-blue px-8 h-12 font-bold uppercase tracking-widest transition-all"
        >
            Full Telemetry View
        </Button>

        <Button 
            href="/broadcast" 
            variant="outline"
            class="bg-uva-orange hover:bg-uva-orange/90 text-white px-8 h-12 font-bold uppercase tracking-widest shadow-xl shadow-black/20"
        >
            Live Broadcast View
        </Button>
    </div>

    <div class="flex flex-col items-center gap-1 opacity-50 z-10">
        <p class="text-s font-black uppercase tracking-widest">University of Virginia // Team 99</p>
        <p class="text-[12px] font-bold">IREC 2026 // 10K COTS COMPETITION</p>
    </div>
</main>