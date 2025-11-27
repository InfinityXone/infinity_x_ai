import fs from 'fs/promises';
import path from 'path';

export class MemoryManager {
  private shortTermMemory = new Map<string, any>();
  private memoryPath = '.jarvis/memory';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      console.log('🧠 Memory system initialized');
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
      return null;
    }
  }

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
