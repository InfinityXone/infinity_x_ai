import { DocumentEvolutionEngine, Document, IncomingInformation } from './document-evolution-engine.ts';
import { LiveDocumentSynchronizer } from './live-document-synchronizer.ts';
import { AIIntegrationLayer } from './ai-integration-layer.ts';
import { TaxonomyManager } from './taxonomy-manager.ts';

export interface EvolutionDocConfig {
  autoSync: boolean;
  syncInterval: number;
  autoEvolve: boolean;
  evolutionInterval: number;
  aiAnalysis: boolean;
  taxonomyGeneration: boolean;
  enabledSubsystems: {
    evolution: boolean;
    sync: boolean;
    ai: boolean;
    taxonomy: boolean;
  };
}

export interface SystemStatus {
  uptime: number;
  startTime: Date;
  documentsProcessed: number;
  documentsCreated: number;
  documentsUpdated: number;
  syncEvents: number;
  aiAnalyses: number;
  taxonomyNodes: number;
  subsystems: {
    evolution: { status: 'running' | 'stopped'; queueSize: number };
    sync: { status: 'running' | 'stopped'; targets: number };
    ai: { status: 'running' | 'stopped'; concepts: number };
    taxonomy: { status: 'running' | 'stopped'; nodes: number };
  };
}

export class EvolutionDocOrchestrator {
  private config: EvolutionDocConfig;
  private evolutionEngine: DocumentEvolutionEngine;
  private synchronizer: LiveDocumentSynchronizer;
  private aiLayer: AIIntegrationLayer;
  private taxonomyManager: TaxonomyManager;
  
  private startTime: Date;
  private isRunning: boolean;
  private evolutionInterval?: NodeJS.Timeout;
  private analysisInterval?: NodeJS.Timeout;
  
  private stats = {
    documentsProcessed: 0,
    documentsCreated: 0,
    documentsUpdated: 0,
    syncEvents: 0,
    aiAnalyses: 0
  };

  constructor(config?: Partial<EvolutionDocConfig>) {
    this.config = {
      autoSync: true,
      syncInterval: 10000, // 10 seconds
      autoEvolve: true,
      evolutionInterval: 30000, // 30 seconds
      aiAnalysis: true,
      taxonomyGeneration: true,
      enabledSubsystems: {
        evolution: true,
        sync: true,
        ai: true,
        taxonomy: true
      },
      ...config
    };

    this.evolutionEngine = new DocumentEvolutionEngine();
    this.synchronizer = new LiveDocumentSynchronizer();
    this.aiLayer = new AIIntegrationLayer();
    this.taxonomyManager = new TaxonomyManager();

    this.startTime = new Date();
    this.isRunning = false;
  }

  async initialize(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════');
    console.log('        INFINITY EVOLUTION DOC SYSTEM v1.0');
    console.log('         Autonomous Document Evolution');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🚀 Initializing Evolution Doc Orchestrator...\n');

    // Initialize subsystems
    if (this.config.enabledSubsystems.evolution) {
      console.log('📄 Initializing Document Evolution Engine...');
      await this.evolutionEngine.initialize();
    }

    if (this.config.enabledSubsystems.sync) {
      console.log('🔄 Initializing Live Document Synchronizer...');
      await this.synchronizer.initialize();
    }

    if (this.config.enabledSubsystems.ai) {
      console.log('🤖 Initializing AI Integration Layer...');
      await this.aiLayer.initialize();
    }

    if (this.config.enabledSubsystems.taxonomy) {
      console.log('📚 Initializing Taxonomy Manager...');
      await this.taxonomyManager.initialize();
    }

    this.isRunning = true;

    console.log('\n✅ All subsystems initialized successfully\n');
    console.log('═══════════════════════════════════════════════════════\n');
  }

  async start(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }

    console.log('▶️  Starting Evolution Doc System...\n');

    // Start evolution cycle
    if (this.config.autoEvolve && this.config.enabledSubsystems.evolution) {
      this.evolutionInterval = setInterval(async () => {
        await this.runEvolutionCycle();
      }, this.config.evolutionInterval);
      
      console.log(`🔁 Evolution cycle started (every ${this.config.evolutionInterval / 1000}s)`);
    }

    // Start AI analysis cycle
    if (this.config.aiAnalysis && this.config.enabledSubsystems.ai) {
      this.analysisInterval = setInterval(async () => {
        await this.runAICycle();
      }, this.config.evolutionInterval * 2); // Run less frequently
      
      console.log(`🧠 AI analysis cycle started (every ${this.config.evolutionInterval * 2 / 1000}s)`);
    }

