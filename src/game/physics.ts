/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface DrivingInput {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to +1 (right)
  handbrake: boolean;
  gear: 'D' | 'N' | 'R';
}

export interface BusPhysicsState {
  position: THREE.Vector3;
  rotationY: number;
  speedKmh: number;
  velocity: THREE.Vector3;
  steerAngle: number;
  rollAngle: number;
  pitchAngle: number;
  rpm: number;
  gear: 'D' | 'N' | 'R';
  fuel: number; // 0 to 100%
  isRefueling: boolean;
  distanceDrivenKm: number;
}

export class BusPhysicsEngine {
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, -80);
  private rotationY: number = 0; // Bus heading in radians
  private speedMs: number = 0; // Speed in meters per second
  private steerAngle: number = 0;
  private rollAngle: number = 0;
  private pitchAngle: number = 0;
  private rpm: number = 800;
  private fuel: number = 85.0; // 85% fuel initially
  private distanceDriven: number = 0;
  private lastState: BusPhysicsState = {
    position: new THREE.Vector3(0, 0, -80),
    rotationY: 0,
    speedKmh: 0,
    velocity: new THREE.Vector3(),
    steerAngle: 0,
    rollAngle: 0,
    pitchAngle: 0,
    rpm: 800,
    gear: 'D',
    fuel: 85,
    isRefueling: false,
    distanceDrivenKm: 0,
  };

  public getState(): BusPhysicsState {
    return this.lastState;
  }

  // Physical specifications of 12m modern tourist coach
  private readonly maxForwardSpeedMs: number = 28.0; // ~100 km/h
  private readonly maxReverseSpeedMs: number = 6.0; // ~22 km/h
  private readonly accelerationRate: number = 4.2; // m/s^2
  private readonly brakeRate: number = 11.0; // Air brakes m/s^2
  private readonly dragCoefficient: number = 0.95; // Natural aerodynamic + rolling drag
  private readonly maxSteerAngleRad: number = 0.52; // ~30 degrees max steer
  private readonly wheelbase: number = 6.2; // Distance between front and rear axle

  public update(
    delta: number,
    input: DrivingInput,
    collisionBoxes: THREE.Box3[],
    gasStationZone: { position: THREE.Vector3; radius: number }
  ): BusPhysicsState {
    // 1. Steering dynamics (speed-dependent sensitivity)
    const speedRatio = Math.min(1.0, Math.abs(this.speedMs) / 20.0);
    const targetSteer = input.steer * (this.maxSteerAngleRad * (1.0 - speedRatio * 0.45));
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 8, delta);

    // 2. Throttle & Braking forces
    let force = 0;

    if (input.handbrake) {
      // Emergency / Parking brake locks wheels
      this.speedMs = THREE.MathUtils.damp(this.speedMs, 0, 12, delta);
    } else {
      if (input.gear === 'D') {
        force += input.throttle * this.accelerationRate;
        if (input.brake > 0) {
          force -= input.brake * this.brakeRate;
        }
      } else if (input.gear === 'R') {
        force -= input.throttle * (this.accelerationRate * 0.65);
        if (input.brake > 0) {
          force += input.brake * this.brakeRate;
        }
      } else {
        // Neutral (coasting)
        if (input.brake > 0) {
          this.speedMs = THREE.MathUtils.damp(this.speedMs, 0, 8, delta);
        }
      }

      // Apply acceleration force
      this.speedMs += force * delta;

      // Natural drag and friction
      this.speedMs *= Math.pow(this.dragCoefficient, delta * 2.0);

      // Clamp max speeds
      if (this.speedMs > this.maxForwardSpeedMs) this.speedMs = this.maxForwardSpeedMs;
      if (this.speedMs < -this.maxReverseSpeedMs) this.speedMs = -this.maxReverseSpeedMs;
      if (Math.abs(this.speedMs) < 0.05 && input.throttle === 0) this.speedMs = 0;
    }

    // 3. Turn kinematics (Bicycle / Ackermann model for long bus)
    if (Math.abs(this.speedMs) > 0.05) {
      const angularVelocity = (this.speedMs / this.wheelbase) * Math.sin(this.steerAngle);
      this.rotationY += angularVelocity * delta;

      // Suspension roll (centrifugal chassis tilt in corners)
      const targetRoll = -angularVelocity * 0.45;
      this.rollAngle = THREE.MathUtils.damp(this.rollAngle, targetRoll, 6, delta);

      // Pitch (chassis dips under hard braking or squats on throttle)
      const targetPitch = force * -0.015;
      this.pitchAngle = THREE.MathUtils.damp(this.pitchAngle, targetPitch, 5, delta);
    } else {
      this.rollAngle = THREE.MathUtils.damp(this.rollAngle, 0, 5, delta);
      this.pitchAngle = THREE.MathUtils.damp(this.pitchAngle, 0, 5, delta);
    }

    // 4. Movement vector & collision testing
    const moveStep = this.speedMs * delta;
    const forwardVec = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
    const nextPos = this.position.clone().addScaledVector(forwardVec, moveStep);

    // Collision check against city buildings
    const busBox = new THREE.Box3(
      new THREE.Vector3(nextPos.x - 1.4, 0, nextPos.z - 5.5),
      new THREE.Vector3(nextPos.x + 1.4, 3.5, nextPos.z + 5.5)
    );

    let hasCollided = false;
    for (const cBox of collisionBoxes) {
      if (busBox.intersectsBox(cBox)) {
        hasCollided = true;
        break;
      }
    }

    // World perimeter bounds (keep within open-world city map)
    const mapLimit = 290;
    if (Math.abs(nextPos.x) > mapLimit || Math.abs(nextPos.z) > mapLimit) {
      hasCollided = true;
    }

    if (!hasCollided) {
      this.position.copy(nextPos);
      this.distanceDriven += Math.abs(moveStep) / 1000;
    } else {
      // Soft bounce & stop
      this.speedMs = -this.speedMs * 0.2;
    }

    // 5. Fuel system & Gas Station refueling
    const distToGasStation = this.position.distanceTo(gasStationZone.position);
    let isRefueling = false;

    if (distToGasStation < gasStationZone.radius && Math.abs(this.speedMs) < 0.5) {
      // Refuel at gas station!
      isRefueling = true;
      this.fuel = Math.min(100, this.fuel + delta * 12.0);
    } else if (input.throttle > 0 && Math.abs(this.speedMs) > 0.1) {
      // Consume diesel
      this.fuel = Math.max(0, this.fuel - delta * 0.04);
    }

    // If out of diesel, stop
    if (this.fuel <= 0) {
      this.speedMs = THREE.MathUtils.damp(this.speedMs, 0, 5, delta);
    }

    // 6. RPM calculation
    const speedKmh = this.speedMs * 3.6;
    if (input.gear === 'N') {
      this.rpm = 800 + input.throttle * 1400;
    } else {
      const gearRatio = ((Math.abs(speedKmh) % 25) / 25) * 1200;
      this.rpm = 800 + gearRatio + input.throttle * 400;
    }

    this.lastState = {
      position: this.position,
      rotationY: this.rotationY,
      speedKmh,
      velocity: forwardVec.clone().multiplyScalar(this.speedMs),
      steerAngle: this.steerAngle,
      rollAngle: this.rollAngle,
      pitchAngle: this.pitchAngle,
      rpm: this.rpm,
      gear: input.gear,
      fuel: this.fuel,
      isRefueling,
      distanceDrivenKm: this.distanceDriven,
    };
    return this.lastState;
  }

  public resetPosition(x: number = 0, z: number = -80, heading: number = 0) {
    this.position.set(x, 0, z);
    this.rotationY = heading;
    this.speedMs = 0;
    this.steerAngle = 0;
  }
}
