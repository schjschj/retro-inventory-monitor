// Utility for managing authentication PINs and passwords

const STORAGE_KEY = 'tactical_auth_pins';

const DEFAULT_PINS = {
  master: '31796',
  incheon: '1001',
  usa: '2002'
};

export function getAuthPins() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        master: String(parsed.master || DEFAULT_PINS.master).trim(),
        incheon: String(parsed.incheon || DEFAULT_PINS.incheon).trim(),
        usa: String(parsed.usa || DEFAULT_PINS.usa).trim()
      };
    }
  } catch (e) {
    console.warn('Failed to load auth pins from localStorage:', e);
  }
  return { ...DEFAULT_PINS };
}

export function saveAuthPins(pins) {
  try {
    const current = getAuthPins();
    const updated = {
      master: pins.master ? String(pins.master).trim() : current.master,
      incheon: pins.incheon ? String(pins.incheon).trim() : current.incheon,
      usa: pins.usa ? String(pins.usa).trim() : current.usa
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true, pins: updated };
  } catch (e) {
    console.error('Failed to save auth pins:', e);
    return { success: false, error: e };
  }
}

export function verifyPin(inputPin) {
  if (!inputPin) return null;
  const clean = String(inputPin).trim();
  const pins = getAuthPins();

  if (clean === pins.master) {
    return 'MASTER_ADMIN';
  }
  if (clean === pins.incheon) {
    return 'INCHEON_LEAD';
  }
  if (clean === pins.usa) {
    return 'USA_LEAD';
  }
  return null;
}
