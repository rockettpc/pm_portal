-- ============================================================================
-- PHASE 3: PM Core Schedules, Work Orders, Checklists & Downtime Tracking
-- ============================================================================

-- 1. PM Schedules Table (PRD 3.3)
CREATE TABLE IF NOT EXISTS pm_schedules (
    id SERIAL PRIMARY KEY,
    schedule_code VARCHAR(50) UNIQUE NOT NULL,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'calendar' CHECK (trigger_type IN ('calendar', 'meter', 'both')),
    calendar_interval_days INTEGER,
    meter_interval_hours NUMERIC(10, 2),
    last_performed_date DATE,
    last_meter_reading NUMERIC(10, 2) DEFAULT 0.0,
    next_due_date DATE,
    next_due_meter NUMERIC(10, 2),
    estimated_duration_hours NUMERIC(5, 2) DEFAULT 1.0,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    checklist JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Work Orders Table (PRD 3.5)
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    wo_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'Preventive' CHECK (type IN ('Preventive', 'Corrective', 'Inspection', 'Request')),
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Closed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    pm_schedule_id INTEGER REFERENCES pm_schedules(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_hours NUMERIC(5, 2) DEFAULT 1.0,
    actual_hours NUMERIC(5, 2) DEFAULT 0.0,
    checklist JSONB DEFAULT '[]'::jsonb,
    root_cause TEXT,
    resolution_notes TEXT,
    downtime_minutes INTEGER DEFAULT 0,
    supervisor_signoff_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    supervisor_signoff_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Work Order Parts Consumption (PRD 3.5 & 3.6)
CREATE TABLE IF NOT EXISTS work_order_parts (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_pm_schedules_eq ON pm_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_next_due ON pm_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_eq ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_due ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_wo_parts_wo ON work_order_parts(work_order_id);

-- ============================================================================
-- SEED DATA: PM Schedules & Work Orders for Anaheim Glass Plant
-- ============================================================================

-- PM Schedules
INSERT INTO pm_schedules (
    schedule_code, equipment_id, title, description, trigger_type, 
    calendar_interval_days, meter_interval_hours, last_performed_date, 
    last_meter_reading, next_due_date, next_due_meter, estimated_duration_hours, 
    priority, assigned_to, checklist
)
SELECT 
    'PM-CUT-WK', e.id, 
    'Weekly Cutting Head Inspection & Lubrication',
    'Verify scoring carbide wheel integrity, lubricate linear guide bearings, test air pressure regulator and purge condensation trap.',
    'calendar', 7, NULL,
    CURRENT_DATE - INTERVAL '6 days', 3380.0,
    CURRENT_DATE + INTERVAL '1 day', NULL,
    1.0, 'High', u.id,
    '[
        {"id": "t1", "task": "Inspect carbide cutting wheel for micro-chipping and wear", "completed": false},
        {"id": "t2", "task": "Check cutting oil pneumatic delivery pressure (1.8 - 2.2 bar)", "completed": false},
        {"id": "t3", "task": "Wipe down linear guide rails and apply synthetic ISO 68 lubricant", "completed": false},
        {"id": "t4", "task": "Inspect silicone vacuum chuck suction cups for glass debris and tears", "completed": false}
    ]'::jsonb
FROM equipment e, users u
WHERE e.asset_id = 'EQ-CUT-01' AND u.username = 'technician'
ON CONFLICT (schedule_code) DO NOTHING;

INSERT INTO pm_schedules (
    schedule_code, equipment_id, title, description, trigger_type, 
    calendar_interval_days, meter_interval_hours, last_performed_date, 
    last_meter_reading, next_due_date, next_due_meter, estimated_duration_hours, 
    priority, assigned_to, checklist
)
SELECT 
    'PM-FURN-BIWK', e.id, 
    'Bi-Weekly Furnace Ceramic Roller Alignment & Thermocouple Cal',
    'Check fused silica roller alignment, clean surface buildup with SO2 conditioning, calibrate Type K heating thermocouples.',
    'both', 14, 500.0,
    CURRENT_DATE - INTERVAL '15 days', 8700.0,
    CURRENT_DATE - INTERVAL '1 day', 9200.0,
    2.5, 'Critical', u.id,
    '[
        {"id": "t1", "task": "Laser verify axial alignment across all 48 ceramic roller shafts", "completed": false},
        {"id": "t2", "task": "Inspect ceramic roller surface for sulfur / glass pickup residue", "completed": false},
        {"id": "t3", "task": "Calibrate Type K thermocouples in heating chambers 1-4 (+/- 2 deg C)", "completed": false},
        {"id": "t4", "task": "Inspect quench blower main drive belts and tensioner idler pulley", "completed": false}
    ]'::jsonb
FROM equipment e, users u
WHERE e.asset_id = 'EQ-FURN-01' AND u.username = 'technician'
ON CONFLICT (schedule_code) DO NOTHING;

INSERT INTO pm_schedules (
    schedule_code, equipment_id, title, description, trigger_type, 
    calendar_interval_days, meter_interval_hours, last_performed_date, 
    last_meter_reading, next_due_date, next_due_meter, estimated_duration_hours, 
    priority, assigned_to, checklist
)
SELECT 
    'PM-EDGE-MTH', e.id, 
    'Monthly Diamond Wheel Spindle Coolant Flush & Bearing Grease',
    'Flush 10-spindle coolant recirculation tank, clean sedimentation filter, grease diamond wheel spindle bearings.',
    'calendar', 30, NULL,
    CURRENT_DATE - INTERVAL '20 days', 4000.0,
    CURRENT_DATE + INTERVAL '10 days', NULL,
    1.5, 'Medium', u.id,
    '[
        {"id": "t1", "task": "Drain and flush coolant sedimentation catch tank", "completed": false},
        {"id": "t2", "task": "Grease 10 spindle high-speed bearings with synthetic waterproof grease", "completed": false},
        {"id": "t3", "task": "Measure Pos 1 diamond roughing wheel profile wear rate", "completed": false},
        {"id": "t4", "task": "Inspect glass conveyor drive timing belt and vacuum pads", "completed": false}
    ]'::jsonb
