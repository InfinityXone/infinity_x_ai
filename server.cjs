const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const auth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.HOSTINGER_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    email: 'info@infinityxonesystems.com'
  });
});

app.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    res.json({
      success: true,
      response: {
        text: 'API is working! Message received: ' + message,
        model: 'test-mode',
        provider: 'local',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    service: 'Infinity AI Backend',
    status: 'running',
    email: 'info@infinityxonesystems.com',
    apiKey: 'infinity-ai-chat-key-2025-secure-token-change-in-production',
    endpoints: { health: 'GET /health', chat: 'POST /api/ai/chat' }
  });
});

app.listen(PORT, () => {
  console.log('\n');
  console.log('    INFINITY AI - RUNNING                ');
  console.log('\n');
  console.log(' http://localhost:' + PORT);
  console.log(' info@infinityxonesystems.com');
  console.log(' infinity-ai-chat-key-2025-secure-token-change-in-production\n');
});
