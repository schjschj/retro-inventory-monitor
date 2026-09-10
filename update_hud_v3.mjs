import fs from 'fs';
import path from 'path';

const hudContent = `import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Factory, 
  Ship, 
  Building2, 
  ShieldCheck, 
  EyeOff, 
  AlertCircle, 
  CheckSquare, 
  Square,
  Move
} from 'lucide-react';
import { sound } from '../utils/soundFx';

export default function InventorySummaryHud({
  incheonInventory,
  shipments,
  kokomoInventory,
  speInventory,
  isVisible,
  onToggleVisibility,
  activeFilter,
  setActiveFilter,
  includedCategories,
  setIncludedCategories
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Position options: 'BOTTOM_RIGHT' (default, over ocean, unblocks US!) | 'TOP_CENTER' | 'BOTTOM_LEFT'
  const [hudPosition, setHudPosition] = useState('BOTTOM_RIGHT');

  // Item totals
  const incheonWaiting = (incheonInventory.waitingInspection || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const incheonPassed = (incheonInventory.passedInspection || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const incheonTotal = incheonWaiting + incheonPassed;

  const transitTotal = (shipments || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const seaShipments = (shipments || []).filter(s => s.type === 'SEA');
  const airShipments = (shipments || []).filter(s => s.type === 'AIR');
  const delayedShipments = (shipments || []).filter(s => s.isDelayed);

  const kokomoTotal = (Number(kokomoInventory.multiAssy) || 0) + (Number(kokomoInventory.capAssy) || 0) + (Number(kokomoInventory.backShip) || 0);
  const speTotal = Number(speInventory.totalInventory) || 0;

  // DYNAMIC GRAND TOTAL: Only sums the checked categories!
  const grandTotal = 
    (includedCategories.incheon ? incheonTotal : 0) +
    (includedCategories.transit ? transitTotal : 0) +
    (includedCategories.kokomo ? kokomoTotal : 0) +
    (includedCategories.spe ? speTotal : 0);

  const toggleCategory = (key, e) => {
    e.stopPropagation();
    sound.playToggle();
    setIncludedCategories({
      ...includedCategories,
      [key]: !includedCategories[key]
    });
  };

  const handleSelectAll = (select) => {
    sound.playClick();
    setIncludedCategories({
      incheon: select,
      transit: select,
      kokomo: select,
      spe: select
    });
  };

  const cyclePosition = () => {
    sound.playClick();
    if (hudPosition === 'BOTTOM_RIGHT') setHudPosition('TOP_CENTER');
    else if (hudPosition === 'TOP_CENTER') setHudPosition('BOTTOM_LEFT');
    else setHudPosition('BOTTOM_RIGHT');
  };

  if (!isVisible) return null;

  // Position classes
  const getPositionClasses = () => {
    if (hudPosition === 'TOP_CENTER') {
      return 'top-3 left-1/2 -translate-x-1/2 w-[420px]';
    }
    if (hudPosition === 'BOTTOM_LEFT') {
      return 'bottom-4 left-4 w-80 md:w-84';
    }
    // Default: BOTTOM_RIGHT (placed in open Pacific Ocean water, completely unblocking US mainland!)
    return 'bottom-4 right-4 w-80 md:w-84';
  };

  return (
    <div className={\`absolute z-30 font-mono shadow-2xl transition-all duration-300 \${getPositionClasses()}\`}>
      <div className="pixel-box bg-[#09101d] border-2 border-cyan-400">
        
        {/* HUD Header */}
        <div className="bg-[#121f36] px-3 py-2 border-b border-cyan-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400"></span>
            <span className="text-xs font-black text-cyan-300 tracking-wider">
              전체 재고 현황 HUD
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Position switch */}
            <button
              onClick={cyclePosition}
              className="p-1 hover:bg-[#1f314f] text-slate-300 hover:text-cyan-300 rounded text-[10px] flex items-center gap-0.5"
              title="HUD 위치 변경 (하단/상단 이동)"
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 hover:bg-[#1f314f] text-slate-300 hover:text-white rounded"
              title={isCollapsed ? "펼치기" : "접기"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleVisibility();
              }}
              className="p-1 hover:bg-[#1f314f] text-slate-400 hover:text-rose-400 rounded"
              title="HUD 숨기기"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsed State */}
        {isCollapsed ? (
          <div className="p-2.5 flex items-center justify-between text-xs bg-[#0b1322]">
            <span className="text-slate-300 text-[11px] font-bold">선택 재고 합계:</span>
            <span className="text-amber-300 font-bold text-sm">
              {grandTotal.toLocaleString()} <span className="text-[10px] text-slate-400">EA</span>
            </span>
          </div>
        ) : (
          /* Expanded State */
          <div className="p-3 text-xs space-y-2">
            
            {/* Grand Total Box (Sums only checked items) */}
            <div className="bg-[#0e243d] p-2 border border-cyan-400 flex items-center justify-between shadow-md">
              <div>
                <div className="text-[10px] text-cyan-300 font-black uppercase tracking-wider">
                  선택 항목 총계 (TOTAL)
                </div>
                <div className="text-[10px] text-slate-300 font-semibold">
                  체크된 거점 재고만 자동 합산
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-amber-300 tracking-wider">
                  {grandTotal.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-300 font-bold">단위: EA</div>
              </div>
            </div>

            {/* Select All / Deselect All Controls */}
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 border-b border-slate-800 pb-1">
              <span>포함 여부 선택:</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-cyan-400 hover:text-cyan-200 font-bold underline"
                >
                  전체선택
                </button>
                <span>|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  전체해제
                </button>
              </div>
            </div>

            {/* 4 Interactive Checkbox Items */}
            <div className="space-y-1.5 text-[11px]">
              
              {/* ITEM 1: 인천 사업장 */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'INCHEON' ? null : 'INCHEON');
                }}
                className={\`p-1.5 border transition-all cursor-pointer \${
                  !includedCategories.incheon
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'INCHEON' 
                    ? 'bg-cyan-950/80 border-cyan-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-cyan-500'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('incheon', e)}
                      className="text-cyan-400 hover:text-cyan-200"
                    >
                      {includedCategories.incheon ? (
                        <CheckSquare className="w-4 h-4 fill-cyan-950 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <Factory className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. 인천 사업장</span>
                    </div>
                  </div>
                  <span className={\`font-bold \${includedCategories.incheon ? 'text-white' : 'text-slate-500 line-through'}\`}>
                    {incheonTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

              {/* ITEM 2: 해상/항공 운송중 */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'TRANSIT' ? null : 'TRANSIT');
                }}
                className={\`p-1.5 border transition-all cursor-pointer \${
                  !includedCategories.transit
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'TRANSIT' 
                    ? 'bg-cyan-950/80 border-cyan-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-cyan-500'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('transit', e)}
                      className="text-cyan-400 hover:text-cyan-200"
                    >
                      {includedCategories.transit ? (
                        <CheckSquare className="w-4 h-4 fill-cyan-950 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <Ship className="w-3.5 h-3.5 text-sky-400" />
                      <span>2. 해상/항공 운송중</span>
                    </div>
                  </div>
                  <span className={\`font-bold \${includedCategories.transit ? 'text-sky-300' : 'text-slate-500 line-through'}\`}>
                    {transitTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

              {/* ITEM 3: 미주법인 (코코모) */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'KOKOMO' ? null : 'KOKOMO');
                }}
                className={\`p-1.5 border transition-all cursor-pointer \${
                  !includedCategories.kokomo
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'KOKOMO' 
                    ? 'bg-amber-950/60 border-amber-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-amber-500'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('kokomo', e)}
                      className="text-amber-400 hover:text-amber-200"
                    >
                      {includedCategories.kokomo ? (
                        <CheckSquare className="w-4 h-4 fill-amber-950 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>3. 미주법인 (코코모)</span>
                    </div>
                  </div>
                  <span className={\`font-bold \${includedCategories.kokomo ? 'text-amber-300' : 'text-slate-500 line-through'}\`}>
                    {kokomoTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

              {/* ITEM 4: 고객 SPE */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'SPE' ? null : 'SPE');
                }}
                className={\`p-1.5 border transition-all cursor-pointer \${
                  !includedCategories.spe
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'SPE' 
                    ? 'bg-emerald-950/60 border-emerald-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-emerald-500'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('spe', e)}
                      className="text-emerald-400 hover:text-emerald-200"
                    >
                      {includedCategories.spe ? (
                        <CheckSquare className="w-4 h-4 fill-emerald-950 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>4. 고객 SPE 재고</span>
                    </div>
                  </div>
                  <span className={\`font-bold \${includedCategories.spe ? 'text-emerald-300' : 'text-slate-500 line-through'}\`}>
                    {speTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>* 미국 맵 개방을 위해 하단 수역에 배치</span>
              {activeFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilter(null);
                  }}
                  className="text-cyan-400 underline"
                >
                  포커스 해제
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/InventorySummaryHud.jsx'), hudContent, 'utf8');
console.log('InventorySummaryHud.jsx updated with non-blocking placement and position switch.');
