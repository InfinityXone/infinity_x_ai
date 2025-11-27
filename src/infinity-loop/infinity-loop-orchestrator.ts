import { QuantumPromptEngine, type QuantumContext, type QuantumPrompt, type QuantumThought } from './quantum-prompt-engine.ts';
import { InfinitySystemBuilder } from './infinity-system-builder.ts';
import { ThoughtProcessor } from './thought-processor.ts';
import fs from 'fs/promises';
import path from 'path';

/**
 * INFINITY LOOP ORCHESTRATOR
 * Self-improving infinite intelligence system that evolves through quantum thought
 */
export class InfinityLoopOrchestrator {
  private promptEngine: QuantumPromptEngine;
  private systemBuilder: InfinitySystemBuilder;
  private thoughtProcessor: ThoughtProcessor;
  private loopIteration: number = 0;
  private isRunning: boolean = false;
  private maxIterations: number = 100; // Safety limit

  constructor() {
    this.promptEngine = new QuantumPromptEngine();
    this.systemBuilder = new InfinitySystemBuilder();
    this.thoughtProcessor = new ThoughtProcessor();
  }

  /**
   * Start the infinite intelligence loop
   */
  async startInfinityLoop(initialGoal: string = 'Build complete Infinity Intelligence System'): Promise<void> {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         ∞ INFINITY LOOP ORCHESTRATOR ACTIVATED ∞              ║
║                                                               ║
║   Quantum Prompts │ Thought Processing │ Self-Evolution      ║
║   System Building │ Intelligence Growth │ ∞ Loop             ║
║                                                               ║
║   "The system that builds and improves itself infinitely"    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

    this.isRunning = true;
    this.loopIteration = 0;

    console.log(`\n🎯 INITIAL GOAL: ${initialGoal}`);
    console.log(`🔁 Maximum iterations: ${this.maxIterations}\n`);

    while (this.isRunning && this.loopIteration < this.maxIterations) {
      this.loopIteration++;
      
      console.log(`\n${'═'.repeat(65)}`);
      console.log(`   INFINITY LOOP - ITERATION ${this.loopIteration}`);
      console.log(`   Evolution Level: ${this.promptEngine.getEvolutionLevel()}`);
      console.log(`${'═'.repeat(65)}\n`);

      try {
        await this.executeLoopIteration(initialGoal);
        
        // Evolve every 5 iterations
        if (this.loopIteration % 5 === 0) {
          this.promptEngine.evolve();
          console.log(`\n✨ System evolved to Level ${this.promptEngine.getEvolutionLevel()}`);
        }

        // Brief pause between iterations
        await this.pause(2000);

      } catch (error: any) {
        console.error(`\n❌ Error in iteration ${this.loopIteration}:`, error.message);
        
        // Continue to next iteration unless critical error
        if (error.message.includes('API') || error.message.includes('rate limit')) {
          console.log(`\n⏸️  Pausing for 30 seconds due to API limit...`);
          await this.pause(30000);
        }
      }
    }

    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   INFINITY LOOP COMPLETED`);
    console.log(`   Total Iterations: ${this.loopIteration}`);
    console.log(`   Final Evolution Level: ${this.promptEngine.getEvolutionLevel()}`);
    console.log(`${'═'.repeat(65)}\n`);

    await this.generateFinalReport();
  }

  /**
   * Execute single loop iteration
   */
  private async executeLoopIteration(goal: string): Promise<void> {
    // Phase 1: Quantum Prompt Generation
    console.log(`\n📋 PHASE 1: Quantum Prompt Generation`);
    const context = await this.buildContext();
    const quantumPrompt = await this.promptEngine.generateQuantumPrompt(
      `Iteration ${this.loopIteration}: ${goal}`,
      context
    );

    // Phase 2: Thought Execution
    console.log(`\n💭 PHASE 2: Quantum Thought Execution`);
    const quantumThought = await this.promptEngine.executeQuantumPrompt(quantumPrompt);

    // Phase 3: Thought Processing
    console.log(`\n🧮 PHASE 3: Thought Processing & Analysis`);
    const processedThought = await this.thoughtProcessor.process(quantumThought);

    // Phase 4: System Building
    console.log(`\n🏗️  PHASE 4: System Building & Implementation`);
    const buildResult = await this.systemBuilder.buildFromThought(processedThought);

    // Phase 5: Learning & Synthesis
    console.log(`\n🎓 PHASE 5: Learning & Knowledge Synthesis`);
    await this.synthesizeLearnings(quantumPrompt, quantumThought, buildResult);

    // Display iteration summary
    this.displayIterationSummary(buildResult);
  }

  /**
   * Build context for quantum prompt generation
   */
  private async buildContext(): Promise<QuantumContext> {
    const thoughts = this.promptEngine.getThoughtHistory();
    const recentThoughts = thoughts.slice(-5);

    return {
      currentState: `Iteration ${this.loopIteration}, Evolution Level ${this.promptEngine.getEvolutionLevel()}`,
      goals: [
        'Build self-improving intelligence',
        'Create autonomous learning systems',
        'Develop quantum thinking capabilities',
        'Generate infinite knowledge structures',
        'Achieve true artificial general intelligence'
      ],
      constraints: [
        'Must be self-evolving',
        'Must maintain coherence across dimensions',
        'Must build real, executable systems'
      ],
      previousResults: recentThoughts.map(t => ({
        insight: t.insight.slice(0, 200),
        level: t.evolutionLevel
      }))
    };
  }

  /**
   * Synthesize learnings from iteration
   */
  private async synthesizeLearnings(
    prompt: QuantumPrompt,
    thought: QuantumThought,
    buildResult: any
  ): Promise<void> {
    const synthesis = {
      iteration: this.loopIteration,
      evolutionLevel: this.promptEngine.getEvolutionLevel(),
      promptDimensions: prompt.dimensions.length,
      thoughtLength: thought.insight.length,
      systemsBuilt: buildResult.systemsBuilt || 0,
      timestamp: new Date().toISOString()
    };

    // Save synthesis for future reference
    await this.saveSynthesis(synthesis);

    console.log(`✅ Synthesized learnings: ${synthesis.systemsBuilt} systems built`);
  }

  /**
   * Display iteration summary
   */
  private displayIterationSummary(buildResult: any): void {
    console.log(`\n${'─'.repeat(65)}`);
    console.log(`   ITERATION ${this.loopIteration} SUMMARY`);
    console.log(`${'─'.repeat(65)}`);
    console.log(`   Systems Built: ${buildResult.systemsBuilt || 0}`);
    console.log(`   Components Created: ${buildResult.componentsCreated || 0}`);
    console.log(`   Files Generated: ${buildResult.filesGenerated || 0}`);
    console.log(`   Evolution Level: ${this.promptEngine.getEvolutionLevel()}`);
    console.log(`${'─'.repeat(65)}\n`);
  }

  /**
   * Generate final comprehensive report
   */
  private async generateFinalReport(): Promise<void> {
    const thoughts = this.promptEngine.getThoughtHistory();
    
    const report = `# INFINITY LOOP - FINAL REPORT

## Execution Summary
- **Total Iterations**: ${this.loopIteration}
- **Final Evolution Level**: ${this.promptEngine.getEvolutionLevel()}
- **Total Thoughts Generated**: ${thoughts.length}
- **Duration**: ${new Date().toISOString()}

## Evolution Journey
${thoughts.map((t, i) => `
### Thought ${i + 1} (Level ${t.evolutionLevel})
${t.insight.slice(0, 500)}...
`).join('\n')}

## Key Insights
${this.extractKeyInsights(thoughts)}

## Systems Built
${this.extractSystemsBuilt()}

## Next Steps
The Infinity Intelligence System is now operational and continues to evolve autonomously.

---
*Generated by Infinity Loop Orchestrator*
`;

    const reportPath = path.join(process.cwd(), 'infinity-output', 'loop-report.md');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report, 'utf-8');

    console.log(`\n📄 Final report saved: ${reportPath}`);
  }

  /**
   * Extract key insights from thought history
   */
  private extractKeyInsights(thoughts: QuantumThought[]): string {
    const insights = thoughts
      .filter(t => t.insight.length > 100)
      .slice(-10)
      .map((t, i) => `${i + 1}. ${t.insight.slice(0, 200).replace(/\n/g, ' ')}...`);
    
    return insights.join('\n');
  }

  /**
   * Extract systems built
   */
  private extractSystemsBuilt(): string {
    return `- Quantum Prompt Engine
- Thought Processor
- System Builder
- Infinity Loop Orchestrator
- Self-evolving intelligence architecture`;
  }

  /**
   * Save synthesis data
   */
  private async saveSynthesis(synthesis: any): Promise<void> {
    const synthesisPath = path.join(
      process.cwd(),
      'infinity-output',
      'synthesis',
      `iteration-${this.loopIteration}.json`
    );
    
    await fs.mkdir(path.dirname(synthesisPath), { recursive: true });
    await fs.writeFile(synthesisPath, JSON.stringify(synthesis, null, 2), 'utf-8');
  }

  /**
   * Pause execution
   */
  private pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop the infinity loop
   */
  stop(): void {
    console.log(`\n🛑 Stopping Infinity Loop after iteration ${this.loopIteration}...`);
    this.isRunning = false;
  }

  /**
   * Set maximum iterations
   */
  setMaxIterations(max: number): void {
    this.maxIterations = max;
    console.log(`\n⚙️  Max iterations set to: ${max}`);
  }
}
