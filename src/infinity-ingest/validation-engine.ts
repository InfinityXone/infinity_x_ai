import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import type { ExtractedContent } from './web-crawler.ts';

dotenv.config();

/**
 * 3-STAGE VALIDATION ENGINE
 * Ensures only 100% credible information reaches the system
 */
export class ValidationEngine {
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in .env');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Execute full 3-stage validation pipeline
   */
  async validate(content: ExtractedContent): Promise<ValidationResult> {
    console.log(`\n🔍 Validating: ${content.title}`);
    console.log(`   URL: ${content.url}`);

    // Stage 1: Source Credibility
    const stage1 = await this.validateSourceCredibility(content);
    console.log(`   Stage 1 - Source Credibility: ${stage1.score}/100`);

    if (stage1.score < 70) {
      return {
        content,
        passed: false,
        finalScore: stage1.score,
        stages: [stage1],
        reason: 'Failed Stage 1: Source not credible enough'
      };
    }

    // Stage 2: Content Quality & Accuracy
    const stage2 = await this.validateContentQuality(content);
    console.log(`   Stage 2 - Content Quality: ${stage2.score}/100`);

    if (stage2.score < 75) {
      return {
        content,
        passed: false,
        finalScore: (stage1.score + stage2.score) / 2,
        stages: [stage1, stage2],
        reason: 'Failed Stage 2: Content quality insufficient'
      };
    }

    // Stage 3: Fact Verification & Cross-Reference
    const stage3 = await this.validateFactAccuracy(content);
    console.log(`   Stage 3 - Fact Verification: ${stage3.score}/100`);

    const finalScore = (stage1.score + stage2.score + stage3.score) / 3;
    const passed = finalScore >= 85; // Must achieve 85+ to pass all stages

    if (passed) {
      console.log(`   ✅ VALIDATED - Final Score: ${finalScore.toFixed(1)}/100`);
    } else {
      console.log(`   ❌ REJECTED - Final Score: ${finalScore.toFixed(1)}/100`);
    }

    return {
      content,
      passed,
      finalScore,
      stages: [stage1, stage2, stage3],
      reason: passed ? 'Passed all validation stages' : 'Failed Stage 3: Insufficient fact verification'
    };
  }

  /**
   * Stage 1: Validate source credibility
   */
  private async validateSourceCredibility(content: ExtractedContent): Promise<ValidationStage> {
    const prompt = `Analyze the credibility of this source:

URL: ${content.url}
Author: ${content.author}
Publication Date: ${content.publishDate}
Title: ${content.title}

Rate the source credibility from 0-100 based on:
1. Domain reputation (is this a known, trusted source?)
2. Author expertise (if known)
3. Publication recency
4. Domain authority in the subject area

Return JSON:
{
  "score": 0-100,
  "reasoning": "Brief explanation",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

    return this.executeValidation(prompt, 'Source Credibility');
  }

  /**
   * Stage 2: Validate content quality and accuracy
   */
  private async validateContentQuality(content: ExtractedContent): Promise<ValidationStage> {
    const prompt = `Analyze the quality and accuracy of this content:

Title: ${content.title}
Content: ${content.content.slice(0, 3000)}
Key Points: ${content.keyPoints.join(', ')}

Rate the content quality from 0-100 based on:
1. Clarity and coherence
2. Depth of information
3. Lack of bias or sensationalism
4. Technical accuracy (if applicable)
5. Logical consistency

Return JSON:
{
  "score": 0-100,
  "reasoning": "Brief explanation",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

    return this.executeValidation(prompt, 'Content Quality');
  }

  /**
   * Stage 3: Validate fact accuracy through cross-referencing
   */
  private async validateFactAccuracy(content: ExtractedContent): Promise<ValidationStage> {
    const prompt = `Verify the factual accuracy of this content:

Title: ${content.title}
Content: ${content.content.slice(0, 3000)}
Statistics: ${content.statistics.join(', ')}
Key Points: ${content.keyPoints.join(', ')}

Rate factual accuracy from 0-100 based on:
1. Verifiability of claims
2. Presence of citations/sources
3. Internal consistency
4. Alignment with established knowledge
5. Statistical plausibility

Return JSON:
{
  "score": 0-100,
  "reasoning": "Brief explanation",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

    return this.executeValidation(prompt, 'Fact Accuracy');
  }

  /**
   * Execute validation with AI
   */
  private async executeValidation(prompt: string, stageName: string): Promise<ValidationStage> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent scoring
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          name: stageName,
          score: Math.min(100, Math.max(0, result.score)),
          reasoning: result.reasoning || '',
          strengths: result.strengths || [],
          weaknesses: result.weaknesses || []
        };
      }
    } catch (error: any) {
      console.log(`   ⚠️  Validation error for ${stageName}: ${error.message}`);
    }

    // Fallback: conservative score
    return {
      name: stageName,
      score: 50,
      reasoning: 'Unable to complete validation - conservative score applied',
      strengths: [],
      weaknesses: ['Validation incomplete']
    };
  }

  /**
   * Batch validate multiple contents
   */
  async validateBatch(contents: ExtractedContent[]): Promise<ValidationResult[]> {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   3-STAGE VALIDATION - BATCH MODE`);
    console.log(`   Processing ${contents.length} items`);
    console.log(`${'═'.repeat(65)}`);

    const results: ValidationResult[] = [];

    for (const content of contents) {
      const result = await this.validate(content);
      results.push(result);

      // Brief delay between validations to respect rate limits
      await this.delay(500);
    }

    const passed = results.filter(r => r.passed).length;
    const avgScore = results.reduce((sum, r) => sum + r.finalScore, 0) / results.length;

    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   VALIDATION COMPLETE`);
    console.log(`   Passed: ${passed}/${contents.length} (${(passed/contents.length*100).toFixed(1)}%)`);
    console.log(`   Average Score: ${avgScore.toFixed(1)}/100`);
    console.log(`${'═'.repeat(65)}\n`);

    return results;
  }

  /**
   * Get only validated (passed) content
   */
  getValidatedContent(results: ValidationResult[]): ExtractedContent[] {
    return results
      .filter(r => r.passed)
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(r => r.content);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface ValidationStage {
  name: string;
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ValidationResult {
  content: ExtractedContent;
  passed: boolean;
  finalScore: number;
  stages: ValidationStage[];
  reason: string;
}
