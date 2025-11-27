// filepath: src/jarvis/core.ts
import { JarvisAIEngine } from '../ai/engine.js';
import { MemoryManager } from '../ai/memory/memory-manager.js';
import { AutonomousAgent } from '../autonomous/agent.js';

/**
 * JARVIS Core System
 * Main orchestrator that brings everything together
 */
export class JarvisCore {
  private aiEngine: JarvisAIEngine;
  private memory: MemoryManager;
  private agent: AutonomousAgent;
  private conversationId: string;

  constructor() {
    console.log('\n Initializing JARVIS...');
    
    // Initialize components
    this.aiEngine = new JarvisAIEngine();
    this.memory = new MemoryManager();
    this.agent = new AutonomousAgent(this.aiEngine, this.memory);
    this.conversationId = `session_${Date.now()}`;

    console.log(' JARVIS Core initialized\n');
    this.greet();
  }

  /**
   * Greet the user
   */
  private async greet(): Promise<void> {
    const greeting = await this.aiEngine.think(
      'Greet the user as JARVIS. Be professional but friendly.',
      'You are starting up for the first time today.'
    );
    console.log(`\n JARVIS: ${greeting}\n`);
  }

  /**
   * Process user input
   */
  async processInput(input: string): Promise<string> {
    console.log(`\n User: ${input}`);

    // Add to conversation context
    this.memory.addToContext(this.conversationId, `User: ${input}`);

    // Get context for better responses
    const context = this.memory.getContext(this.conversationId).join('\n');

    // Think and respond
    const response = await this.aiEngine.think(input, context);

    // Remember response
    this.memory.addToContext(this.conversationId, `JARVIS: ${response}`);

    console.log(`\n JARVIS: ${response}\n`);
    return response;
  }

  /**
   * Enable autonomous mode
   */
  enableAutonomousMode(): void {
    this.agent.activate();
  }

  /**
   * Disable autonomous mode
   */
  disableAutonomousMode(): void {
    this.agent.deactivate();
  }

  /**
   * Add a task for JARVIS to complete
   */
  async assignTask(task: string): Promise<void> {
    await this.agent.addTask(task);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      conversation: this.conversationId,
      agent: this.agent.getStatus(),
      model: this.aiEngine.getCurrentModel(),
    };
  }

  /**
   * Switch AI model
   */
  switchModel(model: 'openai' | 'anthropic' | 'google'): void {
    this.aiEngine.switchModel(model);
  }
}