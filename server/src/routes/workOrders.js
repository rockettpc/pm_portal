import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Helper: generate unique WO number
const generateWoNumber = async () => {
  const countRes = await query('SELECT COUNT(*) FROM work_orders');
  const count = parseInt(countRes.rows[0].count, 10) + 1;
  const year = new Date().getFullYear();
  return `WO-${year}-${String(count).padStart(4, '0')}`;
};

// GET /api/work-orders - List work orders (scoped for operators, plant-wide for others)
router.get('/', async (req, res) => {
  try {
    let sql = `
      SELECT wo.*, 
             e.asset_id, e.name as equipment_name, e.category as equipment_category, 
             e.status as equipment_status,
             l.building, l.area,
             u_tech.full_name as assigned_to_name,
             u_creator.full_name as created_by_name,
             COUNT(wop.id) as parts_used_count,
             COALESCE(SUM(wop.quantity * wop.unit_cost), 0) as parts_cost_total
      FROM work_orders wo
      JOIN equipment e ON wo.equipment_id = e.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u_tech ON wo.assigned_to = u_tech.id
      LEFT JOIN users u_creator ON wo.created_by = u_creator.id
      LEFT JOIN work_order_parts wop ON wo.id = wop.work_order_id
    `;
    const params = [];

    if (req.user.role === 'operator') {
      sql += ` INNER JOIN operator_equipment oe ON e.id = oe.equipment_id WHERE oe.operator_id = $1`;
      params.push(req.user.id);
    }

    sql += ` GROUP BY wo.id, e.id, l.id, u_tech.id, u_creator.id ORDER BY wo.created_at DESC`;

    const result = await query(sql, params);
    res.json({ work_orders: result.rows });
  } catch (error) {
    console.error('[work-orders GET /] Error:', error);
    res.status(500).json({ error: 'Server error retrieving work orders' });
  }
});

// GET /api/work-orders/:id - Single work order detail with parts consumed & history
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const woRes = await query(
      `SELECT wo.*, 
              e.asset_id, e.name as equipment_name, e.category as equipment_category, 
              e.status as equipment_status, e.runtime_hours as equipment_runtime,
              l.building, l.area, l.specific_location,
              u_tech.full_name as assigned_to_name,
              u_creator.full_name as created_by_name,
              u_signoff.full_name as supervisor_signoff_name,
              pms.schedule_code as pm_schedule_code
       FROM work_orders wo
       JOIN equipment e ON wo.equipment_id = e.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN users u_tech ON wo.assigned_to = u_tech.id
       LEFT JOIN users u_creator ON wo.created_by = u_creator.id
       LEFT JOIN users u_signoff ON wo.supervisor_signoff_by = u_signoff.id
       LEFT JOIN pm_schedules pms ON wo.pm_schedule_id = pms.id
       WHERE wo.id = $1`,
      [id]
    );

    if (woRes.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const workOrder = woRes.rows[0];

    // Scoped check for operators
    if (req.user.role === 'operator') {
      const scopeCheck = await query(
        'SELECT 1 FROM operator_equipment WHERE operator_id = $1 AND equipment_id = $2',
        [req.user.id, workOrder.equipment_id]
      );
      if (scopeCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: You are not assigned to this equipment' });
      }
    }

    // Parts consumed on this work order
    const partsRes = await query(
      `SELECT wop.id, wop.part_id, wop.quantity, wop.unit_cost, wop.created_at,
              p.part_number, p.name as part_name, p.category as part_category, p.storage_bin, p.quantity_on_hand
       FROM work_order_parts wop
       JOIN parts p ON wop.part_id = p.id
       WHERE wop.work_order_id = $1
       ORDER BY wop.created_at ASC`,
      [id]
    );

    res.json({
      work_order: workOrder,
      parts_used: partsRes.rows,
    });
  } catch (error) {
    console.error('[work-orders GET /:id] Error:', error);
    res.status(500).json({ error: 'Server error retrieving work order details' });
  }
});

// POST /api/work-orders - Create manual work order (Technicians, Managers, Admins)
router.post('/', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'Corrective',
      priority = 'Medium',
      equipment_id,
      assigned_to,
      due_date,
      estimated_hours = 1.0,
      checklist = [],
    } = req.body;

    if (!title || !equipment_id) {
      return res.status(400).json({ error: 'Title and Equipment ID are required' });
    }

    const wo_number = await generateWoNumber();
    const finalDueDate = due_date || new Date().toISOString().split('T')[0];

    const insertRes = await query(
      `INSERT INTO work_orders (
         wo_number, title, description, type, status, priority,
         equipment_id, assigned_to, created_by, due_date,
         estimated_hours, checklist
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        wo_number,
        title.trim(),
        description || null,
        type,
        assigned_to ? 'Assigned' : 'Open',
        priority,
        equipment_id,
        assigned_to ? parseInt(assigned_to, 10) : null,
        req.user.id,
        finalDueDate,
        parseFloat(estimated_hours) || 1.0,
        JSON.stringify(checklist),
      ]
    );

    const newWo = insertRes.rows[0];

    // Notification if assigned
    if (assigned_to) {
      await query(
        `INSERT INTO notifications (user_id, title, message, event_type, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          assigned_to,
          `Work Order Assigned: ${newWo.wo_number}`,
          `You have been assigned to work order '${newWo.title}' (${newWo.priority} priority).`,
          'work_order.assigned',
          'work_order',
          newWo.id,
        ]
      );
    }

    res.status(201).json({
      message: 'Work order created successfully',
      work_order: newWo,
    });
  } catch (error) {
    console.error('[work-orders POST /] Error:', error);
    res.status(500).json({ error: 'Server error creating work order' });
  }
});

