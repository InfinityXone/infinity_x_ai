/**
 * SYNC API ROUTES
 * ================
 * REST API endpoints for Hostinger Horizons dashboard
 * and external system synchronization.
 * 
 * Endpoints:
 * - GET  /api/v1/sync/status     - Get unified sync status
 * - GET  /api/v1/sync/dashboard  - Get full dashboard data
 * - POST /api/v1/sync/command    - Dispatch command
 * - POST /api/v1/sync/webhook    - Receive webhooks
 * - GET  /api/v1/sync/events     - Get recent events
 * - POST /api/v1/sync/force      - Force full sync
 * - GET  /api/v1/sync/firebase   - Get Firebase credentials for Horizons
 */

import { Router, Request, Response } from 'express';
import { unifiedSync, initializeSync } from '../sync/unified-sync-orchestrator';

const router = Router();

// ============================================================
// INITIALIZATION
// ============================================================

let syncInitialized = false;

async function ensureSyncInitialized(): Promise<void> {
  if (!syncInitialized) {
    try {
      await initializeSync();
      syncInitialized = true;
    } catch (error) {
      console.error('Failed to initialize sync:', error);
    }
  }
}

// ============================================================
// MIDDLEWARE
// ============================================================

// Initialize sync on first request
router.use(async (req, res, next) => {
  await ensureSyncInitialized();
  next();
});

// API Key validation for sensitive endpoints
const validateApiKey = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const validKey = process.env.HOSTINGER_API_KEY;

  // Allow requests without auth in development or if no key configured
  if (!validKey || process.env.NODE_ENV === 'development') {
    return next();
  }

  if (apiKey !== validKey) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }

  next();
};

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================

/**
 * GET /api/v1/sync/status
 * Get current sync status (public)
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await unifiedSync.getStatus();
    res.json({
      success: true,
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * GET /api/v1/sync/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = await unifiedSync.getStatus();
    const healthy = status.orchestratorOnline && status.syncHealth >= 50;
    
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      syncHealth: status.syncHealth,
      gemini: status.geminiStatus,
      hostinger: status.hostingerStatus,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: String(error)
    });
  }
});

// ============================================================
// AUTHENTICATED ENDPOINTS
// ============================================================

/**
 * GET /api/v1/sync/dashboard
 * Get full dashboard data for Hostinger Horizons
 */
router.get('/dashboard', validateApiKey, async (req: Request, res: Response) => {
  try {
    const data = await unifiedSync.getDashboardData();
    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * GET /api/v1/sync/firebase
 * Get Firebase credentials for Horizons realtime connection
 */
router.get('/firebase', validateApiKey, async (req: Request, res: Response) => {
  try {
    // Return Firebase config for client-side initialization
    const config = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'infinity-x-one-systems',
      apiKey: process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY || '',
      authDomain: `${process.env.GOOGLE_CLOUD_PROJECT_ID || 'infinity-x-one-systems'}.firebaseapp.com`,
      storageBucket: `${process.env.GOOGLE_CLOUD_PROJECT_ID || 'infinity-x-one-systems'}.appspot.com`,
      // Only include these if available
      ...(process.env.FIREBASE_MESSAGING_SENDER_ID && {
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
      }),
      ...(process.env.FIREBASE_APP_ID && {
        appId: process.env.FIREBASE_APP_ID
      })
    };

    res.json({
      success: true,
      data: {
        config,
        collections: {
          systemLogs: 'system_logs',
          agentStatus: 'agent_status',
          commandsQueue: 'commands_queue',
          codeArtifacts: 'code_artifacts',
          cloudResources: 'cloud_resources',
          workspaceDocuments: 'workspace_documents'
        },
        realtime: {
          enabled: !!config.apiKey,
          instructions: 'Use these credentials to initialize Firebase in Hostinger Horizons'
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * POST /api/v1/sync/command
 * Dispatch a command through the unified orchestrator
 */
router.post('/command', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { target, type, payload, priority = 'normal' } = req.body;

    if (!target || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: target, type'
      });
    }

    let result: any;

    switch (target) {
      case 'gemini':
        const commandId = await unifiedSync.dispatchToGemini(type, payload, priority);
        result = { commandId, status: 'queued' };
        break;

      case 'hostinger':
        await unifiedSync.pushToHostinger({ type, payload, priority });
        result = { status: 'sent' };
        break;

      case 'system':
        // Handle system commands
        if (type === 'force-sync') {
          await unifiedSync.forceFullSync();
          result = { status: 'sync-complete' };
        } else if (type === 'register-agent') {
          unifiedSync.registerAgent(payload.agentId, payload.status || 'active');
          result = { status: 'agent-registered' };
        } else {
          return res.status(400).json({
            success: false,
            error: `Unknown system command: ${type}`
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown target: ${target}. Valid targets: gemini, hostinger, system`
        });
    }

    res.json({
      success: true,
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * POST /api/v1/sync/webhook
 * Receive webhooks from Hostinger Horizons
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string || '';
    const payload = req.body;

    // Import hostinger sync manager
    const { hostingerSync } = await import('../sync/hostinger-sync-manager');
    
    const result = await hostingerSync.handleWebhook(payload, signature);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * GET /api/v1/sync/events
 * Get recent sync events
 */
router.get('/events', validateApiKey, async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 50;
    const events = unifiedSync.getRecentEvents(Math.min(count, 200));

    res.json({
      success: true,
      data: {
        events,
        total: events.length
      },
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * POST /api/v1/sync/force
 * Force full sync across all systems
 */
router.post('/force', validateApiKey, async (req: Request, res: Response) => {
  try {
    await unifiedSync.forceFullSync();

    const status = await unifiedSync.getStatus();

    res.json({
      success: true,
      data: {
        message: 'Full sync completed',
        status
      },
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * POST /api/v1/sync/updates
 * Receive batch updates (for Hostinger push)
 */
router.post('/updates', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { updates, projectId } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates must be an array'
      });
    }

    // Process updates
    for (const update of updates) {
      // Log each update as an event
      unifiedSync.registerAgent(update.source || 'external', 'active');
    }

    res.json({
      success: true,
      data: {
        processed: updates.length
      },
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * GET /api/v1/sync/commands
 * Get pending commands for agents
 */
router.get('/commands', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { agentId, since } = req.query;

    const directives = agentId 
      ? unifiedSync.getAgentDirectives(agentId as string)
      : [];

    res.json({
      success: true,
      data: {
        commands: directives,
        total: directives.length
      },
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * POST /api/v1/sync/agent/heartbeat
 * Agent heartbeat endpoint
 */
router.post('/agent/heartbeat', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { agentId, status, metrics } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'agentId is required'
      });
    }

    unifiedSync.agentHeartbeat(agentId, status);

    // Get directives for this agent
    const directives = unifiedSync.getAgentDirectives(agentId);

    res.json({
      success: true,
      data: {
        acknowledged: true,
        directives,
        serverTime: Date.now()
      },
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

/**
 * POST /api/v1/sync/directive/complete
 * Mark a directive as completed
 */
router.post('/directive/complete', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { agentId, directiveId, result } = req.body;

    if (!agentId || !directiveId) {
      return res.status(400).json({
        success: false,
        error: 'agentId and directiveId are required'
      });
    }

    unifiedSync.completeDirective(agentId, directiveId);

    res.json({
      success: true,
      data: {
        completed: directiveId
      },
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

export default router;
