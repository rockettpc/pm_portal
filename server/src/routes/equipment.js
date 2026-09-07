import express from 'express';
import fs from 'fs';
import { query } from '../db.js';
import { authenticateToken, requireRole, requireOperatorScope } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/equipment - Scoped for operators, plant-wide for technicians/managers/admins
router.get('/', async (req, res) => {
  try {
    let sql = `
      SELECT e.id, e.asset_id, e.name, e.description, e.category, 
             e.model_number, e.serial_number, e.status, e.criticality, 
             e.runtime_hours, e.install_date, e.warranty_expiry_date,
             l.building, l.area, l.specific_location,
             v.name as vendor_name
      FROM equipment e
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN vendors v ON e.vendor_id = v.id
    `;
    const params = [];

    // PRD 2.1: Scoped access for operators
    if (req.user.role === 'operator') {
      sql += ` INNER JOIN operator_equipment oe ON e.id = oe.equipment_id WHERE oe.operator_id = $1`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY e.id ASC`;

    const result = await query(sql, params);
    res.json({ equipment: result.rows });
  } catch (error) {
    console.error('[equipment route GET /] Error:', error);
    res.status(500).json({ error: 'Server error retrieving equipment' });
  }
});

// GET /api/equipment/:id - Single equipment detail with documents & status history
router.get('/:id', requireOperatorScope('id'), async (req, res) => {
  try {
    const eqId = parseInt(req.params.id, 10);
    const eqRes = await query(
      `SELECT e.*, l.building, l.area, l.specific_location, v.name as vendor_name, v.contact_name as vendor_contact
       FROM equipment e
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN vendors v ON e.vendor_id = v.id
       WHERE e.id = $1`,
      [eqId]
    );

    if (eqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Attached documents
    const docRes = await query(
      `SELECT id, title, doc_type, file_name, file_size, version, created_at 
       FROM documents WHERE equipment_id = $1 ORDER BY created_at DESC`,
      [eqId]
    );

    // Status history
    const histRes = await query(
      `SELECT h.*, u.full_name as changed_by_name 
       FROM equipment_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.equipment_id = $1 
       ORDER BY h.created_at DESC LIMIT 10`,
      [eqId]
    );

    res.json({
      equipment: eqRes.rows[0],
      documents: docRes.rows,
      status_history: histRes.rows,
    });
  } catch (error) {
    console.error('[equipment route GET /:id] Error:', error);
    res.status(500).json({ error: 'Server error retrieving equipment details' });
  }
});

// POST /api/equipment - Create asset (Admin / Manager only)
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      asset_id,
      name,
      description,
      category,
      location_id,
      vendor_id,
      model_number,
      serial_number,
      status,
      criticality,
      runtime_hours,
      install_date,
      warranty_expiry_date,
    } = req.body;

    if (!asset_id || !name || !category) {
      return res.status(400).json({ error: 'Asset ID, name, and category are required' });
    }

    // Duplicate detection on serial number
    if (serial_number) {
      const dupCheck = await query('SELECT id FROM equipment WHERE serial_number = $1', [serial_number.trim()]);
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `Equipment with serial number '${serial_number}' already exists` });
      }
    }

    const insertRes = await query(
      `INSERT INTO equipment 
       (asset_id, name, description, category, location_id, vendor_id, model_number, serial_number, 
        status, criticality, runtime_hours, install_date, warranty_expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        asset_id.trim().toUpperCase(),
        name.trim(),
        description || null,
        category.trim(),
        location_id ? parseInt(location_id, 10) : null,
        vendor_id ? parseInt(vendor_id, 10) : null,
        model_number || null,
        serial_number ? serial_number.trim() : null,
        status || 'Active',
        criticality || 'Medium',
        runtime_hours ? parseFloat(runtime_hours) : 0.0,
        install_date || null,
        warranty_expiry_date || null,
      ]
    );

    const newEquipment = insertRes.rows[0];

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'CREATE_EQUIPMENT', 'equipment', newEquipment.id, JSON.stringify({ asset_id: newEquipment.asset_id, name: newEquipment.name })]
    );

    res.status(201).json({ message: 'Equipment created successfully', equipment: newEquipment });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Asset ID or serial number already exists' });
    }
    console.error('[equipment route POST /] Error:', error);
    res.status(500).json({ error: 'Server error creating equipment' });
  }
});

