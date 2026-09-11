import React from 'react';
import { Ship, Plane, Truck, Train, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/soundFx';
import { formatDateDisplay } from '../utils/excelParser';
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

export default function BottomTransitTable({
  shipments,
  onSelectShipment,
  activeFilter,
  onOpenDataModal,
  lang = 'ko',
  simTime,
  themeMode = 'dark'
}) {
  const isLight = themeMode === 'light';
  const currentMs = simTime ? new Date(simTime).getTime() : Date.now();
  const isDeparted = (s) => isNaN(new Date(s.departureDate).getTime()) || currentMs >= new Date(s.departureDate).getTime();

  const filteredShipments = (shipments || []).filter(s => {
    if (!activeFilter) return true;
    if (activeFilter === 'TRANSIT') return true;
    if (activeFilter === 'DELAYED') return s.isDelayed;
    return true;
  });

  // Sort by ETA ascending (ETA 기준 오름차순: 가장 먼저 도착하는 차수 우선)
  const sortedShipments = [...filteredShipments].sort((a, b) => {
    const timeA = new Date(a.eta).getTime() || 0;
    const timeB = new Date(b.eta).getTime() || 0;
    return timeA - timeB;
  });

  return (
    <div className={`w-full border-t-2 p-3 font-mono transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-inner' : 'bg-[#090e1a] border-[#1c2d42]'
    }`}>
      <div className="max-w-[1920px] mx-auto">
        
        {/* Table Header / Title */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 ${isLight ? 'bg-blue-600' : 'bg-cyan-400'}`}></span>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>
              {t('tableTitle', lang)} ({sortedShipments.length})
            </span>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              · {lang === 'en' ? 'ETA Ascending' : 'ETA 오름차순'}
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenDataModal();
            }}
            className={`text-[11px] font-bold underline flex items-center gap-1 ${
              isLight ? 'text-blue-600 hover:text-blue-800' : 'text-cyan-400 hover:text-cyan-200'
            }`}
          >
            <span>+ {t('dataManagement', lang)}</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className={`border-b ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#101b2d] text-slate-300 border-slate-700'
              }`}>
                <th className="p-2 font-bold">{t('colMode', lang)}</th>
                <th className="p-2 font-bold">{t('colBatch', lang)}</th>
                <th className="p-2 font-bold">{t('colVessel', lang)}</th>
                <th className="p-2 font-bold">{t('colContainer', lang)}</th>
                <th className="p-2 font-bold">{t('colDepart', lang)} ➔ {t('colEta', lang)}</th>
                <th className="p-2 text-right font-bold">{t('colQty', lang)}</th>
                <th className="p-2 font-bold">{t('colStage', lang)}</th>
                <th className="p-2 w-32 font-bold">{t('colProgress', lang)}</th>
                <th className="p-2 text-center font-bold">{t('colStatus', lang)}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'
            }`}>
              {sortedShipments.map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => onSelectShipment(s)}
                  className={`cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-[#142238]'
                  }`}
                >
                  <td className="p-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#1a283e] border-slate-600'
                    }`}>
                      {s.type === 'SEA' ? (
                        s.inlandMode === 'TRUCK' ? (
                          <span className="inline-flex items-center gap-1">
                            <Ship className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>+</span>
                            <Truck className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Ship className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>+</span>
                            <Train className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                          </span>
                        )
                      ) : s.type === 'AIR' ? (
                        <Plane className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
                      ) : s.inlandMode === 'TRUCK' || s.type === 'TRUCK' ? (
                        <Truck className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                      ) : (
                        <Train className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      )}
                      <span className="font-bold">
                        {s.type === 'SEA' 
                          ? (s.inlandMode === 'TRUCK' 
                              ? (lang === 'ko' ? '해상+직송트럭' : 'Sea+Truck') 
                              : (lang === 'ko' ? '해상+화물철송' : 'Sea+Rail')) 
                          : s.type === 'AIR' 
                          ? (lang === 'ko' ? '항공' : 'Air') 
                          : s.inlandMode === 'TRUCK' || s.type === 'TRUCK'
                          ? (lang === 'ko' ? '내륙 직송트럭' : 'Direct Truck')
                          : (lang === 'ko' ? '내륙 화물철송' : 'Inland Rail')}
                      </span>
                    </span>
                  </td>
                  <td className={`p-2 font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                      isLight ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-cyan-950 border-cyan-500/60 text-cyan-300'
                    }`}>
                      {s.product || (s.items?.[0]?.name?.includes('11-1') ? 'ESS11-1' : 'ESS8-1')}
                    </span>
                    <span>{formatBatchNo(s.batchNo, lang)}</span>
                  </td>
                  <td className={`p-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{s.vesselName}</td>
                  <td className={`p-2 font-mono font-bold ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>{s.containerNo}</td>
                  <td className={`p-2 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {formatDateDisplay(s.departureDate)} ➔ <span className={s.isDelayed ? (isLight ? 'text-rose-600 font-bold' : 'text-rose-400 font-bold') : (isLight ? 'text-slate-900 font-bold' : 'text-slate-100 font-bold')}>{formatDateDisplay(s.eta)}</span>
                  </td>
                  <td className={`p-2 text-right font-black ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    {(Number(s.quantity) || 0).toLocaleString()} EA
                  </td>
                  <td className={`p-2 text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {!isDeparted(s) ? (
                      <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                        {lang === 'ko' ? '출항 대기 (미출발)' : 'Pending Departure'}
                      </span>
                    ) : s.progress <= 70 ? (
                      lang === 'ko' ? '태평양 해상 항해' : 'Pacific Voyage'
                    ) : s.progress < 100 ? (
                      s.inlandMode === 'TRUCK' 
                        ? (lang === 'ko' ? '미 내륙 싱글(트럭)' : 'US Overland Truck') 
                        : (lang === 'ko' ? '미 내륙 철송(철도)' : 'US Overland Rail')
                    ) : (
                      lang === 'ko' ? '코코모 법인 입고' : 'Delivered Kokomo'
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-none border overflow-hidden ${
                        isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'
                      }`}>
                        <div 
                          className={`h-full ${s.isDelayed ? 'bg-rose-500' : (isLight ? 'bg-blue-600' : 'bg-gradient-to-r from-cyan-500 to-emerald-400')}`}
                          style={{ width: `${Math.max(0, Math.min(100, Number(s.progress) || 0))}%` }}
                        ></div>
                      </div>
                      <span className={`text-[10px] font-bold w-8 text-right ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                        {Math.round(Number(s.progress) || 0)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    {s.isDelayed ? (
                      <span className={`px-1.5 py-0.5 border font-bold text-[10px] inline-flex items-center gap-1 ${
                        isLight 
                          ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
                          : 'bg-rose-950 border-rose-500 text-rose-400 animate-pulse'
                      }`}>
                        <AlertTriangle className="w-3 h-3" /> {t('delayedBadge', lang)}
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.5 border font-bold text-[10px] inline-flex items-center gap-1 ${
                        isLight 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                          : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" /> {t('onTimeBadge', lang)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
