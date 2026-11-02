/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createSpeedometerTexture, createDestinationBoardTexture } from './textures';

export interface BusConfig {
  bodyColor: 'black' | 'blue';
  tintLevel: 'dark' | 'medium';
  rimStyle: 'chrome' | 'gold' | 'black';
}

export interface BusInstance {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  doorGroup: THREE.Group;
  steeringWheelGroup: THREE.Group;
  wiperGroup: THREE.Group;
  speedometerMesh: THREE.Mesh;
  headlights: THREE.SpotLight[];
  headlightLensMeshes: THREE.Mesh[];
  taillightMeshes: THREE.Mesh[];
  leftBlinkerMeshes: THREE.Mesh[];
  rightBlinkerMeshes: THREE.Mesh[];
  interiorLights: THREE.PointLight[];
  cabinCameraAnchor: THREE.Object3D;
  chaseCameraAnchor: THREE.Object3D;
  passengerCameraAnchor: THREE.Object3D;
  passengerSeats: { position: THREE.Vector3; occupied: boolean; passengerMesh?: THREE.Group }[];
  wheels: THREE.Group[];
  update: (
    delta: number,
    speedKmh: number,
    steerAngle: number,
    doorOpenAmount: number,
    lightsOn: boolean,
    braking: boolean,
    blinkerState: 'none' | 'left' | 'right' | 'hazard',
    blinkerPhase: boolean,
    rpm: number,
    gear: string
  ) => void;
  setBodyColor: (color: 'black' | 'blue') => void;
}

