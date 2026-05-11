<script lang="ts">
  let { currentEvent = "Startup", scale = 1 } = $props();

  const phases = [
    "AwaitLaunch",
    "MotorBurn",
    "AirbrakesDeploy",
    "Parachute",
    "Landing",
    "AwaitRecovery"
  ];

  let activeIndex = $derived(phases.indexOf(currentEvent));
  let progressPercentage = $derived(
    activeIndex === -1 ? 0 : (activeIndex / (phases.length - 1)) * 100
  );
</script>

<div class="w-full px-12"> <div class="relative w-full h-3 bg-slate-200 rounded-full"> <div 
      class="absolute top-0 left-0 h-full bg-uva-orange transition-all duration-1000 ease-in-out rounded-full shadow-[0_0_15px_rgba(229,114,0,0.4)]"
      style="width: {progressPercentage}%"
    ></div>

    <div class="absolute top-0 left-0 w-full h-full flex justify-between items-center">
      {#each phases as phase, i}
        <div class="relative flex flex-col items-center">
          <div 
            class="w-5 h-5 rounded-full border-4 transition-all duration-500
            {i <= activeIndex ? 'bg-uva-orange border-white scale-110' : 'bg-white border-slate-300'}"
          ></div>
          
          <span class="absolute top-8 text-sm font-black uppercase tracking-widest whitespace-nowrap
            {i === activeIndex ? 'text-uva-blue opacity-100' : 'text-slate-400 opacity-60'}">
            {phase}
          </span>
        </div>
      {/each}
    </div>
  </div>
</div>