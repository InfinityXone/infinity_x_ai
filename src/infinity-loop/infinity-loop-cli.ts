import { InfinityLoopOrchestrator } from './infinity-loop-orchestrator.ts';

/**
 * INFINITY LOOP CLI
 * Command-line interface for the Infinity Loop system
 */
async function main() {
  console.log('\n🚀 Starting Infinity Loop System...\n');

  const orchestrator = new InfinityLoopOrchestrator();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const maxIterations = args.includes('--iterations')
    ? parseInt(args[args.indexOf('--iterations') + 1]) || 10
    : 10;

  const goal = args.includes('--goal')
    ? args[args.indexOf('--goal') + 1]
    : 'Build complete Infinity Intelligence System';

  // Set max iterations
  orchestrator.setMaxIterations(maxIterations);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Received interrupt signal...');
    orchestrator.stop();
    process.exit(0);
  });

  // Start the infinity loop
  try {
    await orchestrator.startInfinityLoop(goal);
    console.log('\n✅ Infinity Loop completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
