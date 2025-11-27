import { JarvisAIEngine } from '../ai/engine.ts';
import { MemoryManager } from '../ai/memory/memory-manager.ts';

export class AutonomousAgent {
  private aiEngine: JarvisAIEngine;
  private memory: MemoryManager;
  private isActive = false;
  private currentTask: string | null = null;

  constructor(aiEngine: JarvisAIEngine, memory: MemoryManager) {
    this.aiEngine = aiEngine;
    this.memory = memory;
    console.log('🤖 Autonomous Agent initialized');
  }

  activate() {
    this.isActive = true;
    console.log('✅ Autonomous mode ACTIVATED');
  }

  deactivate() {
    this.isActive = false;
    console.log('⏸️ Autonomous mode DEACTIVATED');
  }

  async addTask(task: string) {
    const tasks = (await this.memory.loadFromLongTerm('pending_tasks')) || [];
    tasks.push(task);
    await this.memory.saveToLongTerm('pending_tasks', tasks);
    console.log('➕ Task added: ' + task);
  }

  getStatus() {
    return {
      isActive: this.isActive,
      currentTask: this.currentTask,
      model: this.aiEngine.getCurrentModel(),
    };
  }
}
