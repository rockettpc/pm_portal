import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard/overview - Real-time shop floor uptime wallboard (PRD 3.8)
router.get('/overview', async (req, res) => {
  try {
    const daysWindow = parseInt(req.query.days, 10) || 30;
    const windowMinutes = daysWindow * 24 * 60; // total nominal minutes in window

    // 1. Fetch all equipment with locations
    const eqRes = await query(`
      SELECT e.id, e.asset_id, e.name, e.category, e.status, e.criticality, 
             e.runtime_hours, e.updated_at,
             l.building, l.area, l.specific_location,
             v.name as vendor_name
      FROM equipment e
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN vendors v ON e.vendor_id = v.id
      ORDER BY l.area ASC, e.id ASC
    `);

    // 2. Fetch recent down transitions for machines currently down
    const downHistRes = await query(`
      SELECT h.equipment_id, h.reason, h.created_at as down_since, u.full_name as changed_by_name
      FROM equipment_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.new_status = 'Down'
      ORDER BY h.created_at DESC
    `);

    const latestDownByEq = {};
    downHistRes.rows.forEach(row => {
      if (!latestDownByEq[row.equipment_id]) {
        latestDownByEq[row.equipment_id] = row;
      }
    });

    // 3. Fetch downtime from completed work orders in window
    const woDowntimeRes = await query(`
      SELECT equipment_id, SUM(downtime_minutes) as total_wo_downtime
      FROM work_orders
      WHERE completed_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY equipment_id
    `, [daysWindow]);

    const woDowntimeMap = {};
    woDowntimeRes.rows.forEach(r => {
      woDowntimeMap[r.equipment_id] = parseInt(r.total_wo_downtime, 10) || 0;
    });

    // 4. Calculate individual uptime and enrich equipment
    const now = new Date();
    let totalShopDownMinutes = 0;
    const totalShopWindowMinutes = eqRes.rows.length * windowMinutes;

    const enrichedEquipment = eqRes.rows.map(eq => {
      let currentDownMinutes = 0;
      let downDetails = null;

      if (eq.status === 'Down' && latestDownByEq[eq.id]) {
        const downSince = new Date(latestDownByEq[eq.id].down_since);
        currentDownMinutes = Math.max(0, Math.round((now - downSince) / (1000 * 60)));
        downDetails = {
          down_since: latestDownByEq[eq.id].down_since,
          reason: latestDownByEq[eq.id].reason || 'Unscheduled equipment stoppage',
          changed_by: latestDownByEq[eq.id].changed_by_name || 'Floor Operator',
          elapsed_minutes: currentDownMinutes,
        };
      }

      const pastWoDown = woDowntimeMap[eq.id] || 0;
      const totalMachineDown = currentDownMinutes + pastWoDown;
      totalShopDownMinutes += totalMachineDown;

      const uptimePct = Math.max(0, Math.min(100, ((windowMinutes - totalMachineDown) / windowMinutes) * 100));

      return {
        ...eq,
        down_details: downDetails,
        total_down_minutes_window: totalMachineDown,
        uptime_percentage: parseFloat(uptimePct.toFixed(1)),
      };
    });

    // Group equipment by Area
    const areas = {};
    enrichedEquipment.forEach(eq => {
      const areaKey = eq.area || 'General Plant Area';
      if (!areas[areaKey]) areas[areaKey] = [];
      areas[areaKey].push(eq);
    });

    // 5. Open Parts Requests summary with age (PRD 3.8)
    const prRes = await query(`
      SELECT pr.id, pr.request_number, pr.urgency, pr.status, pr.part_description,
             pr.quantity, pr.created_at,
             e.asset_id, e.name as equipment_name,
             u.full_name as requester_name,
             p.part_number
      FROM parts_requests pr
      JOIN equipment e ON pr.equipment_id = e.id
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN parts p ON pr.part_id = p.id
      WHERE pr.status IN ('Submitted', 'Under Review', 'Approved', 'Ordered')
      ORDER BY 
        CASE pr.urgency WHEN 'Urgent' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END,
        pr.created_at ASC
    `);

    const openPartsRequests = prRes.rows.map(pr => {
      const created = new Date(pr.created_at);
      const ageHours = Math.round((now - created) / (1000 * 60 * 60));
      const ageDays = Math.floor(ageHours / 24);
      return {
        ...pr,
        age_hours: ageHours,
        age_days: ageDays,
        age_label: ageDays > 0 ? `${ageDays}d ${ageHours % 24}h` : `${ageHours}h`,
      };
    });

    // 6. Recently / Currently Down equipment
    const recentlyDown = enrichedEquipment
      .filter(eq => eq.status === 'Down' || eq.total_down_minutes_window > 0)
      .sort((a, b) => (b.down_details?.elapsed_minutes || 0) - (a.down_details?.elapsed_minutes || 0));

    // 7. Overall shop uptime & metrics
    const shopUptimePct = totalShopWindowMinutes > 0
      ? parseFloat((Math.max(0, Math.min(100, ((totalShopWindowMinutes - totalShopDownMinutes) / totalShopWindowMinutes) * 100))).toFixed(1))
      : 100.0;

    const totalActive = enrichedEquipment.filter(e => e.status === 'Active').length;
    const totalDown = enrichedEquipment.filter(e => e.status === 'Down').length;
    const totalStorage = enrichedEquipment.filter(e => e.status === 'In Storage').length;

    // Count open work orders
    const openWoRes = await query(`
      SELECT COUNT(*) as open_wo_count 
      FROM work_orders 
      WHERE status IN ('Open', 'Assigned', 'In Progress', 'On Hold')
    `);

    res.json({
      timestamp: new Date().toISOString(),
      days_window: daysWindow,
      summary: {
        total_equipment: enrichedEquipment.length,
        total_active: totalActive,
        total_down: totalDown,
        total_storage: totalStorage,
        open_work_orders: parseInt(openWoRes.rows[0].open_wo_count, 10),
        pending_parts_requests: openPartsRequests.length,
        shop_uptime_percentage: shopUptimePct,
      },
      equipment_by_area: areas,
      recently_down: recentlyDown,
      open_parts_requests: openPartsRequests,
    });
  } catch (error) {
    console.error('[dashboard GET /overview] Error:', error);
    res.status(500).json({ error: 'Server error generating overview dashboard' });
  }
});

