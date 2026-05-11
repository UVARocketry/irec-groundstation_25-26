<script lang="ts">
  import { T } from '@threlte/core';
  import { ContactShadows, OrbitControls } from '@threlte/extras';
  import RocketModel from './RocketModel.svelte';
</script>

<T.PerspectiveCamera makeDefault position={[15, 8, 15]} fov={35}>
  <OrbitControls 
    enableZoom={true} 
    target={[0, 0, 0]} enableDamping={true} 
  />
</T.PerspectiveCamera>

<T.DirectionalLight position={[5, 10, 5]} intensity={3} />
<T.AmbientLight intensity={1.5} />

<RocketModel />

<T.GridHelper args={[20, 20]} position.y={-5} />

<ContactShadows scale={15} blur={2} far={10} opacity={0.3} position.y={-8} />