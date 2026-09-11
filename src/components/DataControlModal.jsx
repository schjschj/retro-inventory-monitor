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
  Train,
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
  RotateCcw,
  Edit2
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
import { normalizeKokomoInventory, normalizeSpeInventory } from '../utils/inventoryNormalization';

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
  arrivedQty = 0,
  arrivedCount = 0,
  lang = 'ko',
  isAdmin = false,
  authRole = null,
  setAuthRole,
  onOpenAdminAuth,
  selectedProduct = 'ESS8-1',
  themeMode = 'dark'
}) {
  const isLight = themeMode === 'light';
  const [activeTab, setActiveTab] = useState('INCHEON');
  const [uploadMessage, setUploadMessage] = useState(null);

  // Model selection tab for US Stock (ESS8-1 vs ESS11-1)
  const [selectedStockModel, setSelectedStockModel] = useState(() => 
    selectedProduct === 'ESS11-1' ? 'ESS11-1' : 'ESS8-1'
  );

  // Normalized Kokomo and SPE states partitioned by model
  const [kokomoByProduct, setKokomoByProduct] = useState(() => {
    return normalizeKokomoInventory(kokomoInventory).byProduct;
  });

  const [speByProduct, setSpeByProduct] = useState(() => {
    return normalizeSpeInventory(speInventory).byProduct;
  });

  useEffect(() => {
    const norm = normalizeKokomoInventory(kokomoInventory);
    setKokomoByProduct(norm.byProduct);
  }, [kokomoInventory]);

  useEffect(() => {
    const norm = normalizeSpeInventory(speInventory);
    setSpeByProduct(norm.byProduct);
  }, [speInventory]);

  // Helper to always keep shipments strictly sorted by ETA ascending (earliest ETA first)
  const sortShipmentsByEtaAsc = (list) => {
    return [...list].sort((a, b) => {
      const timeA = a.eta ? new Date(a.eta).getTime() : 0;
      const timeB = b.eta ? new Date(b.eta).getTime() : 0;
      return timeA - timeB;
    });
  };

  const currentRole = authRole || (isAdmin ? 'MASTER_ADMIN' : null);
  const isViewer = !currentRole;
  const canEditIncheon = currentRole === 'INCHEON_LEAD' || currentRole === 'MASTER_ADMIN';
  const canEditShipments = currentRole === 'INCHEON_LEAD' || currentRole === 'MASTER_ADMIN';
  const canEditKokomo = currentRole === 'USA_LEAD' || currentRole === 'MASTER_ADMIN';
  const canEditSpe = currentRole === 'USA_LEAD' || currentRole === 'MASTER_ADMIN';
  const canUploadExcel = currentRole === 'MASTER_ADMIN' || currentRole === 'INCHEON_LEAD';

  // States for importing/bundling passed inspection lots into a new shipment
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [deductPassedLotsOnDispatch, setDeductPassedLotsOnDispatch] = useState(true);

  const [newShipment, setNewShipment] = useState({
    batchNo: '',
    product: 'ESS8-1',
    type: 'SEA',
    vesselName: '',
    containerNo: '',
    quantity: 5000,
    departureDate: new Date().toISOString().slice(0, 16),
    eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    progress: 0,
    isDelayed: false,
    overlandMode: 'RAIL',
    inlandMode: 'RAIL',
    origin: '인천신항 (KR)',
    portOfEntry: 'LA 롱비치 항만 (US)',
    destination: '코코모 미주법인 (US)'
  });

  // State for inline editing of existing shipments
  const [editingShipmentId, setEditingShipmentId] = useState(null);
  const [editShipmentForm, setEditShipmentForm] = useState({
    batchNo: '',
    product: 'ESS8-1',
    type: 'SEA',
    vesselName: '',
    containerNo: '',
    quantity: 0,
    departureDate: '',
    eta: '',
    progress: 0,
    overlandMode: 'RAIL',
    inlandMode: 'RAIL',
    origin: '',
    portOfEntry: '',
    destination: ''
  });

  const [newLot, setNewLot] = useState({
    id: `LOT-KR-${Date.now().toString().slice(-4)}`,
    product: 'ESS8-1',
    name: 'ESS8-1',
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

  const handleKokomoFieldChange = (field, val) => {
    const num = Math.max(0, Number(val) || 0);
    setKokomoByProduct(prev => ({
      ...prev,
      [selectedStockModel]: {
        ...prev[selectedStockModel],
        [field]: num
      }
    }));
  };

  const handleSpeFieldChange = (field, val) => {
    const num = Math.max(0, Number(val) || 0);
    setSpeByProduct(prev => ({
      ...prev,
      [selectedStockModel]: {
        ...prev[selectedStockModel],
        [field]: num
      }
    }));
  };

  const handleSaveKokomo = (e) => {
    if (e) e.preventDefault();
    if (!checkPermission('KOKOMO')) return;
    const ess8K = kokomoByProduct['ESS8-1'] || { multiAssy: 0, capAssy: 0, backShip: 0 };
    const ess11K = kokomoByProduct['ESS11-1'] || { multiAssy: 0, capAssy: 0, backShip: 0 };
    const updated = {
      ...kokomoInventory,
      byProduct: kokomoByProduct,
      multiAssy: (Number(ess8K.multiAssy) || 0) + (Number(ess11K.multiAssy) || 0),
      capAssy: (Number(ess8K.capAssy) || 0) + (Number(ess11K.capAssy) || 0),
      backShip: (Number(ess8K.backShip) || 0) + (Number(ess11K.backShip) || 0)
    };
    setKokomoInventory(updated);
    syncKokomoInventory(updated);
    try {
      localStorage.setItem('tactical_kokomo_inventory', JSON.stringify(updated));
    } catch(e) {}
    sound.playSuccess();
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' 
        ? `[저장 성공] 미주법인 재고(ESS8-1 / ESS11-1 분리)가 클라우드에 영구 저장되었습니다!`
        : `[Success] Kokomo inventory saved to cloud successfully!`
    });
  };

  const handleSaveSpe = (e) => {
    if (e) e.preventDefault();
    if (!checkPermission('SPE')) return;
    const ess8S = speByProduct['ESS8-1'] || { totalInventory: 0, dailyConsumption: 0 };
    const ess11S = speByProduct['ESS11-1'] || { totalInventory: 0, dailyConsumption: 0 };
    const updated = {
      ...speInventory,
      byProduct: speByProduct,
      totalInventory: (Number(ess8S.totalInventory) || 0) + (Number(ess11S.totalInventory) || 0),
      dailyConsumption: (Number(ess8S.dailyConsumption) || 0) + (Number(ess11S.dailyConsumption) || 0)
    };
    setSpeInventory(updated);
    syncSpeInventory(updated);
    try {
      localStorage.setItem('tactical_spe_inventory', JSON.stringify(updated));
    } catch(e) {}
    sound.playSuccess();
    setUploadMessage({
      type: 'success',
      text: lang === 'ko'
        ? `[저장 성공] 고객 SPE 재고(ESS8-1 / ESS11-1 분리)가 클라우드에 영구 저장되었습니다!`
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

    const ess8K = kokomoByProduct['ESS8-1'] || { multiAssy: 0, capAssy: 0, backShip: 0 };
    const ess11K = kokomoByProduct['ESS11-1'] || { multiAssy: 0, capAssy: 0, backShip: 0 };
    const updatedKokomo = {
      ...kokomoInventory,
      byProduct: kokomoByProduct,
      multiAssy: (Number(ess8K.multiAssy) || 0) + (Number(ess11K.multiAssy) || 0),
      capAssy: (Number(ess8K.capAssy) || 0) + (Number(ess11K.capAssy) || 0),
      backShip: (Number(ess8K.backShip) || 0) + (Number(ess11K.backShip) || 0)
    };

    const ess8S = speByProduct['ESS8-1'] || { totalInventory: 0, dailyConsumption: 0 };
    const ess11S = speByProduct['ESS11-1'] || { totalInventory: 0, dailyConsumption: 0 };
    const updatedSpe = {
      ...speInventory,
      byProduct: speByProduct,
      totalInventory: (Number(ess8S.totalInventory) || 0) + (Number(ess11S.totalInventory) || 0),
      dailyConsumption: (Number(ess8S.dailyConsumption) || 0) + (Number(ess11S.dailyConsumption) || 0)
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
        ? '✅ 전체 거점 재고(ESS8-1 / ESS11-1 별도 분리) 및 운송 차수 데이터가 클라우드 및 브라우저에 영구 저장되었습니다!' 
        : '✅ All inventory (ESS8-1 & ESS11-1 segregated) and shipment data successfully saved to cloud and storage!'
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

    const targetQtyEA = Math.max(1, Number(newShipment.quantity) || 5000);
    const chosenLots = incheonInventory.passedInspection.filter(l => selectedLotIds.includes(l.id));
    const items = chosenLots.length > 0
      ? chosenLots.map(l => ({ name: l.name, qty: Number(l.quantity) || 0 }))
      : [
          { name: 'Multi Assy', qty: Math.round(targetQtyEA * 0.6) },
          { name: 'Cap Assy', qty: Math.round(targetQtyEA * 0.4) }
        ];

    const created = {
      ...newShipment,
      id: `SHIP-${newShipment.type}-${Date.now().toString().slice(-4)}`,
      product: newShipment.product || 'ESS8-1',
      quantity: targetQtyEA,
      progress: Number(newShipment.progress),
      overlandMode: newShipment.overlandMode || (newShipment.type === 'TRUCK' ? 'TRUCK' : 'RAIL'),
      inlandMode: (newShipment.overlandMode || (newShipment.type === 'TRUCK' ? 'TRUCK' : 'RAIL')) === 'TRUCK' ? 'TRUCK' : 'RAIL',
      shippingMethod: (newShipment.overlandMode || (newShipment.type === 'TRUCK' ? 'TRUCK' : 'RAIL')) === 'TRUCK' ? '싱글' : '철송',
      items
    };

    const nextShipments = sortShipmentsByEtaAsc([created, ...shipments]);
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
      product: 'ESS8-1',
      type: 'SEA',
      vesselName: '',
      containerNo: '',
      quantity: 5000,
      departureDate: new Date().toISOString().slice(0, 16),
      eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
      progress: 0,
      isDelayed: false,
      overlandMode: 'RAIL',
      inlandMode: 'RAIL',
      origin: '인천신항 (KR)',
      portOfEntry: 'LA 롱비치 항만 (US)',
      destination: '코코모 미주법인 (US)'
    });
    setUploadMessage({
      type: 'success',
      text: lang === 'ko'
        ? `신규 운송 차수(${created.batchNo})가 등록되었습니다! (${targetQtyEA.toLocaleString()} EA) ${chosenLots.length > 0 ? `(선택된 ${chosenLots.length}개 인천 출하합격 로트 선적 완료)` : ''}`
        : `New shipment batch (${created.batchNo}) registered successfully!`
    });
  };

  const handleDeleteShipment = async (id) => {
    if (!checkPermission('SHIPMENTS')) return;
    sound.playClick();
    const nextShipments = sortShipmentsByEtaAsc(shipments.filter(s => s.id !== id));
    setShipments(nextShipments);
    await syncShipments(nextShipments);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(nextShipments));
    } catch (e) {}
    if (editingShipmentId === id) setEditingShipmentId(null);
  };

  const handleDeleteAllShipments = async () => {
    if (!checkPermission('SHIPMENTS')) return;
    if (shipments.length === 0) return;
    if (!confirm(lang === 'ko' ? `정말 등록된 ${shipments.length}개의 운송 차수를 모두 삭제하시겠습니까? (삭제 후 영구 반영됩니다)` : `Delete all ${shipments.length} shipments?`)) {
      return;
    }
    sound.playClick();
    setShipments([]);
    await syncShipments([]);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify([]));
    } catch(e) {}
    setEditingShipmentId(null);
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' ? '✅ 모든 해상/항공 운송 차수가 성공적으로 일괄 삭제되었습니다.' : 'All shipments deleted successfully.'
    });
  };

  const handleStartEditShipment = (s) => {
    if (!checkPermission('SHIPMENTS')) return;
    sound.playClick();
    setEditingShipmentId(s.id);
    setEditShipmentForm({
      batchNo: s.batchNo || '',
      product: s.product || (s.items?.[0]?.name?.includes('11-1') ? 'ESS11-1' : 'ESS8-1'),
      type: s.type || 'SEA',
      vesselName: s.vesselName || '',
      containerNo: s.containerNo || '',
      quantity: s.quantity || 0,
      departureDate: s.departureDate ? s.departureDate.slice(0, 16) : '',
      eta: s.eta ? s.eta.slice(0, 16) : '',
      progress: s.progress || 0,
      overlandMode: s.overlandMode || (s.inlandMode === 'TRUCK' ? 'TRUCK' : 'RAIL'),
      origin: s.origin || (s.type === 'AIR' ? '인천국제공항 (KR)' : '인천신항 (KR)'),
      portOfEntry: s.portOfEntry || (s.type === 'AIR' ? '시카고 오헤어 (ORD)' : 'LA 롱비치 항만 (US)'),
      destination: s.destination || '코코모 미주법인 (US)'
    });
  };

  const handleSaveEditShipment = async (id) => {
    if (!checkPermission('SHIPMENTS')) return;
    sound.playSuccess();
    const editQtyEA = Math.max(1, Number(editShipmentForm.quantity) || 1);
    const mapped = shipments.map(s => {
      if (s.id === id) {
        return {
          ...s,
          batchNo: editShipmentForm.batchNo || s.batchNo,
          product: editShipmentForm.product || s.product || 'ESS8-1',
          type: editShipmentForm.type,
          vesselName: editShipmentForm.vesselName,
          containerNo: editShipmentForm.containerNo,
          quantity: editQtyEA,
          departureDate: editShipmentForm.departureDate || s.departureDate,
          eta: editShipmentForm.eta || s.eta,
          progress: Math.min(100, Math.max(0, Number(editShipmentForm.progress) || 0)),
          overlandMode: editShipmentForm.overlandMode,
          inlandMode: editShipmentForm.overlandMode === 'TRUCK' ? 'TRUCK' : 'RAIL',
          shippingMethod: editShipmentForm.overlandMode === 'TRUCK' ? '싱글' : '철송',
          origin: editShipmentForm.origin || s.origin,
          portOfEntry: editShipmentForm.portOfEntry || s.portOfEntry,
          destination: editShipmentForm.destination || s.destination
        };
      }
      return s;
    });
    const nextShipments = sortShipmentsByEtaAsc(mapped);
    setShipments(nextShipments);
    await syncShipments(nextShipments);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(nextShipments));
    } catch (e) {}
    setEditingShipmentId(null);
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' ? `[수정 완료] ${editShipmentForm.batchNo} 운송 차수 정보가 성공적으로 수정되었습니다. (${editQtyEA.toLocaleString()} EA)` : `Shipment ${editShipmentForm.batchNo} updated successfully.`
    });
  };

  const handleCancelEditShipment = () => {
    sound.playClick();
    setEditingShipmentId(null);
  };

  const handleToggleDelay = (id) => {
    if (!checkPermission('SHIPMENTS')) return;
    sound.playToggle();
    const mapped = shipments.map(s => {
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
    const updated = sortShipmentsByEtaAsc(mapped);
    setShipments(updated);
    syncShipments(updated);
    try {
      localStorage.setItem('tactical_shipments', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleProgressChange = (id, progress) => {
    if (!checkPermission('SHIPMENTS')) return;
    const mapped = shipments.map(s => {
      if (s.id === id) {
        return { ...s, progress: Number(progress) };
      }
      return s;
    });
    const updated = sortShipmentsByEtaAsc(mapped);
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
    const prod = newLot.product || 'ESS8-1';
    const lotQtyEA = Math.max(1, Number(newLot.quantity) || 2000);
    setIncheonInventory({
      ...incheonInventory,
      waitingInspection: [
        { 
          ...newLot, 
          product: prod,
          name: prod,
          quantity: lotQtyEA 
        },
        ...incheonInventory.waitingInspection
      ]
    });
    setNewLot({
      id: `LOT-KR-${Date.now().toString().slice(-4)}`,
      product: prod,
      name: prod,
      quantity: 2000,
      date: new Date().toISOString().slice(0, 10),
      status: '검사대기',
      note: '공정 완료'
    });
    setUploadMessage({
      type: 'success',
      text: lang === 'ko' ? `[등록 완료] 검사대기 로트 ${newLot.id} (${lotQtyEA.toLocaleString()} EA)가 등록되었습니다.` : `Lot ${newLot.id} registered successfully.`
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
        const sortedData = sortShipmentsByEtaAsc(data);
        const railCount = sortedData.filter(s => s.inlandMode === 'RAIL').length;
        const truckCount = sortedData.filter(s => s.inlandMode === 'TRUCK').length;
        setShipments(sortedData);
        syncShipments(sortedData);
        try {
          localStorage.setItem('tactical_shipments', JSON.stringify(sortedData));
        } catch(e) {}
        sound.playSuccess();
        const skippedMsg = data.skippedPastCount ? ` (ETA 과거 차수 ${data.skippedPastCount}건 등록 제외)` : '';
        setUploadMessage({
          type: 'success',
          text: `성공: 미주 출하계획 ${sortedData.length}개 차수를 정상 등록하여 클라우드 및 저장소에 영구 저장했습니다!${skippedMsg} (철송: ${railCount}건, 싱글 트럭: ${truckCount}건)`
        });
        return;
      }

      // 2. Standard template / generic tabular data fallback with past-ETA filtering
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      let genericSkipped = 0;

      const importedShipments = [];
      data.forEach((row, idx) => {
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

        // 등록일 기준 과거 필터링
        if (new Date(eta).getTime() < todayMidnight) {
          genericSkipped++;
          return;
        }

        const quantity = Number(row['수량(EA)'] || row['수량'] || row['Multi cap 入'] || row['Quantity']) || 5000;
        const progress = calculateRealProgress(departureDate, eta, new Date('2026-09-09T09:00:00'));
        const isDelayed = new Date('2026-09-09T09:00:00') > new Date(eta);

        importedShipments.push({
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
        });
      });

      if (importedShipments.length > 0) {
        const nextShipments = sortShipmentsByEtaAsc([...importedShipments, ...shipments]);
        setShipments(nextShipments);
        syncShipments(nextShipments);
        try {
          localStorage.setItem('tactical_shipments', JSON.stringify(nextShipments));
        } catch(e) {}
        sound.playSuccess();
        const skippedMsg = genericSkipped > 0 ? ` (ETA 과거 차수 ${genericSkipped}건 등록 제외)` : '';
        setUploadMessage({
          type: 'success',
          text: `성공: ${importedShipments.length} 건의 운송 차수를 등록하고 클라우드 및 저장소에 영구 저장했습니다!${skippedMsg}`
        });
      } else if (genericSkipped > 0) {
        sound.playAlert();
        setUploadMessage({
          type: 'error',
          text: `업로드된 모든 차수(${genericSkipped}건)의 ETA가 등록일 기준 과거여서 등록되지 않았습니다.`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-sm font-mono animate-fadeIn">
      <div className={`pixel-box w-full max-w-5xl xl:max-w-[1100px] max-h-[92vh] flex flex-col ${
        isLight
          ? 'bg-white border-2 border-slate-300 shadow-2xl text-slate-900'
          : 'bg-[#0c1322] border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.4)] text-white'
      }`}>
        
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-[#131f35] border-cyan-500/50 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-sky-500' : 'bg-cyan-400 animate-pulse'}`}></span>
            <h2 className={`text-sm md:text-base font-bold ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>
              {lang === 'en' 
                ? '[DATA CONTROL CENTER] Inventory & Logistics Management (Unit: EA)' 
                : '[데이터 통제 센터] 재고 관리 & 물류 통제 (단위: EA)'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className={`p-1 rounded transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-[#203352] text-slate-400 hover:text-white'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Floating Notification Banner for Save Confirmation */}
        {uploadMessage && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
            uploadMessage.type === 'success' 
              ? isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-inner' 
              : isLight
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>{uploadMessage.text}</span>
            </div>
            <button 
              onClick={() => setUploadMessage(null)}
              className={`text-[11px] underline ml-2 ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              닫기
            </button>
          </div>
        )}

        {/* Dynamic Role Authentication Status Banner */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-xs border-b ${
          !currentRole 
            ? isLight
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-amber-950/90 border-amber-500/70 text-amber-200' 
            : currentRole === 'INCHEON_LEAD'
            ? isLight
              ? 'bg-sky-50 border-sky-200 text-sky-950'
              : 'bg-[#09232d] border-cyan-500/70 text-cyan-200'
            : currentRole === 'USA_LEAD'
            ? isLight
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-[#291b0c] border-amber-500/70 text-amber-200'
            : isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-[#0b291a] border-emerald-500/70 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {!currentRole ? (
              <>
                <Lock className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400 animate-pulse'}`} />
                <span>
                  {lang === 'en'
                    ? 'Viewer Mode (Read-Only): Login with Station Lead PIN or Admin passcode to edit inventory.'
                    : '열람 모드 (읽기 전용): 수량을 입력·수정하려면 담당자 PIN 번호(인천/미국) 또는 관리자 암호로 로그인하십시오.'}
                </span>
              </>
            ) : currentRole === 'INCHEON_LEAD' ? (
              <>
                <Unlock className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-sky-700' : 'text-cyan-400 animate-pulse'}`} />
                <span className="font-bold">
                  {lang === 'en'
                    ? 'Authenticated: Incheon Lead (Authorized to edit Incheon stock & Pacific dispatches)'
                    : '인증됨: [인천 사업장 담당자] - 인천 검사대기/출하합격 로트 및 해상/항공 차수 등록·수정 권한 활성화'}
                </span>
              </>
            ) : currentRole === 'USA_LEAD' ? (
              <>
                <Unlock className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400 animate-pulse'}`} />
                <span className="font-bold">
                  {lang === 'en'
                    ? 'Authenticated: US Corp Lead (Authorized to edit Kokomo 3-stock & SPE customer inventory)'
                    : '인증됨: [미주법인 담당자] - 코코모 3대 재고(Multi/Cap/Back) 및 SPE 고객 재고·소진율 수정 권한 활성화'}
                </span>
              </>
            ) : (
              <>
                <Unlock className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400 animate-pulse'}`} />
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
                className={`px-3 py-1 font-bold text-xs rounded transition-all whitespace-nowrap shadow-sm flex items-center gap-1 ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                }`}
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
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors whitespace-nowrap shadow-sm ${
                  isLight
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                    : 'bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200'
                }`}
              >
                {lang === 'en' ? 'Logout' : '로그아웃'}
              </button>
            )}
          </div>
        </div>

        <div className={`flex border-b text-xs ${isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#090e1a] border-slate-700'}`}>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('INCHEON');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'INCHEON' 
                ? isLight 
                  ? 'border-blue-500 text-blue-900 bg-blue-100/80 shadow-sm' 
                  : 'border-cyan-400 text-cyan-300 bg-[#132035]' 
                : isLight 
                  ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>인천 로트 관리 ({incheonInventory.waitingInspection.length + incheonInventory.passedInspection.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('SHIPMENTS');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'SHIPMENTS' 
                ? isLight 
                  ? 'border-sky-500 text-sky-900 bg-sky-100/80 shadow-sm' 
                  : 'border-cyan-400 text-cyan-300 bg-[#132035]' 
                : isLight 
                  ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>해상/항공 운송 차수 ({shipments.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('US_STOCK');
            }}
            className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 font-bold transition-colors ${
              activeTab === 'US_STOCK' 
                ? isLight 
                  ? 'border-amber-500 text-amber-900 bg-amber-100/80 shadow-sm' 
                  : 'border-cyan-400 text-cyan-300 bg-[#132035]' 
                : isLight 
                  ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' 
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
                ? isLight 
                  ? 'border-emerald-500 text-emerald-900 bg-emerald-100/80 shadow-sm' 
                  : 'border-emerald-400 text-emerald-300 bg-[#0d261e]' 
                : isLight 
                  ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <span>엑셀(Excel) 연동</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'SHIPMENTS' && (
            <div className="space-y-4">
              {!canEditShipments && (
                <div className={`p-3 border text-amber-200 rounded flex items-center justify-between shadow-sm ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span>
                      {lang === 'en'
                        ? 'LOCKED: Incheon Station Lead or Master Admin authorization required to add or modify shipments.'
                        : '🔒 [수정 불가] 운송 차수 등록 및 진행률 변경 권한이 잠겨 있습니다. (인천 담당자 또는 관리자 로그인 필요)'}
                    </span>
                  </div>
                  {isViewer && (
                    <button
                      onClick={() => { sound.playClick(); if (onOpenAdminAuth) onOpenAdminAuth(); }}
                      className={`px-2.5 py-1 font-bold text-xs rounded whitespace-nowrap ml-2 shadow-sm ${
                        isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      로그인
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleAddShipment} className={`border p-3.5 space-y-3 transition-opacity rounded ${
                !canEditShipments 
                  ? (isLight ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-[#0a0f19] border-slate-800 opacity-60') 
                  : (isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#101b2d] border-cyan-700/60')
              }`}>
                <div className={`font-bold flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>
                  <Plus className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} /> {lang === 'en' ? 'Register New Shipment Batch' : '신규 운송 차수 등록'}
                </div>

                {/* 1. Import Incheon Passed Inspection Lots for Dispatch */}
                <div className={`border p-2.5 rounded space-y-2 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0b1726] border-cyan-700/60'}`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-cyan-800/80'}`}>
                    <div className={`font-bold flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-800' : 'text-cyan-300'}`}>
                      <PackageCheck className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      <span>{lang === 'en' ? 'Load Incheon Passed Lots (Ready to Ship)' : '인천 출하합격(선적 준비완료) 로트 불러와 차수 편성'}</span>
                      <span className={`text-[10px] font-normal ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                        ({incheonInventory.passedInspection.length}건 대기중)
                      </span>
                    </div>
                    {incheonInventory.passedInspection.length > 0 && (
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {lang === 'en' ? 'Available Stock:' : '선적 대기 합계:'} <b className={isLight ? "text-emerald-700 font-bold" : "text-emerald-400"}>{(incheonInventory.passedInspection.reduce((a, b) => a + (Number(b.quantity) || 0), 0)).toLocaleString()}</b> EA
                      </span>
                    )}
                  </div>

                  {incheonInventory.passedInspection.length === 0 ? (
                    <div className={`text-[11px] py-1 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className="text-amber-400">ℹ️</span>
                      <span>{lang === 'en' ? 'No inspection-passed lots available. You can enter quantity manually, or approve lots in the Incheon tab.' : '출하합격 상태의 로트가 없습니다. 수량을 직접 입력하거나 [인천 로트 관리] 탭에서 합격 승인하세요.'}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className={`text-[10.5px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
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
                              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                                isSelected 
                                  ? isLight
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                                    : 'bg-emerald-800 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300' 
                                  : isLight
                                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:border-slate-400 shadow-sm'
                                    : 'bg-[#122338] text-cyan-200 border-cyan-700 hover:border-cyan-400 hover:bg-[#18314e]'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span className="font-mono">{lot.id}</span>
                              <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>({lot.name})</span>
                              <span className={`font-mono ${isLight ? 'text-amber-800 font-bold' : 'text-amber-300'}`}>{(Number(lot.quantity) || 0).toLocaleString()} EA</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">품목 모델</label>
                    <select
                      value={newShipment.product || 'ESS8-1'}
                      onChange={e => setNewShipment({ ...newShipment, product: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    >
                      <option value="ESS8-1">ESS8-1</option>
                      <option value="ESS11-1">ESS11-1</option>
                    </select>
                  </div>

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
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <label className="text-slate-400">적재 수량 (EA)</label>
                      <span className="text-cyan-400 font-mono">(= {(Number(newShipment.quantity) || 0).toLocaleString()} EA)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      placeholder="예: 5000"
                      value={newShipment.quantity}
                      onChange={e => setNewShipment({ ...newShipment, quantity: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">미 내륙 연계운송</label>
                    <select
                      value={newShipment.overlandMode || 'RAIL'}
                      onChange={e => setNewShipment({ ...newShipment, overlandMode: e.target.value, inlandMode: e.target.value })}
                      disabled={!canEditShipments}
                      className={`w-full p-1.5 outline-none ${!canEditShipments ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#09111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    >
                      <option value="RAIL">🚂 화물철송 (RAIL)</option>
                      <option value="TRUCK">🚛 직송트럭 (TRUCK)</option>
                    </select>
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
                      className={`w-full font-bold p-1.5 border rounded flex items-center justify-center gap-1 transition-all shadow-sm ${
                        !canEditShipments
                          ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                          : isLight
                            ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300 font-bold'
                            : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 shadow'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> 차수 추가
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                <div className={`p-2.5 border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b1322] border-slate-700'
                }`}>
                  <div className={`font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    <Ship className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                    <span>현재 운송중인 차수 목록 ({shipments.length}건)</span>
                    <span className={`text-[10px] font-mono font-normal ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>· ETA 오름차순 (도착 임박순)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!canEditShipments || shipments.length === 0}
                      onClick={handleDeleteAllShipments}
                      className={`px-2.5 py-1.5 font-bold text-xs rounded border flex items-center gap-1 transition-all shadow-sm ${
                        !canEditShipments || shipments.length === 0
                          ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-40'
                          : isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300 font-bold'
                            : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-600 hover:border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                      }`}
                      title={lang === 'en' ? 'Delete all shipments' : '모든 운송 차수 전체 삭제'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Delete All' : '전체 삭제'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {sortShipmentsByEtaAsc(shipments).map(s => (
                    editingShipmentId === s.id ? (
                      <div key={s.id} className="p-3.5 bg-[#0f1d33] border-2 border-amber-400 rounded-sm space-y-3 shadow-[0_0_15px_rgba(251,191,36,0.25)] animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
                          <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                            <Edit2 className="w-4 h-4 text-amber-400" />
                            <span>[{s.batchNo}] 운송 차수 정보 수정</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {s.id}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">품목 모델</label>
                            <select
                              value={editShipmentForm.product || 'ESS8-1'}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, product: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
                            >
                              <option value="ESS8-1">ESS8-1</option>
                              <option value="ESS11-1">ESS11-1</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">차수명</label>
                            <input
                              type="text"
                              value={editShipmentForm.batchNo}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, batchNo: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">운송 모드</label>
                            <select
                              value={editShipmentForm.type}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, type: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
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
                              value={editShipmentForm.vesselName}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, vesselName: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <label className="text-slate-400">적재 수량 (EA)</label>
                              <span className="text-amber-400 font-mono">(= {(Number(editShipmentForm.quantity) || 0).toLocaleString()} EA)</span>
                            </div>
                            <input
                              type="number"
                              step="1"
                              value={editShipmentForm.quantity}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, quantity: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">미 내륙 연계운송</label>
                            <select
                              value={editShipmentForm.overlandMode || 'RAIL'}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, overlandMode: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
                            >
                              <option value="RAIL">🚂 화물철송 (RAIL)</option>
                              <option value="TRUCK">🚛 직송트럭 (TRUCK)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">컨테이너/화물 번호</label>
                            <input
                              type="text"
                              value={editShipmentForm.containerNo}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, containerNo: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-xs focus:border-amber-400 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">출항일시</label>
                            <input
                              type="datetime-local"
                              value={editShipmentForm.departureDate}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, departureDate: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-[11px] focus:border-amber-400 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">도착예상일 (ETA)</label>
                            <input
                              type="datetime-local"
                              value={editShipmentForm.eta}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, eta: e.target.value })}
                              className="w-full p-1.5 bg-[#09111c] border border-cyan-600 text-white rounded text-[11px] focus:border-amber-400 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 text-[10px] mb-1">위치 진행률 ({editShipmentForm.progress}%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={editShipmentForm.progress}
                              onChange={e => setEditShipmentForm({ ...editShipmentForm, progress: Number(e.target.value) })}
                              className="w-full accent-amber-400 mt-2 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/80">
                          <button
                            type="button"
                            onClick={handleCancelEditShipment}
                            className={`px-3 py-1.5 font-bold text-xs rounded border transition-colors ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {lang === 'en' ? 'Cancel' : '취소'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditShipment(s.id)}
                            className={`px-4 py-1.5 font-bold text-xs rounded border transition-all flex items-center gap-1.5 shadow-sm ${
                              isLight
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 font-bold'
                                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Save Changes' : '변경사항 저장'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={s.id} className={`p-3 border rounded flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1624] border-slate-700'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#17253b] border-slate-600'}`}>
                            {s.type === 'SEA' ? (
                              s.inlandMode === 'TRUCK' || s.overlandMode === 'TRUCK' ? (
                                <div className="flex items-center gap-0.5" title="해상 + 미내륙 직송트럭">
                                  <Ship className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                                </div>
                              ) : (
                                <div className="flex items-center gap-0.5" title="해상 + 미내륙 화물철송">
                                  <Ship className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                                  <Train className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                              )
                            ) : s.type === 'AIR' ? (
                              <Plane className={`w-5 h-5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
                            ) : s.inlandMode === 'TRUCK' || s.overlandMode === 'TRUCK' ? (
                              <Truck className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Train className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.batchNo}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 border ${
                                isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-600 text-slate-300'
                              }`}>
                                {s.vesselName} ({s.containerNo})
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 border font-bold flex items-center gap-1 ${
                                s.inlandMode === 'TRUCK' || s.overlandMode === 'TRUCK'
                                  ? isLight ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-amber-950/80 border-amber-500 text-amber-300'
                                  : isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              }`}>
                                {s.inlandMode === 'TRUCK' || s.overlandMode === 'TRUCK' ? (
                                  <><Truck className="w-3 h-3 text-amber-500" /> 직송트럭</>
                                ) : (
                                  <><Train className="w-3 h-3 text-emerald-600" /> 화물철송</>
                                )}
                              </span>
                              {s.isDelayed && (
                                <span className={`text-[10px] px-1.5 py-0.2 border font-bold animate-pulse ${
                                  isLight ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-rose-950 border-rose-500 text-rose-400'
                                }`}>
                                  ETA 지연중
                                </span>
                              )}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              적재량: <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>{(Number(s.quantity) || 0).toLocaleString()} EA</span> | ETA: {s.eta ? s.eta.slice(0, 16).replace('T', ' ') : '-'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-32 sm:w-36">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>위치 진행률</span>
                              <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>{Math.round(s.progress)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={s.progress}
                              onChange={(e) => handleProgressChange(s.id, e.target.value)}
                              disabled={!canEditShipments}
                              className={`w-full ${isLight ? 'accent-sky-600' : 'accent-cyan-400'} ${!canEditShipments ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                            />
                          </div>

                          <button
                            disabled={!canEditShipments}
                            onClick={() => handleStartEditShipment(s)}
                            className={`px-2.5 py-1 border text-[11px] font-bold rounded flex items-center gap-1 transition-all whitespace-nowrap shadow-sm ${
                              !canEditShipments
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                                : isLight
                                  ? 'bg-sky-100 hover:bg-sky-200 border-sky-300 text-sky-900 font-bold'
                                  : 'bg-[#15283f] hover:bg-[#1f3b5c] border-cyan-500/80 text-cyan-200 hover:text-white'
                            }`}
                            title={lang === 'en' ? 'Edit shipment details' : '차수 정보 상세 수정'}
                          >
                            <Edit2 className={`w-3.5 h-3.5 ${isLight ? 'text-sky-700' : 'text-cyan-300'}`} />
                            <span>{lang === 'en' ? 'Edit' : '수정'}</span>
                          </button>

                          <button
                            disabled={!canEditShipments}
                            onClick={() => handleToggleDelay(s.id)}
                            className={`px-2 py-1 border text-[11px] font-bold rounded whitespace-nowrap transition-all shadow-sm ${
                              !canEditShipments
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                                : s.isDelayed 
                                ? isLight
                                  ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-900 font-bold'
                                  : 'bg-rose-950 border-rose-500 text-rose-300' 
                                : isLight
                                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 font-bold'
                                  : 'bg-[#182638] border-slate-600 text-slate-300 hover:text-white'
                            }`}
                          >
                            {s.isDelayed ? '지연 해제' : '지연 처리'}
                          </button>

                          <button
                            disabled={!canEditShipments}
                            onClick={() => handleDeleteShipment(s.id)}
                            className={`p-1.5 border rounded transition-all shrink-0 shadow-sm ${
                              !canEditShipments
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                                : isLight
                                  ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800'
                                  : 'bg-[#261517] hover:bg-rose-900 border-rose-700 text-rose-300'
                            }`}
                            title="차수 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'INCHEON' && (
            <div className="space-y-4">
              {!canEditIncheon && (
                <div className={`p-3 border rounded flex items-center justify-between shadow-sm ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span>
                      {lang === 'en'
                        ? 'LOCKED: Incheon Station Lead or Master Admin authorization required to edit Incheon stock.'
                        : '🔒 [수정 불가] 인천 공정 로트 등록 및 승인 권한이 잠겨 있습니다. (인천 담당자 또는 관리자 로그인 필요)'}
                    </span>
                  </div>
                  {isViewer && (
                    <button
                      onClick={() => { sound.playClick(); if (onOpenAdminAuth) onOpenAdminAuth(); }}
                      className={`px-2.5 py-1 font-bold text-xs rounded whitespace-nowrap ml-2 shadow-sm ${
                        isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      로그인
                    </button>
                  )}
                </div>
              )}

              <div className={`p-2.5 border rounded flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b1322] border-slate-700'
              }`}>
                <div className={`font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  <Factory className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                  <span>인천 생산 및 출하합격 재고 현황 ({incheonInventory.waitingInspection.length + incheonInventory.passedInspection.length}개 로트)</span>
                </div>
              </div>

              <form onSubmit={handleAddLot} className={`border p-3 space-y-2 rounded transition-opacity ${
                !canEditIncheon 
                  ? (isLight ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-[#0a0f19] border-slate-800 opacity-60') 
                  : (isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0f1d2c] border-cyan-800')
              }`}>
                <div className={`font-bold flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>
                  <Plus className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} /> 인천 신규 생산 로트 등록
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
                    <label className="block text-slate-400 text-[10px] mb-1">품목 모델</label>
                    <select
                      value={newLot.product || 'ESS8-1'}
                      onChange={e => {
                        const val = e.target.value;
                        setNewLot({ ...newLot, product: val, name: val });
                      }}
                      disabled={!canEditIncheon}
                      className={`w-full p-1.5 text-xs outline-none ${!canEditIncheon ? 'bg-[#060a12] border border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#08111c] border border-slate-700 text-white focus:border-cyan-400'}`}
                    >
                      <option value="ESS8-1">ESS8-1</option>
                      <option value="ESS11-1">ESS11-1</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <label className="text-slate-400">수량 (EA)</label>
                      <span className="text-cyan-400 font-mono">(= {(Number(newLot.quantity) || 0).toLocaleString()} EA)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      placeholder="예: 2000"
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
                      className={`w-full font-bold p-1.5 border rounded text-xs transition-all shadow-sm ${
                        !canEditIncheon
                          ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                          : isLight
                            ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300 font-bold'
                            : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 shadow'
                      }`}
                    >
                      검사대기 로트 등록
                    </button>
                  </div>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`border p-3 rounded ${isLight ? 'bg-amber-50/40 border-amber-200' : 'border-amber-500/50 bg-[#16140d]'}`}>
                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${isLight ? 'border-amber-200' : 'border-amber-800'}`}>
                    <span className={`font-bold flex items-center gap-1 ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                      <Clock className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} /> 검사대기 목록
                    </span>
                    <span className={`text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                      총 {incheonInventory.waitingInspection.reduce((a, b) => a + (Number(b.quantity) || 0), 0).toLocaleString()} EA
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {incheonInventory.waitingInspection.map(lot => (
                      <div key={lot.id} className={`p-2 border rounded flex items-center justify-between gap-2 overflow-hidden ${
                        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#201d14] border-amber-700/60'
                      }`}>
                        <div className="min-w-0 flex-1 pr-1">
                          <div className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{lot.id}</div>
                          <div className={`text-[10px] sm:text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {lot.name} | <span className={`font-semibold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>{(Number(lot.quantity) || 0).toLocaleString()} EA</span>
                          </div>
                        </div>
                        <button
                          disabled={!canEditIncheon}
                          onClick={() => handleApproveLot(lot.id)}
                          className={`px-2.5 py-1 font-bold text-[10px] sm:text-[10.5px] border rounded transition-all whitespace-nowrap shrink-0 shadow-sm ${
                            !canEditIncheon
                              ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                              : isLight
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 font-bold'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 shadow'
                          }`}
                        >
                          출하합격 승인
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`border p-3 rounded ${isLight ? 'bg-emerald-50/40 border-emerald-200' : 'border-emerald-500/50 bg-[#0d1c16]'}`}>
                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${isLight ? 'border-emerald-200' : 'border-emerald-800'}`}>
                    <span className={`font-bold flex items-center gap-1 ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                      <CheckCircle className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} /> 출하합격 (선적 준비완료)
                    </span>
                    <span className={`text-[10px] font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                      총 {incheonInventory.passedInspection.reduce((a, b) => a + (Number(b.quantity) || 0), 0).toLocaleString()} EA
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {incheonInventory.passedInspection.map(lot => (
                      <div key={lot.id} className={`p-2 border rounded flex items-center justify-between gap-2 overflow-hidden ${
                        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#122820] border-emerald-700/60'
                      }`}>
                        <div className="min-w-0 flex-1 pr-1">
                          <div className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{lot.id}</div>
                          <div className={`text-[10px] sm:text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {lot.name} | <span className={`font-semibold ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>{(Number(lot.quantity) || 0).toLocaleString()} EA</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`font-bold text-[9px] sm:text-[10px] border px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                            isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-emerald-600 bg-emerald-950/70 text-emerald-300'
                          }`}>
                            수출 선적대기
                          </span>
                          <button
                            type="button"
                            disabled={!canEditIncheon}
                            onClick={() => handleReturnLotToWaiting(lot.id)}
                            className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded border flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors shadow-sm ${
                              !canEditIncheon
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-40'
                                : isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            <Undo2 className="w-3 h-3" /> 승인 취소
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

              {/* Model Switcher Sub-nav for Independent Inventory Management */}
              <div className={`p-3 border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a1324] border-cyan-500/60'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-xs ${isLight ? 'text-slate-800' : 'text-cyan-300'}`}>품목별 재고 편집 대상:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStockModel('ESS8-1')}
                      className={`px-3 py-1.5 rounded font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                        selectedStockModel === 'ESS8-1'
                          ? isLight
                            ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold'
                            : 'bg-cyan-600 text-white border border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                          : isLight
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <span>📦 ESS8-1 (기존 DB 데이터)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStockModel('ESS11-1')}
                      className={`px-3 py-1.5 rounded font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                        selectedStockModel === 'ESS11-1'
                          ? isLight
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : 'bg-amber-600 text-white border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : isLight
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <span>⚡ ESS11-1 (신규 별도 관리)</span>
                    </button>
                  </div>
                </div>
                <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  현재 편집 중: <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-cyan-300'}`}>{selectedStockModel}</span> 독립 재고
                </div>
              </div>

              {/* Kokomo Facility Stock Form */}
              <div className={`border p-4 space-y-3 rounded transition-opacity ${
                !canEditKokomo 
                  ? (isLight ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-[#120d07] border-slate-800 opacity-60') 
                  : (isLight ? 'bg-amber-50/40 border-amber-200' : 'bg-[#18120b] border-amber-600')
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 ${isLight ? 'border-amber-200' : 'border-amber-800/60'}`}>
                  <div className={`font-bold flex items-center gap-1.5 text-xs ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                    <Building2 className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span>미주법인 (코코모) 3대 재고 - [{selectedStockModel}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${isLight ? 'text-amber-900/80 font-medium' : 'text-amber-300/80'}`}>
                      선택 품목 합계: <b className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>{((kokomoByProduct[selectedStockModel]?.multiAssy || 0) + (kokomoByProduct[selectedStockModel]?.capAssy || 0) + (kokomoByProduct[selectedStockModel]?.backShip || 0)).toLocaleString()} EA</b>
                    </span>
                    <button
                      type="button"
                      disabled={!canEditKokomo}
                      onClick={handleSaveKokomo}
                      className={`px-3 py-1 font-bold text-xs rounded border transition-all flex items-center gap-1 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                        isLight
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 font-bold'
                          : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-300'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{selectedStockModel} 법인재고 저장</span>
                    </button>
                  </div>
                </div>

                {arrivedQty > 0 && (
                  <div className={`p-2 border rounded text-[11px] flex items-center justify-between shadow-sm ${
                    isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                  }`}>
                    <span>🚚 <b>시뮬레이션 입고 연동 안내:</b> 현재 도착 완료된 차수({arrivedCount}건)로 인해 메인 지도 및 HUD의 코코모 재고에 <b>+{arrivedQty.toLocaleString()} EA</b>가 실시간 합산 표시됩니다.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className={`font-bold ${isLight ? 'text-slate-700' : 'text-cyan-300'}`}>Multi Assy 수량 (EA)</label>
                      <span className={`font-mono text-[10px] ${isLight ? 'text-sky-700 font-bold' : 'text-cyan-400'}`}>(= {(Number(kokomoByProduct[selectedStockModel]?.multiAssy) || 0).toLocaleString()} EA)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={kokomoByProduct[selectedStockModel]?.multiAssy ?? 0}
                      onChange={e => handleKokomoFieldChange('multiAssy', e.target.value)}
                      disabled={!canEditKokomo}
                      className={`w-full p-2 font-bold outline-none border rounded ${
                        !canEditKokomo
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#0c121d] border-cyan-600 text-cyan-200 focus:border-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className={`font-bold ${isLight ? 'text-slate-700' : 'text-emerald-300'}`}>Cap Assy 수량 (EA)</label>
                      <span className={`font-mono text-[10px] ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>(= {(Number(kokomoByProduct[selectedStockModel]?.capAssy) || 0).toLocaleString()} EA)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={kokomoByProduct[selectedStockModel]?.capAssy ?? 0}
                      onChange={e => handleKokomoFieldChange('capAssy', e.target.value)}
                      disabled={!canEditKokomo}
                      className={`w-full p-2 font-bold outline-none border rounded ${
                        !canEditKokomo
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500' : 'bg-[#0c121d] border-emerald-600 text-emerald-200 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className={`font-bold ${isLight ? 'text-slate-700' : 'text-rose-300'}`}>Back ship 수량 (EA)</label>
                      <span className={`font-mono text-[10px] ${isLight ? 'text-rose-700 font-bold' : 'text-rose-400'}`}>(= {(Number(kokomoByProduct[selectedStockModel]?.backShip) || 0).toLocaleString()} EA)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={kokomoByProduct[selectedStockModel]?.backShip ?? 0}
                      onChange={e => handleKokomoFieldChange('backShip', e.target.value)}
                      disabled={!canEditKokomo}
                      className={`w-full p-2 font-bold outline-none border rounded ${
                        !canEditKokomo
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500' : 'bg-[#0c121d] border-rose-600 text-rose-200 focus:border-rose-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Customer SPE Inventory Form */}
              <div className={`border p-4 space-y-3 rounded transition-opacity ${
                !canEditSpe 
                  ? (isLight ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-[#07130e] border-slate-800 opacity-60') 
                  : (isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-[#0b1c14] border-emerald-600')
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 ${isLight ? 'border-emerald-200' : 'border-emerald-800/60'}`}>
                  <div className={`font-bold flex items-center gap-1.5 text-xs ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                    <Factory className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span>고객 SPE 현장 잔여 재고 및 일일 소진율 - [{selectedStockModel}]</span>
                  </div>
                  <button
                    type="button"
                    disabled={!canEditSpe}
                    onClick={handleSaveSpe}
                    className={`px-3 py-1 font-bold text-xs rounded border transition-all flex items-center gap-1 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                      isLight
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 font-bold'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-300'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{selectedStockModel} 고객재고 저장</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className="text-slate-300 font-bold">고객 보유 총재고 (EA)</label>
                      <span className="text-emerald-400 font-mono text-[10px]">(= {(Number(speByProduct[selectedStockModel]?.totalInventory) || 0).toLocaleString()} EA)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={speByProduct[selectedStockModel]?.totalInventory ?? 0}
                      onChange={e => handleSpeFieldChange('totalInventory', e.target.value)}
                      disabled={!canEditSpe}
                      className={`w-full p-2 font-bold outline-none border ${
                        !canEditSpe
                          ? 'bg-[#080d16] border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#07130e] border-emerald-600 text-emerald-200 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className="text-slate-300 font-bold">일일 소진율 (EA/일)</label>
                      <span className="text-emerald-400 font-mono text-[10px]">(= {(Number(speByProduct[selectedStockModel]?.dailyConsumption) || 0).toLocaleString()} EA/일)</span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={speByProduct[selectedStockModel]?.dailyConsumption ?? 0}
                      onChange={e => handleSpeFieldChange('dailyConsumption', e.target.value)}
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
                  * [{selectedStockModel}] 고객 생산라인 잔여 가동 가능일: <span className="font-bold text-amber-300">
                    {(Number(speByProduct[selectedStockModel]?.dailyConsumption) || 0) > 0 
                      ? ((Number(speByProduct[selectedStockModel]?.totalInventory) || 0) / (Number(speByProduct[selectedStockModel]?.dailyConsumption) || 1)).toFixed(1) 
                      : 0}일분
                  </span>
                </div>
              </div>

              {/* Executive Product Comparison & Cross-check Table */}
              <div className="border border-slate-700 bg-[#09101c] p-3 rounded space-y-2">
                <div className="font-bold text-slate-200 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    <span>품목별 미주 재고 비교표 (ESS8-1 기존 DB vs ESS11-1 신규)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    * 최상단 품목 드롭다운 선택 시 해당 품목의 재고가 화면에 자동 연동됩니다.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 bg-[#0e1726]">
                        <th className="p-2">품목 구분</th>
                        <th className="p-2 text-right">코코모 Multi Assy</th>
                        <th className="p-2 text-right">코코모 Cap Assy</th>
                        <th className="p-2 text-right">코코모 Back Ship</th>
                        <th className="p-2 text-right text-amber-300">코코모 총재고</th>
                        <th className="p-2 text-right text-emerald-300">SPE 고객 총재고</th>
                        <th className="p-2 text-right">SPE 일일소진</th>
                        <th className="p-2 text-right text-cyan-300">가동일수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr className="hover:bg-cyan-950/20">
                        <td className="p-2 font-bold text-cyan-300">📦 ESS8-1 (기존 DB)</td>
                        <td className="p-2 text-right font-mono">{(Number(kokomoByProduct['ESS8-1']?.multiAssy) || 0).toLocaleString()} EA</td>
                        <td className="p-2 text-right font-mono">{(Number(kokomoByProduct['ESS8-1']?.capAssy) || 0).toLocaleString()} EA</td>
                        <td className="p-2 text-right font-mono">{(Number(kokomoByProduct['ESS8-1']?.backShip) || 0).toLocaleString()} EA</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-300">
                          {((Number(kokomoByProduct['ESS8-1']?.multiAssy) || 0) + (Number(kokomoByProduct['ESS8-1']?.capAssy) || 0) + (Number(kokomoByProduct['ESS8-1']?.backShip) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-300">
                          {(Number(speByProduct['ESS8-1']?.totalInventory) || 0).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono">{(Number(speByProduct['ESS8-1']?.dailyConsumption) || 0).toLocaleString()} EA/일</td>
                        <td className="p-2 text-right font-mono text-cyan-300 font-bold">
                          {(Number(speByProduct['ESS8-1']?.dailyConsumption) || 0) > 0 
                            ? ((Number(speByProduct['ESS8-1']?.totalInventory) || 0) / (Number(speByProduct['ESS8-1']?.dailyConsumption) || 1)).toFixed(1) 
                            : 0}일
                        </td>
                      </tr>
                      <tr className="hover:bg-amber-950/20">
                        <td className="p-2 font-bold text-amber-300">⚡ ESS11-1 (신규 별도)</td>
                        <td className="p-2 text-right font-mono">{(Number(kokomoByProduct['ESS11-1']?.multiAssy) || 0).toLocaleString()} EA</td>
                        <td className="p-2 text-right font-mono">{(Number(kokomoByProduct['ESS11-1']?.capAssy) || 0).toLocaleString()} EA</td>
                        <td className="p-2 text-right font-mono">{(Number(kokomoByProduct['ESS11-1']?.backShip) || 0).toLocaleString()} EA</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-300">
                          {((Number(kokomoByProduct['ESS11-1']?.multiAssy) || 0) + (Number(kokomoByProduct['ESS11-1']?.capAssy) || 0) + (Number(kokomoByProduct['ESS11-1']?.backShip) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-300">
                          {(Number(speByProduct['ESS11-1']?.totalInventory) || 0).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono">{(Number(speByProduct['ESS11-1']?.dailyConsumption) || 0).toLocaleString()} EA/일</td>
                        <td className="p-2 text-right font-mono text-cyan-300 font-bold">
                          {(Number(speByProduct['ESS11-1']?.dailyConsumption) || 0) > 0 
                            ? ((Number(speByProduct['ESS11-1']?.totalInventory) || 0) / (Number(speByProduct['ESS11-1']?.dailyConsumption) || 1)).toFixed(1) 
                            : 0}일
                        </td>
                      </tr>
                      <tr className="bg-slate-800/60 font-bold">
                        <td className="p-2 text-white">합계 (ALL)</td>
                        <td className="p-2 text-right font-mono text-cyan-200">
                          {((Number(kokomoByProduct['ESS8-1']?.multiAssy) || 0) + (Number(kokomoByProduct['ESS11-1']?.multiAssy) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-200">
                          {((Number(kokomoByProduct['ESS8-1']?.capAssy) || 0) + (Number(kokomoByProduct['ESS11-1']?.capAssy) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono text-rose-200">
                          {((Number(kokomoByProduct['ESS8-1']?.backShip) || 0) + (Number(kokomoByProduct['ESS11-1']?.backShip) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono text-amber-400">
                          {((Number(kokomoByProduct['ESS8-1']?.multiAssy) || 0) + (Number(kokomoByProduct['ESS11-1']?.multiAssy) || 0) +
                            (Number(kokomoByProduct['ESS8-1']?.capAssy) || 0) + (Number(kokomoByProduct['ESS11-1']?.capAssy) || 0) +
                            (Number(kokomoByProduct['ESS8-1']?.backShip) || 0) + (Number(kokomoByProduct['ESS11-1']?.backShip) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-400">
                          {((Number(speByProduct['ESS8-1']?.totalInventory) || 0) + (Number(speByProduct['ESS11-1']?.totalInventory) || 0)).toLocaleString()} EA
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {((Number(speByProduct['ESS8-1']?.dailyConsumption) || 0) + (Number(speByProduct['ESS11-1']?.dailyConsumption) || 0)).toLocaleString()} EA/일
                        </td>
                        <td className="p-2 text-right font-mono text-white">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EXCEL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`border p-4 flex flex-col justify-between space-y-3 rounded ${
                  isLight ? 'bg-sky-50/40 border-sky-200' : 'border-cyan-600 bg-[#0e1828]'
                }`}>
                  <div>
                    <div className={`font-bold text-sm flex items-center gap-2 ${isLight ? 'text-sky-900' : 'text-cyan-300'}`}>
                      <Download className={`w-5 h-5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                      현재 재고·물류 엑셀 내보내기
                    </div>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      인천 재고(로트), 운송 차수(ETA, 위치), 미주법인(Multi/Cap/Back ship), SPE 고객재고를 통합 엑셀(.xlsx) 파일로 다운로드합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      exportToExcel(incheonInventory, shipments, kokomoInventory, speInventory);
                    }}
                    className={`w-full py-2 font-bold border rounded shadow-sm flex items-center justify-center gap-2 transition-all ${
                      isLight
                        ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300 font-bold'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 shadow'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    전체 데이터 엑셀(.xlsx) 다운로드
                  </button>
                </div>

                <div className={`border p-4 flex flex-col justify-between space-y-3 rounded ${
                  isLight ? 'bg-emerald-50/40 border-emerald-200' : 'border-emerald-600 bg-[#0e241b]'
                }`}>
                  <div>
                    <div className={`font-bold text-sm flex items-center gap-2 ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                      <FileSpreadsheet className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      차수 업로드용 템플릿 다운로드
                    </div>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      새로운 운송 차수나 대량 데이터를 업로드하기 위한 사전 양식을 다운로드합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      downloadSampleTemplate();
                    }}
                    className={`w-full py-2 font-bold border rounded shadow-sm flex items-center justify-center gap-2 transition-all ${
                      isLight
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 font-bold'
                        : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 shadow'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    업로드용 샘플 템플릿 받기
                  </button>
                </div>
              </div>

              <div className={`border-2 border-dashed p-6 text-center space-y-3 rounded transition-opacity ${
                !canUploadExcel 
                  ? (isLight ? 'border-slate-300 bg-slate-50 opacity-60' : 'border-slate-800 bg-[#070b13] opacity-60') 
                  : (isLight ? 'border-sky-300 bg-sky-50/30' : 'border-cyan-500/70 bg-[#0b1424]')
              }`}>
                <Upload className={`w-10 h-10 mx-auto ${!canUploadExcel ? 'text-slate-400' : isLight ? 'text-sky-600 animate-bounce' : 'text-cyan-400 animate-bounce'}`} />
                <div>
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{lang === 'en' ? 'Upload Excel (.xlsx) or CSV File' : '엑셀(.xlsx) 또는 CSV 파일 업로드'}</h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                  className={`inline-block px-4 py-2 font-bold border rounded transition-all shadow-sm ${
                    !canUploadExcel
                      ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                      : isLight
                        ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border-indigo-300 cursor-pointer font-bold'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer border-cyan-300 shadow'
                  }`}
                >
                  {!canUploadExcel ? (lang === 'en' ? '🔒 Authorization Required (Login)' : '🔒 권한 필요 (로그인)') : (lang === 'en' ? 'Browse File...' : '파일 찾아보기...')}
                </label>

                {uploadMessage && (
                  <div className={`p-2 border rounded text-xs font-bold ${
                    uploadMessage.type === 'success' 
                      ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                      : isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-950 border-rose-500 text-rose-300'
                  }`}>
                    {uploadMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`px-4 py-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#101b2d] border-slate-700'
        }`}>
          <div>
            {currentRole ? (
              <span className={`text-[11px] font-bold flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>데이터 입력 후 [저장] 버튼을 누르면 클라우드(DB)와 브라우저에 즉시 영구 보존됩니다.</span>
              </span>
            ) : (
              <span className={`text-[11px] font-bold flex items-center gap-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                <Lock className="w-3.5 h-3.5" />
                <span>현재 열람 모드입니다. 데이터를 수정하려면 우측 상단 로그인 버튼을 누르세요.</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAllData}
              className={`px-4 py-1.5 font-bold text-xs rounded flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
              }`}
              title={currentRole ? "전체 거점 재고 및 운송 차수 데이터를 클라우드에 영구 저장" : "관리자 로그인 후 저장 가능"}
            >
              <Save className="w-3.5 h-3.5" />
              <span>전체 데이터 일괄 저장</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className={`px-4 py-1.5 font-bold rounded whitespace-nowrap transition-colors border shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-[#1f2e46] hover:bg-[#2b3e5e] text-white border-slate-500'
              }`}
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
