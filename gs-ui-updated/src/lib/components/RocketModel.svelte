<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { GLTF, useDraco } from '@threlte/extras';
  import { Vector3, Quaternion } from 'three';
  import { telemetry } from '$lib/telemetry.svelte';

  let { calculatedLanding = false } = $props();

  // --- DRACO DECODER SETUP ---
  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
  const dracoLoader = useDraco(dracoPath);

  // --- ORIENTATION MATH SYSTEM ---
  const rocketNoseDirection = new Vector3(0, 0, 1);
  const worldUp = new Vector3(0, 1, 0);

  const IS_TEST_LOG = true; 

  let currentQuaternion = $state(new Quaternion().setFromUnitVectors(rocketNoseDirection, worldUp));
  let targetQuaternion = new Quaternion();
  let elapsedTime = 0;

  // --- ANIMATION FRAME TICK TOCK ---
  useTask((delta) => {
    elapsedTime += delta;

    if (!telemetry.data) return;

    const raw = telemetry.data;
    const currentPhase = raw.event || 'Startup';
    const isLanded = calculatedLanding || currentPhase === "Landing" || currentPhase === "AwaitRecovery";

    if (isLanded) {
      // 1. Touchdown State: Snap flat and lock solid
      const flatOnGroundVector = new Vector3(0.95, 0.0, 0.0).normalize();
      targetQuaternion.setFromUnitVectors(rocketNoseDirection, flatOnGroundVector);
      currentQuaternion = currentQuaternion.clone().slerp(targetQuaternion, 0.15);
    } 
    else if (currentPhase === "Parachute") {
      // 2. Parachute State: Dynamic pendulum sway loop
      const swayX = 0.85 + Math.sin(elapsedTime * 1.2) * 0.08;
      const swayY = 0.25 + Math.cos(elapsedTime * 1.8) * 0.05;
      const swayZ = Math.sin(elapsedTime * 0.9) * 0.06;

      const dynamicDescentVector = new Vector3(swayX, swayY, swayZ);
      const rawIMUTwitch = new Vector3(
        raw.representativeAxis_x || 0,
        raw.representativeAxis_z || 0,
        -(raw.representativeAxis_y || 0)
      ).normalize();

      const blendedVector = new Vector3()
        .lerpVectors(dynamicDescentVector, rawIMUTwitch, 0.1)
        .normalize();

      targetQuaternion.setFromUnitVectors(rocketNoseDirection, blendedVector);
      currentQuaternion = currentQuaternion.clone().slerp(targetQuaternion, 0.12);
    } 
    else {
      // 3. Powered Ascent State: Live gyro tracking
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
      currentQuaternion = currentQuaternion.clone().slerp(targetQuaternion, 0.12);
    }
  });
</script>

<T.Group 
  quaternion={[currentQuaternion.x, currentQuaternion.y, currentQuaternion.z, currentQuaternion.w]} 
  scale={5.5} 
  position.y={5} 
>
  <GLTF url="/models/sabreiii.glb" {dracoLoader} castShadow />
</T.Group>