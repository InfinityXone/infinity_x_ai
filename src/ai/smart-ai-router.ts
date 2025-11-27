import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export type TaskComplexity = 'light' | 'medium' | 'heavy';

export interface AIResponse {
  text: string;
  model: string;
  provider: 'openai' | 'groq' | 'anthropic';
  tokensUsed?: number;
}

export class SmartAIRouter {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private groq: Groq | null = null;
  private openaiAvailable: boolean = false;
  private anthropicAvailable: boolean = false;
  private groqAvailable: boolean = false;

  constructor() {
    // Initialize OpenAI (GitHub Copilot / GPT-4) if key available - PRIMARY
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      this.openaiAvailable = true;
    }

    // Initialize Groq if key available - FALLBACK
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ 
        apiKey: process.env.GROQ_API_KEY 
      });
      this.groqAvailable = true;
    }

    // Initialize Anthropic if key available - HEAVY REASONING
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ 
        apiKey: process.env.ANTHROPIC_API_KEY 
      });
      this.anthropicAvailable = true;
    }

    this.logAvailability();
  }

  private logAvailability(): void {
    console.log('\n🤖 AI Router Initialized:');
    console.log(`   Priority 1 - GitHub Copilot: ${this.openaiAvailable ? '✅ Available (GPT-4)' : '❌ Not configured'}`);
    console.log(`   Priority 2 - Groq (Free):    ${this.groqAvailable ? '✅ Available (Llama 3.3)' : '❌ Not configured'}`);
    console.log(`   Priority 3 - OpenAI:         ${this.openaiAvailable ? '✅ Available' : '❌ Not configured'}`);
    console.log(`   Priority 4 - Anthropic:      ${this.anthropicAvailable ? '✅ Available (Claude)' : '❌ Not configured'}`);
    console.log('');
  }

  /**
   * Automatically routes requests to the best available AI
   * Priority: GitHub Copilot/OpenAI (1st) → Groq Free (2nd) → Anthropic (3rd for heavy only)
   */
  async think(prompt: string, complexity: TaskComplexity = 'medium'): Promise<AIResponse> {
    // Light tasks - Try: GitHub Copilot → Groq (free) → Anthropic
    if (complexity === 'light') {
      if (this.openaiAvailable) {
        return this.thinkWithOpenAI(prompt, 'gpt-4o-mini');
      }
      if (this.groqAvailable) {
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      if (this.anthropicAvailable) {
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
    }

    // Medium tasks - Try: GitHub Copilot → Groq (free) → Anthropic
    if (complexity === 'medium') {
      if (this.openaiAvailable) {
        return this.thinkWithOpenAI(prompt, 'gpt-4o');
      }
      if (this.groqAvailable) {
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      if (this.anthropicAvailable) {
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
    }

    // Heavy tasks - Try: GitHub Copilot → Groq → Anthropic
    if (complexity === 'heavy') {
      if (this.openaiAvailable) {
        return this.thinkWithOpenAI(prompt, 'gpt-4o');
      }
      if (this.groqAvailable) {
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      if (this.anthropicAvailable) {
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
    }

    // Final fallback logic (same priority)
    if (this.openaiAvailable) {
      return this.thinkWithOpenAI(prompt, 'gpt-4o');
    }
    if (this.groqAvailable) {
      return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
    }
    if (this.anthropicAvailable) {
      return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
    }

    throw new Error('No AI providers available. Please set OPENAI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY in .env');
  }

  /**
   * Use OpenAI GPT-4 (GitHub Copilot account - included in monthly subscription)
   */
  private async thinkWithOpenAI(prompt: string, model: string = 'gpt-4o'): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI is not available');
    }

    try {
      console.log(`💡 Using openai (${model})`);
      const response = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      });

      return {
        text: response.choices[0]?.message?.content || '',
        model: model,
        provider: 'openai',
        tokensUsed: response.usage?.total_tokens
      };
    } catch (error: any) {
      console.error('❌ OpenAI error:', error.message);
      
      // Fallback to Groq if available
      if (this.groqAvailable) {
        console.log('🔄 Falling back to Groq...');
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      
      // Fallback to Anthropic if available
      if (this.anthropicAvailable) {
        console.log('🔄 Falling back to Anthropic...');
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
      
      throw error;
    }
  }

  /**
   * Use Groq for fast, free inference (perfect for light tasks)
   */
  private async thinkWithGroq(prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<AIResponse> {
    if (!this.groq) {
      throw new Error('Groq is not available');
    }

    try {
      const response = await this.groq.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      return {
        text: response.choices[0]?.message?.content || '',
        model: model,
        provider: 'groq',
        tokensUsed: response.usage?.total_tokens
      };
    } catch (error: any) {
      console.error('Γ¥î Groq error:', error.message);
      
      // Fallback to Anthropic if available
      if (this.anthropicAvailable) {
        console.log('≡ƒöä Falling back to Anthropic...');
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
      
      throw error;
    }
  }

  /**
   * Use Anthropic Claude for heavy, complex tasks
   */
  private async thinkWithAnthropic(prompt: string, model: string = 'claude-sonnet-4-20250514'): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic is not available');
    }

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        text: text,
        model: model,
        provider: 'anthropic',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens
      };
    } catch (error: any) {
      console.error('Γ¥î Anthropic error:', error.message);
      
      // Fallback to Groq if available
      if (this.groqAvailable) {
        console.log('≡ƒöä Falling back to Groq...');
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      
      throw error;
    }
  }

  /**
   * Force use of Groq (free, fast)
   */
  async useGroq(prompt: string): Promise<AIResponse> {
    if (!this.groqAvailable) {
      throw new Error('Groq is not available. Set GROQ_API_KEY in .env');
    }
    return this.thinkWithGroq(prompt);
  }

  /**
   * Force use of Anthropic (paid, powerful)
   */
  async useAnthropic(prompt: string): Promise<AIResponse> {
    if (!this.anthropicAvailable) {
      throw new Error('Anthropic is not available. Set ANTHROPIC_API_KEY in .env');
    }
    return this.thinkWithAnthropic(prompt);
  }

  /**
   * Check which providers are available
   */
  getAvailability(): { groq: boolean; anthropic: boolean } {
    return {
      groq: this.groqAvailable,
      anthropic: this.anthropicAvailable
    };
  }

  /**
   * Get recommended provider for task complexity
   */
  getRecommendedProvider(complexity: TaskComplexity): 'openai' | 'groq' | 'anthropic' | null {
    if (complexity === 'light' && this.openaiAvailable) return 'openai';
    if (complexity === 'heavy' && this.anthropicAvailable) return 'anthropic';
    
    // Medium tasks - prefer OpenAI (included in monthly)
    if (complexity === 'medium') {
      if (this.openaiAvailable) return 'openai';
      if (this.groqAvailable) return 'groq';
      if (this.anthropicAvailable) return 'anthropic';
    }

    return null;
  }

  /**
   * Anthropic API compatibility - wrapper around think()
   * This allows SmartAIRouter to be used as a drop-in replacement for Anthropic client
   */
  get messages() {
    return {
      create: async (params: { model: string; max_tokens: number; messages: Array<{ role: string; content: string }>; temperature?: number }) => {
        const userMessage = params.messages.find(m => m.role === 'user');
        const prompt = userMessage?.content || '';
        
        // Determine complexity based on max_tokens
        const complexity: TaskComplexity = params.max_tokens > 6000 ? 'heavy' : params.max_tokens > 3000 ? 'medium' : 'light';
        
        const response = await this.think(prompt, complexity);
        
        // Return in Anthropic format
        return {
          content: [{ type: 'text' as const, text: response.text }],
          model: response.model,
          role: 'assistant' as const,
          stop_reason: 'end_turn' as const,
          usage: { input_tokens: 0, output_tokens: response.tokensUsed || 0 }
        };
      }
    };
  }
}

// Singleton instance
export const aiRouter = new SmartAIRouter();
