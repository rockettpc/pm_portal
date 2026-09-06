import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply auth to all user management routes
router.use(authenticateToken);

// GET /api/users (Admin and Manager only)
router.get('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const usersRes = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.language_preference, u.is_active, u.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', e.id, 'asset_id', e.asset_id, 'name', e.name)
                ) FILTER (WHERE e.id IS NOT NULL), '[]'
              ) as assigned_equipment
       FROM users u
       LEFT JOIN operator_equipment oe ON u.id = oe.operator_id
       LEFT JOIN equipment e ON oe.equipment_id = e.id
       GROUP BY u.id
       ORDER BY u.id ASC`
    );

    res.json({ users: usersRes.rows });
  } catch (error) {
    console.error('[users route GET /] Error:', error);
    res.status(500).json({ error: 'Server error fetching user directory' });
  }
});

// POST /api/users (Admin only)
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, full_name, role, language_preference } = req.body;

    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required user fields' });
    }

    const validRoles = ['admin', 'manager', 'technician', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const lang = language_preference && ['en', 'es'].includes(language_preference) ? language_preference : 'en';

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const insertRes = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role, language_preference)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, full_name, role, language_preference, is_active, created_at`,
      [username.trim().toLowerCase(), email.trim().toLowerCase(), passwordHash, full_name.trim(), role, lang]
    );

    const newUser = insertRes.rows[0];

    // Audit log
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'CREATE_USER', 'user', newUser.id, JSON.stringify({ username: newUser.username, role: newUser.role })]
    );

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('[users route POST /] Error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// PUT /api/users/:id (Admin only)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { full_name, role, language_preference, is_active } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name.trim());
    }
    if (role !== undefined) {
      const validRoles = ['admin', 'manager', 'technician', 'operator', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (language_preference !== undefined) {
      if (!['en', 'es'].includes(language_preference)) {
        return res.status(400).json({ error: 'Language must be en or es' });
      }
      updates.push(`language_preference = $${paramIndex++}`);
      values.push(language_preference);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(Boolean(is_active));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No update parameters provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(targetUserId);

    const updateRes = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, username, email, full_name, role, language_preference, is_active, updated_at`,
      values
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated', user: updateRes.rows[0] });
  } catch (error) {
    console.error('[users route PUT /:id] Error:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// PUT /api/users/:id/password (Admin or Self)
router.put('/:id/password', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { newPassword, currentPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Only admin or the user themselves can change password
    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If non-admin changing their own password, verify current password
    if (req.user.role !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const uRes = await query('SELECT password_hash FROM users WHERE id = $1', [targetUserId]);
      if (uRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const matches = await bcrypt.compare(currentPassword, uRes.rows[0].password_hash);
      if (!matches) {
        return res.status(401).json({ error: 'Current password does not match' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, targetUserId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[users route password] Error:', error);
    res.status(500).json({ error: 'Server error updating password' });
  }
});

// PUT /api/users/:id/assignments (Assign equipment to operator - Admin & Manager)
router.put('/:id/assignments', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const operatorId = parseInt(req.params.id, 10);
    const { equipment_ids } = req.body; // Array of equipment IDs

    if (!Array.isArray(equipment_ids)) {
      return res.status(400).json({ error: 'equipment_ids must be an array of integers' });
    }

    // Verify user exists and is an operator
    const userRes = await query('SELECT id, role FROM users WHERE id = $1', [operatorId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Begin transaction for assignment update
    await query('DELETE FROM operator_equipment WHERE operator_id = $1', [operatorId]);

    for (const eqId of equipment_ids) {
      await query(
        'INSERT INTO operator_equipment (operator_id, equipment_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [operatorId, eqId, req.user.id]
      );
    }

    const updatedRes = await query(
      `SELECT e.id, e.asset_id, e.name 
       FROM operator_equipment oe
       JOIN equipment e ON oe.equipment_id = e.id
       WHERE oe.operator_id = $1`,
      [operatorId]
    );

    res.json({ message: 'Operator assignments updated', assigned_equipment: updatedRes.rows });
  } catch (error) {
    console.error('[users route assignments] Error:', error);
    res.status(500).json({ error: 'Server error updating operator assignments' });
  }
});

export default router;
