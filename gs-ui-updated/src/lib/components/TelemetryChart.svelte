<script lang="ts">
  let { 
    data = [], 
    dataKey, 
    strokeColor = '#e57200', 
    unit = ''
  } = $props<{
    data: any[];
    dataKey: string;
    strokeColor?: string;
    unit?: string;
  }>();

  const width = 500;
  const height = 150; 
  const padding = { top: 10, bottom: 20, left: 60, right: 10 };

  // FIX: Convert chart properties into a unified derived object to avoid side-effect mutations
  let chartLayout = $derived.by(() => {
    // Default fallback position when offline with no data packets
    const defaultZeroY = height - padding.bottom;
    
    if (data.length < 2) {
      return { path: '', zeroY: defaultZeroY };
    }

    const times = data.map((p: { time: number; [key: string]: number }) => p.time);
    const vals = data.map((p: { [key: string]: number }) => p[dataKey]);

    const minX = Math.min(...times);
    const maxX = Math.max(...times);
    
    let minY = Math.min(...vals, 0);
    let maxY = Math.max(...vals, 1);

    if (Math.abs(maxY - minY) < 0.01) {
      minY -= 1;
      maxY += 1;
    }

    const getYPos = (val: number) => {
      const pctY = (val - minY) / (maxY - minY || 1);
      return height - padding.bottom - pctY * (height - padding.top - padding.bottom);
    };

    // Calculate the 0 line location safely within the closure bounds
    const computedZeroY = getYPos(0);

    const path = data.map((p: { time: number; [key: string]: number }, i: number) => {
      const pctX = (p.time - minX) / (maxX - minX || 1);
      const x = padding.left + pctX * (width - padding.left - padding.right);
      const y = getYPos(p[dataKey]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return { path, zeroY: computedZeroY };
  });

  const gridColor = '#e2e8f0';
  const axisColor = '#cbd5e1';
  const textColor = '#475569';
</script>

<div class="flex-1 w-full relative min-h-0 mt-1 bg-slate-50/70 rounded-lg p-2">
  <svg viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="none" class="overflow-visible">
    <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke={gridColor} stroke-dasharray="2 4" />
    <line x1={padding.left} y1={(height - padding.bottom + padding.top) / 2} x2={width - padding.right} y2={(height - padding.bottom + padding.top) / 2} stroke={gridColor} stroke-dasharray="2 4" />
    
    <line x1={padding.left} y1={chartLayout.zeroY} x2={width - padding.right} y2={chartLayout.zeroY} stroke={axisColor} stroke-width="2" />
    <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke={axisColor} stroke-width="1.5" />

    <text 
      x={padding.left - 10} 
      y={chartLayout.zeroY + 4} 
      text-anchor="end" 
      class="text-[13px] font-black font-mono tracking-tight" 
      fill={textColor}
    >
      0{unit}
    </text>

    {#if data.length >= 2}
      <path 
        d={chartLayout.path} 
        fill="none" 
        stroke={strokeColor} 
        stroke-width="2.5" 
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    {/if}
  </svg>
</div>