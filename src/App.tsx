/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SceneManager, WeatherType } from './game/sceneManager';
import { BusConfig } from './game/busModel';
import { CameraMode } from './game/camera';
import { audioSystem } from './game/audio';
import { BusMission, MISSIONS_LIST } from './game/missions';
import { SteeringWheel } from './components/SteeringWheel';
import { Pedals } from './components/Pedals';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import { MissionCompleteModal } from './components/MissionCompleteModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Game Settings & Customization
  // Exterior BLACK by default as explicitly required:
  const [busConfig, setBusConfig] = useState<BusConfig>({
    bodyColor: 'black',
    tintLevel: 'dark',
    rimStyle: 'chrome',
  });

  const [weather, setWeather] = useState<WeatherType>('day');
  const [controlType, setControlType] = useState<'wheel' | 'buttons'>('wheel');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [completedMission, setCompletedMission] = useState<BusMission | null>(null);

  // Runtime telemetry for HUD
  const [speedKmh, setSpeedKmh] = useState(0);
  const [rpm, setRpm] = useState(800);
  const [gear, setGear] = useState<'D' | 'N' | 'R'>('D');
  const [fuel, setFuel] = useState(85);
  const [isRefueling, setIsRefueling] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [blinkerState, setBlinkerState] = useState<'none' | 'left' | 'right' | 'hazard'>('none');
  const [handbrake, setHandbrake] = useState(false);
  const [acLevel, setAcLevel] = useState(1);
  const [onboardPassengers, setOnboardPassengers] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(150);
  const [currentMission, setCurrentMission] = useState<BusMission>(MISSIONS_LIST[0]);
  const [distanceToNextStop, setDistanceToNextStop] = useState(0);
  const [nearBusStop, setNearBusStop] = useState<any>(null);

  // Handle mission step complete
  const handleMissionStepComplete = useCallback((stepName: string, reward: number) => {
    setTotalEarnings((prev) => prev + reward);
  }, []);

  // Handle entire mission complete
  const handleMissionFinished = useCallback((mission: BusMission) => {
    setTotalEarnings((prev) => prev + mission.rewardEGP);
    setCompletedMission(mission);
  }, []);

  // Initialize Three.js Game World
  useEffect(() => {
    if (!containerRef.current) return;

    // Unlock Web Audio on first gesture
    const unlockAudio = () => {
      audioSystem.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    const sm = new SceneManager({
      container: containerRef.current,
      busConfig,
      weather,
      onMissionStepComplete: handleMissionStepComplete,
      onMissionFinished: handleMissionFinished,
    });
    sceneManagerRef.current = sm;

    // Resize observer
    const handleResize = () => {
      if (containerRef.current && sceneManagerRef.current) {
        sceneManagerRef.current.handleResize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    // Sync HUD state from physics / engine at 20fps
    const telemetryInterval = setInterval(() => {
      if (!sceneManagerRef.current) return;
      const state = sceneManagerRef.current.physics.getState();
      setSpeedKmh(Math.round(state.speedKmh));
      setRpm(state.rpm);
      setFuel(state.fuel);
      setIsRefueling(state.isRefueling);
      setOnboardPassengers(sceneManagerRef.current.passengers.onboardCount);
      setTotalEarnings(sceneManagerRef.current.passengers.totalEarnings);
      setIsDoorOpen(sceneManagerRef.current.isDoorOpen());
      setLightsOn(sceneManagerRef.current.getHeadlights());
      setBlinkerState(sceneManagerRef.current.getBlinker());

      const { distanceMeters } = sceneManagerRef.current.getDistanceToNextStop();
      setDistanceToNextStop(distanceMeters);
      setNearBusStop(sceneManagerRef.current.getNearBusStopZone());
    }, 50);

    return () => {
      clearInterval(telemetryInterval);
      window.removeEventListener('resize', handleResize);
      sm.destroy();
      sceneManagerRef.current = null;
    };
  }, [handleMissionStepComplete, handleMissionFinished]);

  // Update bus config dynamically
  const handleUpdateBusConfig = (newConfig: BusConfig) => {
    setBusConfig(newConfig);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.bus.setBodyColor(newConfig.bodyColor);
    }
  };

  // Update weather dynamically
  const handleUpdateWeather = (newWeather: WeatherType) => {
    setWeather(newWeather);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.applyWeather(newWeather);
    }
  };

  // Keyboard navigation & controls for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sceneManagerRef.current) return;
      audioSystem.init();

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        sceneManagerRef.current.input.throttle = 1.0;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        sceneManagerRef.current.input.brake = 1.0;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        sceneManagerRef.current.input.steer = -1.0;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        sceneManagerRef.current.input.steer = 1.0;
      } else if (e.code === 'Space') {
        const next = !sceneManagerRef.current.input.handbrake;
        sceneManagerRef.current.input.handbrake = next;
        setHandbrake(next);
      } else if (e.code === 'KeyC') {
        const modes: CameraMode[] = ['chase', 'driver', 'passenger', 'wheel'];
        const next = modes[(modes.indexOf(cameraMode) + 1) % modes.length];
        setCameraMode(next);
        sceneManagerRef.current.cameraRig.setMode(next);
      } else if (e.code === 'KeyE') {
        const open = !sceneManagerRef.current.isDoorOpen();
        sceneManagerRef.current.setDoorOpen(open);
        setIsDoorOpen(open);
      } else if (e.code === 'KeyL') {
        const on = sceneManagerRef.current.toggleHeadlights();
        setLightsOn(on);
      } else if (e.code === 'KeyH') {
        audioSystem.playHorn(true);
      } else if (e.code === 'KeyR') {
        audioSystem.cycleRadioStation();
      } else if (e.code === 'Escape' || e.code === 'KeyM') {
        setIsMenuOpen((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!sceneManagerRef.current) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        sceneManagerRef.current.input.throttle = 0;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        sceneManagerRef.current.input.brake = 0;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') {
        sceneManagerRef.current.input.steer = 0;
      } else if (e.code === 'KeyH') {
        audioSystem.playHorn(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraMode]);

  // Touch Steer input handler
  const handleSteerChange = useCallback((steer: number) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.input.steer = steer;
    }
  }, []);

  // Touch Throttle input handler
  const handleThrottleChange = useCallback((throttle: number) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.input.throttle = throttle;
    }
  }, []);

  // Touch Brake input handler
  const handleBrakeChange = useCallback((brake: number) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.input.brake = brake;
    }
  }, []);

  // Camera change
  const handleCameraChange = (mode: CameraMode) => {
    setCameraMode(mode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cameraRig.setMode(mode);
    }
  };

  // Door toggle
  const handleToggleDoor = () => {
    if (sceneManagerRef.current) {
      const next = !sceneManagerRef.current.isDoorOpen();
      sceneManagerRef.current.setDoorOpen(next);
      setIsDoorOpen(next);
    }
  };

  // Lights toggle
  const handleToggleLights = () => {
    if (sceneManagerRef.current) {
      const next = sceneManagerRef.current.toggleHeadlights();
      setLightsOn(next);
    }
  };

  // Blinker toggle
  const handleBlinkerChange = (state: 'none' | 'left' | 'right' | 'hazard') => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setBlinker(state);
      setBlinkerState(sceneManagerRef.current.getBlinker());
    }
  };

  // Gear change
  const handleGearChange = (newGear: 'D' | 'N' | 'R') => {
    setGear(newGear);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.input.gear = newGear;
    }
    audioSystem.playClick();
  };

  // Handbrake toggle
  const handleToggleHandbrake = () => {
    const next = !handbrake;
    setHandbrake(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.input.handbrake = next;
    }
    audioSystem.playAirBrake(0.3);
  };

  // Horn handlers
  const handleHornStart = () => {
    audioSystem.playHorn(true);
  };

  const handleHornEnd = () => {
    audioSystem.playHorn(false);
  };

  // A/C Cycle
  const handleCycleAC = () => {
    const next = (acLevel + 1) % 4;
    setAcLevel(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setACLevel(next);
    }
  };

  // Radio Cycle
  const handleCycleRadio = () => {
    return audioSystem.cycleRadioStation();
  };

  // Look left / right for mirror inspection
  const handleLookLeft = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cameraRig.lookLeft();
    }
  };

  const handleLookRight = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cameraRig.lookRight();
    }
  };

  const handleLookCenter = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cameraRig.lookCenter();
    }
  };

  // Touch Camera orbit drag on 3D view
  const isDraggingOrbitRef = useRef(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStartView = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    isDraggingOrbitRef.current = true;
    lastTouchRef.current = { x: clientX, y: clientY };
  };

  const handleTouchMoveView = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingOrbitRef.current || !lastTouchRef.current || !sceneManagerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastTouchRef.current.x;
    const dy = clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: clientX, y: clientY };
    sceneManagerRef.current.cameraRig.rotateOrbit(dx, dy);
  };

  const handleTouchEndView = () => {
    isDraggingOrbitRef.current = false;
    lastTouchRef.current = null;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStartView}
        onTouchMove={handleTouchMoveView}
        onTouchEnd={handleTouchEndView}
        onMouseDown={handleTouchStartView}
        onMouseMove={handleTouchMoveView}
        onMouseUp={handleTouchEndView}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Main Game HUD Overlay */}
      <GameHUD
        speedKmh={speedKmh}
        rpm={rpm}
        gear={gear}
        fuel={fuel}
        isRefueling={isRefueling}
        cameraMode={cameraMode}
        onCameraChange={handleCameraChange}
        onLookLeft={handleLookLeft}
        onLookRight={handleLookRight}
        onLookCenter={handleLookCenter}
        isDoorOpen={isDoorOpen}
        onToggleDoor={handleToggleDoor}
        lightsOn={lightsOn}
        onToggleLights={handleToggleLights}
        blinkerState={blinkerState}
        onBlinkerChange={handleBlinkerChange}
        onGearChange={handleGearChange}
        handbrake={handbrake}
        onToggleHandbrake={handleToggleHandbrake}
        onHornStart={handleHornStart}
        onHornEnd={handleHornEnd}
        acLevel={acLevel}
        onCycleAC={handleCycleAC}
        onCycleRadio={handleCycleRadio}
        onOpenMenu={() => setIsMenuOpen(true)}
        onboardPassengers={onboardPassengers}
        totalEarnings={totalEarnings}
        currentStep={sceneManagerRef.current?.getCurrentStep() || null}
        distanceToNextStop={distanceToNextStop}
        nearBusStop={nearBusStop}
      />

      {/* Mobile Controls: Left Steering Wheel / Buttons, Right Gas & Brake Pedals */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <SteeringWheel onSteerChange={handleSteerChange} controlType={controlType} />
      </div>

      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <Pedals onThrottleChange={handleThrottleChange} onBrakeChange={handleBrakeChange} />
      </div>

      {/* Main Menu / Garage / Settings / Missions Modal */}
      <MainMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        busConfig={busConfig}
        onUpdateBusConfig={handleUpdateBusConfig}
        weather={weather}
        onUpdateWeather={handleUpdateWeather}
        controlType={controlType}
        onUpdateControlType={setControlType}
        currentMission={currentMission}
        onSelectMission={(m) => {
          setCurrentMission(m);
          if (sceneManagerRef.current) {
            sceneManagerRef.current.setMission(m);
          }
        }}
        totalEarnings={totalEarnings}
      />

      {/* Mission Complete Celebration Modal */}
      <MissionCompleteModal
        mission={completedMission}
        onClose={() => setCompletedMission(null)}
        onNextMission={() => {
          const nextIdx = (MISSIONS_LIST.findIndex((m) => m.id === completedMission?.id) + 1) % MISSIONS_LIST.length;
          const nextMission = MISSIONS_LIST[nextIdx];
          setCurrentMission(nextMission);
          if (sceneManagerRef.current) {
            sceneManagerRef.current.setMission(nextMission);
          }
          setCompletedMission(null);
        }}
      />
    </div>
  );
}
