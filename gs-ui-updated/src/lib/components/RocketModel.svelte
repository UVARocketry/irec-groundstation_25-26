<script lang="ts">
  import { T } from '@threlte/core';
  import { GLTF, useGltf, useDraco } from '@threlte/extras';

  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
  const dracoLoader = useDraco(dracoPath);
  const gltf = useGltf('/models/sabreiii.glb', { dracoLoader });
</script>

{#if $gltf}
  <T.Group rotation.x={-Math.PI / 2} scale={7.5} position.y={27.5}>
    
    <T.Group rotation.z={Date.now() / 2000}>
      <GLTF 
        url="/models/sabreiii.glb" 
        {dracoLoader} 
        castShadow 
      />
    </T.Group>
    
  </T.Group>
{/if}