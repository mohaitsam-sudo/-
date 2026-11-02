/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { BusMission } from '../game/missions';
import { Trophy, Star, ArrowLeft } from 'lucide-react';

interface MissionCompleteModalProps {
  mission: BusMission | null;
  onClose: () => void;
  onNextMission: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  mission,
  onClose,
  onNextMission,
}) => {
  useEffect(() => {
    if (mission) {
      // Fire festive fireworks confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#ec4899', '#ffffff'],
      });
    }
  }, [mission]);

  if (!mission) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Trophy Icon */}
        <div className="w-20 h-20 rounded-full bg-linear-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-xl shadow-amber-500/30 border-4 border-amber-200">
          <Trophy className="w-10 h-10 text-slate-950" />
        </div>

        {/* 3 Stars */}
        <div className="flex items-center gap-2 mt-4 text-amber-400">
          <Star className="w-6 h-6 fill-current animate-bounce" style={{ animationDelay: '0ms' }} />
          <Star className="w-8 h-8 fill-current animate-bounce" style={{ animationDelay: '150ms' }} />
          <Star className="w-6 h-6 fill-current animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mt-3">اكتمل المسار بنجاح!</h3>
        <p className="text-sm font-bold text-amber-400 mt-1">{mission.titleArabic}</p>
        <p className="text-xs text-slate-300 mt-2">
          أحسنت! لقد قمت بنقل الركاب عبر جميع المحطات في الوقت المحدد مع الحفاظ على سلامتهم وراحتهم.
        </p>

        {/* Reward Box */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-4 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-bold">مكافأة الخط</span>
            <span className="text-xl font-black text-amber-400 mt-0.5">+{mission.rewardEGP} ج.م</span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-bold">تقييم الركاب</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5">⭐⭐⭐⭐⭐</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full mt-6">
          <button
            onClick={onNextMission}
            className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>الخط التالي 🚍</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition active:scale-95"
          >
            متابعة القيادة
          </button>
        </div>
      </div>
    </div>
  );
};
