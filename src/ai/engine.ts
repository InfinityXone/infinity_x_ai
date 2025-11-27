import Anthropic from '@anthropic-ai/sdk';  
import dotenv from 'dotenv';  
dotenv.config();  
export class JarvisAIEngine {  
  private client: Anthropic;  
  private model = 'claude';  
  constructor() {  
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not found in .env');  
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });  
  }  
  async think(prompt: string) {  
    const response = await this.client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] });  
    return response.content[0].type === 'text' ? response.content[0].text : '';  
  }  
  switchModel(m: string) { this.model = m; }  
}  
