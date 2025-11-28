const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Key auth
const auth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.HOSTINGER_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    email: 'info@infinityxonesystems.com'
  });
});

// AI Chat
app.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    res.json({
      success: true,
      response: {
        text: 'Hello! Your API is working. Connect OpenAI/Groq for full AI responses.',
        model: 'test',
        provider: 'local',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'Infinity AI Backend',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      chat: 'POST /api/ai/chat (requires X-API-Key header)'
    }
  });
});

app.listen(PORT, () => {
  console.log('\n');
  console.log('    INFINITY AI BACKEND - RUNNING         ');
  console.log('\n');
  console.log(' Server: http://localhost:' + PORT);
  console.log(' Email: info@infinityxonesystems.com');
  console.log(' API Key: Configured\n');
  console.log(' Ready for Hostinger!\n');
});
