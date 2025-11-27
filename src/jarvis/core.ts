import { JarvisAIEngine } from '../ai/engine.ts';
import { MemoryManager } from '../ai/memory/memory-manager.ts';
import { AutonomousAgent } from '../autonomous/agent.ts';

export class JarvisCore {
  private aiEngine: JarvisAIEngine;
  private memory: MemoryManager;
  private agent: AutonomousAgent;
  private conversationId: string;

  constructor() {
    console.log('\n🚀 Initializing JARVIS...');
    this.aiEngine = new JarvisAIEngine();
    this.memory = new MemoryManager();
    this.agent = new AutonomousAgent(this.aiEngine, this.memory);
    this.conversationId = 'session_' + Date.now();
    console.log('✅ JARVIS Core initialized\n');
    this.greet();
  }

  private async greet() {
    const greeting = await this.aiEngine.think('Greet the user as JARVIS.');
    console.log('\n🤖 JARVIS: ' + greeting + '\n');
  }

  async processInput(input: string) {
    console.log('\n👤 User: ' + input);
    this.memory.addToContext(this.conversationId, 'User: ' + input);
    const context = this.memory.getContext(this.conversationId).join('\n');
    const response = await this.aiEngine.think(input, context);
    this.memory.addToContext(this.conversationId, 'JARVIS: ' + response);
    console.log('\n🤖 JARVIS: ' + response + '\n');
    return response;
  }

  enableAutonomousMode() { this.agent.activate(); }
  disableAutonomousMode() { this.agent.deactivate(); }
  async assignTask(task: string) { await this.agent.addTask(task); }
  getStatus() {
    return {
      conversation: this.conversationId,
      agent: this.agent.getStatus(),
      model: this.aiEngine.getCurrentModel(),
    };
  }
  switchModel(model: string) { this.aiEngine.switchModel(model); }
}
