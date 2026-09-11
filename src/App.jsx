import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import RetroWorldMap from './components/RetroWorldMap';
import InventorySummaryHud from './components/InventorySummaryHud';
import DelayAlertBanner from './components/DelayAlertBanner';
import BottomTransitTable from './components/BottomTransitTable';
import DataControlModal from './components/DataControlModal';
import SettingsModal from './components/SettingsModal';
import AdminAuthModal from './components/AdminAuthModal';

import { 
  INITIAL_INCHEON_INVENTORY, 
  INITIAL_SHIPMENTS, 
  INITIAL_KOKOMO_INVENTORY, 
  INITIAL_SPE_INVENTORY
} from './mock/initialData';
import { sound } from './utils/soundFx';
import { 
  fetchAllInventoryData, 
  syncIncheonInventory, 
  syncKokomoInventory, 
  syncSpeInventory, 
  syncShipments, 
  subscribeToRealtimeUpdates 
} from './services/inventoryService';
import { isSupabaseConfigured } from './utils/supabaseClient';
import { normalizeKokomoInventory, normalizeSpeInventory } from './utils/inventoryNormalization';

export default function App() {
  // Global Data State (Cached in LocalStorage for instant persistence)
  const [incheonInventory, setIncheonInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('tactical_incheon_inventory');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_INCHEON_INVENTORY;
  });
  const [shipments, setShipments] = useState(() => {
    try {
      const saved = localStorage.getItem('tactical_shipments');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SHIPMENTS;
  });
  const [kokomoInventory, setKokomoInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('tactical_kokomo_inventory');
      if (saved) return normalizeKokomoInventory(JSON.parse(saved));
    } catch (e) {}
    return normalizeKokomoInventory(INITIAL_KOKOMO_INVENTORY);
  });
  const [speInventory, setSpeInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('tactical_spe_inventory');
      if (saved) {
        return normalizeSpeInventory(JSON.parse(saved));
      }
    } catch (e) {}
    return normalizeSpeInventory(INITIAL_SPE_INVENTORY);
  });
  const [customSpeCoords, setCustomSpeCoords] = useState(null);

  // Security Clearance / Station Role Mode (Default: Read-Only Viewer)
  const [isAdmin, setIsAdmin] = useState(false);
  const [authRole, setAuthRole] = useState(null); // null | 'INCHEON_LEAD' | 'USA_LEAD' | 'MASTER_ADMIN'
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const isCloudSynced = isSupabaseConfigured();

  // Simulation Controls
  const [simTime, setSimTime] = useState(new Date('2026-09-09T09:00:00'));
  const [isPaused, setIsPaused] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(0.5); // 0.5 (30분), 1 (1시간), 3 (3시간)

  // Station Commander Photos (Persistent in LocalStorage)
  const [commanderPhotos, setCommanderPhotos] = useState(() => {
    const saved = localStorage.getItem('tactical_commander_photos');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return {
      INCHEON: '/assets/commander_incheon.png',
      KOKOMO: '/assets/commander_usa.png'
    };
  });

  const handleUpdateCommanderPhoto = (key, photoData) => {
    setCommanderPhotos(prev => {
      const updated = { ...prev, [key]: photoData };
      try {
        localStorage.setItem('tactical_commander_photos', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save photo to localStorage', err);
      }
      return updated;
    });
  };

  // UI / Display & Preference States
  const [lang, setLang] = useState('ko'); // 'ko' | 'en'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [crtEnabled, setCrtEnabled] = useState(false); // Default to crystal-clear sharp text!
  const [fontScale, setFontScale] = useState('normal'); // 'compact' | 'normal' | 'large' | 'xlarge'
  const [highContrast, setHighContrast] = useState(false);
  const [autoPauseOnDelay, setAutoPauseOnDelay] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showPhotos, setShowPhotos] = useState(true); // Toggle station lead photos in node overlay

  // 4 Inventory Categories Checkbox State for Top-Right HUD
  const [includedCategories, setIncludedCategories] = useState({
    incheon: true,
    transit: true,
    kokomo: true,
    spe: true
  });

  // Selected Product Model State ('ESS8-1' | 'ESS11-1' | 'ALL')
  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      return localStorage.getItem('tactical_selected_product') || 'ESS8-1';
    } catch (e) {
      return 'ESS8-1';
    }
  });

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    try {
      localStorage.setItem('tactical_selected_product', prod);
    } catch (e) {}
  };

  // Theme Mode State ('dark' | 'light') - Default: dark mode
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('tactical_theme_mode') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const handleSetThemeMode = (mode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('tactical_theme_mode', mode);
    } catch (e) {}
  };

  // Modals
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Simulation Clock Tick: advances simTime by timeSpeed (hours/sec).
  // Ticking every 500ms provides silky-smooth vehicle movement.
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSimTime((prevTime) => {
        const msToAdd = (timeSpeed * 3600 * 1000) * 0.5;
        return new Date(prevTime.getTime() + msToAdd);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, timeSpeed]);

  // Dynamic calculation of progress based on simTime vs (departureDate, eta)
  useEffect(() => {
    const currentMs = simTime.getTime();
    let newlyDelayed = false;

    setShipments(prevShipments => 
      prevShipments.map(s => {
        const depMs = new Date(s.departureDate).getTime();
        const etaMs = new Date(s.eta).getTime();
        
        let prog = 0;
        if (isNaN(depMs) || isNaN(etaMs) || etaMs <= depMs) {
          prog = Number(s.progress) || 50;
        } else if (currentMs <= depMs) {
          prog = 0;
        } else if (currentMs >= etaMs) {
          prog = 100;
        } else {
          prog = ((currentMs - depMs) / (etaMs - depMs)) * 100;
        }

        const isLate = currentMs > etaMs && prog < 100;
        if (isLate && !s.isDelayed && s.manualDelayed === undefined) {
          newlyDelayed = true;
        }

        const finalDelayed = s.manualDelayed !== undefined ? s.manualDelayed : isLate;

        return {
          ...s,
          progress: Math.round(Math.min(100, Math.max(0, prog)) * 10) / 10,
          isDelayed: finalDelayed
        };
      })
    );

    if (newlyDelayed && autoPauseOnDelay) {
      setIsPaused(true);
      sound.playAlert();
    }
  }, [simTime, autoPauseOnDelay]);

  // Initial Load from Supabase (or LocalStorage/Mock fallback) & Realtime Subscription
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchAllInventoryData();
        if (isMounted) {
          if (data.incheon) setIncheonInventory(data.incheon);
          if (data.kokomo) setKokomoInventory(normalizeKokomoInventory(data.kokomo));
          if (data.spe) setSpeInventory(normalizeSpeInventory(data.spe));
          if (data.shipments) setShipments(data.shipments);
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }
    loadData();

    const unsubscribe = subscribeToRealtimeUpdates({
      onIncheonChange: (newIncheon) => {
        setIncheonInventory(newIncheon);
        sound.playRadar();
      },
      onKokomoChange: (newKokomo) => {
        setKokomoInventory(normalizeKokomoInventory(newKokomo));
        sound.playRadar();
      },
      onSpeChange: (newSpe) => {
        setSpeInventory(normalizeSpeInventory(newSpe));
        sound.playRadar();
      },
      onShipmentsChange: (newShipments) => {
        setShipments(newShipments);
        sound.playRadar();
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Data Sync Handlers with Supabase Cloud & LocalStorage
  const handleUpdateIncheonInventory = (updater) => {
    setIncheonInventory(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      syncIncheonInventory(updated);
      return updated;
    });
  };

  const handleUpdateKokomoInventory = (updater) => {
    setKokomoInventory(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      syncKokomoInventory(updated);
      return updated;
    });
  };

  const handleUpdateSpeInventory = (updater) => {
    setSpeInventory(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      syncSpeInventory(updated);
      return updated;
    });
  };

  const handleUpdateShipments = (updater) => {
    setShipments(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      syncShipments(updated);
      return updated;
    });
  };

  const handleResetData = () => {
    handleUpdateIncheonInventory(INITIAL_INCHEON_INVENTORY);
    handleUpdateShipments(INITIAL_SHIPMENTS);
    handleUpdateKokomoInventory(INITIAL_KOKOMO_INVENTORY);
    handleUpdateSpeInventory(INITIAL_SPE_INVENTORY);
    setCustomSpeCoords(null);
    sound.playSuccess();
  };

  const currentSimMs = simTime.getTime();

  const isShipmentDeparted = (s) => {
    if (!s.departureDate) return true;
    const depMs = new Date(s.departureDate).getTime();
    if (isNaN(depMs)) return true;
    return currentSimMs >= depMs;
  };

  // Dynamic Simulation Calculation: Arrived Shipments vs In-Transit Shipments
  const arrivedShipments = useMemo(() => {
    return (shipments || []).filter(s => (Number(s.progress) || 0) >= 100);
  }, [shipments]);

  // Active In-Transit: MUST be departed and progress < 100! (Un-departed future shipments excluded)
  const activeTransitShipments = useMemo(() => {
    return (shipments || []).filter(s => isShipmentDeparted(s) && (Number(s.progress) || 0) < 100);
  }, [shipments, currentSimMs]);

  // Filtered Inventory Data by Selected Product ('ESS8-1' | 'ESS11-1' | 'ALL')
  const filteredIncheonInventory = useMemo(() => {
    if (selectedProduct === 'ALL') return incheonInventory;
    return {
      ...incheonInventory,
      waitingInspection: (incheonInventory.waitingInspection || []).filter(l => 
        (l.product || (l.name?.includes('11-1') ? 'ESS11-1' : 'ESS8-1')) === selectedProduct
      ),
      passedInspection: (incheonInventory.passedInspection || []).filter(l => 
        (l.product || (l.name?.includes('11-1') ? 'ESS11-1' : 'ESS8-1')) === selectedProduct
      )
    };
  }, [incheonInventory, selectedProduct]);

  const filteredShipments = useMemo(() => {
    if (selectedProduct === 'ALL') return shipments;
    return (shipments || []).filter(s => 
      (s.product || (s.items?.[0]?.name?.includes('11-1') ? 'ESS11-1' : 'ESS8-1')) === selectedProduct
    );
  }, [shipments, selectedProduct]);

  // Dynamic Kokomo Inventory: Base Kokomo stock + arrived shipments
  const effectiveKokomoInventory = useMemo(() => {
    let addMulti = 0;
    let addCap = 0;
    let addBack = 0;

    const targetArrived = arrivedShipments.filter(s => 
      selectedProduct === 'ALL' || (s.product || (s.items?.[0]?.name?.includes('11-1') ? 'ESS11-1' : 'ESS8-1')) === selectedProduct
    );

    targetArrived.forEach(s => {
      if (Array.isArray(s.items) && s.items.length > 0) {
        s.items.forEach(it => {
          const name = (it.name || '').toLowerCase();
          const q = Number(it.qty) || 0;
          if (name.includes('multi')) addMulti += q;
          else if (name.includes('cap')) addCap += q;
          else if (name.includes('back')) addBack += q;
          else addMulti += q;
        });
      } else {
        const totalQ = Number(s.quantity) || 0;
        addMulti += Math.round(totalQ * 0.55);
        addCap += Math.round(totalQ * 0.40);
        addBack += totalQ - Math.round(totalQ * 0.55) - Math.round(totalQ * 0.40);
      }
    });

    const recentArrivalEvents = targetArrived.map(s => ({
      time: s.eta ? s.eta.slice(5) : '입고',
      event: `${s.batchNo || '차수'} 코코모 입고 완료 (+${(Number(s.quantity) || 0).toLocaleString()} EA)`
    })).reverse().slice(0, 5);

    const normKokomo = normalizeKokomoInventory(kokomoInventory);
    let baseMulti = 0;
    let baseCap = 0;
    let baseBack = 0;

    if (selectedProduct === 'ESS8-1') {
      const p = normKokomo.byProduct['ESS8-1'];
      baseMulti = Number(p.multiAssy) || 0;
      baseCap = Number(p.capAssy) || 0;
      baseBack = Number(p.backShip) || 0;
    } else if (selectedProduct === 'ESS11-1') {
      const p = normKokomo.byProduct['ESS11-1'];
      baseMulti = Number(p.multiAssy) || 0;
      baseCap = Number(p.capAssy) || 0;
      baseBack = Number(p.backShip) || 0;
    } else {
      // 'ALL'
      const p8 = normKokomo.byProduct['ESS8-1'];
      const p11 = normKokomo.byProduct['ESS11-1'];
      baseMulti = (Number(p8.multiAssy) || 0) + (Number(p11.multiAssy) || 0);
      baseCap = (Number(p8.capAssy) || 0) + (Number(p11.capAssy) || 0);
      baseBack = (Number(p8.backShip) || 0) + (Number(p11.backShip) || 0);
    }

    return {
      ...normKokomo,
      multiAssy: baseMulti + addMulti,
      capAssy: baseCap + addCap,
      backShip: baseBack + addBack,
      baseTotal: baseMulti + baseCap + baseBack,
      arrivedQty: addMulti + addCap + addBack,
      arrivedCount: targetArrived.length,
      history: [
        ...recentArrivalEvents,
        ...(normKokomo.history || [])
      ].slice(0, 10)
    };
  }, [kokomoInventory, arrivedShipments, selectedProduct]);

  // Dynamic SPE Inventory: Segregated per model
  const effectiveSpeInventory = useMemo(() => {
    const normSpe = normalizeSpeInventory(speInventory);
    if (selectedProduct === 'ESS8-1') {
      const p = normSpe.byProduct['ESS8-1'];
      return {
        ...normSpe,
        totalInventory: Number(p.totalInventory) || 0,
        dailyConsumption: Number(p.dailyConsumption) || 20000
      };
    } else if (selectedProduct === 'ESS11-1') {
      const p = normSpe.byProduct['ESS11-1'];
      return {
        ...normSpe,
        totalInventory: Number(p.totalInventory) || 0,
        dailyConsumption: Number(p.dailyConsumption) || 0
      };
    } else {
      // 'ALL'
      const p8 = normSpe.byProduct['ESS8-1'];
      const p11 = normSpe.byProduct['ESS11-1'];
      return {
        ...normSpe,
        totalInventory: (Number(p8.totalInventory) || 0) + (Number(p11.totalInventory) || 0),
        dailyConsumption: (Number(p8.dailyConsumption) || 0) + (Number(p11.dailyConsumption) || 0)
      };
    }
  }, [speInventory, selectedProduct]);

  const delayedShipments = filteredShipments.filter(s => s.isDelayed);

  const getFontScaleClass = () => {
    switch (fontScale) {
      case 'compact': return 'text-[12px] leading-tight';
      case 'large': return 'text-[15px]';
      case 'xlarge': return 'text-[16.5px]';
      default: return 'text-[13.5px]';
    }
  };

  return (
    <div 
      className={`min-h-screen w-full max-w-full overflow-x-hidden ${highContrast ? 'bg-black high-contrast-theme' : themeMode === 'light' ? 'light-theme' : 'bg-[#070b14]'} text-slate-100 flex flex-col ${crtEnabled ? 'crt-overlay' : ''} ${getFontScaleClass()}`}
      style={{
        zoom: fontScale === 'compact' ? 1.0 : fontScale === 'large' ? 1.20 : fontScale === 'xlarge' ? 1.30 : 1.10
      }}
    >
      
      {/* Top Retro Tactical Header */}
      <Header
        simTime={simTime}
        setSimTime={setSimTime}
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
        lang={lang}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        authRole={authRole}
        setAuthRole={setAuthRole}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        isCloudSynced={isCloudSynced}
        selectedProduct={selectedProduct}
        setSelectedProduct={handleSelectProduct}
        themeMode={themeMode}
      />

      {/* Main Tactical Map Viewport */}
      <main className="flex-1 relative flex flex-col">
        
        {/* World Map Component */}
        <div className="relative flex-1 w-full">
          <RetroWorldMap
            shipments={filteredShipments}
            incheonInventory={filteredIncheonInventory}
            kokomoInventory={effectiveKokomoInventory}
            speInventory={effectiveSpeInventory}
            customSpeCoords={customSpeCoords}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setIsDataModalOpen(true);
            }}
            onOpenLotDetails={() => setIsDataModalOpen(true)}
            includedCategories={includedCategories}
            lang={lang}
            showPhotos={showPhotos}
            commanderPhotos={commanderPhotos}
            themeMode={themeMode}
          />

          {/* Top-Right Inventory Summary HUD (with toggle/collapse & category checkboxes) */}
          <InventorySummaryHud
            incheonInventory={filteredIncheonInventory}
            shipments={filteredShipments}
            kokomoInventory={effectiveKokomoInventory}
            speInventory={effectiveSpeInventory}
            isVisible={isHudVisible}
            onToggleVisibility={() => setIsHudVisible(!isHudVisible)}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            includedCategories={includedCategories}
            setIncludedCategories={setIncludedCategories}
            lang={lang}
            simTime={simTime}
            selectedProduct={selectedProduct}
            themeMode={themeMode}
          />

          {/* Delay Alert Notification Banner (Bottom/Center) */}
          <DelayAlertBanner
            delayedShipments={delayedShipments}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setIsDataModalOpen(true);
            }}
            lang={lang}
          />
        </div>

        {/* Bottom Transit Schedule Table */}
        <BottomTransitTable
          shipments={filteredShipments}
          onSelectShipment={(s) => {
            setSelectedShipment(s);
            setIsDataModalOpen(true);
          }}
          activeFilter={activeFilter}
          onOpenDataModal={() => setIsDataModalOpen(true)}
          lang={lang}
          simTime={simTime}
          themeMode={themeMode}
        />
      </main>

      {/* Data Management & Excel Modal */}
      <DataControlModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        incheonInventory={incheonInventory}
        setIncheonInventory={handleUpdateIncheonInventory}
        shipments={shipments}
        setShipments={handleUpdateShipments}
        kokomoInventory={kokomoInventory}
        setKokomoInventory={handleUpdateKokomoInventory}
        speInventory={speInventory}
        setSpeInventory={handleUpdateSpeInventory}
        arrivedQty={effectiveKokomoInventory.arrivedQty}
        arrivedCount={effectiveKokomoInventory.arrivedCount}
        lang={lang}
        isAdmin={isAdmin}
        authRole={authRole}
        setAuthRole={setAuthRole}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        isCloudSynced={isCloudSynced}
        selectedProduct={selectedProduct}
        themeMode={themeMode}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customSpeCoords={customSpeCoords}
        setCustomSpeCoords={setCustomSpeCoords}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        soundVolume={soundVolume}
        setSoundVolume={setSoundVolume}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        onResetData={handleResetData}
        fontScale={fontScale}
        setFontScale={setFontScale}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        autoPauseOnDelay={autoPauseOnDelay}
        setAutoPauseOnDelay={setAutoPauseOnDelay}
        timeSpeed={timeSpeed}
        setTimeSpeed={setTimeSpeed}
        lang={lang}
        setLang={setLang}
        showPhotos={showPhotos}
        setShowPhotos={setShowPhotos}
        commanderPhotos={commanderPhotos}
        onUpdateCommanderPhoto={handleUpdateCommanderPhoto}
        isAdmin={isAdmin}
        authRole={authRole}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        themeMode={themeMode}
        setThemeMode={handleSetThemeMode}
      />

      {/* Admin Passcode Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={(role) => {
          setAuthRole(role);
          setIsAdmin(true);
        }}
        lang={lang}
      />

    </div>
  );
}
