import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import type { ExtractedContent } from './web-crawler.ts';
import type { ValidationResult } from './validation-engine.ts';

dotenv.config();

/**
 * KNOWLEDGE PROCESSOR
 * Processes validated content into structured knowledge for the AI system
 */
export class KnowledgeProcessor {
  private client: Anthropic;
  private knowledgeBase: ProcessedKnowledge[] = [];

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in .env');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Process validated content into structured knowledge
   */
  async process(validatedContent: ExtractedContent[], validationResults: ValidationResult[]): Promise<ProcessedKnowledge[]> {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   KNOWLEDGE PROCESSING`);
    console.log(`   Processing ${validatedContent.length} validated items`);
    console.log(`${'═'.repeat(65)}\n`);

    const processed: ProcessedKnowledge[] = [];

    for (let i = 0; i < validatedContent.length; i++) {
      const content = validatedContent[i];
      const validation = validationResults.find(v => v.content.url === content.url);

      console.log(`   [${i + 1}/${validatedContent.length}] Processing: ${content.title}`);

      const knowledge = await this.processContent(content, validation);
      processed.push(knowledge);
      this.knowledgeBase.push(knowledge);

      // Brief delay
      await this.delay(500);
    }

    console.log(`\n✅ Processed ${processed.length} knowledge items`);
    return processed;
  }

  /**
   * Process single content item
   */
  private async processContent(
    content: ExtractedContent,
    validation?: ValidationResult
  ): Promise<ProcessedKnowledge> {
    
    const prompt = `Transform this validated content into structured knowledge:

Title: ${content.title}
Author: ${content.author}
Category: ${content.category}
Content: ${content.content.slice(0, 4000)}
Key Points: ${content.keyPoints.join(', ')}
Statistics: ${content.statistics.join(', ')}

Extract and structure:
1. Core concepts and definitions
2. Key insights and findings
3. Actionable intelligence
4. Relationships to other domains
5. Future implications

Return JSON:
{
  "concepts": ["concept 1", "concept 2"],
  "insights": ["insight 1", "insight 2"],
  "actionableIntelligence": ["action 1", "action 2"],
  "domainLinks": ["domain 1", "domain 2"],
  "futureImplications": ["implication 1", "implication 2"],
  "summary": "Brief 2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const structured = JSON.parse(jsonMatch[0]);
        
        return {
          id: `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: content,
          validationScore: validation?.finalScore || 0,
          concepts: structured.concepts || [],
          insights: structured.insights || [],
          actionableIntelligence: structured.actionableIntelligence || [],
          domainLinks: structured.domainLinks || [],
          futureImplications: structured.futureImplications || [],
          summary: structured.summary || content.content.slice(0, 200),
          tags: structured.tags || [],
          processedAt: new Date().toISOString()
        };
      }
    } catch (error: any) {
      console.log(`   ⚠️  Processing error: ${error.message}`);
    }

    // Fallback: basic processing
    return {
      id: `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: content,
      validationScore: validation?.finalScore || 0,
      concepts: content.keyPoints,
      insights: [],
      actionableIntelligence: [],
      domainLinks: [content.category],
      futureImplications: [],
      summary: content.content.slice(0, 200),
      tags: [content.category],
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Save knowledge base to file
   */
  async saveKnowledgeBase(filename: string = 'knowledge-base.json'): Promise<string> {
    const outputDir = path.join(process.cwd(), 'infinity-output', 'knowledge');
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, filename);
    
    const data = {
      totalItems: this.knowledgeBase.length,
      averageScore: this.knowledgeBase.reduce((sum, k) => sum + k.validationScore, 0) / this.knowledgeBase.length,
      categories: this.getCategoryStats(),
      knowledge: this.knowledgeBase,
      generatedAt: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`\n💾 Knowledge base saved: ${filePath}`);
    return filePath;
  }

  /**
   * Get category statistics
   */
  private getCategoryStats(): Record<string, number> {
    return this.knowledgeBase.reduce((acc, k) => {
      const category = k.source.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Search knowledge base
   */
  searchKnowledge(query: string): ProcessedKnowledge[] {
    const lowerQuery = query.toLowerCase();
    
    return this.knowledgeBase.filter(k => {
      return k.summary.toLowerCase().includes(lowerQuery) ||
             k.concepts.some(c => c.toLowerCase().includes(lowerQuery)) ||
             k.insights.some(i => i.toLowerCase().includes(lowerQuery)) ||
             k.tags.some(t => t.toLowerCase().includes(lowerQuery));
    }).sort((a, b) => b.validationScore - a.validationScore);
  }

  /**
   * Get top knowledge by score
   */
  getTopKnowledge(limit: number = 10): ProcessedKnowledge[] {
    return [...this.knowledgeBase]
      .sort((a, b) => b.validationScore - a.validationScore)
      .slice(0, limit);
  }

  /**
   * Get knowledge base size
   */
  getSize(): number {
    return this.knowledgeBase.length;
  }

  /**
   * Clear knowledge base
   */
  clear(): void {
    this.knowledgeBase = [];
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface ProcessedKnowledge {
  id: string;
  source: ExtractedContent;
  validationScore: number;
  concepts: string[];
  insights: string[];
  actionableIntelligence: string[];
  domainLinks: string[];
  futureImplications: string[];
  summary: string;
  tags: string[];
  processedAt: string;
}
