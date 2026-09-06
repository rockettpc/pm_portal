import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticateToken, signToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const trimmedLogin = login.trim().toLowerCase();

    // Query user by username or email
    const userRes = await query(
      `SELECT id, username, email, password_hash, full_name, role, language_preference, is_active 
       FROM users 
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [trimmedLogin]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated. Contact your supervisor.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    // Operator equipment assignments for instant UI hydration
    let assignedEquipment = [];
    if (user.role === 'operator') {
      const eqRes = await query(
        `SELECT e.id, e.asset_id, e.name 
         FROM operator_equipment oe 
         JOIN equipment e ON oe.equipment_id = e.id 
         WHERE oe.operator_id = $1`,
        [user.id]
      );
      assignedEquipment = eqRes.rows;
    }

    // Set secure httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log login to audit trail
    await query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'LOGIN', 'user', user.id, JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] })]
    );

    res.json({
      message: 'Login successful',
      token, // Also provide in response body for flexibility
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        language_preference: user.language_preference,
        assigned_equipment: assignedEquipment,
      },
    });
  } catch (error) {
    console.error('[auth route /login] Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let assignedEquipment = [];
    if (req.user.role === 'operator') {
      const eqRes = await query(
        `SELECT e.id, e.asset_id, e.name 
         FROM operator_equipment oe 
         JOIN equipment e ON oe.equipment_id = e.id 
         WHERE oe.operator_id = $1`,
        [req.user.id]
      );
      assignedEquipment = eqRes.rows;
    }

    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        language_preference: req.user.language_preference,
        assigned_equipment: assignedEquipment,
      },
    });
  } catch (error) {
    console.error('[auth route /me] Error:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

// PUT /api/auth/profile (update user's own profile, e.g. language preference)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { language_preference, full_name } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (language_preference) {
      if (!['en', 'es'].includes(language_preference)) {
        return res.status(400).json({ error: 'Language preference must be en or es' });
      }
      updates.push(`language_preference = $${paramIndex++}`);
      values.push(language_preference);
    }

    if (full_name && full_name.trim()) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, username, email, full_name, role, language_preference`,
      values
    );

    res.json({
      message: 'Profile updated',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[auth route /profile] Error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

export default router;
