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
    console.log(`   OpenAI/Copilot (Primary): ${this.openaiAvailable ? '✅ Available (GPT-4)' : '❌ Not configured'}`);
    console.log(`   Groq (Fallback):          ${this.groqAvailable ? '✅ Available (Llama 3.3)' : '❌ Not configured'}`);
    console.log(`   Anthropic (Reasoning):    ${this.anthropicAvailable ? '✅ Available (Claude)' : '❌ Not configured'}`);
    console.log('');
  }

  /**
   * Automatically routes requests to the best available AI
   * Priority: OpenAI/Copilot (primary), Groq (fallback), Anthropic (heavy reasoning)
   */
  async think(prompt: string, complexity: TaskComplexity = 'medium'): Promise<AIResponse> {
    // Route based on complexity and availability
    
    // Light tasks - Use OpenAI (fast, included in monthly), fallback to Groq (free)
    if (complexity === 'light') {
      if (this.openaiAvailable) {
        return this.thinkWithOpenAI(prompt, 'gpt-4o-mini');
      }
      if (this.groqAvailable) {
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
    }

    // Medium tasks - Use OpenAI GPT-4 (monthly account), fallback to Groq
    if (complexity === 'medium') {
      if (this.openaiAvailable) {
        return this.thinkWithOpenAI(prompt, 'gpt-4-turbo-preview');
      }
      if (this.groqAvailable) {
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      if (this.anthropicAvailable) {
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
    }

    // Heavy tasks - Use Anthropic Claude (best reasoning), fallback to OpenAI
    if (complexity === 'heavy') {
      if (this.anthropicAvailable) {
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
      if (this.openaiAvailable) {
        return this.thinkWithOpenAI(prompt, 'gpt-4-turbo-preview');
      }
    }

    // Final fallback logic
    if (this.openaiAvailable) {
      return this.thinkWithOpenAI(prompt, 'gpt-4-turbo-preview');
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
  private async thinkWithOpenAI(prompt: string, model: string = 'gpt-4-turbo-preview'): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI is not available');
    }

    try {
      const response = await this.openai.chat.completions.create({
    } catch (error: any) {
      console.error('❌ Groq error:', error.message);
      
      // Fallback to OpenAI if available
      if (this.openaiAvailable) {
        console.log('🔄 Falling back to OpenAI...');
        return this.thinkWithOpenAI(prompt, 'gpt-4-turbo-preview');
      }
      
      // Fallback to Anthropic if available
      if (this.anthropicAvailable) {
        console.log('🔄 Falling back to Anthropic...');
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
      
      throw error;
    }
  }   return {
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
      console.error('❌ Groq error:', error.message);
      
      // Fallback to Anthropic if available
      if (this.anthropicAvailable) {
        console.log('🔄 Falling back to Anthropic...');
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

    } catch (error: any) {
      console.error('❌ Anthropic error:', error.message);
      
      // Fallback to OpenAI if available
      if (this.openaiAvailable) {
        console.log('🔄 Falling back to OpenAI...');
        return this.thinkWithOpenAI(prompt, 'gpt-4-turbo-preview');
      }
      
      // Fallback to Groq if available
      if (this.groqAvailable) {
        console.log('🔄 Falling back to Groq...');
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      
      throw error;
    }
  }

  /**
   * Force use of OpenAI/Copilot (monthly account)
   */
  async useOpenAI(prompt: string): Promise<AIResponse> {
    if (!this.openaiAvailable) {
      throw new Error('OpenAI is not available. Set OPENAI_API_KEY in .env');
    }
    return this.thinkWithOpenAI(prompt, 'gpt-4-turbo-preview');
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
  getAvailability(): { openai: boolean; groq: boolean; anthropic: boolean } {
    return {
      openai: this.openaiAvailable,
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
}     if (this.groqAvailable) return 'groq';
      if (this.anthropicAvailable) return 'anthropic';
    }

    return null;
  }
}

// Singleton instance
export const aiRouter = new SmartAIRouter();
