import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const PHOTOS_DIR = path.join(BASE_UPLOAD_DIR, 'parts_requests');

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// In-memory multer storage so Sharp can compress before saving to disk (PRD 3.6.2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max incoming phone photo
});

router.use(authenticateToken);

// GET /api/parts-requests - Operator scoped, sorted by urgency for managers
router.get('/', async (req, res) => {
  try {
    let sql = `
      SELECT pr.*, 
             u.full_name as requester_name, u.role as requester_role, u.language_preference as requester_lang,
             e.asset_id, e.name as equipment_name,
             p.part_number, p.name as catalog_part_name,
             reviewer.full_name as reviewer_name,
             COALESCE(
               json_agg(
                 json_build_object('id', ph.id, 'file_name', ph.file_name, 'file_size', ph.file_size, 'width', ph.width, 'height', ph.height)
               ) FILTER (WHERE ph.id IS NOT NULL), '[]'
             ) as photos
      FROM parts_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN equipment e ON pr.equipment_id = e.id
      LEFT JOIN parts p ON pr.part_id = p.id
      LEFT JOIN users reviewer ON pr.reviewed_by = reviewer.id
      LEFT JOIN parts_request_photos ph ON pr.id = ph.request_id
    `;
    const params = [];

    // Operators only see their own requests (PRD 2.1)
    if (req.user.role === 'operator') {
      sql += ` WHERE pr.user_id = $1`;
      params.push(req.user.id);
    }

    sql += ` GROUP BY pr.id, u.id, e.id, p.id, reviewer.id 
             ORDER BY 
               CASE pr.urgency WHEN 'Urgent' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END,
               pr.created_at DESC`;

    const result = await query(sql, params);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('[parts-requests GET /] Error:', error);
    res.status(500).json({ error: 'Server error retrieving parts requests' });
  }
});

// POST /api/parts-requests - Create request with photo compression (Sharp)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const {
      equipment_id,
      part_id,
      part_description,
      quantity,
      reason,
      urgency,
    } = req.body;

    const eqId = parseInt(equipment_id, 10);
    if (!eqId || !part_description) {
      return res.status(400).json({ error: 'Equipment and part description are required' });
    }

    // PRD 2.1: Enforce operator scoping at API level
    if (req.user.role === 'operator') {
      if (!req.user.assigned_equipment_ids.includes(eqId)) {
        return res.status(403).json({ error: 'Forbidden: you can only submit parts requests for your assigned equipment' });
      }
    }

    // Generate Request Number (PR-YYYY-XXXX)
    const year = new Date().getFullYear();
    const countRes = await query("SELECT COUNT(*) FROM parts_requests WHERE request_number LIKE $1", [`PR-${year}-%`]);
    const nextSeq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(4, '0');
    const requestNumber = `PR-${year}-${nextSeq}`;

    // Insert Request
    const insertRes = await query(
      `INSERT INTO parts_requests 
       (request_number, user_id, equipment_id, part_id, part_description, quantity, reason, urgency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Submitted')
       RETURNING *`,
      [
        requestNumber,
        req.user.id,
        eqId,
        part_id ? parseInt(part_id, 10) : null,
        part_description.trim(),
        parseInt(quantity || 1, 10),
        reason ? reason.trim() : null,
        urgency && ['Low', 'Normal', 'Urgent'].includes(urgency) ? urgency : 'Normal',
      ]
    );

    const newRequest = insertRes.rows[0];

    // PRD 3.6.2: Server-side photo compression with Sharp before writing to disk
    if (req.file) {
      const uniqueName = `pr-${newRequest.id}-${Date.now()}.webp`;
      const targetFilePath = path.join(PHOTOS_DIR, uniqueName);

      const metadata = await sharp(req.file.buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(targetFilePath);

      await query(
        `INSERT INTO parts_request_photos (request_id, file_path, file_name, file_size, mime_type, width, height)
         VALUES ($1, $2, $3, $4, 'image/webp', $5, $6)`,
        [newRequest.id, targetFilePath, uniqueName, metadata.size, metadata.width, metadata.height]
      );
    }

    // PRD 3.7 & 3.6.1: Notify managers via notifications table (webhook event simulation)
    const eqRes = await query('SELECT asset_id, name FROM equipment WHERE id = $1', [eqId]);
    const asset = eqRes.rows[0];

    const managersRes = await query("SELECT id, language_preference FROM users WHERE role IN ('manager', 'admin')");
    for (const m of managersRes.rows) {
      const isSpanish = m.language_preference === 'es';
      const title = isSpanish ? `Nueva Solicitud de Repuesto: ${newRequest.request_number}` : `New Parts Request: ${newRequest.request_number}`;
      const msg = isSpanish
        ? `Operador ${req.user.full_name} solicitó ${newRequest.quantity}x ${newRequest.part_description} para ${asset?.asset_id} (Urgencia: ${newRequest.urgency})`
        : `${req.user.full_name} requested ${newRequest.quantity}x ${newRequest.part_description} for ${asset?.asset_id} (Urgency: ${newRequest.urgency})`;

      await query(
        `INSERT INTO notifications (user_id, title, message, event_type, entity_type, entity_id)
         VALUES ($1, $2, $3, 'parts_request.created', 'parts_request', $4)`,
        [m.id, title, msg, newRequest.id]
      );
    }

    res.status(201).json({ message: 'Parts request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('[parts-requests POST /] Error:', error);
    res.status(500).json({ error: 'Server error submitting parts request' });
  }
});

