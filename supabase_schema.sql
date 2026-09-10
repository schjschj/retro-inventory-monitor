-- ========================================================
-- Tactical Supply Chain Monitor - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (1-Click Run)
-- ========================================================

-- 1. Incheon Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory_incheon (
    id TEXT PRIMARY KEY DEFAULT 'current',
    waiting_inspection JSONB NOT NULL DEFAULT '[]'::jsonb,
    passed_inspection JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Kokomo Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory_kokomo (
    id TEXT PRIMARY KEY DEFAULT 'current',
    multi_assy BIGINT NOT NULL DEFAULT 16800,
    cap_assy BIGINT NOT NULL DEFAULT 12400,
    back_ship BIGINT NOT NULL DEFAULT 5400,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SPE Customer Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory_spe (
    id TEXT PRIMARY KEY DEFAULT 'current',
    total_inventory BIGINT NOT NULL DEFAULT 24800,
    daily_consumption BIGINT NOT NULL DEFAULT 1400,
    cluster_name TEXT DEFAULT '미국 고객사 생산라인',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id TEXT PRIMARY KEY,
    batch_no TEXT NOT NULL,
    type TEXT NOT NULL, -- 'SEA' | 'AIR'
    container_no TEXT DEFAULT '',
    vessel_name TEXT DEFAULT '',
    departure_date TEXT NOT NULL,
    eta TEXT NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'TRANSIT_OCEAN',
    progress BIGINT DEFAULT 0,
    is_delayed BOOLEAN DEFAULT false,
    delay_reason TEXT DEFAULT '',
    origin TEXT DEFAULT '인천신항 (KR)',
    port_of_entry TEXT DEFAULT 'LA 롱비치 항만 (US)',
    destination TEXT DEFAULT '코코모 미주법인 (US)',
    overland_mode TEXT DEFAULT 'RAIL',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- Realtime Replication Setup (Broadcast changes to all users)
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_incheon;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_kokomo;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_spe;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;

-- ========================================================
-- Row Level Security (Allow Public Read & Write for Simple PIN Auth)
-- ========================================================
ALTER TABLE public.inventory_incheon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_kokomo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_spe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read incheon" ON public.inventory_incheon FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update incheon" ON public.inventory_incheon FOR ALL USING (true);

CREATE POLICY "Allow public read kokomo" ON public.inventory_kokomo FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update kokomo" ON public.inventory_kokomo FOR ALL USING (true);

CREATE POLICY "Allow public read spe" ON public.inventory_spe FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update spe" ON public.inventory_spe FOR ALL USING (true);

CREATE POLICY "Allow public read shipments" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update shipments" ON public.shipments FOR ALL USING (true);

-- ========================================================
-- Initial Seed Data
-- ========================================================
INSERT INTO public.inventory_incheon (id, waiting_inspection, passed_inspection)
VALUES (
    'current',
    '[
        {"id": "LOT-KR-2409-A01", "name": "Power Module Core", "quantity": 2400, "date": "2026-09-08", "status": "검사대기", "note": "외관 및 X-Ray 대기"},
        {"id": "LOT-KR-2409-A02", "name": "Cap Sub-Assembly", "quantity": 1800, "date": "2026-09-09", "status": "검사대기", "note": "신뢰성 시료 검사"},
        {"id": "LOT-KR-2409-A03", "name": "Multi Base Frame", "quantity": 3200, "date": "2026-09-09", "status": "검사대기", "note": "입고 수입검사"}
    ]'::jsonb,
    '[
        {"id": "LOT-KR-2408-P88", "name": "Cap Assy Standard", "quantity": 4500, "date": "2026-09-07", "status": "출하합격", "readyForExport": true},
        {"id": "LOT-KR-2408-P89", "name": "Multi Assy High-V", "quantity": 5100, "date": "2026-09-07", "status": "출하합격", "readyForExport": true},
        {"id": "LOT-KR-2408-P90", "name": "Back Ship Module", "quantity": 1200, "date": "2026-09-08", "status": "출하합격", "readyForExport": true}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_kokomo (id, multi_assy, cap_assy, back_ship)
VALUES ('current', 16800, 12400, 5400)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_spe (id, total_inventory, daily_consumption, cluster_name)
VALUES ('current', 24800, 1400, '미국 고객사 생산라인')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shipments (id, batch_no, type, container_no, vessel_name, departure_date, eta, quantity, items, status, progress, is_delayed, delay_reason, origin, port_of_entry, destination, overland_mode)
VALUES
    ('SHIP-SEA-2601', '해상 26-01차', 'SEA', 'TGHU-892104-2', 'HMM PACIFIC GLORY', '2026-09-01', '2026-09-18', 12500, '[{"name": "Multi Assy", "qty": 7000}, {"name": "Cap Assy", "qty": 4500}, {"name": "Back ship", "qty": 1000}]'::jsonb, 'TRANSIT_OCEAN', 47, false, '', '인천신항 (KR)', 'LA 롱비치 항만 (US)', '코코모 미주법인 (US)', 'RAIL'),
    ('SHIP-AIR-2602', '항공 26-02차 긴급', 'AIR', 'AKE-94021-KE', 'KOREAN AIR CARGO 0244', '2026-09-08', '2026-09-10', 3200, '[{"name": "Cap Assy (긴급공정분)", "qty": 2800}, {"name": "Multi Assy 시제품", "qty": 400}]'::jsonb, 'TRANSIT_AIR', 72, false, '', '인천국제공항 (KR)', '시카고 오헤어 공항 (ORD)', '코코모 미주법인 (US)', 'TRUCK'),
    ('SHIP-SEA-2598', '해상 25-98차', 'SEA', 'MSKU-401923-9', 'MAERSK MC-KINNEY', '2026-08-20', '2026-09-06', 8200, '[{"name": "Multi Assy", "qty": 4200}, {"name": "Cap Assy", "qty": 4000}]'::jsonb, 'TRANSIT_RAIL', 93, true, '롱비치 세관 통관 대기 및 철도 환적 지연', '인천신항 (KR)', 'LA 롱비치 항만 (US)', '코코모 미주법인 (US)', 'RAIL')
ON CONFLICT (id) DO NOTHING;
