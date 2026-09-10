import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { 
  INITIAL_INCHEON_INVENTORY, 
  INITIAL_KOKOMO_INVENTORY, 
  INITIAL_SPE_INVENTORY, 
  INITIAL_SHIPMENTS 
} from '../mock/initialData';

// Fetch all initial data from Supabase (or fallback to LocalStorage/mock)
export async function fetchAllInventoryData() {
  const savedIncheon = localStorage.getItem('tactical_incheon_inventory');
  const savedKokomo = localStorage.getItem('tactical_kokomo_inventory');
  const savedSpe = localStorage.getItem('tactical_spe_inventory');
  const savedShipments = localStorage.getItem('tactical_shipments');

  const parsedIncheon = savedIncheon !== null ? JSON.parse(savedIncheon) : INITIAL_INCHEON_INVENTORY;
  const parsedKokomo = savedKokomo !== null ? JSON.parse(savedKokomo) : INITIAL_KOKOMO_INVENTORY;
  const parsedSpe = savedSpe !== null ? JSON.parse(savedSpe) : INITIAL_SPE_INVENTORY;
  const parsedShipments = savedShipments !== null ? JSON.parse(savedShipments) : INITIAL_SHIPMENTS;

  if (!isSupabaseConfigured() || !supabase) {
    return {
      incheon: parsedIncheon,
      kokomo: parsedKokomo,
      spe: parsedSpe,
      shipments: parsedShipments
    };
  }

  try {
    const [incheonRes, kokomoRes, speRes, shipmentsRes] = await Promise.all([
      supabase.from('inventory_incheon').select('*').eq('id', 'current').maybeSingle(),
      supabase.from('inventory_kokomo').select('*').eq('id', 'current').maybeSingle(),
      supabase.from('inventory_spe').select('*').eq('id', 'current').maybeSingle(),
      supabase.from('shipments').select('*').order('created_at', { ascending: true })
    ]);

    const incheonData = incheonRes.data ? {
      waitingInspection: incheonRes.data.waiting_inspection || [],
      passedInspection: incheonRes.data.passed_inspection || []
    } : parsedIncheon;

    const kokomoData = kokomoRes.data ? {
      multiAssy: Number(kokomoRes.data.multi_assy) || 0,
      capAssy: Number(kokomoRes.data.cap_assy) || 0,
      backShip: Number(kokomoRes.data.back_ship) || 0
    } : parsedKokomo;

    const speData = speRes.data ? {
      totalInventory: Number(speRes.data.total_inventory) || 0,
      dailyConsumption: Number(speRes.data.daily_consumption) || 1400,
      clusterName: speRes.data.cluster_name || '미국 고객사 생산라인'
    } : parsedSpe;

    let shipmentsData;
    if (shipmentsRes.data && shipmentsRes.data.length > 0) {
      shipmentsData = shipmentsRes.data.map(row => ({
        id: row.id,
        batchNo: row.batch_no,
        type: row.type,
        containerNo: row.container_no,
        vesselName: row.vessel_name,
        departureDate: row.departure_date,
        eta: row.eta,
        quantity: Number(row.quantity) || 0,
        items: row.items || [],
        status: row.status,
        progress: Number(row.progress) || 0,
        isDelayed: Boolean(row.is_delayed),
        delayReason: row.delay_reason,
        origin: row.origin,
        portOfEntry: row.port_of_entry,
        destination: row.destination,
        inlandMode: row.overland_mode === 'TRUCK' ? 'TRUCK' : 'RAIL',
        shippingMethod: row.overland_mode === 'TRUCK' ? '싱글' : '철송',
        overlandMode: row.overland_mode || 'RAIL'
      }));
    } else if (shipmentsRes.data && shipmentsRes.data.length === 0) {
      // Table is empty in Supabase (all shipments were deleted)
      shipmentsData = [];
    } else {
      shipmentsData = parsedShipments;
    }

    // Cache latest fetched data to LocalStorage for fast offline startup
    try {
      localStorage.setItem('tactical_incheon_inventory', JSON.stringify(incheonData));
      localStorage.setItem('tactical_kokomo_inventory', JSON.stringify(kokomoData));
      localStorage.setItem('tactical_spe_inventory', JSON.stringify(speData));
      localStorage.setItem('tactical_shipments', JSON.stringify(shipmentsData));
    } catch (e) {}

    return {
      incheon: incheonData,
      kokomo: kokomoData,
      spe: speData,
      shipments: shipmentsData
    };
  } catch (error) {
    console.warn('Failed to fetch from Supabase, falling back to local storage cache:', error);
    return {
      incheon: parsedIncheon,
      kokomo: parsedKokomo,
      spe: parsedSpe,
      shipments: parsedShipments
    };
  }
}

