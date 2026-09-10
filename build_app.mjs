import fs from 'fs';
import path from 'path';

// 1. BottomTransitTable.jsx
const bottomTableContent = `import React from 'react';
import { Ship, Plane, Train, Truck, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { sound } from '../utils/soundFx';

export default function BottomTransitTable({
  shipments,
  onSelectShipment,
  activeFilter,
  onOpenDataModal
}) {
  const filteredShipments = shipments.filter(s => {
    if (!activeFilter) return true;
    if (activeFilter === 'TRANSIT') return true;
    if (activeFilter === 'DELAYED') return s.isDelayed;
    return true;
  });

  return (
    <div className="w-full bg-[#0a101d] border-t-2 border-[#1c2d42] p-3 font-mono">
      <div className="max-w-[1920px] mx-auto">
        
        {/* Table Header / Title */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400"></span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              실시간 운송 차수 전술 테이블 (TOTAL: {shipments.length} 건)
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenDataModal();
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-200 underline"
          >
            + 신규 차수 등록 / 엑셀 관리
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#121c2e] text-slate-400 border-b border-slate-700">
                <th className="p-2">운송 구분</th>
                <th className="p-2">차수명</th>
                <th className="p-2">선박 / 편명</th>
                <th className="p-2">컨테이너 / 식별</th>
                <th className="p-2">출항일 ➔ ETA</th>
                <th className="p-2 text-right">적재 수량</th>
                <th className="p-2">진행 단계</th>
                <th className="p-2 w-32">진행률</th>
                <th className="p-2 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredShipments.map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => onSelectShipment(s)}
                  className="hover:bg-[#15233a] cursor-pointer transition-colors"
                >
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-[#1a283e] border border-slate-600">
                      {s.type === 'SEA' ? <Ship className="w-3.5 h-3.5 text-cyan-400" /> : s.type === 'AIR' ? <Plane className="w-3.5 h-3.5 text-sky-400" /> : <Truck className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="font-bold">{s.type === 'SEA' ? '해상' : s.type === 'AIR' ? '항공' : '내륙트럭'}</span>
                    </span>
                  </td>
                  <td className="p-2 font-bold text-white">{s.batchNo}</td>
                  <td className="p-2 text-slate-300">{s.vesselName}</td>
                  <td className="p-2 font-mono text-cyan-300">{s.containerNo}</td>
                  <td className="p-2 text-slate-400">
                    {s.departureDate.slice(5, 10)} ➔ <span className={s.isDelayed ? 'text-rose-400 font-bold' : 'text-slate-200'}>{s.eta.slice(5, 10)}</span>
                  </td>
                  <td className="p-2 text-right font-bold text-amber-300">
                    {s.quantity.toLocaleString()} EA
                  </td>
                  <td className="p-2 text-slate-300 text-[10px]">
                    {s.progress <= 72 ? '태평양 해상 항해' : s.progress <= 95 ? '미 내륙 철도 환적' : '코코모 인근 도착'}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 h-2 rounded-none border border-slate-700 overflow-hidden">
                        <div 
                          className={\`h-full \${s.isDelayed ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}\`}
                          style={{ width: \`\${s.progress}%\` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 w-8 text-right">{Math.round(s.progress)}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    {s.isDelayed ? (
                      <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-500 text-rose-400 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> ETA 지연
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 정상 운항
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
`;

fs.writeFileSync(path.resolve('./src/components/BottomTransitTable.jsx'), bottomTableContent, 'utf8');
console.log('BottomTransitTable.jsx created successfully.');

