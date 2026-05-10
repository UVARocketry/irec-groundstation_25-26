<script lang="ts">
  let { currentEvent = "IDLE", scale = 1 } = $props();
  const phases = ["LIFTOFF", "BOOST", "COAST", "APOGEE", "RECOVERY"];
  let activeIndex = $derived(phases.indexOf(currentEvent.toUpperCase()));
</script>

<div class="flex flex-col items-center w-full max-w-2xl transition-transform" style="transform: scale({scale})">
  <div class="relative w-full h-[4px] bg-slate-200 rounded-full flex justify-between items-center mb-2">
    <div 
      class="absolute left-0 top-0 h-full bg-uva-orange transition-all duration-700 shadow-[0_0_15px_rgba(229,114,0,0.6)]"
      style="width: {activeIndex < 0 ? 0 : (activeIndex / (phases.length - 1)) * 100}%"
    ></div>

    {#each phases as phase, i}
      <div class="relative">
        <div class="w-4 h-4 rounded-full border-2 transition-all duration-500
          {i <= activeIndex ? 'bg-uva-orange border-uva-orange scale-125' : 'bg-white border-slate-300'}">
        </div>
        <span class="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest
          {i === activeIndex ? 'text-uva-blue' : 'text-slate-400'}">
          {phase}
        </span>
      </div>
    {/each}
  </div>
</div>