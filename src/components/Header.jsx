import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Database, 
  Play, 
  Pause, 
  FastForward, 
  Clock, 
  Settings,
  Layers,
  Lock,
  Unlock,
  ChevronDown,
  Package
} from 'lucide-react';
import { sound } from '../utils/soundFx';
import { t } from '../utils/i18n';

export default function Header({
  simTime,
  setSimTime,
  isPaused,
  timeSpeed,
  setTimeSpeed,
  setIsPaused,
  soundEnabled,
  setSoundEnabled,
  crtEnabled,
  setCrtEnabled,
  onOpenDataModal,
  onOpenSettings,
  isHudVisible,
  setIsHudVisible,
  lang = 'ko',
  isAdmin = false,
  setIsAdmin,
  authRole = null,
  setAuthRole,
  onOpenAdminAuth,
  isCloudSynced = false,
  selectedProduct = 'ESS8-1',
  setSelectedProduct
}) {
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const productMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productMenuRef.current && !productMenuRef.current.contains(e.target)) {
        setIsProductMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.toggleSound(next);
    if (next) sound.playClick();
  };

  const handleCrtToggle = () => {
    sound.playClick();
    setCrtEnabled(!crtEnabled);
  };

  const handleSpeedChange = (speed) => {
    sound.playClick();
    setTimeSpeed(speed);
    if (isPaused) setIsPaused(false);
  };

  const handleTimeStep = (hours) => {
    sound.playClick();
    setSimTime(new Date(simTime.getTime() + hours * 3600 * 1000));
  };

  const formatSimTime = (date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <header className="w-full bg-[#0a0f1c]/95 border-b-2 border-[#223652] px-3 py-1.5 shadow-lg relative z-30 select-none overflow-hidden">
      <div className="w-full flex items-center justify-between flex-nowrap gap-2">
        
        {/* Left: Tactical Logo & Operation Title */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="relative">
            <div className="w-7 h-7 bg-[#111e33] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="px-1 py-0.2 text-[8.5px] font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/60 uppercase tracking-wider">
                {t('versionTag', lang)}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                {isCloudSynced ? (lang === 'en' ? 'Cloud Live Sync' : '실시간 클라우드 연동중') : t('satelliteTracking', lang)}
              </span>
            </div>
            <h1 className="text-xs md:text-sm font-black tracking-tight text-white whitespace-nowrap">
              {t('appTitle', lang)}
            </h1>
          </div>
        </div>

        {/* Product Selector Dropdown (ESS8-1 / ESS11-1 / ALL) */}
        <div className="relative flex-shrink-0" ref={productMenuRef}>
          <button
            onClick={() => {
              sound.playClick();
              setIsProductMenuOpen(!isProductMenuOpen);
            }}
            className="px-2.5 py-1 bg-[#152e4d] hover:bg-[#1c3c64] border-2 border-cyan-400 text-white font-mono font-black text-xs rounded flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
            title={lang === 'ko' ? '품목 선택 (상황별 재고/물류 필터)' : 'Select Product Model'}
          >
            <Package className="w-3.5 h-3.5 text-cyan-300" />
            <span className="tracking-wide">{selectedProduct === 'ALL' ? (lang === 'ko' ? '전체 품목' : 'ALL ITEMS') : selectedProduct}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-cyan-300 transition-transform ${isProductMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProductMenuOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-44 bg-[#09111c] border-2 border-cyan-400 shadow-2xl z-50 p-1 font-mono space-y-1 animate-fadeIn">
              <div className="px-2 py-1 text-[10px] text-slate-400 border-b border-slate-700 font-bold">
                {lang === 'ko' ? '■ 품목별 전술 관제 선택' : '■ Select Product Model'}
              </div>
              {[
                { id: 'ESS8-1', label: 'ESS8-1', desc: lang === 'ko' ? '기본 모델 (Main Line)' : 'Primary Line' },
                { id: 'ESS11-1', label: 'ESS11-1', desc: lang === 'ko' ? '확장 모델 (Extended Line)' : 'Extended Line' },
                { id: 'ALL', label: lang === 'ko' ? '전체 품목 (ALL)' : 'ALL ITEMS', desc: lang === 'ko' ? '통합 합산 뷰' : 'Combined View' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    if (setSelectedProduct) setSelectedProduct(item.id);
                    setIsProductMenuOpen(false);
                  }}
                  className={`w-full text-left p-1.5 rounded transition-all flex items-center justify-between ${
                    selectedProduct === item.id 
                      ? 'bg-cyan-950 border border-cyan-400 text-white font-black' 
                      : 'hover:bg-[#121f33] text-slate-300 border border-transparent'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[9px] text-slate-400">{item.desc}</div>
                  </div>
                  {selectedProduct === item.id && (
                    <span className="text-xs text-cyan-400 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Controls & Actions (Single-row flex-nowrap) */}
        <div className="flex items-center space-x-1.5 flex-shrink-0 font-mono">
          
          {/* Group 1: Simulation Clock & Step Jump (-1d / +1d) */}
          <div className="flex items-center bg-[#101828] border border-[#23354d] px-1.5 py-0.5 rounded space-x-1 shadow-inner">
            <Clock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <input
              type="date"
              value={simTime.toISOString().slice(0, 10)}
              onChange={(e) => {
                if (e.target.value) {
                  sound.playClick();
                  setSimTime(new Date(e.target.value + 'T09:00:00'));
                }
              }}
              className="bg-[#0b1322] border border-cyan-500/60 px-1 py-0.5 text-[11px] text-amber-300 font-bold font-mono outline-none cursor-pointer rounded"
              title={t('dateDirectSelect', lang)}
            />
            <button
              onClick={() => handleTimeStep(-240)}
              className="px-1.5 py-0.5 bg-[#17253b] hover:bg-cyan-900 border border-slate-600 hover:border-cyan-400 text-slate-200 text-[11px] font-bold text-center rounded transition-colors whitespace-nowrap"
              title="-240h (-10d)"
            >
              {t('stepMinus10d', lang)}
            </button>
            <button
              onClick={() => handleTimeStep(-24)}
              className="px-1.5 py-0.5 bg-[#17253b] hover:bg-cyan-900 border border-slate-600 hover:border-cyan-400 text-slate-200 text-[11px] font-bold text-center rounded transition-colors whitespace-nowrap"
              title="-24h (-1d)"
            >
              {t('stepMinus1d', lang)}
            </button>
            <button
              onClick={() => handleTimeStep(24)}
              className="px-1.5 py-0.5 bg-[#17253b] hover:bg-cyan-900 border border-slate-600 hover:border-cyan-400 text-slate-200 text-[11px] font-bold text-center rounded transition-colors whitespace-nowrap"
              title="+24h (+1d)"
            >
              {t('stepPlus1d', lang)}
            </button>
            <button
              onClick={() => handleTimeStep(240)}
              className="px-1.5 py-0.5 bg-[#17253b] hover:bg-cyan-900 border border-slate-600 hover:border-cyan-400 text-slate-200 text-[11px] font-bold text-center rounded transition-colors whitespace-nowrap"
              title="+240h (+10d)"
            >
              {t('stepPlus10d', lang)}
            </button>
          </div>

          {/* Group 2: Play/Pause & Speeds (30분, 1시간, 3시간) */}
          <div className="flex items-center bg-[#101828] border border-[#23354d] px-1.5 py-0.5 rounded space-x-1 shadow-inner">
            <button
              onClick={() => {
                sound.playClick();
                setIsPaused(!isPaused);
              }}
              className={`px-2 py-0.5 flex items-center justify-center gap-1 border transition-colors whitespace-nowrap text-[11px] font-bold rounded ${
                isPaused 
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                  : 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
              }`}
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play className="w-3 h-3 fill-current flex-shrink-0" /> : <Pause className="w-3 h-3 fill-current animate-pulse flex-shrink-0" />}
              <span>{isPaused ? t('pause', lang) : t('running', lang)}</span>
            </button>

            {[
              { value: 0.5, label: t('speed30m', lang) },
              { value: 1, label: t('speed1h', lang) },
              { value: 3, label: t('speed3h', lang) }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSpeedChange(opt.value)}
                className={`px-1.5 py-0.5 border transition-colors text-[11px] font-bold text-center rounded whitespace-nowrap ${
                  timeSpeed === opt.value
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.35)]'
                    : 'bg-[#131d2e] border-[#22354d] text-slate-400 hover:text-slate-200'
                }`}
                title={opt.label}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Group 3: Role-Based Access Mode */}
          {authRole ? (
            <div className={`px-2 py-0.5 text-[11px] font-mono flex items-center gap-1 rounded border shadow-sm whitespace-nowrap ${
              authRole === 'INCHEON_LEAD'
                ? 'bg-[#09222b] border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                : authRole === 'USA_LEAD'
                ? 'bg-[#291b0c] border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                : 'bg-[#092217] border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            }`}>
              <Unlock className="w-3 h-3 flex-shrink-0" />
              <span className="font-bold">
                {authRole === 'INCHEON_LEAD'
                  ? (lang === 'en' ? 'Incheon' : '인천담당자')
                  : authRole === 'USA_LEAD'
                  ? (lang === 'en' ? 'US Lead' : '미국담당자')
                  : t('adminUnlocked', lang)}
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  if (setAuthRole) setAuthRole(null);
                  if (setIsAdmin) setIsAdmin(false);
                }}
                className="ml-0.5 px-1 py-0.2 bg-[#143d2b] hover:bg-rose-900 hover:text-white text-[9.5px] text-slate-200 rounded border border-slate-600 transition-colors"
                title="Logout"
              >
                {t('adminLogout', lang)}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenAdminAuth();
              }}
              className="px-2 py-0.5 text-[11px] font-mono bg-[#1c1810] hover:bg-[#2e2617] border border-amber-500/80 text-amber-300 flex items-center gap-1 rounded transition-all hover:brightness-110 whitespace-nowrap"
              title={lang === 'en' ? 'Click to login with Station PIN' : '담당자 PIN 로그인'}
            >
              <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="font-bold">{t('adminReadOnly', lang)}</span>
            </button>
          )}

          {/* Group 4: HUD Summary Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsHudVisible(!isHudVisible);
            }}
            className={`px-2 py-0.5 text-[11px] font-mono border rounded flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
              isHudVisible
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'bg-[#121a2a] border-[#23354d] text-slate-400 hover:text-slate-200'
            }`}
            title={t('inventoryHud', lang)}
          >
            <Layers className="w-3 h-3 flex-shrink-0" />
            <span>{t('inventoryHud', lang)}</span>
          </button>

          {/* Group 5: Data Management Modal Trigger */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenDataModal();
            }}
            className="px-2.5 py-0.5 text-[11px] font-bold font-mono bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-400/80 text-emerald-200 hover:text-white rounded flex items-center justify-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
          >
            <Database className="w-3 h-3 flex-shrink-0" />
            <span>{t('dataManagement', lang)}</span>
          </button>

          {/* Group 6: Sound / CRT / Settings Icons */}
          <div className="flex items-center space-x-1 pl-1 border-l border-[#223652]">
            <button
              onClick={handleSoundToggle}
              className={`p-1 border rounded transition-colors ${
                soundEnabled 
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300' 
                  : 'bg-[#141b2a] border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? t('soundOn', lang) : t('soundOff', lang)}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>

            <button
              onClick={handleCrtToggle}
              className={`p-1 border rounded transition-colors ${
                crtEnabled 
                  ? 'bg-purple-950 border-purple-400 text-purple-300 shadow-[0_0_6px_rgba(192,132,252,0.3)]' 
                  : 'bg-[#141b2a] border-slate-700 text-slate-500'
              }`}
              title={crtEnabled ? t('crtOn', lang) : t('crtOff', lang)}
            >
              <Monitor className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="p-1 border border-[#283d5a] bg-[#121c2d] text-slate-400 hover:text-white rounded transition-colors"
              title={t('settings', lang)}
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
