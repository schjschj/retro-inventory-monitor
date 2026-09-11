import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { sound } from '../utils/soundFx';
import { formatDateDisplay } from '../utils/excelParser';
import { MAP_DIMENSIONS } from '../utils/geoCoordinates';
import { t } from '../utils/i18n';

function formatBatchNo(batchNo, lang) {
  if (lang !== 'en' || !batchNo) return batchNo;
  return String(batchNo)
    .replace(/해상\s*/g, 'SEA ')
    .replace(/항공\s*/g, 'AIR ')
    .replace(/긴급\s*/g, 'URGENT ')
    .replace(/차\b/g, '')
    .replace(/\(지연\)/g, '(DELAYED)')
    .trim();
}

function formatStageLabel(stage, lang) {
  if (lang !== 'en' || !stage) return stage;
  return String(stage)
    .replace(/인천신항\s*출항/g, 'Departed Incheon Port')
    .replace(/인천공항\s*이륙/g, 'Departed Incheon Airport')
    .replace(/태평양\s*횡단/g, 'Pacific Crossing')
    .replace(/북태평양\s*비행/g, 'Pacific Flight')
    .replace(/롱비치\s*입항/g, 'Long Beach Docked')
    .replace(/시카고\s*착륙/g, 'Chicago Landed')
    .replace(/철송/g, 'Rail')
    .replace(/트럭/g, 'Truck')
    .replace(/코코모\s*도착/g, 'Arrived Kokomo');
}

