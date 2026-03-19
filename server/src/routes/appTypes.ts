import { Router } from 'express';
import db from '../db';

const router = Router();

interface AppType {
  id: number;
  name: string;
  language: string | null;
  langVer: string | null;
  framework: string | null;
  frameworkVer: string | null;
}

// GET all app types
router.get('/', (_req, res) => {
  const types = db.prepare('SELECT * FROM AppType').all();
  res.json(types);
});

// GET single app type
router.get('/:id', (req, res) => {
  const type = db.prepare('SELECT * FROM AppType WHERE id = ?').get(req.params.id) as AppType | undefined;
  if (!type) {
    return res.status(404).json({ error: 'AppType not found' });
  }
  res.json(type);
});

// POST create app type
router.post('/', (req, res) => {
  const { name, language, langVer, framework, frameworkVer } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = db.prepare(`
    INSERT INTO AppType (name, language, langVer, framework, frameworkVer)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, language || null, langVer || null, framework || null, frameworkVer || null);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    language,
    langVer,
    framework,
    frameworkVer
  });
});

// PUT update app type
router.put('/:id', (req, res) => {
  const { name, language, langVer, framework, frameworkVer } = req.body;
  
  const existing = db.prepare('SELECT * FROM AppType WHERE id = ?').get(req.params.id) as AppType | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'AppType not found' });
  }

  const updated = {
    name: name ?? existing.name,
    language: language !== undefined ? language : existing.language,
    langVer: langVer !== undefined ? langVer : existing.langVer,
    framework: framework !== undefined ? framework : existing.framework,
    frameworkVer: frameworkVer !== undefined ? frameworkVer : existing.frameworkVer
  };

  db.prepare(`
    UPDATE AppType 
    SET name = ?, language = ?, langVer = ?, framework = ?, frameworkVer = ?
    WHERE id = ?
  `).run(updated.name, updated.language, updated.langVer, updated.framework, updated.frameworkVer, req.params.id);

  res.json({ id: Number(req.params.id), ...updated });
});

// DELETE app type
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM AppType WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'AppType not found' });
  }
  res.status(204).send();
});

export default router;
