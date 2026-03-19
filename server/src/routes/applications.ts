import { Router } from 'express';
import db from '../db';

const router = Router();

interface Application {
  id: number;
  name: string;
  include: number;
  effort: string | null;
  target: string | null;
  reportFilename: string | null;
  properties: string;
  drivers: string;
}

// GET all applications
router.get('/', (_req, res) => {
  const apps = db.prepare('SELECT * FROM Application').all() as Application[];
  // Parse JSON fields for response
  const result = apps.map(app => ({
    ...app,
    include: Boolean(app.include),
    properties: JSON.parse(app.properties || '{}'),
    drivers: JSON.parse(app.drivers || '{}')
  }));
  res.json(result);
});

// GET single application
router.get('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM Application WHERE id = ?').get(req.params.id) as Application | undefined;
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }
  res.json({
    ...app,
    include: Boolean(app.include),
    properties: JSON.parse(app.properties || '{}'),
    drivers: JSON.parse(app.drivers || '{}')
  });
});

// POST create application
router.post('/', (req, res) => {
  const { name, include = true, effort, target, reportFilename, properties = {}, drivers = {} } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = db.prepare(`
    INSERT INTO Application (name, include, effort, target, reportFilename, properties, drivers)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    include ? 1 : 0,
    effort || null,
    target || null,
    reportFilename || null,
    JSON.stringify(properties),
    JSON.stringify(drivers)
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    include,
    effort,
    target,
    reportFilename,
    properties,
    drivers
  });
});

// PUT update application
router.put('/:id', (req, res) => {
  const { name, include, effort, target, reportFilename, properties, drivers } = req.body;
  
  const existing = db.prepare('SELECT * FROM Application WHERE id = ?').get(req.params.id) as Application | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const updated = {
    name: name ?? existing.name,
    include: include !== undefined ? (include ? 1 : 0) : existing.include,
    effort: effort !== undefined ? effort : existing.effort,
    target: target !== undefined ? target : existing.target,
    reportFilename: reportFilename !== undefined ? reportFilename : existing.reportFilename,
    properties: properties !== undefined ? JSON.stringify(properties) : existing.properties,
    drivers: drivers !== undefined ? JSON.stringify(drivers) : existing.drivers
  };

  db.prepare(`
    UPDATE Application 
    SET name = ?, include = ?, effort = ?, target = ?, reportFilename = ?, properties = ?, drivers = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.include,
    updated.effort,
    updated.target,
    updated.reportFilename,
    updated.properties,
    updated.drivers,
    req.params.id
  );

  res.json({
    id: Number(req.params.id),
    ...updated,
    include: Boolean(updated.include),
    properties: JSON.parse(updated.properties || '{}'),
    drivers: JSON.parse(updated.drivers || '{}')
  });
});

// DELETE application
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM Application WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Application not found' });
  }
  res.status(204).send();
});

export default router;
