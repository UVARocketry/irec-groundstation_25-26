<script lang="ts">
  import { T } from '@threlte/core';
  import { GLTF, useGltf, useDraco } from '@threlte/extras';
  import { Vector3, Quaternion } from 'three';
  import { telemetry } from '$lib/telemetry.svelte';
  import { untrack } from 'svelte';

  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
  const dracoLoader = useDraco(dracoPath);
  const gltf = useGltf('/models/sabreiii.glb', { dracoLoader });

  const rocketNoseDirection = new Vector3(0, 0, 1);
  const worldUp = new Vector3(0, 1, 0);

  const IS_TEST_LOG = true; 

  let currentQuaternion = $state(new Quaternion().setFromUnitVectors(rocketNoseDirection, worldUp));

  $effect(() => {
    if (!telemetry.data) return;

    untrack(() => {
      const raw = telemetry.data;
      const targetQuaternion = new Quaternion();

      const parachutePhases = ["Parachute", "Landing", "AwaitRecovery"];
      if (parachutePhases.includes(raw.event || '')) {
        const sidewaysDescentVector = new Vector3(0.9, 0.2, 0.0).normalize();
        targetQuaternion.setFromUnitVectors(rocketNoseDirection, sidewaysDescentVector);
      } 
      else {
        let target = new Vector3(
          raw.representativeAxis_x,
          raw.representativeAxis_z, 
          -raw.representativeAxis_y
        ).normalize();

        if (IS_TEST_LOG) {
          target = new Vector3(
            raw.representativeAxis_z, 
            -raw.representativeAxis_x, 
            -raw.representativeAxis_y
          ).normalize();
        }

        targetQuaternion.setFromUnitVectors(rocketNoseDirection, target);
      }

      currentQuaternion = currentQuaternion.clone().slerp(targetQuaternion, 0.25);
    });
  });
</script>

{#if $gltf}
  <T.Group 
    quaternion={[currentQuaternion.x, currentQuaternion.y, currentQuaternion.z, currentQuaternion.w]} 
    scale={5.5} 
    position.y={5} 
  >
    <GLTF url="/models/sabreiii.glb" {dracoLoader} castShadow />
  </T.Group>
{/if}