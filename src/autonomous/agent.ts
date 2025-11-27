// filepath: src/autonomous/agent.ts
import { JarvisAIEngine } from '../ai/engine.js';
import { MemoryManager } from '../ai/memory/memory-manager.js';

/**
 * JARVIS Autonomous Agent
 * Makes decisions and executes tasks independently
 */
export class AutonomousAgent {
  private aiEngine: JarvisAIEngine;
  private memory: MemoryManager;
  private isActive: boolean = false;
  private currentTask: string | null = null;

  constructor(aiEngine: JarvisAIEngine, memory: MemoryManager) {
    this.aiEngine = aiEngine;
    this.memory = memory;
    console.log(' Autonomous Agent initialized');
  }

  /**
   * Activate autonomous mode
   */
  activate(): void {
    this.isActive = true;
    console.log('✅ Autonomous mode ACTIVATED');
    this.startThinking();
  }

  /**
   * Deactivate autonomous mode
   */
  deactivate(): void {
    this.isActive = false;
    console.log(' Autonomous mode DEACTIVATED');
  }

  /**
   * Main autonomous thinking loop
   */
  private async startThinking(): Promise<void> {
    while (this.isActive) {
      try {
        await this.autonomousCycle();
        await this.sleep(5000); // Think every 5 seconds
      } catch (error) {
        console.error(' Error in autonomous cycle:', error);
      }
    }
  }

  /**
   * Single autonomous cycle
   */
  private async autonomousCycle(): Promise<void> {
    // Check if there are pending tasks
    const tasks = await this.memory.loadFromLongTerm('pending_tasks');
    
    if (tasks && tasks.length > 0) {
      const task = tasks[0];
      await this.executeTask(task);
    } else {
      // No tasks - analyze environment
      await this.analyzeEnvironment();
    }
  }

  /**
   * Execute a task
   */
  async executeTask(task: string): Promise<void> {
    console.log(`\n Executing task: ${task}`);
    this.currentTask = task;

    try {
      const result = await this.aiEngine.think(
        `Execute this task: ${task}. Provide a detailed plan and execution steps.`
      );

      console.log(' Task result:', result);
      
      // Save result to memory
      await this.memory.saveToLongTerm(`task_result_${Date.now()}`, {
        task,
        result,
        completedAt: new Date().toISOString(),
      });

      // Remove from pending tasks
      const tasks = await this.memory.loadFromLongTerm('pending_tasks');
      if (tasks) {
        const updatedTasks = tasks.filter((t: string) => t !== task);
        await this.memory.saveToLongTerm('pending_tasks', updatedTasks);
      }

      console.log('✅ Task completed');
    } catch (error) {
      console.error('❌ Task failed:', error);
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * Analyze environment for new tasks
   */
  private async analyzeEnvironment(): Promise<void> {
    console.log(' Analyzing environment...');
    
    const analysis = await this.aiEngine.think(
      'Analyze the current state and suggest any improvements or tasks that should be done.'
    );

    console.log(' Analysis:', analysis);
  }

  /**
   * Add a task to the queue
   */
  async addTask(task: string): Promise<void> {
    const tasks = (await this.memory.loadFromLongTerm('pending_tasks')) || [];
    tasks.push(task);
    await this.memory.saveToLongTerm('pending_tasks', tasks);
    console.log(` Task added: ${task}`);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      currentTask: this.currentTask,
      model: this.aiEngine.getCurrentModel(),
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}