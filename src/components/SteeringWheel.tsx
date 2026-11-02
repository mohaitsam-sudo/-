/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';

interface SteeringWheelProps {
  onSteerChange: (steer: number) => void; // -1 to 1
  controlType: 'wheel' | 'buttons';
}

export const SteeringWheel: React.FC<SteeringWheelProps> = ({ onSteerChange, controlType }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const isDraggingRef = useRef(false);
  const initialAngleRef = useRef(0);
  const currentRotationRef = useRef(0);

  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  // Buttons mode loop
  useEffect(() => {
    if (controlType !== 'buttons') return;
    let target = 0;
    if (leftPressed && !rightPressed) target = -1;
    else if (rightPressed && !leftPressed) target = 1;

    onSteerChange(target);
  }, [leftPressed, rightPressed, controlType, onSteerChange]);

  // Touch wheel handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!wheelRef.current) return;
    isDraggingRef.current = true;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    initialAngleRef.current = Math.atan2(clientY - centerY, clientX - centerX) - currentRotationRef.current;
  };

  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDraggingRef.current || !wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rawAngle = Math.atan2(clientY - centerY, clientX - centerX);
      let angle = rawAngle - initialAngleRef.current;

      // Normalize angle between -Math.PI and Math.PI
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;

      // Clamp max rotation to ~160 degrees
      const clampedAngle = Math.max(-2.6, Math.min(2.6, angle));
      currentRotationRef.current = clampedAngle;
      setRotation(clampedAngle);

      // Normalized steer between -1 and 1
      const normalized = clampedAngle / 2.6;
      onSteerChange(normalized);
    };

    const handleEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // Spring back to center smoothly
      const startRot = currentRotationRef.current;
      const startTime = performance.now();
      const duration = 180;

      const returnStep = (now: number) => {
        if (isDraggingRef.current) return;
        const progress = Math.min(1, (now - startTime) / duration);
        const cur = startRot * (1 - progress);
        currentRotationRef.current = cur;
        setRotation(cur);
        onSteerChange(cur / 2.6);

        if (progress < 1) {
          requestAnimationFrame(returnStep);
        } else {
          currentRotationRef.current = 0;
          setRotation(0);
          onSteerChange(0);
        }
      };
      requestAnimationFrame(returnStep);
    };

    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [onSteerChange]);

  if (controlType === 'buttons') {
    return (
      <div className="flex items-center gap-3 select-none pointer-events-auto">
        <button
          type="button"
          onTouchStart={() => setLeftPressed(true)}
          onTouchEnd={() => setLeftPressed(false)}
          onMouseDown={() => setLeftPressed(true)}
          onMouseUp={() => setLeftPressed(false)}
          onMouseLeave={() => setLeftPressed(false)}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-xl border-2 transition-transform active:scale-90 ${
            leftPressed ? 'bg-amber-500 border-amber-300 scale-95' : 'bg-slate-900/80 border-slate-700/80'
          }`}
          title="انعطاف يسار"
        >
          <svg className="w-8 h-8 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-xs text-slate-300 mt-1 font-bold">يسار</span>
        </button>

        <button
          type="button"
          onTouchStart={() => setRightPressed(true)}
          onTouchEnd={() => setRightPressed(false)}
          onMouseDown={() => setRightPressed(true)}
          onMouseUp={() => setRightPressed(false)}
          onMouseLeave={() => setRightPressed(false)}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-xl border-2 transition-transform active:scale-90 ${
            rightPressed ? 'bg-amber-500 border-amber-300 scale-95' : 'bg-slate-900/80 border-slate-700/80'
          }`}
          title="انعطاف يمين"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-xs text-slate-300 mt-1 font-bold">يمين</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={wheelRef}
      onTouchStart={handleTouchStart}
      onMouseDown={handleTouchStart}
      className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-slate-700/90 shadow-2xl cursor-grab active:cursor-grabbing select-none pointer-events-auto touch-none bg-slate-900/70 backdrop-blur-xs flex items-center justify-center"
      style={{
        transform: `rotate(${rotation}rad)`,
        transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      {/* Outer Wheel Rim */}
      <div className="absolute inset-2 rounded-full border-8 border-slate-800 shadow-inner" />
      {/* Chrome Accent Ring */}
      <div className="absolute inset-5 rounded-full border-2 border-amber-500/60" />

      {/* Spokes */}
      <div className="absolute w-full h-4 bg-slate-800 rounded-sm" />
      <div className="absolute h-full w-4 bg-slate-800 rounded-sm" />

      {/* Center Cap with Bus Logo / Mohamed Haitham badge */}
      <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-b from-slate-800 to-black border-2 border-amber-400 flex flex-col items-center justify-center shadow-lg">
        <span className="text-[9px] font-black tracking-widest text-amber-400">MH</span>
        <span className="text-[7px] font-bold text-slate-300">BUS 3D</span>
      </div>

      {/* Grip markers */}
      <div className="absolute top-1 w-6 h-3 bg-amber-500 rounded-xs shadow-xs" />
    </div>
  );
};
