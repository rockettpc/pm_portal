import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit-log - Paginated and filtered audit logs
router.get('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const { action, entity_type, user_id, search, from_date, to_date } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (action && action.trim()) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(action.trim().toUpperCase());
    }

    if (entity_type && entity_type.trim()) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      params.push(entity_type.trim().toLowerCase());
    }

    if (user_id && !isNaN(parseInt(user_id, 10))) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(parseInt(user_id, 10));
    }

    if (from_date) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(new Date(from_date));
    }

    if (to_date) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(new Date(to_date));
    }

    if (search && search.trim()) {
      conditions.push(`(
        LOWER(u.username) LIKE $${paramIndex} OR 
        LOWER(u.full_name) LIKE $${paramIndex} OR 
        al.details::text ILIKE $${paramIndex} OR 
        al.action ILIKE $${paramIndex} OR
        al.entity_type ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) 
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Items query with user join
    const itemsSql = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.created_at,
        u.username,
        u.full_name,
        u.role as user_role
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const itemsParams = [...params, limit, offset];
    const itemsRes = await query(itemsSql, itemsParams);

    res.json({
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[audit route /] Error:', error);
    res.status(500).json({ error: 'Server error retrieving audit logs' });
  }
});

// GET /api/audit-log/export - Export audit logs as CSV
router.get('/export', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { action, entity_type } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }
    if (entity_type) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      params.push(entity_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        al.id,
        al.created_at,
        COALESCE(u.username, 'System') as username,
        COALESCE(u.full_name, 'System') as full_name,
        COALESCE(u.role, 'system') as role,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details::text as details
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT 1000
    `;

    const result = await query(sql, params);

    // Build CSV string
    const headers = ['Log ID', 'Timestamp', 'Username', 'Full Name', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = result.rows.map(r => [
      r.id,
      `"${r.created_at.toISOString()}"`,
      `"${r.username}"`,
      `"${r.full_name}"`,
      `"${r.role}"`,
      `"${r.action}"`,
      `"${r.entity_type}"`,
      r.entity_id || '',
      `"${(r.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cgi_pm_audit_log_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('[audit route /export] Error:', error);
    res.status(500).json({ error: 'Server error exporting audit logs' });
  }
});

export default router;