// PUT /api/work-orders/:id - Update work order status, checklist, hours, downtime & sign-off
router.put('/:id', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      status,
      checklist,
      actual_hours,
      root_cause,
      resolution_notes,
      downtime_minutes,
      assigned_to,
      priority,
      supervisor_signoff,
    } = req.body;

    const currentRes = await query('SELECT * FROM work_orders WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    const current = currentRes.rows[0];

    const updates = [];
    const values = [];
    let idx = 1;

    // Status transition tracking
    if (status && status !== current.status) {
      updates.push(`status = $${idx++}`);
      values.push(status);

      if (status === 'In Progress' && !current.started_at) {
        updates.push(`started_at = NOW()`);
      }

      if (['Completed', 'Closed'].includes(status) && !current.completed_at) {
        updates.push(`completed_at = NOW()`);

        // If completed work order came from a PM Schedule, reschedule the next occurrence!
        if (current.pm_schedule_id) {
          const schRes = await query('SELECT * FROM pm_schedules WHERE id = $1', [current.pm_schedule_id]);
          if (schRes.rows.length > 0) {
            const sch = schRes.rows[0];
            const eqRes = await query('SELECT runtime_hours FROM equipment WHERE id = $1', [sch.equipment_id]);
            const currentHours = eqRes.rows.length > 0 ? parseFloat(eqRes.rows[0].runtime_hours || 0) : 0;

            let nextDate = null;
            let nextMeter = null;

            if (sch.calendar_interval_days) {
              const d = new Date();
              d.setDate(d.getDate() + parseInt(sch.calendar_interval_days, 10));
              nextDate = d.toISOString().split('T')[0];
            }

            if (sch.meter_interval_hours) {
              nextMeter = currentHours + parseFloat(sch.meter_interval_hours);
            }

            await query(
              `UPDATE pm_schedules 
               SET last_performed_date = CURRENT_DATE,
                   last_meter_reading = $1,
                   next_due_date = $2,
                   next_due_meter = $3,
                   updated_at = NOW()
               WHERE id = $4`,
              [currentHours, nextDate, nextMeter, sch.id]
            );
          }
        }
      }
    }

    if (checklist !== undefined) {
      updates.push(`checklist = $${idx++}`);
      values.push(JSON.stringify(checklist));
    }

    if (actual_hours !== undefined) {
      updates.push(`actual_hours = $${idx++}`);
      values.push(parseFloat(actual_hours) || 0.0);
    }

    if (root_cause !== undefined) {
      updates.push(`root_cause = $${idx++}`);
      values.push(root_cause ? root_cause.trim() : null);
    }

    if (resolution_notes !== undefined) {
      updates.push(`resolution_notes = $${idx++}`);
      values.push(resolution_notes ? resolution_notes.trim() : null);
    }

    if (downtime_minutes !== undefined) {
      updates.push(`downtime_minutes = $${idx++}`);
      values.push(parseInt(downtime_minutes, 10) || 0);
    }

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${idx++}`);
      values.push(assigned_to ? parseInt(assigned_to, 10) : null);
    }

    if (priority !== undefined) {
      updates.push(`priority = $${idx++}`);
      values.push(priority);
    }

    // Additional fields editable by manager/admin
    const isElevated = ['admin', 'manager'].includes(req.user.role);
    if (isElevated && req.body.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(req.body.title.trim());
    }
    if (isElevated && req.body.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(req.body.description ? req.body.description.trim() : null);
    }
    if (isElevated && req.body.type !== undefined) {
      updates.push(`type = $${idx++}`);
      values.push(req.body.type);
    }
    if (isElevated && req.body.equipment_id !== undefined) {
      updates.push(`equipment_id = $${idx++}`);
      values.push(parseInt(req.body.equipment_id, 10));
    }
    if (isElevated && req.body.due_date !== undefined) {
      updates.push(`due_date = $${idx++}`);
      values.push(req.body.due_date || null);
    }
    if (isElevated && req.body.estimated_hours !== undefined) {
      updates.push(`estimated_hours = $${idx++}`);
      values.push(parseFloat(req.body.estimated_hours) || 1.0);
    }

    // Supervisor sign-off (Manager or Admin)
    if (supervisor_signoff && ['admin', 'manager'].includes(req.user.role)) {
      updates.push(`supervisor_signoff_by = $${idx++}`);
      values.push(req.user.id);
      updates.push(`supervisor_signoff_at = NOW()`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateRes = await query(
      `UPDATE work_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'UPDATE_WORK_ORDER', 'work_order', id, JSON.stringify({ wo_number: updateRes.rows[0].wo_number, title: updateRes.rows[0].title })]
    );

    res.json({
      message: 'Work order updated successfully',
      work_order: updateRes.rows[0],
    });
  } catch (error) {
    console.error('[work-orders PUT /:id] Error:', error);
    res.status(500).json({ error: 'Server error updating work order' });
  }
});

