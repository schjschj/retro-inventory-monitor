import React from 'react';
import { Ship, Plane, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/soundFx';
import { formatDateDisplay } from '../utils/excelParser';
import { t } from '../utils/i18n';

export default function BottomTransitTable({
  shipments,
  onSelectShipment,
  activeFilter,
  onOpenDataModal,
  lang = 'ko'
}) {
  const filteredShipments = (shipments || []).filter(s => {
    if (!activeFilter) return true;
    if (activeFilter === 'TRANSIT') return true;
    if (activeFilter === 'DELAYED') return s.isDelayed;
    return true;
  });

  return (
    <div className="w-full bg-[#090e1a] border-t-2 border-[#1c2d42] p-3 font-mono">
      <div className="max-w-[1920px] mx-auto">
        
        {/* Table Header / Title */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400"></span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              {t('tableTitle', lang)} ({filteredShipments.length})
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenDataModal();
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-200 font-bold underline flex items-center gap-1"
          >
            <span>+ {t('dataManagement', lang)}</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#101b2d] text-slate-300 border-b border-slate-700">
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
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredShipments.map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => onSelectShipment(s)}
                  className="hover:bg-[#142238] cursor-pointer transition-colors"
                >
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-[#1a283e] border border-slate-600">
                      {s.type === 'SEA' ? <Ship className="w-3.5 h-3.5 text-cyan-400" /> : s.type === 'AIR' ? <Plane className="w-3.5 h-3.5 text-sky-400" /> : <Truck className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="font-bold">
                        {s.type === 'SEA' 
                          ? (s.inlandMode === 'TRUCK' 
                              ? (lang === 'ko' ? '해상+트럭' : 'Sea+Truck') 
                              : (lang === 'ko' ? '해상+철송' : 'Sea+Rail')) 
                          : s.type === 'AIR' 
                          ? (lang === 'ko' ? '항공' : 'Air') 
                          : (lang === 'ko' ? '내륙철도/트럭' : 'Rail/Truck')}
                      </span>
                    </span>
                  </td>
                  <td className="p-2 font-bold text-white">{s.batchNo}</td>
                  <td className="p-2 text-slate-300">{s.vesselName}</td>
                  <td className="p-2 font-mono text-cyan-300 font-bold">{s.containerNo}</td>
                  <td className="p-2 text-slate-300 font-mono">
                    {formatDateDisplay(s.departureDate)} ➔ <span className={s.isDelayed ? 'text-rose-400 font-bold' : 'text-slate-100 font-bold'}>{formatDateDisplay(s.eta)}</span>
                  </td>
                  <td className="p-2 text-right font-bold text-amber-300">
                    {(Number(s.quantity) || 0).toLocaleString()} EA
                  </td>
                  <td className="p-2 text-slate-300 text-[10px]">
                    {s.progress <= 70 
                      ? (lang === 'ko' ? '태평양 해상 항해' : 'Pacific Voyage') 
                      : s.progress < 100 
                      ? (s.inlandMode === 'TRUCK' 
                          ? (lang === 'ko' ? '미 내륙 싱글(트럭)' : 'US Overland Truck') 
                          : (lang === 'ko' ? '미 내륙 철송(철도)' : 'US Overland Rail')) 
                      : (lang === 'ko' ? '코코모 법인 입고' : 'Delivered Kokomo')}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 h-2 rounded-none border border-slate-700 overflow-hidden">
                        <div 
                          className={`h-full ${s.isDelayed ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}`}
                          style={{ width: `${Math.max(0, Math.min(100, Number(s.progress) || 0))}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-200 w-8 text-right">{Math.round(Number(s.progress) || 0)}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    {s.isDelayed ? (
                      <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-500 text-rose-400 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> {t('delayedBadge', lang)}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
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