// Update Incheon Inventory
export async function syncIncheonInventory(data) {
  try {
    localStorage.setItem('tactical_incheon_inventory', JSON.stringify(data));
  } catch (e) {}

  if (!isSupabaseConfigured() || !supabase) return { success: true };

  try {
    await supabase.from('inventory_incheon').upsert({
      id: 'current',
      waiting_inspection: data.waitingInspection || [],
      passed_inspection: data.passedInspection || [],
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (err) {
    console.error('Supabase Incheon sync error:', err);
    return { success: false, error: err };
  }
}

// Update Kokomo Inventory
export async function syncKokomoInventory(data) {
  try {
    localStorage.setItem('tactical_kokomo_inventory', JSON.stringify(data));
  } catch (e) {}

  if (!isSupabaseConfigured() || !supabase) return { success: true };

  try {
    await supabase.from('inventory_kokomo').upsert({
      id: 'current',
      multi_assy: Number(data.multiAssy) || 0,
      cap_assy: Number(data.capAssy) || 0,
      back_ship: Number(data.backShip) || 0,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (err) {
    console.error('Supabase Kokomo sync error:', err);
    return { success: false, error: err };
  }
}

// Update SPE Inventory
export async function syncSpeInventory(data) {
  try {
    localStorage.setItem('tactical_spe_inventory', JSON.stringify(data));
  } catch (e) {}

  if (!isSupabaseConfigured() || !supabase) return { success: true };

  try {
    await supabase.from('inventory_spe').upsert({
      id: 'current',
      total_inventory: Number(data.totalInventory) || 0,
      daily_consumption: Number(data.dailyConsumption) || 1400,
      cluster_name: data.clusterName || '미국 고객사 생산라인',
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (err) {
    console.error('Supabase SPE sync error:', err);
    return { success: false, error: err };
  }
}

// Update Shipments (replace, upsert, or clear)
export async function syncShipments(shipments) {
  try {
    localStorage.setItem('tactical_shipments', JSON.stringify(shipments || []));
  } catch (e) {}

  if (!isSupabaseConfigured() || !supabase) return { success: true };

  try {
    // If shipments is empty, clear all records from Supabase shipments table
    if (!shipments || shipments.length === 0) {
      const { error: delAllErr } = await supabase.from('shipments').delete().neq('id', '___NON_EXISTENT_DUMMY___');
      if (delAllErr) console.error('Supabase clear all shipments error:', delAllErr);
      return { success: !delAllErr };
    }

    const rows = shipments.map((s, idx) => ({
      id: String(s.id || `SHIP-${s.batchNo || idx}-${idx}`),
      batch_no: String(s.batchNo || `차수 #${idx + 1}`),
      type: String(s.type || 'SEA').toUpperCase().includes('AIR') ? 'AIR' : 'SEA',
      container_no: String(s.containerNo || ''),
      vessel_name: String(s.vesselName || ''),
      departure_date: String(s.departureDate || '2026-09-02'),
      eta: String(s.eta || '2026-09-20'),
      quantity: Math.round(Number(s.quantity) || 0),
      items: Array.isArray(s.items) ? s.items : [],
      status: s.status || (Number(s.progress) >= 100 ? 'ARRIVED' : 'TRANSIT_OCEAN'),
      progress: Math.round(Number(s.progress) || 0), // Integer for BIGINT
      is_delayed: Boolean(s.isDelayed),
      delay_reason: String(s.delayReason || ''),
      origin: String(s.origin || (s.type === 'AIR' ? '인천국제공항 (KR)' : '인천신항 (KR)')),
      port_of_entry: String(s.portOfEntry || (s.type === 'AIR' ? '시카고 오헤어 (ORD)' : 'LA 롱비치 항만 (US)')),
      destination: String(s.destination || '코코모 미주법인 (US)'),
      overland_mode: (s.inlandMode === 'TRUCK' || s.overlandMode === 'TRUCK') ? 'TRUCK' : 'RAIL',
      updated_at: new Date().toISOString()
    }));

    // 1. Upsert current rows
    await supabase.from('shipments').upsert(rows);

    // 2. Delete any shipments from Supabase that are no longer in the shipments list
    const currentIds = rows.map(r => r.id);
    const { data: existingRows } = await supabase.from('shipments').select('id');
    if (existingRows && existingRows.length > 0) {
      const idsToDelete = existingRows.map(r => r.id).filter(id => !currentIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase.from('shipments').delete().in('id', idsToDelete);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Supabase Shipments sync error:', err);
    return { success: false, error: err };
  }
}

// Realtime WebSocket Subscription (Broadcast to all clients without reload!)
export function subscribeToRealtimeUpdates({
  onIncheonChange,
  onKokomoChange,
  onSpeChange,
  onShipmentsChange
}) {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const channel = supabase.channel('supply_chain_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_incheon' }, (payload) => {
      if (payload.new && onIncheonChange) {
        onIncheonChange({
          waitingInspection: payload.new.waiting_inspection || [],
          passedInspection: payload.new.passed_inspection || []
        });
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_kokomo' }, (payload) => {
      if (payload.new && onKokomoChange) {
        onKokomoChange({
          multiAssy: Number(payload.new.multi_assy) || 0,
          capAssy: Number(payload.new.cap_assy) || 0,
          backShip: Number(payload.new.back_ship) || 0
        });
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_spe' }, (payload) => {
      if (payload.new && onSpeChange) {
        onSpeChange({
          totalInventory: Number(payload.new.total_inventory) || 0,
          dailyConsumption: Number(payload.new.daily_consumption) || 1400,
          clusterName: payload.new.cluster_name || '미국 고객사 생산라인'
        });
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, async () => {
      if (onShipmentsChange) {
        const { data } = await supabase.from('shipments').select('*').order('created_at', { ascending: true });
        if (data) {
          onShipmentsChange(data.map(row => ({
            id: row.id,
            batchNo: row.batch_no,
            type: row.type,
            containerNo: row.container_no,
            vesselName: row.vessel_name,
            departureDate: row.departure_date,
            eta: row.eta,
            quantity: Number(row.quantity) || 0,
            items: row.items || [],
            status: row.status,
            progress: Number(row.progress) || 0,
            isDelayed: Boolean(row.is_delayed),
            delayReason: row.delay_reason,
            origin: row.origin,
            portOfEntry: row.port_of_entry,
            destination: row.destination,
            overlandMode: row.overland_mode
          })));
        }
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
