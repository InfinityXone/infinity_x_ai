import { Router } from 'express';
import { authenticateToken } from './auth.ts';

const router = Router();

// GET /api/analytics/usage (protected)
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    res.json({
      usage: {
        totalRequests: 0,
        aiCalls: 0,
        tokensUsed: 0,
        averageResponseTime: 0
      },
      providers: {
        openai: { calls: 0, tokens: 0 },
        groq: { calls: 0, tokens: 0 },
        anthropic: { calls: 0, tokens: 0 }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as analyticsRouter };
