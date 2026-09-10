import fs from 'fs';
import path from 'path';

const overlayContent = `import React, { useState } from 'react';
import { 
  Building2, 
  Factory, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Anchor, 
  Plane
} from 'lucide-react';
import { KEY_NODES } from '../utils/geoCoordinates';
import { sound } from '../utils/soundFx';

export default function NodeOverlay({
  incheonInventory,
  kokomoInventory,
  speInventory,
  customSpeCoords,
  onOpenLotDetails,
  includedCategories = { incheon: true, transit: true, kokomo: true, spe: true }
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  const incheonWaitingQty = (incheonInventory.waitingInspection || []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const incheonPassedQty = (incheonInventory.passedInspection || []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const incheonTotal = incheonWaitingQty + incheonPassedQty;

  const kokomoTotal = (Number(kokomoInventory.multiAssy) || 0) + (Number(kokomoInventory.capAssy) || 0) + (Number(kokomoInventory.backShip) || 0);
  const multiPct = kokomoTotal > 0 ? Math.round((kokomoInventory.multiAssy / kokomoTotal) * 100) : 0;
  const capPct = kokomoTotal > 0 ? Math.round((kokomoInventory.capAssy / kokomoTotal) * 100) : 0;
  const backPct = kokomoTotal > 0 ? Math.max(0, 100 - multiPct - capPct) : 0;

  const speX = customSpeCoords?.x ?? KEY_NODES.SPE.x;
  const speY = customSpeCoords?.y ?? KEY_NODES.SPE.y;

  return (
    <>
      {/* 1. INCHEON NODE (KR) */}
      <div 
        style={{
          position: 'absolute',
          left: \`\${(KEY_NODES.INCHEON.x / 1240) * 100}%\`,
          top: \`\${(KEY_NODES.INCHEON.y / 660) * 100}%\`,
          transform: 'translate(-50%, -50%)',
          zIndex: hoveredNode === 'INCHEON' ? 40 : 20,
          opacity: includedCategories.incheon ? 1 : 0.35
        }}
        onMouseEnter={() => {
          setHoveredNode('INCHEON');
          sound.playClick();
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div className="relative flex flex-col items-center cursor-pointer">
          <span className="absolute -inset-2 rounded-full border border-cyan-400/50 animate-ping pointer-events-none"></span>
          
          <div className="w-9 h-9 bg-[#0c1e33] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform">
            <Factory className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="mt-1 px-2 py-0.5 bg-[#091322] border border-cyan-400/80 rounded-sm text-center shadow-lg">
            <div className="text-[10px] font-mono font-black text-cyan-300 tracking-wider">인천 사업장</div>
            <div className="text-[11px] font-mono font-bold text-white">
              {incheonTotal.toLocaleString()} <span className="text-[9px] text-slate-300">EA</span>
            </div>
          </div>

          <div className="flex gap-1 mt-1 font-mono text-[9px]">
            <span className="px-1 py-0.2 bg-amber-950 border border-amber-500 text-amber-300 rounded font-semibold">
              대기: {incheonWaitingQty.toLocaleString()}
            </span>
            <span className="px-1 py-0.2 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded font-semibold">
              합격: {incheonPassedQty.toLocaleString()}
            </span>
          </div>

          {hoveredNode === 'INCHEON' && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-[#09111f] border-2 border-cyan-400 p-3 shadow-2xl text-left font-mono z-50 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-cyan-800 pb-1.5 mb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <Factory className="w-3.5 h-3.5" /> 인천 재고 세부내역
                </span>
                <span className="text-[10px] text-slate-300 font-bold">총 {incheonTotal.toLocaleString()} EA</span>
              </div>

              <div className="mb-2">
                <div className="text-[10px] text-amber-400 font-bold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 검사대기 ({incheonWaitingQty.toLocaleString()} EA)
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
                  <CheckCircle2 className="w-3 h-3" /> 출하합격 (선적대기: {incheonPassedQty.toLocaleString()} EA)
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
                        <div className="text-[9px] text-emerald-400">즉시 선적가능</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. WEST COAST PORT (LA / Long Beach) */}
      <div
        style={{
          position: 'absolute',
          left: \`\${(KEY_NODES.WEST_COAST_PORT.x / 1240) * 100}%\`,
          top: \`\${(KEY_NODES.WEST_COAST_PORT.y / 660) * 100}%\`,
          transform: 'translate(-50%, -50%)',
          zIndex: 15
        }}
      >
        <div className="flex flex-col items-center group">
          <div className="w-5 h-5 bg-[#0f1d2e] border border-cyan-400 rounded-full flex items-center justify-center">
            <Anchor className="w-3 h-3 text-cyan-400" />
          </div>
          <span className="text-[9px] font-mono text-slate-300 font-bold mt-0.5 whitespace-nowrap bg-black/90 px-1 border border-slate-700 rounded">
            LA/롱비치항
          </span>
        </div>
      </div>

      {/* 3. MIDWEST AIRPORT */}
      <div
        style={{
          position: 'absolute',
          left: \`\${(KEY_NODES.MIDWEST_AIRPORT.x / 1240) * 100}%\`,
          top: \`\${(KEY_NODES.MIDWEST_AIRPORT.y / 660) * 100}%\`,
          transform: 'translate(-50%, -50%)',
          zIndex: 15
        }}
      >
        <div className="flex flex-col items-center group">
          <div className="w-5 h-5 bg-[#142338] border border-sky-400 rounded-full flex items-center justify-center">
            <Plane className="w-3 h-3 text-sky-400" />
          </div>
          <span className="text-[9px] font-mono text-slate-300 font-bold mt-0.5 whitespace-nowrap bg-black/90 px-1 border border-slate-700 rounded">
            시카고(ORD)
          </span>
        </div>
      </div>

      {/* 4. KOKOMO US FACILITY NODE */}
      <div 
        style={{
          position: 'absolute',
          left: \`\${(KEY_NODES.KOKOMO.x / 1240) * 100}%\`,
          top: \`\${(KEY_NODES.KOKOMO.y / 660) * 100}%\`,
          transform: 'translate(-50%, -50%)',
          zIndex: hoveredNode === 'KOKOMO' ? 40 : 20,
          opacity: includedCategories.kokomo ? 1 : 0.35
        }}
        onMouseEnter={() => {
          setHoveredNode('KOKOMO');
          sound.playClick();
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div className="relative flex flex-col items-center cursor-pointer">
          <span className="absolute -inset-2 rounded-full border border-amber-400/50 animate-ping pointer-events-none"></span>

          <div className="w-9 h-9 bg-[#261c0d] border-2 border-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.4)] hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5 text-amber-300" />
          </div>

          <div className="mt-1 px-2 py-0.5 bg-[#171107] border border-amber-400/80 rounded-sm text-center shadow-lg">
            <div className="text-[10px] font-mono font-black text-amber-300 tracking-wider">미주법인 (코코모)</div>
            <div className="text-[11px] font-mono font-black text-white">
              {kokomoTotal.toLocaleString()} <span className="text-[9px] text-amber-300">EA (전체)</span>
            </div>
          </div>
          <div className="text-[8px] font-mono text-amber-300 font-bold mt-0.5">
            [호버 시 세부 분류]
          </div>

          {hoveredNode === 'KOKOMO' && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-[#140e06] border-2 border-amber-400 p-3.5 shadow-2xl text-left font-mono z-50 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-amber-700 pb-1.5 mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" /> 코코모 미주법인 재고 세부
                </span>
                <span className="text-[10px] text-amber-200 font-bold">합계 {kokomoTotal.toLocaleString()} EA</span>
              </div>

              <div className="mb-3">
                <div className="flex h-3 w-full border border-slate-700 overflow-hidden bg-slate-900 mb-1">
                  <div style={{ width: \`\${multiPct}%\` }} className="bg-cyan-500" title={\`Multi Assy: \${multiPct}%\`}></div>
                  <div style={{ width: \`\${capPct}%\` }} className="bg-emerald-500" title={\`Cap Assy: \${capPct}%\`}></div>
                  <div style={{ width: \`\${backPct}%\` }} className="bg-rose-500" title={\`Back ship: \${backPct}%\`}></div>
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
                    <span className="text-slate-100 font-bold">Multi Assy</span>
                  </div>
                  <span className="text-cyan-300 font-bold">{Number(kokomoInventory.multiAssy).toLocaleString()} EA</span>
                </div>

                <div className="flex items-center justify-between p-1.5 bg-[#122b1e] border border-emerald-500/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-400 inline-block"></span>
                    <span className="text-slate-100 font-bold">Cap Assy</span>
                  </div>
                  <span className="text-emerald-300 font-bold">{Number(kokomoInventory.capAssy).toLocaleString()} EA</span>
                </div>

                <div className="flex items-center justify-between p-1.5 bg-[#2d1419] border border-rose-500/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 inline-block"></span>
                    <span className="text-slate-100 font-bold">Back ship</span>
                  </div>
                  <span className="text-rose-300 font-bold">{Number(kokomoInventory.backShip).toLocaleString()} EA</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. CUSTOMER SPE NODE */}
      <div 
        style={{
          position: 'absolute',
          left: \`\${(speX / 1240) * 100}%\`,
          top: \`\${(speY / 660) * 100}%\`,
          transform: 'translate(-50%, -50%)',
          zIndex: hoveredNode === 'SPE' ? 40 : 20,
          opacity: includedCategories.spe ? 1 : 0.35
        }}
        onMouseEnter={() => {
          setHoveredNode('SPE');
          sound.playClick();
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div className="relative flex flex-col items-center cursor-pointer">
          <span className="absolute -inset-2 rounded-full border border-emerald-400/50 animate-ping pointer-events-none"></span>

          <div className="w-9 h-9 bg-[#0d281a] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.4)] hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>

          <div className="mt-1 px-2 py-0.5 bg-[#07170f] border border-emerald-400/80 rounded-sm text-center shadow-lg">
            <div className="text-[10px] font-mono font-black text-emerald-300 tracking-wider">고객 SPE</div>
            <div className="text-[11px] font-mono font-bold text-white">
              {Number(speInventory.totalInventory).toLocaleString()} <span className="text-[9px] text-slate-300">EA</span>
            </div>
          </div>

          {hoveredNode === 'SPE' && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-68 bg-[#07160d] border-2 border-emerald-400 p-3 shadow-2xl text-left font-mono z-50 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5 mb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> SPE 고객사 보유재고
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">정상 가동</span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 mb-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">총 고객 재고:</span>
                  <span className="text-white font-bold">{Number(speInventory.totalInventory).toLocaleString()} EA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">일일 소진율:</span>
                  <span className="text-slate-200">{Number(speInventory.dailyConsumption).toLocaleString()} EA/일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">가동 가능일수:</span>
                  <span className="text-emerald-300 font-bold">
                    약 {Math.round(speInventory.totalInventory / Math.max(1, speInventory.dailyConsumption))} 일분
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/NodeOverlay.jsx'), overlayContent, 'utf8');
console.log('NodeOverlay.jsx updated.');
