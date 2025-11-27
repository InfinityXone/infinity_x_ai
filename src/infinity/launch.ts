#!/usr/bin/env node

/**
 * Infinity Evolution System Launcher
 * Launches the complete autonomous evolution cycle
 */

import { InfinityOrchestrator } from './orchestrator.ts';

console.log('🚀 Infinity Evolution System Starting...\n');

const orchestrator = new InfinityOrchestrator();

orchestrator.activate().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Infinity System stopped by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught exception:', error.message);
  console.error(error.stack);
  process.exit(1);
});
