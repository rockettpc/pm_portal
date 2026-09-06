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
