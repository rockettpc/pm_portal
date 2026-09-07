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

// GET /api/pm-schedules - List PM schedules (scoped for operators, all for others)
router.get('/', async (req, res) => {
  try {
    let sql = `
      SELECT s.*, 
             e.asset_id, e.name as equipment_name, e.category as equipment_category, 
             e.runtime_hours as current_runtime_hours, e.status as equipment_status,
             l.building, l.area,
             u.full_name as assigned_to_name
      FROM pm_schedules s
      JOIN equipment e ON s.equipment_id = e.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u ON s.assigned_to = u.id
    `;
    const params = [];

    if (req.user.role === 'operator') {
      sql += ` INNER JOIN operator_equipment oe ON e.id = oe.equipment_id WHERE oe.operator_id = $1`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY s.next_due_date ASC NULLS LAST, s.id ASC`;

    const result = await query(sql, params);

    // Calculate urgency status for each schedule (e.g. overdue, due_soon, ok)
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const enriched = result.rows.map(row => {
      let isOverdue = false;
      let isDueSoon = false;

      if (row.next_due_date) {
        const dueDate = new Date(row.next_due_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) isOverdue = true;
        else if (diffDays <= 3) isDueSoon = true;
      }

      if (row.next_due_meter && row.current_runtime_hours) {
        if (parseFloat(row.current_runtime_hours) >= parseFloat(row.next_due_meter)) {
          isOverdue = true;
        }
      }

      return {
        ...row,
        is_overdue: isOverdue,
        is_due_soon: isDueSoon,
      };
    });

    res.json({ schedules: enriched });
  } catch (error) {
    console.error('[pm-schedules GET /] Error:', error);
    res.status(500).json({ error: 'Server error retrieving PM schedules' });
  }
});

// GET /api/pm-schedules/:id - Get single schedule with history
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await query(
      `SELECT s.*, 
              e.asset_id, e.name as equipment_name, e.category as equipment_category, 
              e.runtime_hours as current_runtime_hours, e.status as equipment_status,
              l.building, l.area,
              u.full_name as assigned_to_name
       FROM pm_schedules s
       JOIN equipment e ON s.equipment_id = e.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN users u ON s.assigned_to = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PM schedule not found' });
    }

    // Associated recent work orders
    const woRes = await query(
      `SELECT id, wo_number, title, type, status, priority, due_date, started_at, completed_at, actual_hours
       FROM work_orders 
       WHERE pm_schedule_id = $1 
       ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      schedule: result.rows[0],
      recent_work_orders: woRes.rows,
    });
  } catch (error) {
    console.error('[pm-schedules GET /:id] Error:', error);
    res.status(500).json({ error: 'Server error retrieving PM schedule' });
  }
});

// POST /api/pm-schedules - Create new PM schedule (Admin / Manager)
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      equipment_id,
      title,
      description,
      trigger_type = 'calendar',
      calendar_interval_days,
      meter_interval_hours,
      estimated_duration_hours = 1.0,
      priority = 'Medium',
      assigned_to,
      checklist = [],
    } = req.body;

    if (!equipment_id || !title) {
      return res.status(400).json({ error: 'Equipment ID and title are required' });
    }

    // Fetch equipment current runtime
    const eqRes = await query('SELECT asset_id, runtime_hours FROM equipment WHERE id = $1', [equipment_id]);
    if (eqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const eq = eqRes.rows[0];

    // Compute unique schedule code
    const countRes = await query('SELECT COUNT(*) FROM pm_schedules');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const schedule_code = `PM-${eq.asset_id.replace(/^EQ-/, '')}-${String(seq).padStart(3, '0')}`;

    // Compute next due date / meter
    let next_due_date = null;
    let next_due_meter = null;

    if (['calendar', 'both'].includes(trigger_type) && calendar_interval_days) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(calendar_interval_days, 10));
      next_due_date = d.toISOString().split('T')[0];
    }

    if (['meter', 'both'].includes(trigger_type) && meter_interval_hours) {
      const currentHours = parseFloat(eq.runtime_hours || 0);
      next_due_meter = currentHours + parseFloat(meter_interval_hours);
    }

    const insertRes = await query(
      `INSERT INTO pm_schedules (
         schedule_code, equipment_id, title, description, trigger_type,
         calendar_interval_days, meter_interval_hours, next_due_date, next_due_meter,
         estimated_duration_hours, priority, assigned_to, checklist
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        schedule_code,
        equipment_id,
        title.trim(),
        description || null,
        trigger_type,
        calendar_interval_days ? parseInt(calendar_interval_days, 10) : null,
        meter_interval_hours ? parseFloat(meter_interval_hours) : null,
        next_due_date,
        next_due_meter,
        parseFloat(estimated_duration_hours) || 1.0,
        priority,
        assigned_to ? parseInt(assigned_to, 10) : null,
        JSON.stringify(checklist),
      ]
    );

    res.status(201).json({
      message: 'PM schedule created successfully',
      schedule: insertRes.rows[0],
    });
  } catch (error) {
    console.error('[pm-schedules POST /] Error:', error);
    res.status(500).json({ error: 'Server error creating PM schedule' });
  }
});

