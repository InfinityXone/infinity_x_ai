import { JarvisCore } from './jarvis/core.ts';
import readline from 'readline';

console.clear();
console.log('═══════════════════════════════════════════════════════════════');
console.log('   ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗');
console.log('   ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝');
console.log('   ██║███████║██████╔╝██║   ██║██║███████╗');
console.log('   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║');
console.log('   ██║██║  ██║██║  ██║ ╚████╔╝ ██║███████║');
console.log('   ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝');
console.log('');
console.log('   Just A Rather Very Intelligent System');
console.log('   Autonomous AI Assistant v1.0');
console.log('═══════════════════════════════════════════════════════════════\n');

const jarvis = new JarvisCore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\n💬 You: ',
});

console.log('\n📝 Commands:');
console.log('  /auto - Enable autonomous mode');
console.log('  /status - Show system status');
console.log('  /exit - Quit JARVIS\n');

rl.prompt();

rl.on('line', async (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) { rl.prompt(); return; }

  if (trimmed.startsWith('/')) {
    const [cmd, ...args] = trimmed.slice(1).split(' ');
    switch (cmd) {
      case 'exit': console.log('\n👋 Goodbye!\n'); process.exit(0);
      case 'auto': jarvis.enableAutonomousMode(); break;
      case 'manual': jarvis.disableAutonomousMode(); break;
      case 'status': console.log('\n📊', jarvis.getStatus(), '\n'); break;
      case 'task': await jarvis.assignTask(args.join(' ')); break;
      default: console.log('❌ Unknown command');
    }
  } else {
    await jarvis.processInput(trimmed);
  }
  rl.prompt();
});
