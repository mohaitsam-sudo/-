/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBus, BusInstance, BusConfig } from './busModel';
import { createEgyptianCity, CityEnvironment, BusStopZone } from './city';
import { createPassengerSystem, PassengerSystem } from './passengers';
import { createTrafficSystem, TrafficSystem } from './traffic';
import { BusPhysicsEngine, DrivingInput, BusPhysicsState } from './physics';
import { createCameraRig, CameraRig, CameraMode } from './camera';
import { audioSystem } from './audio';
import { BusMission, BusRouteStep, MISSIONS_LIST } from './missions';

export type WeatherType = 'day' | 'sunset' | 'night' | 'rain';

export interface SceneManagerOptions {
  container: HTMLElement;
  busConfig: BusConfig;
  weather: WeatherType;
  onMissionStepComplete?: (stepName: string, reward: number) => void;
  onMissionFinished?: (mission: BusMission) => void;
}

export class SceneManager {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public cameraRig: CameraRig;
  public bus: BusInstance;
  public city: CityEnvironment;
  public passengers: PassengerSystem;
  public traffic: TrafficSystem;
  public physics: BusPhysicsEngine;

  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number = 0;
  private isDestroyed: boolean = false;
  private isSoftwareGl: boolean = false;

  // Environment lights
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rainParticles: THREE.Points | null = null;
  private weather: WeatherType = 'day';

  // State
  private doorOpenAmount: number = 0;
  private doorTarget: number = 0;
  private lightsOn: boolean = false;
  private blinkerState: 'none' | 'left' | 'right' | 'hazard' = 'none';
  private blinkerTimer: number = 0;
  private blinkerPhase: boolean = false;
  private acLevel: number = 1;

  // Mission State
  private currentMission: BusMission = MISSIONS_LIST[0];
  private currentStepIndex: number = 0;
  private onMissionStepComplete?: (stepName: string, reward: number) => void;
  private onMissionFinished?: (mission: BusMission) => void;

