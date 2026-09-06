import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for manuals
});

router.use(authenticateToken);

// POST /api/equipment/:id/documents - Upload manual/doc (Admin, Manager, Tech)
router.post('/equipment/:id/documents', requireRole(['admin', 'manager', 'technician']), upload.single('document'), async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id, 10);
    const { title, doc_type, version } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const docTitle = title ? title.trim() : req.file.originalname;
    const type = doc_type || 'manual';

    const insertRes = await query(
      `INSERT INTO documents 
       (title, doc_type, file_path, file_name, file_size, mime_type, version, equipment_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        docTitle,
        type,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        version || '1.0',
        equipmentId,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: insertRes.rows[0],
    });
  } catch (error) {
    console.error('[documents route upload] Error:', error);
    res.status(500).json({ error: 'Server error saving uploaded document' });
  }
});

// GET /api/documents/:id/download - Stream / preview file
router.get('/documents/:id/download', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [docId]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docRes.rows[0];

    // If operator, ensure they have access to the equipment this document belongs to
    if (req.user.role === 'operator' && !req.user.assigned_equipment_ids.includes(doc.equipment_id)) {
      return res.status(403).json({ error: 'Forbidden: you are not assigned to this equipment' });
    }

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: 'File on disk not found' });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);

    const fileStream = fs.createReadStream(doc.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[documents route download] Error:', error);
    res.status(500).json({ error: 'Server error downloading document' });
  }
});

export default router;
