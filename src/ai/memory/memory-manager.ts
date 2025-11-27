import fs from 'fs/promises';  
export class MemoryManager {  
  private memory = new Map();  
  async remember(key: string, value: string) { this.memory.set(key, value); }  
  async recall(key: string) { return this.memory.get(key); }  
}  
