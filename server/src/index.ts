import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db';
import applicationsRouter from './routes/applications';
import appTypesRouter from './routes/appTypes';
import appPropertiesRouter from './routes/appProperties';
import modDriversRouter from './routes/modDrivers';
import assessmentsRouter from './routes/assessments';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/applications', applicationsRouter);
app.use('/api/app-types', appTypesRouter);
app.use('/api/app-properties', appPropertiesRouter);
app.use('/api/mod-drivers', modDriversRouter);
app.use('/api/assessments', assessmentsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve static files from client build
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientPath));
  
  // SPA fallback - serve index.html for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// Initialize database (seeds automatically on first launch)
console.log('Initializing database...');
initializeDatabase();
console.log('Database initialized');

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
