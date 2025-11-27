import { Router } from 'express';
import { SmartAIRouter } from '../../ai/smart-ai-router.ts';
import { authenticateToken } from './auth.ts';
import { z } from 'zod';

const router = Router();
const aiRouter = new SmartAIRouter();

// Validation schema
const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  complexity: z.enum(['light', 'medium', 'heavy']).optional(),
  context: z.string().optional()
});

// POST /api/ai/chat (protected)
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, complexity, context } = chatSchema.parse(req.body);

    const prompt = context ? `${context}\n\nUser: ${message}` : message;
    const response = await aiRouter.think(prompt, complexity || 'medium');

    res.json({
      success: true,
      response: {
        text: response.text,
        model: response.model,
        provider: response.provider,
        tokensUsed: response.tokensUsed
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/status
router.get('/status', async (req, res) => {
  try {
    const availability = aiRouter.getAvailability();

    res.json({
      status: 'operational',
      providers: {
        openai: {
          available: availability.openai,
          priority: 'primary',
          description: 'GitHub Copilot / GPT-4'
        },
        groq: {
          available: availability.groq,
          priority: 'fallback',
          description: 'Free Llama 3.3 70B'
        },
        anthropic: {
          available: availability.anthropic,
          priority: 'specialized',
          description: 'Claude Sonnet 4 (heavy reasoning)'
        }
      },
      recommendations: {
        light: aiRouter.getRecommendedProvider('light'),
        medium: aiRouter.getRecommendedProvider('medium'),
        heavy: aiRouter.getRecommendedProvider('heavy')
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/analyze-code (protected)
router.post('/analyze-code', authenticateToken, async (req, res) => {
  try {
    const { code, language } = z.object({
      code: z.string(),
      language: z.string().optional()
    }).parse(req.body);

    const prompt = `Analyze this ${language || 'code'} and provide:
1. Code quality assessment
2. Potential issues or bugs
3. Performance suggestions
4. Best practice recommendations

\`\`\`${language || 'javascript'}
${code}
\`\`\``;

    const response = await aiRouter.think(prompt, 'medium');

    res.json({
      success: true,
      analysis: response.text,
      metadata: {
        model: response.model,
        provider: response.provider,
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate-code (protected)
router.post('/generate-code', authenticateToken, async (req, res) => {
  try {
    const { description, language, framework } = z.object({
      description: z.string(),
      language: z.string().optional(),
      framework: z.string().optional()
    }).parse(req.body);

    const prompt = `Generate production-ready ${language || 'TypeScript'} code${framework ? ` using ${framework}` : ''} for: ${description}

Requirements:
- Clean, well-structured code
- Proper error handling
- Type safety
- Comments for complex logic
- Follow best practices`;

    const response = await aiRouter.think(prompt, 'heavy');

    res.json({
      success: true,
      code: response.text,
      metadata: {
        model: response.model,
        provider: response.provider,
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as aiRouter };
