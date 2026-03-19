import { Router } from 'express';
import db from '../db';
import { loadApplications } from '../seed';

const router = Router();

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

export default router;
