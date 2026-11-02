/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { TrafficLightData } from './city';

export interface TrafficVehicle {
  mesh: THREE.Group;
  type: 'microbus' | 'taxi' | 'sedan' | 'truck';
  position: THREE.Vector3;
  direction: 'north' | 'south' | 'east' | 'west';
  speed: number;
  targetSpeed: number;
  laneOffset: number;
  length: number;
  width: number;
  color: number;
  headlightLenses: THREE.Mesh[];
  taillightLenses: THREE.Mesh[];
}

export interface TrafficSystem {
  group: THREE.Group;
  vehicles: TrafficVehicle[];
  update: (delta: number, playerBusPos: THREE.Vector3, trafficLights: TrafficLightData[], lightsOn: boolean) => void;
}

export function createTrafficSystem(): TrafficSystem {
  const group = new THREE.Group();
  group.name = 'CityTrafficSystem';

  const vehicles: TrafficVehicle[] = [];

  // Vehicle body styles
  const createMicrobus = (): { mesh: THREE.Group; hl: THREE.Mesh[]; tl: THREE.Mesh[] } => {
    // Egyptian iconic Toyota HiAce microbus (White with blue side stripes)
    const vGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(2.1, 1.9, 5.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.25;

    // Iconic Egyptian blue side stripe
    const stripeGeo = new THREE.BoxGeometry(2.12, 0.28, 5.0);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.0;
    vGroup.add(body, stripe);

    // Windshield & windows
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.1 });
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.8), glassMat);
    windshield.position.set(0, 1.45, 2.61);
    vGroup.add(windshield);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    [
      [-1.05, 0.36, 1.6],
      [1.05, 0.36, 1.6],
      [-1.05, 0.36, -1.6],
      [1.05, 0.36, -1.6],
    ].forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      vGroup.add(w);
    });

    // Lights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const tlMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });

    const hl: THREE.Mesh[] = [];
    const tl: THREE.Mesh[] = [];

    [-0.7, 0.7].forEach((x) => {
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), hlMat);
      h.position.set(x, 0.85, 2.62);
      vGroup.add(h);
      hl.push(h);

      const t = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.05), tlMat);
      t.position.set(x, 0.9, -2.62);
      vGroup.add(t);
      tl.push(t);
    });

    return { mesh: vGroup, hl, tl };
  };

  const createTaxi = (): { mesh: THREE.Group; hl: THREE.Mesh[]; tl: THREE.Mesh[] } => {
    // Modern Cairo Taxi (White sedan with black and white checkerboard or Yellow/Black)
    const vGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.8, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.65;

    // Cabin roof
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.65, 2.4);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.3, -0.2);
    vGroup.add(body, cabin);

    // Roof Taxi Sign (Yellow taxi roof light)
    const signGeo = new THREE.BoxGeometry(0.6, 0.2, 0.25);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.72, -0.2);
    vGroup.add(sign);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    [
      [-0.95, 0.32, 1.3],
      [0.95, 0.32, 1.3],
      [-0.95, 0.32, -1.3],
      [0.95, 0.32, -1.3],
    ].forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      vGroup.add(w);
    });

    // Lights
    const hl: THREE.Mesh[] = [];
    const tl: THREE.Mesh[] = [];
    [-0.65, 0.65].forEach((x) => {
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      h.position.set(x, 0.65, 2.21);
      vGroup.add(h);
      hl.push(h);

      const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
      t.position.set(x, 0.68, -2.21);
      vGroup.add(t);
      tl.push(t);
    });

    return { mesh: vGroup, hl, tl };
  };

  const createSedan = (color: number): { mesh: THREE.Group; hl: THREE.Mesh[]; tl: THREE.Mesh[] } => {
    const vGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.75, 4.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.62;

    const cabinGeo = new THREE.BoxGeometry(1.65, 0.62, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.25, -0.2);
    vGroup.add(body, cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    [
      [-0.95, 0.32, 1.3],
      [0.95, 0.32, 1.3],
      [-0.95, 0.32, -1.3],
      [0.95, 0.32, -1.3],
    ].forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      vGroup.add(w);
    });

    const hl: THREE.Mesh[] = [];
    const tl: THREE.Mesh[] = [];
    [-0.65, 0.65].forEach((x) => {
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      h.position.set(x, 0.65, 2.16);
      vGroup.add(h);
      hl.push(h);

      const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
      t.position.set(x, 0.68, -2.16);
      vGroup.add(t);
      tl.push(t);
    });

    return { mesh: vGroup, hl, tl };
  };

  // Spawn initial traffic vehicles on road lanes
  const routes = [
    // Avenue 1 (X = -100)
    { start: new THREE.Vector3(-104, 0, -220), dir: 'north' as const, yaw: 0 },
    { start: new THREE.Vector3(-96, 0, 220), dir: 'south' as const, yaw: Math.PI },
    // Central Boulevard (X = 0)
    { start: new THREE.Vector3(-4.5, 0, -240), dir: 'north' as const, yaw: 0 },
    { start: new THREE.Vector3(-4.5, 0, 60), dir: 'north' as const, yaw: 0 },
    { start: new THREE.Vector3(4.5, 0, 240), dir: 'south' as const, yaw: Math.PI },
    { start: new THREE.Vector3(4.5, 0, -60), dir: 'south' as const, yaw: Math.PI },
    // Corniche Avenue (X = 100)
    { start: new THREE.Vector3(96, 0, -210), dir: 'north' as const, yaw: 0 },
    { start: new THREE.Vector3(104, 0, 210), dir: 'south' as const, yaw: Math.PI },
    // Street 1 (Z = -150)
    { start: new THREE.Vector3(-180, 0, -154.5), dir: 'east' as const, yaw: Math.PI / 2 },
    { start: new THREE.Vector3(180, 0, -145.5), dir: 'west' as const, yaw: -Math.PI / 2 },
    // Street 3 (Z = 150)
    { start: new THREE.Vector3(-180, 0, 145.5), dir: 'east' as const, yaw: Math.PI / 2 },
    { start: new THREE.Vector3(180, 0, 154.5), dir: 'west' as const, yaw: -Math.PI / 2 },
  ];

  routes.forEach((r, idx) => {
    let vehicleData;
    let type: TrafficVehicle['type'] = 'sedan';
    if (idx % 3 === 0) {
      type = 'microbus';
      vehicleData = createMicrobus();
    } else if (idx % 3 === 1) {
      type = 'taxi';
      vehicleData = createTaxi();
    } else {
      type = 'sedan';
      const colors = [0xdc2626, 0x1e293b, 0x475569, 0x0284c7, 0xca8a04];
      vehicleData = createSedan(colors[idx % colors.length]);
    }

    vehicleData.mesh.position.copy(r.start);
    vehicleData.mesh.rotation.y = r.yaw;
    group.add(vehicleData.mesh);

    vehicles.push({
      mesh: vehicleData.mesh,
      type,
      position: r.start.clone(),
      direction: r.dir,
      speed: 8 + Math.random() * 4,
      targetSpeed: 10 + Math.random() * 3,
      laneOffset: 0,
      length: type === 'microbus' ? 5.2 : 4.4,
      width: 2.1,
      color: 0xffffff,
      headlightLenses: vehicleData.hl,
      taillightLenses: vehicleData.tl,
    });
  });

  const update = (delta: number, playerBusPos: THREE.Vector3, trafficLights: TrafficLightData[], lightsOn: boolean) => {
    vehicles.forEach((v) => {
      // 1. Check for traffic light ahead
      let shouldStop = false;
      const stopDistance = 14;

      for (const tl of trafficLights) {
        if (tl.state === 'red' || tl.state === 'yellow') {
          const dist = v.position.distanceTo(tl.position);
          if (dist < stopDistance) {
            // Check if light is in front of vehicle
            if (
              (v.direction === 'north' && tl.position.z > v.position.z) ||
              (v.direction === 'south' && tl.position.z < v.position.z) ||
              (v.direction === 'east' && tl.position.x > v.position.x) ||
              (v.direction === 'west' && tl.position.x < v.position.x)
            ) {
              shouldStop = true;
              break;
            }
          }
        }
      }

      // 2. Check for player's bus in front
      const distToBus = v.position.distanceTo(playerBusPos);
      if (distToBus < 12) {
        if (
          (v.direction === 'north' && playerBusPos.z > v.position.z && Math.abs(playerBusPos.x - v.position.x) < 3.5) ||
          (v.direction === 'south' && playerBusPos.z < v.position.z && Math.abs(playerBusPos.x - v.position.x) < 3.5) ||
          (v.direction === 'east' && playerBusPos.x > v.position.x && Math.abs(playerBusPos.z - v.position.z) < 3.5) ||
          (v.direction === 'west' && playerBusPos.x < v.position.x && Math.abs(playerBusPos.z - v.position.z) < 3.5)
        ) {
          shouldStop = true;
        }
      }

      // Accelerate or decelerate smoothly
      const desiredSpeed = shouldStop ? 0 : v.targetSpeed;
      v.speed = THREE.MathUtils.damp(v.speed, desiredSpeed, 4, delta);

      // Move along direction
      const step = v.speed * delta;
      if (v.direction === 'north') {
        v.position.z += step;
        if (v.position.z > 250) v.position.z = -250;
      } else if (v.direction === 'south') {
        v.position.z -= step;
        if (v.position.z < -250) v.position.z = 250;
      } else if (v.direction === 'east') {
        v.position.x += step;
        if (v.position.x > 210) v.position.x = -210;
      } else if (v.direction === 'west') {
        v.position.x -= step;
        if (v.position.x < -210) v.position.x = 210;
      }

      v.mesh.position.copy(v.position);

      // Taillights brighten when braking/stopping
      const isBraking = v.speed < 1.0;
      v.taillightLenses.forEach((tl) => {
        (tl.material as THREE.MeshBasicMaterial).color.setHex(isBraking ? 0xef4444 : lightsOn ? 0x991b1b : 0x220505);
      });

      // Headlights on when night
      v.headlightLenses.forEach((hl) => {
        (hl.material as THREE.MeshBasicMaterial).color.setHex(lightsOn ? 0xffffff : 0x64748b);
      });
    });
  };

  return {
    group,
    vehicles,
    update,
  };
}
