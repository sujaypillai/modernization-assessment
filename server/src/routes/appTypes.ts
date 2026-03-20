import { Router } from 'express';
import db from '../db';

const router = Router();

// GET all app types
router.get('/', (_req, res) => {
  const types = db.prepare('SELECT * FROM AppType ORDER BY language, framework').all();
  res.json(types);
});

// GET single app type
router.get('/:id', (req, res) => {
  const type = db.prepare('SELECT * FROM AppType WHERE id = ?').get(req.params.id);
  if (!type) {
    return res.status(404).json({ error: 'AppType not found' });
  }
  res.json(type);
});

export default router;
