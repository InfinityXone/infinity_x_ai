import { SmartAIRouter } from "./smart-ai-router.ts";
import type { TaskComplexity } from "./smart-ai-router.ts";
import dotenv from "dotenv";
dotenv.config();
export class JarvisAIEngine {
  private router: SmartAIRouter;
  private model = 'claude';
  constructor(){ this.router = new SmartAIRouter(); }
  async think(prompt: string, complexity: TaskComplexity = 'medium') {
    const response = await this.router.think(prompt, complexity);
    console.log(` Using ${response.provider} (${response.model})`);
    return response.text;
  }
  async thinkWithCopilot(prompt: string) {
    const response = await this.router.useOpenAI(prompt);
    console.log(` OpenAI/Copilot: ${response.model}`);
    return response.text;
  }
  async thinkFast(prompt: string) {
    const response = await this.router.useGroq(prompt);
    console.log(` Groq: ${response.model}`);
    return response.text;
  }
  async thinkDeep(prompt: string) {
    const response = await this.router.useAnthropic(prompt);
    console.log(` Anthropic: ${response.model}`);
    return response.text;
  }
  switchModel(m: string){ this.model = m; }
  getAvailability(){ return this.router.getAvailability(); }
}
