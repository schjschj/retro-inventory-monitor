import * as XLSX from 'xlsx';

/**
 * Safely normalizes date value from Excel (which may be number, Date, or string)
 */
export function normalizeDateSafe(val, fallbackDate = new Date()) {
  if (val === null || val === undefined || val === '') {
    return fallbackDate.toISOString().slice(0, 16);
  }

  // If Excel numeric serial date (e.g. 46275)
  if (typeof val === 'number') {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 16);
      }
    } catch (e) {
      // ignore
    }
  }

  // If already a JS Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 16);
  }

  // If string
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length > 0) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 16);
      }
    }
  }

  return fallbackDate.toISOString().slice(0, 16);
}

/**
 * Calculates the exact real-time progress ratio between departure and ETA.
 * Stays static and faithful to the actual timeline unless real time elapses.
 */
export function calculateRealProgress(departureDate, eta, currentTime = new Date()) {
  try {
    const depTime = new Date(departureDate).getTime();
    const etaTime = new Date(eta).getTime();
    const now = new Date(currentTime).getTime();

    if (isNaN(depTime) || isNaN(etaTime) || etaTime <= depTime) {
      return 50;
    }

    if (now <= depTime) return 0;
    if (now >= etaTime) return 100;

    const progress = ((now - depTime) / (etaTime - depTime)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
  } catch (e) {
    return 50;
  }
}

/**
 * Formats date for display without throwing error even if value is unexpected
 */
export function formatDateDisplay(val) {
  if (!val) return '-';
  try {
    if (typeof val === 'string') {
      if (val.length >= 10) return val.slice(5, 10);
      return val;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    }
  } catch (e) {
    // fallback
  }
  return String(val);
}

/**
 * Exports current inventory & shipment data to an Excel workbook
 */
export function exportToExcel(incheon, shipments, kokomo, spe) {
  const wb = XLSX.utils.book_new();

  // 1. 인천 재고 시트
  const incheonRows = [
    ...(incheon.waitingInspection || []).map(item => ({
      '거점': '인천',
      '구분': '검사대기',
      '로트번호': item.id || '',
      '품목명': item.name || '',
      '수량': Number(item.quantity) || 0,
      '등록일': item.date || '',
      '비고': item.note || ''
    })),
    ...(incheon.passedInspection || []).map(item => ({
      '거점': '인천',
      '구분': '출하합격',
      '로트번호': item.id || '',
      '품목명': item.name || '',
      '수량': Number(item.quantity) || 0,
      '등록일': item.date || '',
      '비고': '선적 대기'
    }))
  ];
  const wsIncheon = XLSX.utils.json_to_sheet(incheonRows);
  XLSX.utils.book_append_sheet(wb, wsIncheon, '인천재고');

  // 2. 해상/항공 운송 차수 시트
  const shipmentRows = (shipments || []).map(s => ({
    '차수ID': s.id || '',
    '차수명': s.batchNo || '',
    '운송수단': s.type === 'SEA' ? '해상' : s.type === 'AIR' ? '항공' : '트럭',
    '컨테이너/편명': s.containerNo || '',
    '선박/항공기명': s.vesselName || '',
    '출발일': s.departureDate || '',
    '도착예상일(ETA)': s.eta || '',
    '수량(EA)': Number(s.quantity) || 0,
    '진행률(%)': Math.round(Number(s.progress) || 0),
    '상태': s.status || '운송중',
    '지연여부': s.isDelayed ? '지연' : '정상'
  }));
  const wsShipments = XLSX.utils.json_to_sheet(shipmentRows);
  XLSX.utils.book_append_sheet(wb, wsShipments, '해상항공_운송차수');

  // 3. 미주법인 코코모 및 SPE 시트
  const usRows = [
    { '거점': '미주법인(코코모)', '구분': 'Multi Assy', '수량': Number(kokomo.multiAssy) || 0, '비고': '완제품 조립라인' },
    { '거점': '미주법인(코코모)', '구분': 'Cap Assy', '수량': Number(kokomo.capAssy) || 0, '비고': '단품 및 버퍼' },
    { '거점': '미주법인(코코모)', '구분': 'Back ship', '수량': Number(kokomo.backShip) || 0, '비고': '반송/교체 대기' },
    { '거점': '고객 SPE', '구분': '고객 전체재고', '수량': Number(spe.totalInventory) || 0, '비고': 'SPE 생산라인 가동재고' }
  ];
  const wsUS = XLSX.utils.json_to_sheet(usRows);
  XLSX.utils.book_append_sheet(wb, wsUS, '미주법인_SPE재고');

  XLSX.writeFile(wb, `한미_재고물류_현황_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Generates and downloads a sample Excel template for users to fill in
 */
export function downloadSampleTemplate() {
  const wb = XLSX.utils.book_new();

  const sampleShipment = [
    {
      '차수명': '해상 26-03차',
      '운송수단(SEA/AIR)': 'SEA',
      '컨테이너번호': 'TEMU-123456-7',
      '선박/항공기명': 'HYUNDAI FORWARD',
      '출발일(YYYY-MM-DD)': '2026-09-02',
      '도착예상일(YYYY-MM-DD)': '2026-09-20',
      '수량': 10000
    },
    {
      '차수명': '항공 26-04차',
      '운송수단(SEA/AIR)': 'AIR',
      '컨테이너번호': 'PMC-8812-KE',
      '선박/항공기명': 'KE-CARGO-99',
      '출발일(YYYY-MM-DD)': '2026-09-08',
      '도착예상일(YYYY-MM-DD)': '2026-09-11',
      '수량': 2500
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleShipment);
  XLSX.utils.book_append_sheet(wb, ws, '운송차수_업로드양식');
  XLSX.writeFile(wb, '물류_운송차수_업로드_템플릿.xlsx');
}

/**
 * Helper to convert Excel date (serial number, Date, or string) to ISO string (YYYY-MM-DDTHH:mm)
 */
function parseExcelDateValue(val, fallbackBaseDate = null, fallbackDays = 45) {
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 16);
  }

  if (typeof val === 'number' && val > 1000) {
    try {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 16);
      }
    } catch (e) {
      // ignore
    }
  }

  if (typeof val === 'string' && val.trim().length > 0) {
    const trimmed = val.trim();
    // Check if numeric string
    const num = Number(trimmed);
    if (!isNaN(num) && num > 1000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 16);
      }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 16);
    }
  }

  // Fallback using fallbackBaseDate + fallbackDays
  if (fallbackBaseDate) {
    try {
      const baseMs = new Date(fallbackBaseDate).getTime();
      if (!isNaN(baseMs)) {
        const d = new Date(baseMs + fallbackDays * 86400 * 1000);
        return d.toISOString().slice(0, 16);
      }
    } catch (e) {
      // ignore
    }
  }

  return '2026-09-02T00:00';
}

/**
 * Checks and parses the production schedule sheet ('요약' or sheets with 차수/발송방법 columns)
 * Matches: 260909_ESS8-1_SPE_Cell_생산계획_CASE별_SAA생산계획_증산관련.xlsx
 */
function tryParseProductionSchedule(workbook) {
  // 1. Look for '요약' sheet first, then scan all sheets
  const targetSheetNames = ['요약', ...workbook.SheetNames.filter(n => n !== '요약')];

  for (const sheetName of targetSheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rows || rows.length < 3) continue;

    // Scan top 10 rows for header containing '차수' and '발송방법'
    let headerIdx = -1;
    for (let i = 0; i < Math.min(12, rows.length); i++) {
      const r = rows[i] || [];
      const hasBatch = r.some(c => typeof c === 'string' && c.includes('차수'));
      const hasMethod = r.some(c => typeof c === 'string' && (c.includes('발송방법') || c.includes('운송방법') || c.includes('배차')));
      if (hasBatch && hasMethod) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) continue;

    const headers = rows[headerIdx];
    const colBatch = headers.findIndex(c => String(c).includes('차수'));
    const colMethod = headers.findIndex(c => String(c).includes('발송방법') || String(c).includes('운송방법'));
    const colDep = headers.findIndex(c => String(c).includes('한국출하일') || String(c).includes('출하일') || String(c).includes('출항일'));
    const colEta = headers.findIndex(c => String(c).includes('법인도착일') || String(c).includes('도착일') || String(c).includes('ETA'));
    const colQty = headers.findIndex(c => String(c).includes('Multi cap') || String(c).includes('수량'));
    const colBL = headers.findIndex(c => String(c).includes('B/L') || String(c).includes('화물추적'));

    if (colBatch === -1 || colMethod === -1) continue;

    const shipments = [];
    const currentTime = new Date('2026-09-09T09:00:00');

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const batchStr = String(r[colBatch] || '').trim();
      // Skip empty rows, summary rows, or notes
      if (!batchStr || !batchStr.includes('차') || batchStr.includes('합계') || batchStr.includes('이후') || batchStr.includes('※')) {
        continue;
      }

      const methodStr = String(r[colMethod] || '').trim();
      const isTruck = methodStr.includes('싱글') || methodStr.includes('트럭');
      const inlandMode = isTruck ? 'TRUCK' : 'RAIL';

      // Parse Departure & Arrival Dates
      const departureDate = parseExcelDateValue(colDep !== -1 ? r[colDep] : null, null, 0);
      const eta = parseExcelDateValue(colEta !== -1 ? r[colEta] : null, departureDate, 45);

      // Multi cap Qty
      const rawQty = colQty !== -1 ? Number(r[colQty]) : 115200;
      const quantity = isNaN(rawQty) || rawQty <= 0 ? 115200 : rawQty;

      // B/L No (Clean up line breaks)
      let rawBL = colBL !== -1 ? String(r[colBL] || '') : '';
      rawBL = rawBL.replace(/[\r\n]+/g, ' / ').trim();
      const containerNo = (!rawBL || rawBL === 'undefined' || rawBL === '-')
        ? `BL-US-${batchStr.replace(/[^0-9]/g, '') || i}`
        : rawBL;

      const vesselName = `PACIFIC CARRIER (${batchStr})`;
      const progress = calculateRealProgress(departureDate, eta, currentTime);
      const isDelayed = currentTime > new Date(eta) && progress < 100;

      shipments.push({
        id: `IMPORT-${batchStr}-${Date.now().toString().slice(-4)}-${i}`,
        batchNo: batchStr,
        type: 'SEA',
        inlandMode: inlandMode, // 'TRUCK' or 'RAIL'
        shippingMethod: methodStr || (inlandMode === 'TRUCK' ? '싱글' : '철송'),
        containerNo,
        vesselName,
        departureDate,
        eta,
        quantity,
        progress,
        isDelayed,
        delayReason: isDelayed ? 'ETA 경과 지연' : null,
        items: [
          { name: 'Multi Assy', qty: quantity },
          { name: 'Cap Assy', qty: 0 }
        ],
        origin: '인천신항 (KR)',
        portOfEntry: 'LA 롱비치 항만 (US)',
        destination: '코코모 미주법인 (US)',
        isPreParsed: true
      });
    }

    if (shipments.length > 0) {
      return shipments;
    }
  }

  return null;
}

/**
 * Parses an uploaded Excel or CSV file safely
 */
export function parseUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // 1. Try intelligent production schedule parser first (요약 sheet)
        const productionShipments = tryParseProductionSchedule(workbook);
        if (productionShipments && productionShipments.length > 0) {
          resolve(productionShipments);
          return;
        }

        // 2. Standard sheet fallback
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

