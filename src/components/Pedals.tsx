/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface PedalsProps {
  onThrottleChange: (throttle: number) => void;
  onBrakeChange: (brake: number) => void;
}

export const Pedals: React.FC<PedalsProps> = ({ onThrottleChange, onBrakeChange }) => {
  const [gasPressed, setGasPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);

  useEffect(() => {
    onThrottleChange(gasPressed ? 1.0 : 0.0);
  }, [gasPressed, onThrottleChange]);

  useEffect(() => {
    onBrakeChange(brakePressed ? 1.0 : 0.0);
  }, [brakePressed, onBrakeChange]);

  return (
    <div className="flex items-end gap-3 sm:gap-4 pointer-events-auto select-none touch-none">
      {/* Brake Pedal (Wide & Red Accent) */}
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          setBrakePressed(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          setBrakePressed(false);
        }}
        onTouchCancel={() => setBrakePressed(false)}
        onMouseDown={() => setBrakePressed(true)}
        onMouseUp={() => setBrakePressed(false)}
        onMouseLeave={() => setBrakePressed(false)}
        className={`w-20 h-24 sm:w-24 sm:h-28 rounded-2xl flex flex-col items-center justify-between py-2 border-2 shadow-2xl transition-all duration-75 cursor-pointer ${
          brakePressed
            ? 'bg-linear-to-b from-red-600 to-red-800 border-red-400 translate-y-2 scale-95 shadow-inner'
            : 'bg-linear-to-b from-slate-800 to-slate-900 border-red-500/60 shadow-lg'
        }`}
      >
        <span className="text-[10px] sm:text-xs font-bold text-red-400 tracking-wider">BRAKE</span>
        {/* Rubber Grip Ribs */}
        <div className="flex flex-col gap-1.5 w-12 sm:w-14">
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
        </div>
        <span className="text-xs sm:text-sm font-extrabold text-white">فرامل</span>
      </div>

      {/* Gas / Throttle Pedal (Tall & Green Accent) */}
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          setGasPressed(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          setGasPressed(false);
        }}
        onTouchCancel={() => setGasPressed(false)}
        onMouseDown={() => setGasPressed(true)}
        onMouseUp={() => setGasPressed(false)}
        onMouseLeave={() => setGasPressed(false)}
        className={`w-18 h-32 sm:w-20 sm:h-36 rounded-2xl flex flex-col items-center justify-between py-2 border-2 shadow-2xl transition-all duration-75 cursor-pointer ${
          gasPressed
            ? 'bg-linear-to-b from-emerald-600 to-emerald-800 border-emerald-400 translate-y-2 scale-95 shadow-inner'
            : 'bg-linear-to-b from-slate-800 to-slate-900 border-emerald-500/60 shadow-lg'
        }`}
      >
        <span className="text-[10px] sm:text-xs font-bold text-emerald-400 tracking-wider">GAS</span>
        {/* Rubber Grip Ribs */}
        <div className="flex flex-col gap-1.5 w-10 sm:w-12">
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
          <div className="h-1.5 bg-slate-950/70 rounded-full" />
        </div>
        <span className="text-xs sm:text-sm font-extrabold text-white">بنزين</span>
      </div>
    </div>
  );
};