// PUT /api/parts-requests/:id/status - Review/Approve/Order/Deny (Admin & Manager)
router.put('/:id/status', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const { status, review_notes } = req.body;

    const validStatuses = ['Under Review', 'Approved', 'Ordered', 'Received', 'Fulfilled', 'Denied'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updateRes = await query(
      `UPDATE parts_requests 
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, review_notes || null, req.user.id, reqId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Parts request not found' });
    }

    const updated = updateRes.rows[0];

    // Notify requester of status change in their preferred language (PRD 3.7)
    const reqUserRes = await query('SELECT id, language_preference FROM users WHERE id = $1', [updated.user_id]);
    if (reqUserRes.rows.length > 0) {
      const requester = reqUserRes.rows[0];
      const isSpanish = requester.language_preference === 'es';
      const title = isSpanish ? `Actualización de Solicitud: ${updated.request_number}` : `Parts Request Updated: ${updated.request_number}`;
      const msg = isSpanish
        ? `Su solicitud para "${updated.part_description}" ha cambiado a estado: ${status}.`
        : `Your request for "${updated.part_description}" has been updated to: ${status}.`;

      await query(
        `INSERT INTO notifications (user_id, title, message, event_type, entity_type, entity_id)
         VALUES ($1, $2, $3, 'parts_request.status_changed', 'parts_request', $4)`,
        [requester.id, title, msg, updated.id]
      );
    }

    res.json({ message: 'Request status updated', request: updated });
  } catch (error) {
    console.error('[parts-requests PUT /:id/status] Error:', error);
    res.status(500).json({ error: 'Server error updating request status' });
  }
});

// GET /api/parts-requests/photos/:id - Serve compressed photo
router.get('/photos/:id', async (req, res) => {
  try {
    const photoId = parseInt(req.params.id, 10);
    const photoRes = await query('SELECT * FROM parts_request_photos WHERE id = $1', [photoId]);

    if (photoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoRes.rows[0];
    if (!fs.existsSync(photo.file_path)) {
      return res.status(404).json({ error: 'File on disk not found' });
    }

    res.setHeader('Content-Type', photo.mime_type || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(photo.file_path).pipe(res);
  } catch (error) {
    console.error('[parts-requests photo download] Error:', error);
    res.status(500).json({ error: 'Server error retrieving photo' });
  }
});

// GET /api/notifications - User's notification inbox
router.get('/notifications/inbox', async (req, res) => {
  try {
    const notifs = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    const unreadCountRes = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    res.json({
      notifications: notifs.rows,
      unread_count: parseInt(unreadCountRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('[notifications GET] Error:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [notifId, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('[notifications PUT read] Error:', error);
    res.status(500).json({ error: 'Server error marking notification read' });
  }
});

export default router;
