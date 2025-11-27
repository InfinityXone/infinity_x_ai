#!/usr/bin/env node

/**
 * Infinity Quantum Mind CLI
 * Command-line interface for the Quantum Mind system
 */

import { InfinityQuantumMind } from './quantum-mind.ts';
import { IdeaCategory } from './idea-generator.ts';

async function main() {
  const quantumMind = new InfinityQuantumMind();
  await quantumMind.activate();

  console.log('🎯 SELECT IDEA CATEGORY:\n');
  console.log('1. 💻 System Architecture Ideas');
  console.log('2. 💼 Business Ideas');
  console.log('3. 💰 Financial Growth Strategies');
  console.log('4. 🤖 Intelligent/AI System Ideas\n');

  // Default: Run intelligent system ideas
  const category: IdeaCategory = 'intelligent';
  const context = 'Next-generation AI development platform';

  console.log(`Running Quantum Mind for: ${category.toUpperCase()}`);
  console.log(`Context: ${context}\n`);

  try {
    const result = await quantumMind.quantumWorkflow(category, context);

    if (result.readyForImplementation) {
      console.log('\n🚀 Idea approved! Ready for auto-implementation.');
      console.log('   Run with --implement flag to auto-build this system.\n');
      
      // Auto-implement if flag provided
      if (process.argv.includes('--implement')) {
        await quantumMind.autoImplement(result);
      }
    } else {
      console.log('\n⚠️  Idea requires further review before implementation.\n');
    }

  } catch (error: any) {
    console.error('\n❌ Quantum Mind Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