// PUT /api/equipment/:id - Update equipment (Admin, Manager, Technician)
router.put('/:id', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const eqId = parseInt(req.params.id, 10);
    const {
      asset_id,
      name,
      description,
      category,
      location_id,
      vendor_id,
      model_number,
      serial_number,
      status,
      status_reason,
      criticality,
      runtime_hours,
      install_date,
      warranty_expiry_date,
    } = req.body;

    // Fetch current state
    const currentRes = await query('SELECT * FROM equipment WHERE id = $1', [eqId]);
    if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    const current = currentRes.rows[0];

    // Serial number uniqueness check
    if (serial_number && serial_number.trim() !== current.serial_number) {
      const dupCheck = await query('SELECT id FROM equipment WHERE serial_number = $1 AND id != $2', [serial_number.trim(), eqId]);
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `Equipment with serial number '${serial_number}' already exists` });
      }
    }

    // Asset ID uniqueness check
    if (asset_id && asset_id.trim().toUpperCase() !== current.asset_id) {
      const dupAsset = await query('SELECT id FROM equipment WHERE asset_id = $1 AND id != $2', [asset_id.trim().toUpperCase(), eqId]);
      if (dupAsset.rows.length > 0) {
        return res.status(400).json({ error: `Equipment with asset ID '${asset_id}' already exists` });
      }
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Non-admin/managers (technicians) can only update status, runtime_hours, description
    const isElevated = ['admin', 'manager'].includes(req.user.role);

    if (isElevated && asset_id !== undefined) {
      updates.push(`asset_id = $${paramIndex++}`);
      values.push(asset_id.trim().toUpperCase());
    }
    if (isElevated && name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (isElevated && category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category.trim());
    }
    if (isElevated && vendor_id !== undefined) {
      updates.push(`vendor_id = $${paramIndex++}`);
      values.push(vendor_id ? parseInt(vendor_id, 10) : null);
    }
    if (isElevated && model_number !== undefined) {
      updates.push(`model_number = $${paramIndex++}`);
      values.push(model_number ? model_number.trim() : null);
    }
    if (isElevated && serial_number !== undefined) {
      updates.push(`serial_number = $${paramIndex++}`);
      values.push(serial_number ? serial_number.trim() : null);
    }
    if (isElevated && install_date !== undefined) {
      updates.push(`install_date = $${paramIndex++}`);
      values.push(install_date || null);
    }
    if (isElevated && warranty_expiry_date !== undefined) {
      updates.push(`warranty_expiry_date = $${paramIndex++}`);
      values.push(warranty_expiry_date || null);
    }

    if (status && status !== current.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      // Record status transition in history
      await query(
        `INSERT INTO equipment_status_history (equipment_id, old_status, new_status, changed_by, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [eqId, current.status, status, req.user.id, status_reason || null]
      );
    }

    if (runtime_hours !== undefined) {
      updates.push(`runtime_hours = $${paramIndex++}`);
      values.push(parseFloat(runtime_hours));
    }

    if (criticality !== undefined) {
      updates.push(`criticality = $${paramIndex++}`);
      values.push(criticality);
    }

    if (location_id !== undefined) {
      updates.push(`location_id = $${paramIndex++}`);
      values.push(location_id ? parseInt(location_id, 10) : null);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(eqId);

    const updateRes = await query(
      `UPDATE equipment SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'UPDATE_EQUIPMENT', 'equipment', eqId, JSON.stringify({ asset_id: updateRes.rows[0].asset_id, name: updateRes.rows[0].name })]
    );

    res.json({ message: 'Equipment updated', equipment: updateRes.rows[0] });
  } catch (error) {
    console.error('[equipment route PUT /:id] Error:', error);
    res.status(500).json({ error: 'Server error updating equipment' });
  }
});

// DELETE /api/equipment/:id - Delete asset (Admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const eqId = parseInt(req.params.id, 10);

    const checkRes = await query('SELECT * FROM equipment WHERE id = $1', [eqId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const target = checkRes.rows[0];

    // Clean up document files from disk before cascade
    try {
      const docRes = await query('SELECT file_path FROM documents WHERE equipment_id = $1', [eqId]);
      for (const d of docRes.rows) {
        if (d.file_path && fs.existsSync(d.file_path)) {
          fs.unlinkSync(d.file_path);
        }
      }
    } catch (cleanErr) {
      console.warn('[equipment DELETE] Warning cleaning up disk files:', cleanErr.message);
    }

    await query('DELETE FROM equipment WHERE id = $1', [eqId]);

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'DELETE_EQUIPMENT', 'equipment', eqId, JSON.stringify({ asset_id: target.asset_id, name: target.name })]
    );

    res.json({ message: `Equipment '${target.asset_id}' deleted successfully` });
  } catch (error) {
    console.error('[equipment route DELETE /:id] Error:', error);
    res.status(500).json({ error: 'Server error deleting equipment' });
  }
});

export default router;