export function createBus(config: BusConfig = { bodyColor: 'black', tintLevel: 'dark', rimStyle: 'chrome' }): BusInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'MohamedHaithamTourBus';

  // 1. Dimensions of modern large tourist coach bus
  const busLength = 12.0;
  const busWidth = 2.6;
  const busHeight = 3.4;
  const wheelRadius = 0.52;
  const wheelWidth = 0.32;
  const groundOffset = wheelRadius + 0.15; // Chassis height above ground

  // 2. Materials
  const blackBodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a0c10, // Glossy Black
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });

  const blueBodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7, // Royal Blue Coach
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });

  let currentBodyMat = config.bodyColor === 'blue' ? blueBodyMaterial : blackBodyMaterial;

  // Interior is BLACK
  const blackInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.85,
    metalness: 0.1,
  });

  const seatFabricMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430, // Dark graphite coach seating
    roughness: 0.8,
  });

  const chromeTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
  });

  const goldRimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });

  const darkRimMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.7,
    roughness: 0.3,
  });

  const selectedRimMat = config.rimStyle === 'gold' ? goldRimMat : config.rimStyle === 'black' ? darkRimMat : chromeTrimMat;

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.9,
    metalness: 0.05,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: config.tintLevel === 'dark' ? 0.45 : 0.65,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    depthWrite: false,
  });

  // 3. Primary Bus Chassis & Body
  const busBodyGroup = new THREE.Group();
  busBodyGroup.position.y = groundOffset;
  rootGroup.add(busBodyGroup);

  // Main coach shell
  const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight, busLength);
  const bodyMesh = new THREE.Mesh(bodyGeo, currentBodyMat);
  bodyMesh.position.y = busHeight / 2;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  busBodyGroup.add(bodyMesh);

  // Aerodynamic roof taper / AC units on roof
  const roofAcGeo = new THREE.BoxGeometry(busWidth * 0.75, 0.45, 2.5);
  const roofAcMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
  const roofAc1 = new THREE.Mesh(roofAcGeo, roofAcMat);
  roofAc1.position.set(0, busHeight + 0.22, 1.0);
  const roofAc2 = new THREE.Mesh(roofAcGeo, roofAcMat);
  roofAc2.position.set(0, busHeight + 0.22, -2.5);
  busBodyGroup.add(roofAc1, roofAc2);

  // 4. Windows (Front Windshield, Side Windows, Rear Window)
  // Large panoramic front windshield
  const windshieldGeo = new THREE.PlaneGeometry(busWidth * 0.92, 1.4);
  const frontWindshield = new THREE.Mesh(windshieldGeo, glassMat);
  frontWindshield.position.set(0, busHeight * 0.58, busLength / 2 + 0.02);
  busBodyGroup.add(frontWindshield);

  // Rear windshield
  const rearWindshield = new THREE.Mesh(new THREE.PlaneGeometry(busWidth * 0.85, 1.1), glassMat);
  rearWindshield.rotation.y = Math.PI;
  rearWindshield.position.set(0, busHeight * 0.6, -busLength / 2 - 0.02);
  busBodyGroup.add(rearWindshield);

  // Side panoramic windows
  const sideGlassGeo = new THREE.PlaneGeometry(busLength * 0.82, 1.15);
  const leftSideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
  leftSideGlass.rotation.y = Math.PI / 2;
  leftSideGlass.position.set(-busWidth / 2 - 0.02, busHeight * 0.6, -0.4);

  const rightSideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
  rightSideGlass.rotation.y = -Math.PI / 2;
  rightSideGlass.position.set(busWidth / 2 + 0.02, busHeight * 0.6, -0.4);
  busBodyGroup.add(leftSideGlass, rightSideGlass);

  // 5. LED Electronic Destination Matrix Display above windshield
  const ledTex = createDestinationBoardTexture('القاهرة - MOHAMED HAITHAM EXPRESS');
  const ledGeo = new THREE.PlaneGeometry(busWidth * 0.8, 0.32);
  const ledMat = new THREE.MeshBasicMaterial({ map: ledTex });
  const ledSign = new THREE.Mesh(ledGeo, ledMat);
  ledSign.position.set(0, busHeight * 0.86, busLength / 2 + 0.03);
  busBodyGroup.add(ledSign);

  // 6. Working Front Passenger Door (Pneumatic swing open)
  // Positioned on the right front side of the bus (Z ~ +4.6m, X = +busWidth/2)
  const doorWidth = 0.95;
  const doorHeight = 2.1;
  const doorGroup = new THREE.Group();
  doorGroup.position.set(busWidth / 2 + 0.01, 0.1, 4.6);

  const doorPanelGeo = new THREE.BoxGeometry(0.08, doorHeight, doorWidth);
  const doorMat = blackInteriorMat.clone();
  const doorPanel = new THREE.Mesh(doorPanelGeo, doorMat);
  doorPanel.position.set(0, doorHeight / 2, -doorWidth / 2);

  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth * 0.75, doorHeight * 0.5), glassMat);
  doorGlass.rotation.y = Math.PI / 2;
  doorGlass.position.set(0.05, doorHeight * 0.58, -doorWidth / 2);

  doorGroup.add(doorPanel);
  doorGroup.add(doorGlass);
  busBodyGroup.add(doorGroup);

  // 7. Interior Cabin (BLACK interior as required)
  // Floor and black ceiling
  const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(busWidth - 0.2, 0.1, busLength - 0.8), blackInteriorMat);
  interiorFloor.position.set(0, 0.7, 0);
  busBodyGroup.add(interiorFloor);

  // Driver cabin divider and dashboard
  const dashGeo = new THREE.BoxGeometry(1.0, 0.85, 0.85);
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.9 });
  const dashboard = new THREE.Mesh(dashGeo, dashMat);
  dashboard.position.set(-0.65, 1.25, 5.2);
  busBodyGroup.add(dashboard);

  // Animated Speedometer cluster
  const speedoTex = createSpeedometerTexture(0, 800, 'D');
  const speedoGeo = new THREE.PlaneGeometry(0.5, 0.25);
  const speedoMat = new THREE.MeshBasicMaterial({ map: speedoTex });
  const speedometerMesh = new THREE.Mesh(speedoGeo, speedoMat);
  speedometerMesh.rotation.x = -Math.PI / 4;
  speedometerMesh.position.set(-0.65, 1.55, 5.1);
  busBodyGroup.add(speedometerMesh);

  // Animated Driver's Steering Wheel
  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(-0.65, 1.5, 4.8);
  steeringWheelGroup.rotation.x = -Math.PI / 3;

  const wheelTorusGeo = new THREE.TorusGeometry(0.24, 0.024, 12, 32);
  const steeringMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.7 });
  const rimMesh = new THREE.Mesh(wheelTorusGeo, steeringMat);
  steeringWheelGroup.add(rimMesh);

  const spoke1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.44), steeringMat);
  spoke1.rotation.z = Math.PI / 2;
  steeringWheelGroup.add(spoke1);

  const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04), chromeTrimMat);
  centerCap.rotation.x = Math.PI / 2;
  steeringWheelGroup.add(centerCap);
  busBodyGroup.add(steeringWheelGroup);

  // Driver Seat
  const driverSeatGeo = new THREE.BoxGeometry(0.6, 0.8, 0.55);
  const driverSeat = new THREE.Mesh(driverSeatGeo, blackInteriorMat);
  driverSeat.position.set(-0.65, 1.15, 4.1);
  busBodyGroup.add(driverSeat);

  // Passenger Seats (Rows along the bus)
  const passengerSeats: { position: THREE.Vector3; occupied: boolean; passengerMesh?: THREE.Group }[] = [];
  const rows = 8;
  const seatGeo = new THREE.BoxGeometry(0.85, 0.85, 0.55);

  for (let r = 0; r < rows; r++) {
    const zPos = 3.2 - r * 1.05;
    // Left pair of seats
    const leftSeat = new THREE.Mesh(seatGeo, seatFabricMat);
    leftSeat.position.set(-0.75, 1.15, zPos);
    busBodyGroup.add(leftSeat);
    passengerSeats.push({
      position: new THREE.Vector3(-0.75, 1.6 + groundOffset, zPos),
      occupied: false,
    });

    // Right pair of seats (except near front entrance)
    if (r > 0) {
      const rightSeat = new THREE.Mesh(seatGeo, seatFabricMat);
      rightSeat.position.set(0.75, 1.15, zPos);
      busBodyGroup.add(rightSeat);
      passengerSeats.push({
        position: new THREE.Vector3(0.75, 1.6 + groundOffset, zPos),
        occupied: false,
      });
    }
  }

  // Aisle grab poles & ceiling handrails
  const poleMat = chromeTrimMat;
  for (let z = 3.0; z > -4.5; z -= 1.8) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2), poleMat);
    pole.position.set(0.28, 1.8, z);
    busBodyGroup.add(pole);
  }

  // 8. Working Windshield Wiper
  const wiperGroup = new THREE.Group();
  wiperGroup.position.set(-0.35, 1.6, busLength / 2 + 0.05);
  const wiperBlade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.02), new THREE.MeshBasicMaterial({ color: 0x111827 }));
  wiperBlade.position.y = 0.4;
  wiperGroup.add(wiperBlade);
  busBodyGroup.add(wiperGroup);

  // 9. Side Mirrors & Rearview Mirror
  const mirrorGeo = new THREE.BoxGeometry(0.08, 0.35, 0.22);
  const mirrorFrameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
  const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.95, roughness: 0.05 });

  // Left Side Mirror
  const leftMirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), mirrorFrameMat);
  leftMirrorArm.rotation.z = Math.PI / 3;
  leftMirrorArm.position.set(-busWidth / 2 - 0.2, 2.3, 5.3);
  const leftMirrorBox = new THREE.Mesh(mirrorGeo, mirrorFrameMat);
  leftMirrorBox.position.set(-busWidth / 2 - 0.38, 2.4, 5.35);
  const leftMirrorReflect = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.3), mirrorGlassMat);
  leftMirrorReflect.rotation.y = -Math.PI / 2;
  leftMirrorReflect.position.set(-busWidth / 2 - 0.33, 2.4, 5.35);
  busBodyGroup.add(leftMirrorArm, leftMirrorBox, leftMirrorReflect);

  // Right Side Mirror
  const rightMirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), mirrorFrameMat);
  rightMirrorArm.rotation.z = -Math.PI / 3;
  rightMirrorArm.position.set(busWidth / 2 + 0.2, 2.3, 5.3);
  const rightMirrorBox = new THREE.Mesh(mirrorGeo, mirrorFrameMat);
  rightMirrorBox.position.set(busWidth / 2 + 0.38, 2.4, 5.35);
  const rightMirrorReflect = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.3), mirrorGlassMat);
  rightMirrorReflect.rotation.y = Math.PI / 2;
  rightMirrorReflect.position.set(busWidth / 2 + 0.33, 2.4, 5.35);
  busBodyGroup.add(rightMirrorArm, rightMirrorBox, rightMirrorReflect);

  // 10. Wheels (2 front steered wheels, 4 rear dual wheels)
  const wheels: THREE.Group[] = [];
  const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
  wheelGeom.rotateZ(Math.PI / 2);

  const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 16);
  rimGeom.rotateZ(Math.PI / 2);

  // Front Left & Right Wheels
  const flWheel = new THREE.Group();
  flWheel.position.set(-busWidth / 2, 0, 3.8);
  const flTire = new THREE.Mesh(wheelGeom, tireMat);
  const flRim = new THREE.Mesh(rimGeom, selectedRimMat);
  flWheel.add(flTire, flRim);

  const frWheel = new THREE.Group();
  frWheel.position.set(busWidth / 2, 0, 3.8);
  const frTire = new THREE.Mesh(wheelGeom, tireMat);
  const frRim = new THREE.Mesh(rimGeom, selectedRimMat);
  frWheel.add(frTire, frRim);

  // Rear Left & Right Axle 1
  const rlWheel1 = new THREE.Group();
  rlWheel1.position.set(-busWidth / 2, 0, -2.8);
  const rlTire1 = new THREE.Mesh(wheelGeom, tireMat);
  const rlRim1 = new THREE.Mesh(rimGeom, selectedRimMat);
  rlWheel1.add(rlTire1, rlRim1);

  const rrWheel1 = new THREE.Group();
  rrWheel1.position.set(busWidth / 2, 0, -2.8);
  const rrTire1 = new THREE.Mesh(wheelGeom, tireMat);
  const rrRim1 = new THREE.Mesh(rimGeom, selectedRimMat);
  rrWheel1.add(rrTire1, rrRim1);

  // Rear Axle 2 (Tourist Coach Tag Axle)
  const rlWheel2 = new THREE.Group();
  rlWheel2.position.set(-busWidth / 2, 0, -4.1);
  const rlTire2 = new THREE.Mesh(wheelGeom, tireMat);
  const rlRim2 = new THREE.Mesh(rimGeom, selectedRimMat);
  rlWheel2.add(rlTire2, rlRim2);

  const rrWheel2 = new THREE.Group();
  rrWheel2.position.set(busWidth / 2, 0, -4.1);
  const rrTire2 = new THREE.Mesh(wheelGeom, tireMat);
  const rrRim2 = new THREE.Mesh(rimGeom, selectedRimMat);
  rrWheel2.add(rrTire2, rrRim2);

  busBodyGroup.add(flWheel, frWheel, rlWheel1, rrWheel1, rlWheel2, rrWheel2);
  wheels.push(flWheel, frWheel, rlWheel1, rrWheel1, rlWheel2, rrWheel2);

  // 11. Realistic Lighting: Headlights, Taillights, Turn Signals
  const headlights: THREE.SpotLight[] = [];
  const headlightLensMeshes: THREE.Mesh[] = [];
  const taillightMeshes: THREE.Mesh[] = [];
  const leftBlinkerMeshes: THREE.Mesh[] = [];
  const rightBlinkerMeshes: THREE.Mesh[] = [];

  const lightLensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tailLensMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
  const leftBlinkerMat = new THREE.MeshBasicMaterial({ color: 0x332200 });
  const rightBlinkerMat = new THREE.MeshBasicMaterial({ color: 0x332200 });

  // Front Headlight lenses
  [-0.95, 0.95].forEach((xPos) => {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), lightLensMat);
    lens.position.set(xPos, 0.75, busLength / 2 + 0.02);
    busBodyGroup.add(lens);
    headlightLensMeshes.push(lens);

    // Realistic spotlight projection on road
    const spot = new THREE.SpotLight(0xfffbeb, 0, 45, Math.PI / 5, 0.35, 1.2);
    spot.position.set(xPos, 0.8, busLength / 2 + 0.2);
    const target = new THREE.Object3D();
    target.position.set(xPos * 0.4, 0, busLength / 2 + 30);
    busBodyGroup.add(target);
    spot.target = target;
    busBodyGroup.add(spot);
    headlights.push(spot);
  });

  // Front Turn Signals (Blinkers)
  const leftFrontBlinker = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), leftBlinkerMat);
  leftFrontBlinker.position.set(-1.18, 0.75, busLength / 2 + 0.02);
  busBodyGroup.add(leftFrontBlinker);
  leftBlinkerMeshes.push(leftFrontBlinker);

  const rightFrontBlinker = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), rightBlinkerMat);
  rightFrontBlinker.position.set(1.18, 0.75, busLength / 2 + 0.02);
  busBodyGroup.add(rightFrontBlinker);
  rightBlinkerMeshes.push(rightFrontBlinker);

  // Rear Tail / Brake Lights
  [-0.95, 0.95].forEach((xPos) => {
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.04), tailLensMat);
    tailMesh.position.set(xPos, 1.1, -busLength / 2 - 0.02);
    busBodyGroup.add(tailMesh);
    taillightMeshes.push(tailMesh);
  });

  // Rear Blinkers
  const leftRearBlinker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.04), leftBlinkerMat);
  leftRearBlinker.position.set(-0.95, 1.38, -busLength / 2 - 0.02);
  busBodyGroup.add(leftRearBlinker);
  leftBlinkerMeshes.push(leftRearBlinker);

  const rightRearBlinker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.04), rightBlinkerMat);
  rightRearBlinker.position.set(0.95, 1.38, -busLength / 2 - 0.02);
  busBodyGroup.add(rightRearBlinker);
  rightBlinkerMeshes.push(rightRearBlinker);

  // Interior Soft Ambient Lights
  const interiorLights: THREE.PointLight[] = [];
  [-2.0, 1.5].forEach((zPos) => {
    const pl = new THREE.PointLight(0xfef08a, 0.4, 6);
    pl.position.set(0, 2.7, zPos);
    busBodyGroup.add(pl);
    interiorLights.push(pl);
  });

  // 12. Camera Anchors
  // First-Person Driver's Cabin Camera: looking out windshield from driver's seat
  const cabinCameraAnchor = new THREE.Object3D();
  cabinCameraAnchor.position.set(-0.65, 1.85 + groundOffset, 4.2);
  rootGroup.add(cabinCameraAnchor);

  // Third-Person Chase Camera: positioned smoothly behind and above the coach
  const chaseCameraAnchor = new THREE.Object3D();
  chaseCameraAnchor.position.set(0, 4.2 + groundOffset, -9.5);
  rootGroup.add(chaseCameraAnchor);

  // Passenger Cabin Camera: view down the center aisle
  const passengerCameraAnchor = new THREE.Object3D();
  passengerCameraAnchor.position.set(0, 2.1 + groundOffset, -2.5);
  rootGroup.add(passengerCameraAnchor);

  // 13. Update Function
  let currentDoorRotation = 0;
  let wiperAngle = 0;
  let lastSpeedoUpdate = 0;

  const update = (
    delta: number,
    speedKmh: number,
    steerAngle: number,
    doorOpenAmount: number,
    lightsOn: boolean,
    braking: boolean,
    blinkerState: 'none' | 'left' | 'right' | 'hazard',
    blinkerPhase: boolean,
    rpm: number,
    gear: string
  ) => {
    // Steer front wheels
    flWheel.rotation.y = steerAngle;
    frWheel.rotation.y = steerAngle;

    // Roll wheels based on speed
    const rollDelta = (speedKmh * 1000 / 3600 / wheelRadius) * delta;
    wheels.forEach((w) => {
      w.children[0].rotation.x += rollDelta;
      w.children[1].rotation.x += rollDelta;
    });

    // Rotate Steering wheel inside cabin (up to 450 degrees)
    steeringWheelGroup.rotation.z = -steerAngle * 4.0;

    // Smooth door animation (pivot open inward/backwards)
    currentDoorRotation = THREE.MathUtils.damp(currentDoorRotation, doorOpenAmount * (Math.PI / 2), 6, delta);
    doorGroup.rotation.y = currentDoorRotation;

    // Windshield wiper animation if raining
    if (lightsOn && Math.abs(speedKmh) > 0.1) {
      wiperAngle += delta * 6;
      wiperGroup.rotation.z = Math.sin(wiperAngle) * 0.75;
    } else {
      wiperGroup.rotation.z = THREE.MathUtils.damp(wiperGroup.rotation.z, 0, 4, delta);
    }

    // Update Headlights
    headlights.forEach((hl) => {
      hl.intensity = lightsOn ? 2.5 : 0;
    });
    headlightLensMeshes.forEach((m) => {
      (m.material as THREE.MeshBasicMaterial).color.setHex(lightsOn ? 0xffffff : 0x475569);
    });

    // Update Taillights (Red running lights + bright red brake lights)
    taillightMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshBasicMaterial;
      if (braking) {
        mat.color.setHex(0xff1111); // Bright red brake
      } else if (lightsOn) {
        mat.color.setHex(0x991b1b); // Soft tail
      } else {
        mat.color.setHex(0x2d0606); // Off
      }
    });

    // Update Blinkers
    const isLeftOn = blinkerPhase && (blinkerState === 'left' || blinkerState === 'hazard');
    const isRightOn = blinkerPhase && (blinkerState === 'right' || blinkerState === 'hazard');

    leftBlinkerMeshes.forEach((m) => {
      (m.material as THREE.MeshBasicMaterial).color.setHex(isLeftOn ? 0xf59e0b : 0x271900);
    });
    rightBlinkerMeshes.forEach((m) => {
      (m.material as THREE.MeshBasicMaterial).color.setHex(isRightOn ? 0xf59e0b : 0x271900);
    });

    // Interior lights on when night/lightsOn or doors open
    const interiorOn = lightsOn || doorOpenAmount > 0.1;
    interiorLights.forEach((pl) => {
      pl.intensity = interiorOn ? 0.6 : 0.05;
    });

    // Throttle speedometer texture update to ~15fps to conserve GPU
    const now = performance.now();
    if (now - lastSpeedoUpdate > 70) {
      lastSpeedoUpdate = now;
      const newSpeedoTex = createSpeedometerTexture(speedKmh, rpm, gear);
      (speedometerMesh.material as THREE.MeshBasicMaterial).map = newSpeedoTex;
      (speedometerMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  };

  const setBodyColor = (color: 'black' | 'blue') => {
    currentBodyMat = color === 'blue' ? blueBodyMaterial : blackBodyMaterial;
    bodyMesh.material = currentBodyMat;
  };

  return {
    group: rootGroup,
    bodyMesh,
    doorGroup,
    steeringWheelGroup,
    wiperGroup,
    speedometerMesh,
    headlights,
    headlightLensMeshes,
    taillightMeshes,
    leftBlinkerMeshes,
    rightBlinkerMeshes,
    interiorLights,
    cabinCameraAnchor,
    chaseCameraAnchor,
    passengerCameraAnchor,
    passengerSeats,
    wheels,
    update,
    setBodyColor,
  };
}
