-- ============================================================================
-- PREVENTIVE MAINTENANCE PORTAL (CGI Glass Solutions Suite)
-- Core Relational Database Schema & Phase 1 Seed Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'operator', 'viewer')),
    language_preference VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    building VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    specific_location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(100),
    contact_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_preferred BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    model_number VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Down', 'Retired', 'In Storage')),
    criticality VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')),
    runtime_hours NUMERIC(10, 2) DEFAULT 0.0,
    install_date DATE,
    warranty_expiry_date DATE,
    parent_equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-Many Operator Scoping (PRD 2.1)
CREATE TABLE IF NOT EXISTS operator_equipment (
    operator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (operator_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL DEFAULT 'manual' CHECK (doc_type IN ('manual', 'schematic', 'sds', 'warranty', 'procedure')),
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) DEFAULT '1.0',
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_status_history (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_equipment_asset_id ON equipment(asset_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_operator_equipment_op ON operator_equipment(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_equipment_eq ON operator_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_eq ON documents(equipment_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================================
-- SEED DATA (Phase 1 Baseline)
-- ============================================================================

-- 1. Users (Passwords: admin123, manager123, tech123, operator123, viewer123)
INSERT INTO users (username, email, password_hash, full_name, role, language_preference) VALUES
('admin', 'admin@cgi.internal', '$2a$10$BPSNsMSDZrrvSfrCMwq0SOd0puoiqfwoCPg4nwn2kBqxcHoKZIcyW', 'System Administrator', 'admin', 'en'),
('manager', 'manager@cgi.internal', '$2a$10$6K9qke7AR7Qg8gWLUjLQbODhRYeKY/4rSC2nD7l6KUxMEhTmyBqmq', 'Carlos Vega (Maintenance Manager)', 'manager', 'es'),
('technician', 'tech@cgi.internal', '$2a$10$px99dSWeRTLLG1RjBBwoxO/Qb7y2KMR.lb1Agr43NrgtMIzTWghVS', 'Mike Sullivan (Senior Tech)', 'technician', 'en'),
('operator1', 'operator1@cgi.internal', '$2a$10$UsfSny5TjrqrW7ZE2ZBgxeHYJJU/ThbEzzB8rABTX8avMyE8ccEba', 'Alejandro Morales (Table Operator)', 'operator', 'es'),
('viewer', 'viewer@cgi.internal', '$2a$10$8SB9kzydI8apAYuxf8.E5OR3cRkDClA/.KW8bYeTRkKFSk.z9hC5y', 'Diana Prince (Production Lead)', 'viewer', 'en')
ON CONFLICT (username) DO NOTHING;

-- 2. Locations
INSERT INTO locations (building, area, specific_location) VALUES
('Anaheim Plant Main', 'Cutting Area', 'Bay 1 North'),
('Anaheim Plant Main', 'Tempering Furnace', 'Line 1 Center'),
('Anaheim Plant Main', 'Lamination Line', 'Cleanroom B'),
('Anaheim Plant Main', 'Fabrication & Edging', 'Station 3 East')
ON CONFLICT DO NOTHING;

-- 3. Vendors
INSERT INTO vendors (name, vendor_type, contact_name, phone, email, is_preferred, notes) VALUES
('Bystronic Glass', 'Equipment Manufacturer', 'Hans Gruber', '714-555-0199', 'service@bystronic.com', TRUE, 'Primary cutting table OEM warranty partner'),
('Glaston Corporation', 'Equipment Manufacturer', 'Esko Niemi', '800-555-0144', 'support@glaston.net', TRUE, 'Tempering furnace servicing & ceramic roller supplies'),
('Intermac (Biesse)', 'Parts Supplier', 'Marco Rossi', '704-555-0122', 'parts@biesse.com', FALSE, 'CNC cutting parts and spare vacuum cups')
ON CONFLICT DO NOTHING;

-- 4. Equipment
INSERT INTO equipment (asset_id, name, description, category, location_id, vendor_id, model_number, serial_number, status, criticality, runtime_hours, install_date, warranty_expiry_date) VALUES
('EQ-CUT-01', 'Bystronic CNC Float Cutting Table', 'Automated glass sheet loader, scoring head, and breakout table', 'Cutting', 1, 1, 'SpeedCut 3726', 'BY-2021-99812', 'Active', 'Critical', 3420.5, '2021-06-15', '2026-12-31'),
('EQ-FURN-01', 'Glaston Continuous Tempering Furnace', 'Flat glass convective heating quench furnace with ceramic rollers', 'Tempering', 2, 2, 'FC500-2448', 'GL-2019-44102', 'Active', 'Critical', 8950.0, '2019-03-10', '2025-03-10'),
('EQ-LAM-01', 'Schraml Lamination Autoclave', 'Pressurized curing chamber for laminated architectural panels', 'Lamination', 3, 2, 'LAM-PRO-800', 'SC-2022-11094', 'Active', 'High', 1840.2, '2022-09-01', '2027-09-01'),
('EQ-EDGE-01', 'Bavelloni Straight Line Edger', '10-spindle diamond wheel double edger and polishing line', 'Edging', 4, 3, 'GEMY 10', 'BAV-2020-77319', 'Active', 'Medium', 4120.0, '2020-11-20', '2024-11-20')
ON CONFLICT (asset_id) DO NOTHING;

-- 5. Operator Scoping (Operator1 is assigned ONLY to EQ-CUT-01 and EQ-EDGE-01)
INSERT INTO operator_equipment (operator_id, equipment_id, assigned_by)
SELECT u.id, e.id, 1
FROM users u, equipment e
WHERE u.username = 'operator1' AND e.asset_id IN ('EQ-CUT-01', 'EQ-EDGE-01')
ON CONFLICT DO NOTHING;
-- ============================================================================
-- PHASE 2: Parts Catalog, Requisition Workflow & Image Storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    storage_bin VARCHAR(100),
    preferred_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipment Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS equipment_parts (
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    quantity_required INTEGER DEFAULT 1,
    PRIMARY KEY (equipment_id, part_id)
);

-- Parts Requests Queue (PRD 3.6.1)
CREATE TABLE IF NOT EXISTS parts_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    part_id INTEGER REFERENCES parts(id) ON DELETE SET NULL,
    part_description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    urgency VARCHAR(50) NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'Urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Ordered', 'Received', 'Fulfilled', 'Denied')),
    review_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compressed Photos on Parts Requests (PRD 3.6.2)
CREATE TABLE IF NOT EXISTS parts_request_photos (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES parts_requests(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/webp',
    width INTEGER,
    height INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In-App Notifications (PRD 3.7)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outgoing Webhooks (PRD 3.6.1)
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_parts_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_requests_eq ON parts_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_parts_requests_user ON parts_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_parts_requests_status ON parts_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================================================
-- SEED DATA: Glass Plant Spare Parts Catalog & BOM
-- ============================================================================

INSERT INTO parts (part_number, name, description, category, quantity_on_hand, min_stock_level, reorder_point, unit_cost, storage_bin, preferred_vendor_id) VALUES
('BY-WHEEL-135', 'Carbide Cutting Wheel 135°', 'Precision tungsten carbide scoring wheel for 3mm-6mm float glass', 'Cutting Consumable', 18, 5, 10, 42.50, 'Bin A-04', 1),
('BY-WHEEL-150', 'Carbide Cutting Wheel 150°', 'High-angle scoring wheel for heavy 10mm-19mm float glass', 'Cutting Consumable', 8, 4, 6, 48.00, 'Bin A-05', 1),
('GL-ROLL-CERAM', 'Fused Silica Ceramic Furnace Roller', 'High-temperature thermal shock resistant ceramic roller 2448mm', 'Tempering Ceramic', 3, 2, 3, 1450.00, 'Rack Bay C', 2),
('GL-TC-TYPEK', 'Type K Furnace Thermocouple Assembly', 'Upper furnace heating chamber temperature sensor probe', 'Electrical Sensors', 6, 2, 4, 185.00, 'Bin D-12', 2),
('BAV-CUP-VAC', 'Heavy Duty Silicone Vacuum Suction Cup', 'Anti-marking vacuum chuck cup for Bavelloni conveyor drive', 'Pneumatics', 12, 6, 8, 75.00, 'Bin B-08', 3),
('BAV-DIAM-WHEEL', 'Continuous Rim Diamond Edging Wheel', 'Pos 1 metal bond diamond roughing wheel for 1/2" glass', 'Diamond Tooling', 2, 1, 2, 680.00, 'Bin B-14', 3),
('GEN-AIR-REG', 'SMC 1/2" Pneumatic Pressure Regulator', 'Main air line regulator with modular filter & water trap', 'Pneumatics', 4, 2, 3, 95.00, 'Bin E-02', 3)
ON CONFLICT (part_number) DO NOTHING;

-- Link Parts to Equipment BOM
INSERT INTO equipment_parts (equipment_id, part_id, quantity_required)
SELECT e.id, p.id, 1
FROM equipment e, parts p
WHERE (e.asset_id = 'EQ-CUT-01' AND p.part_number IN ('BY-WHEEL-135', 'BY-WHEEL-150', 'GEN-AIR-REG'))
   OR (e.asset_id = 'EQ-FURN-01' AND p.part_number IN ('GL-ROLL-CERAM', 'GL-TC-TYPEK'))
   OR (e.asset_id = 'EQ-EDGE-01' AND p.part_number IN ('BAV-CUP-VAC', 'BAV-DIAM-WHEEL', 'GEN-AIR-REG'))
ON CONFLICT DO NOTHING;

-- Seed a sample parts request from operator1 (for assigned machine EQ-CUT-01)
INSERT INTO parts_requests (request_number, user_id, equipment_id, part_id, part_description, quantity, reason, urgency, status)
SELECT 'PR-2026-0001', u.id, e.id, p.id, p.name, 2, 'Cutting wheel edge is chipped, causing rough flare on 1/2" glass cuts', 'Urgent', 'Submitted'
FROM users u, equipment e, parts p
WHERE u.username = 'operator1' AND e.asset_id = 'EQ-CUT-01' AND p.part_number = 'BY-WHEEL-135'
ON CONFLICT (request_number) DO NOTHING;

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

-- SEED DATA
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

INSERT INTO work_order_parts (work_order_id, part_id, quantity, unit_cost)
SELECT wo.id, p.id, 1, p.unit_cost
FROM work_orders wo, parts p
WHERE wo.wo_number = 'WO-2026-0002' AND p.part_number = 'BAV-CUP-VAC'
ON CONFLICT DO NOTHING;

