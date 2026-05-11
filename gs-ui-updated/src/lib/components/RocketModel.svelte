<script lang="ts">
  import { T } from '@threlte/core';
  import { GLTF, useGltf, useDraco } from '@threlte/extras';
  import { Vector3, Quaternion } from 'three';
  import { telemetry } from '$lib/telemetry.svelte';

  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
  const dracoLoader = useDraco(dracoPath);
  const gltf = useGltf('/models/sabreiii.glb', { dracoLoader });

  // Mesh nose is Z-forward (0,0,1)
  const rocketNoseDirection = new Vector3(0, 0, 1);
  const worldUp = new Vector3(0, 1, 0);

  let rocketRotation = $derived.by(() => {
    const quat = new Quaternion();

    // Pad Guard (Keep this as is, it works)
    const preFlightPhases = ["Startup", "AwaitGps", "AwaitLaunch"];
    if (!telemetry.data || preFlightPhases.includes(telemetry.currentEvent)) {
      return quat.setFromUnitVectors(rocketNoseDirection, worldUp);
    }

    // 2. THE FLIGHT MAPPING:
    // If the fins are up, we need to flip the Z component.
    // Changing 'telemetry.data.representativeAxis_z' to negative 
    // tells the engine that the nose is at the opposite end.
    const target = new Vector3(
      telemetry.data.representativeAxis_x,
      -telemetry.data.representativeAxis_z, // THE FLIP: Points the nose cone up
      -telemetry.data.representativeAxis_y
    ).normalize();

    return quat.setFromUnitVectors(rocketNoseDirection, target);
  });
</script>

{#if $gltf}
  <T.Group 
    quaternion={[rocketRotation.x, rocketRotation.y, rocketRotation.z, rocketRotation.w]} 
    scale={7.5} 
    position.y={0} 
  >
    <GLTF url="/models/sabreiii.glb" {dracoLoader} castShadow />
  </T.Group>
{/if}