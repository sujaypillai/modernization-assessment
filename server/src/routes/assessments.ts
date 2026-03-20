import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db from '../db';
import { loadApplications } from '../seed';

const router = Router();

const DATA_DIR = process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '..', '..', '..', 'data');
const ASSESSMENTS_DIR = path.join(DATA_DIR, 'assessments');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(ASSESSMENTS_DIR, { recursive: true });
      cb(null, ASSESSMENTS_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.html') {
      cb(null, true);
    } else {
      cb(new Error('Only .html files are accepted'));
    }
  }
});

// GET assessment report HTML file
router.get('/report/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(DATA_DIR, 'assessments', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.type('html').sendFile(filePath);
});

// POST refresh assessments
router.post('/refresh', (_req, res) => {
  try {
    const result = loadApplications(db);
    const modeLabel = result.mode === 'assessments'
      ? `Loaded ${result.count} applications from assessment files`
      : `No assessment files found — loaded ${result.count} demo applications`;

    console.log(`Assessment refresh: ${modeLabel}`);

    res.json({
      success: true,
      message: modeLabel,
      mode: result.mode,
      processed: result.count
    });
  } catch (error) {
    console.error('Assessment refresh failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh assessments',
      processed: 0
    });
  }
});

// POST upload assessment report files then refresh
router.post('/upload', upload.array('files'), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const result = loadApplications(db);
    res.json({
      success: true,
      message: `Uploaded ${files.length} file(s). ${result.count} application(s) loaded.`,
      uploaded: files.length,
      processed: result.count
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ success: false, message: 'Failed to upload and process files' });
  }
});

export default router;