// PUT /api/pm-schedules/:id - Update PM schedule (Admin / Manager)
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      equipment_id,
      title,
      description,
      trigger_type,
      calendar_interval_days,
      meter_interval_hours,
      estimated_duration_hours,
      priority,
      assigned_to,
      checklist,
      is_active,
      next_due_date,
      next_due_meter,
    } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (equipment_id !== undefined) { fields.push(`equipment_id = $${idx++}`); values.push(parseInt(equipment_id, 10)); }
    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title.trim()); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (trigger_type !== undefined) { fields.push(`trigger_type = $${idx++}`); values.push(trigger_type); }
    if (calendar_interval_days !== undefined) { fields.push(`calendar_interval_days = $${idx++}`); values.push(calendar_interval_days ? parseInt(calendar_interval_days, 10) : null); }
    if (meter_interval_hours !== undefined) { fields.push(`meter_interval_hours = $${idx++}`); values.push(meter_interval_hours ? parseFloat(meter_interval_hours) : null); }
    if (estimated_duration_hours !== undefined) { fields.push(`estimated_duration_hours = $${idx++}`); values.push(parseFloat(estimated_duration_hours)); }
    if (priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(priority); }
    if (assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(assigned_to ? parseInt(assigned_to, 10) : null); }
    if (checklist !== undefined) { fields.push(`checklist = $${idx++}`); values.push(JSON.stringify(checklist)); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(is_active)); }
    if (next_due_date !== undefined) { fields.push(`next_due_date = $${idx++}`); values.push(next_due_date || null); }
    if (next_due_meter !== undefined) { fields.push(`next_due_meter = $${idx++}`); values.push(next_due_meter !== null && next_due_meter !== '' ? parseFloat(next_due_meter) : null); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const updateRes = await query(
      `UPDATE pm_schedules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'PM schedule not found' });
    }

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'UPDATE_PM_SCHEDULE', 'pm_schedule', id, JSON.stringify({ schedule_code: updateRes.rows[0].schedule_code, title: updateRes.rows[0].title })]
    );

    res.json({ message: 'PM schedule updated', schedule: updateRes.rows[0] });
  } catch (error) {
    console.error('[pm-schedules PUT /:id] Error:', error);
    res.status(500).json({ error: 'Server error updating PM schedule' });
  }
});

// DELETE /api/pm-schedules/:id - Delete PM schedule (Admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const checkRes = await query('SELECT id, schedule_code, title FROM pm_schedules WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'PM schedule not found' });
    }
    const schedule = checkRes.rows[0];

    await query('DELETE FROM pm_schedules WHERE id = $1', [id]);

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'DELETE_PM_SCHEDULE', 'pm_schedule', id, JSON.stringify({ schedule_code: schedule.schedule_code, title: schedule.title })]
    );

    res.json({ message: `PM Schedule '${schedule.schedule_code}' deleted successfully` });
  } catch (error) {
    console.error('[pm-schedules DELETE /:id] Error:', error);
    res.status(500).json({ error: 'Server error deleting PM schedule' });
  }
});

// POST /api/pm-schedules/:id/trigger - Immediately generate a Work Order from schedule
router.post('/:id/trigger', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const schRes = await query('SELECT * FROM pm_schedules WHERE id = $1', [id]);
    if (schRes.rows.length === 0) {
      return res.status(404).json({ error: 'PM schedule not found' });
    }
    const schedule = schRes.rows[0];

    const wo_number = await generateWoNumber();
    const dueDate = schedule.next_due_date || new Date().toISOString().split('T')[0];

    const woRes = await query(
      `INSERT INTO work_orders (
         wo_number, title, description, type, status, priority,
         equipment_id, pm_schedule_id, assigned_to, created_by,
         due_date, estimated_hours, checklist
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        wo_number,
        schedule.title,
        schedule.description || `Generated from PM schedule ${schedule.schedule_code}`,
        'Preventive',
        schedule.assigned_to ? 'Assigned' : 'Open',
        schedule.priority,
        schedule.equipment_id,
        schedule.id,
        schedule.assigned_to,
        req.user.id,
        dueDate,
        schedule.estimated_duration_hours,
        JSON.stringify(schedule.checklist || []),
      ]
    );

    const createdWo = woRes.rows[0];

    // Notification
    if (schedule.assigned_to) {
      await query(
        `INSERT INTO notifications (user_id, title, message, event_type, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          schedule.assigned_to,
          `New PM Work Order ${createdWo.wo_number}`,
          `Work order '${createdWo.title}' has been generated and assigned to you.`,
          'work_order.assigned',
          'work_order',
          createdWo.id,
        ]
      );
    }

    res.status(201).json({
      message: `Work Order ${createdWo.wo_number} generated successfully`,
      work_order: createdWo,
    });
  } catch (error) {
    console.error('[pm-schedules :id/trigger] Error:', error);
    res.status(500).json({ error: 'Server error generating work order' });
  }
});

// POST /api/pm-schedules/check-due - Scan all active schedules and auto-generate WOs for due items
router.post('/check-due', requireRole(['admin', 'manager', 'technician']), async (req, res) => {
  try {
    // Find active schedules where calendar date is today or overdue, OR equipment runtime is >= next_due_meter
    const dueRes = await query(
      `SELECT s.*, e.runtime_hours as current_runtime_hours
       FROM pm_schedules s
       JOIN equipment e ON s.equipment_id = e.id
       WHERE s.is_active = TRUE
         AND (
           (s.next_due_date IS NOT NULL AND s.next_due_date <= CURRENT_DATE)
           OR (s.next_due_meter IS NOT NULL AND e.runtime_hours >= s.next_due_meter)
         )`
    );

    const generatedWos = [];

    for (const schedule of dueRes.rows) {
      // Check if an open/in-progress work order already exists for this PM schedule
      const existingRes = await query(
        `SELECT id FROM work_orders 
         WHERE pm_schedule_id = $1 AND status IN ('Open', 'Assigned', 'In Progress', 'On Hold')`,
        [schedule.id]
      );

      if (existingRes.rows.length === 0) {
        const wo_number = await generateWoNumber();
        const dueDate = schedule.next_due_date || new Date().toISOString().split('T')[0];

        const woInsert = await query(
          `INSERT INTO work_orders (
             wo_number, title, description, type, status, priority,
             equipment_id, pm_schedule_id, assigned_to, created_by,
             due_date, estimated_hours, checklist
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            wo_number,
            schedule.title,
            schedule.description || `Auto-generated routine PM from schedule ${schedule.schedule_code}`,
            'Preventive',
            schedule.assigned_to ? 'Assigned' : 'Open',
            schedule.priority,
            schedule.equipment_id,
            schedule.id,
            schedule.assigned_to,
            req.user.id,
            dueDate,
            schedule.estimated_duration_hours,
            JSON.stringify(schedule.checklist || []),
          ]
        );

        const newWo = woInsert.rows[0];
        generatedWos.push(newWo);

        // Notify technician if assigned, or all technicians if unassigned
        if (schedule.assigned_to) {
          await query(
            `INSERT INTO notifications (user_id, title, message, event_type, entity_type, entity_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              schedule.assigned_to,
              `PM Due: ${newWo.wo_number}`,
              `Preventive maintenance '${newWo.title}' is due today.`,
              'pm.due',
              'work_order',
              newWo.id,
            ]
          );
        }
      }
    }

    res.json({
      message: `PM check completed. ${generatedWos.length} work orders generated.`,
      generated_count: generatedWos.length,
      work_orders: generatedWos,
    });
  } catch (error) {
    console.error('[pm-schedules /check-due] Error:', error);
    res.status(500).json({ error: 'Server error checking due PMs' });
  }
});

export default router;
