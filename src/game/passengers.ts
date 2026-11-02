/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BusInstance } from './busModel';
import { BusStopZone } from './city';
import { audioSystem } from './audio';

export interface Passenger {
  id: string;
  mesh: THREE.Group;
  state: 'waiting_at_stop' | 'walking_to_bus' | 'walking_in_aisle' | 'seated' | 'exiting_bus' | 'left_stop';
  currentStopId: string;
  targetSeatIndex: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  walkCycle: number;
  outfitColor: number;
}

export interface PassengerSystem {
  group: THREE.Group;
  passengers: Passenger[];
  onboardCount: number;
  totalEarnings: number;
  passengerSatisfaction: number; // 0 - 100%
  update: (delta: number, bus: BusInstance, busPosition: THREE.Vector3, busRotationY: number, doorOpenAmount: number, currentNearStop: BusStopZone | null) => void;
  spawnPassengersForStop: (stop: BusStopZone) => void;
}

export function createPassengerSystem(busStops: BusStopZone[]): PassengerSystem {
  const group = new THREE.Group();
  group.name = 'PassengerSystem';

  const passengers: Passenger[] = [];
  let onboardCount = 0;
  let totalEarnings = 150; // Starting pocket cash
  let passengerSatisfaction = 100;

  // Varied Egyptian outfit colors (traditional galabeya white/grey/blue, modern casual navy/red/olive)
  const outfitPalettes = [
    0xf8fafc, // Galabeya white
    0x0284c7, // Light blue
    0x334155, // Charcoal slate
    0x15803d, // Olive green
    0xb45309, // Sandstone brown
    0x7c3aed, // Modern violet
    0xd97706, // Amber
  ];

  const skinTones = [0xd4a373, 0xbc6c25, 0xdda15e, 0xa98467];

  const createPassengerMesh = (outfitColor: number, skinTone: number): THREE.Group => {
    const pGroup = new THREE.Group();

    // Torso / Clothing
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.75, 8);
    const torsoMat = new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.8 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.95;
    pGroup.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.5;

    // Hair or cap
    const hairGeo = new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.52;
    pGroup.add(head, hair);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.12, 0.35, 0);
    leftLeg.name = 'leftLeg';

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.12, 0.35, 0);
    rightLeg.name = 'rightLeg';

    pGroup.add(leftLeg, rightLeg);
    pGroup.scale.set(0.9, 0.9, 0.9);
    return pGroup;
  };

  const spawnPassengersForStop = (stop: BusStopZone) => {
    // Spawn 2 to 4 waiting passengers at this stop
    const count = 3;
    for (let i = 0; i < count; i++) {
      const outfit = outfitPalettes[(passengers.length + i) % outfitPalettes.length];
      const skin = skinTones[(passengers.length + i) % skinTones.length];
      const mesh = createPassengerMesh(outfit, skin);

      const spawnPos = stop.waitingPassengerPositions[i % stop.waitingPassengerPositions.length].clone();
      spawnPos.x += (Math.random() - 0.5) * 0.8;
      spawnPos.z += (Math.random() - 0.5) * 0.8;

      mesh.position.copy(spawnPos);
      mesh.rotation.y = stop.direction + (Math.random() - 0.5) * 0.5;
      group.add(mesh);

      passengers.push({
        id: `p-${Date.now()}-${Math.random()}`,
        mesh,
        state: 'waiting_at_stop',
        currentStopId: stop.id,
        targetSeatIndex: -1,
        position: spawnPos,
        targetPosition: spawnPos.clone(),
        walkCycle: Math.random() * 10,
        outfitColor: outfit,
      });
    }
  };

  // Populate initial passengers at all stops
  busStops.forEach((stop) => {
    spawnPassengersForStop(stop);
  });

  const _v1 = new THREE.Vector3();
  const _v2 = new THREE.Vector3();

  const update = (
    delta: number,
    bus: BusInstance,
    busPosition: THREE.Vector3,
    busRotationY: number,
    doorOpenAmount: number,
    currentNearStop: BusStopZone | null
  ) => {
    // World coordinates of the bus entrance door
    // Door is at local (+1.3, 0.2, +4.6)
    const doorWorldPos = new THREE.Vector3(1.3, 0.2, 4.6);
    doorWorldPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotationY);
    doorWorldPos.add(busPosition);

    passengers.forEach((p) => {
      // 1. Waiting at stop
      if (p.state === 'waiting_at_stop') {
        p.mesh.position.copy(p.position);
        // Idle breathing / looking around
        p.walkCycle += delta * 1.5;
        p.mesh.rotation.y += Math.sin(p.walkCycle * 0.5) * 0.005;

        // If bus is stopped at THIS stop with door wide open (> 0.7)
        if (currentNearStop && currentNearStop.id === p.currentStopId && doorOpenAmount > 0.7) {
          // Find an empty seat
          const emptySeatIdx = bus.passengerSeats.findIndex((s) => !s.occupied);
          if (emptySeatIdx !== -1) {
            bus.passengerSeats[emptySeatIdx].occupied = true;
            p.targetSeatIndex = emptySeatIdx;
            p.state = 'walking_to_bus';
          }
        }
      }

      // 2. Walking towards the open bus door
      else if (p.state === 'walking_to_bus') {
        _v1.subVectors(doorWorldPos, p.position);
        const dist = _v1.length();

        // Animate legs
        p.walkCycle += delta * 8;
        const leftLeg = p.mesh.getObjectByName('leftLeg');
        const rightLeg = p.mesh.getObjectByName('rightLeg');
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(p.walkCycle) * 0.5;
          rightLeg.rotation.x = -Math.sin(p.walkCycle) * 0.5;
        }

        if (dist > 0.3) {
          _v1.normalize().multiplyScalar(delta * 1.8);
          p.position.add(_v1);
          p.mesh.position.copy(p.position);
          p.mesh.lookAt(doorWorldPos.x, p.position.y, doorWorldPos.z);
        } else {
          // Stepped onto the bus!
          p.state = 'walking_in_aisle';
          audioSystem.playCoinDing();
          onboardCount++;
          totalEarnings += 15; // +15 EGP fare
        }
      }

      // 3. Walking down the aisle inside the bus to their assigned seat
      else if (p.state === 'walking_in_aisle') {
        const seat = bus.passengerSeats[p.targetSeatIndex];
        if (!seat) {
          p.state = 'seated';
          return;
        }

        // Calculate world position of target seat
        const seatWorldPos = seat.position.clone();
        seatWorldPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), busRotationY);
        seatWorldPos.add(busPosition);

        _v2.subVectors(seatWorldPos, p.position);
        const dist = _v2.length();

        p.walkCycle += delta * 7;
        const leftLeg = p.mesh.getObjectByName('leftLeg');
        const rightLeg = p.mesh.getObjectByName('rightLeg');
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(p.walkCycle) * 0.4;
          rightLeg.rotation.x = -Math.sin(p.walkCycle) * 0.4;
        }

        if (dist > 0.25) {
          _v2.normalize().multiplyScalar(delta * 1.6);
          p.position.add(_v2);
          p.mesh.position.copy(p.position);
          p.mesh.lookAt(seatWorldPos.x, p.position.y, seatWorldPos.z);
        } else {
          // Sit down
          p.state = 'seated';
          // Attach to bus group so passenger turns and moves with the bus rigidly
          p.mesh.position.copy(seat.position);
          p.mesh.position.y -= 0.35; // Lower into sitting position
          p.mesh.rotation.set(0, 0, 0); // Face forward in bus

          // Fold legs in sitting pose
          if (leftLeg && rightLeg) {
            leftLeg.rotation.x = Math.PI / 2;
            rightLeg.rotation.x = Math.PI / 2;
          }
          group.remove(p.mesh);
          bus.group.add(p.mesh);
        }
      }

      // 4. Seated in bus
      else if (p.state === 'seated') {
        // Occasionally when bus reaches next station and door opens, passenger might alight
        if (currentNearStop && currentNearStop.id !== p.currentStopId && doorOpenAmount > 0.8 && Math.random() < 0.005) {
          p.state = 'exiting_bus';
          // Detach from bus back to world scene
          bus.group.remove(p.mesh);
          group.add(p.mesh);
          p.position.copy(doorWorldPos);
          p.mesh.position.copy(p.position);

          if (bus.passengerSeats[p.targetSeatIndex]) {
            bus.passengerSeats[p.targetSeatIndex].occupied = false;
          }
          onboardCount = Math.max(0, onboardCount - 1);
        }
      }

      // 5. Exiting bus onto the sidewalk
      else if (p.state === 'exiting_bus') {
        p.walkCycle += delta * 7;
        const leftLeg = p.mesh.getObjectByName('leftLeg');
        const rightLeg = p.mesh.getObjectByName('rightLeg');
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(p.walkCycle) * 0.5;
          rightLeg.rotation.x = -Math.sin(p.walkCycle) * 0.5;
        }

        // Walk away towards sidewalk
        p.position.x += delta * 1.5;
        p.mesh.position.copy(p.position);

        if (p.mesh.position.distanceTo(doorWorldPos) > 8) {
          p.state = 'left_stop';
          group.remove(p.mesh);
        }
      }
    });
  };

  return {
    group,
    passengers,
    get onboardCount() {
      return onboardCount;
    },
    get totalEarnings() {
      return totalEarnings;
    },
    get passengerSatisfaction() {
      return passengerSatisfaction;
    },
    update,
    spawnPassengersForStop,
  };
}
