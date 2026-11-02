/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BusInstance } from './busModel';

export type CameraMode = 'driver' | 'chase' | 'passenger' | 'wheel';

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  mode: CameraMode;
  orbitYaw: number;
  orbitPitch: number;
  setMode: (mode: CameraMode) => void;
  lookLeft: () => void;
  lookRight: () => void;
  lookCenter: () => void;
  rotateOrbit: (deltaX: number, deltaY: number) => void;
  update: (delta: number, bus: BusInstance, busPos: THREE.Vector3, busRotY: number, speedKmh: number) => void;
}

export function createCameraRig(aspect: number): CameraRig {
  const camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1200);

  let mode: CameraMode = 'chase';
  let orbitYaw = 0;
  let orbitPitch = 0;
  let quickLookOffset = 0; // -1 for left mirror, +1 for right mirror, 0 for forward

  const chaseCamTarget = new THREE.Vector3();
  const currentCamPos = new THREE.Vector3(0, 5, -90);
  const currentLookAt = new THREE.Vector3(0, 2, -80);

  const setMode = (newMode: CameraMode) => {
    mode = newMode;
    orbitYaw = 0;
    orbitPitch = 0;
    quickLookOffset = 0;
  };

  const lookLeft = () => {
    quickLookOffset = -1.1; // Turn head left to check mirror
  };

  const lookRight = () => {
    quickLookOffset = 1.1; // Turn head right to check mirror and door
  };

  const lookCenter = () => {
    quickLookOffset = 0;
  };

  const rotateOrbit = (deltaX: number, deltaY: number) => {
    orbitYaw += deltaX * 0.005;
    orbitPitch = Math.max(-0.6, Math.min(0.6, orbitPitch + deltaY * 0.005));
  };

  const update = (
    delta: number,
    bus: BusInstance,
    busPos: THREE.Vector3,
    busRotY: number,
    speedKmh: number
  ) => {
    if (mode === 'driver') {
      // First-person Driver's Seat
      // World coordinates of driver head
      const headOffset = new THREE.Vector3(-0.65, 2.05, 4.3);
      headOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotY);
      const driverWorldPos = busPos.clone().add(headOffset);

      camera.position.copy(driverWorldPos);

      // Look forward through the windshield with slight speed zoom & head turns
      const effectiveYaw = busRotY + orbitYaw + quickLookOffset;
      const targetLook = new THREE.Vector3(
        driverWorldPos.x + Math.sin(effectiveYaw) * 15,
        driverWorldPos.y - 0.2 + orbitPitch * 10,
        driverWorldPos.z + Math.cos(effectiveYaw) * 15
      );
      camera.lookAt(targetLook);
    } else if (mode === 'chase') {
      // Third-person Follow / Chase Camera behind the bus
      const chaseDistance = 11.5 + Math.min(4.0, Math.abs(speedKmh) * 0.04);
      const chaseHeight = 4.6;

      const followYaw = busRotY + orbitYaw;
      const idealPos = new THREE.Vector3(
        busPos.x - Math.sin(followYaw) * chaseDistance,
        busPos.y + chaseHeight + orbitPitch * 6,
        busPos.z - Math.cos(followYaw) * chaseDistance
      );

      // Smooth camera spring damping
      currentCamPos.lerp(idealPos, Math.min(1.0, delta * 7.0));
      camera.position.copy(currentCamPos);

      const lookTarget = busPos.clone().add(new THREE.Vector3(0, 2.2, 0));
      currentLookAt.lerp(lookTarget, Math.min(1.0, delta * 9.0));
      camera.lookAt(currentLookAt);
    } else if (mode === 'passenger') {
      // Passenger Cabin view down the aisle
      const cabinOffset = new THREE.Vector3(0, 2.3, -2.5);
      cabinOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotY);
      const cabinWorldPos = busPos.clone().add(cabinOffset);
      camera.position.copy(cabinWorldPos);

      const forwardOffset = new THREE.Vector3(0, 1.9, 10);
      forwardOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotY + orbitYaw);
      camera.lookAt(busPos.clone().add(forwardOffset));
    } else {
      // Wheel / Road level view
      const wheelOffset = new THREE.Vector3(-1.6, 0.9, 3.8);
      wheelOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotY);
      camera.position.copy(busPos.clone().add(wheelOffset));

      const lookAhead = new THREE.Vector3(0, 0.8, 12);
      lookAhead.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotY);
      camera.lookAt(busPos.clone().add(lookAhead));
    }
  };

  return {
    camera,
    get mode() {
      return mode;
    },
    get orbitYaw() {
      return orbitYaw;
    },
    get orbitPitch() {
      return orbitPitch;
    },
    setMode,
    lookLeft,
    lookRight,
    lookCenter,
    rotateOrbit,
    update,
  };
}