// GET /api/dashboard/analytics - Historical KPIs, MTBF/MTTR, PM compliance & cost (PRD 3.9)
router.get('/analytics', async (req, res) => {
  try {
    const LABOR_HOURLY_RATE = 65.00; // Standard plant maintenance technician rate

    // 1. PM Compliance Rate
    const pmStatsRes = await query(`
      SELECT 
        COUNT(*) as total_pm_wos,
        COUNT(CASE WHEN status IN ('Completed', 'Closed') THEN 1 END) as completed_pm_wos,
        COUNT(CASE WHEN status IN ('Completed', 'Closed') AND completed_at::date <= due_date THEN 1 END) as on_time_pm_wos,
        COUNT(CASE WHEN status IN ('Open', 'Assigned', 'In Progress', 'On Hold') AND due_date < CURRENT_DATE THEN 1 END) as overdue_open_pms
      FROM work_orders
      WHERE type = 'Preventive'
    `);

    const pmStats = pmStatsRes.rows[0];
    const totalPmCompleted = parseInt(pmStats.completed_pm_wos, 10) || 0;
    const onTimePm = parseInt(pmStats.on_time_pm_wos, 10) || 0;
    const pmCompliancePct = totalPmCompleted > 0
      ? parseFloat(((onTimePm / totalPmCompleted) * 100).toFixed(1))
      : 100.0;

    // 2. MTBF (Mean Time Between Failures) & MTTR (Mean Time to Repair) per Equipment
    const eqReliabilityRes = await query(`
      SELECT e.id, e.asset_id, e.name, e.runtime_hours,
             COUNT(wo.id) as failure_count,
             COALESCE(SUM(wo.downtime_minutes), 0) as total_downtime_mins,
             COALESCE(SUM(wo.actual_hours), 0) as total_repair_hours
      FROM equipment e
      LEFT JOIN work_orders wo ON e.id = wo.equipment_id AND wo.type = 'Corrective' AND wo.status IN ('Completed', 'Closed')
      GROUP BY e.id, e.asset_id, e.name, e.runtime_hours
      ORDER BY e.id ASC
    `);

    const reliabilityAnalytics = eqReliabilityRes.rows.map(r => {
      const runtime = parseFloat(r.runtime_hours) || 0;
      const failures = parseInt(r.failure_count, 10) || 0;
      const downtimeMins = parseInt(r.total_downtime_mins, 10) || 0;
      const repairHours = parseFloat(r.total_repair_hours) || (downtimeMins / 60);

      // MTBF in hours: Operating Hours / Failures (or runtime if 0 failures)
      const mtbfHours = failures > 0 ? parseFloat((runtime / failures).toFixed(1)) : runtime;
      // MTTR in hours: Total Repair Hours / Failures
      const mttrHours = failures > 0 ? parseFloat((repairHours / failures).toFixed(1)) : 0.0;

      return {
        equipment_id: r.id,
        asset_id: r.asset_id,
        name: r.name,
        runtime_hours: runtime,
        failures,
        total_downtime_minutes: downtimeMins,
        mtbf_hours: mtbfHours,
        mttr_hours: mttrHours,
      };
    });

    // 3. Maintenance Cost by Asset (Labor + Parts)
    const costRes = await query(`
      SELECT e.id, e.asset_id, e.name, e.category,
             COALESCE(SUM(wo.actual_hours), 0) as total_labor_hours,
             COALESCE(SUM(wop.quantity * wop.unit_cost), 0) as total_parts_spend,
             COUNT(DISTINCT wo.id) as work_orders_count
      FROM equipment e
      LEFT JOIN work_orders wo ON e.id = wo.equipment_id
      LEFT JOIN work_order_parts wop ON wo.id = wop.work_order_id
      GROUP BY e.id, e.asset_id, e.name, e.category
      ORDER BY total_parts_spend DESC, total_labor_hours DESC
    `);

    const costAnalytics = costRes.rows.map(c => {
      const laborHours = parseFloat(c.total_labor_hours) || 0;
      const laborCost = laborHours * LABOR_HOURLY_RATE;
      const partsSpend = parseFloat(c.total_parts_spend) || 0;
      const totalCost = laborCost + partsSpend;

      return {
        equipment_id: c.id,
        asset_id: c.asset_id,
        name: c.name,
        category: c.category,
        work_orders_count: parseInt(c.work_orders_count, 10),
        labor_hours: laborHours,
        labor_cost: parseFloat(laborCost.toFixed(2)),
        parts_spend: parseFloat(partsSpend.toFixed(2)),
        total_maintenance_cost: parseFloat(totalCost.toFixed(2)),
      };
    });

    // 4. Technician Productivity
    const techProdRes = await query(`
      SELECT u.id, u.full_name, u.role,
             COUNT(wo.id) as total_assigned,
             COUNT(CASE WHEN wo.status IN ('Completed', 'Closed') THEN 1 END) as closed_count,
             COALESCE(SUM(wo.actual_hours), 0) as total_logged_hours
      FROM users u
      LEFT JOIN work_orders wo ON u.id = wo.assigned_to
      WHERE u.role IN ('technician', 'manager') AND u.is_active = TRUE
      GROUP BY u.id, u.full_name, u.role
      ORDER BY closed_count DESC, total_logged_hours DESC
    `);

    // 5. Parts Consumption & Top Spends
    const partsTopRes = await query(`
      SELECT p.id, p.part_number, p.name, p.category, p.unit_cost, p.quantity_on_hand,
             COALESCE(SUM(wop.quantity), 0) as total_units_consumed,
             COALESCE(SUM(wop.quantity * wop.unit_cost), 0) as total_spent
      FROM parts p
      JOIN work_order_parts wop ON p.id = wop.part_id
      GROUP BY p.id, p.part_number, p.name, p.category, p.unit_cost, p.quantity_on_hand
      ORDER BY total_spent DESC, total_units_consumed DESC
      LIMIT 10
    `);

    res.json({
      timestamp: new Date().toISOString(),
      compliance: {
        total_pm_wos: parseInt(pmStats.total_pm_wos, 10) || 0,
        completed_pm_wos: totalPmCompleted,
        on_time_pm_wos: onTimePm,
        overdue_open_pms: parseInt(pmStats.overdue_open_pms, 10) || 0,
        pm_compliance_percentage: pmCompliancePct,
      },
      reliability: reliabilityAnalytics,
      maintenance_costs: costAnalytics,
      technician_productivity: techProdRes.rows,
      top_consumed_parts: partsTopRes.rows,
    });
  } catch (error) {
    console.error('[dashboard GET /analytics] Error:', error);
    res.status(500).json({ error: 'Server error calculating analytics' });
  }
});

export default router;
