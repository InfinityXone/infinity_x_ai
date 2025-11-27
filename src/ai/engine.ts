import { SmartAIRouter, TaskComplexity } from './smart-ai-router.ts';
import dotenv from 'dotenv';

dotenv.config();

export class JarvisAIEngine {
  private router: SmartAIRouter;
  private model = 'claude';

  constructor() {
    this.router = new SmartAIRouter();
  }

  /**
   * Smart thinking - automatically routes to best AI
   */
  async think(prompt: string, complexity: TaskComplexity = 'medium') {
    const response = await this.router.think(prompt, complexity);
    console.log(`💡 Using ${response.provider} (${response.model})`);
    return response.text;
  }

  /**
   * Force Groq usage (free, fast)
   */
  async thinkFast(prompt: string) {
    const response = await this.router.useGroq(prompt);
    console.log(`⚡ Groq: ${response.model}`);
    return response.text;
  }

  /**
   * Force Anthropic usage (paid, powerful)
   */
  async thinkDeep(prompt: string) {
    const response = await this.router.useAnthropic(prompt);
    console.log(`🧠 Anthropic: ${response.model}`);
    return response.text;
  }

  switchModel(m: string) { 
    this.model = m; 
  }

  getAvailability() {
    return this.router.getAvailability();
  }
}