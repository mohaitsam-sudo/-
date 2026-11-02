/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CameraMode } from '../game/camera';
import { audioSystem } from '../game/audio';
import { BusStopZone } from '../game/city';
import { BusRouteStep } from '../game/missions';
import {
  Volume2,
  VolumeX,
  Radio as RadioIcon,
  Wind,
  Lightbulb,
  AlertTriangle,
  DoorOpen,
  Maximize2,
  Menu as MenuIcon,
  Users,
  Compass,
  Coins,
  Fuel,
} from 'lucide-react';

interface GameHUDProps {
  speedKmh: number;
  rpm: number;
  gear: 'D' | 'N' | 'R';
  fuel: number;
  isRefueling: boolean;
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
  onLookLeft: () => void;
  onLookRight: () => void;
  onLookCenter: () => void;
  isDoorOpen: boolean;
  onToggleDoor: () => void;
  lightsOn: boolean;
  onToggleLights: () => void;
  blinkerState: 'none' | 'left' | 'right' | 'hazard';
  onBlinkerChange: (state: 'none' | 'left' | 'right' | 'hazard') => void;
  onGearChange: (gear: 'D' | 'N' | 'R') => void;
  handbrake: boolean;
  onToggleHandbrake: () => void;
  onHornStart: () => void;
  onHornEnd: () => void;
  acLevel: number;
  onCycleAC: () => void;
  onCycleRadio: () => { stationId: number; stationName: string };
  onOpenMenu: () => void;
  onboardPassengers: number;
  totalEarnings: number;
  currentStep: BusRouteStep | null;
  distanceToNextStop: number;
  nearBusStop: BusStopZone | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  speedKmh,
  gear,
  fuel,
  isRefueling,
  cameraMode,
  onCameraChange,
  onLookLeft,
  onLookRight,
  onLookCenter,
  isDoorOpen,
  onToggleDoor,
  lightsOn,
  onToggleLights,
  blinkerState,
  onBlinkerChange,
  onGearChange,
  handbrake,
  onToggleHandbrake,
  onHornStart,
  onHornEnd,
  acLevel,
  onCycleAC,
  onCycleRadio,
  onOpenMenu,
  onboardPassengers,
  totalEarnings,
  currentStep,
  distanceToNextStop,
  nearBusStop,
}) => {
  const [radioName, setRadioName] = useState<string>('');
  const [radioToast, setRadioToast] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleRadioClick = () => {
    const res = onCycleRadio();
    setRadioName(res.stationName);
    setRadioToast(true);
    setTimeout(() => setRadioToast(false), 2600);
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioSystem.setMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Next Camera toggle
  const cycleCamera = () => {
    const modes: CameraMode[] = ['chase', 'driver', 'passenger', 'wheel'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    onCameraChange(modes[nextIdx]);
  };

  const acLabels = ['مغلق', 'منخفض', 'متوسط', 'عالي'];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 select-none">
      {/* 1. TOP HEADER BAR: Route Mission Info, Earnings, Passengrs, System Buttons */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Right side (RTL Start): Menu & Systems */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenMenu}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-700/80 shadow-lg text-xs sm:text-sm font-bold transition active:scale-95"
            title="القائمة الرئيسية"
          >
            <MenuIcon className="w-4 h-4 text-amber-400" />
            <span>القائمة</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-700/80 shadow-lg transition active:scale-95"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-700/80 shadow-lg transition active:scale-95 hidden sm:flex"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Center: Mission GPS Radar Banner */}
        {currentStep ? (
          <div className="flex flex-col items-center pointer-events-auto bg-slate-900/90 border border-amber-500/50 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xs max-w-xs sm:max-w-md text-center">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>المحطة التالية:</span>
              <span className="text-white font-extrabold">{currentStep.nameArabic}</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[11px] sm:text-xs text-slate-300">
              <span>المسافة: <strong className="text-amber-300">{distanceToNextStop} متر</strong></span>
              <span>•</span>
              <span>الركاب المطلوبين: <strong className="text-emerald-400">{currentStep.passengerQuota} ركاب</strong></span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-lg text-xs text-slate-300">
            <span>جولة حرة - نقل ركاب مفتوح</span>
          </div>
        )}

        {/* Left side: Stats & Cash */}
        <div className="flex items-center gap-2">
          {/* Earnings Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-400/60 shadow-lg text-amber-300 text-xs sm:text-sm font-black">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{totalEarnings} ج.م</span>
          </div>

          {/* Passenger count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 shadow-lg text-xs sm:text-sm font-bold text-sky-300">
            <Users className="w-4 h-4 text-sky-400" />
            <span>{onboardPassengers} / 28 راكب</span>
          </div>
        </div>
      </div>

      {/* 2. MID NOTIFICATIONS (Radio Toast, Bus Stop Arrive Prompt) */}
      <div className="flex flex-col items-center gap-2">
        {/* Radio Channel Banner */}
        {radioToast && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-linear-to-r from-amber-600 to-amber-700 text-white font-bold text-xs sm:text-sm shadow-2xl animate-bounce">
            <RadioIcon className="w-4 h-4" />
            <span>راديو الأوتوبيس: {radioName}</span>
          </div>
        )}

        {/* Refueling Alert */}
        {isRefueling && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xl">
            <Fuel className="w-4 h-4" />
            <span>جاري تزويد السولار في المحطة... ({Math.round(fuel)}%)</span>
          </div>
        )}

        {/* At Bus Stop Prompt */}
        {nearBusStop && (
          <div className="flex flex-col items-center bg-slate-900/95 border-2 border-emerald-500 rounded-2xl p-3 shadow-2xl text-center max-w-sm pointer-events-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
              <DoorOpen className="w-5 h-5 text-emerald-400" />
              <span>وصلت إلى: {nearBusStop.arabicName}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {!isDoorOpen ? 'توقف تماماً واضغط "فتح الباب" لصعود ونزول الركاب' : 'الباب مفتوح - جاري صعود الركاب وجمع الأجرة...'}
            </p>
            <button
              onClick={onToggleDoor}
              className={`mt-2 px-5 py-1.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 ${
                isDoorOpen ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isDoorOpen ? 'غلق الباب والانطلاق 🚪' : 'فتح الباب للركاب 🚪'}
            </button>
          </div>
        )}
      </div>

      {/* 3. CENTER SPEEDOMETER / INSTRUMENT POD */}
      <div className="self-center flex items-center gap-4 bg-slate-950/85 border-2 border-slate-800 rounded-3xl px-5 py-2.5 shadow-2xl backdrop-blur-xs pointer-events-auto">
        {/* Gear Buttons */}
        <div className="flex items-center gap-1.5">
          {(['D', 'N', 'R'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGearChange(g)}
              className={`w-9 h-9 rounded-xl font-black text-sm transition-all shadow-md active:scale-90 ${
                gear === g
                  ? g === 'D'
                    ? 'bg-emerald-600 text-white border-2 border-emerald-400 scale-105'
                    : g === 'R'
                    ? 'bg-red-600 text-white border-2 border-red-400 scale-105'
                    : 'bg-amber-600 text-white border-2 border-amber-400 scale-105'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Speedometer Digital Readout */}
        <div className="flex flex-col items-center px-3 border-x border-slate-800">
          <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight leading-none">
            {Math.round(Math.abs(speedKmh))}
          </span>
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-1">كم/س KM/H</span>
        </div>

        {/* Fuel Gauge */}
        <div className="flex flex-col items-center w-16">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Fuel className="w-3 h-3 text-amber-400" />
            <span>{Math.round(fuel)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-1 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                fuel > 30 ? 'bg-emerald-500' : fuel > 15 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${fuel}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-500 mt-0.5">سولار</span>
        </div>

        {/* Handbrake status badge */}
        <button
          onClick={onToggleHandbrake}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
            handbrake ? 'bg-red-600 text-white border-2 border-red-400 animate-pulse' : 'bg-slate-900 text-slate-400 border border-slate-700'
          }`}
          title="فرامل اليد P"
        >
          {handbrake ? '(P) مفعلة' : '(P) يد'}
        </button>
      </div>

      {/* 4. BOTTOM INTERACTIVE BAR: Vehicle Switches, Horn, Mirrors, Camera */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left Side: Cabin Mirror Checks & Horn */}
        <div className="flex flex-col gap-2">
          {cameraMode === 'driver' && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
              <button
                onTouchStart={onLookLeft}
                onTouchEnd={onLookCenter}
                onMouseDown={onLookLeft}
                onMouseUp={onLookCenter}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition active:scale-90"
              >
                مرآة يسار
              </button>
              <button
                onTouchStart={onLookRight}
                onTouchEnd={onLookCenter}
                onMouseDown={onLookRight}
                onMouseUp={onLookCenter}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition active:scale-90"
              >
                مرآة يمين
              </button>
            </div>
          )}

          {/* Horn Button (Press & Hold) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onHornStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onHornEnd();
            }}
            onMouseDown={onHornStart}
            onMouseUp={onHornEnd}
            onMouseLeave={onHornEnd}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-2 border-amber-300 text-slate-950 font-black shadow-2xl flex flex-col items-center justify-center transition active:scale-90"
            title="كلاكس الأوتوبيس (زمارة)"
          >
            <span className="text-xl">📢</span>
            <span className="text-xs font-black mt-1">كلاكس</span>
          </button>
        </div>

        {/* Center: Vehicle Switches (Doors, Lights, Radio, A/C, Hazard, Camera) */}
        <div className="flex items-center gap-2 bg-slate-900/85 p-2 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-xs">
          {/* Camera Switch */}
          <button
            onClick={cycleCamera}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-md flex flex-col items-center text-[10px] font-bold transition active:scale-95"
            title="تبديل الكاميرا"
          >
            <span className="text-sm">🎥</span>
            <span className="mt-0.5">
              {cameraMode === 'driver' ? 'كابينة' : cameraMode === 'chase' ? 'خارجي' : cameraMode === 'passenger' ? 'صالون' : 'عجلة'}
            </span>
          </button>

          {/* Door Toggle */}
          <button
            onClick={onToggleDoor}
            className={`p-3 rounded-xl border shadow-md flex flex-col items-center text-[10px] font-bold transition active:scale-95 ${
              isDoorOpen
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-600'
            }`}
            title="فتح/غلق الباب"
          >
            <DoorOpen className="w-4 h-4" />
            <span className="mt-0.5">{isDoorOpen ? 'مفتوح' : 'مغلق'}</span>
          </button>

          {/* Headlights Toggle */}
          <button
            onClick={onToggleLights}
            className={`p-3 rounded-xl border shadow-md flex flex-col items-center text-[10px] font-bold transition active:scale-95 ${
              lightsOn
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 font-black'
                : 'bg-slate-800 text-slate-300 border-slate-600'
            }`}
            title="الأنوار الأمامية"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="mt-0.5">الأنوار</span>
          </button>

          {/* Hazard / Blinkers */}
          <button
            onClick={() => onBlinkerChange(blinkerState === 'hazard' ? 'none' : 'hazard')}
            className={`p-3 rounded-xl border shadow-md flex flex-col items-center text-[10px] font-bold transition active:scale-95 ${
              blinkerState === 'hazard'
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-600'
            }`}
            title="إشارات الانتظار"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="mt-0.5">انتظار</span>
          </button>

          {/* Bus Radio */}
          <button
            onClick={handleRadioClick}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-600 shadow-md flex flex-col items-center text-[10px] font-bold transition active:scale-95"
            title="راديو الأوتوبيس"
          >
            <RadioIcon className="w-4 h-4" />
            <span className="mt-0.5">راديو</span>
          </button>

          {/* A/C Air Conditioning */}
          <button
            onClick={onCycleAC}
            className={`p-3 rounded-xl border shadow-md flex flex-col items-center text-[10px] font-bold transition active:scale-95 ${
              acLevel > 0 ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-600'
            }`}
            title="تكييف الأوتوبيس"
          >
            <Wind className="w-4 h-4" />
            <span className="mt-0.5">تكييف {acLabels[acLevel]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
