<<<<<<< HEAD
﻿import fs from 'fs/promises';
import path from 'path';

export class MemoryManager {
  private shortTermMemory = new Map<string, any>();
  private memoryPath = '.jarvis/memory';

  constructor() {
=======
// filepath: src/ai/memory/memory-manager.ts
import fs from 'fs/promises';
import path from 'path';

/**
 * JARVIS Memory System
 * Manages short-term and long-term memory
 */
export class MemoryManager {
  private shortTermMemory: Map<string, any> = new Map();
  private memoryPath: string;

  constructor(memoryPath: string = '.jarvis/memory') {
    this.memoryPath = memoryPath;
>>>>>>> a3c801c11e277fac1ff7640942b29250df624eaa
    this.initialize();
  }

  private async initialize() {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      console.log('🧠 Memory system initialized');
<<<<<<< HEAD
    } catch {}
  }

  remember(key: string, value: any) {
    this.shortTermMemory.set(key, { value, timestamp: Date.now() });
  }

  recall(key: string) {
    const memory = this.shortTermMemory.get(key);
    return memory ? memory.value : null;
  }

  async saveToLongTerm(key: string, value: any) {
    try {
      await fs.writeFile(
        path.join(this.memoryPath, key + '.json'),
        JSON.stringify({ value, timestamp: Date.now() })
      );
    } catch {}
  }

  async loadFromLongTerm(key: string) {
    try {
      const data = await fs.readFile(path.join(this.memoryPath, key + '.json'), 'utf-8');
      return JSON.parse(data).value;
    } catch {
=======
    } catch (error) {
      console.error('❌ Failed to initialize memory:', error);
    }
  }

  /**
   * Store in short-term memory
   */
  remember(key: string, value: any): void {
    this.shortTermMemory.set(key, {
      value,
      timestamp: Date.now(),
    });
    console.log(`💭 Remembered: ${key}`);
  }

  /**
   * Retrieve from short-term memory
   */
  recall(key: string): any {
    const memory = this.shortTermMemory.get(key);
    if (memory) {
      console.log(`🔍 Recalled: ${key}`);
      return memory.value;
    }
    return null;
  }

  /**
   * Store in long-term memory (persistent)
   */
  async saveToLongTerm(key: string, value: any): Promise<void> {
    try {
      const filePath = path.join(this.memoryPath, `${key}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify({ value, timestamp: Date.now() }, null, 2)
      );
      console.log(`💾 Saved to long-term memory: ${key}`);
    } catch (error) {
      console.error('❌ Failed to save to long-term memory:', error);
    }
  }

  /**
   * Retrieve from long-term memory
   */
  async loadFromLongTerm(key: string): Promise<any> {
    try {
      const filePath = path.join(this.memoryPath, `${key}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const memory = JSON.parse(data);
      console.log(`📂 Loaded from long-term memory: ${key}`);
      return memory.value;
    } catch (error) {
      console.log(`ℹ️ No long-term memory found for: ${key}`);
>>>>>>> a3c801c11e277fac1ff7640942b29250df624eaa
      return null;
    }
  }

<<<<<<< HEAD
  getContext(id: string): string[] {
    return this.recall('conversation_' + id) || [];
  }

  addToContext(id: string, message: string) {
    const context = this.getContext(id);
    context.push(message);
    if (context.length > 10) context.shift();
    this.remember('conversation_' + id, context);
  }

  clearShortTerm() {
    this.shortTermMemory.clear();
  }
}
=======
  /**
   * Get conversation context
   */
  getContext(conversationId: string): string[] {
    const context = this.recall(`conversation_${conversationId}`);
    return context || [];
  }

  /**
   * Add to conversation context
   */
  addToContext(conversationId: string, message: string): void {
    const context = this.getContext(conversationId);
    context.push(message);
    
    // Keep only last 10 messages
    if (context.length > 10) {
      context.shift();
    }
    
    this.remember(`conversation_${conversationId}`, context);
  }

  /**
   * Clear short-term memory
   */
  clearShortTerm(): void {
    this.shortTermMemory.clear();
    console.log('🧹 Short-term memory cleared');
  }
}
>>>>>>> a3c801c11e277fac1ff7640942b29250df624eaa
