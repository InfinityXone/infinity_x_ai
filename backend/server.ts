/**
 * INFINITY X AI - BACKEND SERVER
 * ===============================
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.includes('/health')) {
    console.log(new Date().toISOString() + ' ' + req.method + ' ' + req.path);
  }
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', healthy: true, timestamp: Date.now(), uptime: process.uptime(), version: '2.0.0' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', healthy: true, timestamp: Date.now() });
});

// Sync API routes
app.use('/api/v1/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const syncRoutes = await import('../src/api/routes/sync.js');
    syncRoutes.default(req, res, next);
  } catch (error) {
    console.error('Failed to load sync routes:', error);
    res.status(500).json({ error: 'Sync routes not available', details: String(error) });
  }
});

// Static files
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
async function startServer(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('INFINITY X AI SERVER STARTING');
  console.log('='.repeat(60) + '\n');

  app.listen(PORT, async () => {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Sync API at http://localhost:' + PORT + '/api/v1/sync/status\n');
    await initializeSystems();
  });
}

async function initializeSystems(): Promise<void> {
  // Initialize Unified Sync System
  try {
    console.log('Initializing Unified Sync System...');
    const { initializeSync } = await import('../src/sync/index.js');
    await initializeSync();
    console.log('Unified Sync System online\n');
  } catch (error) {
    console.warn('Unified Sync System init warning:', error);
  }

  // Activate Master Infinity Orchestrator if enabled
  if (process.env.MASTER_INFINITY_ENABLED === 'true') {
    console.log('Activating Master Infinity Orchestrator...');
    try {
      const { MasterInfinityOrchestrator } = await import('../src/master/master-infinity-orchestrator.js');
      const masterOrchestrator = new MasterInfinityOrchestrator();
      await masterOrchestrator.initializeFromZero();
      await masterOrchestrator.activate24_7Operation();
      console.log('Master Infinity System fully operational\n');
    } catch (error) {
      console.error('Failed to activate Master Infinity System:', error);
    }
  }

  console.log('='.repeat(60));
  console.log('INFINITY X AI SERVER READY');
  console.log('='.repeat(60) + '\n');
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;