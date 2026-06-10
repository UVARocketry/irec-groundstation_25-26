<script lang="ts">
  import { T } from '@threlte/core';
  import { ContactShadows, OrbitControls } from '@threlte/extras';
  import RocketModel from './RocketModel.svelte';
  
  let { calculatedLanding = false } = $props();
</script>

<T.PerspectiveCamera makeDefault position={[20, 7, 20]} fov={35}>
  <OrbitControls 
    enableZoom={true} 
    target={[0, 3, 0]} 
    enableDamping={true} 
    dampingFactor={0.08}
    maxPolarAngle={Math.PI / 2} 
  />
</T.PerspectiveCamera>

<T.DirectionalLight position={[10, 20, 10]} intensity={2.5} castShadow />
<T.DirectionalLight position={[-10, 10, -10]} intensity={0.5} />
<T.AmbientLight intensity={0.8} />

<RocketModel {calculatedLanding} />

<T.GridHelper 
  args={[30, 10, '#475569', '#94a3b8']} 
  position.y={-3} 
  opacity={0.25}
  transparent={true}
/>

<T.GridHelper 
  args={[30, 30, '#cbd5e1', '#e2e8f0']} 
  position.y={-3.01} 
  opacity={0.4}
  transparent={true}
/>

<ContactShadows scale={20} blur={2.5} far={12} opacity={0.15} position.y={-2.98} />