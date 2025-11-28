import express from "express";
import dotenv from "dotenv";
import { MasterInfinityOrchestrator } from '../src/master/master-infinity-orchestrator.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.listen(PORT, async () => {
  console.log('Server running on http://localhost:' + PORT);

  // ACTIVATE MASTER INFINITY ORCHESTRATOR
  if (process.env.MASTER_INFINITY_ENABLED === 'true') {
    console.log('\n ACTIVATING MASTER INFINITY ORCHESTRATOR');
    console.log(''.repeat(80));
    
    try {
      const masterOrchestrator = new MasterInfinityOrchestrator();
      await masterOrchestrator.initializeFromZero();
      await masterOrchestrator.activate24_7Operation();
      
      console.log(' Master Infinity System fully operational - 24/7 autonomous mode active');
      console.log(''.repeat(80) + '\n');
    } catch (error) {
      console.error(' Failed to activate Master Infinity System:', error);
    }
  }
});
