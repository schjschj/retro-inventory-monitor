import React, { useState } from 'react';
import { 
  Building2, 
  Factory, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Anchor, 
  Plane,
  Award,
  UserCheck
} from 'lucide-react';
import { KEY_NODES, MAP_DIMENSIONS } from '../utils/geoCoordinates';
import { sound } from '../utils/soundFx';
import { t } from '../utils/i18n';
import CommanderModal from './CommanderModal';

export default function NodeOverlay({
  incheonInventory,
  kokomoInventory,
  speInventory,
  onOpenLotDetails,
  includedCategories = { incheon: true, transit: true, kokomo: true, spe: true },
  lang = 'ko',
  showPhotos = true,
  commanderPhotos,
  themeMode = 'dark'
}) {
  const isLight = themeMode === 'light';
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pinnedNode, setPinnedNode] = useState(null); // 'INCHEON' | 'KOKOMO' | 'SPE' | null
  const [modalCommander, setModalCommander] = useState(null); // 'INCHEON' | 'KOKOMO' | null

  const togglePinNode = (nodeKey) => {
    sound.playClick();
    setPinnedNode(prev => prev === nodeKey ? null : nodeKey);
  };

  const incheonWaitingQty = (incheonInventory.waitingInspection || []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const incheonPassedQty = (incheonInventory.passedInspection || []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const incheonTotal = incheonWaitingQty + incheonPassedQty;

  const kokomoTotal = (Number(kokomoInventory.multiAssy) || 0) + (Number(kokomoInventory.capAssy) || 0) + (Number(kokomoInventory.backShip) || 0);
  const multiPct = kokomoTotal > 0 ? Math.round((kokomoInventory.multiAssy / kokomoTotal) * 100) : 0;
  const capPct = kokomoTotal > 0 ? Math.round((kokomoInventory.capAssy / kokomoTotal) * 100) : 0;
  const backPct = kokomoTotal > 0 ? Math.max(0, 100 - multiPct - capPct) : 0;

  return (
    <>
      {/* 1. INCHEON NODE (South Korea - Gyeonggi Bay coastline) */}
      <div 
        style={{
          position: 'absolute',
          left: `${(KEY_NODES.INCHEON.x / MAP_DIMENSIONS.width) * 100}%`,
          top: `${(KEY_NODES.INCHEON.y / MAP_DIMENSIONS.height) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: (hoveredNode === 'INCHEON' || pinnedNode === 'INCHEON') ? 48 : 30,
          opacity: includedCategories.incheon ? 1 : 0.35
        }}
        onMouseEnter={() => {
          setHoveredNode('INCHEON');
          sound.playClick();
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div 
          onClick={() => togglePinNode('INCHEON')}
          className="relative flex flex-col items-center cursor-pointer"
        >
          <span className={`absolute -inset-2 rounded-full border ${isLight ? 'border-blue-500/50' : 'border-cyan-400/50'} animate-ping pointer-events-none`}></span>
          
          <div className={`w-9 h-9 border-2 flex items-center justify-center hover:scale-110 transition-transform ${
            isLight 
              ? 'bg-white border-blue-600 text-blue-600 shadow-md rounded-md' 
              : 'bg-[#0c1e33] border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
          }`}>
            <Factory className="w-5 h-5" />
          </div>

          <div className={`mt-1 px-2.5 py-0.5 rounded-sm text-center shadow-md border ${
            isLight 
              ? 'bg-blue-50/95 border-blue-300' 
              : 'bg-[#091322] border-cyan-400/80'
          }`}>
            <div className={`text-[10px] font-mono font-black tracking-wider ${
              isLight ? 'text-blue-800' : 'text-cyan-300'
            }`}>
              {t('incheonName', lang)}
            </div>
            <div className={`text-[11px] font-mono font-black ${
              isLight ? 'text-blue-950' : 'text-white'
            }`}>
              {incheonTotal.toLocaleString()} <span className={`text-[9px] font-bold ${isLight ? 'text-blue-700' : 'text-slate-300'}`}>EA</span>
            </div>
          </div>

          <div className="flex gap-1 mt-1 font-mono text-[9px]">
            <span className={`px-1.5 py-0.2 border rounded font-bold shadow-xs ${
              isLight 
                ? 'bg-amber-100 border-amber-300 text-amber-900' 
                : 'bg-amber-950 border-amber-500 text-amber-300'
            }`}>
              {t('incheonWaiting', lang)}: {incheonWaitingQty.toLocaleString()}
            </span>
            <span className={`px-1.5 py-0.2 border rounded font-bold shadow-xs ${
              isLight 
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900' 
                : 'bg-emerald-950 border-emerald-500 text-emerald-300'
            }`}>
              {t('incheonPassed', lang)}: {incheonPassedQty.toLocaleString()}
            </span>
          </div>

          {(hoveredNode === 'INCHEON' || pinnedNode === 'INCHEON') && (
            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 p-3 shadow-2xl text-left font-mono z-50 pointer-events-auto border-2 rounded ${
              isLight ? 'bg-white border-blue-600 text-slate-900' : 'bg-[#09111f] border-cyan-400 text-white'
            }`}>
              {/* Station Lead Header Banner inside Node Popup (only when showPhotos is true) */}
              {showPhotos && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setModalCommander('INCHEON');
                  }}
                  className={`mb-2 p-1.5 border flex items-center justify-between cursor-pointer transition-colors shadow-sm rounded ${
                    isLight 
                      ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/80' 
                      : 'bg-[#0e1b2f] border-cyan-500/70 hover:bg-[#132642]'
                  }`}
                  title={t('commanderViewPhoto', lang)}
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={commanderPhotos?.INCHEON || '/assets/commander_incheon.png'} 
                      alt={t('incheonCommanderRole', lang)} 
                      className={`w-7 h-9 object-cover object-top border rounded-xs flex-shrink-0 ${
                        isLight ? 'border-blue-500' : 'border-cyan-400'
                      }`}
                    />
                    <div>
                      <div className={`text-[10px] font-black flex items-center gap-1 ${
                        isLight ? 'text-blue-800' : 'text-cyan-300'
                      }`}>
                        {t('incheonCommanderRole', lang)}
                      </div>
                      <div className={`text-[8.5px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {t('incheonCommanderDesc', lang)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[8px] underline font-bold flex-shrink-0 ${
                    isLight ? 'text-blue-600' : 'text-cyan-400'
                  }`}>
                    {lang === 'ko' ? '사진확대' : 'Photo'}
                  </span>
                </div>
              )}

              <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                isLight ? 'border-slate-200' : 'border-cyan-800'
              }`}>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  isLight ? 'text-blue-800' : 'text-cyan-300'
                }`}>
                  <Factory className="w-3.5 h-3.5" /> {t('incheonDetailsTitle', lang)}
                </span>
                <div className="flex items-center gap-1">
                  {pinnedNode === 'INCHEON' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); togglePinNode('INCHEON'); }}
                      className={`text-[9px] px-1 py-0.2 border rounded cursor-pointer ${
                        isLight ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'text-amber-300 bg-amber-950/80 border-amber-500/60'
                      }`}
                      title={t('pinnedClose', lang)}
                    >
                      📌 {t('pinnedBadge', lang)}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    총 {incheonTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${
                  isLight ? 'text-amber-800' : 'text-amber-400'
                }`}>
                  <Clock className="w-3 h-3" /> {t('waitingInspection', lang)} ({incheonWaitingQty.toLocaleString()} EA)
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {(incheonInventory.waitingInspection || []).map((lot) => (
                    <div key={lot.id} className={`text-[10px] p-1 border flex justify-between rounded ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700'
                    }`}>
                      <div>
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{lot.id}</div>
                        <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lot.name}</div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>{Number(lot.quantity).toLocaleString()} EA</span>
                        <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lot.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${
                  isLight ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  <CheckCircle2 className="w-3 h-3" /> {t('passedInspection', lang)} ({incheonPassedQty.toLocaleString()} EA)
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {(incheonInventory.passedInspection || []).map((lot) => (
                    <div key={lot.id} className={`text-[10px] p-1 border flex justify-between rounded ${
                      isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#10231e] border-emerald-700'
                    }`}>
                      <div>
                        <div className={`font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>{lot.id}</div>
                        <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lot.name}</div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>{Number(lot.quantity).toLocaleString()} EA</span>
                        <div className={`text-[9px] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{t('immediateShipment', lang)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. WEST COAST PORT (Long Beach / LA - Strictly on the ocean coastline!) */}
      <div
        style={{
          position: 'absolute',
          left: `${(KEY_NODES.WEST_COAST_PORT.x / MAP_DIMENSIONS.width) * 100}%`,
          top: `${(KEY_NODES.WEST_COAST_PORT.y / MAP_DIMENSIONS.height) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 32
        }}
      >
        <div className="flex flex-col items-center group cursor-pointer">
          <span className={`absolute -inset-1 rounded-full border ${isLight ? 'border-blue-500/40' : 'border-cyan-400/40'} animate-ping pointer-events-none`}></span>
          <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center shadow-lg ${
            isLight 
              ? 'bg-white border-blue-600 text-blue-600 shadow-md' 
              : 'bg-[#091a2e] border-cyan-400 text-cyan-300'
          }`}>
            <Anchor className="w-3.5 h-3.5" />
          </div>
          <span className={`text-[10px] font-mono font-bold mt-0.5 whitespace-nowrap px-1.5 py-0.2 border rounded shadow-md ${
            isLight ? 'bg-blue-50/95 border-blue-300 text-blue-950' : 'bg-black/90 border-cyan-500 text-cyan-300'
          }`}>
            {t('longBeachName', lang)}
          </span>
        </div>
      </div>

      {/* 3. MIDWEST AIRPORT (Chicago ORD) */}
      <div
        style={{
          position: 'absolute',
          left: `${(KEY_NODES.MIDWEST_AIRPORT.x / MAP_DIMENSIONS.width) * 100}%`,
          top: `${(KEY_NODES.MIDWEST_AIRPORT.y / MAP_DIMENSIONS.height) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 30
        }}
      >
        <div className="flex flex-col items-center group">
          <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
            isLight ? 'bg-white border-indigo-600 text-indigo-600 shadow-md' : 'bg-[#142338] border-sky-400 text-sky-400'
          }`}>
            <Plane className="w-3 h-3" />
          </div>
          <span className={`text-[9px] font-mono font-bold mt-0.5 whitespace-nowrap px-1.5 py-0.2 border rounded shadow-md ${
            isLight ? 'bg-indigo-50/95 border-indigo-300 text-indigo-950' : 'bg-black/90 border-slate-700 text-slate-300'
          }`}>
            {t('chicagoName', lang)}
          </span>
        </div>
      </div>

      {/* 4. KOKOMO NODE (Indiana, US - Facility Terminal) */}
      <div 
        style={{
          position: 'absolute',
          left: `${(KEY_NODES.KOKOMO.x / MAP_DIMENSIONS.width) * 100}%`,
          top: `${(KEY_NODES.KOKOMO.y / MAP_DIMENSIONS.height) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: (hoveredNode === 'KOKOMO' || pinnedNode === 'KOKOMO') ? 48 : 35,
          opacity: includedCategories.kokomo ? 1 : 0.35
        }}
        onMouseEnter={() => {
          setHoveredNode('KOKOMO');
          sound.playClick();
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div 
          onClick={() => togglePinNode('KOKOMO')}
          className="relative flex flex-col items-center cursor-pointer"
        >
          <span className={`absolute -inset-2 rounded-full border ${isLight ? 'border-amber-500/50' : 'border-amber-400/50'} animate-ping pointer-events-none`}></span>

          <div className={`w-9 h-9 border-2 flex items-center justify-center hover:scale-110 transition-transform ${
            isLight 
              ? 'bg-white border-amber-500 text-amber-600 shadow-md rounded-md' 
              : 'bg-[#261c0d] border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
          }`}>
            <Building2 className="w-5 h-5" />
          </div>

          <div className={`mt-1 px-2.5 py-0.5 rounded-sm text-center shadow-md border ${
            isLight 
              ? 'bg-amber-50/95 border-amber-300' 
              : 'bg-[#171107] border-amber-400/80'
          }`}>
            <div className={`text-[10px] font-mono font-black tracking-wider ${
              isLight ? 'text-amber-800' : 'text-amber-300'
            }`}>
              {t('kokomoName', lang)}
            </div>
            <div className={`text-[11px] font-mono font-black ${
              isLight ? 'text-amber-950' : 'text-white'
            }`}>
              {kokomoTotal.toLocaleString()} <span className={`text-[9px] font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>{t('kokomoTotalTag', lang)}</span>
            </div>
          </div>

          {(hoveredNode === 'KOKOMO' || pinnedNode === 'KOKOMO') && (
            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 p-3.5 shadow-2xl text-left font-mono z-50 pointer-events-auto border-2 rounded ${
              isLight ? 'bg-white border-amber-500 text-slate-900' : 'bg-[#140e06] border-amber-400 text-white'
            }`}>
              {/* Station Lead Header Banner inside Node Popup (only when showPhotos is true) */}
              {showPhotos && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setModalCommander('KOKOMO');
                  }}
                  className={`mb-2.5 p-1.5 border flex items-center justify-between cursor-pointer transition-colors shadow-sm rounded ${
                    isLight 
                      ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/80' 
                      : 'bg-[#241709] border-amber-500/70 hover:bg-[#33210d]'
                  }`}
                  title={t('commanderViewPhoto', lang)}
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={commanderPhotos?.KOKOMO || '/assets/commander_usa.png'} 
                      alt={t('kokomoCommanderRole', lang)} 
                      className={`w-7 h-9 object-cover object-top border rounded-xs flex-shrink-0 ${
                        isLight ? 'border-amber-400' : 'border-amber-400'
                      }`}
                    />
                    <div>
                      <div className={`text-[10px] font-black flex items-center gap-1 ${
                        isLight ? 'text-amber-800' : 'text-amber-300'
                      }`}>
                        {t('kokomoCommanderRole', lang)}
                      </div>
                      <div className={`text-[8.5px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {t('kokomoCommanderDesc', lang)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[8px] underline font-bold flex-shrink-0 ${
                    isLight ? 'text-amber-600' : 'text-amber-400'
                  }`}>
                    {lang === 'ko' ? '사진확대' : 'Photo'}
                  </span>
                </div>
              )}

              <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                isLight ? 'border-slate-200' : 'border-amber-700'
              }`}>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${
                  isLight ? 'text-amber-800' : 'text-amber-300'
                }`}>
                  <Building2 className="w-4 h-4" /> {t('kokomoDetailTitle', lang)}
                </span>
                <div className="flex items-center gap-1">
                  {pinnedNode === 'KOKOMO' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); togglePinNode('KOKOMO'); }}
                      className={`text-[9px] px-1 py-0.2 border rounded cursor-pointer ${
                        isLight ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'text-amber-300 bg-amber-950/80 border-amber-500/60'
                      }`}
                      title={t('pinnedClose', lang)}
                    >
                      📌 {t('pinnedBadge', lang)}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold ${isLight ? 'text-amber-900' : 'text-amber-200'}`}>
                    합계 {kokomoTotal.toLocaleString()} EA
                  </span>
                </div>
              </div>

              {kokomoInventory.arrivedQty > 0 && (
                <div className={`mb-2.5 p-1.5 border rounded text-[9.5px] flex items-center justify-between shadow-sm ${
                  isLight 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                }`}>
                  <span className="flex items-center gap-1 font-bold">
                    <span>🚚</span>
                    <span>철송/항공 입고완료:</span>
                  </span>
                  <span className="font-bold font-mono">+{Number(kokomoInventory.arrivedQty).toLocaleString()} EA ({kokomoInventory.arrivedCount}건)</span>
                </div>
              )}

              <div className="mb-3">
                <div className="flex h-3 w-full border border-slate-300 overflow-hidden bg-slate-100 mb-1 rounded-xs">
                  <div style={{ width: `${multiPct}%` }} className="bg-cyan-500" title={`Multi Assy: ${multiPct}%`}></div>
                  <div style={{ width: `${capPct}%` }} className="bg-emerald-500" title={`Cap Assy: ${capPct}%`}></div>
                  <div style={{ width: `${backPct}%` }} className="bg-rose-500" title={`Back ship: ${backPct}%`}></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold">
                  <span className={isLight ? 'text-blue-700' : 'text-cyan-400'}>Multi ({multiPct}%)</span>
                  <span className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>Cap ({capPct}%)</span>
                  <span className={isLight ? 'text-rose-700' : 'text-rose-400'}>Back ({backPct}%)</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div className={`p-1.5 border flex justify-between items-center rounded ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c140a] border-amber-900/50'
                }`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Multi Assy (직접생산):</span>
                  <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>{(Number(kokomoInventory.multiAssy) || 0).toLocaleString()} EA</span>
                </div>
                <div className={`p-1.5 border flex justify-between items-center rounded ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c140a] border-amber-900/50'
                }`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Cap Assy (단순조립):</span>
                  <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-emerald-300'}`}>{(Number(kokomoInventory.capAssy) || 0).toLocaleString()} EA</span>
                </div>
                <div className={`p-1.5 border flex justify-between items-center rounded ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c140a] border-amber-900/50'
                }`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Back ship (환적대기):</span>
                  <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-rose-300'}`}>{(Number(kokomoInventory.backShip) || 0).toLocaleString()} EA</span>
                </div>
              </div>

              {kokomoInventory.history && kokomoInventory.history.length > 0 && (
                <div className={`mt-2.5 pt-2 border-t text-[9.5px] space-y-1 ${
                  isLight ? 'border-slate-200' : 'border-amber-900/40'
                }`}>
                  <div className={`text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>최근 입고 및 인도 이력:</div>
                  {kokomoInventory.history.slice(0, 3).map((h, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span className={`font-mono shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>[{h.time}]</span>
                      <span className="truncate ml-1.5 flex-1 text-right">{h.event}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. CUSTOMER SPE NODE (Static Inventory Hub) */}
      <div 
        style={{
          position: 'absolute',
          left: `${(KEY_NODES.SPE.x / MAP_DIMENSIONS.width) * 100}%`,
          top: `${(KEY_NODES.SPE.y / MAP_DIMENSIONS.height) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: (hoveredNode === 'SPE' || pinnedNode === 'SPE') ? 48 : 35,
          opacity: includedCategories.spe ? 1 : 0.35
        }}
        onMouseEnter={() => {
          setHoveredNode('SPE');
          sound.playClick();
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div 
          onClick={() => togglePinNode('SPE')}
          className="relative flex flex-col items-center cursor-pointer"
        >
          <span className={`absolute -inset-2 rounded-full border ${isLight ? 'border-emerald-500/50' : 'border-emerald-400/50'} animate-ping pointer-events-none`}></span>

          <div className={`w-9 h-9 border-2 flex items-center justify-center hover:scale-110 transition-transform ${
            isLight 
              ? 'bg-white border-emerald-600 text-emerald-600 shadow-md rounded-md' 
              : 'bg-[#0d281a] border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div className={`mt-1 px-2.5 py-0.5 rounded-sm text-center shadow-md border ${
            isLight 
              ? 'bg-emerald-50/95 border-emerald-300' 
              : 'bg-[#07170f] border-emerald-400/80'
          }`}>
            <div className={`text-[10px] font-mono font-black tracking-wider ${
              isLight ? 'text-emerald-800' : 'text-emerald-300'
            }`}>
              {t('speName', lang)}
            </div>
            <div className={`text-[11px] font-mono font-black ${
              isLight ? 'text-emerald-950' : 'text-white'
            }`}>
              {Number(speInventory.totalInventory).toLocaleString()} <span className={`text-[9px] font-bold ${isLight ? 'text-emerald-700' : 'text-slate-300'}`}>EA</span>
            </div>
          </div>

          {(hoveredNode === 'SPE' || pinnedNode === 'SPE') && (
            <div className={`absolute top-full mt-2 right-0 w-72 min-w-[285px] p-3.5 shadow-2xl text-left font-mono z-50 pointer-events-auto border-2 rounded ${
              isLight ? 'bg-white border-emerald-600 text-slate-900' : 'bg-[#07160d] border-emerald-400 text-white'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                isLight ? 'border-slate-200' : 'border-emerald-800'
              }`}>
                <span className={`text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
                  isLight ? 'text-emerald-800' : 'text-emerald-300'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" /> {lang === 'en' ? 'SPE Customer Stock' : 'SPE 고객사 보유재고'}
                </span>
                <div className="flex items-center gap-1">
                  {pinnedNode === 'SPE' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); togglePinNode('SPE'); }}
                      className={`text-[9px] px-1 py-0.2 border rounded cursor-pointer whitespace-nowrap ${
                        isLight ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'text-amber-300 bg-amber-950/80 border-amber-500/60'
                      }`}
                      title={t('pinnedClose', lang)}
                    >
                      📌 {t('pinnedBadge', lang)}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold whitespace-nowrap ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {t('speNormalRun', lang)}
                  </span>
                </div>
              </div>

              <div className={`text-[11px] space-y-1.5 mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <div className="flex justify-between items-center gap-2">
                  <span className={`whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('speTotalInventory', lang)}:</span>
                  <span className={`font-bold whitespace-nowrap ${isLight ? 'text-slate-900' : 'text-white'}`}>{Number(speInventory.totalInventory).toLocaleString()} EA</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className={`whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('speDailyConsumption', lang)}:</span>
                  <span className={`whitespace-nowrap ${isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}`}>{Number(speInventory.dailyConsumption).toLocaleString()} EA/일</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className={`whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('speDaysSupply', lang)}:</span>
                  <span className={`font-bold whitespace-nowrap ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    {lang === 'en' 
                      ? `Approx ${Math.round(speInventory.totalInventory / Math.max(1, speInventory.dailyConsumption))} Days` 
                      : `약 ${Math.round(speInventory.totalInventory / Math.max(1, speInventory.dailyConsumption))} 일분 확보`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Commander Tactical Dossier Modal */}
      <CommanderModal
        isOpen={Boolean(modalCommander)}
        commanderType={modalCommander}
        onClose={() => setModalCommander(null)}
        lang={lang}
        commanderPhotos={commanderPhotos}
        themeMode={themeMode}
      />
    </>
  );
}
