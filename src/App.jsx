import React, { useState, useEffect, useRef } from 'react';
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

export default function App() {
  // Global Data State
  const [incheonInventory, setIncheonInventory] = useState(INITIAL_INCHEON_INVENTORY);
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS);
  const [kokomoInventory, setKokomoInventory] = useState(INITIAL_KOKOMO_INVENTORY);
  const [speInventory, setSpeInventory] = useState(INITIAL_SPE_INVENTORY);
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
        if (isLate && !s.isDelayed) {
          newlyDelayed = true;
        }

        return {
          ...s,
          progress: Math.round(Math.min(100, Math.max(0, prog)) * 10) / 10,
          isDelayed: isLate || (currentMs > etaMs && s.isDelayed)
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
          if (data.kokomo) setKokomoInventory(data.kokomo);
          if (data.spe) setSpeInventory(data.spe);
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
        setKokomoInventory(newKokomo);
        sound.playRadar();
      },
      onSpeChange: (newSpe) => {
        setSpeInventory(newSpe);
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

  const delayedShipments = shipments.filter(s => s.isDelayed);

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
      className={`min-h-screen w-full max-w-full overflow-x-hidden ${highContrast ? 'bg-black high-contrast-theme' : 'bg-[#070b14]'} text-slate-100 flex flex-col ${crtEnabled ? 'crt-overlay' : ''} ${getFontScaleClass()}`}
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
            includedCategories={includedCategories}
            lang={lang}
            showPhotos={showPhotos}
            commanderPhotos={commanderPhotos}
          />

          {/* Top-Right Inventory Summary HUD (with toggle/collapse & category checkboxes) */}
          <InventorySummaryHud
            incheonInventory={incheonInventory}
            shipments={shipments}
            kokomoInventory={kokomoInventory}
            speInventory={speInventory}
            isVisible={isHudVisible}
            onToggleVisibility={() => setIsHudVisible(!isHudVisible)}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            includedCategories={includedCategories}
            setIncludedCategories={setIncludedCategories}
            lang={lang}
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
          shipments={shipments}
          onSelectShipment={(s) => {
            setSelectedShipment(s);
            setIsDataModalOpen(true);
          }}
          activeFilter={activeFilter}
          onOpenDataModal={() => setIsDataModalOpen(true)}
          lang={lang}
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
        lang={lang}
        isAdmin={isAdmin}
        authRole={authRole}
        setAuthRole={setAuthRole}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        isCloudSynced={isCloudSynced}
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
