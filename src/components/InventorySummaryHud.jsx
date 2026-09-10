import React, { useState, useRef, useEffect } from 'react';
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
  Move,
  RotateCcw
} from 'lucide-react';
import { sound } from '../utils/soundFx';
import { t } from '../utils/i18n';

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
  setIncludedCategories,
  lang = 'ko'
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Free custom position: { x, y }
  const [customPos, setCustomPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const hudRef = useRef(null);
  const dragInfoRef = useRef({ startMouseX: 0, startMouseY: 0, startX: 0, startY: 0 });

  // Item totals
  const incheonWaiting = (incheonInventory.waitingInspection || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const incheonPassed = (incheonInventory.passedInspection || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const incheonTotal = incheonWaiting + incheonPassed;

  // Active In-Transit vs Arrived at Kokomo
  const activeTransitShipments = (shipments || []).filter(s => (Number(s.progress) || 0) < 100);
  const arrivedShipments = (shipments || []).filter(s => (Number(s.progress) || 0) >= 100);
  const transitTotal = activeTransitShipments.reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const arrivedTotal = arrivedShipments.reduce((a, b) => a + (Number(b.quantity) || 0), 0);

  const seaShipments = activeTransitShipments.filter(s => s.type === 'SEA');
  const airShipments = activeTransitShipments.filter(s => s.type === 'AIR');
  const delayedShipments = activeTransitShipments.filter(s => s.isDelayed);

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

  // Handle start dragging from header
  const handleMouseDown = (e) => {
    // Only left click, and do not drag when clicking inside a button
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('input')) return;
    
    e.preventDefault();
    sound.playClick();
    setIsDragging(true);

    const hudEl = hudRef.current;
    let initialX = window.innerWidth - 360;
    let initialY = window.innerHeight - 380;
    if (hudEl) {
      const rect = hudEl.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
    }
    if (customPos) {
      initialX = customPos.x;
      initialY = customPos.y;
    }

    dragInfoRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: initialX,
      startY: initialY
    };

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragInfoRef.current.startMouseX;
      const dy = moveEvent.clientY - dragInfoRef.current.startMouseY;
      
      const nextX = Math.max(10, Math.min(window.innerWidth - 350, dragInfoRef.current.startX + dx));
      const nextY = Math.max(50, Math.min(window.innerHeight - 80, dragInfoRef.current.startY + dy));
      
      setCustomPos({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetPosition = () => {
    sound.playClick();
    setCustomPos(null);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={hudRef}
      style={customPos ? {
        position: 'fixed',
        left: `${customPos.x}px`,
        top: `${customPos.y}px`,
        zIndex: 40
      } : {
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        zIndex: 35
      }}
      className={`font-mono shadow-2xl select-none w-80 md:w-84 ${isDragging ? 'opacity-90 ring-2 ring-cyan-400 cursor-grabbing' : ''}`}
    >
      <div className="pixel-box bg-[#09101d] border-2 border-cyan-400">
        
        {/* HUD Header - Draggable anywhere */}
        <div 
          onMouseDown={handleMouseDown}
          className="bg-[#121f36] px-3 py-2 border-b border-cyan-500/50 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          title={t('dragToMove', lang)}
        >
          <div className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-black text-cyan-300 tracking-wider">
              {t('hudTitle', lang)}
            </span>
            <span className="text-[9px] text-cyan-400/90 font-semibold bg-cyan-950/80 px-1 py-0.2 border border-cyan-500/40 rounded">
              {t('dragToMove', lang)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {customPos && (
              <button
                onClick={handleResetPosition}
                className="p-1 hover:bg-[#1f314f] text-slate-400 hover:text-cyan-300 rounded text-[10px]"
                title={t('resetPosTooltip', lang)}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 hover:bg-[#1f314f] text-slate-300 hover:text-white rounded"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleVisibility();
              }}
              className="p-1 hover:bg-[#1f314f] text-slate-400 hover:text-rose-400 rounded"
              title="Hide HUD"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsed State */}
        {isCollapsed ? (
          <div className="p-2.5 flex items-center justify-between text-xs bg-[#0b1322]">
            <span className="text-slate-300 text-[11px] font-bold">{t('grandTotalTitle', lang)}:</span>
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
                  {t('grandTotalTitle', lang)}
                </div>
                <div className="text-[10px] text-slate-300 font-semibold">
                  {t('grandTotalSubtitle', lang)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-amber-300 tracking-wider">
                  {grandTotal.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-300 font-bold">{t('unitEa', lang)}</div>
              </div>
            </div>

            {/* Select All / Deselect All Controls */}
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 border-b border-slate-800 pb-1">
              <span>{t('selectionFilter', lang)}:</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-cyan-400 hover:text-cyan-200 font-bold underline"
                >
                  {t('selectAll', lang)}
                </button>
                <span>|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  {t('deselectAll', lang)}
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
                className={`p-1.5 border transition-all cursor-pointer ${
                  !includedCategories.incheon
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'INCHEON' 
                    ? 'bg-cyan-950/80 border-cyan-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-cyan-500'
                }`}
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
                      <span>{t('hudItem1', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${includedCategories.incheon ? 'text-white' : 'text-slate-500 line-through'}`}>
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
                className={`p-1.5 border transition-all cursor-pointer ${
                  !includedCategories.transit
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'TRANSIT' 
                    ? 'bg-cyan-950/80 border-cyan-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-cyan-500'
                }`}
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
                      <span>{t('hudItem2', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${includedCategories.transit ? 'text-sky-300' : 'text-slate-500 line-through'}`}>
                    {transitTotal.toLocaleString()} EA
                  </span>
                </div>
                {arrivedShipments.length > 0 && includedCategories.transit && (
                  <div className="text-[9px] text-slate-400 pl-6 flex justify-between pt-0.5 border-t border-slate-800/60 mt-1">
                    <span>운송중: {activeTransitShipments.length}건</span>
                    <span className="text-emerald-400 font-mono">코코모 입고완료: {arrivedShipments.length}건 (-{arrivedTotal.toLocaleString()} EA 이동)</span>
                  </div>
                )}
              </div>

              {/* ITEM 3: 미주법인 (코코모) */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'KOKOMO' ? null : 'KOKOMO');
                }}
                className={`p-1.5 border transition-all cursor-pointer ${
                  !includedCategories.kokomo
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'KOKOMO' 
                    ? 'bg-amber-950/60 border-amber-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-amber-500'
                }`}
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
                      <span>{t('hudItem3', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${includedCategories.kokomo ? 'text-amber-300' : 'text-slate-500 line-through'}`}>
                    {kokomoTotal.toLocaleString()} EA
                  </span>
                </div>
                {arrivedTotal > 0 && includedCategories.kokomo && (
                  <div className="text-[9px] text-amber-400/90 pl-6 flex justify-between pt-0.5 border-t border-amber-900/40 mt-1 font-mono">
                    <span>기본: {((Number(kokomoInventory.baseTotal) || (kokomoTotal - arrivedTotal))).toLocaleString()} EA</span>
                    <span className="text-emerald-400 font-bold">+철송입고: +{arrivedTotal.toLocaleString()} EA</span>
                  </div>
                )}
              </div>

              {/* ITEM 4: 고객 SPE */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'SPE' ? null : 'SPE');
                }}
                className={`p-1.5 border transition-all cursor-pointer ${
                  !includedCategories.spe
                    ? 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'SPE' 
                    ? 'bg-emerald-950/60 border-emerald-400' 
                    : 'bg-[#0e1726] border-slate-700 hover:border-emerald-500'
                }`}
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
                      <span>{t('hudItem4', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${includedCategories.spe ? 'text-emerald-300' : 'text-slate-500 line-through'}`}>
                    {speTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>{t('hudHint', lang)}</span>
              {activeFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilter(null);
                  }}
                  className="text-cyan-400 underline"
                >
                  {t('focusRelease', lang)}
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
