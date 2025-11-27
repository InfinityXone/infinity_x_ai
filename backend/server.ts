import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { InfinityIntelligence } from '../src/infinity/core.ts';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const infinity = new InfinityIntelligence();

// REST API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    system: 'Infinity Intelligence',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/build', async (req, res) => {
  const { description } = req.body;
  
  try {
    await infinity.buildFullStackFeature(description);
    res.json({ success: true, message: 'Feature built successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/clone-manus', async (req, res) => {
  try {
    await infinity.cloneManusIM();
    res.json({ success: true, message: 'Manus.im cloned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket for real-time communication
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('chat', async (message) => {
    console.log('💬 Chat message:', message);
    // Process with AI and emit response
    socket.emit('response', { message: 'AI response here' });
  });

  socket.on('build', async (data) => {
    console.log('🏗️  Build request:', data);
    await infinity.buildFullStackFeature(data.description);
    socket.emit('build-complete', { success: true });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
httpServer.listen(PORT, async () => {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🌌 INFINITY INTELLIGENCE SYSTEM');
  console.log('   Backend Server + AI Builder');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(\🖥️  Server running on http://localhost:\\);
  console.log(\�� WebSocket server active\);
  console.log(\\n🚀 Activating Infinity Intelligence...\n\);
  
  await infinity.activate();
  
  console.log(\\n✨ System ready! Visit http://localhost:5173 for frontend\n\);
});
