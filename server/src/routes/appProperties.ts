import { Router } from 'express';
import db from '../db';

const router = Router();

interface AppProperty {
  id: number;
  name: string;
  dataType: string;
  defaultValue: string | null;
}

// GET all app properties
router.get('/', (_req, res) => {
  const properties = db.prepare('SELECT * FROM AppProperty').all();
  res.json(properties);
});

// GET single app property
router.get('/:id', (req, res) => {
  const property = db.prepare('SELECT * FROM AppProperty WHERE id = ?').get(req.params.id) as AppProperty | undefined;
  if (!property) {
    return res.status(404).json({ error: 'AppProperty not found' });
  }
  res.json(property);
});

// POST create app property
router.post('/', (req, res) => {
  const { name, dataType = 'VAR', defaultValue } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = db.prepare(`
    INSERT INTO AppProperty (name, dataType, defaultValue)
    VALUES (?, ?, ?)
  `).run(name, dataType, defaultValue || null);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    dataType,
    defaultValue
  });
});

// PUT update app property
router.put('/:id', (req, res) => {
  const { name, dataType, defaultValue } = req.body;
  
  const existing = db.prepare('SELECT * FROM AppProperty WHERE id = ?').get(req.params.id) as AppProperty | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'AppProperty not found' });
  }

  const updated = {
    name: name ?? existing.name,
    dataType: dataType !== undefined ? dataType : existing.dataType,
    defaultValue: defaultValue !== undefined ? defaultValue : existing.defaultValue
  };

  db.prepare(`
    UPDATE AppProperty 
    SET name = ?, dataType = ?, defaultValue = ?
    WHERE id = ?
  `).run(updated.name, updated.dataType, updated.defaultValue, req.params.id);

  res.json({ id: Number(req.params.id), ...updated });
});

// DELETE app property
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM AppProperty WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'AppProperty not found' });
  }
  res.status(204).send();
});

export default router;