// 2. App.jsx
const appContent = `import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RetroWorldMap from './components/RetroWorldMap';
import InventorySummaryHud from './components/InventorySummaryHud';
import DelayAlertBanner from './components/DelayAlertBanner';
import BottomTransitTable from './components/BottomTransitTable';
import DataControlModal from './components/DataControlModal';
import SettingsModal from './components/SettingsModal';

import { 
  INITIAL_INCHEON_INVENTORY, 
  INITIAL_SHIPMENTS, 
  INITIAL_KOKOMO_INVENTORY, 
  INITIAL_SPE_INVENTORY,
  KEY_NODES
} from './mock/initialData';
import { sound } from './utils/soundFx';

export default function App() {
  // Global Data State
  const [incheonInventory, setIncheonInventory] = useState(INITIAL_INCHEON_INVENTORY);
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS);
  const [kokomoInventory, setKokomoInventory] = useState(INITIAL_KOKOMO_INVENTORY);
  const [speInventory, setSpeInventory] = useState(INITIAL_SPE_INVENTORY);
  const [customSpeCoords, setCustomSpeCoords] = useState(null);

  // Simulation Controls
  const [simTime, setSimTime] = useState(new Date('2026-09-09T09:00:00'));
  const [isPaused, setIsPaused] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1); // 1x, 5x, 20x, 60x

  // UI / Display States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  // Modals
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Simulation Clock Tick (advances virtual time and progresses shipments)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSimTime((prevTime) => {
        // Increment time by 1000ms * timeSpeed
        const nextTime = new Date(prevTime.getTime() + 1000 * timeSpeed);
        return nextTime;
      });

      // Gradually advance shipment progress slightly with time
      setShipments((prevShipments) => 
        prevShipments.map((s) => {
          if (s.progress >= 100) return s;
          const increment = 0.05 * timeSpeed;
          const nextProg = Math.min(100, s.progress + increment);
          
          // Check if passed ETA and mark delayed
          const etaDate = new Date(s.eta);
          const isLate = !s.isDelayed && nextProg < 99 && (new Date() > etaDate);

          return {
            ...s,
            progress: nextProg,
            isDelayed: isLate || s.isDelayed
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeSpeed]);

  const handleResetData = () => {
    setIncheonInventory(INITIAL_INCHEON_INVENTORY);
    setShipments(INITIAL_SHIPMENTS);
    setKokomoInventory(INITIAL_KOKOMO_INVENTORY);
    setSpeInventory(INITIAL_SPE_INVENTORY);
    setCustomSpeCoords(null);
    sound.playSuccess();
  };

  const delayedShipments = shipments.filter(s => s.isDelayed);

  return (
    <div className={\`min-h-screen bg-[#070b14] text-slate-100 flex flex-col \${crtEnabled ? 'crt-overlay' : ''}\`}>
      
      {/* Top Retro Tactical Header */}
      <Header
        simTime={simTime}
        isPaused={isPaused}
        timeSpeed={timeSpeed}
        setTimeSpeed={setTimeSpeed}
        setIsPaused={setIsPaused}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isHudVisible={isHudVisible}
        setIsHudVisible={setIsHudVisible}
      />

      {/* Main Tactical Map Viewport */}
      <main className="flex-1 relative flex flex-col">
        
        {/* World Map Component */}
        <div className="relative flex-1 w-full">
          <RetroWorldMap
            shipments={shipments}
            incheonInventory={incheonInventory}
            kokomoInventory={kokomoInventory}
            speInventory={speInventory}
            customSpeCoords={customSpeCoords}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setIsDataModalOpen(true);
            }}
            onOpenLotDetails={() => setIsDataModalOpen(true)}
          />

          {/* Top-Right Inventory Summary HUD (with toggle/collapse) */}
          <InventorySummaryHud
            incheonInventory={incheonInventory}
            shipments={shipments}
            kokomoInventory={kokomoInventory}
            speInventory={speInventory}
            isVisible={isHudVisible}
            onToggleVisibility={() => setIsHudVisible(!isHudVisible)}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />

          {/* Delay Alert Notification Banner (Bottom/Center) */}
          <DelayAlertBanner
            delayedShipments={delayedShipments}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setIsDataModalOpen(true);
            }}
          />
        </div>

        {/* Bottom Transit Schedule Table */}
        <BottomTransitTable
          shipments={shipments}
          onSelectShipment={(s) => {
            setSelectedShipment(s);
            setIsDataModalOpen(true);
          }}
          activeFilter={activeFilter}
          onOpenDataModal={() => setIsDataModalOpen(true)}
        />
      </main>

      {/* Data Management & Excel Modal */}
      <DataControlModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        incheonInventory={incheonInventory}
        setIncheonInventory={setIncheonInventory}
        shipments={shipments}
        setShipments={setShipments}
        kokomoInventory={kokomoInventory}
        setKokomoInventory={setKokomoInventory}
        speInventory={speInventory}
        setSpeInventory={setSpeInventory}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customSpeCoords={customSpeCoords}
        setCustomSpeCoords={setCustomSpeCoords}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        onResetData={handleResetData}
      />

    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/App.jsx'), appContent, 'utf8');
console.log('App.jsx created successfully.');

// 3. main.jsx
const mainContent = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

fs.writeFileSync(path.resolve('./src/main.jsx'), mainContent, 'utf8');
console.log('main.jsx created successfully.');
