import { AutonomousSystemBuilder } from './autonomous-builder.ts';
import readline from 'readline';

console.clear();
console.log('═══════════════════════════════════════════════════════════════');
console.log('   🏗️  JARVIS AUTONOMOUS SYSTEM BUILDER');
console.log('   AI-Powered Development Assistant');
console.log('═══════════════════════════════════════════════════════════════\n');

const builder = new AutonomousSystemBuilder();
await builder.start();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\n💬 Command: ',
});

rl.prompt();

rl.on('line', async (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) { rl.prompt(); return; }

  const [cmd, ...args] = trimmed.split(' ');
  const fullArgs = args.join(' ');

  switch (cmd.toLowerCase()) {
    case 'build':
      if (fullArgs) {
        await builder.buildFeature(fullArgs);
      } else {
        console.log('❌ Usage: build <feature description>');
      }
      break;

    case 'analyze':
      await builder.analyzeCodebase();
      break;

    case 'commit':
      await builder.autoCommit(fullArgs || undefined);
      break;

    case 'create':
      console.log('Usage: Describe what file you want to create');
      break;

    case 'status':
      console.log('\n📊 Builder Status:', builder.getStatus());
      break;

    case 'exit':
    case 'quit':
      console.log('\n👋 Shutting down builder...\n');
      process.exit(0);
      break;

    default:
      // Treat unknown commands as natural language requests
      await builder.buildFeature(trimmed);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 Goodbye!\n');
  process.exit(0);
});
