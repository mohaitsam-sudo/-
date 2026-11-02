/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BusConfig } from '../game/busModel';
import { WeatherType } from '../game/sceneManager';
import { BusMission, MISSIONS_LIST } from '../game/missions';
import {
  Play,
  Settings as SettingsIcon,
  Palette,
  MapPin,
  HelpCircle,
  Download,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Moon,
  CloudRain,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  busConfig: BusConfig;
  onUpdateBusConfig: (config: BusConfig) => void;
  weather: WeatherType;
  onUpdateWeather: (w: WeatherType) => void;
  controlType: 'wheel' | 'buttons';
  onUpdateControlType: (c: 'wheel' | 'buttons') => void;
  currentMission: BusMission;
  onSelectMission: (mission: BusMission) => void;
  totalEarnings: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  onClose,
  busConfig,
  onUpdateBusConfig,
  weather,
  onUpdateWeather,
  controlType,
  onUpdateControlType,
  currentMission,
  onSelectMission,
  totalEarnings,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'garage' | 'missions' | 'settings' | 'help'>('play');
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt && 'prompt' in installPrompt) {
      (installPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      setInstallPrompt(null);
      setIsInstalled(true);
    } else {
      alert('لتثبيت اللعبة على جهازك الأندرويد، اضغط على خيارات المتصفح (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية"');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border border-amber-300">
              <span className="text-xl font-black text-slate-950">3D</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                MOHAMED HAITHAM <span className="text-amber-400">BUS SIMULATOR 3D</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">محاكي الأوتوبيسات السياحية ثلاثي الأبعاد - شوارع مصر</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs sm:text-sm font-black flex items-center gap-1.5">
              <span>{totalEarnings}</span>
              <span className="text-xs">جنيه مصري</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition active:scale-95"
            >
              متابعة اللعب 🎮
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('play')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === 'play' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>بدء اللعب</span>
            </button>

            <button
              onClick={() => setActiveTab('garage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === 'garage' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>المرآب واختيار الأوتوبيس</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === 'missions' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>المهام والخطوط</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>الإعدادات والطقس</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === 'help' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>تعليمات القيادة</span>
            </button>
          </div>

          {/* Android Export / Install PWA Button */}
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت اللعبة للأندرويد</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 1. PLAY TAB */}
          {activeTab === 'play' && (
            <div className="flex flex-col gap-5">
              <div className="bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-400">الخط النشط حالياً:</span>
                  <h3 className="text-xl font-black text-white mt-1">{currentMission.titleArabic}</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">{currentMission.descriptionArabic}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span>المكافأة: <strong className="text-amber-400 font-bold">{currentMission.rewardEGP} ج.م</strong></span>
                    <span>•</span>
                    <span>الأوتوبيس: <strong className="text-white">{busConfig.bodyColor === 'black' ? 'الأسود الملكي السياحي (الافتراضي)' : 'الأزرق الملكي السياحي'}</strong></span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>انطلق الآن في المدينة!</span>
                </button>
              </div>

              {/* Quick Game Modes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => {
                    onSelectMission(MISSIONS_LIST[0]);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/80 cursor-pointer transition shadow-lg group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white group-hover:text-amber-400">خط 101: وسط البلد - الكورنيش</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">450 ج.م</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">نقل الركاب من محطة ميدان التحرير حتى ممشى النيل السياحي.</p>
                </div>

                <div
                  onClick={() => {
                    onSelectMission(MISSIONS_LIST[3]);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/80 cursor-pointer transition shadow-lg group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white group-hover:text-amber-400">قيادة حرة مفتوحة (Free Roam)</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">مستمر</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">استكشف شوارع القاهرة، كوبري النيل المعلق، وتزود بالوقود بحرية.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. GARAGE TAB (Bus Selection) */}
          {activeTab === 'garage' && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-black text-white">مرآب وتخصيص الأوتوبيس (GARAGE)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  اختر لون الطلاء الخارجي للأوتوبيس السياحي، نمط الجنوط، ومستوى تظليل الزجاج.
                </p>
              </div>

              {/* Exterior Color Selection (Black by default, Blue alternative) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">لون الهيكل الخارجي (Bus Exterior Color):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  {/* Black Bus (Default) */}
                  <div
                    onClick={() => onUpdateBusConfig({ ...busConfig, bodyColor: 'black' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      busConfig.bodyColor === 'black'
                        ? 'bg-slate-800/90 border-amber-400 shadow-xl shadow-black'
                        : 'bg-slate-900 border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black border-2 border-slate-600 shadow-inner flex items-center justify-center">
                        {busConfig.bodyColor === 'black' && <Check className="w-5 h-5 text-amber-400" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">الأسود الملكي الفاخر (افتراضي)</h4>
                        <p className="text-xs text-slate-400">Black Tour Coach</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">الافتراضي</span>
                  </div>

                  {/* Blue Bus (Alternative) */}
                  <div
                    onClick={() => onUpdateBusConfig({ ...busConfig, bodyColor: 'blue' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      busConfig.bodyColor === 'blue'
                        ? 'bg-slate-800/90 border-sky-400 shadow-xl shadow-sky-900/30'
                        : 'bg-slate-900 border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-600 border-2 border-sky-400 shadow-inner flex items-center justify-center">
                        {busConfig.bodyColor === 'blue' && <Check className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">الأزرق الملكي السياحي</h4>
                        <p className="text-xs text-slate-400">Blue Royale Coach</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-400">اختياري</span>
                  </div>
                </div>
              </div>

              {/* Wheel Rim Styles */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">نمط جنوط العجلات (Wheel Rims):</span>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { id: 'chrome' as const, label: 'كروم لامع', en: 'Chrome Sport' },
                    { id: 'gold' as const, label: 'ذهبي مصري', en: 'Egyptian Gold' },
                    { id: 'black' as const, label: 'أسود مطفي', en: 'Matte Stealth' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onUpdateBusConfig({ ...busConfig, rimStyle: r.id })}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                        busConfig.rimStyle === r.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interior Note */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>صالون الركاب وكابينة السائق مجهزة بتصميم أسود فاخر مع مقاعد مريحة ومكيف هواء.</span>
              </div>
            </div>
          )}

          {/* 3. MISSIONS TAB */}
          {activeTab === 'missions' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-black text-white">قائمة الخطوط والمسارات (Bus Routes & Missions)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  اختر المسار المطلوب لنقل الركاب، التزم بمحطات التوقف، واجمع الأجرة والمكافآت.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {MISSIONS_LIST.map((m) => {
                  const isSelected = currentMission.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMission(m)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-800/95 border-amber-400 shadow-xl'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm sm:text-base text-white">{m.titleArabic}</h4>
                          {isSelected && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">النشط</span>}
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{m.descriptionArabic}</p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                          <span>المحطات: <strong>{m.steps.length > 0 ? m.steps.length : 'مفتوح'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                          {m.rewardEGP} ج.م
                        </span>
                        <button
                          onClick={() => {
                            onSelectMission(m);
                            onClose();
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                        >
                          بدء الخط 🚌
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. SETTINGS & WEATHER TAB */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-black text-white">إعدادات اللعبة والطقس (Settings)</h3>
                <p className="text-xs text-slate-400 mt-1">تخصيص أسلوب التحكم، وقت اليوم، وتأثيرات الطقس.</p>
              </div>

              {/* Control Scheme Selection */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">نمط التوجيه على الشاشة (Steering Controls):</span>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <button
                    onClick={() => onUpdateControlType('wheel')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                      controlType === 'wheel'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">☸️</span>
                    <span className="text-xs sm:text-sm font-bold">عجلة قيادة لمسية واقعية</span>
                  </button>

                  <button
                    onClick={() => onUpdateControlType('buttons')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                      controlType === 'buttons'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">◀️ ▶️</span>
                    <span className="text-xs sm:text-sm font-bold">أزرار انعطاف يسار ويمين</span>
                  </button>
                </div>
              </div>

              {/* Time of Day & Weather */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">الطقس وتوقيت اليوم (Weather & Time):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {[
                    { id: 'day' as const, label: 'نهار مشمس', icon: Sun },
                    { id: 'sunset' as const, label: 'غروب ذهبي', icon: Sunset },
                    { id: 'night' as const, label: 'ليل وأنوار المدينة', icon: Moon },
                    { id: 'rain' as const, label: 'أجواء ماطرة ومساحات', icon: CloudRain },
                  ].map((w) => {
                    const Icon = w.icon;
                    return (
                      <button
                        key={w.id}
                        onClick={() => onUpdateWeather(w.id)}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition ${
                          weather === w.id
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. HELP & INSTRUCTIONS TAB */}
          {activeTab === 'help' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-black text-white">دليل وتعليمات القيادة ونقل الركاب</h3>
                <p className="text-xs text-slate-400 mt-1">كيف تصبح سائق أوتوبيس سياحي محترف في MOHAMED HAITHAM BUS SIMULATOR 3D.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <span>1.</span>
                    <span>القيادة والتحكم:</span>
                  </div>
                  <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                    <li>اضغط على زر <strong>(D)</strong> للانطلاق للأمام أو <strong>(R)</strong> للرجوع للخلف.</li>
                    <li>استخدم دواسة البنزين الخضراء للتسارع ودواسة الفرامل الحمراء للتوقف.</li>
                    <li>دور عجلة القيادة بالسحب بالأصبع أو استخدم أزرار الأسهم.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <span>2.</span>
                    <span>نقل الركاب وجمع الأجرة:</span>
                  </div>
                  <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                    <li>تتبع مؤشر المحطة بالأعلى حتى تصل إلى محطة الأوتوبيس المحددة.</li>
                    <li>توقف داخل المربع الأصفر واضغط على زر <strong>"فتح الباب" 🚪</strong>.</li>
                    <li>سيصعد الركاب تلقائياً ويجلسون في المقاعد، وستحصل على 15 جنيه لكل راكب!</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 font-black text-sm">
                    <span>3.</span>
                    <span>الكاميرات والمرايا:</span>
                  </div>
                  <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                    <li>اضغط على زر الكاميرا 🎥 للتبديل بين منظور السائق، المنظور الخارجي، وصالون الركاب.</li>
                    <li>في كابينة السائق، يمكنك الضغط على "مرآة يسار" و"مرآة يمين" لفحص التقاطعات.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 text-red-400 font-black text-sm">
                    <span>4.</span>
                    <span>محطة الوقود والتزود بالسولار:</span>
                  </div>
                  <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                    <li>راقب عداد السولار، إذا انخفض توجه إلى محطة وقود مصر ووطنية للتزود فوراً.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
