<script lang="ts">
  // Svelte 5 Props Rune
  let { currentEvent = 'AwaitLaunch' } = $props();

  // Define the targeted visual phases
  // Not including some of the phases since they aren't critical for the slider
  const phases = [
    'AwaitLaunch',
    'MotorBurn',
    'Coast',
    'Parachute',
    'Landing'
  ];

  // Reactive state tracking for the active index
  let activeIndex = $state(0);
  
  $effect(() => {
    if (currentEvent === 'AwaitRecovery') {
      activeIndex = phases.length - 1; 
    } else {
      const foundIndex = phases.indexOf(currentEvent);
      // Fallback: Retain the previous state if an unknown event is received
      if (foundIndex !== -1) {
        activeIndex = foundIndex;
      }
    }
  });

  // Calculate the progress line width reactively
  let progressPercentage = $derived((activeIndex / (phases.length - 1)) * 100);
</script>

<div class="w-full px-12 h-16 flex items-start pt-2"> 
  <div class="relative w-full h-3 bg-slate-200 rounded-full"> 
    
    <div 
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
            {phase === 'AirbrakesDeploy' ? 'Coast' : phase}
          </span>

        </div>
      {/each}
    </div>
  </div>
</div>