  // Input
  public input: DrivingInput = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    gear: 'D',
  };

  constructor(options: SceneManagerOptions) {
    const { container, busConfig, weather } = options;
    this.weather = weather;
    this.onMissionStepComplete = options.onMissionStepComplete;
    this.onMissionFinished = options.onMissionFinished;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene setup
    this.scene = new THREE.Scene();

    // Studio Environment map
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // RoomEnvironment fallback
    }

    // 4. Lights & Sky
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.dirLight.position.set(80, 120, 60);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 300;
    const d = 80;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x475569, 0.7);
    this.scene.add(this.hemiLight);

    // Apply Weather
    this.applyWeather(weather);

    // 5. Camera Rig
    const aspect = container.clientWidth / container.clientHeight;
    this.cameraRig = createCameraRig(aspect);

    // 6. Bus, City, Passengers, Traffic, Physics
    this.bus = createBus(busConfig);
    this.scene.add(this.bus.group);

    this.city = createEgyptianCity();
    this.scene.add(this.city.sceneGroup);

    this.passengers = createPassengerSystem(this.city.busStops);
    this.scene.add(this.passengers.group);

    this.traffic = createTrafficSystem();
    this.scene.add(this.traffic.group);

    this.physics = new BusPhysicsEngine();

    // Setup Rain if rain weather
    if (weather === 'rain') {
      this.setupRain();
    }

    // Start render loop
    this.tick();
  }

  public applyWeather(weather: WeatherType) {
    this.weather = weather;
    if (weather === 'day') {
      this.scene.background = new THREE.Color(0x7dd3fc); // Cairo sunny daylight
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0028);
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 1.9;
      this.dirLight.position.set(70, 130, 60);
      this.hemiLight.color.setHex(0x7dd3fc);
      this.hemiLight.groundColor.setHex(0xd6b896);
      this.hemiLight.intensity = 0.8;
      this.lightsOn = false;
    } else if (weather === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316); // Cairo Nile sunset gold
      this.scene.fog = new THREE.FogExp2(0xfb923c, 0.0035);
      this.dirLight.color.setHex(0xfbbf24);
      this.dirLight.intensity = 1.5;
      this.dirLight.position.set(120, 30, -50);
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x78350f);
      this.hemiLight.intensity = 0.6;
      this.lightsOn = true;
    } else if (weather === 'night') {
      this.scene.background = new THREE.Color(0x030712); // Night city
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.004);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.25;
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.3;
      this.lightsOn = true;
    } else if (weather === 'rain') {
      this.scene.background = new THREE.Color(0x334155); // Overcast rain
      this.scene.fog = new THREE.FogExp2(0x475569, 0.0045);
      this.dirLight.color.setHex(0x94a3b8);
      this.dirLight.intensity = 0.9;
      this.hemiLight.color.setHex(0x64748b);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.5;
      this.lightsOn = true;
      this.setupRain();
    }
  }

  private setupRain() {
    if (this.rainParticles) return;
    const count = 4000;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = Math.random() * 50;
      positions[i + 2] = (Math.random() - 0.5) * 300;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.28,
      transparent: true,
      opacity: 0.6,
    });
    this.rainParticles = new THREE.Points(geom, mat);
    this.scene.add(this.rainParticles);
  }

  public setDoorOpen(open: boolean) {
    this.doorTarget = open ? 1.0 : 0.0;
    audioSystem.playDoorSound(open);
  }

  public isDoorOpen(): boolean {
    return this.doorTarget > 0.5;
  }

  public toggleHeadlights(): boolean {
    this.lightsOn = !this.lightsOn;
    audioSystem.playClick();
    return this.lightsOn;
  }

  public getHeadlights(): boolean {
    return this.lightsOn;
  }

  public setBlinker(state: 'none' | 'left' | 'right' | 'hazard') {
    this.blinkerState = this.blinkerState === state ? 'none' : state;
    audioSystem.playClick();
  }

  public getBlinker(): 'none' | 'left' | 'right' | 'hazard' {
    return this.blinkerState;
  }

  public setACLevel(level: number) {
    this.acLevel = level;
    audioSystem.setACLevel(level);
  }

  public getACLevel(): number {
    return this.acLevel;
  }

  public setMission(mission: BusMission) {
    this.currentMission = mission;
    this.currentStepIndex = 0;
  }

  public getCurrentMission(): BusMission {
    return this.currentMission;
  }

  public getCurrentStep(): BusRouteStep | null {
    if (!this.currentMission.steps || this.currentMission.steps.length === 0) return null;
    return this.currentMission.steps[this.currentStepIndex] || null;
  }

  public getDistanceToNextStop(): { stop: BusStopZone | null; distanceMeters: number } {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return { stop: null, distanceMeters: 0 };
    const stop = this.city.busStops.find((s) => s.id === currentStep.stopId) || null;
    if (!stop) return { stop: null, distanceMeters: 0 };

    const dist = this.bus.group.position.distanceTo(stop.position);
    return { stop, distanceMeters: Math.round(dist) };
  }

  public getNearBusStopZone(): BusStopZone | null {
    const busPos = this.bus.group.position;
    for (const stop of this.city.busStops) {
      if (busPos.distanceTo(stop.position) < 14) {
        return stop;
      }
    }
    return null;
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const delta = Math.min(0.1, this.clock.getDelta());

    // 1. Update Physics
    const physState: BusPhysicsState = this.physics.update(
      delta,
      this.input,
      this.city.collisionBoxes,
      this.city.gasStationZone
    );

    // 2. Position and rotate bus model
    this.bus.group.position.copy(physState.position);
    this.bus.group.rotation.set(physState.pitchAngle, physState.rotationY, physState.rollAngle);

    // 3. Update Audio engine with speed, RPM, and throttle
    audioSystem.updateEngine(physState.speedKmh, this.input.throttle, this.input.brake > 0);

    // 4. Update Blinker timer & clicking
    if (this.blinkerState !== 'none') {
      this.blinkerTimer += delta;
      if (this.blinkerTimer > 0.42) {
        this.blinkerTimer = 0;
        this.blinkerPhase = !this.blinkerPhase;
        if (this.blinkerPhase) {
          audioSystem.playClick();
        }
      }
    } else {
      this.blinkerPhase = false;
      this.blinkerTimer = 0;
    }

    // 5. Update Door animation
    this.doorOpenAmount = THREE.MathUtils.damp(this.doorOpenAmount, this.doorTarget, 5, delta);

    // 6. Update Bus internals (speedometer, wheels, lights)
    this.bus.update(
      delta,
      physState.speedKmh,
      physState.steerAngle,
      this.doorOpenAmount,
      this.lightsOn,
      this.input.brake > 0,
      this.blinkerState,
      this.blinkerPhase,
      physState.rpm,
      this.input.gear
    );

    // 7. Check current bus stop proximity
    const nearStop = this.getNearBusStopZone();

    // 8. Update Passengers & Boarding
    this.passengers.update(
      delta,
      this.bus,
      physState.position,
      physState.rotationY,
      this.doorOpenAmount,
      nearStop
    );

    // 9. Check Mission Step Progression
    const currentStep = this.getCurrentStep();
    if (currentStep && nearStop && nearStop.id === currentStep.stopId) {
      if (Math.abs(physState.speedKmh) < 1.0 && this.doorOpenAmount > 0.8) {
        // Mission step reached!
        const stepReward = 75;
        this.currentStepIndex++;
        if (this.onMissionStepComplete) {
          this.onMissionStepComplete(currentStep.nameArabic, stepReward);
        }

        // Check if entire mission complete
        if (this.currentStepIndex >= this.currentMission.steps.length) {
          if (this.onMissionFinished) {
            this.onMissionFinished(this.currentMission);
          }
          this.currentStepIndex = 0; // Loop or reset
        }
      }
    }

    // 10. Update Traffic Lights & City
    this.city.update(delta);

    // 11. Update AI Traffic
    this.traffic.update(delta, physState.position, this.city.trafficLights, this.lightsOn);

    // 12. Update Rain particles if active
    if (this.rainParticles) {
      const posAttr = this.rainParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= delta * 35;
        if (arr[i] < 0) arr[i] = 45;
      }
      posAttr.needsUpdate = true;
      this.rainParticles.position.set(physState.position.x, 0, physState.position.z);
    }

    // 13. Directional sun follows bus region
    this.dirLight.target = this.bus.group;

    // 14. Update Camera Rig
    this.cameraRig.update(delta, this.bus, physState.position, physState.rotationY, physState.speedKmh);

    // 15. Render Scene
    this.renderer.render(this.scene, this.cameraRig.camera);

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  public handleResize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.cameraRig.camera.aspect = width / height;
    this.cameraRig.camera.updateProjectionMatrix();
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
  }
}
