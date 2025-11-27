import { EvolutionaryBuilder } from './evolutionary-builder.js';
import { AutoAnalyzer } from './auto-analyzer.js';
import { AutoValidator } from './auto-validator.js';
import { AutoFixer } from './auto-fixer.js';
import { AutoEnhancer } from './auto-enhancer.js';
import { InfinityTaxonomy } from './infinity-taxonomy.js';
import { KnowledgeIngestor } from './knowledge-ingestor.js';

/**
 * INFINITY AUTONOMOUS INTELLIGENCE ORCHESTRATOR
 * Master control system for the self-evolving AI builder
 */
export class InfinityOrchestrator {
  private evolutionary: EvolutionaryBuilder;
  private analyzer: AutoAnalyzer;
  private validator: AutoValidator;
  private fixer: AutoFixer;
  private enhancer: AutoEnhancer;
  private taxonomy: InfinityTaxonomy;
  private ingestor: KnowledgeIngestor;

  constructor() {
    this.evolutionary = new EvolutionaryBuilder();
    this.analyzer = new AutoAnalyzer();
    this.validator = new AutoValidator();
    this.fixer = new AutoFixer();
    this.enhancer = new AutoEnhancer();
    this.taxonomy = new InfinityTaxonomy();
    this.ingestor = new KnowledgeIngestor();
  }

  async activate(): Promise<void> {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          ∞ INFINITY AUTONOMOUS ORCHESTRATOR ∞                 ║
║                                                               ║
║   Auto-Analyze  │  Auto-Validate  │  Auto-Fix                ║
║   Auto-Enhance  │  Auto-Evolve    │  Auto-Learn              ║
║                                                               ║
║   Knowledge Ingestion → Taxonomy Building → Evolution        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

    console.log('🎯 SELECT MODE:\n');
    console.log('1. 🔍 ANALYZE - Analyze entire project');
    console.log('2. ✓ VALIDATE - Validate all code');
    console.log('3. 🔧 FIX - Auto-fix all issues');
    console.log('4. ✨ ENHANCE - Enhance code quality');
    console.log('5. 📚 INGEST - Ingest knowledge base');
    console.log('6. 🏷️  TAXONOMY - Build project taxonomy');
    console.log('7. 🧬 EVOLVE - Start evolutionary cycle');
    console.log('8. ∞ INFINITY - Full autonomous infinity chain\n');

    // For now, auto-start infinity mode
    await this.runInfinityMode();
  }

  private async runInfinityMode(): Promise<void> {
    console.log('🚀 INFINITY MODE ACTIVATED\n');
    console.log('Running complete autonomous cycle...\n');

    // Step 1: Initial Analysis
    console.log('━'.repeat(65));
    console.log('STEP 1: KNOWLEDGE INGESTION & TAXONOMY');
    console.log('━'.repeat(65));
    await this.ingestor.ingestCodebase(process.cwd());
    const taxonomy = await this.taxonomy.buildProjectTaxonomy(process.cwd());

    // Step 2: Analysis
    console.log('\n' + '━'.repeat(65));
    console.log('STEP 2: COMPREHENSIVE ANALYSIS');
    console.log('━'.repeat(65));
    const analysis = await this.analyzer.analyzeProject(process.cwd());

    // Step 3: Validation
    console.log('\n' + '━'.repeat(65));
    console.log('STEP 3: CODE VALIDATION');
    console.log('━'.repeat(65));
    const validation = await this.validator.validateProject();

    // Step 4: Auto-fix if needed
    if (validation.totalErrors > 0) {
      console.log('\n' + '━'.repeat(65));
      console.log('STEP 4: AUTO-FIXING ISSUES');
      console.log('━'.repeat(65));
      await this.fixer.autoFixProject();
    }

    // Step 5: Enhancement if needed
    if (analysis.averageQuality < 85) {
      console.log('\n' + '━'.repeat(65));
      console.log('STEP 5: CODE ENHANCEMENT');
      console.log('━'.repeat(65));
      await this.enhancer.enhanceProject('all');
    }

    // Step 6: Start evolutionary cycle
    console.log('\n' + '━'.repeat(65));
    console.log('STEP 6: EVOLUTIONARY BUILDING');
    console.log('━'.repeat(65));
    console.log('\n🧬 Starting infinite evolutionary loop...\n');
    
    await this.evolutionary.startEvolutionCycle();
  }

  async analyzeOnly(): Promise<void> {
    console.log('🔍 Running analysis only...\n');
    await this.analyzer.analyzeProject(process.cwd());
  }

  async validateOnly(): Promise<void> {
    console.log('✓ Running validation only...\n');
    await this.validator.validateProject();
  }

  async fixOnly(): Promise<void> {
    console.log('🔧 Running auto-fix only...\n');
    await this.fixer.autoFixProject();
  }

  async enhanceOnly(): Promise<void> {
    console.log('✨ Running enhancement only...\n');
    await this.enhancer.enhanceProject('all');
  }

  async ingestOnly(): Promise<void> {
    console.log('📚 Running knowledge ingestion only...\n');
    await this.ingestor.ingestCodebase(process.cwd());
  }

  async taxonomyOnly(): Promise<void> {
    console.log('🏷️  Running taxonomy building only...\n');
    await this.taxonomy.buildProjectTaxonomy(process.cwd());
  }
}

// Main execution
const orchestrator = new InfinityOrchestrator();

console.log('🚀 Initializing Infinity Orchestrator...\n');

orchestrator.activate().catch(console.error);

process.on('SIGINT', () => {
  console.log('\n\n🛑 Infinity Orchestrator stopped by user');
  process.exit(0);
});
