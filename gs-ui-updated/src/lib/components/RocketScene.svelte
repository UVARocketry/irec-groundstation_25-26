<script lang="ts">
  import { T } from '@threlte/core';
  import { ContactShadows, OrbitControls } from '@threlte/extras';
  import RocketModel from './RocketModel.svelte';
</script>

<T.PerspectiveCamera makeDefault position={[6, 0, 6]} fov={35}>
  <OrbitControls 
    enableZoom={true} 
    target={[0, 0, 0]} 
    enableDamping={true} 
  />
</T.PerspectiveCamera>

<T.DirectionalLight position={[5, 10, 5]} intensity={3} />
<T.AmbientLight intensity={1.5} />

<RocketModel />

<T.GridHelper args={[10, 10]} />

<ContactShadows scale={10} blur={2} far={5} opacity={0.3} />