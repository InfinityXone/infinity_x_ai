<<<<<<< HEAD
﻿import Anthropic from '@anthropic-ai/sdk';
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
=======
// filepath: src/ai/engine.ts
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * JARVIS AI Engine - Multi-Model Orchestrator
 * Manages multiple AI models and selects the best one for each task
 */
export class JarvisAIEngine {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private googleAI: GoogleGenerativeAI;
  private currentModel: 'openai' | 'anthropic' | 'google' = 'anthropic';

  constructor() {
    // Initialize AI models
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.googleAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY || ''
    );

    console.log('🤖 JARVIS AI Engine initialized');
    console.log(` Active model: ${this.currentModel}`);
  }

  /**
   * Main thinking method - JARVIS processes input and generates response
   */
  async think(input: string, context?: string): Promise<string> {
    console.log(`\n JARVIS thinking about: "${input}"`);

    try {
      switch (this.currentModel) {
        case 'anthropic':
          return await this.thinkWithClaude(input, context);
        case 'openai':
          return await this.thinkWithGPT(input, context);
        case 'google':
          return await this.thinkWithGemini(input, context);
        default:
          return await this.thinkWithClaude(input, context);
      }
    } catch (error) {
      console.error('❌ AI Engine error:', error);
      return `I encountered an error: ${error.message}`;
    }
  }

  /**
   * Think using Claude (Anthropic)
   */
  private async thinkWithClaude(
    input: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are JARVIS, an advanced autonomous AI system.
You are helpful, intelligent, and capable of learning and adapting.
${context ? `Context: ${context}` : ''}`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    });

    const response = message.content[0].text;
    console.log(' Claude response generated');
    return response;
  }

  /**
   * Think using GPT (OpenAI)
   */
  private async thinkWithGPT(
    input: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are JARVIS, an advanced autonomous AI system.
You are helpful, intelligent, and capable of learning and adapting.
${context ? `Context: ${context}` : ''}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      max_tokens: 4096,
    });

    const response = completion.choices[0].message.content || '';
    console.log(' GPT response generated');
    return response;
  }

  /**
   * Think using Gemini (Google)
   */
  private async thinkWithGemini(
    input: string,
    context?: string
  ): Promise<string> {
    const model = this.googleAI.getGenerativeModel({
      model: 'gemini-pro',
    });

    const prompt = `You are JARVIS, an advanced autonomous AI system.
${context ? `Context: ${context}` : ''}

User: ${input}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log(' Gemini response generated');
    return response;
  }

  /**
   * Switch AI model
   */
  switchModel(model: 'openai' | 'anthropic' | 'google') {
    this.currentModel = model;
    console.log(` Switched to ${model}`);
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.currentModel;
  }
}
>>>>>>> a3c801c11e277fac1ff7640942b29250df624eaa