FROM equipment e, users u
WHERE e.asset_id = 'EQ-EDGE-01' AND u.username = 'technician'
ON CONFLICT (schedule_code) DO NOTHING;

-- Seed Work Orders (One Preventive In-Progress, One Corrective Completed with Downtime & Parts)
INSERT INTO work_orders (
    wo_number, title, description, type, status, priority, 
    equipment_id, pm_schedule_id, assigned_to, created_by, 
    due_date, started_at, estimated_hours, actual_hours, checklist
)
SELECT 
    'WO-2026-0001', 
    'Weekly Cutting Head Inspection & Lubrication',
    'Routine weekly preventive maintenance generated from schedule PM-CUT-WK.',
    'Preventive', 'In Progress', 'High',
    e.id, s.id, u_tech.id, u_mgr.id,
    CURRENT_DATE + INTERVAL '1 day', NOW() - INTERVAL '45 minutes', 1.0, 0.75,
    '[
        {"id": "t1", "task": "Inspect carbide cutting wheel for micro-chipping and wear", "completed": true, "notes": "Wheel looks good, minor wear on 135 deg edge"},
        {"id": "t2", "task": "Check cutting oil pneumatic delivery pressure (1.8 - 2.2 bar)", "completed": true, "notes": "Adjusted regulator from 1.6 to 2.0 bar"},
        {"id": "t3", "task": "Wipe down linear guide rails and apply synthetic ISO 68 lubricant", "completed": false},
        {"id": "t4", "task": "Inspect silicone vacuum chuck suction cups for glass debris and tears", "completed": false}
    ]'::jsonb
FROM equipment e, pm_schedules s, users u_tech, users u_mgr
WHERE e.asset_id = 'EQ-CUT-01' 
  AND s.schedule_code = 'PM-CUT-WK' 
  AND u_tech.username = 'technician' 
  AND u_mgr.username = 'manager'
ON CONFLICT (wo_number) DO NOTHING;

INSERT INTO work_orders (
    wo_number, title, description, type, status, priority, 
    equipment_id, assigned_to, created_by, 
    due_date, started_at, completed_at, estimated_hours, actual_hours, 
    root_cause, resolution_notes, downtime_minutes, supervisor_signoff_by, supervisor_signoff_at
)
SELECT 
    'WO-2026-0002', 
    'Spindle 4 Coolant Delivery Spray Clogged - Edge Chipping',
    'Emergency repair: Station 3 Edger spindle 4 coolant spray nozzle clogged with glass fines, causing thermal micro-cracking on 1/2" polished glass edge.',
    'Corrective', 'Completed', 'Critical',
    e.id, u_tech.id, u_mgr.id,
    CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours 45 minutes', 1.5, 1.25,
    'Glass particulate sedimentation clogged internal 3mm coolant nozzle',
    'Disassembled spindle manifold, cleared glass sludge, replaced damaged vacuum cup, back-flushed coolant line, and test ran two 36x84" lites.',
    75, u_mgr.id, NOW() - INTERVAL '3 hours'
FROM equipment e, users u_tech, users u_mgr
WHERE e.asset_id = 'EQ-EDGE-01' 
  AND u_tech.username = 'technician' 
  AND u_mgr.username = 'manager'
ON CONFLICT (wo_number) DO NOTHING;

-- Seed Work Order Parts Consumed on WO-2026-0002
INSERT INTO work_order_parts (work_order_id, part_id, quantity, unit_cost)
SELECT wo.id, p.id, 1, p.unit_cost
FROM work_orders wo, parts p
WHERE wo.wo_number = 'WO-2026-0002' AND p.part_number = 'BAV-CUP-VAC'
ON CONFLICT DO NOTHING;
