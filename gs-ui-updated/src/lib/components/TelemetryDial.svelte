<script lang="ts">
  /* Using Svelte 5 $props for the data inputs */
  let { value = 0, min = 0, max = 100, title = "", unit = "" } = $props();

  // SVG Math for the circular arc
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Reactively calculate the progress stroke
  let progress = $derived.by(() => {
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return circumference * (1 - pct);
  });
</script>

<div class="flex flex-col items-center justify-center relative w-32 h-32">
  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" stroke-width="8" />
    
    <circle 
      cx="50" cy="50" r={radius} fill="none" stroke="var(--color-uva-orange)" stroke-width="8"
      stroke-dasharray={circumference}
      style="stroke-dashoffset: {progress}; transition: stroke-dashoffset 0.1s ease-out;"
      stroke-linecap="round"
    />
  </svg>
  
  <div class="absolute inset-0 flex flex-col items-center justify-center pt-2">
    <span class="text-[10px] font-black text-uva-blue uppercase leading-none">{title}</span>
    <span class="text-xl font-bold text-slate-900">{value.toFixed(0)}</span>
    <span class="text-[10px] font-bold text-slate-400 uppercase">{unit}</span>
  </div>
</div>