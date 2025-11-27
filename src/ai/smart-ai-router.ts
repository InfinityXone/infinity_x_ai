import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

export type TaskComplexity = 'light' | 'medium' | 'heavy';

export interface AIResponse {
  text: string;
  model: string;
  provider: 'groq' | 'anthropic';
  tokensUsed?: number;
}

export class SmartAIRouter {
  private anthropic: Anthropic | null = null;
  private groq: Groq | null = null;
  private anthropicAvailable: boolean = false;
  private groqAvailable: boolean = false;

  constructor() {
    // Initialize Anthropic if key available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ 
        apiKey: process.env.ANTHROPIC_API_KEY 
      });
      this.anthropicAvailable = true;
    }

    // Initialize Groq if key available
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ 
        apiKey: process.env.GROQ_API_KEY 
      });
      this.groqAvailable = true;
    }

    this.logAvailability();
  }

  private logAvailability(): void {
    console.log('\n🤖 AI Router Initialized:');
    console.log(`   Groq (Free):      ${this.groqAvailable ? '✅ Available' : '❌ Not configured'}`);
    console.log(`   Anthropic (Paid): ${this.anthropicAvailable ? '✅ Available' : '❌ Not configured'}`);
    console.log('');
  }

  /**
   * Automatically routes requests to the best available AI
   * Priority: Groq for light tasks, Anthropic for heavy tasks
   */
  async think(prompt: string, complexity: TaskComplexity = 'medium'): Promise<AIResponse> {
    // Route based on complexity and availability
    if (complexity === 'light' && this.groqAvailable) {
      return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
    }

    if (complexity === 'medium') {
      // Try Groq first for medium tasks (free)
      if (this.groqAvailable) {
        return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
      }
      // Fall back to Anthropic
      if (this.anthropicAvailable) {
        return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
      }
    }

    if (complexity === 'heavy' && this.anthropicAvailable) {
      return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
    }

    // Fallback logic
    if (this.groqAvailable) {
      return this.thinkWithGroq(prompt, 'llama-3.3-70b-versatile');
    }

    if (this.anthropicAvailable) {
      return this.thinkWithAnthropic(prompt, 'claude-sonnet-4-20250514');
    }

    throw new Error('No AI providers available. Please set GROQ_API_KEY or ANTHROPIC_API_KEY in .env');
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

      return {
        text: text,
        model: model,
        provider: 'anthropic',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens
      };
    } catch (error: any) {
      console.error('❌ Anthropic error:', error.message);
      
      // Fallback to Groq if available
      if (this.groqAvailable) {
        console.log('🔄 Falling back to Groq...');
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
  getRecommendedProvider(complexity: TaskComplexity): 'groq' | 'anthropic' | null {
    if (complexity === 'light' && this.groqAvailable) return 'groq';
    if (complexity === 'heavy' && this.anthropicAvailable) return 'anthropic';
    
    // Medium tasks - prefer free option
    if (complexity === 'medium') {
      if (this.groqAvailable) return 'groq';
      if (this.anthropicAvailable) return 'anthropic';
    }

    return null;
  }
}

// Singleton instance
export const aiRouter = new SmartAIRouter();
