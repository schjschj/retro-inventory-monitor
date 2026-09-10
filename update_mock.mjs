import fs from 'fs';
import path from 'path';

const mockContent = `export const INITIAL_INCHEON_INVENTORY = {
  waitingInspection: [
    { id: 'LOT-KR-2409-A01', name: 'Power Module Core', quantity: 2400, date: '2026-09-08', status: '검사대기', note: '외관 및 X-Ray 대기' },
    { id: 'LOT-KR-2409-A02', name: 'Cap Sub-Assembly', quantity: 1800, date: '2026-09-09', status: '검사대기', note: '신뢰성 시료 검사' },
    { id: 'LOT-KR-2409-A03', name: 'Multi Base Frame', quantity: 3200, date: '2026-09-09', status: '검사대기', note: '입고 수입검사' }
  ],
  passedInspection: [
    { id: 'LOT-KR-2408-P88', name: 'Cap Assy Standard', quantity: 4500, date: '2026-09-07', status: '출하합격', readyForExport: true },
    { id: 'LOT-KR-2408-P89', name: 'Multi Assy High-V', quantity: 5100, date: '2026-09-07', status: '출하합격', readyForExport: true },
    { id: 'LOT-KR-2408-P90', name: 'Back Ship Module', quantity: 1200, date: '2026-09-08', status: '출하합격', readyForExport: true }
  ]
};

export const INITIAL_SHIPMENTS = [
  {
    id: 'SHIP-SEA-2601',
    batchNo: '해상 26-01차',
    type: 'SEA',
    containerNo: 'TGHU-892104-2',
    vesselName: 'HMM PACIFIC GLORY',
    departureDate: '2026-09-01',
    eta: '2026-09-18',
    quantity: 12500,
    items: [
      { name: 'Multi Assy', qty: 7000 },
      { name: 'Cap Assy', qty: 4500 },
      { name: 'Back ship', qty: 1000 }
    ],
    status: 'TRANSIT_OCEAN',
    progress: 47,
    isDelayed: false,
    origin: '인천신항 (KR)',
    portOfEntry: 'LA 롱비치 항만 (US)',
    destination: '코코모 미주법인 (US)'
  },
  {
    id: 'SHIP-AIR-2602',
    batchNo: '항공 26-02차 긴급',
    type: 'AIR',
    containerNo: 'AKE-94021-KE',
    vesselName: 'KOREAN AIR CARGO 0244',
    departureDate: '2026-09-08',
    eta: '2026-09-10',
    quantity: 3200,
    items: [
      { name: 'Cap Assy (긴급공정분)', qty: 2800 },
      { name: 'Multi Assy 시제품', qty: 400 }
    ],
    status: 'TRANSIT_AIR',
    progress: 72,
    isDelayed: false,
    origin: '인천국제공항 (KR)',
    portOfEntry: '시카고 오헤어 공항 (ORD)',
    destination: '코코모 미주법인 (US)'
  },
  {
    id: 'SHIP-SEA-2598',
    batchNo: '해상 25-98차',
    type: 'SEA',
    containerNo: 'MSKU-401923-9',
    vesselName: 'EVERGREEN STAR 042',
    departureDate: '2026-08-25',
    eta: '2026-09-11',
    quantity: 14800,
    items: [
      { name: 'Multi Assy', qty: 9500 },
      { name: 'Cap Assy', qty: 4000 },
      { name: 'Back ship', qty: 1300 }
    ],
    status: 'TRANSIT_INLAND_RAIL',
    progress: 88,
    isDelayed: false,
    origin: '인천신항 (KR)',
    portOfEntry: 'LA 롱비치 항만 (US)',
    destination: '코코모 미주법인 (US)'
  },
  {
    id: 'SHIP-SEA-2595',
    batchNo: '해상 25-95차 (지연)',
    type: 'SEA',
    containerNo: 'CMAU-772910-1',
    vesselName: 'CMA CGM TAIPEI',
    departureDate: '2026-08-20',
    eta: '2026-09-07',
    quantity: 8200,
    items: [
      { name: 'Multi Assy', qty: 5200 },
      { name: 'Cap Assy', qty: 3000 }
    ],
    status: 'TRANSIT_DELAYED',
    progress: 96,
    isDelayed: true,
    delayReason: '롱비치 세관 통관 대기 및 철도 환적 지연',
    origin: '인천신항 (KR)',
    portOfEntry: 'LA 롱비치 항만 (US)',
    destination: '코코모 미주법인 (US)'
  },
  {
    id: 'DISPATCH-US-104',
    batchNo: '내륙배송 SPE-104호차',
    type: 'TRUCK',
    containerNo: 'TRUCK-IN-892',
    vesselName: 'INDIANA EXP 44',
    departureDate: '2026-09-09',
    eta: '2026-09-09',
    quantity: 1600,
    items: [
      { name: 'Multi Assy 완제품', qty: 1200 },
      { name: 'Cap Assy 보전분', qty: 400 }
    ],
    status: 'TRANSIT_FINAL_TRUCK',
    progress: 60,
    isDelayed: false,
    origin: '코코모 미주법인',
    destination: '고객 SPE 사업장'
  }
];

export const INITIAL_KOKOMO_INVENTORY = {
  location: '미주법인 (코코모, 인디애나)',
  multiAssy: 18450,
  capAssy: 12300,
  backShip: 3850,
  history: [
    { time: '09-08 14:20', event: 'SPE 3호 라인 1,200 EA 출하' },
    { time: '09-07 10:15', event: '해상 25-94차 입고 완료 (+11,000 EA)' },
    { time: '09-06 17:30', event: 'Back Ship 반송 패키징 완료' }
  ]
};

export const INITIAL_SPE_INVENTORY = {
  customerName: '고객 SPE (Semiconductor Plant)',
  location: '미국 내 반도체/배터리 클러스터',
  totalInventory: 24800,
  lots: [
    { lot: 'SPE-LN1-8842', name: 'Multi Assy Ready', qty: 9600, status: '생산라인 가동중' },
    { lot: 'SPE-LN2-8845', name: 'Cap Assy Buffer', qty: 11400, status: '버퍼 재고' },
    { lot: 'SPE-HOLD-102', name: 'Inspection Hold', qty: 3800, status: '품질 샘플링' }
  ],
  dailyConsumption: 1400,
  safetyStock: 15000
};
`;

fs.writeFileSync(path.resolve('./src/mock/initialData.js'), mockContent, 'utf8');
console.log('initialData.js updated.');
