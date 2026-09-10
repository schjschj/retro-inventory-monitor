import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  MapPin, 
  Volume2, 
  Monitor, 
  RotateCcw, 
  Type, 
  PauseCircle, 
  FastForward, 
  Globe, 
  Camera, 
  Upload, 
  User, 
  Lock, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { sound } from '../utils/soundFx';
import { KEY_NODES } from '../utils/geoCoordinates';
import { t } from '../utils/i18n';
import { getAuthPins, saveAuthPins } from '../utils/authConfig';

export default function SettingsModal({
  isOpen,
  onClose,
  customSpeCoords,
  setCustomSpeCoords,
  soundEnabled,
  setSoundEnabled,
  soundVolume = 0.8,
  setSoundVolume,
  crtEnabled,
  setCrtEnabled,
  onResetData,
  fontScale = 'normal',
  setFontScale,
  highContrast = false,
  setHighContrast,
  autoPauseOnDelay = false,
  setAutoPauseOnDelay,
  timeSpeed = 0.5,
  setTimeSpeed,
  lang = 'ko',
  setLang,
  showPhotos = true,
  setShowPhotos,
  commanderPhotos,
  onUpdateCommanderPhoto,
  isAdmin = false,
  authRole = null,
  onOpenAdminAuth
}) {
  const incheonInputRef = useRef(null);
  const kokomoInputRef = useRef(null);

  const isMasterAdmin = isAdmin || authRole === 'MASTER_ADMIN';
  const [pinForm, setPinForm] = useState({ master: '', incheon: '', usa: '' });
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPinForm(getAuthPins());
      setPinSuccessMsg('');
      setPinErrorMsg('');
    }
  }, [isOpen]);

  const handleSavePins = (e) => {
    e.preventDefault();
    if (!pinForm.master || !pinForm.incheon || !pinForm.usa) {
      sound.playAlert();
      setPinErrorMsg(lang === 'ko' ? '모든 비밀번호(PIN)를 입력해주세요.' : 'Please enter all PIN fields.');
      return;
    }
    const res = saveAuthPins(pinForm);
    if (res.success) {
      sound.playSuccess();
      setPinErrorMsg('');
      setPinSuccessMsg(lang === 'ko' ? '✅ 보안 비밀번호(PIN)가 성공적으로 변경되었습니다!' : '✅ Security PINs updated successfully!');
      setTimeout(() => setPinSuccessMsg(''), 4000);
    } else {
      sound.playAlert();
      setPinErrorMsg(lang === 'ko' ? '비밀번호 저장 중 오류가 발생했습니다.' : 'Error saving security PINs.');
    }
  };

  if (!isOpen) return null;

  const handlePhotoUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      if (onUpdateCommanderPhoto) {
        onUpdateCommanderPhoto(key, base64);
        sound.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = (key) => {
    sound.playClick();
    const defaultPhoto = key === 'INCHEON' ? '/assets/commander_incheon.png' : '/assets/commander_usa.png';
    if (onUpdateCommanderPhoto) {
      onUpdateCommanderPhoto(key, defaultPhoto);
    }
  };

  const fontScaleOptions = [
    { id: 'compact', label: t('sizeCompact', lang), scale: '100%', desc: lang === 'ko' ? '기존 100% 배율' : 'Standard 100% density' },
    { id: 'normal', label: t('sizeNormal', lang), scale: '110% (기본)', desc: lang === 'ko' ? '10% 확대 배율 (기본/권장)' : '10% Enhanced scale (Recommended)' },
    { id: 'large', label: t('sizeLarge', lang), scale: '120%', desc: lang === 'ko' ? '가독성 및 텍스트 선명도 강화' : 'Enhanced clarity and readability' },
    { id: 'xlarge', label: t('sizeXLarge', lang), scale: '130%', desc: lang === 'ko' ? '대형 모니터 및 프레젠테이션용' : 'Large display & presentation' }
  ];

  const spePresets = [
    { name: lang === 'ko' ? '인디애나 코코모 인근 클러스터 (기본)' : 'Kokomo IN Nearby Cluster (Default)', x: 1525, y: 320 },
    { name: lang === 'ko' ? '오하이오 배터리/반도체 공장' : 'Ohio Battery/Semiconductor Plant', x: 1470, y: 310 },
    { name: lang === 'ko' ? '텍사스 오스틴 Fab' : 'Texas Austin Fab', x: 1320, y: 460 },
    { name: lang === 'ko' ? '애리조나 피닉스 신규 팹' : 'Arizona Phoenix New Fab', x: 1200, y: 410 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="pixel-box bg-[#0c1322] border-2 border-cyan-400 w-full max-w-xl shadow-[0_0_30px_rgba(0,240,255,0.45)] my-6">
        
        {/* Header */}
        <div className="bg-[#131f35] px-4 py-3 border-b border-cyan-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-black text-cyan-300">{t('settingsTitle', lang)}</h3>
              <p className="text-[10px] text-slate-400">{t('settingsSubtitle', lang)}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 hover:bg-[#203352] text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs max-h-[75vh] overflow-y-auto">

          {/* 0. Language Selector (한국어 / English) */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                {t('langSelectTitle', lang)}
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold rounded uppercase">
                {lang === 'ko' ? '한국어' : 'English'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  sound.playClick();
                  if (setLang) setLang('ko');
                }}
                className={`p-2.5 border text-center transition-all flex items-center justify-center gap-2 ${
                  lang === 'ko'
                    ? 'bg-cyan-950 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400'
                    : 'bg-[#09111c] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-base">🇰🇷</span>
                <span className="font-black text-xs">{t('langKo', lang)}</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  if (setLang) setLang('en');
                }}
                className={`p-2.5 border text-center transition-all flex items-center justify-center gap-2 ${
                  lang === 'en'
                    ? 'bg-cyan-950 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400'
                    : 'bg-[#09111c] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-base">🇺🇸</span>
                <span className="font-black text-xs">{t('langEn', lang)}</span>
              </button>
            </div>
          </div>
          
          {/* 1. Font Size / UI Scaling Options */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-cyan-400" />
                {t('textSizeTitle', lang)}
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold rounded">
                {fontScaleOptions.find(o => o.id === fontScale)?.label}
              </span>
            </div>
            
            <p className="text-slate-400 text-[11px]">
              {t('textSizeSubtitle', lang)}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {fontScaleOptions.map((opt) => {
                const isSelected = fontScale === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      sound.playClick();
                      if (setFontScale) setFontScale(opt.id);
                    }}
                    className={`p-2 border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400'
                        : 'bg-[#09111c] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="font-black text-xs">{opt.label}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{opt.scale}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Simulation Speed Presets: 30m, 1h, 3h */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-2">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <FastForward className="w-4 h-4 text-amber-400" />
              {t('speedSettingTitle', lang)}
            </div>
            <p className="text-slate-400 text-[11px]">
              {t('speedSettingSubtitle', lang)}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { value: 0.5, label: t('speed30m', lang), desc: lang === 'ko' ? '정밀 관제' : 'Precision' },
                { value: 1, label: t('speed1h', lang), desc: lang === 'ko' ? '기본 속도' : 'Standard' },
                { value: 3, label: t('speed3h', lang), desc: lang === 'ko' ? '쾌속 관제' : 'Fast' }
              ].map((sp) => {
                const isSelected = timeSpeed === sp.value;
                return (
                  <button
                    key={sp.value}
                    onClick={() => {
                      sound.playClick();
                      if (setTimeSpeed) setTimeSpeed(sp.value);
                    }}
                    className={`p-2 border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                        : 'bg-[#09111c] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-bold text-xs">{sp.label}</div>
                    <div className="text-[10px] text-slate-400">{sp.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Automation & High Contrast */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-2.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <PauseCircle className="w-4 h-4 text-rose-400" />
              {t('smartAlertTitle', lang)}
            </div>

            <div className="flex items-center justify-between p-2 bg-[#09111c] border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">{t('autoPauseTitle', lang)}</span>
                <p className="text-[10px] text-slate-400">{t('autoPauseSubtitle', lang)}</p>
              </div>
              <button
                onClick={() => {
                  sound.playToggle();
                  if (setAutoPauseOnDelay) setAutoPauseOnDelay(!autoPauseOnDelay);
                }}
                className={`px-3 py-1 border font-bold ${
                  autoPauseOnDelay 
                    ? 'bg-rose-950 border-rose-400 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.4)]' 
                    : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}
              >
                {autoPauseOnDelay ? t('useOn', lang) : t('useOff', lang)}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#09111c] border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">{t('ultraContrastTitle', lang)}</span>
                <p className="text-[10px] text-slate-400">{t('ultraContrastSubtitle', lang)}</p>
              </div>
              <button
                onClick={() => {
                  sound.playToggle();
                  if (setHighContrast) setHighContrast(!highContrast);
                }}
                className={`px-3 py-1 border font-bold ${
                  highContrast 
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                    : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}
              >
                {highContrast ? t('useOn', lang) : t('useOff', lang)}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#09111c] border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">{t('photoToggleTitle', lang)}</span>
                <p className="text-[10px] text-slate-400">{t('photoToggleSubtitle', lang)}</p>
              </div>
              <button
                onClick={() => {
                  sound.playToggle();
                  if (setShowPhotos) setShowPhotos(!showPhotos);
                }}
                className={`px-3 py-1 border font-bold ${
                  showPhotos 
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                    : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}
              >
                {showPhotos ? t('useOn', lang) : t('useOff', lang)}
              </button>
            </div>
          </div>

          {/* 3.5 Station Lead Photos Customization & Upload */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'ko' ? '거점 책임자 사진 등록 및 변경 관리' : 'Station Lead Photo Customization'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {lang === 'ko' ? '브라우저 영구 저장' : 'Persistent Storage'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'ko'
                ? '각 거점의 담당자 사진을 직접 업로드하여 변경할 수 있으며, 변경된 사진은 시스템에 영구 저장됩니다.'
                : 'Upload custom photos for station leaders. Changes are saved permanently to browser storage.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Incheon Lead */}
              <div className="p-3 bg-[#09111c] border border-cyan-500/50 rounded flex flex-col justify-between space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="relative group flex-shrink-0">
                    <img 
                      src={commanderPhotos?.INCHEON || '/assets/commander_incheon.png'} 
                      alt="인천 거점 책임자" 
                      className="w-12 h-15 object-cover object-top border-2 border-cyan-400 rounded shadow-md bg-slate-900"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded pointer-events-none">
                      <Camera className="w-4 h-4 text-cyan-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      {lang === 'ko' ? '인천 사업장 책임자' : 'Incheon Station Lead'}
                    </div>
                    <div className="text-xs font-black text-slate-100 truncate mt-0.5">
                      {lang === 'ko' ? '영업팀 납기, 계획 담당 이경록 책임' : 'Lee Kyung-rok (Sales & Planning)'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'ko' ? '인천 사업장 영업팀 납기 및 생산계획 총괄' : 'Head of Incheon Sales Planning'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="file"
                    ref={incheonInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload('INCHEON', e)}
                  />
                  <button
                    onClick={() => incheonInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2 bg-[#12243d] hover:bg-cyan-900/80 border border-cyan-400 text-cyan-200 hover:text-white text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{lang === 'ko' ? '사진 파일 변경' : 'Upload Photo'}</span>
                  </button>
                  <button
                    onClick={() => handleResetPhoto('INCHEON')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-bold rounded transition-colors"
                    title={lang === 'ko' ? '기본 사진으로 복원' : 'Reset to Default'}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Kokomo US Corp Lead */}
              <div className="p-3 bg-[#09111c] border border-amber-500/50 rounded flex flex-col justify-between space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="relative group flex-shrink-0">
                    <img 
                      src={commanderPhotos?.KOKOMO || '/assets/commander_usa.png'} 
                      alt="미주법인장" 
                      className="w-12 h-15 object-cover object-top border-2 border-amber-400 rounded shadow-md bg-slate-900"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded pointer-events-none">
                      <Camera className="w-4 h-4 text-amber-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      {lang === 'ko' ? '미주법인 (코코모) 총괄' : 'US Corp (Kokomo) Lead'}
                    </div>
                    <div className="text-xs font-black text-slate-100 truncate mt-0.5">
                      {lang === 'ko' ? '미주법인 법인장' : 'US Subsidiary President'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'ko' ? '코코모 공장 생산·물류 및 북미 공급망 총괄' : 'Head of Kokomo Operations'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="file"
                    ref={kokomoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload('KOKOMO', e)}
                  />
                  <button
                    onClick={() => kokomoInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2 bg-[#2a1c0d] hover:bg-amber-900/80 border border-amber-400 text-amber-200 hover:text-white text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{lang === 'ko' ? '사진 파일 변경' : 'Upload Photo'}</span>
                  </button>
                  <button
                    onClick={() => handleResetPhoto('KOKOMO')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-bold rounded transition-colors"
                    title={lang === 'ko' ? '기본 사진으로 복원' : 'Reset to Default'}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Display & Sound FX */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-2.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              {t('soundSettingTitle', lang)}
            </div>
            
            <div className="p-2 bg-[#09111c] border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  {t('soundVolumeTitle', lang)} ({Math.round(soundVolume * 100)}%)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sound.playClick()}
                    className="px-2 py-0.5 bg-[#17253d] hover:bg-cyan-900 border border-slate-600 text-[10px] text-cyan-300 font-bold rounded"
                  >
                    {t('testSoundBtn', lang)}
                  </button>
                  <button
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      sound.toggleSound(next);
                      if (next) sound.playClick();
                    }}
                    className={`px-2.5 py-0.5 border font-bold text-[10px] ${
                      soundEnabled ? 'bg-cyan-900 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (setSoundVolume) setSoundVolume(val);
                  sound.setVolume(val);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-[#09111c] border border-slate-700">
              <div>
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  {t('crtScanlineTitle', lang)}
                </span>
                <p className="text-[10px] text-slate-400">{t('crtScanlineSubtitle', lang)}</p>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setCrtEnabled(!crtEnabled);
                }}
                className={`px-2.5 py-1 border font-bold ${
                  crtEnabled ? 'bg-purple-900 border-purple-400 text-purple-300' : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}
              >
                {crtEnabled ? t('crtOn', lang) : t('crtOff', lang)}
              </button>
            </div>
          </div>

          {/* 5. SPE Location Preset Selector */}
          <div className="bg-[#101b2d] border border-cyan-800 p-3.5 space-y-2">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {t('spePresetTitle', lang)}
            </div>
            <p className="text-slate-400 text-[11px]">
              {t('spePresetSubtitle', lang)}
            </p>
            <div className="space-y-1.5 pt-1">
              {spePresets.map((preset) => {
                const currentX = customSpeCoords?.x ?? KEY_NODES.SPE.x;
                const isSelected = Math.abs(currentX - preset.x) < 5;
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      sound.playClick();
                      setCustomSpeCoords({ x: preset.x, y: preset.y });
                    }}
                    className={`w-full text-left p-2 border flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-bold' 
                        : 'bg-[#09111c] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">X:{preset.x} Y:{preset.y}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5.5 Security PIN Management */}
          <div className="bg-[#101b2d] border border-amber-500/70 p-3.5 space-y-3 shadow">
            <div className="flex items-center justify-between border-b border-amber-600/50 pb-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>{lang === 'en' ? 'Security PINs & Password Configuration' : '보안 PIN 및 관리자 비밀번호 변경'}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 border font-bold rounded ${
                isMasterAdmin ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'
              }`}>
                {isMasterAdmin ? (lang === 'en' ? 'ADMIN UNLOCKED' : '관리자 권한 인가됨') : (lang === 'en' ? 'LOCKED (VIEWER)' : '잠김 (권한 필요)')}
              </span>
            </div>

            {isMasterAdmin ? (
              <form onSubmit={handleSavePins} className="space-y-3">
                <p className="text-[11px] text-slate-300">
                  {lang === 'en' 
                    ? 'Manage passcodes for station leads and master administrator. Changes take effect immediately.' 
                    : '각 거점 담당자 및 마스터 관리자의 보안 비밀번호(PIN)를 변경할 수 있습니다.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                      {lang === 'en' ? 'Master Admin PIN:' : '마스터 관리자 암호:'}
                    </label>
                    <input
                      type="password"
                      value={pinForm.master}
                      onChange={(e) => setPinForm({ ...pinForm, master: e.target.value })}
                      className="w-full bg-[#070d18] border border-amber-500/80 px-2 py-1.5 text-xs text-amber-200 font-bold font-mono outline-none focus:border-cyan-400 rounded"
                      placeholder="••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                      {lang === 'en' ? 'Incheon Lead PIN:' : '인천 담당자 PIN:'}
                    </label>
                    <input
                      type="password"
                      value={pinForm.incheon}
                      onChange={(e) => setPinForm({ ...pinForm, incheon: e.target.value })}
                      className="w-full bg-[#070d18] border border-cyan-500/80 px-2 py-1.5 text-xs text-cyan-200 font-bold font-mono outline-none focus:border-cyan-400 rounded"
                      placeholder="••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                      {lang === 'en' ? 'US Corp Lead PIN:' : '미주법인 담당자 PIN:'}
                    </label>
                    <input
                      type="password"
                      value={pinForm.usa}
                      onChange={(e) => setPinForm({ ...pinForm, usa: e.target.value })}
                      className="w-full bg-[#070d18] border border-cyan-500/80 px-2 py-1.5 text-xs text-cyan-200 font-bold font-mono outline-none focus:border-cyan-400 rounded"
                      placeholder="••••"
                    />
                  </div>
                </div>

                {pinErrorMsg && (
                  <div className="p-2 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{pinErrorMsg}</span>
                  </div>
                )}

                {pinSuccessMsg && (
                  <div className="p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{pinSuccessMsg}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded border border-amber-300 shadow flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Save PINs' : '비밀번호 변경 저장'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-[#080d16] border border-slate-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{lang === 'en' ? 'Master Admin login required to modify station and admin PINs.' : '관리자(마스터) 로그인 시에만 비밀번호를 변경할 수 있습니다.'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    if (onOpenAdminAuth) onOpenAdminAuth();
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded shadow whitespace-nowrap"
                >
                  {lang === 'en' ? 'Admin Login' : '관리자 로그인'}
                </button>
              </div>
            )}
          </div>

          {/* 6. Footer Actions */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-800">
            <button
              onClick={() => {
                if (!isMasterAdmin) {
                  sound.playAlert();
                  alert(lang === 'ko' ? '초기 데모 데이터셋 복원은 관리자(마스터) 권한으로 로그인해야 가능합니다.' : 'Restoring demo dataset requires Master Admin clearance.');
                  if (onOpenAdminAuth) onOpenAdminAuth();
                  return;
                }
                if (confirm(lang === 'ko' ? '초기 목데이터 상태로 복원하시겠습니까? (현재 입력된 모든 재고와 운송 차수가 초기화됩니다)' : 'Restore initial demo dataset?')) {
                  sound.playClick();
                  onResetData();
                  onClose();
                }
              }}
              className={`flex items-center gap-1 text-[11px] underline ${
                isMasterAdmin ? 'text-rose-400 hover:text-rose-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'
              }`}
              title={isMasterAdmin ? '' : (lang === 'ko' ? '관리자 권한 필요' : 'Admin clearance required')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('resetDemoBtn', lang)}</span>
              {!isMasterAdmin && <Lock className="w-3 h-3 text-slate-500 inline ml-0.5" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2 bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-black border border-cyan-400 shadow-md active:scale-95 transition-all"
            >
              {t('saveCloseBtn', lang)}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
