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
  commanderPhotos
}) {
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
          <span className="absolute -inset-2 rounded-full border border-cyan-400/50 animate-ping pointer-events-none"></span>
          
          <div className="w-9 h-9 bg-[#0c1e33] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform">
            <Factory className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="mt-1 px-2 py-0.5 bg-[#091322] border border-cyan-400/80 rounded-sm text-center shadow-lg">
            <div className="text-[10px] font-mono font-black text-cyan-300 tracking-wider">{t('incheonName', lang)}</div>
            <div className="text-[11px] font-mono font-bold text-white">
              {incheonTotal.toLocaleString()} <span className="text-[9px] text-slate-300">EA</span>
            </div>
          </div>

          <div className="flex gap-1 mt-1 font-mono text-[9px]">
            <span className="px-1 py-0.2 bg-amber-950 border border-amber-500 text-amber-300 rounded font-semibold">
              {t('incheonWaiting', lang)}: {incheonWaitingQty.toLocaleString()}
            </span>
            <span className="px-1 py-0.2 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded font-semibold">
              {t('incheonPassed', lang)}: {incheonPassedQty.toLocaleString()}
            </span>
          </div>

          {(hoveredNode === 'INCHEON' || pinnedNode === 'INCHEON') && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-[#09111f] border-2 border-cyan-400 p-3 shadow-2xl text-left font-mono z-50 pointer-events-auto">
              {/* Station Lead Header Banner inside Node Popup (only when showPhotos is true) */}
              {showPhotos && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setModalCommander('INCHEON');
                  }}
                  className="mb-2 p-1.5 bg-[#0e1b2f] border border-cyan-500/70 flex items-center justify-between hover:bg-[#132642] cursor-pointer transition-colors shadow-sm"
                  title={t('commanderViewPhoto', lang)}
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={commanderPhotos?.INCHEON || '/assets/commander_incheon.png'} 
                      alt={t('incheonCommanderRole', lang)} 
                      className="w-7 h-9 object-cover object-top border border-cyan-400 rounded-xs flex-shrink-0"
                    />
                    <div>
                      <div className="text-[10px] font-black text-cyan-300 flex items-center gap-1">
                        {t('incheonCommanderRole', lang)}
                      </div>
                      <div className="text-[8.5px] text-slate-300">
                        {t('incheonCommanderDesc', lang)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] text-cyan-400 underline font-bold flex-shrink-0">
                    {lang === 'ko' ? '사진확대' : 'Photo'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-cyan-800 pb-1.5 mb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <Factory className="w-3.5 h-3.5" /> {t('incheonDetailsTitle', lang)}
                </span>
                <div className="flex items-center gap-1">
                  {pinnedNode === 'INCHEON' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); togglePinNode('INCHEON'); }}
                      className="text-[9px] text-amber-300 bg-amber-950/80 px-1 py-0.2 border border-amber-500/60 rounded cursor-pointer"
                      title={t('pinnedClose', lang)}
                    >
                      📌 {t('pinnedBadge', lang)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-300 font-bold">총 {incheonTotal.toLocaleString()} EA</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="text-[10px] text-amber-400 font-bold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('waitingInspection', lang)} ({incheonWaitingQty.toLocaleString()} EA)
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {(incheonInventory.waitingInspection || []).map((lot) => (
                    <div key={lot.id} className="text-[10px] bg-[#111c2e] p-1 border border-slate-700 flex justify-between">
                      <div>
                        <div className="text-slate-100 font-bold">{lot.id}</div>
                        <div className="text-slate-400 text-[9px]">{lot.name}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-300 font-bold">{Number(lot.quantity).toLocaleString()} EA</span>
                        <div className="text-[9px] text-slate-400">{lot.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('passedInspection', lang)} ({incheonPassedQty.toLocaleString()} EA)
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {(incheonInventory.passedInspection || []).map((lot) => (
                    <div key={lot.id} className="text-[10px] bg-[#10231e] p-1 border border-emerald-700 flex justify-between">
                      <div>
                        <div className="text-emerald-200 font-bold">{lot.id}</div>
                        <div className="text-slate-400 text-[9px]">{lot.name}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-300 font-bold">{Number(lot.quantity).toLocaleString()} EA</span>
                        <div className="text-[9px] text-emerald-400">{t('immediateShipment', lang)}</div>
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
          <span className="absolute -inset-1 rounded-full border border-cyan-400/40 animate-ping pointer-events-none"></span>
          <div className="w-6 h-6 bg-[#091a2e] border-2 border-cyan-400 rounded-full flex items-center justify-center shadow-lg">
            <Anchor className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <span className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5 whitespace-nowrap bg-black/90 px-1.5 py-0.2 border border-cyan-500 rounded">
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
          <div className="w-5 h-5 bg-[#142338] border border-sky-400 rounded-full flex items-center justify-center">
            <Plane className="w-3 h-3 text-sky-400" />
          </div>
          <span className="text-[9px] font-mono text-slate-300 font-bold mt-0.5 whitespace-nowrap bg-black/90 px-1 border border-slate-700 rounded">
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
          <span className="absolute -inset-2 rounded-full border border-amber-400/50 animate-ping pointer-events-none"></span>

          <div className="w-9 h-9 bg-[#261c0d] border-2 border-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.4)] hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5 text-amber-300" />
          </div>

          <div className="mt-1 px-2 py-0.5 bg-[#171107] border border-amber-400/80 rounded-sm text-center shadow-lg">
            <div className="text-[10px] font-mono font-black text-amber-300 tracking-wider">{t('kokomoName', lang)}</div>
            <div className="text-[11px] font-mono font-black text-white">
              {kokomoTotal.toLocaleString()} <span className="text-[9px] text-amber-300">{t('kokomoTotalTag', lang)}</span>
            </div>
          </div>

          {(hoveredNode === 'KOKOMO' || pinnedNode === 'KOKOMO') && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-[#140e06] border-2 border-amber-400 p-3.5 shadow-2xl text-left font-mono z-50 pointer-events-auto">
              {/* Station Lead Header Banner inside Node Popup (only when showPhotos is true) */}
              {showPhotos && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setModalCommander('KOKOMO');
                  }}
                  className="mb-2.5 p-1.5 bg-[#241709] border border-amber-500/70 flex items-center justify-between hover:bg-[#33210d] cursor-pointer transition-colors shadow-sm"
                  title={t('commanderViewPhoto', lang)}
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={commanderPhotos?.KOKOMO || '/assets/commander_usa.png'} 
                      alt={t('kokomoCommanderRole', lang)} 
                      className="w-7 h-9 object-cover object-top border border-amber-400 rounded-xs flex-shrink-0"
                    />
                    <div>
                      <div className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                        {t('kokomoCommanderRole', lang)}
                      </div>
                      <div className="text-[8.5px] text-slate-300">
                        {t('kokomoCommanderDesc', lang)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] text-amber-400 underline font-bold flex-shrink-0">
                    {lang === 'ko' ? '사진확대' : 'Photo'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-amber-700 pb-1.5 mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" /> {t('kokomoDetailTitle', lang)}
                </span>
                <div className="flex items-center gap-1">
                  {pinnedNode === 'KOKOMO' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); togglePinNode('KOKOMO'); }}
                      className="text-[9px] text-amber-300 bg-amber-950/80 px-1 py-0.2 border border-amber-500/60 rounded cursor-pointer"
                      title={t('pinnedClose', lang)}
                    >
                      📌 {t('pinnedBadge', lang)}
                    </span>
                  )}
                  <span className="text-[10px] text-amber-200 font-bold">합계 {kokomoTotal.toLocaleString()} EA</span>
                </div>
              </div>

              {kokomoInventory.arrivedQty > 0 && (
                <div className="mb-2.5 p-1.5 bg-emerald-950/80 border border-emerald-500/70 rounded text-[9.5px] text-emerald-300 flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1 font-bold">
                    <span>🚚</span>
                    <span>철송/항공 입고완료:</span>
                  </span>
                  <span className="font-bold font-mono">+{Number(kokomoInventory.arrivedQty).toLocaleString()} EA ({kokomoInventory.arrivedCount}건)</span>
                </div>
              )}

              <div className="mb-3">
                <div className="flex h-3 w-full border border-slate-700 overflow-hidden bg-slate-900 mb-1">
                  <div style={{ width: `${multiPct}%` }} className="bg-cyan-500" title={`Multi Assy: ${multiPct}%`}></div>
                  <div style={{ width: `${capPct}%` }} className="bg-emerald-500" title={`Cap Assy: ${capPct}%`}></div>
                  <div style={{ width: `${backPct}%` }} className="bg-rose-500" title={`Back ship: ${backPct}%`}></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-300 font-bold">
                  <span className="text-cyan-400">Multi ({multiPct}%)</span>
                  <span className="text-emerald-400">Cap ({capPct}%)</span>
                  <span className="text-rose-400">Back ship ({backPct}%)</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 bg-[#172535] border border-cyan-500/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-cyan-400 inline-block"></span>
                    <span className="text-slate-100 font-bold">{t('multiAssy', lang)}</span>
                  </div>
                  <span className="text-cyan-300 font-bold">{Number(kokomoInventory.multiAssy).toLocaleString()} EA</span>
                </div>

                <div className="flex items-center justify-between p-1.5 bg-[#122b1e] border border-emerald-500/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-400 inline-block"></span>
                    <span className="text-slate-100 font-bold">{t('capAssy', lang)}</span>
                  </div>
                  <span className="text-emerald-300 font-bold">{Number(kokomoInventory.capAssy).toLocaleString()} EA</span>
                </div>

                <div className="flex items-center justify-between p-1.5 bg-[#2d1419] border border-rose-500/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 inline-block"></span>
                    <span className="text-slate-100 font-bold">{t('backShip', lang)}</span>
                  </div>
                  <span className="text-rose-300 font-bold">{Number(kokomoInventory.backShip).toLocaleString()} EA</span>
                </div>
              </div>

              {kokomoInventory.history && kokomoInventory.history.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-amber-900/40 text-[9.5px] space-y-1">
                  <div className="text-[9px] text-slate-400 font-bold">최근 입고 및 인도 이력:</div>
                  {kokomoInventory.history.slice(0, 3).map((h, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span className="text-amber-400/80 font-mono shrink-0">[{h.time}]</span>
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
          <span className="absolute -inset-2 rounded-full border border-emerald-400/50 animate-ping pointer-events-none"></span>

          <div className="w-9 h-9 bg-[#0d281a] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.4)] hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>

          <div className="mt-1 px-2 py-0.5 bg-[#07170f] border border-emerald-400/80 rounded-sm text-center shadow-lg">
            <div className="text-[10px] font-mono font-black text-emerald-300 tracking-wider">{t('speName', lang)}</div>
            <div className="text-[11px] font-mono font-bold text-white">
              {Number(speInventory.totalInventory).toLocaleString()} <span className="text-[9px] text-slate-300">EA</span>
            </div>
          </div>

          {(hoveredNode === 'SPE' || pinnedNode === 'SPE') && (
            <div className="absolute top-full mt-2 right-0 w-72 min-w-[285px] bg-[#07160d] border-2 border-emerald-400 p-3.5 shadow-2xl text-left font-mono z-50 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5 mb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" /> {lang === 'en' ? 'SPE Customer Stock' : 'SPE 고객사 보유재고'}
                </span>
                <div className="flex items-center gap-1">
                  {pinnedNode === 'SPE' && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); togglePinNode('SPE'); }}
                      className="text-[9px] text-amber-300 bg-amber-950/80 px-1 py-0.2 border border-amber-500/60 rounded cursor-pointer whitespace-nowrap"
                      title={t('pinnedClose', lang)}
                    >
                      📌 {t('pinnedBadge', lang)}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-400 font-bold whitespace-nowrap">{t('speNormalRun', lang)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1.5 mb-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 whitespace-nowrap">{t('speTotalInventory', lang)}:</span>
                  <span className="text-white font-bold whitespace-nowrap">{Number(speInventory.totalInventory).toLocaleString()} EA</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 whitespace-nowrap">{t('speDailyConsumption', lang)}:</span>
                  <span className="text-slate-200 whitespace-nowrap">{Number(speInventory.dailyConsumption).toLocaleString()} EA/일</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 whitespace-nowrap">{t('speDaysSupply', lang)}:</span>
                  <span className="text-emerald-300 font-bold whitespace-nowrap">
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
      />
    </>
  );
}