    console.log('\n✅ Evolution Doc System is running\n');
    this.displayStatus();
  }

  async ingestInformation(info: IncomingInformation): Promise<void> {
    console.log(`📥 Ingesting information: ${info.source}`);

    // Queue for evolution
    await this.evolutionEngine.ingestInformation(info);
    this.stats.documentsProcessed++;

    // Trigger immediate processing if enabled
    if (this.config.autoEvolve) {
      await this.runEvolutionCycle();
    }
  }

  private async runEvolutionCycle(): Promise<void> {
    try {
      // Get all documents
      const documents = this.evolutionEngine.getAllDocuments();
      
      if (documents.length === 0) return;

      // Sync documents
      if (this.config.autoSync && this.config.enabledSubsystems.sync) {
        await this.synchronizer.syncAllTargets();
        this.stats.syncEvents++;
      }

      // Update taxonomy
      if (this.config.taxonomyGeneration && this.config.enabledSubsystems.taxonomy) {
        const concepts = this.aiLayer.getAllConcepts();
        await this.taxonomyManager.evolveTaxonomy(documents, concepts);
      }
    } catch (error) {
      console.log(`⚠️  Evolution cycle error: ${error}`);
    }
  }

  private async runAICycle(): Promise<void> {
    try {
      const documents = this.evolutionEngine.getAllDocuments();
      
      if (documents.length === 0) return;

      console.log(`\n🧠 Running AI analysis cycle...`);

      // Extract concepts
      const newConcepts = await this.aiLayer.extractConcepts(documents);
      
      // Detect relationships
      const relationships = await this.aiLayer.detectRelationships(documents);
      
      // Identify gaps
      const gaps = await this.aiLayer.identifyContentGaps(documents);
      
      // Generate taxonomy
      if (this.config.taxonomyGeneration) {
        await this.aiLayer.generateTaxonomy(documents);
      }

      this.stats.aiAnalyses++;

      console.log(`   ✓ AI cycle complete`);
      console.log(`   Concepts: ${newConcepts.length}`);
      console.log(`   Relationships: ${relationships.length}`);
      console.log(`   Gaps: ${gaps.length}\n`);

      // Act on actionable insights
      const actionableInsights = this.aiLayer.getActionableInsights();
      for (const insight of actionableInsights) {
        if (insight.insightType === 'gap' && insight.suggestedAction) {
          console.log(`💡 Insight: ${insight.title}`);
          console.log(`   Action: ${insight.suggestedAction}\n`);
        }
      }
    } catch (error) {
      console.log(`⚠️  AI cycle error: ${error}`);
    }
  }

  async analyzeDocument(documentId: string): Promise<void> {
    const doc = this.evolutionEngine.getDocument(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    console.log(`\n🔍 Analyzing document: ${doc.title}\n`);

    // AI quality analysis
    const insights = await this.aiLayer.analyzeDocumentQuality(doc);
    
    console.log(`   Quality Insights: ${insights.length}`);
    for (const insight of insights) {
      console.log(`   - ${insight.title}: ${insight.description}`);
    }

    // Generate tags
    const tags = await this.aiLayer.generateTags(doc);
    console.log(`\n   Suggested Tags: ${tags.join(', ')}`);

    // Generate summary
    const summary = await this.aiLayer.summarizeDocument(doc);
    console.log(`\n   Summary: ${summary}\n`);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return this.evolutionEngine.searchDocuments(query);
  }

  async searchTaxonomy(query: string) {
    return this.taxonomyManager.searchTaxonomy(query);
  }

  async getStatus(): Promise<SystemStatus> {
    const uptime = Date.now() - this.startTime.getTime();
    const documents = this.evolutionEngine.getAllDocuments();
    const syncStatus = await this.synchronizer.getSyncStatus();

    return {
      uptime,
      startTime: this.startTime,
      documentsProcessed: this.stats.documentsProcessed,
      documentsCreated: documents.filter(d => d.evolutionHistory.length === 1).length,
      documentsUpdated: documents.filter(d => d.evolutionHistory.length > 1).length,
      syncEvents: this.stats.syncEvents,
      aiAnalyses: this.stats.aiAnalyses,
      taxonomyNodes: this.taxonomyManager.getAllNodes().length,
      subsystems: {
        evolution: {
          status: this.config.enabledSubsystems.evolution ? 'running' : 'stopped',
          queueSize: 0 // evolutionEngine would expose this
        },
        sync: {
          status: this.config.enabledSubsystems.sync ? 'running' : 'stopped',
          targets: syncStatus.enabledTargets
        },
        ai: {
          status: this.config.enabledSubsystems.ai ? 'running' : 'stopped',
          concepts: this.aiLayer.getAllConcepts().length
        },
        taxonomy: {
          status: this.config.enabledSubsystems.taxonomy ? 'running' : 'stopped',
          nodes: this.taxonomyManager.getAllNodes().length
        }
      }
    };
  }

  displayStatus(): void {
    const status = this.getStatusSync();

    console.log('═══════════════════════════════════════════════════════');
    console.log('                    SYSTEM STATUS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Start Time:         ${status.startTime.toLocaleString()}`);
    console.log(`Uptime:            ${Math.floor(status.uptime / 1000)}s`);
    console.log('');
    console.log('📊 STATISTICS');
    console.log(`Documents Created:  ${status.documentsCreated}`);
    console.log(`Documents Updated:  ${status.documentsUpdated}`);
    console.log(`Total Processed:    ${status.documentsProcessed}`);
    console.log(`Sync Events:       ${status.syncEvents}`);
    console.log(`AI Analyses:       ${status.aiAnalyses}`);
    console.log(`Taxonomy Nodes:    ${status.taxonomyNodes}`);
    console.log('');
    console.log('🔧 SUBSYSTEMS');
    console.log(`Evolution Engine:   ${status.subsystems.evolution.status}`);
    console.log(`Synchronizer:       ${status.subsystems.sync.status} (${status.subsystems.sync.targets} targets)`);
    console.log(`AI Layer:          ${status.subsystems.ai.status} (${status.subsystems.ai.concepts} concepts)`);
    console.log(`Taxonomy Manager:   ${status.subsystems.taxonomy.status} (${status.subsystems.taxonomy.nodes} nodes)`);
    console.log('═══════════════════════════════════════════════════════\n');
  }

  private getStatusSync(): SystemStatus {
    const uptime = Date.now() - this.startTime.getTime();
    const documents = this.evolutionEngine.getAllDocuments();

    return {
      uptime,
      startTime: this.startTime,
      documentsProcessed: this.stats.documentsProcessed,
      documentsCreated: documents.filter(d => d.evolutionHistory.length === 1).length,
      documentsUpdated: documents.filter(d => d.evolutionHistory.length > 1).length,
      syncEvents: this.stats.syncEvents,
      aiAnalyses: this.stats.aiAnalyses,
      taxonomyNodes: this.taxonomyManager.getAllNodes().length,
      subsystems: {
        evolution: {
          status: this.config.enabledSubsystems.evolution ? 'running' : 'stopped',
          queueSize: 0
        },
        sync: {
          status: this.config.enabledSubsystems.sync ? 'running' : 'stopped',
          targets: this.synchronizer.getAllSyncTargets().filter(t => t.enabled).length
        },
        ai: {
          status: this.config.enabledSubsystems.ai ? 'running' : 'stopped',
          concepts: this.aiLayer.getAllConcepts().length
        },
        taxonomy: {
          status: this.config.enabledSubsystems.taxonomy ? 'running' : 'stopped',
          nodes: this.taxonomyManager.getAllNodes().length
        }
      }
    };
  }

  async exportTaxonomy(format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    if (format === 'markdown') {
      return await this.taxonomyManager.exportTaxonomyMarkdown();
    } else {
      const nodes = this.taxonomyManager.getAllNodes();
      return JSON.stringify(nodes, null, 2);
    }
  }

  async generateKnowledgeGraph() {
    return await this.taxonomyManager.generateKnowledgeGraph();
  }

  async shutdown(): Promise<void> {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('              SHUTTING DOWN SYSTEM');
    console.log('═══════════════════════════════════════════════════════\n');

    this.isRunning = false;

    // Stop intervals
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
    }
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    // Final evolution cycle
    console.log('🔄 Running final evolution cycle...');
    await this.runEvolutionCycle();

    // Final AI analysis
    if (this.config.aiAnalysis) {
      console.log('🧠 Running final AI analysis...');
      await this.runAICycle();
    }

    // Shutdown subsystems
    if (this.config.enabledSubsystems.sync) {
      await this.synchronizer.shutdown();
    }

    // Generate final taxonomy
    if (this.config.taxonomyGeneration) {
      console.log('📚 Generating final taxonomy...');
      await this.taxonomyManager.generateKnowledgeGraph();
      await this.taxonomyManager.exportTaxonomyMarkdown();
    }

    // Display final status
    console.log('\n📊 FINAL STATISTICS\n');
    this.displayStatus();

    console.log('═══════════════════════════════════════════════════════');
    console.log('            SHUTDOWN COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
  }

  // Subsystem accessors
  getEvolutionEngine(): DocumentEvolutionEngine {
    return this.evolutionEngine;
  }

  getSynchronizer(): LiveDocumentSynchronizer {
    return this.synchronizer;
  }

  getAILayer(): AIIntegrationLayer {
    return this.aiLayer;
  }

  getTaxonomyManager(): TaxonomyManager {
    return this.taxonomyManager;
  }

  getConfig(): EvolutionDocConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<EvolutionDocConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️  Configuration updated\n');
  }
}
