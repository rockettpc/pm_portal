import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/locations
router.get('/locations', async (req, res) => {
  try {
    const result = await query('SELECT * FROM locations ORDER BY building ASC, area ASC');
    res.json({ locations: result.rows });
  } catch (error) {
    console.error('[locations route] Error:', error);
    res.status(500).json({ error: 'Server error retrieving locations' });
  }
});

// POST /api/locations (Admin/Manager)
router.post('/locations', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { building, area, specific_location } = req.body;
    if (!building || !area) {
      return res.status(400).json({ error: 'Building and Area are required' });
    }
    const result = await query(
      'INSERT INTO locations (building, area, specific_location) VALUES ($1, $2, $3) RETURNING *',
      [building.trim(), area.trim(), specific_location ? specific_location.trim() : null]
    );
    res.status(201).json({ location: result.rows[0] });
  } catch (error) {
    console.error('[locations route POST] Error:', error);
    res.status(500).json({ error: 'Server error creating location' });
  }
});

// GET /api/vendors
router.get('/vendors', async (req, res) => {
  try {
    const result = await query('SELECT * FROM vendors ORDER BY is_preferred DESC, name ASC');
    res.json({ vendors: result.rows });
  } catch (error) {
    console.error('[vendors route] Error:', error);
    res.status(500).json({ error: 'Server error retrieving vendors' });
  }
});

export default router;
