import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Ship, 
  Plane, 
  Truck, 
  Factory, 
  Building2, 
  FileSpreadsheet, 
  Clock,
  CheckCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Key,
  Save,
  PackageCheck,
  Undo2,
  RotateCcw
} from 'lucide-react';
import { sound } from '../utils/soundFx';
import { 
  exportToExcel, 
  downloadSampleTemplate, 
  parseUploadedFile, 
  normalizeDateSafe, 
  calculateRealProgress, 
  formatDateDisplay 
} from '../utils/excelParser';
import { 
  syncIncheonInventory, 
  syncKokomoInventory, 
  syncSpeInventory, 
  syncShipments 
} from '../services/inventoryService';

export default function DataControlModal({
  isOpen,
  onClose,
  incheonInventory,
  setIncheonInventory,
  shipments,
  setShipments,
  kokomoInventory,
  setKokomoInventory,
  speInventory,
  setSpeInventory,
  lang = 'ko',
  isAdmin = false,
  authRole = null,
  setAuthRole,
  onOpenAdminAuth
}) {
  const [activeTab, setActiveTab] = useState('SHIPMENTS');
  const [uploadMessage, setUploadMessage] = useState(null);

  const currentRole = authRole || (isAdmin ? 'MASTER_ADMIN' : null);
  const isViewer = !currentRole;
  const canEditIncheon = currentRole === 'INCHEON_LEAD' || currentRole === 'MASTER_ADMIN';
  const canEditShipments = currentRole === 'INCHEON_LEAD' || currentRole === 'MASTER_ADMIN';
  const canEditKokomo = currentRole === 'USA_LEAD' || currentRole === 'MASTER_ADMIN';
  const canEditSpe = currentRole === 'USA_LEAD' || currentRole === 'MASTER_ADMIN';
  const canUploadExcel = currentRole === 'MASTER_ADMIN' || currentRole === 'INCHEON_LEAD';

  // Local editable form states for Kokomo and SPE to ensure clean Save actions
  const [kokomoForm, setKokomoForm] = useState({
    multiAssy: kokomoInventory.multiAssy,
    capAssy: kokomoInventory.capAssy,
    backShip: kokomoInventory.backShip
  });

  const [speForm, setSpeForm] = useState({
    totalInventory: speInventory.totalInventory,
    dailyConsumption: speInventory.dailyConsumption
  });

  useEffect(() => {
    setKokomoForm({
      multiAssy: kokomoInventory.multiAssy,
      capAssy: kokomoInventory.capAssy,
      backShip: kokomoInventory.backShip
    });
  }, [kokomoInventory.multiAssy, kokomoInventory.capAssy, kokomoInventory.backShip]);

  useEffect(() => {
    setSpeForm({
      totalInventory: speInventory.totalInventory,
      dailyConsumption: speInventory.dailyConsumption
    });
  }, [speInventory.totalInventory, speInventory.dailyConsumption]);

  // States for importing/bundling passed inspection lots into a new shipment
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [deductPassedLotsOnDispatch, setDeductPassedLotsOnDispatch] = useState(true);

  const [newShipment, setNewShipment] = useState({
    batchNo: '',
    type: 'SEA',
    vesselName: '',
    containerNo: '',
    quantity: 5000,
    departureDate: new Date().toISOString().slice(0, 16),
    eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    progress: 0,
    isDelayed: false,
    origin: '인천신항 (KR)',
    portOfEntry: 'LA 롱비치 항만 (US)',
    destination: '코코모 미주법인 (US)'
  });

  const [newLot, setNewLot] = useState({
    id: `LOT-KR-${Date.now().toString().slice(-4)}`,
    name: 'Multi Assy Standard',
    quantity: 2000,
    date: new Date().toISOString().slice(0, 10),
    status: '검사대기',
    note: '공정 완료 수입검사 대기'
  });

  if (!isOpen) return null;

  const checkPermission = (area) => {
    if (!currentRole) {
      sound.playAlert();
      if (onOpenAdminAuth) onOpenAdminAuth();
      return false;
    }
    if (area === 'INCHEON' && !canEditIncheon) {
      sound.playAlert();
      alert(lang === 'ko' ? '인천 사업장 담당자 또는 관리자 권한이 필요합니다.' : 'Incheon Station Lead or Admin permission required.');
      return false;
    }
    if (area === 'SHIPMENTS' && !canEditShipments) {
      sound.playAlert();
      alert(lang === 'ko' ? '인천 사업장 담당자 또는 관리자 권한이 필요합니다.' : 'Incheon Station Lead or Admin permission required.');
      return false;
    }
    if (area === 'KOKOMO' && !canEditKokomo) {
      sound.playAlert();
      alert(lang === 'ko' ? '미주법인 담당자 또는 관리자 권한이 필요합니다.' : 'US Corp Lead or Admin permission required.');
      return false;
    }
    if (area === 'SPE' && !canEditSpe) {
      sound.playAlert();
      alert(lang === 'ko' ? '미주법인 담당자 또는 관리자 권한이 필요합니다.' : 'US Corp Lead or Admin permission required.');
      return false;
    }
    if (area === 'EXCEL' && !canUploadExcel) {
      sound.playAlert();
      alert(lang === 'ko' ? '엑셀 업로드 권한(인천 담당자 또는 관리자)이 필요합니다.' : 'Excel upload permission required.');
      return false;
    }
    return true;
  };

  const handleSaveKokomo = (e) => {
    if (e) e.preventDefault();
    if (!checkPermission('KOKOMO')) return;
    const updated = {
      ...kokomoInventory,
      multiAssy: Number(kokomoForm.multiAssy) || 0,
      capAssy: Number(kokomoForm.capAssy) || 0,
      backShip: Number(kokomoForm.backShip) || 0
    };
    setKokomoInventory(updated);
    sound.playSuccess();
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' 
        ? `[저장 성공] 미주법인 재고가 클라우드에 영구 저장되었습니다! (Multi: ${Number(kokomoForm.multiAssy).toLocaleString()}, Cap: ${Number(kokomoForm.capAssy).toLocaleString()}, Back: ${Number(kokomoForm.backShip).toLocaleString()} EA)`
        : `[Success] Kokomo inventory saved to cloud successfully!`
    });
  };

  const handleSaveSpe = (e) => {
    if (e) e.preventDefault();
    if (!checkPermission('SPE')) return;
    const updated = {
      ...speInventory,
      totalInventory: Number(speForm.totalInventory) || 0,
      dailyConsumption: Number(speForm.dailyConsumption) || 1400
    };
    setSpeInventory(updated);
    sound.playSuccess();
    setUploadMessage({
      type: 'success',
      text: lang === 'ko'
        ? `[저장 성공] 고객 SPE 재고가 클라우드에 영구 저장되었습니다! (총재고: ${Number(speForm.totalInventory).toLocaleString()} EA, 일일소진: ${Number(speForm.dailyConsumption).toLocaleString()} EA/일)`
        : `[Success] Customer SPE inventory saved to cloud successfully!`
    });
  };

  const handleSaveIncheon = () => {
    if (!checkPermission('INCHEON')) return;
    setIncheonInventory({ ...incheonInventory });
    sound.playSuccess();
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' 
        ? `[저장 성공] 인천 로트 재고가 클라우드에 영구 저장되었습니다! (검사대기: ${incheonInventory.waitingInspection.length}건, 출하합격: ${incheonInventory.passedInspection.length}건)`
        : `[Success] Incheon inventory saved to cloud successfully!`
    });
  };

  const handleSaveShipments = () => {
    if (!checkPermission('SHIPMENTS')) return;
    setShipments([...shipments]);
    sound.playSuccess();
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' 
        ? `[저장 성공] 전체 운송 차수(${shipments.length}건) 현황이 클라우드에 영구 저장되었습니다!`
        : `[Success] All shipments saved to cloud successfully!`
    });
  };

  const handleSaveAllData = () => {
    if (!currentRole) {
      sound.playAlert();
      if (onOpenAdminAuth) onOpenAdminAuth();
      return;
    }
    sound.playSuccess();

    const updatedKokomo = {
      ...kokomoInventory,
      multiAssy: Number(kokomoForm.multiAssy) || 0,
      capAssy: Number(kokomoForm.capAssy) || 0,
      backShip: Number(kokomoForm.backShip) || 0
    };

    const updatedSpe = {
      ...speInventory,
      totalInventory: Number(speForm.totalInventory) || 0,
      dailyConsumption: Number(speForm.dailyConsumption) || 1400
    };

    // Update state and explicitly trigger persistent sync for all
    setIncheonInventory({ ...incheonInventory });
    syncIncheonInventory(incheonInventory);

    setShipments([...shipments]);
    syncShipments(shipments);

    setKokomoInventory(updatedKokomo);
    syncKokomoInventory(updatedKokomo);

    setSpeInventory(updatedSpe);
    syncSpeInventory(updatedSpe);

    try {
      localStorage.setItem('tactical_incheon_inventory', JSON.stringify(incheonInventory));
      localStorage.setItem('tactical_shipments', JSON.stringify(shipments));
      localStorage.setItem('tactical_kokomo_inventory', JSON.stringify(updatedKokomo));
      localStorage.setItem('tactical_spe_inventory', JSON.stringify(updatedSpe));
    } catch(e) {}

    setUploadMessage({
      type: 'success',
      text: lang === 'ko' 
        ? '✅ 전체 거점의 재고 및 운송 차수 데이터가 클라우드 및 브라우저에 영구 저장되었습니다!' 
        : '✅ All inventory & shipment data successfully saved to cloud and storage!'
    });
  };

  const handleToggleSelectLot = (lot) => {
    if (selectedLotIds.includes(lot.id)) {
      const nextIds = selectedLotIds.filter(id => id !== lot.id);
      setSelectedLotIds(nextIds);
      const remainingLots = incheonInventory.passedInspection.filter(l => nextIds.includes(l.id));
      const totalQ = remainingLots.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      setNewShipment(prev => ({
        ...prev,
        quantity: totalQ > 0 ? totalQ : 5000
      }));
    } else {
      const nextIds = [...selectedLotIds, lot.id];
      setSelectedLotIds(nextIds);
      const chosenLots = incheonInventory.passedInspection.filter(l => nextIds.includes(l.id));
      const totalQ = chosenLots.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      setNewShipment(prev => ({
        ...prev,
        quantity: totalQ,
        batchNo: prev.batchNo || `해상 26-${Date.now().toString().slice(-2)}차`,
        vesselName: prev.vesselName || 'HMM PACIFIC GLORY'
      }));
    }
    sound.playClick();
  };

  const handleAddShipment = (e) => {
    e.preventDefault();
    if (!checkPermission('SHIPMENTS')) return;
    if (!newShipment.batchNo || !newShipment.vesselName) {
      alert('차수명과 운송체명을 입력하세요.');
      return;
    }

    const chosenLots = incheonInventory.passedInspection.filter(l => selectedLotIds.includes(l.id));
    const items = chosenLots.length > 0
      ? chosenLots.map(l => ({ name: l.name, qty: Number(l.quantity) || 0 }))
      : [
          { name: 'Multi Assy', qty: Math.round(Number(newShipment.quantity) * 0.6) },
          { name: 'Cap Assy', qty: Math.round(Number(newShipment.quantity) * 0.4) }
        ];

    const created = {
      ...newShipment,
      id: `SHIP-${newShipment.type}-${Date.now().toString().slice(-4)}`,
      quantity: Number(newShipment.quantity),
      progress: Number(newShipment.progress),
      items
    };

    const nextShipments = [created, ...shipments];
    setShipments(nextShipments);
    syncShipments(nextShipments);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(nextShipments));
    } catch (e) {}

    // Deduct passed lots if option enabled
    if (deductPassedLotsOnDispatch && chosenLots.length > 0) {
      const remainingPassed = incheonInventory.passedInspection.filter(l => !selectedLotIds.includes(l.id));
      const updatedIncheon = {
        ...incheonInventory,
        passedInspection: remainingPassed
      };
      setIncheonInventory(updatedIncheon);
      syncIncheonInventory(updatedIncheon);
      try {
        localStorage.setItem('tactical_incheon_inventory', JSON.stringify(updatedIncheon));
      } catch (e) {}
    }

    setSelectedLotIds([]);
    sound.playSuccess();
    setNewShipment({
      batchNo: '',
      type: 'SEA',
      vesselName: '',
      containerNo: '',
      quantity: 5000,
      departureDate: new Date().toISOString().slice(0, 16),
      eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
      progress: 0,
      isDelayed: false,
      origin: '인천신항 (KR)',
      portOfEntry: 'LA 롱비치 항만 (US)',
      destination: '코코모 미주법인 (US)'
    });
    setUploadMessage({
      type: 'success',
      text: lang === 'ko'
        ? `신규 운송 차수(${created.batchNo})가 등록되었습니다! ${chosenLots.length > 0 ? `(선택된 ${chosenLots.length}개 인천 출하합격 로트 선적 완료)` : ''}`
        : `New shipment batch (${created.batchNo}) registered successfully!`
    });
  };

  const handleDeleteShipment = (id) => {
    if (!checkPermission('SHIPMENTS')) return;
    sound.playClick();
    const nextShipments = shipments.filter(s => s.id !== id);
    setShipments(nextShipments);
    syncShipments(nextShipments);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(nextShipments));
    } catch (e) {}
  };

  const handleDeleteAllShipments = () => {
    if (!checkPermission('SHIPMENTS')) return;
    if (shipments.length === 0) return;
    if (!confirm(lang === 'ko' ? `정말 등록된 ${shipments.length}개의 운송 차수를 모두 삭제하시겠습니까? (삭제 후 영구 반영됩니다)` : `Delete all ${shipments.length} shipments?`)) {
      return;
    }
    sound.playClick();
    setShipments([]);
    syncShipments([]);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify([]));
    } catch(e) {}
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' ? '✅ 모든 해상/항공 운송 차수가 성공적으로 일괄 삭제되었습니다.' : 'All shipments deleted successfully.'
    });
  };

  const handleToggleDelay = (id) => {
    if (!checkPermission('SHIPMENTS')) return;
    sound.playToggle();
    const updated = shipments.map(s => {
      if (s.id === id) {
        const nextDelayed = !s.isDelayed;
        return {
          ...s,
          isDelayed: nextDelayed,
          manualDelayed: nextDelayed, // Explicit user toggle
          delayReason: nextDelayed ? (s.delayReason || '통관 및 환적 대기 지연') : ''
        };
      }
      return s;
    });
    setShipments(updated);
    syncShipments(updated);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleProgressChange = (id, progress) => {
    if (!checkPermission('SHIPMENTS')) return;
    const updated = shipments.map(s => {
      if (s.id === id) {
        return { ...s, progress: Number(progress) };
      }
      return s;
    });
    setShipments(updated);
    syncShipments(updated);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleApproveLot = (lotId) => {
    if (!checkPermission('INCHEON')) return;
    sound.playSuccess();
    const target = incheonInventory.waitingInspection.find(l => l.id === lotId);
    if (!target) return;

    const updated = {
      waitingInspection: incheonInventory.waitingInspection.filter(l => l.id !== lotId),
      passedInspection: [
        { ...target, status: '출하합격', readyForExport: true },
        ...incheonInventory.passedInspection
      ]
    };
    setIncheonInventory(updated);
    syncIncheonInventory(updated);
    try {
      localStorage.setItem('tactical_incheon_inventory', JSON.stringify(updated));
    } catch (e) {}
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' ? `[승인 완료] ${target.id} 로트가 '출하합격 (선적 준비완료)' 상태로 이동되었습니다.` : `Lot ${target.id} approved for shipment.`
    });
  };

  const handleReturnLotToWaiting = (lotId) => {
    if (!checkPermission('INCHEON')) return;
    sound.playClick();
    const target = incheonInventory.passedInspection.find(l => l.id === lotId);
    if (!target) return;

    const updated = {
      waitingInspection: [
        { ...target, status: '검사대기', readyForExport: false },
        ...incheonInventory.waitingInspection
      ],
      passedInspection: incheonInventory.passedInspection.filter(l => l.id !== lotId)
    };
    setIncheonInventory(updated);
    syncIncheonInventory(updated);
    try {
      localStorage.setItem('tactical_incheon_inventory', JSON.stringify(updated));
    } catch (e) {}
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' ? `[환원 완료] ${target.id} 로트가 다시 '검사대기 목록'으로 복귀되었습니다.` : `Lot ${target.id} returned to pending inspection.`
    });
  };

  const handleAddLot = (e) => {
    e.preventDefault();
    if (!checkPermission('INCHEON')) return;
    sound.playSuccess();
    setIncheonInventory({
      ...incheonInventory,
      waitingInspection: [
        { ...newLot, quantity: Number(newLot.quantity) },
        ...incheonInventory.waitingInspection
      ]
    });
    setNewLot({
      id: `LOT-KR-${Date.now().toString().slice(-4)}`,
      name: 'Multi Assy Standard',
      quantity: 2000,
      date: new Date().toISOString().slice(0, 10),
      status: '검사대기',
      note: '공정 완료'
    });
  };

  const handleFileUpload = async (e) => {
    if (!checkPermission('EXCEL')) {
      if (e.target) e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseUploadedFile(file);
      sound.playSuccess();
      setUploadMessage({
        type: 'success',
        text: `성공: ${data.length}건의 데이터를 성공적으로 분석했습니다.`
      });

      // 1. Direct handling of pre-parsed production schedule shipments (from 요약 sheet)
      if (data && data.length > 0 && data[0]?.isPreParsed) {
        const railCount = data.filter(s => s.inlandMode === 'RAIL').length;
        const truckCount = data.filter(s => s.inlandMode === 'TRUCK').length;
        setShipments(data);
        syncShipments(data);
        try {
          localStorage.setItem('tactical_shipments', JSON.stringify(data));
        } catch(e) {}
        sound.playSuccess();
        setUploadMessage({
          type: 'success',
          text: `성공: 미주 출하계획 ${data.length}개 차수를 정상 등록하여 클라우드 및 저장소에 영구 저장했습니다! (철송: ${railCount}건, 싱글 트럭: ${truckCount}건)`
        });
        return;
      }

      // 2. Standard template / generic tabular data fallback
      const importedShipments = data.map((row, idx) => {
        const batchNo = row['차수명'] || row['차수ID'] || row['Batch No'] || row['차수'] || `신규 차수 #${idx + 1}`;
        const rawType = String(row['운송수단(SEA/AIR)'] || row['운송수단'] || row['Type'] || 'SEA').toUpperCase();
        const type = rawType.includes('AIR') ? 'AIR' : rawType.includes('TRUCK') ? 'TRUCK' : 'SEA';
        const methodStr = String(row['발송방법'] || row['운송방법'] || '');
        const inlandMode = (methodStr.includes('싱글') || methodStr.includes('트럭')) ? 'TRUCK' : 'RAIL';
        const containerNo = String(row['컨테이너번호'] || row['컨테이너/편명'] || row['B/L No'] || row['Container'] || `CTN-${8000 + idx}`);
        const vesselName = String(row['선박/항공기명'] || row['편명'] || row['Vessel'] || `PACIFIC CARRIER (${batchNo})`);
        
        const rawDep = row['출발일(YYYY-MM-DD)'] || row['출발일'] || row['출항일'] || row['한국출하일'] || '2026-09-02';
        const rawEta = row['도착예상일(YYYY-MM-DD)'] || row['도착예상일(ETA)'] || row['도착예상일'] || row['법인도착일'] || row['ETA'] || '2026-09-20';
        
        const departureDate = normalizeDateSafe(rawDep, new Date('2026-09-02'));
        const eta = normalizeDateSafe(rawEta, new Date('2026-09-20'));
        const quantity = Number(row['수량(EA)'] || row['수량'] || row['Multi cap 入'] || row['Quantity']) || 5000;
        
        const progress = calculateRealProgress(departureDate, eta, new Date('2026-09-09T09:00:00'));
        const isDelayed = new Date('2026-09-09T09:00:00') > new Date(eta);

        return {
          id: `IMPORT-${idx}-${Date.now().toString().slice(-4)}`,
          batchNo,
          type,
          inlandMode,
          containerNo,
          vesselName,
          departureDate,
          eta,
          quantity,
          progress,
          isDelayed,
          delayReason: isDelayed ? 'ETA 경과 지연' : null,
          items: [
            { name: 'Multi Assy', qty: Math.round(quantity * 0.6) },
            { name: 'Cap Assy', qty: Math.round(quantity * 0.4) }
          ],
          origin: type === 'AIR' ? '인천공항 (KR)' : '인천신항 (KR)',
          portOfEntry: type === 'AIR' ? '시카고 오헤어 (ORD)' : 'LA 롱비치 항만 (US)',
          destination: '코코모 미주법인 (US)'
        };
      });

      if (importedShipments.length > 0) {
        const nextShipments = [...importedShipments, ...shipments];
        setShipments(nextShipments);
        syncShipments(nextShipments);
        try {
          localStorage.setItem('tactical_shipments', JSON.stringify(nextShipments));
        } catch(e) {}
        sound.playSuccess();
        setUploadMessage({
          type: 'success',
          text: `성공: ${importedShipments.length} 건의 운송 차수를 등록하고 클라우드 및 저장소에 영구 저장했습니다!`
        });
      }
    } catch (err) {
      console.error(err);
      sound.playAlert();
      setUploadMessage({
        type: 'error',
        text: `파일 분석 실패: ${err.message || '지원되는 엑셀(.xlsx) 또는 CSV 파일 형식을 확인해주세요.'}`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono animate-fadeIn">
      <div className="pixel-box bg-[#0c1322] border-2 border-cyan-400 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.4)]">
        
        <div className="bg-[#131f35] px-4 py-3 border-b border-cyan-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400 animate-pulse"></span>
            <h2 className="text-sm md:text-base font-bold text-cyan-300">
              [데이터 통제 센터] 재고 관리 & 엑셀 입출력
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {currentRole && (
              <button
                onClick={handleSaveAllData}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-emerald-400 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all"
                title="현재 화면의 모든 변경사항을 클라우드에 영구 저장"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'SAVE ALL DATA' : '전체 데이터 저장'}</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1 hover:bg-[#203352] text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Floating Notification Banner for Save Confirmation */}
        {uploadMessage && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
            uploadMessage.type === 'success' 
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-inner' 
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{uploadMessage.text}</span>
            </div>
            <button 
              onClick={() => setUploadMessage(null)}
              className="text-slate-400 hover:text-white text-[11px] underline ml-2"
            >
              닫기
            </button>
          </div>
        )}

        {/* Dynamic Role Authentication Status Banner */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-xs border-b ${
          !currentRole 
            ? 'bg-amber-950/90 border-amber-500/70 text-amber-200' 
            : currentRole === 'INCHEON_LEAD'
            ? 'bg-[#09232d] border-cyan-500/70 text-cyan-200'
            : currentRole === 'USA_LEAD'
            ? 'bg-[#291b0c] border-amber-500/70 text-amber-200'
            : 'bg-[#0b291a] border-emerald-500/70 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {!currentRole ? (
              <>
                <Lock className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Viewer Mode (Read-Only): Login with Station Lead PIN or Admin passcode to edit inventory.'
                    : '열람 모드 (읽기 전용): 수량을 입력·수정하려면 담당자 PIN 번호(인천/미국) 또는 관리자 암호로 로그인하십시오.'}
                </span>
              </>
            ) : currentRole === 'INCHEON_LEAD' ? (
              <>
                <Unlock className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
                <span className="font-bold">
                  {lang === 'en'
                    ? 'Authenticated: Incheon Lead (Authorized to edit Incheon stock & Pacific dispatches)'
                    : '인증됨: [인천 사업장 담당자] - 인천 검사대기/출하합격 로트 및 해상/항공 차수 등록·수정 권한 활성화'}
                </span>
              </>
            ) : currentRole === 'USA_LEAD' ? (
              <>
                <Unlock className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <span className="font-bold">
                  {lang === 'en'
                    ? 'Authenticated: US Corp Lead (Authorized to edit Kokomo 3-stock & SPE customer inventory)'
                    : '인증됨: [미주법인 담당자] - 코코모 3대 재고(Multi/Cap/Back) 및 SPE 고객 재고·소진율 수정 권한 활성화'}
                </span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                <span className="font-bold">
                  {lang === 'en'
                    ? 'Authenticated: Master Admin (Full access to all facilities, Excel upload & system configuration)'
                    : '인증됨: [마스터 총괄 관리자] - 전 거점 데이터 수정 및 엑셀 일괄 업로드 전체 권한 활성화'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            {!currentRole ? (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onOpenAdminAuth) onOpenAdminAuth();
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded transition-all whitespace-nowrap shadow-md flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Station / Admin Login' : '담당자 / 관리자 로그인'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  if (setAuthRole) setAuthRole(null);
                }}
                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 text-[11px] font-bold rounded transition-colors whitespace-nowrap"
              >
                {lang === 'en' ? 'Logout' : '로그아웃'}
              </button>
            )}
          </div>
        </div>

        <div className="flex border-b border-slate-700 bg-[#090e1a] text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('SHIPMENTS');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'SHIPMENTS' 
                ? 'border-cyan-400 text-cyan-300 bg-[#132035]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>해상/항공 운송 차수 ({shipments.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('INCHEON');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'INCHEON' 
                ? 'border-cyan-400 text-cyan-300 bg-[#132035]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>인천 로트 관리 ({incheonInventory.waitingInspection.length + incheonInventory.passedInspection.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('US_STOCK');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'US_STOCK' 
                ? 'border-cyan-400 text-cyan-300 bg-[#132035]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>미주법인 & SPE 재고</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('EXCEL');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'EXCEL' 
                ? 'border-emerald-400 text-emerald-300 bg-[#0d261e]' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>엑셀(Excel) 연동</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'SHIPMENTS' && (
            <div className="space-y-4">
              {!canEditShipments && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/80 text-amber-200 rounded flex items-center justify-between shadow">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'LOCKED: Incheon Station Lead or Master Admin authorization required to add or modify shipments.'
                        : '🔒 [수정 불가] 운송 차수 등록 및 진행률 변경 권한이 잠겨 있습니다. (인천 담당자 또는 관리자 로그인 필요)'}
                    </span>
                  </div>
                  {isViewer && (
                    <button
                      onClick={() => { sound.playClick(); if (onOpenAdminAuth) onOpenAdminAuth(); }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded whitespace-nowrap ml-2 shadow"
                    >
                      로그인
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleAddShipment} className={`border p-3.5 space-y-3 transition-opacity ${!canEditShipments ? 'bg-[#0a0f19] border-slate-800 opacity-60' : 'bg-[#101b2d] border-cyan-700/60'}`}>
                <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <Plus className="w-4 h-4" /> {lang === 'en' ? 'Register New Shipment Batch' : '신규 운송 차수 등록'}
                </div>

                {/* 1. Import Incheon Passed Inspection Lots for Dispatch */}
                <div className="bg-[#0b1726] border border-cyan-700/60 p-2.5 rounded space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-cyan-800/80 pb-1.5">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'en' ? 'Load Incheon Passed Lots (Ready to Ship)' : '인천 출하합격(선적 준비완료) 로트 불러와 차수 편성'}</span>
                      <span className="text-[10px] text-emerald-300 font-normal">
                        ({incheonInventory.passedInspection.length}건 대기중)
                      </span>
                    </div>
                    {incheonInventory.passedInspection.length > 0 && (
                      <span className="text-[10px] text-slate-300 font-mono">
                        {lang === 'en' ? 'Available Stock:' : '선적 대기 합계:'} <b className="text-emerald-400">{incheonInventory.passedInspection.reduce((a, b) => a + (Number(b.quantity) || 0), 0).toLocaleString()}</b> EA
                      </span>
                    )}
                  </div>

                  {incheonInventory.passedInspection.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-1 flex items-center gap-1.5">
                      <span className="text-amber-400">ℹ️</span>
                      <span>{lang === 'en' ? 'No inspection-passed lots available. You can enter quantity manually, or approve lots in the Incheon tab.' : '출하합격 상태의 로트가 없습니다. 수량을 직접 입력하거나 [인천 로트 관리] 탭에서 합격 승인하세요.'}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-[10.5px] text-slate-300">
                        {lang === 'en' ? 'Click lots below to automatically load quantities and item names into this shipment:' : '출하합격된 로트를 클릭하여 이번 운송 차수에 적재할 품목으로 자동 반영하세요:'}
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {incheonInventory.passedInspection.map(lot => {
                          const isSelected = selectedLotIds.includes(lot.id);
                          return (
                            <button
                              key={lot.id}
                              type="button"
                              disabled={!canEditShipments}
                              onClick={() => handleToggleSelectLot(lot)}
                              className={`px-2 py-1 rounded text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                                isSelected 
                                  ? 'bg-emerald-800 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300' 
                                  : 'bg-[#122338] text-cyan-200 border-cyan-700 hover:border-cyan-400 hover:bg-[#18314e]'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span className="font-mono">{lot.id}</span>
                              <span className="text-slate-300 font-normal">({lot.name})</span>
                              <span className="text-amber-300 font-mono">{(Number(lot.quantity) || 0).toLocaleString()} EA</span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedLotIds.length > 0 && (
                        <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px] text-emerald-300 border-t border-cyan-900/80">
                          <span>✅ {selectedLotIds.length}개 로트 선택됨 (총 {incheonInventory.passedInspection.filter(l => selectedLotIds.includes(l.id)).reduce((sum, l) => sum + (Number(l.quantity) || 0), 0).toLocaleString()} EA 적재)</span>
                          <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={deductPassedLotsOnDispatch}
                              onChange={e => setDeductPassedLotsOnDispatch(e.target.checked)}
                              className="accent-cyan-400"
                            />
                            <span>차수 등록 시 출하합격 목록에서 차감/선적완료 처리</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">차수명</label>
                    <input
                      type="text"
                      placeholder="예: 해상 26-05차"
                      value={newShipment.batchNo}
                      onChange={e => setNewShipment({ ...newShipment, batchNo: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">운송 모드</label>
                    <select
                      value={newShipment.type}
                      onChange={e => setNewShipment({ ...newShipment, type: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    >
                      <option value="SEA">해상 컨테이너선 (SEA)</option>
                      <option value="AIR">항공 화물기 (AIR)</option>
                      <option value="TRUCK">내륙 직송 트럭 (TRUCK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">선박/편명</label>
                    <input
                      type="text"
                      placeholder="예: HMM OLYMPUS"
                      value={newShipment.vesselName}
                      onChange={e => setNewShipment({ ...newShipment, vesselName: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">적재 수량 (EA)</label>
                    <input
                      type="number"
                      value={newShipment.quantity}
                      onChange={e => setNewShipment({ ...newShipment, quantity: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">컨테이너/화물 번호</label>
                    <input
                      type="text"
                      placeholder="예: MSCU-99120-1"
                      value={newShipment.containerNo}
                      onChange={e => setNewShipment({ ...newShipment, containerNo: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">출항일시</label>
                    <input
                      type="datetime-local"
                      value={newShipment.departureDate}
                      onChange={e => setNewShipment({ ...newShipment, departureDate: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none text-[11px] ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">도착예상일 (ETA)</label>
                    <input
                      type="datetime-local"
                      value={newShipment.eta}
                      onChange={e => setNewShipment({ ...newShipment, eta: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none text-[11px] ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!canEditShipments}
                      className={`w-full font-bold p-1.5 border flex items-center justify-center gap-1 transition-colors ${
                        !canEditShipments
                          ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 shadow'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> 차수 추가
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                <div className="bg-[#0b1322] p-2.5 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-slate-300 font-bold flex items-center gap-2">
                    <Ship className="w-4 h-4 text-cyan-400" />
                    <span>현재 운송중인 차수 목록 ({shipments.length}건)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!canEditShipments || shipments.length === 0}
                      onClick={handleDeleteAllShipments}
                      className={`px-2.5 py-1.5 font-bold text-xs rounded border flex items-center gap-1 transition-all shadow ${
                        !canEditShipments || shipments.length === 0
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-40'
                          : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-600 hover:border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                      }`}
                      title={lang === 'en' ? 'Delete all shipments' : '모든 운송 차수 전체 삭제'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Delete All' : '전체 삭제'}</span>
                    </button>
                    <button
                      disabled={!canEditShipments}
                      onClick={handleSaveShipments}
                      className={`px-3 py-1.5 font-bold text-xs rounded border flex items-center gap-1.5 transition-all shadow ${
                        !canEditShipments
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>운송 차수 클라우드 저장</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {shipments.map(s => (
                    <div key={s.id} className="p-3 bg-[#0d1624] border border-slate-700 rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#17253b] border border-slate-600">
                          {s.type === 'SEA' ? <Ship className="w-5 h-5 text-cyan-400" /> : s.type === 'AIR' ? <Plane className="w-5 h-5 text-sky-400" /> : <Truck className="w-5 h-5 text-amber-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{s.batchNo}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 border border-slate-600 text-slate-300">
                              {s.vesselName} ({s.containerNo})
                            </span>
                            {s.isDelayed && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-950 border border-rose-500 text-rose-400 font-bold animate-pulse">
                                ETA 지연중
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            적재량: <span className="text-amber-300 font-bold">{s.quantity.toLocaleString()} EA</span> | ETA: {s.eta.slice(0, 16).replace('T', ' ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-36">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>위치 진행률</span>
                            <span className="text-cyan-400 font-bold">{Math.round(s.progress)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={s.progress}
                            onChange={(e) => handleProgressChange(s.id, e.target.value)}
                            disabled={!canEditShipments}
                            className={`w-full accent-cyan-400 ${!canEditShipments ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                          />
                        </div>

                        <button
                          disabled={!canEditShipments}
                          onClick={() => handleToggleDelay(s.id)}
                          className={`px-2 py-1 border text-[11px] font-bold transition-all ${
                            !canEditShipments
                              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-40'
                              : s.isDelayed 
                              ? 'bg-rose-950 border-rose-500 text-rose-300' 
                              : 'bg-[#182638] border-slate-600 text-slate-300 hover:text-white'
                          }`}
                        >
                          {s.isDelayed ? '지연 해제' : '지연 처리'}
                        </button>

                        <button
                          disabled={!canEditShipments}
                          onClick={() => handleDeleteShipment(s.id)}
                          className={`p-1.5 border rounded transition-all ${
                            !canEditShipments
                              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-40'
                              : 'bg-[#261517] hover:bg-rose-900 border-rose-700 text-rose-300'
                          }`}
                          title="차수 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'INCHEON' && (
            <div className="space-y-4">
              {!canEditIncheon && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/80 text-amber-200 rounded flex items-center justify-between shadow">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'LOCKED: Incheon Station Lead or Master Admin authorization required to edit Incheon stock.'
                        : '🔒 [수정 불가] 인천 공정 로트 등록 및 승인 권한이 잠겨 있습니다. (인천 담당자 또는 관리자 로그인 필요)'}
                    </span>
                  </div>
                  {isViewer && (
                    <button
                      onClick={() => { sound.playClick(); if (onOpenAdminAuth) onOpenAdminAuth(); }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded whitespace-nowrap ml-2 shadow"
                    >
                      로그인
                    </button>
                  )}
                </div>
              )}

              <div className="bg-[#0b1322] p-2.5 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-slate-300 font-bold flex items-center gap-2">
                  <Factory className="w-4 h-4 text-cyan-400" />
                  <span>인천 생산 및 출하합격 재고 현황 ({incheonInventory.waitingInspection.length + incheonInventory.passedInspection.length}개 로트)</span>
                </div>
                <button
                  disabled={!canEditIncheon}
                  onClick={handleSaveIncheon}
                  className={`px-3 py-1.5 font-bold text-xs rounded border flex items-center gap-1.5 transition-all shadow ${
                    !canEditIncheon
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>인천 로트 재고 클라우드 저장</span>
                </button>
              </div>

              <form onSubmit={handleAddLot} className={`border p-3 space-y-2 transition-opacity ${!canEditIncheon ? 'bg-[#0a0f19] border-slate-800 opacity-60' : 'bg-[#0f1d2c] border-cyan-800'}`}>
                <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <Plus className="w-4 h-4" /> 인천 신규 생산 로트 등록
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">로트 번호</label>
                    <input
                      type="text"
                      value={newLot.id}
                      onChange={e => setNewLot({ ...newLot, id: e.target.value })}
                      disabled={!canEditIncheon}
                      className={`w-full p-1.5 text-xs outline-none ${!canEditIncheon ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#08111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">품목명</label>
                    <input
                      type="text"
                      value={newLot.name}
                      onChange={e => setNewLot({ ...newLot, name: e.target.value })}
                      disabled={!canEditIncheon}
                      className={`w-full p-1.5 text-xs outline-none ${!canEditIncheon ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#08111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">수량 (EA)</label>
                    <input
                      type="number"
                      value={newLot.quantity}
                      onChange={e => setNewLot({ ...newLot, quantity: e.target.value })}
                      disabled={!canEditIncheon}
                      className={`w-full p-1.5 text-xs outline-none ${!canEditIncheon ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#08111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      min="1"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!canEditIncheon}
                      className={`w-full font-bold p-1.5 border text-xs transition-colors ${
                        !canEditIncheon
                          ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 shadow'
                      }`}
                    >
                      검사대기 로트 등록
                    </button>
                  </div>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-amber-500/50 bg-[#16140d] p-3">
                  <div className="flex items-center justify-between border-b border-amber-800 pb-1.5 mb-2">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> 검사대기 목록
                    </span>
                    <span className="text-[10px] text-amber-400">
                      총 {incheonInventory.waitingInspection.reduce((a, b) => a + b.quantity, 0).toLocaleString()} EA
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {incheonInventory.waitingInspection.map(lot => (
                      <div key={lot.id} className="p-2 bg-[#201d14] border border-amber-700/60 flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">{lot.id}</div>
                          <div className="text-slate-400 text-[10px]">{lot.name} | {lot.quantity.toLocaleString()} EA</div>
                        </div>
                        <button
                          disabled={!canEditIncheon}
                          onClick={() => handleApproveLot(lot.id)}
                          className={`px-2 py-1 font-bold text-[10px] border transition-all ${
                            !canEditIncheon
                              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-40'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 shadow'
                          }`}
                        >
                          출하합격 승인
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-emerald-500/50 bg-[#0d1c16] p-3">
                  <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5 mb-2">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 출하합격 (선적 준비완료)
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      총 {incheonInventory.passedInspection.reduce((a, b) => a + b.quantity, 0).toLocaleString()} EA
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {incheonInventory.passedInspection.map(lot => (
                      <div key={lot.id} className="p-2 bg-[#122820] border border-emerald-700/60 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-white font-bold">{lot.id}</div>
                          <div className="text-slate-400 text-[10px]">{lot.name} | {lot.quantity.toLocaleString()} EA</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold text-[10px] border border-emerald-600 px-1.5 py-0.5">
                            수출 선적대기
                          </span>
                          <button
                            type="button"
                            disabled={!canEditIncheon}
                            onClick={() => handleReturnLotToWaiting(lot.id)}
                            className={`px-2 py-0.5 text-[10.5px] font-bold rounded border flex items-center gap-1 transition-colors ${
                              !canEditIncheon
                                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-40'
                                : 'bg-[#182638] hover:bg-[#223650] text-amber-300 border-amber-500/60 hover:border-amber-400'
                            }`}
                            title={lang === 'en' ? 'Return to pending inspection' : '검사대기 목록으로 되돌리기'}
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>{lang === 'en' ? 'Return' : '검사대기로 환원'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'US_STOCK' && (
            <div className="space-y-4">
              {(!canEditKokomo || !canEditSpe) && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/80 text-amber-200 rounded flex items-center justify-between shadow">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'LOCKED: US Corp Lead or Master Admin authorization required to edit US stock.'
                        : '🔒 [수정 불가] 미주법인 및 SPE 재고 수정 권한이 잠겨 있습니다. (미주법인 담당자 또는 관리자 로그인 필요)'}
                    </span>
                  </div>
                  {isViewer && (
                    <button
                      onClick={() => { sound.playClick(); if (onOpenAdminAuth) onOpenAdminAuth(); }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded whitespace-nowrap ml-2 shadow"
                    >
                      로그인
                    </button>
                  )}
                </div>
              )}

              {/* Kokomo Facility Stock Form */}
              <div className={`border p-4 space-y-3 rounded transition-opacity ${!canEditKokomo ? 'bg-[#120d07] border-slate-800 opacity-60' : 'bg-[#18120b] border-amber-600'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-800/60 pb-2">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>미주법인 (코코모) 3대 재고 직접 조정</span>
                  </div>
                  <button
                    disabled={!canEditKokomo}
                    onClick={handleSaveKokomo}
                    className={`px-3 py-1.5 font-bold text-xs rounded border flex items-center gap-1.5 transition-all shadow ${
                      !canEditKokomo
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>미주법인 재고 클라우드 저장</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-cyan-300 text-[11px] mb-1 font-bold">Multi Assy 수량 (EA)</label>
                    <input
                      type="number"
                      value={kokomoForm.multiAssy}
                      onChange={e => setKokomoForm({ ...kokomoForm, multiAssy: e.target.value })}
                      disabled={!canEditKokomo}
                      className={`w-full p-2 font-bold outline-none border ${
                        !canEditKokomo
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#0c121d] border-cyan-600 text-cyan-200 focus:border-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300 text-[11px] mb-1 font-bold">Cap Assy 수량 (EA)</label>
                    <input
                      type="number"
                      value={kokomoForm.capAssy}
                      onChange={e => setKokomoForm({ ...kokomoForm, capAssy: e.target.value })}
                      disabled={!canEditKokomo}
                      className={`w-full p-2 font-bold outline-none border ${
                        !canEditKokomo
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#0c121d] border-emerald-600 text-emerald-200 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-rose-300 text-[11px] mb-1 font-bold">Back ship 수량 (EA)</label>
                    <input
                      type="number"
                      value={kokomoForm.backShip}
                      onChange={e => setKokomoForm({ ...kokomoForm, backShip: e.target.value })}
                      disabled={!canEditKokomo}
                      className={`w-full p-2 font-bold outline-none border ${
                        !canEditKokomo
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#0c121d] border-rose-600 text-rose-200 focus:border-rose-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-amber-300/80 pt-1">
                  <span>* 미주법인 전체 재고는 세 품목의 합계로 지도 및 상단 HUD에 자동 반영됩니다.</span>
                  <span className="font-bold text-amber-300">합계: {((Number(kokomoForm.multiAssy) || 0) + (Number(kokomoForm.capAssy) || 0) + (Number(kokomoForm.backShip) || 0)).toLocaleString()} EA</span>
                </div>
              </div>

              {/* Customer SPE Inventory Form */}
              <div className={`border p-4 space-y-3 rounded transition-opacity ${!canEditSpe ? 'bg-[#07130e] border-slate-800 opacity-60' : 'bg-[#0b1c14] border-emerald-600'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                    <Factory className="w-4 h-4 text-emerald-400" />
                    <span>고객 SPE 현장 잔여 재고 및 일일 소진율</span>
                  </div>
                  <button
                    disabled={!canEditSpe}
                    onClick={handleSaveSpe}
                    className={`px-3 py-1.5 font-bold text-xs rounded border flex items-center gap-1.5 transition-all shadow ${
                      !canEditSpe
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>고객 SPE 재고 클라우드 저장</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1 font-bold">고객 보유 총재고 (EA)</label>
                    <input
                      type="number"
                      value={speForm.totalInventory}
                      onChange={e => setSpeForm({ ...speForm, totalInventory: e.target.value })}
                      disabled={!canEditSpe}
                      className={`w-full p-2 font-bold outline-none border ${
                        !canEditSpe
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#07130e] border-emerald-600 text-emerald-200 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1 font-bold">일일 소진량 (EA/일)</label>
                    <input
                      type="number"
                      value={speForm.dailyConsumption}
                      onChange={e => setSpeForm({ ...speForm, dailyConsumption: e.target.value })}
                      disabled={!canEditSpe}
                      className={`w-full p-2 font-bold outline-none border ${
                        !canEditSpe
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#07130e] border-emerald-600 text-emerald-200 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-emerald-400/80 pt-1">
                  * 고객 생산라인 잔여 가동 가능일: <span className="font-bold text-amber-300">
                    {Number(speForm.dailyConsumption) > 0 ? (Number(speForm.totalInventory) / Number(speForm.dailyConsumption)).toFixed(1) : 0}일분
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EXCEL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-cyan-600 bg-[#0e1828] p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                      <Download className="w-5 h-5 text-cyan-400" />
                      현재 재고·물류 엑셀 내보내기
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      인천 재고(로트), 운송 차수(ETA, 위치), 미주법인(Multi/Cap/Back ship), SPE 고객재고를 통합 엑셀(.xlsx) 파일로 다운로드합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      exportToExcel(incheonInventory, shipments, kokomoInventory, speInventory);
                    }}
                    className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold border border-cyan-400 shadow flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    전체 데이터 엑셀(.xlsx) 다운로드
                  </button>
                </div>

                <div className="border border-emerald-600 bg-[#0e241b] p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      차수 업로드용 템플릿 다운로드
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      새로운 운송 차수나 대량 데이터를 업로드하기 위한 사전 양식을 다운로드합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      downloadSampleTemplate();
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold border border-emerald-400 shadow flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    업로드용 샘플 템플릿 받기
                  </button>
                </div>
              </div>

              <div className={`border-2 border-dashed p-6 text-center space-y-3 transition-opacity ${!canUploadExcel ? 'border-slate-800 bg-[#070b13] opacity-60' : 'border-cyan-500/70 bg-[#0b1424]'}`}>
                <Upload className={`w-10 h-10 mx-auto ${!canUploadExcel ? 'text-slate-600' : 'text-cyan-400 animate-bounce'}`} />
                <div>
                  <h3 className="text-sm font-bold text-white">{lang === 'en' ? 'Upload Excel (.xlsx) or CSV File' : '엑셀(.xlsx) 또는 CSV 파일 업로드'}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {!canUploadExcel
                      ? (lang === 'en' ? '🔒 [Upload Locked] Station Lead or Admin authorization required to upload.' : '🔒 [업로드 잠김] 담당자 또는 관리자 로그인 후 업로드할 수 있습니다.')
                      : (lang === 'en' ? 'Upload schedule file to instantly register and sync to cloud.' : '작성된 운송 데이터 파일을 선택하여 즉시 대시보드 및 클라우드에 영구 반영하세요.')}
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  disabled={!canUploadExcel}
                  className="hidden"
                  id="excelFileInput"
                />
                <label
                  htmlFor={canUploadExcel ? "excelFileInput" : undefined}
                  onClick={() => {
                    if (!canUploadExcel) {
                      sound.playAlert();
                      if (onOpenAdminAuth) onOpenAdminAuth();
                    }
                  }}
                  className={`inline-block px-4 py-2 font-bold border transition-colors ${
                    !canUploadExcel
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer border-cyan-300 shadow'
                  }`}
                >
                  {!canUploadExcel ? (lang === 'en' ? '🔒 Authorization Required (Login)' : '🔒 권한 필요 (로그인)') : (lang === 'en' ? 'Browse File...' : '파일 찾아보기...')}
                </label>

                {currentRole && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAllData}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-400 rounded shadow flex items-center gap-1.5 mx-auto"
                    >
                      <Save className="w-4 h-4" />
                      <span>{lang === 'en' ? '💾 SAVE ALL DATA (Cloud & Local Storage)' : '💾 전체 데이터 저장 (클라우드 & 로컬 영구 반영)'}</span>
                    </button>
                  </div>
                )}

                {uploadMessage && (
                  <div className={`p-2 border text-xs font-bold ${
                    uploadMessage.type === 'success' 
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                      : 'bg-rose-950 border-rose-500 text-rose-300'
                  }`}>
                    {uploadMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#101b2d] px-4 py-2.5 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {currentRole ? (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>데이터 입력 후 [저장] 버튼을 누르면 클라우드(DB)와 브라우저에 즉시 영구 보존됩니다.</span>
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>현재 열람 모드입니다. 데이터를 수정하려면 우측 상단 로그인 버튼을 누르세요.</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentRole && (
              <button
                onClick={handleSaveAllData}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 font-black text-xs rounded flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>전체 데이터 일괄 저장</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-1.5 bg-[#1f2e46] hover:bg-[#2b3e5e] text-white border border-slate-500 font-bold rounded whitespace-nowrap"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
