import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from './document-evolution-engine.ts';

export interface AIModel {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'google' | 'custom';
  modelName: string;
  apiKey?: string;
  enabled: boolean;
  capabilities: ('analysis' | 'generation' | 'taxonomy' | 'relationships' | 'summarization')[];
}

export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  category: string;
  relatedConcepts: string[];
  documentReferences: string[];
  frequency: number;
  importance: number; // 0-100
}

export interface DocumentRelationship {
  source: string;
  target: string;
  type: 'related' | 'depends-on' | 'extends' | 'contradicts' | 'supersedes' | 'references';
  strength: number; // 0-100
  reasoning: string;
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  concepts: string[];
  documentCount: number;
}

export interface AIInsight {
  id: string;
  timestamp: Date;
  insightType: 'gap' | 'redundancy' | 'quality' | 'trend' | 'recommendation';
  title: string;
  description: string;
  affectedDocuments: string[];
  actionable: boolean;
  suggestedAction?: string;
  confidence: number;
}

export class AIIntegrationLayer {
  private anthropic: Anthropic;
  private models: Map<string, AIModel>;
  private concepts: Map<string, ConceptNode>;
  private relationships: DocumentRelationship[];
  private categories: Map<string, TaxonomyCategory>;
  private insights: AIInsight[];
  private outputDir: string;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
    this.models = new Map();
    this.concepts = new Map();
    this.relationships = [];
    this.categories = new Map();
    this.insights = [];
    this.outputDir = './infinity-output/evolution-docs';
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.join(this.outputDir, 'ai-insights'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'relationships'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'concepts'), { recursive: true });
    
    // Register default AI models
    this.registerDefaultModels();
    
    console.log('🤖 AI Integration Layer initialized');
    console.log(`   Models: ${this.models.size}`);
    console.log(`   Concepts: ${this.concepts.size}`);
    console.log(`   Relationships: ${this.relationships.length}\n`);
  }

  private registerDefaultModels(): void {
    const defaultModels: AIModel[] = [
      {
        id: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
        enabled: true,
        capabilities: ['analysis', 'generation', 'taxonomy', 'relationships', 'summarization']
      },
      {
        id: 'claude-opus',
        name: 'Claude Opus',
        provider: 'anthropic',
        modelName: 'claude-opus-4-20250514',
        enabled: false,
        capabilities: ['analysis', 'generation', 'taxonomy', 'relationships', 'summarization']
      }
    ];

    for (const model of defaultModels) {
      this.models.set(model.id, model);
    }
  }

  async extractConcepts(documents: Document[]): Promise<ConceptNode[]> {
    console.log(`🧠 Extracting concepts from ${documents.length} documents...`);

    const extractedConcepts: ConceptNode[] = [];

    for (const doc of documents) {
      const prompt = `Analyze this document and extract key concepts, themes, and topics.

Document Title: ${doc.title}
Category: ${doc.category}
Content: ${doc.content}

Extract:
1. Main concepts (5-10)
2. Each concept's category
3. Brief description of each concept
4. Related concepts

Return JSON:
{
  "concepts": [
    {
      "name": "concept name",
      "category": "category",
      "description": "brief description",
      "relatedConcepts": ["related1", "related2"],
      "importance": 85
    }
  ]
}`;

      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.3,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const content = response.content[0];
        if (content.type === 'text') {
          const result = JSON.parse(content.text);
          
          for (const concept of result.concepts) {
            const conceptId = `concept-${concept.name.toLowerCase().replace(/\s+/g, '-')}`;
            
            const existing = this.concepts.get(conceptId);
            if (existing) {
              existing.frequency++;
              existing.documentReferences.push(doc.id);
              existing.importance = Math.max(existing.importance, concept.importance);
            } else {
              const newConcept: ConceptNode = {
                id: conceptId,
                name: concept.name,
                description: concept.description,
                category: concept.category,
                relatedConcepts: concept.relatedConcepts,
                documentReferences: [doc.id],
                frequency: 1,
                importance: concept.importance
              };
              this.concepts.set(conceptId, newConcept);
              extractedConcepts.push(newConcept);
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Concept extraction failed for ${doc.id}: ${error}`);
      }
    }

    await this.saveConceptGraph();
    console.log(`   ✓ Extracted ${extractedConcepts.length} new concepts\n`);
    return extractedConcepts;
  }

  async detectRelationships(documents: Document[]): Promise<DocumentRelationship[]> {
    console.log(`🔗 Detecting relationships between ${documents.length} documents...`);

    const newRelationships: DocumentRelationship[] = [];

    // Compare each document with others
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i];
        const doc2 = documents[j];

        const prompt = `Analyze the relationship between these two documents.

Document 1:
Title: ${doc1.title}
Category: ${doc1.category}
Content: ${doc1.content.substring(0, 500)}...

Document 2:
Title: ${doc2.title}
Category: ${doc2.category}
Content: ${doc2.content.substring(0, 500)}...

Determine:
1. Relationship type: related, depends-on, extends, contradicts, supersedes, references
2. Relationship strength: 0-100
3. Reasoning

Return JSON:
{
  "hasRelationship": true/false,
  "type": "relationship type",
  "strength": 85,
  "reasoning": "explanation"
}`;

        try {
          const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            temperature: 0.3,
            messages: [{
              role: 'user',
              content: prompt
            }]
          });

          const content = response.content[0];
          if (content.type === 'text') {
            const result = JSON.parse(content.text);
            
            if (result.hasRelationship && result.strength > 30) {
              const relationship: DocumentRelationship = {
                source: doc1.id,
                target: doc2.id,
                type: result.type,
                strength: result.strength,
                reasoning: result.reasoning
              };
              
              this.relationships.push(relationship);
              newRelationships.push(relationship);
            }
          }
        } catch (error) {
          console.log(`   ⚠️  Relationship detection failed: ${error}`);
        }
      }
    }

    await this.saveRelationshipGraph();
    console.log(`   ✓ Detected ${newRelationships.length} new relationships\n`);
    return newRelationships;
  }

  async generateTaxonomy(documents: Document[]): Promise<TaxonomyCategory[]> {
    console.log(`📊 Generating taxonomy from ${documents.length} documents...`);

    const prompt = `Analyze these documents and create a comprehensive taxonomy with hierarchical categories.

Documents:
${documents.map(doc => `- ${doc.title} (${doc.category})`).join('\n')}

Document categories present: ${[...new Set(documents.map(d => d.category))].join(', ')}

Create a hierarchical taxonomy:
1. Top-level categories
2. Sub-categories (max 3 levels deep)
3. Assign documents to appropriate categories
4. Each category should have clear scope

Return JSON:
{
  "categories": [
    {
      "name": "Category Name",
      "parentId": null,
      "level": 0,
      "description": "brief description",
      "documentIds": ["doc-id-1"],
      "subcategories": [
        {
          "name": "Subcategory",
          "level": 1,
          "documentIds": []
        }
      ]
    }
  ]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.4,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const result = JSON.parse(content.text);
        
        const categories: TaxonomyCategory[] = [];
        
        for (const cat of result.categories) {
          const categoryId = `cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`;
          
          const category: TaxonomyCategory = {
            id: categoryId,
            name: cat.name,
            parentId: cat.parentId,
            level: cat.level,
            concepts: [],
            documentCount: cat.documentIds.length
          };
          
          this.categories.set(categoryId, category);
          categories.push(category);

          // Process subcategories
          if (cat.subcategories) {
            for (const subcat of cat.subcategories) {
              const subcatId = `cat-${subcat.name.toLowerCase().replace(/\s+/g, '-')}`;
              
              const subcategory: TaxonomyCategory = {
                id: subcatId,
                name: subcat.name,
                parentId: categoryId,
                level: subcat.level,
                concepts: [],
                documentCount: subcat.documentIds.length
              };
              
              this.categories.set(subcatId, subcategory);
              categories.push(subcategory);
            }
          }
        }

        await this.saveTaxonomy();
        console.log(`   ✓ Generated ${categories.length} taxonomy categories\n`);
        return categories;
      }
    } catch (error) {
      console.log(`   ❌ Taxonomy generation failed: ${error}\n`);
    }

    return [];
  }

  async analyzeDocumentQuality(doc: Document): Promise<AIInsight[]> {
    const prompt = `Analyze this document's quality and provide insights.

Document:
Title: ${doc.title}
Category: ${doc.category}
Content Length: ${doc.content.length} characters
Version: ${doc.version}
Completeness: ${doc.metadata.completeness}%
Confidence: ${doc.metadata.confidenceScore}%

Content:
${doc.content}

Analyze:
1. Content quality (clarity, depth, accuracy)
2. Completeness (missing sections, gaps)
3. Redundancy or repetition
4. Improvement suggestions
5. Related documents that should be mentioned

Return JSON array of insights:
{
  "insights": [
    {
      "type": "gap" | "redundancy" | "quality" | "recommendation",
      "title": "insight title",
      "description": "detailed description",
      "actionable": true,
      "suggestedAction": "what to do",
      "confidence": 85
    }
  ]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const result = JSON.parse(content.text);
        
        const insights: AIInsight[] = result.insights.map((ins: any) => ({
          id: `insight-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date(),
          insightType: ins.type,
          title: ins.title,
          description: ins.description,
          affectedDocuments: [doc.id],
          actionable: ins.actionable,
          suggestedAction: ins.suggestedAction,
          confidence: ins.confidence
        }));

        this.insights.push(...insights);
        await this.saveInsights();

        return insights;
      }
    } catch (error) {
      console.log(`   ⚠️  Quality analysis failed: ${error}`);
    }

    return [];
  }

  async identifyContentGaps(documents: Document[]): Promise<AIInsight[]> {
    console.log(`🔍 Identifying content gaps across ${documents.length} documents...`);

    const prompt = `Analyze these documents and identify gaps in coverage.

Documents:
${documents.map(doc => `- ${doc.title} (${doc.category}): ${doc.content.substring(0, 100)}...`).join('\n')}

Categories present: ${[...new Set(documents.map(d => d.category))].join(', ')}

Identify:
1. Topics that are under-represented
2. Missing perspectives or angles
3. Areas needing more depth
4. Suggested new documents to create

Return JSON:
{
  "gaps": [
    {
      "title": "gap title",
      "description": "what's missing",
      "suggestedAction": "create document about X",
      "confidence": 85
    }
  ]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.4,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const result = JSON.parse(content.text);
        
        const gapInsights: AIInsight[] = result.gaps.map((gap: any) => ({
          id: `insight-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date(),
          insightType: 'gap',
          title: gap.title,
          description: gap.description,
          affectedDocuments: [],
          actionable: true,
          suggestedAction: gap.suggestedAction,
          confidence: gap.confidence
        }));

        this.insights.push(...gapInsights);
        await this.saveInsights();

        console.log(`   ✓ Identified ${gapInsights.length} content gaps\n`);
        return gapInsights;
      }
    } catch (error) {
      console.log(`   ❌ Gap identification failed: ${error}\n`);
    }

    return [];
  }

  async summarizeDocument(doc: Document, targetLength: number = 200): Promise<string> {
    const prompt = `Summarize this document in approximately ${targetLength} words.

Document:
Title: ${doc.title}
Content: ${doc.content}

Create a concise summary that captures the key points and main ideas.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: targetLength * 2,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
    } catch (error) {
      console.log(`   ⚠️  Summarization failed: ${error}`);
    }

    return doc.content.substring(0, targetLength) + '...';
  }

  async generateTags(doc: Document, maxTags: number = 10): Promise<string[]> {
    const prompt = `Generate relevant tags for this document (max ${maxTags}).

Document:
Title: ${doc.title}
Category: ${doc.category}
Content: ${doc.content}

Return JSON array of tags:
{
  "tags": ["tag1", "tag2", "tag3"]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const result = JSON.parse(content.text);
        return result.tags;
      }
    } catch (error) {
      console.log(`   ⚠️  Tag generation failed: ${error}`);
    }

    return [];
  }

  private async saveConceptGraph(): Promise<void> {
    const graphPath = path.join(this.outputDir, 'concepts', 'concept-graph.json');
    const concepts = Array.from(this.concepts.values());
    await fs.writeFile(graphPath, JSON.stringify(concepts, null, 2), 'utf-8');
  }

  private async saveRelationshipGraph(): Promise<void> {
    const graphPath = path.join(this.outputDir, 'relationships', 'relationship-graph.json');
    await fs.writeFile(graphPath, JSON.stringify(this.relationships, null, 2), 'utf-8');
  }

  private async saveTaxonomy(): Promise<void> {
    const taxonomyPath = path.join(this.outputDir, 'taxonomy', 'taxonomy.json');
    const categories = Array.from(this.categories.values());
    await fs.writeFile(taxonomyPath, JSON.stringify(categories, null, 2), 'utf-8');
  }

  private async saveInsights(): Promise<void> {
    const insightsPath = path.join(this.outputDir, 'ai-insights', 'insights.json');
    await fs.writeFile(insightsPath, JSON.stringify(this.insights, null, 2), 'utf-8');
  }

  getConcept(id: string): ConceptNode | undefined {
    return this.concepts.get(id);
  }

  getAllConcepts(): ConceptNode[] {
    return Array.from(this.concepts.values());
  }

  getRelationships(documentId?: string): DocumentRelationship[] {
    if (!documentId) return this.relationships;
    
    return this.relationships.filter(
      r => r.source === documentId || r.target === documentId
    );
  }

  getCategory(id: string): TaxonomyCategory | undefined {
    return this.categories.get(id);
  }

  getAllCategories(): TaxonomyCategory[] {
    return Array.from(this.categories.values());
  }

  getInsights(type?: string): AIInsight[] {
    if (!type) return this.insights;
    return this.insights.filter(i => i.insightType === type);
  }

  getActionableInsights(): AIInsight[] {
    return this.insights.filter(i => i.actionable);
  }
}
