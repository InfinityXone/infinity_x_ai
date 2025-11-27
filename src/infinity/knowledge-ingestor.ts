import { JarvisAIEngine } from '../ai/engine.js';
import { MemoryManager } from '../ai/memory/memory-manager.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Knowledge Ingestion System
 * Ingests documentation, patterns, and best practices to feed the autonomous builder
 */
export class KnowledgeIngestor {
  private ai: JarvisAIEngine;
  private memory: MemoryManager;
  private knowledgeBase: Map<string, KnowledgeEntry>;

  constructor() {
    this.ai = new JarvisAIEngine();
    this.memory = new MemoryManager();
    this.knowledgeBase = new Map();
  }

  async ingestDocumentation(source: string, type: KnowledgeType): Promise<void> {
    console.log(`📚 Ingesting knowledge: ${source} (${type})`);

    try {
      let content: string;
      
      if (source.startsWith('http')) {
        // Fetch from URL
        const response = await fetch(source);
        content = await response.text();
      } else {
        // Read from file
        content = await fs.readFile(source, 'utf-8');
      }

      // Extract knowledge with AI
      const prompt = `Extract key knowledge from this documentation:

${content.slice(0, 8000)}

Extract:
1. Best practices
2. Common patterns
3. Anti-patterns to avoid
4. Architecture guidelines
5. Code examples

Return structured JSON with categories and insights.`;

      const extracted = await this.ai.think(prompt);
      
      const entry: KnowledgeEntry = {
        source,
        type,
        content: extracted,
        timestamp: new Date().toISOString(),
        usageCount: 0
      };

      this.knowledgeBase.set(source, entry);
      await this.memory.remember(`knowledge_${type}_${Date.now()}`, extracted);

      console.log(`✅ Knowledge ingested: ${source}`);
    } catch (error: any) {
      console.error(`❌ Ingestion error: ${error.message}`);
    }
  }

  async ingestCodebase(projectPath: string): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              📚 CODEBASE KNOWLEDGE INGESTION                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const patterns = await this.extractPatterns(projectPath);
    const architectureInsights = await this.analyzeArchitecture(projectPath);
    const bestPractices = await this.identifyBestPractices(projectPath);

    const knowledgeEntry: KnowledgeEntry = {
      source: projectPath,
      type: 'codebase',
      content: JSON.stringify({ patterns, architectureInsights, bestPractices }),
      timestamp: new Date().toISOString(),
      usageCount: 0
    };

    this.knowledgeBase.set('project_patterns', knowledgeEntry);
    
    console.log('✅ Codebase knowledge ingested');
    console.log(`   Patterns found: ${patterns.length}`);
    console.log(`   Architecture insights: ${architectureInsights.length}`);
    console.log(`   Best practices: ${bestPractices.length}\n`);
  }

  async queryKnowledge(query: string): Promise<string> {
    // Combine all knowledge
    const allKnowledge = Array.from(this.knowledgeBase.values())
      .map(entry => entry.content)
      .join('\n\n');

    const prompt = `Based on this knowledge base:

${allKnowledge.slice(0, 6000)}

Answer this query: ${query}

Provide specific, actionable guidance.`;

    const answer = await this.ai.think(prompt);
    
    // Update usage counts
    this.knowledgeBase.forEach(entry => entry.usageCount++);
    
    return answer;
  }

  private async extractPatterns(projectPath: string): Promise<string[]> {
    const patterns: Set<string> = new Set();
    
    try {
      const files = await this.getCodeFiles(projectPath);
      for (const file of files.slice(0, 10)) {
        const code = await fs.readFile(file, 'utf-8');
        
        if (code.includes('export class')) patterns.add('Class-based components');
        if (code.includes('export interface')) patterns.add('TypeScript interfaces');
        if (code.includes('async/await')) patterns.add('Async/await pattern');
        if (code.includes('try/catch')) patterns.add('Error handling');
        if (code.includes('React.')) patterns.add('React patterns');
        if (code.includes('express')) patterns.add('Express routing');
      }
    } catch (e) {
      // Continue without patterns
    }
    
    return Array.from(patterns);
  }

  private async analyzeArchitecture(projectPath: string): Promise<string[]> {
    const insights: string[] = [];
    
    try {
      const dirs = await fs.readdir(projectPath);
      if (dirs.includes('frontend')) insights.push('Frontend/Backend separation');
      if (dirs.includes('src')) insights.push('Source directory structure');
      if (dirs.includes('tests')) insights.push('Test-driven development');
      insights.push('Modular architecture');
    } catch (e) {
      // Continue without insights
    }
    
    return insights;
  }

  private async identifyBestPractices(projectPath: string): Promise<string[]> {
    return [
      'TypeScript for type safety',
      'Component-based architecture',
      'Separation of concerns',
      'Error handling in async operations',
      'Interface-first design'
    ];
  }

  private async getCodeFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          files.push(...await this.getCodeFiles(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Directory not accessible
    }
    return files;
  }

  getKnowledgeBase(): Map<string, KnowledgeEntry> {
    return this.knowledgeBase;
  }
}

export type KnowledgeType = 'documentation' | 'codebase' | 'patterns' | 'best_practices' | 'api_reference';

export interface KnowledgeEntry {
  source: string;
  type: KnowledgeType;
  content: string;
  timestamp: string;
  usageCount: number;
}
