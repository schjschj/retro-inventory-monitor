export function validateNonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return { valid: false, error: `${field} 값은 0 이상의 숫자여야 합니다.` };
  return { valid: true, value: number };
}

export function validateShipments(shipments = []) {
  const errors = [];
  const seen = new Set();
  shipments.forEach((shipment, index) => {
    const key = shipment.id || shipment.batchNo;
    if (!key) errors.push(`${index + 1}행: 운송 식별자가 없습니다.`);
    else if (seen.has(key)) errors.push(`${index + 1}행: 중복 운송 식별자 ${key}`);
    else seen.add(key);

    const qty = validateNonNegative(shipment.quantity ?? 0, `${index + 1}행 수량`);
    if (!qty.valid) errors.push(qty.error);
    const departure = Date.parse(shipment.departureDate);
    const eta = Date.parse(shipment.eta);
    if (!Number.isFinite(departure) || !Number.isFinite(eta)) errors.push(`${index + 1}행: 출발일 또는 ETA가 올바르지 않습니다.`);
    else if (eta <= departure) errors.push(`${index + 1}행: ETA는 출발일 이후여야 합니다.`);
    if (Number(shipment.progress) >= 100 && Number.isFinite(eta) && Date.now() < eta) errors.push(`${index + 1}행: 도착 전 입고 완료 상태입니다.`);
  });
  return { valid: errors.length === 0, errors };
}

export function appendAuditEntry(entries = [], action, details = {}) {
  return [...entries, { timestamp: new Date().toISOString(), action, details }].slice(-200);
}
