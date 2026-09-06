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
