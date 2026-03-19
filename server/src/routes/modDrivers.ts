import { Router } from 'express';
import db from '../db';

const router = Router();

interface ModDriver {
  id: number;
  name: string;
  desc: string | null;
  score: number;
}

// GET all mod drivers
router.get('/', (_req, res) => {
  const drivers = db.prepare('SELECT * FROM ModDriver').all();
  res.json(drivers);
});

// GET single mod driver
router.get('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM ModDriver WHERE id = ?').get(req.params.id) as ModDriver | undefined;
  if (!driver) {
    return res.status(404).json({ error: 'ModDriver not found' });
  }
  res.json(driver);
});

// POST create mod driver
router.post('/', (req, res) => {
  const { name, desc, score = 0 } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = db.prepare(`
    INSERT INTO ModDriver (name, desc, score)
    VALUES (?, ?, ?)
  `).run(name, desc || null, score);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    desc,
    score
  });
});

// PUT update mod driver
router.put('/:id', (req, res) => {
  const { name, desc, score } = req.body;
  
  const existing = db.prepare('SELECT * FROM ModDriver WHERE id = ?').get(req.params.id) as ModDriver | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'ModDriver not found' });
  }

  const updated = {
    name: name ?? existing.name,
    desc: desc !== undefined ? desc : existing.desc,
    score: score !== undefined ? score : existing.score
  };

  db.prepare(`
    UPDATE ModDriver 
    SET name = ?, desc = ?, score = ?
    WHERE id = ?
  `).run(updated.name, updated.desc, updated.score, req.params.id);

  res.json({ id: Number(req.params.id), ...updated });
});

// DELETE mod driver
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM ModDriver WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'ModDriver not found' });
  }
  res.status(204).send();
});

export default router;
