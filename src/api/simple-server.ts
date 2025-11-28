import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SmartAIRouter } from '../ai/smart-ai-router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Simple API Key Authentication
const authenticateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.HOSTINGER_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  next();
};

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Infinity AI Backend',
    email: process.env.GOOGLE_WORKSPACE_EMAIL || 'Not configured'
  });
});

// AI Chat endpoint (requires API key)
app.post('/api/ai/chat', authenticateApiKey, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiRouter = new SmartAIRouter();
    const response = await aiRouter.route(message);

    res.json({
      success: true,
      response: {
        text: response.text,
        model: response.model,
        provider: response.provider,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Infinity AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      chat: 'POST /api/ai/chat (requires X-API-Key header)'
    },
    documentation: {
      apiKey: 'Add header: X-API-Key: <your-key>',
      example: {
        url: 'POST /api/ai/chat',
        headers: { 'X-API-Key': 'your-key', 'Content-Type': 'application/json' },
        body: { message: 'Hello!' }
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║           🚀 INFINITY AI BACKEND - RUNNING 🚀                ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.GOOGLE_WORKSPACE_EMAIL || 'Not configured'}`);
  console.log(`🔑 API Key: ${process.env.HOSTINGER_API_KEY ? 'Configured ✅' : 'Not configured ⚠️'}`);
  console.log(`\n🌐 Endpoints:`);
  console.log(`   GET  /health          - Health check`);
  console.log(`   POST /api/ai/chat     - AI Chat (requires X-API-Key)`);
  console.log(`\n✨ Ready for Hostinger integration!\n`);
});

export default app;
