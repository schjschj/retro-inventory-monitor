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
  lang = 'ko',
  simTime,
  selectedProduct = 'ESS8-1',
  themeMode = 'dark'
}) {
  const isLight = themeMode === 'light';
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Free custom position: { x, y }
  const [customPos, setCustomPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const hudRef = useRef(null);
  const dragInfoRef = useRef({ startMouseX: 0, startMouseY: 0, startX: 0, startY: 0 });

  // Current simulation timestamp
  const currentMs = simTime ? new Date(simTime).getTime() : Date.now();
  const isDeparted = (s) => {
    if (!s.departureDate) return true;
    const depMs = new Date(s.departureDate).getTime();
    if (isNaN(depMs)) return true;
    return currentMs >= depMs;
  };

  // Item totals
  const incheonWaiting = (incheonInventory.waitingInspection || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const incheonPassed = (incheonInventory.passedInspection || []).reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const incheonTotal = incheonWaiting + incheonPassed;

  // Active In-Transit (Only shipments that have departed and progress < 100)
  const activeTransitShipments = (shipments || []).filter(s => isDeparted(s) && (Number(s.progress) || 0) < 100);
  const pendingShipments = (shipments || []).filter(s => !isDeparted(s) && (Number(s.progress) || 0) < 100);
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
      className={`font-mono shadow-2xl select-none w-80 md:w-84 ${isDragging ? (isLight ? 'opacity-90 ring-2 ring-blue-500 cursor-grabbing' : 'opacity-90 ring-2 ring-cyan-400 cursor-grabbing') : ''}`}
    >
      <div className={`pixel-box border-2 rounded-sm overflow-hidden ${
        isLight ? 'bg-white border-slate-300 shadow-xl' : 'bg-[#09101d] border-cyan-400'
      }`}>
        
        {/* HUD Header - Draggable anywhere */}
        <div 
          onMouseDown={handleMouseDown}
          className={`px-3 py-2 border-b flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121f36] border-cyan-500/50'
          }`}
          title={t('dragToMove', lang)}
        >
          <div className="flex items-center gap-1.5">
            <Move className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            <span className={`text-xs font-black tracking-wider ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>
              {t('hudTitle', lang)}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
              isLight 
                ? 'bg-blue-100 text-blue-800 border-blue-300' 
                : 'bg-cyan-950 text-cyan-300 border-cyan-400'
            }`}>
              {selectedProduct === 'ALL' ? (lang === 'ko' ? '전체 품목' : 'ALL') : selectedProduct}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {customPos && (
              <button
                onClick={handleResetPosition}
                className={`p-1 rounded text-[10px] ${
                  isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-[#1f314f] text-slate-400 hover:text-cyan-300'
                }`}
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
              className={`p-1 rounded ${
                isLight ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-[#1f314f] text-slate-300 hover:text-white'
              }`}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleVisibility();
              }}
              className={`p-1 rounded ${
                isLight ? 'hover:bg-slate-200 text-slate-400 hover:text-rose-600' : 'hover:bg-[#1f314f] text-slate-400 hover:text-rose-400'
              }`}
              title="Hide HUD"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsed State */}
        {isCollapsed ? (
          <div className={`p-2.5 flex items-center justify-between text-xs ${
            isLight ? 'bg-slate-50' : 'bg-[#0b1322]'
          }`}>
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {t('grandTotalTitle', lang)}:
            </span>
            <span className={`font-black text-sm ${isLight ? 'text-blue-700' : 'text-amber-300'}`}>
              {grandTotal.toLocaleString()} <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>EA</span>
            </span>
          </div>
        ) : (
          /* Expanded State */
          <div className="p-3 text-xs space-y-2">
            
            {/* Grand Total Box (Sums only checked items) */}
            <div className={`p-2 border flex items-center justify-between shadow-sm rounded-sm ${
              isLight ? 'bg-blue-50/80 border-blue-300' : 'bg-[#0e243d] border-cyan-400 shadow-md'
            }`}>
              <div>
                <div className={`text-[10px] font-black uppercase tracking-wider ${
                  isLight ? 'text-blue-900' : 'text-cyan-300'
                }`}>
                  {t('grandTotalTitle', lang)}
                </div>
                <div className={`text-[10px] font-semibold ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  {t('grandTotalSubtitle', lang)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-base font-black tracking-wider ${
                  isLight ? 'text-blue-700' : 'text-amber-300'
                }`}>
                  {grandTotal.toLocaleString()}
                </div>
                <div className={`text-[9px] font-bold ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>{t('unitEa', lang)}</div>
              </div>
            </div>

            {/* Select All / Deselect All Controls */}
            <div className={`flex items-center justify-between text-[11px] px-1 pb-1 border-b ${
              isLight ? 'text-slate-600 border-slate-200' : 'text-slate-400 border-slate-800'
            }`}>
              <span>{t('selectionFilter', lang)}:</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleSelectAll(true)}
                  className={`font-bold underline ${
                    isLight ? 'text-blue-600 hover:text-blue-800' : 'text-cyan-400 hover:text-cyan-200'
                  }`}
                >
                  {t('selectAll', lang)}
                </button>
                <span>|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className={`underline ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
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
                className={`p-1.5 border transition-all cursor-pointer rounded-sm ${
                  !includedCategories.incheon
                    ? isLight ? 'opacity-40 bg-slate-100 border-slate-200' : 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'INCHEON' 
                    ? isLight ? 'bg-blue-100 border-blue-600 shadow-sm' : 'bg-cyan-950/80 border-cyan-400' 
                    : isLight ? 'bg-slate-50 border-slate-200 hover:border-blue-400' : 'bg-[#0e1726] border-slate-700 hover:border-cyan-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('incheon', e)}
                      className={isLight ? 'text-blue-600 hover:text-blue-800' : 'text-cyan-400 hover:text-cyan-200'}
                    >
                      {includedCategories.incheon ? (
                        <CheckSquare className={`w-4 h-4 ${isLight ? 'fill-blue-100 text-blue-600' : 'fill-cyan-950 text-cyan-400'}`} />
                      ) : (
                        <Square className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                      )}
                    </button>
                    <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <Factory className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                      <span>{t('hudItem1', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-black ${
                    includedCategories.incheon 
                      ? isLight ? 'text-blue-900' : 'text-white' 
                      : isLight ? 'text-slate-400 line-through' : 'text-slate-500 line-through'
                  }`}>
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
                className={`p-1.5 border transition-all cursor-pointer rounded-sm ${
                  !includedCategories.transit
                    ? isLight ? 'opacity-40 bg-slate-100 border-slate-200' : 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'TRANSIT' 
                    ? isLight ? 'bg-sky-100 border-sky-600 shadow-sm' : 'bg-cyan-950/80 border-cyan-400' 
                    : isLight ? 'bg-slate-50 border-slate-200 hover:border-sky-400' : 'bg-[#0e1726] border-slate-700 hover:border-cyan-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('transit', e)}
                      className={isLight ? 'text-sky-600 hover:text-sky-800' : 'text-cyan-400 hover:text-cyan-200'}
                    >
                      {includedCategories.transit ? (
                        <CheckSquare className={`w-4 h-4 ${isLight ? 'fill-sky-100 text-sky-600' : 'fill-cyan-950 text-cyan-400'}`} />
                      ) : (
                        <Square className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                      )}
                    </button>
                    <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <Ship className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
                      <span>{t('hudItem2', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-black ${
                    includedCategories.transit 
                      ? isLight ? 'text-sky-800' : 'text-sky-300' 
                      : isLight ? 'text-slate-400 line-through' : 'text-slate-500 line-through'
                  }`}>
                    {transitTotal.toLocaleString()} EA
                  </span>
                </div>
                {includedCategories.transit && (
                  <div className={`text-[9px] pl-6 flex flex-col gap-0.5 pt-0.5 border-t mt-1 ${
                    isLight ? 'text-slate-600 border-slate-200' : 'text-slate-400 border-slate-800/60'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span>해상/항공 운송중: {activeTransitShipments.length}건</span>
                      {pendingShipments.length > 0 && (
                        <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                          (출항대기 {pendingShipments.length}건 제외)
                        </span>
                      )}
                    </div>
                    {arrivedShipments.length > 0 && (
                      <span className={`font-mono ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>
                        코코모 입고완료: {arrivedShipments.length}건 (-{arrivedTotal.toLocaleString()} EA 이동)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ITEM 3: 미주법인 (코코모) */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'KOKOMO' ? null : 'KOKOMO');
                }}
                className={`p-1.5 border transition-all cursor-pointer rounded-sm ${
                  !includedCategories.kokomo
                    ? isLight ? 'opacity-40 bg-slate-100 border-slate-200' : 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'KOKOMO' 
                    ? isLight ? 'bg-amber-100 border-amber-600 shadow-sm' : 'bg-amber-950/60 border-amber-400' 
                    : isLight ? 'bg-slate-50 border-slate-200 hover:border-amber-400' : 'bg-[#0e1726] border-slate-700 hover:border-amber-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('kokomo', e)}
                      className={isLight ? 'text-amber-600 hover:text-amber-800' : 'text-amber-400 hover:text-amber-200'}
                    >
                      {includedCategories.kokomo ? (
                        <CheckSquare className={`w-4 h-4 ${isLight ? 'fill-amber-100 text-amber-600' : 'fill-amber-950 text-amber-400'}`} />
                      ) : (
                        <Square className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                      )}
                    </button>
                    <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                      <span>{t('hudItem3', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-black ${
                    includedCategories.kokomo 
                      ? isLight ? 'text-amber-800' : 'text-amber-300' 
                      : isLight ? 'text-slate-400 line-through' : 'text-slate-500 line-through'
                  }`}>
                    {kokomoTotal.toLocaleString()} EA
                  </span>
                </div>
                {arrivedTotal > 0 && includedCategories.kokomo && (
                  <div className={`text-[9px] pl-6 flex justify-between pt-0.5 border-t mt-1 font-mono ${
                    isLight ? 'text-amber-800 border-amber-200' : 'text-amber-400/90 border-amber-900/40'
                  }`}>
                    <span>기본: {((Number(kokomoInventory.baseTotal) || (kokomoTotal - arrivedTotal))).toLocaleString()} EA</span>
                    <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>+철송입고: +{arrivedTotal.toLocaleString()} EA</span>
                  </div>
                )}
              </div>

              {/* ITEM 4: 고객 SPE */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveFilter(activeFilter === 'SPE' ? null : 'SPE');
                }}
                className={`p-1.5 border transition-all cursor-pointer rounded-sm ${
                  !includedCategories.spe
                    ? isLight ? 'opacity-40 bg-slate-100 border-slate-200' : 'opacity-40 bg-[#080d16] border-slate-800'
                    : activeFilter === 'SPE' 
                    ? isLight ? 'bg-emerald-100 border-emerald-600 shadow-sm' : 'bg-emerald-950/60 border-emerald-400' 
                    : isLight ? 'bg-slate-50 border-slate-200 hover:border-emerald-400' : 'bg-[#0e1726] border-slate-700 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCategory('spe', e)}
                      className={isLight ? 'text-emerald-600 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-200'}
                    >
                      {includedCategories.spe ? (
                        <CheckSquare className={`w-4 h-4 ${isLight ? 'fill-emerald-100 text-emerald-600' : 'fill-emerald-950 text-emerald-400'}`} />
                      ) : (
                        <Square className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                      )}
                    </button>
                    <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      <span>{t('hudItem4', lang)}</span>
                    </div>
                  </div>
                  <span className={`font-black ${
                    includedCategories.spe 
                      ? isLight ? 'text-emerald-800' : 'text-emerald-300' 
                      : isLight ? 'text-slate-400 line-through' : 'text-slate-500 line-through'
                  }`}>
                    {speTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

            </div>

            <div className={`pt-1.5 border-t flex items-center justify-between text-[10px] font-bold ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <span>{t('hudHint', lang)}</span>
              {activeFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilter(null);
                  }}
                  className={`underline font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}
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
