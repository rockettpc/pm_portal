import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/parts - Parts catalog with stock levels and low-stock flags
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, v.name as preferred_vendor_name,
             (p.quantity_on_hand <= p.reorder_point) as is_low_stock
      FROM parts p
      LEFT JOIN vendors v ON p.preferred_vendor_id = v.id
      ORDER BY is_low_stock DESC, p.category ASC, p.name ASC
    `);

    res.json({ parts: result.rows });
  } catch (error) {
    console.error('[parts route GET /] Error:', error);
    res.status(500).json({ error: 'Server error retrieving parts catalog' });
  }
});

// POST /api/parts - Create part (Admin, Manager)
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      part_number,
      name,
      description,
      category,
      quantity_on_hand,
      min_stock_level,
      reorder_point,
      unit_cost,
      storage_bin,
      preferred_vendor_id,
    } = req.body;

    if (!part_number || !name || !category) {
      return res.status(400).json({ error: 'Part number, name, and category are required' });
    }

    const insertRes = await query(
      `INSERT INTO parts 
       (part_number, name, description, category, quantity_on_hand, min_stock_level, reorder_point, unit_cost, storage_bin, preferred_vendor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        part_number.trim().toUpperCase(),
        name.trim(),
        description || null,
        category.trim(),
        parseInt(quantity_on_hand || 0, 10),
        parseInt(min_stock_level || 0, 10),
        parseInt(reorder_point || 0, 10),
        parseFloat(unit_cost || 0.0),
        storage_bin ? storage_bin.trim() : null,
        preferred_vendor_id ? parseInt(preferred_vendor_id, 10) : null,
      ]
    );

    res.status(201).json({ message: 'Part created', part: insertRes.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Part number already exists' });
    }
    console.error('[parts route POST /] Error:', error);
    res.status(500).json({ error: 'Server error creating part' });
  }
});

// PUT /api/parts/:id - Update part details or stock (Admin, Manager, Technician)
router.put('/:id', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const {
      name,
      description,
      category,
      quantity_on_hand,
      min_stock_level,
      reorder_point,
      unit_cost,
      storage_bin,
      preferred_vendor_id,
    } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category.trim());
    }
    if (quantity_on_hand !== undefined) {
      updates.push(`quantity_on_hand = $${paramIndex++}`);
      values.push(parseInt(quantity_on_hand, 10));
    }
    if (min_stock_level !== undefined) {
      updates.push(`min_stock_level = $${paramIndex++}`);
      values.push(parseInt(min_stock_level, 10));
    }
    if (reorder_point !== undefined) {
      updates.push(`reorder_point = $${paramIndex++}`);
      values.push(parseInt(reorder_point, 10));
    }
    if (unit_cost !== undefined) {
      updates.push(`unit_cost = $${paramIndex++}`);
      values.push(parseFloat(unit_cost));
    }
    if (storage_bin !== undefined) {
      updates.push(`storage_bin = $${paramIndex++}`);
      values.push(storage_bin.trim());
    }
    if (preferred_vendor_id !== undefined) {
      updates.push(`preferred_vendor_id = $${paramIndex++}`);
      values.push(preferred_vendor_id ? parseInt(preferred_vendor_id, 10) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(partId);

    const updateRes = await query(
      `UPDATE parts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.json({ message: 'Part updated', part: updateRes.rows[0] });
  } catch (error) {
    console.error('[parts route PUT /:id] Error:', error);
    res.status(500).json({ error: 'Server error updating part' });
  }
});

// GET /api/parts/equipment/:id - Bill of Materials for a specific machine
router.get('/equipment/:id', async (req, res) => {
  try {
    const eqId = parseInt(req.params.id, 10);
    const result = await query(
      `SELECT p.*, ep.quantity_required 
       FROM parts p
       JOIN equipment_parts ep ON p.id = ep.part_id
       WHERE ep.equipment_id = $1
       ORDER BY p.name ASC`,
      [eqId]
    );

    res.json({ bom: result.rows });
  } catch (error) {
    console.error('[parts route GET BOM] Error:', error);
    res.status(500).json({ error: 'Server error fetching BOM' });
  }
});

export default router;
