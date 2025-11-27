import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { watch } from 'fs';

export interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  version: number;
  createdAt: Date;
  lastModified: Date;
  evolutionHistory: EvolutionEntry[];
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  author: string;
  type: 'markdown' | 'json' | 'yaml' | 'text';
  status: 'draft' | 'active' | 'archived';
  relatedDocs: string[];
  confidenceScore: number; // 0-100
  completeness: number; // 0-100
}

export interface EvolutionEntry {
  timestamp: Date;
  changeType: 'created' | 'updated' | 'enriched' | 'restructured' | 'merged' | 'split';
  trigger: string;
  changes: string[];
  aiReasoning: string;
  previousVersion: number;
  newVersion: number;
}

export interface IncomingInformation {
  id: string;
  source: string;
  content: string;
  timestamp: Date;
  category?: string;
  relevance: number; // 0-100
  metadata: Record<string, any>;
}

export interface TransformationRule {
  id: string;
  name: string;
  trigger: 'keyword' | 'pattern' | 'category' | 'similarity' | 'time' | 'custom';
  condition: any;
  action: 'update' | 'create' | 'merge' | 'enrich' | 'restructure';
  priority: number;
  enabled: boolean;
}

export class DocumentEvolutionEngine {
  private client: Anthropic;
  private outputDir: string;
  private documents: Map<string, Document>;
  private transformationRules: Map<string, TransformationRule>;
  private evolutionQueue: IncomingInformation[];
  private isProcessing: boolean;
  private watchHandles: Map<string, any>;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.outputDir = './infinity-output/evolution-docs';
    this.documents = new Map();
    this.transformationRules = new Map();
    this.evolutionQueue = [];
    this.isProcessing = false;
    this.watchHandles = new Map();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'documents'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'history'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'taxonomy'), { recursive: true });
    
    // Load default transformation rules
    await this.loadDefaultRules();
    
    // Load existing documents
    await this.loadExistingDocuments();
    
    console.log('📚 Document Evolution Engine initialized');
    console.log(`   Output: ${this.outputDir}`);
    console.log(`   Documents loaded: ${this.documents.size}`);
    console.log(`   Transformation rules: ${this.transformationRules.size}\n`);
  }

  private async loadDefaultRules(): Promise<void> {
    const rules: TransformationRule[] = [
      {
        id: 'rule-keyword-update',
        name: 'Keyword-Based Update',
        trigger: 'keyword',
        condition: { keywords: ['update', 'change', 'modify', 'fix'] },
        action: 'update',
        priority: 5,
        enabled: true
      },
      {
        id: 'rule-high-similarity',
        name: 'High Similarity Merge',
        trigger: 'similarity',
        condition: { threshold: 0.85 },
        action: 'merge',
        priority: 8,
        enabled: true
      },
      {
        id: 'rule-enrich-incomplete',
        name: 'Enrich Incomplete Docs',
        trigger: 'custom',
        condition: { completeness: '<70' },
        action: 'enrich',
        priority: 6,
        enabled: true
      },
      {
        id: 'rule-category-match',
        name: 'Category-Based Update',
        trigger: 'category',
        condition: { match: 'exact' },
        action: 'update',
        priority: 7,
        enabled: true
      }
    ];

    for (const rule of rules) {
      this.transformationRules.set(rule.id, rule);
    }
  }

  private async loadExistingDocuments(): Promise<void> {
    try {
      const docsDir = path.join(this.outputDir, 'documents');
      const files = await fs.readdir(docsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(docsDir, file), 'utf-8');
          const doc: Document = JSON.parse(content);
          this.documents.set(doc.id, doc);
        }
      }
    } catch {
      // No existing documents
    }
  }

  async ingestInformation(info: IncomingInformation): Promise<void> {
    console.log(`📥 Ingesting information from: ${info.source}`);
    console.log(`   Content length: ${info.content.length} chars`);
    console.log(`   Relevance: ${info.relevance}%`);

    // Add to evolution queue
    this.evolutionQueue.push(info);

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processEvolutionQueue();
    }
  }

  private async processEvolutionQueue(): Promise<void> {
    if (this.evolutionQueue.length === 0) return;

    this.isProcessing = true;
    console.log(`\n⚙️  Processing evolution queue (${this.evolutionQueue.length} items)...\n`);

    while (this.evolutionQueue.length > 0) {
      const info = this.evolutionQueue.shift()!;
      await this.transformInformation(info);
    }

    this.isProcessing = false;
    console.log(`✅ Evolution queue processed\n`);
  }

  private async transformInformation(info: IncomingInformation): Promise<void> {
    console.log(`🔄 Transforming information: ${info.id}`);

    // Step 1: Analyze incoming information
    const analysis = await this.analyzeInformation(info);
    console.log(`   Analysis: ${analysis.intent} (confidence: ${analysis.confidence}%)`);

    // Step 2: Find relevant documents
    const relevantDocs = await this.findRelevantDocuments(info, analysis);
    console.log(`   Found ${relevantDocs.length} relevant document(s)`);

    // Step 3: Determine transformation action
    const action = await this.determineAction(info, analysis, relevantDocs);
    console.log(`   Action: ${action.type}`);

    // Step 4: Execute transformation
    await this.executeTransformation(action, info, relevantDocs);
    console.log(`   ✓ Transformation complete\n`);
  }

  private async analyzeInformation(info: IncomingInformation): Promise<any> {
    const prompt = `Analyze this incoming information and determine:
1. Primary intent (create, update, enrich, question, reference)
2. Key topics and concepts
3. Confidence level (0-100)
4. Suggested category
5. Related concepts

Information:
Source: ${info.source}
Content: ${info.content.substring(0, 1000)}...
Category: ${info.category || 'unknown'}

Provide response as JSON:
{
  "intent": "create" | "update" | "enrich" | "question" | "reference",
  "topics": ["topic1", "topic2"],
  "confidence": number,
  "suggestedCategory": "string",
  "relatedConcepts": ["concept1", "concept2"]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    return {
      intent: 'create',
      topics: [],
      confidence: 50,
      suggestedCategory: info.category || 'general',
      relatedConcepts: []
    };
  }

  private async findRelevantDocuments(
    info: IncomingInformation,
    analysis: any
  ): Promise<Document[]> {
    const relevant: Document[] = [];

    for (const doc of this.documents.values()) {
      // Check category match
      if (doc.category === analysis.suggestedCategory) {
        relevant.push(doc);
        continue;
      }

      // Check topic overlap
      const topicOverlap = analysis.topics.some((topic: string) =>
        doc.tags.some(tag => tag.toLowerCase().includes(topic.toLowerCase()))
      );
      if (topicOverlap) {
        relevant.push(doc);
        continue;
      }

      // Check content similarity (simplified)
      const contentSimilarity = this.calculateSimilarity(
        info.content,
        doc.content
      );
      if (contentSimilarity > 0.7) {
        relevant.push(doc);
      }
    }

    return relevant;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private async determineAction(
    info: IncomingInformation,
    analysis: any,
    relevantDocs: Document[]
  ): Promise<any> {
    if (relevantDocs.length === 0 && analysis.intent === 'create') {
      return { type: 'create', targetDocs: [] };
    }

    if (relevantDocs.length === 1) {
      if (analysis.intent === 'update') {
        return { type: 'update', targetDocs: relevantDocs };
      }
      if (analysis.intent === 'enrich') {
        return { type: 'enrich', targetDocs: relevantDocs };
      }
    }

    if (relevantDocs.length > 1) {
      // Check if they should be merged
      const shouldMerge = relevantDocs.every(doc =>
        doc.category === relevantDocs[0].category &&
        this.calculateSimilarity(doc.content, relevantDocs[0].content) > 0.8
      );
      
      if (shouldMerge) {
        return { type: 'merge', targetDocs: relevantDocs };
      }
      
      // Otherwise, update most relevant
      return { type: 'update', targetDocs: [relevantDocs[0]] };
    }

    return { type: 'create', targetDocs: [] };
  }

  private async executeTransformation(
    action: any,
    info: IncomingInformation,
    relevantDocs: Document[]
  ): Promise<void> {
    switch (action.type) {
      case 'create':
        await this.createDocument(info);
        break;
      case 'update':
        await this.updateDocument(action.targetDocs[0], info);
        break;
      case 'enrich':
        await this.enrichDocument(action.targetDocs[0], info);
        break;
      case 'merge':
        await this.mergeDocuments(action.targetDocs, info);
        break;
      case 'restructure':
        await this.restructureDocument(action.targetDocs[0], info);
        break;
    }
  }

  private async createDocument(info: IncomingInformation): Promise<Document> {
    console.log(`   📄 Creating new document...`);

    const prompt = `Create a well-structured document from this information:

Source: ${info.source}
Content: ${info.content}
Category: ${info.category || 'general'}

Generate:
1. Clear title
2. Organized content (markdown format)
3. Relevant tags (5-10)
4. Summary

Format as JSON:
{
  "title": "string",
  "content": "markdown string",
  "tags": ["tag1", "tag2"],
  "summary": "string"
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    let docData: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        docData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      docData = {
        title: `Document from ${info.source}`,
        content: info.content,
        tags: [],
        summary: info.content.substring(0, 200)
      };
    }

    const doc: Document = {
      id: `doc-${Date.now()}`,
      title: docData.title,
      content: docData.content,
      category: info.category || 'general',
      tags: docData.tags,
      version: 1,
      createdAt: new Date(),
      lastModified: new Date(),
      evolutionHistory: [
        {
          timestamp: new Date(),
          changeType: 'created',
          trigger: `Incoming information from ${info.source}`,
          changes: ['Initial document creation'],
          aiReasoning: docData.summary,
          previousVersion: 0,
          newVersion: 1
        }
      ],
      metadata: {
        author: info.source,
        type: 'markdown',
        status: 'active',
        relatedDocs: [],
        confidenceScore: info.relevance,
        completeness: 80
      }
    };

    this.documents.set(doc.id, doc);
    await this.saveDocument(doc);

    console.log(`   ✓ Created: ${doc.title}`);
    return doc;
  }

  private async updateDocument(doc: Document, info: IncomingInformation): Promise<void> {
    console.log(`   📝 Updating document: ${doc.title}`);

    const prompt = `Update this document with new information:

Current Document:
Title: ${doc.title}
Content: ${doc.content}

New Information:
${info.content}

Provide:
1. Updated content (markdown)
2. What changed
3. Reasoning

Format as JSON:
{
  "updatedContent": "markdown string",
  "changes": ["change1", "change2"],
  "reasoning": "string"
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const updateData = JSON.parse(jsonMatch[0]);

        const previousVersion = doc.version;
        doc.content = updateData.updatedContent;
        doc.version += 1;
        doc.lastModified = new Date();

        doc.evolutionHistory.push({
          timestamp: new Date(),
          changeType: 'updated',
          trigger: `New information from ${info.source}`,
          changes: updateData.changes,
          aiReasoning: updateData.reasoning,
          previousVersion,
          newVersion: doc.version
        });

        await this.saveDocument(doc);
        console.log(`   ✓ Updated to version ${doc.version}`);
      }
    } catch (e) {
      console.log(`   ⚠️  Update failed: ${e}`);
    }
  }

  private async enrichDocument(doc: Document, info: IncomingInformation): Promise<void> {
    console.log(`   ✨ Enriching document: ${doc.title}`);

    const prompt = `Enrich this document with additional information:

Current Document:
${doc.content}

Additional Information:
${info.content}

Add relevant details, examples, or clarifications while maintaining structure.

Format as JSON:
{
  "enrichedContent": "markdown string",
  "additions": ["addition1", "addition2"],
  "reasoning": "string"
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enrichData = JSON.parse(jsonMatch[0]);

        const previousVersion = doc.version;
        doc.content = enrichData.enrichedContent;
        doc.version += 1;
        doc.lastModified = new Date();
        doc.metadata.completeness = Math.min(100, doc.metadata.completeness + 10);

        doc.evolutionHistory.push({
          timestamp: new Date(),
          changeType: 'enriched',
          trigger: `Enrichment from ${info.source}`,
          changes: enrichData.additions,
          aiReasoning: enrichData.reasoning,
          previousVersion,
          newVersion: doc.version
        });

        await this.saveDocument(doc);
        console.log(`   ✓ Enriched (completeness: ${doc.metadata.completeness}%)`);
      }
    } catch (e) {
      console.log(`   ⚠️  Enrichment failed: ${e}`);
    }
  }

  private async mergeDocuments(docs: Document[], info: IncomingInformation): Promise<void> {
    console.log(`   🔀 Merging ${docs.length} documents...`);

    const combinedContent = docs.map(d => d.content).join('\n\n---\n\n');

    const prompt = `Merge these related documents into a single, coherent document:

${combinedContent}

Additional context: ${info.content}

Create a unified document that:
1. Eliminates redundancy
2. Organizes content logically
3. Maintains all important information
4. Has clear structure

Format as JSON:
{
  "title": "string",
  "mergedContent": "markdown string",
  "reasoning": "string"
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const mergeData = JSON.parse(jsonMatch[0]);

        // Create merged document
        const mergedDoc: Document = {
          id: `doc-${Date.now()}`,
          title: mergeData.title,
          content: mergeData.mergedContent,
          category: docs[0].category,
          tags: [...new Set(docs.flatMap(d => d.tags))],
          version: 1,
          createdAt: new Date(),
          lastModified: new Date(),
          evolutionHistory: [
            {
              timestamp: new Date(),
              changeType: 'merged',
              trigger: `Merged ${docs.length} similar documents`,
              changes: docs.map(d => `Merged: ${d.title}`),
              aiReasoning: mergeData.reasoning,
              previousVersion: 0,
              newVersion: 1
            }
          ],
          metadata: {
            author: 'system',
            type: 'markdown',
            status: 'active',
            relatedDocs: docs.map(d => d.id),
            confidenceScore: Math.max(...docs.map(d => d.metadata.confidenceScore)),
            completeness: Math.max(...docs.map(d => d.metadata.completeness))
          }
        };

        // Archive old documents
        for (const doc of docs) {
          doc.metadata.status = 'archived';
          await this.saveDocument(doc);
        }

        // Save merged document
        this.documents.set(mergedDoc.id, mergedDoc);
        await this.saveDocument(mergedDoc);

        console.log(`   ✓ Merged into: ${mergedDoc.title}`);
      }
    } catch (e) {
      console.log(`   ⚠️  Merge failed: ${e}`);
    }
  }

  private async restructureDocument(doc: Document, info: IncomingInformation): Promise<void> {
    console.log(`   🏗️  Restructuring document: ${doc.title}`);

    const prompt = `Restructure this document for better organization:

Current Document:
${doc.content}

Context: ${info.content}

Improve:
1. Section organization
2. Logical flow
3. Clarity and readability
4. Table of contents if needed

Format as JSON:
{
  "restructuredContent": "markdown string",
  "improvements": ["improvement1", "improvement2"],
  "reasoning": "string"
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const restructureData = JSON.parse(jsonMatch[0]);

        const previousVersion = doc.version;
        doc.content = restructureData.restructuredContent;
        doc.version += 1;
        doc.lastModified = new Date();

        doc.evolutionHistory.push({
          timestamp: new Date(),
          changeType: 'restructured',
          trigger: `Restructure requested from ${info.source}`,
          changes: restructureData.improvements,
          aiReasoning: restructureData.reasoning,
          previousVersion,
          newVersion: doc.version
        });

        await this.saveDocument(doc);
        console.log(`   ✓ Restructured`);
      }
    } catch (e) {
      console.log(`   ⚠️  Restructure failed: ${e}`);
    }
  }

  private async saveDocument(doc: Document): Promise<void> {
    const docPath = path.join(this.outputDir, 'documents', `${doc.id}.json`);
    await fs.writeFile(docPath, JSON.stringify(doc, null, 2), 'utf-8');

    // Save markdown version
    const mdPath = path.join(this.outputDir, 'documents', `${doc.id}.md`);
    const markdown = `# ${doc.title}\n\n${doc.content}\n\n---\n\n**Version**: ${doc.version}\n**Last Modified**: ${doc.lastModified.toISOString()}\n**Category**: ${doc.category}\n**Tags**: ${doc.tags.join(', ')}`;
    await fs.writeFile(mdPath, markdown, 'utf-8');
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.category === category);
  }

  async getDocumentHistory(id: string): Promise<EvolutionEntry[]> {
    const doc = this.documents.get(id);
    return doc ? doc.evolutionHistory : [];
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc =>
      doc.title.toLowerCase().includes(queryLower) ||
      doc.content.toLowerCase().includes(queryLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }
}