export default function TransitCarrier({
  shipment,
  position,
  onSelectShipment,
  lang = 'ko',
  themeMode = 'dark'
}) {
  const isLight = themeMode === 'light';
  const [isHovered, setIsHovered] = useState(false);
  const { x, y, mode, stageLabel, isNearNode } = position;

  const handleMouseEnter = () => {
    setIsHovered(true);
    sound.playClick();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const renderPixelSprite = () => {
    if (mode === 'SHIP') {
      return (
        <div className="relative group cursor-pointer">
          <div className={`absolute -left-3 top-2 w-4 h-1 blur-[0.5px] ${isLight ? 'bg-blue-400/40' : 'bg-cyan-400/40'}`}></div>
          
          <div className={`p-1.5 rounded-sm border ${
            shipment.isDelayed 
              ? isLight
                ? 'bg-red-50 border-red-400 text-red-600 shadow-md animate-pulse'
                : 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse' 
              : isLight
                ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-md'
                : 'bg-[#0e2238] border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
          } hover:scale-125 transition-transform duration-200`}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M2 12L4 16H18L21 12H2Z" fill="currentColor" />
              <rect x="5" y="8" width="4" height="4" fill="#38bdf8" />
              <rect x="10" y="8" width="4" height="4" fill="#fbbf24" />
              <rect x="7.5" y="4" width="4" height="4" fill="#f43f5e" />
              <rect x="15" y="6" width="3" height="6" fill={isLight ? '#334155' : '#f8fafc'} />
              <rect x="16" y="3" width="1" height="3" fill="#94a3b8" />
            </svg>
          </div>
        </div>
      );
    }

    if (mode === 'PLANE') {
      return (
        <div className="relative group cursor-pointer">
          <div className={`absolute -left-4 top-2.5 w-5 h-0.5 ${isLight ? 'bg-indigo-300/60' : 'bg-sky-300/50'}`}></div>
          
          <div className={`p-1.5 rounded-sm border ${
            isLight 
              ? 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-md' 
              : 'bg-[#162740] border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
          } hover:scale-125 transition-transform`}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <rect x="2" y="8" width="18" height="3" fill={isLight ? '#475569' : '#f8fafc'} />
              <path d="M20 9.5L16 7V12L20 9.5Z" fill="currentColor" />
              <polygon points="10,2 14,8 8,8" fill="#38bdf8" />
              <polygon points="10,17 14,11 8,11" fill="#38bdf8" />
              <polygon points="3,4 5,8 3,8" fill="#0284c7" />
            </svg>
          </div>
        </div>
      );
    }

    if (mode === 'TRAIN') {
      return (
        <div className="relative group cursor-pointer">
          <div className={`p-1 rounded-sm border ${
            isLight 
              ? 'bg-white border-2 border-emerald-600 text-emerald-600 shadow-md' 
              : 'bg-[#1a2016] border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
          } hover:scale-125 transition-transform`}>
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <rect x="13" y="4" width="8" height="8" fill="#34d399" />
              <rect x="17" y="2" width="2" height="2" fill="#a7f3d0" />
              <rect x="2" y="5" width="9" height="7" fill="#f59e0b" />
              <rect x="1" y="12" width="20" height="2" fill="#475569" />
              <circle cx="5" cy="14" r="1.5" fill={isLight ? '#0f172a' : '#f8fafc'} />
              <circle cx="9" cy="14" r="1.5" fill={isLight ? '#0f172a' : '#f8fafc'} />
              <circle cx="15" cy="14" r="1.5" fill={isLight ? '#0f172a' : '#f8fafc'} />
              <circle cx="19" cy="14" r="1.5" fill={isLight ? '#0f172a' : '#f8fafc'} />
            </svg>
          </div>
        </div>
      );
    }

    // Default: Inland Direct Truck (내륙 직송 싱글 트럭)
    return (
      <div className="relative group cursor-pointer" title={lang === 'ko' ? '미 내륙 직송트럭 (싱글 트럭)' : 'US Direct Inland Truck'}>
        <div className={`p-1 rounded-sm border ${
          isLight 
            ? 'bg-white border-2 border-amber-600 text-amber-600 shadow-md' 
            : 'bg-[#2c1a0c] border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
        } hover:scale-125 transition-transform`}>
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
            {/* Trailer Body */}
            <rect x="1" y="2" width="13" height="9.5" fill="#f59e0b" rx="0.5" />
            <rect x="2" y="3" width="11" height="1.5" fill="#fef3c7" opacity="0.6" />
            <rect x="13" y="7" width="1.5" height="3" fill="#78350f" />
            {/* Tractor Cab */}
            <path d="M14 4h4l3 3.5v4h-7V4z" fill="#d97706" />
            <rect x="16" y="5" width="2.5" height="2.5" fill="#bfdbfe" />
            <rect x="1" y="11" width="20" height="1.5" fill="#334155" />
            {/* Wheels */}
            <circle cx="4" cy="12.5" r="1.8" fill={isLight ? '#0f172a' : '#f8fafc'} />
            <circle cx="8" cy="12.5" r="1.8" fill={isLight ? '#0f172a' : '#f8fafc'} />
            <circle cx="18" cy="12.5" r="1.8" fill={isLight ? '#0f172a' : '#f8fafc'} />
          </svg>
        </div>
      </div>
    );
  };

  const isDimmed = isNearNode && !isHovered;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(x / MAP_DIMENSIONS.width) * 100}%`,
        top: `${(y / MAP_DIMENSIONS.height) * 100}%`,
        transform: `translate(-50%, -50%) scale(${isDimmed ? 0.85 : 1})`,
        opacity: isDimmed ? 0.3 : 1,
        filter: isDimmed ? 'blur(0.5px)' : 'none',
        zIndex: isHovered ? 50 : isDimmed ? 10 : 22,
        transition: 'opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectShipment && onSelectShipment(shipment)}
    >
      <div className="relative flex flex-col items-center">
        {renderPixelSprite()}

        {/* Floating badge is hidden when docked/near a hub to prevent obscuring node text! */}
        {!isDimmed && (
          <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border shadow-sm ${
            shipment.isDelayed
              ? isLight
                ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold'
                : 'bg-red-950 border-red-500 text-red-300 font-bold'
              : isLight
                ? 'bg-white/95 border-slate-300 text-slate-900 font-bold shadow-md'
                : 'bg-black/90 border-slate-700 text-slate-200 font-semibold'
          }`}>
            {formatBatchNo(shipment.batchNo, lang) || t('transitCarrier', lang)}
            {shipment.isDelayed && (
              <span className={`ml-1 font-bold animate-pulse ${isLight ? 'text-rose-600' : 'text-red-400'}`}>
                {t('delayedBadge', lang)}
              </span>
            )}
          </div>
        )}

        {isHovered && (
          <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 p-3 shadow-2xl z-50 text-left pointer-events-none font-mono opacity-100 filter-none border-2 rounded ${
            isLight
              ? 'bg-white border-blue-500 text-slate-900 shadow-xl'
              : 'bg-[#090f1d] border-cyan-400 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
              isLight ? 'border-slate-200' : 'border-cyan-800'
            }`}>
              <div className="flex items-center gap-1.5">
                <Package className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>
                  {formatBatchNo(shipment.batchNo, lang)}
                </span>
              </div>
              <span className={`text-[10px] px-1 py-0.2 border rounded ${
                shipment.isDelayed 
                  ? isLight ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' : 'bg-red-950 border-red-500 text-red-300 font-bold'
                  : isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
              }`}>
                {shipment.isDelayed ? t('delayedEta', lang) : t('onTimeBadge', lang)}
              </span>
            </div>

            <div className={`text-[11px] space-y-1 mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <div className="flex justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{t('vesselCarrier', lang)}:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{shipment.vesselName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{t('containerNo', lang)}:</span>
                <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>{shipment.containerNo || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{t('loadedQty', lang)}:</span>
                <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>{(Number(shipment.quantity) || 0).toLocaleString()} EA</span>
              </div>
              <div className="flex justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{t('etaDate', lang)}:</span>
                <span className={shipment.isDelayed ? (isLight ? 'text-rose-600 font-bold' : 'text-red-400 font-bold') : (isLight ? 'text-slate-900 font-bold' : 'text-slate-200 font-bold')}>
                  {formatDateDisplay(shipment.eta)}
                </span>
              </div>
            </div>

            <div className="mb-2">
              <div className={`flex justify-between text-[10px] mb-0.5 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>{t('progressStage', lang)} ({formatStageLabel(stageLabel, lang)})</span>
                <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-cyan-400'}`}>{Math.round(Number(shipment.progress) || 0)}%</span>
              </div>
              <div className={`w-full h-2 border rounded-none overflow-hidden ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-600'}`}>
                <div 
                  className={`h-full ${shipment.isDelayed ? 'bg-rose-500' : (isLight ? 'bg-blue-600' : 'bg-gradient-to-r from-cyan-500 to-emerald-400')}`}
                  style={{ width: `${Math.max(0, Math.min(100, Number(shipment.progress) || 0))}%` }}
                ></div>
              </div>
            </div>

            {Array.isArray(shipment.items) && shipment.items.length > 0 && (
              <div className={`border-t pt-1.5 text-[10px] space-y-0.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className={`mb-0.5 font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{t('loadedItemsBreakdown', lang)}:</div>
                {shipment.items.map((item, idx) => (
                  <div key={idx} className={`flex justify-between ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    <span>• {item.name}</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{(Number(item.qty) || 0).toLocaleString()} EA</span>
                  </div>
                ))}
              </div>
            )}

            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 ${
              isLight ? 'border-t-blue-500' : 'border-t-cyan-400'
            }`}></div>
          </div>
        )}
      </div>
    </div>
  );
}
