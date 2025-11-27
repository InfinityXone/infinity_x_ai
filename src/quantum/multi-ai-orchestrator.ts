import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Multi-AI Orchestrator
 * Coordinates Claude Sonnet 4, GPT-4, and multiple AI models in parallel
 */
export class MultiAIOrchestrator {
  private claude: Anthropic;
  private openai: OpenAI;
  private activeModels: Map<string, any>;

  constructor() {
    this.claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' });
    this.activeModels = new Map();
    
    this.activeModels.set('claude-sonnet-4', this.claude);
    this.activeModels.set('gpt-4-turbo', this.openai);
  }

  /**
   * Quantum Thinking: Process same prompt through multiple AIs in parallel
   */
  async quantumThink(prompt: string, models: string[] = ['claude-sonnet-4', 'gpt-4-turbo']): Promise<QuantumThought> {
    console.log(`🧠 Quantum thinking with ${models.length} AI models in parallel...`);

    const startTime = Date.now();
    const thoughts = await Promise.allSettled(
      models.map(model => this.thinkWithModel(model, prompt))
    );

    const results: AIResponse[] = thoughts.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          model: models[index],
          response: result.value,
          success: true,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          model: models[index],
          response: `Error: ${result.reason}`,
          success: false,
          timestamp: new Date().toISOString()
        };
      }
    });

    const successfulResults = results.filter(r => r.success);
    const synthesized = await this.synthesizeQuantumThoughts(successfulResults);

    console.log(`✅ Quantum thinking complete: ${successfulResults.length}/${models.length} models responded`);

    return {
      prompt,
      responses: results,
      synthesized,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  private async thinkWithModel(model: string, prompt: string): Promise<string> {
    if (model.startsWith('claude')) {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (model.startsWith('gpt')) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        });
        return response.choices[0]?.message?.content || '';
      } catch (e) {
        return 'GPT-4 unavailable - using Claude only';
      }
    }
    throw new Error(`Unknown model: ${model}`);
  }

  /**
   * Synthesize multiple AI responses into unified insight
   */
  private async synthesizeQuantumThoughts(responses: AIResponse[]): Promise<string> {
    if (responses.length === 0) return 'No responses to synthesize';
    if (responses.length === 1) return responses[0].response;

    const synthesisPrompt = `Synthesize these multiple AI perspectives into one unified, superior insight:

${responses.map((r, i) => `
AI Model ${i + 1} (${r.model}):
${r.response}
`).join('\n---\n')}

Combine the best ideas, resolve conflicts, and create a comprehensive unified response.`;

    return await this.thinkWithModel('claude-sonnet-4', synthesisPrompt);
  }

  /**
   * Parallel validation across multiple AI models
   */
  async parallelValidate(content: string, validationType: ValidationType): Promise<ParallelValidation> {
    console.log(`✓ Parallel validation: ${validationType}`);

    const validationPrompts = this.createValidationPrompts(content, validationType);
    
    const validations = await Promise.allSettled(
      validationPrompts.map(vp => this.thinkWithModel(vp.model, vp.prompt))
    );

    const results = validations.map((v, i) => ({
      model: validationPrompts[i].model,
      passed: v.status === 'fulfilled' && !v.value.toLowerCase().includes('error'),
      feedback: v.status === 'fulfilled' ? v.value : `Error: ${v.reason}`,
      timestamp: new Date().toISOString()
    }));

    const passRate = results.filter(r => r.passed).length / results.length;

    return {
      validationType,
      results,
      overallPassed: passRate >= 0.7,
      passRate,
      consensus: await this.buildConsensus(results)
    };
  }

  private createValidationPrompts(content: string, type: ValidationType): Array<{model: string, prompt: string}> {
    const prompts: {[key in ValidationType]: string} = {
      'technical': `Validate this technical content for accuracy, feasibility, and best practices:\n\n${content}\n\nProvide detailed technical validation.`,
      'business': `Validate this business concept for viability, market fit, and strategic value:\n\n${content}\n\nProvide business validation.`,
      'financial': `Validate this financial plan for soundness, projections, and risk assessment:\n\n${content}\n\nProvide financial validation.`,
      'strategic': `Validate this strategy for coherence, alignment, and execution feasibility:\n\n${content}\n\nProvide strategic validation.`,
      'feasibility': `Validate the overall feasibility and practicality of implementation:\n\n${content}\n\nProvide feasibility assessment.`
    };

    return [
      { model: 'claude-sonnet-4', prompt: prompts[type] },
      { model: 'gpt-4-turbo', prompt: prompts[type] }
    ];
  }

  private async buildConsensus(results: Array<{model: string, passed: boolean, feedback: string}>): Promise<string> {
    const feedbacks = results.map(r => `${r.model}: ${r.feedback}`).join('\n\n');
    
    const consensusPrompt = `Build consensus from these validation results:\n\n${feedbacks}\n\nProvide unified validation summary.`;
    
    return await this.thinkWithModel('claude-sonnet-4', consensusPrompt);
  }
}

export type ValidationType = 'technical' | 'business' | 'financial' | 'strategic' | 'feasibility';

export interface QuantumThought {
  prompt: string;
  responses: AIResponse[];
  synthesized: string;
  processingTime: number;
  timestamp: string;
}

export interface AIResponse {
  model: string;
  response: string;
  success: boolean;
  timestamp: string;
}

export interface ParallelValidation {
  validationType: ValidationType;
  results: Array<{
    model: string;
    passed: boolean;
    feedback: string;
    timestamp: string;
  }>;
  overallPassed: boolean;
  passRate: number;
  consensus: string;
}
