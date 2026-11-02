/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  createAsphaltTexture,
  createCurbTexture,
  createBuildingFacadeTexture,
  createBusStopSignTexture,
  createGasStationCanopyTexture,
} from './textures';

export interface BusStopZone {
  id: string;
  name: string;
  arabicName: string;
  position: THREE.Vector3;
  direction: number; // yaw angle
  shelterMesh: THREE.Group;
  waitingPassengerPositions: THREE.Vector3[];
  signMesh: THREE.Mesh;
}

export interface TrafficLightData {
  group: THREE.Group;
  position: THREE.Vector3;
  direction: 'north-south' | 'east-west';
  redLight: THREE.Mesh;
  yellowLight: THREE.Mesh;
  greenLight: THREE.Mesh;
  state: 'red' | 'yellow' | 'green';
}

export interface CityEnvironment {
  sceneGroup: THREE.Group;
  busStops: BusStopZone[];
  trafficLights: TrafficLightData[];
  gasStationZone: { position: THREE.Vector3; radius: number };
  collisionBoxes: THREE.Box3[];
  update: (delta: number) => void;
}

export function createEgyptianCity(): CityEnvironment {
  const sceneGroup = new THREE.Group();
  sceneGroup.name = 'EgyptianMetropolis';

  const busStops: BusStopZone[] = [];
  const trafficLights: TrafficLightData[] = [];
  const collisionBoxes: THREE.Box3[] = [];

  // Textures
  const asphaltTex = createAsphaltTexture();
  asphaltTex.repeat.set(4, 40);
  const curbTex = createCurbTexture();
  curbTex.repeat.set(20, 1);

  const resFacadeTex = createBuildingFacadeTexture('residential');
  resFacadeTex.repeat.set(2, 4);

  const glassFacadeTex = createBuildingFacadeTexture('glass');
  glassFacadeTex.repeat.set(2, 5);

  const hospitalTex = createBuildingFacadeTexture('hospital');
  const policeTex = createBuildingFacadeTexture('police');

  // Materials
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.85,
    metalness: 0.1,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xc4b59d, // Sandy warm sidewalk stone
    roughness: 0.9,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    map: curbTex,
    roughness: 0.7,
  });

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7, // Nile River blue
    roughness: 0.15,
    metalness: 0.2,
    transmission: 0.7,
    ior: 1.33,
  });

  // 1. Ground & Nile River Terrain
  const groundGeo = new THREE.PlaneGeometry(1200, 1200);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  sceneGroup.add(ground);

  // Nile River Channel on the East (X: 180 to 280, running Z: -600 to +600)
  const riverGeo = new THREE.PlaneGeometry(100, 1200);
  riverGeo.rotateX(-Math.PI / 2);
  const river = new THREE.Mesh(riverGeo, waterMat);
  river.position.set(230, -0.6, 0);
  sceneGroup.add(river);

  // Riverbanks and Corniche Promenade
  const bankGeo = new THREE.BoxGeometry(6, 1.2, 1200);
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
  const westBank = new THREE.Mesh(bankGeo, bankMat);
  westBank.position.set(177, 0, 0);
  const eastBank = new THREE.Mesh(bankGeo, bankMat);
  eastBank.position.set(283, 0, 0);
  sceneGroup.add(westBank, eastBank);

  // 2. Road Network (Grid layout with boulevards and highway)
  // Major Avenues:
  // North-South: Avenue 1 at X = -100, Avenue 2 at X = 0 (Central Boulevard), Avenue 3 at X = 100 (Corniche)
  // East-West: Street 1 at Z = -150, Street 2 at Z = 0 (Main Axis), Street 3 at Z = 150
  const roadWidth = 18;
  const sidewalkWidth = 4;

  const createRoadSegment = (x: number, z: number, length: number, isVertical: boolean) => {
    const geo = new THREE.PlaneGeometry(roadWidth, length);
    geo.rotateX(-Math.PI / 2);
    if (!isVertical) geo.rotateY(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, roadMat);
    mesh.position.set(x, 0.01, z);
    mesh.receiveShadow = true;
    sceneGroup.add(mesh);

    // Sidewalks on left and right
    const swGeo = new THREE.BoxGeometry(
      isVertical ? sidewalkWidth : length,
      0.22,
      isVertical ? length : sidewalkWidth
    );
    const offset = roadWidth / 2 + sidewalkWidth / 2;

    const sw1 = new THREE.Mesh(swGeo, sidewalkMat);
    sw1.position.set(isVertical ? x - offset : x, 0.1, isVertical ? z : z - offset);
    sw1.receiveShadow = true;

    const sw2 = new THREE.Mesh(swGeo, sidewalkMat);
    sw2.position.set(isVertical ? x + offset : x, 0.1, isVertical ? z : z + offset);
    sw2.receiveShadow = true;
    sceneGroup.add(sw1, sw2);

    // Egyptian yellow/black curb trim
    const curbGeo = new THREE.BoxGeometry(
      isVertical ? 0.3 : length,
      0.25,
      isVertical ? length : 0.3
    );
    const c1 = new THREE.Mesh(curbGeo, curbMat);
    c1.position.set(isVertical ? x - roadWidth / 2 : x, 0.12, isVertical ? z : z - roadWidth / 2);
    const c2 = new THREE.Mesh(curbGeo, curbMat);
    c2.position.set(isVertical ? x + roadWidth / 2 : x, 0.12, isVertical ? z : z + roadWidth / 2);
    sceneGroup.add(c1, c2);
  };

  // Main vertical boulevards
  createRoadSegment(-100, 0, 500, true);
  createRoadSegment(0, 0, 500, true);
  createRoadSegment(100, 0, 500, true);

  // Main horizontal streets
  createRoadSegment(0, -150, 420, false);
  createRoadSegment(0, 0, 420, false);
  createRoadSegment(0, 150, 420, false);

  // 3. Elevated Grand Nile Cable Bridge (East side, spanning X: 100 to X: 350 across the Nile River)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(225, 4.5, 0);

  // Road deck
  const bridgeDeckGeo = new THREE.BoxGeometry(180, 1.2, roadWidth);
  const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, roadMat);
  bridgeDeck.receiveShadow = true;
  bridgeGroup.add(bridgeDeck);

  // Bridge Pylons (Twin towers with cables)
  const pylonGeo = new THREE.BoxGeometry(4, 38, 3);
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
  const pylon1 = new THREE.Mesh(pylonGeo, pylonMat);
  pylon1.position.set(0, 18, -roadWidth / 2 - 2);
  const pylon2 = new THREE.Mesh(pylonGeo, pylonMat);
  pylon2.position.set(0, 18, roadWidth / 2 + 2);
  bridgeGroup.add(pylon1, pylon2);

  // Crossbeams & Cables
  const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(5, 3, roadWidth + 8), pylonMat);
  crossbeam.position.set(0, 32, 0);
  bridgeGroup.add(crossbeam);

  // Cables
  const cableMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  for (let c = -60; c <= 60; c += 15) {
    if (c === 0) continue;
    const cable1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c, 0.5, -roadWidth / 2),
        new THREE.Vector3(0, 32, -roadWidth / 2 - 1.5),
      ]),
      cableMat
    );
    const cable2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c, 0.5, roadWidth / 2),
        new THREE.Vector3(0, 32, roadWidth / 2 + 1.5),
      ]),
      cableMat
    );
    bridgeGroup.add(cable1, cable2);
  }

  // Guard rails
  const railGeo = new THREE.BoxGeometry(180, 1.1, 0.4);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
  const rail1 = new THREE.Mesh(railGeo, railMat);
  rail1.position.set(0, 1.0, -roadWidth / 2 + 0.2);
  const rail2 = new THREE.Mesh(railGeo, railMat);
  rail2.position.set(0, 1.0, roadWidth / 2 - 0.2);
  bridgeGroup.add(rail1, rail2);

  // Bridge Approach Ramps
  const rampGeo = new THREE.BoxGeometry(50, 1.0, roadWidth);
  const ramp1 = new THREE.Mesh(rampGeo, roadMat);
  ramp1.position.set(110, 2.2, 0);
  ramp1.rotation.z = 0.09;
  sceneGroup.add(ramp1);

  sceneGroup.add(bridgeGroup);

  // 4. Central Roundabout Plaza & Egyptian Obelisk
  const plazaGroup = new THREE.Group();
  plazaGroup.position.set(0, 0.2, 0);

  const plazaCurb = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.4, 32), curbMat);
  const plazaGrass = new THREE.Mesh(
    new THREE.CylinderGeometry(17.8, 17.8, 0.45, 32),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
  );
  plazaGroup.add(plazaCurb, plazaGrass);

  // Ancient Egyptian Obelisk with hieroglyphic bevels
  const obeliskBase = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 2.5, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
  );
  obeliskBase.position.y = 1.25;

  const obeliskShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 2.2, 22, 4),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6, metalness: 0.2 })
  );
  obeliskShaft.rotation.y = Math.PI / 4;
  obeliskShaft.position.y = 13.5;

  const obeliskPyramidion = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 3.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 })
  );
  obeliskPyramidion.rotation.y = Math.PI / 4;
  obeliskPyramidion.position.y = 26;

  plazaGroup.add(obeliskBase, obeliskShaft, obeliskPyramidion);

  // Egyptian Flag on Mast
  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
  );
  flagPole.position.set(8, 7, 0);
  const flagGeo = new THREE.PlaneGeometry(3.5, 2.2);
  const flagTexCanvas = document.createElement('canvas');
  flagTexCanvas.width = 128;
  flagTexCanvas.height = 80;
  const fctx = flagTexCanvas.getContext('2d')!;
  fctx.fillStyle = '#dc2626'; // Red
  fctx.fillRect(0, 0, 128, 27);
  fctx.fillStyle = '#ffffff'; // White
  fctx.fillRect(0, 27, 128, 26);
  fctx.fillStyle = '#000000'; // Black
  fctx.fillRect(0, 53, 128, 27);
  // Gold Eagle
  fctx.fillStyle = '#fbbf24';
  fctx.beginPath();
  fctx.arc(64, 40, 7, 0, Math.PI * 2);
  fctx.fill();

  const flagTex = new THREE.CanvasTexture(flagTexCanvas);
  const flagMesh = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide }));
  flagMesh.position.set(9.8, 12.5, 0);
  plazaGroup.add(flagPole, flagMesh);

  sceneGroup.add(plazaGroup);

  // 5. Buildings: Hospitals, Police Station, Malls, Residential Apartments
  const addBuilding = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    name: string
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    sceneGroup.add(mesh);

    // Add collision box to prevent bus driving through walls
    const box = new THREE.Box3().setFromObject(mesh);
    collisionBoxes.push(box);
    return mesh;
  };

  // Hospital Complex (North-West: X = -50, Z = 100)
  const hospitalMat = new THREE.MeshStandardMaterial({ map: hospitalTex, roughness: 0.6 });
  addBuilding(-55, 95, 42, 28, 38, hospitalMat, 'GeneralHospital');

  // Ambulance vehicle parked at emergency bay
  const ambGroup = new THREE.Group();
  ambGroup.position.set(-30, 0.9, 85);
  const ambBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.0, 5.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  const ambSiren = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  ambSiren.position.y = 1.1;
  ambGroup.add(ambBody, ambSiren);
  sceneGroup.add(ambGroup);

  // Police Station (South-West: X = -55, Z = -95)
  const policeMat = new THREE.MeshStandardMaterial({ map: policeTex, roughness: 0.5 });
  addBuilding(-55, -95, 38, 22, 34, policeMat, 'PoliceStation');

  // Police Patrol Car parked outside
  const policeCar = new THREE.Group();
  policeCar.position.set(-32, 0.75, -82);
  const polBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.4, 4.4),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2 })
  );
  const polSiren = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  polSiren.position.y = 0.8;
  policeCar.add(polBody, polSiren);
  sceneGroup.add(policeCar);

  // City Center Mall (North-East: X = 50, Z = 95)
  const mallMat = new THREE.MeshPhysicalMaterial({
    map: glassFacadeTex,
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 0.8,
  });
  addBuilding(55, 95, 46, 36, 40, mallMat, 'CapitalMall');

  // Gas Station (South-East: X = 45, Z = -95)
  const gasStationGroup = new THREE.Group();
  gasStationGroup.position.set(45, 0, -95);

  const canopyGeo = new THREE.BoxGeometry(26, 1.2, 18);
  const canopyTex = createGasStationCanopyTexture();
  const canopyMat = new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.4 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 5.2;

  // Canopy Pillars
  [-9, 9].forEach((px) => {
    [-6, 6].forEach((pz) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 5.2),
        new THREE.MeshStandardMaterial({ color: 0xd4d4d8 })
      );
      pillar.position.set(px, 2.6, pz);
      gasStationGroup.add(pillar);
    });
  });

  // Fuel Pumps (Diesel & Gas)
  [-6, 0, 6].forEach((px) => {
    const pumpGeo = new THREE.BoxGeometry(1.0, 2.1, 1.8);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(px, 1.05, 0);
    gasStationGroup.add(pump);
  });

  gasStationGroup.add(canopy);
  sceneGroup.add(gasStationGroup);

  const gasStationZone = {
    position: new THREE.Vector3(45, 0, -95),
    radius: 16,
  };

  // Residential Cairo apartment blocks around the perimeter
  const resMat = new THREE.MeshStandardMaterial({ map: resFacadeTex, roughness: 0.85 });
  const residentialCoords = [
    { x: -160, z: -100, w: 32, h: 35, d: 45 },
    { x: -160, z: 0, w: 34, h: 42, d: 48 },
    { x: -160, z: 100, w: 30, h: 32, d: 40 },
    { x: -55, z: -200, w: 40, h: 28, d: 32 },
    { x: 55, z: -200, w: 42, h: 36, d: 35 },
    { x: -55, z: 200, w: 38, h: 30, d: 32 },
    { x: 55, z: 200, w: 44, h: 44, d: 36 },
  ];

  residentialCoords.forEach((c, idx) => {
    const b = addBuilding(c.x, c.z, c.w, c.h, c.d, resMat, `Residential_${idx}`);

    // Satellite dishes and water tanks on roofs (Authentic Cairo skyline detail!)
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
    );
    dish.position.set(c.x + 3, c.h + 1, c.z + 4);
    dish.rotation.x = -0.4;
    sceneGroup.add(dish);

    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.0, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    tank.position.set(c.x - 4, c.h + 1, c.z - 3);
    sceneGroup.add(tank);
  });

  // 6. Egyptian Date Palms along the Corniche and Avenues
  const palmGroup = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

  const createPalm = (x: number, z: number) => {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    // Slightly curved trunk
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 6.5, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.25;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    palm.add(trunk);

    // Foliage fronds
    for (let f = 0; f < 8; f++) {
      const angle = (f / 8) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.9, 3.8, 4);
      frondGeo.rotateX(Math.PI / 3);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(0, 6.4, 0);
      frond.rotation.y = angle;
      palm.add(frond);
    }
    palmGroup.add(palm);
  };

  // Line palms along Corniche Avenue (X = 90 & 110)
  for (let z = -200; z <= 200; z += 25) {
    createPalm(88, z);
    createPalm(112, z);
  }
  sceneGroup.add(palmGroup);

  // 7. Street Lamps (Illuminated at night)
  const lampGroup = new THREE.Group();
  const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const createStreetLamp = (x: number, z: number, angle: number) => {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);
    lamp.rotation.y = angle;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.5), lampPoleMat);
    pole.position.y = 3.75;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), lampPoleMat);
    arm.position.set(1.1, 7.4, 0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lampBulbMat);
    bulb.position.set(2.0, 7.2, 0);

    const light = new THREE.PointLight(0xfef08a, 0.7, 18);
    light.position.set(2.0, 7.0, 0);

    lamp.add(pole, arm, bulb, light);
    lampGroup.add(lamp);
  };

  // Place streetlamps along main boulevard
  for (let z = -220; z <= 220; z += 40) {
    createStreetLamp(-roadWidth / 2 - 1.5, z, Math.PI / 2);
    createStreetLamp(roadWidth / 2 + 1.5, z, -Math.PI / 2);
  }
  sceneGroup.add(lampGroup);

  // 8. Functional Traffic Lights at key intersections
  const intersections = [
    { x: 0, z: -150 },
    { x: 0, z: 150 },
    { x: -100, z: 0 },
    { x: 100, z: 0 },
  ];

  intersections.forEach((inter) => {
    // 4 traffic lights per intersection
    const offsets = [
      { dx: -roadWidth / 2 - 1.2, dz: -roadWidth / 2 - 1.2, rot: 0, dir: 'north-south' as const },
      { dx: roadWidth / 2 + 1.2, dz: roadWidth / 2 + 1.2, rot: Math.PI, dir: 'north-south' as const },
      { dx: roadWidth / 2 + 1.2, dz: -roadWidth / 2 - 1.2, rot: -Math.PI / 2, dir: 'east-west' as const },
      { dx: -roadWidth / 2 - 1.2, dz: roadWidth / 2 + 1.2, rot: Math.PI / 2, dir: 'east-west' as const },
    ];

    offsets.forEach((off) => {
      const tlGroup = new THREE.Group();
      tlGroup.position.set(inter.x + off.dx, 0, inter.z + off.dz);
      tlGroup.rotation.y = off.rot;

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.5), lampPoleMat);
      pole.position.y = 2.75;

      const boxGeo = new THREE.BoxGeometry(0.6, 1.8, 0.5);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(0, 5.0, 0);

      const red = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      red.position.set(0, 5.5, 0.26);

      const yellow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), new THREE.MeshBasicMaterial({ color: 0x332200 }));
      yellow.position.set(0, 5.0, 0.26);

      const green = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), new THREE.MeshBasicMaterial({ color: 0x064e3b }));
      green.position.set(0, 4.5, 0.26);

      tlGroup.add(pole, box, red, yellow, green);
      sceneGroup.add(tlGroup);

      trafficLights.push({
        group: tlGroup,
        position: new THREE.Vector3(inter.x + off.dx, 0, inter.z + off.dz),
        direction: off.dir,
        redLight: red,
        yellowLight: yellow,
        greenLight: green,
        state: 'red',
      });
    });
  });

  // 9. Realistic Bus Stops with Shelters, Waiting Benches, and Parking Bays
  const stopConfigs = [
    {
      id: 'stop-1',
      name: 'Tahrir Central Station',
      arabicName: 'محطة ميدان التحرير المركزية',
      lineNumber: '101',
      x: roadWidth / 2 + 3.5,
      z: -40,
      rot: -Math.PI / 2,
    },
    {
      id: 'stop-2',
      name: 'Nile Corniche Promenade',
      arabicName: 'محطة كورنيش النيل والنافورة',
      lineNumber: '101',
      x: 100 + roadWidth / 2 + 3.5,
      z: 50,
      rot: -Math.PI / 2,
    },
    {
      id: 'stop-3',
      name: 'General Hospital Emergency',
      arabicName: 'محطة مستشفى الطوارئ العام',
      lineNumber: '202',
      x: -roadWidth / 2 - 3.5,
      z: 80,
      rot: Math.PI / 2,
    },
    {
      id: 'stop-4',
      name: 'Capital City Mall',
      arabicName: 'محطة سيتي سنتر مول والسينما',
      lineNumber: '202',
      x: 50 + roadWidth / 2 + 3.5,
      z: 110,
      rot: -Math.PI / 2,
    },
  ];

  stopConfigs.forEach((sc) => {
    const shelter = new THREE.Group();
    shelter.position.set(sc.x, 0.2, sc.z);
    shelter.rotation.y = sc.rot;

    // Glass & steel shelter canopy
    const canopyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.2, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    canopyMesh.position.set(0, 2.7, 0);

    const backGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 2.4),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, depthWrite: false })
    );
    backGlass.position.set(0, 1.4, -1.3);

    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.45, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    bench.position.set(0, 0.45, -0.6);

    // Support pillars
    [-2.8, 2.8].forEach((px) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.7),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
      );
      pillar.position.set(px, 1.35, -1.3);
      shelter.add(pillar);
    });

    shelter.add(canopyMesh, backGlass, bench);

    // Bus Stop Sign Post
    const signTex = createBusStopSignTexture(sc.arabicName, sc.lineNumber);
    const signPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    signPost.position.set(-3.6, 1.6, 0.8);
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.3),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(-3.6, 2.5, 0.8);
    shelter.add(signPost, signBoard);

    // Yellow bus parking box painted on road
    const stopBoxGeo = new THREE.PlaneGeometry(14, 3.8);
    stopBoxGeo.rotateX(-Math.PI / 2);
    const stopBoxMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.4,
    });
    const stopBox = new THREE.Mesh(stopBoxGeo, stopBoxMat);
    stopBox.position.set(sc.x - (sc.rot < 0 ? 5.5 : -5.5), 0.03, sc.z);
    sceneGroup.add(stopBox);

    sceneGroup.add(shelter);

    // Waiting passenger spots on sidewalk
    const waitingPassengerPositions = [
      new THREE.Vector3(sc.x - 1.2, 0.2, sc.z - 0.5),
      new THREE.Vector3(sc.x + 0.8, 0.2, sc.z - 0.4),
      new THREE.Vector3(sc.x + 1.8, 0.2, sc.z + 0.2),
      new THREE.Vector3(sc.x - 2.0, 0.2, sc.z + 0.1),
    ];

    busStops.push({
      id: sc.id,
      name: sc.name,
      arabicName: sc.arabicName,
      position: new THREE.Vector3(sc.x - (sc.rot < 0 ? 4.5 : -4.5), 0, sc.z),
      direction: sc.rot,
      shelterMesh: shelter,
      waitingPassengerPositions,
      signMesh: signBoard,
    });
  });

  // Traffic Light cycle manager
  let trafficTimer = 0;
  const update = (delta: number) => {
    trafficTimer += delta;
    // 16 second cycle: 7s green NS, 2s yellow NS, 7s green EW
    const cycle = trafficTimer % 18;

    trafficLights.forEach((tl) => {
      let activeColor: 'red' | 'yellow' | 'green' = 'red';
      if (tl.direction === 'north-south') {
        if (cycle < 7) activeColor = 'green';
        else if (cycle < 9) activeColor = 'yellow';
        else activeColor = 'red';
      } else {
        if (cycle >= 9 && cycle < 16) activeColor = 'green';
        else if (cycle >= 16) activeColor = 'yellow';
        else activeColor = 'red';
      }

      tl.state = activeColor;
      (tl.redLight.material as THREE.MeshBasicMaterial).color.setHex(activeColor === 'red' ? 0xef4444 : 0x270707);
      (tl.yellowLight.material as THREE.MeshBasicMaterial).color.setHex(activeColor === 'yellow' ? 0xeab308 : 0x2e2305);
      (tl.greenLight.material as THREE.MeshBasicMaterial).color.setHex(activeColor === 'green' ? 0x10b981 : 0x052e16);
    });
  };

  return {
    sceneGroup,
    busStops,
    trafficLights,
    gasStationZone,
    collisionBoxes,
    update,
  };
}
