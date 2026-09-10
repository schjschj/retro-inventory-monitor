import fs from 'fs';
import path from 'path';

const carrierContent = `import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { sound } from '../utils/soundFx';
import { formatDateDisplay } from '../utils/excelParser';

export default function TransitCarrier({
  shipment,
  position,
  onSelectShipment
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y, mode, stageLabel } = position;

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
          <div className="absolute -left-3 top-2 w-4 h-1 bg-cyan-400/40 blur-[0.5px]"></div>
          
          <div className={\`p-1.5 rounded-sm border \${
            shipment.isDelayed 
              ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse' 
              : 'bg-[#0e2238] border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
          } hover:scale-125 transition-transform duration-200\`}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M2 12L4 16H18L21 12H2Z" fill="currentColor" />
              <rect x="5" y="8" width="4" height="4" fill="#38bdf8" />
              <rect x="10" y="8" width="4" height="4" fill="#fbbf24" />
              <rect x="7.5" y="4" width="4" height="4" fill="#f43f5e" />
              <rect x="15" y="6" width="3" height="6" fill="#f8fafc" />
              <rect x="16" y="3" width="1" height="3" fill="#94a3b8" />
            </svg>
          </div>
        </div>
      );
    }

    if (mode === 'PLANE') {
      return (
        <div className="relative group cursor-pointer">
          <div className="absolute -left-4 top-2.5 w-5 h-0.5 bg-sky-300/50"></div>
          
          <div className="p-1.5 rounded-sm border bg-[#162740] border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5)] hover:scale-125 transition-transform">
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <rect x="2" y="8" width="18" height="3" fill="#f8fafc" />
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
          <div className="p-1 rounded-sm border bg-[#1a2016] border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)] hover:scale-125 transition-transform">
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <rect x="13" y="4" width="8" height="8" fill="#34d399" />
              <rect x="17" y="2" width="2" height="2" fill="#a7f3d0" />
              <rect x="2" y="5" width="9" height="7" fill="#f59e0b" />
              <rect x="1" y="12" width="20" height="2" fill="#475569" />
              <circle cx="5" cy="14" r="1.5" fill="#f8fafc" />
              <circle cx="9" cy="14" r="1.5" fill="#f8fafc" />
              <circle cx="15" cy="14" r="1.5" fill="#f8fafc" />
              <circle cx="19" cy="14" r="1.5" fill="#f8fafc" />
            </svg>
          </div>
        </div>
      );
    }

    // Default: Truck
    return (
      <div className="relative group cursor-pointer">
        <div className="p-1 rounded-sm border bg-[#271d10] border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)] hover:scale-125 transition-transform">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect x="2" y="3" width="12" height="9" fill="#fbbf24" />
            <path d="M14 6H18L21 9V12H14V6Z" fill="#f97316" />
            <rect x="16" y="7" width="3" height="2" fill="#bae6fd" />
            <circle cx="5" cy="13" r="1.5" fill="#1e293b" />
            <circle cx="11" cy="13" r="1.5" fill="#1e293b" />
            <circle cx="18" cy="13" r="1.5" fill="#1e293b" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: \`\${(x / 1240) * 100}%\`,
        top: \`\${(y / 660) * 100}%\`,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 45 : 25
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectShipment && onSelectShipment(shipment)}
    >
      <div className="relative flex flex-col items-center">
        {renderPixelSprite()}

        <div className={\`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border \${
          shipment.isDelayed
            ? 'bg-red-950 border-red-500 text-red-300 font-bold'
            : 'bg-black/90 border-slate-700 text-slate-200 font-semibold'
        }\`}>
          {shipment.batchNo || '운송차수'}
          {shipment.isDelayed && (
            <span className="ml-1 text-red-400 font-bold animate-pulse">!지연</span>
          )}
        </div>

        {isHovered && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-[#090f1d] border-2 border-cyan-400 p-3 shadow-2xl z-50 text-left pointer-events-none font-mono">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">{shipment.batchNo}</span>
              </div>
              <span className={\`text-[10px] px-1 py-0.2 border \${
                shipment.isDelayed 
                  ? 'bg-red-950 border-red-500 text-red-300 font-bold' 
                  : 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
              }\`}>
                {shipment.isDelayed ? 'ETA 지연' : '정상 운항중'}
              </span>
            </div>

            <div className="text-[11px] space-y-1 text-slate-200 mb-2">
              <div className="flex justify-between">
                <span className="text-slate-400">운송체/편명:</span>
                <span className="text-white font-bold">{shipment.vesselName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">컨테이너 No:</span>
                <span className="text-cyan-300 font-bold">{shipment.containerNo || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">적재 수량:</span>
                <span className="text-amber-300 font-bold">{(Number(shipment.quantity) || 0).toLocaleString()} EA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">도착예상일(ETA):</span>
                <span className={shipment.isDelayed ? 'text-red-400 font-bold' : 'text-slate-200 font-bold'}>
                  {formatDateDisplay(shipment.eta)}
                </span>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-bold">
                <span>진행 단계 ({stageLabel})</span>
                <span className="text-cyan-400 font-bold">{Math.round(Number(shipment.progress) || 0)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 border border-slate-600 rounded-none overflow-hidden">
                <div 
                  className={\`h-full \${shipment.isDelayed ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}\`}
                  style={{ width: \`\${Math.max(0, Math.min(100, Number(shipment.progress) || 0))}%\` }}
                ></div>
              </div>
            </div>

            {Array.isArray(shipment.items) && shipment.items.length > 0 && (
              <div className="border-t border-slate-800 pt-1.5 text-[10px] space-y-0.5">
                <div className="text-slate-400 mb-0.5 font-bold">적재 품목 내역:</div>
                {shipment.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-200">
                    <span>• {item.name}</span>
                    <span className="text-slate-100 font-bold">{(Number(item.qty) || 0).toLocaleString()} EA</span>
                  </div>
                ))}
              </div>
            )}

            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-cyan-400"></div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/TransitCarrier.jsx'), carrierContent, 'utf8');
console.log('TransitCarrier.jsx updated.');
