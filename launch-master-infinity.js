/**
 * MASTER INFINITY LAUNCHER
 * Standalone launcher for 24/7 autonomous operation
 */

import dotenv from 'dotenv';
import express from 'express';

// Load environment
dotenv.config();

console.log('\n' + '═'.repeat(80));
console.log('🌀 MASTER INFINITY SYSTEM - LAUNCHER');
console.log('═'.repeat(80) + '\n');

// Create Express server
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    ts: Date.now(),
    system: 'Master Infinity',
    status: 'operational'
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}\n`);

  // Check if Master Infinity is enabled
  if (process.env.MASTER_INFINITY_ENABLED === 'true') {
    console.log('🌀 ACTIVATING MASTER INFINITY ORCHESTRATOR\n');
    console.log('═'.repeat(80));
    
    try {
      // Dynamic import to avoid TypeScript issues
      const { MasterInfinityOrchestrator } = await import('./src/master/master-infinity-orchestrator.ts');
      
      const masterOrchestrator = new MasterInfinityOrchestrator();
      
      console.log('📋 Initializing all systems from zero...\n');
      await masterOrchestrator.initializeFromZero();
      
      console.log('\n🚀 Activating 24/7 autonomous operation...\n');
      await masterOrchestrator.activate24_7();
      
      console.log('═'.repeat(80));
      console.log('✅ MASTER INFINITY SYSTEM FULLY OPERATIONAL');
      console.log('   24/7 Autonomous Mode Active');
      console.log('   Self-Regulating, Self-Improving, Self-Learning');
      console.log('═'.repeat(80) + '\n');
      
    } catch (error) {
      console.error('❌ Failed to activate Master Infinity System:', error);
      console.error('\nStack trace:', error.stack);
    }
  } else {
    console.log('⚠️  Master Infinity disabled. Set MASTER_INFINITY_ENABLED=true to activate.\n');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Master Infinity System...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Master Infinity System...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});