// DELETE /api/work-orders/:id - Delete work order and restore inventory (Admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const checkRes = await query('SELECT id, wo_number, title FROM work_orders WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    const wo = checkRes.rows[0];

    // Restore any consumed parts to inventory before deleting
    const consumedParts = await query('SELECT part_id, quantity FROM work_order_parts WHERE work_order_id = $1', [id]);
    for (const cp of consumedParts.rows) {
      await query('UPDATE parts SET quantity_on_hand = quantity_on_hand + $1, updated_at = NOW() WHERE id = $2', [cp.quantity, cp.part_id]);
    }

    await query('DELETE FROM work_orders WHERE id = $1', [id]);

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'DELETE_WORK_ORDER', 'work_order', id, JSON.stringify({ wo_number: wo.wo_number, title: wo.title })]
    );

    res.json({ message: `Work Order '${wo.wo_number}' deleted successfully and consumed parts returned to inventory` });
  } catch (error) {
    console.error('[work-orders DELETE /:id] Error:', error);
    res.status(500).json({ error: 'Server error deleting work order' });
  }
});

// POST /api/work-orders/:id/parts - Log parts consumption on work order & auto-deduct stock
router.post('/:id/parts', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const woId = parseInt(req.params.id, 10);
    const { part_id, quantity = 1 } = req.body;

    if (!part_id || !quantity || parseInt(quantity, 10) <= 0) {
      return res.status(400).json({ error: 'Valid part ID and positive quantity required' });
    }

    const qty = parseInt(quantity, 10);

    // Fetch part details & unit cost
    const partRes = await query('SELECT * FROM parts WHERE id = $1', [part_id]);
    if (partRes.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found in inventory catalog' });
    }
    const part = partRes.rows[0];

    // Decrement stock in parts table (PRD 3.6: Auto-deduction when parts are logged against a work order)
    const newStock = part.quantity_on_hand - qty;
    await query('UPDATE parts SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2', [newStock, part.id]);

    // Record consumption in work_order_parts
    const insertRes = await query(
      `INSERT INTO work_order_parts (work_order_id, part_id, quantity, unit_cost)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [woId, part.id, qty, part.unit_cost]
    );

    // Check for low stock alert
    if (newStock <= part.reorder_point) {
      // Find managers/admins to alert
      const managers = await query("SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = TRUE");
      for (const m of managers.rows) {
        await query(
          `INSERT INTO notifications (user_id, title, message, event_type, entity_type, entity_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            m.id,
            `Low Stock Alert: ${part.part_number}`,
            `Part '${part.name}' dropped to ${newStock} units on hand (Reorder point: ${part.reorder_point}).`,
            'inventory.low_stock',
            'part',
            part.id,
          ]
        );
      }
    }

    res.status(201).json({
      message: `Logged ${qty}x ${part.name} to work order. Stock updated to ${newStock}.`,
      part_consumption: insertRes.rows[0],
      remaining_stock: newStock,
    });
  } catch (error) {
    console.error('[work-orders :id/parts] Error:', error);
    res.status(500).json({ error: 'Server error logging part consumption' });
  }
});

// DELETE /api/work-orders/:id/parts/:part_entry_id - Remove logged part and return to stock
router.delete('/:id/parts/:part_entry_id', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const entryId = parseInt(req.params.part_entry_id, 10);
    const entryRes = await query('SELECT * FROM work_order_parts WHERE id = $1', [entryId]);
    if (entryRes.rows.length === 0) {
      return res.status(404).json({ error: 'Consumed part record not found' });
    }
    const entry = entryRes.rows[0];

    // Restore stock
    await query('UPDATE parts SET quantity_on_hand = quantity_on_hand + $1, updated_at = NOW() WHERE id = $2', [entry.quantity, entry.part_id]);

    // Delete record
    await query('DELETE FROM work_order_parts WHERE id = $1', [entryId]);

    res.json({ message: 'Part record removed and inventory stock restored' });
  } catch (error) {
    console.error('[work-orders DELETE :id/parts/:part_entry_id] Error:', error);
    res.status(500).json({ error: 'Server error deleting logged part' });
  }
});

export default router;
