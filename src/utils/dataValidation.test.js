import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNonNegative, validateShipments, appendAuditEntry } from './dataValidation.js';

test('negative inventory is rejected', () => {
  assert.equal(validateNonNegative(-1, '재고').valid, false);
  assert.equal(validateNonNegative(0, '재고').valid, true);
});

test('duplicate shipment and invalid date order are rejected', () => {
  const result = validateShipments([
    { id: 'A', quantity: 10, departureDate: '2026-09-10', eta: '2026-09-09', progress: 0 },
    { id: 'A', quantity: 10, departureDate: '2026-09-10', eta: '2026-09-11', progress: 0 }
  ]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('중복')));
  assert.ok(result.errors.some((error) => error.includes('ETA')));
});

test('audit trail is bounded', () => {
  const entries = Array.from({ length: 200 }, (_, index) => ({ index }));
  assert.equal(appendAuditEntry(entries, 'SAVE').length, 200);
});
