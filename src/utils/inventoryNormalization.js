/**
 * Normalizes Kokomo and SPE inventory data structures so that ESS8-1 and ESS11-1
 * are strictly segregated and separately managed.
 * Legacy database values without byProduct are automatically assigned to ESS8-1.
 */

export function normalizeKokomoInventory(raw) {
  if (!raw) {
    return {
      location: '미주법인 (코코모, 인디애나)',
      byProduct: {
        'ESS8-1': { multiAssy: 350000, capAssy: 280000, backShip: 97900 },
        'ESS11-1': { multiAssy: 0, capAssy: 0, backShip: 0 }
      },
      multiAssy: 350000,
      capAssy: 280000,
      backShip: 97900,
      history: []
    };
  }

  // All legacy database values belong strictly to ESS8-1
  const ess8 = {
    multiAssy: Number(raw.byProduct?.['ESS8-1']?.multiAssy ?? raw.multiAssy) || 0,
    capAssy: Number(raw.byProduct?.['ESS8-1']?.capAssy ?? raw.capAssy) || 0,
    backShip: Number(raw.byProduct?.['ESS8-1']?.backShip ?? raw.backShip) || 0,
  };

  // ESS11-1 has its own separate inventory
  const ess11 = {
    multiAssy: Number(raw.byProduct?.['ESS11-1']?.multiAssy ?? 0) || 0,
    capAssy: Number(raw.byProduct?.['ESS11-1']?.capAssy ?? 0) || 0,
    backShip: Number(raw.byProduct?.['ESS11-1']?.backShip ?? 0) || 0,
  };

  return {
    ...raw,
    byProduct: {
      'ESS8-1': ess8,
      'ESS11-1': ess11
    },
    multiAssy: ess8.multiAssy + ess11.multiAssy,
    capAssy: ess8.capAssy + ess11.capAssy,
    backShip: ess8.backShip + ess11.backShip,
  };
}

export function normalizeSpeInventory(raw) {
  if (!raw) {
    return {
      customerName: '고객 SPE (Semiconductor Plant)',
      location: '미국 내 반도체/배터리 클러스터',
      byProduct: {
        'ESS8-1': { totalInventory: 24800, dailyConsumption: 20000 },
        'ESS11-1': { totalInventory: 0, dailyConsumption: 0 }
      },
      totalInventory: 24800,
      dailyConsumption: 20000,
      safetyStock: 15000
    };
  }

  // All legacy database values belong strictly to ESS8-1
  const ess8 = {
    totalInventory: Number(raw.byProduct?.['ESS8-1']?.totalInventory ?? raw.totalInventory) || 0,
    dailyConsumption: (!raw.byProduct?.['ESS8-1']?.dailyConsumption && Number(raw.dailyConsumption) === 1400)
      ? 20000
      : Number(raw.byProduct?.['ESS8-1']?.dailyConsumption ?? raw.dailyConsumption ?? 20000) || 20000,
  };

  // ESS11-1 has its own separate inventory
  const ess11 = {
    totalInventory: Number(raw.byProduct?.['ESS11-1']?.totalInventory ?? 0) || 0,
    dailyConsumption: Number(raw.byProduct?.['ESS11-1']?.dailyConsumption ?? 0) || 0,
  };

  return {
    ...raw,
    byProduct: {
      'ESS8-1': ess8,
      'ESS11-1': ess11
    },
    totalInventory: ess8.totalInventory + ess11.totalInventory,
    dailyConsumption: ess8.dailyConsumption + ess11.dailyConsumption,
  };
}
