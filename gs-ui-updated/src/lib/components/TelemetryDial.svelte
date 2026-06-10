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

  // Derived display value to handle the "Accel" decimal requirement
  // Accel gets 2 decimal places, everything else (Alt/Vel) is a whole number
  let displayValue = $derived(
    title === "Accel" ? value.toFixed(2) : Math.round(value).toLocaleString()
  );
</script>

<div class="flex flex-col items-center justify-center relative w-32 h-32 group">
  <svg class="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" stroke-width="6" />
    
    <circle 
      cx="50" cy="50" r={radius} fill="none" 
      stroke="var(--color-uva-orange)" 
      stroke-width="8"
      stroke-dasharray={circumference}
      style="stroke-dashoffset: {progress}; transition: stroke-dashoffset 0.3s ease-out;"
      stroke-linecap="round"
    />
  </svg>
  
  <div class="absolute inset-0 flex flex-col items-center justify-center pt-1">
    <span class="text-[9px] font-black text-uva-blue/60 uppercase tracking-widest leading-none mb-1">
      {title}
    </span>
    
    <span class="text-2xl font-black text-uva-blue tabular-nums leading-none tracking-tighter">
      {displayValue}
    </span>
    
    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
      {unit}
    </span>
  </div>
</div>