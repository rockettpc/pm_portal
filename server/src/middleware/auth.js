import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pm_portal_super_secure_jwt_secret_2026';

export const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // Check cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    // Load active user from database
    const userRes = await query(
      'SELECT id, username, email, full_name, role, language_preference, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      return res.status(403).json({ error: 'User account is inactive or not found' });
    }

    const user = userRes.rows[0];

    // If user is an operator, load their assigned equipment IDs for API scoping (PRD 2.1)
    if (user.role === 'operator') {
      const eqRes = await query(
        'SELECT equipment_id FROM operator_equipment WHERE operator_id = $1',
        [user.id]
      );
      user.assigned_equipment_ids = eqRes.rows.map((r) => r.equipment_id);
    } else {
      user.assigned_equipment_ids = null;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[auth middleware] Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: role '${req.user.role}' lacks required permissions`,
      });
    }
    next();
  };
};

export const requireOperatorScope = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    // Non-operators have full visibility
    if (req.user.role !== 'operator') return next();

    const targetEquipmentId = parseInt(req.params[paramName], 10);
    if (!targetEquipmentId || !req.user.assigned_equipment_ids.includes(targetEquipmentId)) {
      return res.status(403).json({
        error: 'Forbidden: you are not assigned to this equipment',
      });
    }
    next();
  };
};

export const signToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
