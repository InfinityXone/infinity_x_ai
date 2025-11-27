import { Router } from 'express';
import { authenticateToken } from './auth.ts';

const router = Router();

// GET /api/governance/status (protected)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    res.json({
      status: 'active',
      subsystems: {
        openSource: {
          active: true,
          projects: 0,
          proposals: 0
        },
        financial: {
          active: true,
          budgets: 0,
          totalAllocated: 0,
          healthScore: 90
        },
        compliance: {
          active: true,
          rules: 4,
          violations: 0
        },
        preservation: {
          active: true,
          healthStatus: 'healthy',
          backups: 0
        },
        optimization: {
          active: true,
          targets: 0,
          insights: 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as governanceRouter };
