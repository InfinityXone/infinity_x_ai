// filepath: src/index.ts
import { JarvisCore } from './jarvis/core.js';
import readline from 'readline';

/**
 * JARVIS - Just A Rather Very Intelligent System
 * Main entry point
 */

console.clear();
console.log('');
console.log('         ');
console.log('      ');
console.log('      ');
console.log('    ');
console.log('         ');
console.log('           ');
console.log('');
console.log('   Just A Rather Very Intelligent System');
console.log('   Autonomous AI Assistant v1.0');
console.log('\n');

// Initialize JARVIS
const jarvis = new JarvisCore();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\n You: ',
});

console.log('\n Commands:');
console.log('  - Type anything to chat with JARVIS');
console.log('  - /auto - Enable autonomous mode');
console.log('  - /manual - Disable autonomous mode');
console.log('  - /status - Show system status');
console.log('  - /task <description> - Assign a task');
console.log('  - /model <openai|anthropic|google> - Switch AI model');
console.log('  - /exit - Quit JARVIS\n');

// Start prompt
rl.prompt();

// Handle user input
rl.on('line', async (input: string) => {
  const trimmed = input.trim();

  if (!trimmed) {
    rl.prompt();
    return;
  }

  // Handle commands
  if (trimmed.startsWith('/')) {
    const [command, ...args] = trimmed.slice(1).split(' ');

    switch (command.toLowerCase()) {
      case 'exit':
      case 'quit':
        console.log('\n JARVIS: Goodbye! Shutting down...\n');
        process.exit(0);
        break;

      case 'auto':
        jarvis.enableAutonomousMode();
        break;

      case 'manual':
        jarvis.disableAutonomousMode();
        break;

      case 'status':
        console.log('\n System Status:', jarvis.getStatus(), '\n');
        break;

      case 'task':
        const task = args.join(' ');
        if (task) {
          await jarvis.assignTask(task);
        } else {
          console.log(' Please specify a task');
        }
        break;

      case 'model':
        const model = args[0] as 'openai' | 'anthropic' | 'google';
        if (model) {
          jarvis.switchModel(model);
        } else {
          console.log(' Please specify: openai, anthropic, or google');
        }
        break;

      default:
        console.log(` Unknown command: /${command}`);
    }
  } else {
    // Regular conversation
    await jarvis.processInput(trimmed);
  }

  rl.prompt();
});

// Handle exit
rl.on('close', () => {
  console.log('\n JARVIS: Goodbye!\n');
  process.exit(0);
});

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
});