import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

export class JarvisAIEngine {
  private anthropic: Anthropic;
  private currentModel = 'anthropic';

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('🤖 JARVIS AI Engine initialized');
  }

  async think(input: string, context?: string): Promise<string> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: 'You are JARVIS. Be helpful and intelligent.' + (context ? '\n' + context : ''),
        messages: [{ role: 'user', content: input }],
      });
      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error: any) {
      return 'Error: ' + error.message;
    }
  }

  getCurrentModel() { return this.currentModel; }
  switchModel(model: string) { this.currentModel = model; }
}
