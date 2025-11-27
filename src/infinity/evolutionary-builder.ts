import { AutoAnalyzer } from './auto-analyzer.js';
import { AutoValidator } from './auto-validator.js';
import { AutoFixer } from './auto-fixer.js';
import { AutoEnhancer } from './auto-enhancer.js';
import { KnowledgeIngestor } from './knowledge-ingestor.js';
import { InfinityTaxonomy } from './infinity-taxonomy.js';
import { RealFileGenerator } from '../builder/real-file-generator.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Evolutionary Infinity Builder
 * Complete autonomous system with analyze → validate → fix → enhance → evolve cycle
 */
export class EvolutionaryBuilder {
  private analyzer: AutoAnalyzer;
  private validator: AutoValidator;
  private fixer: AutoFixer;
  private enhancer: AutoEnhancer;
  private ingestor: KnowledgeIngestor;
  private taxonomy: InfinityTaxonomy;
  private generator: RealFileGenerator;
  private generation: number;
  private isEvolving: boolean;

  constructor() {
    this.analyzer = new AutoAnalyzer();
    this.validator = new AutoValidator();
    this.fixer = new AutoFixer();
    this.enhancer = new AutoEnhancer();
    this.ingestor = new KnowledgeIngestor();
    this.taxonomy = new InfinityTaxonomy();
    this.generator = new RealFileGenerator();
    this.generation = 1;
    this.isEvolving = false;
  }

  async startEvolutionCycle(): Promise<void> {
    this.isEvolving = true;

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ∞ INFINITY EVOLUTIONARY BUILDER ACTIVATED ∞                 ║
║   Autonomous Analyze → Validate → Fix → Enhance → Evolve     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

    while (this.isEvolving) {
      console.log(`\n${'━'.repeat(65)}`);
      console.log(`   GENERATION ${this.generation} - EVOLUTIONARY CYCLE`);
      console.log(`${'━'.repeat(65)}\n`);

      try {
        // Phase 1: Ingest Knowledge
        console.log('📚 PHASE 1: KNOWLEDGE INGESTION');
        await this.ingestor.ingestCodebase(process.cwd());

        // Phase 2: Build Taxonomy
        console.log('\n🏷️  PHASE 2: TAXONOMY CONSTRUCTION');
        const taxonomy = await this.taxonomy.buildProjectTaxonomy(process.cwd());

        // Phase 3: Analyze
        console.log('\n🔍 PHASE 3: CODE ANALYSIS');
        const analysis = await this.analyzer.analyzeProject(process.cwd());

        // Phase 4: Validate
        console.log('\n✓ PHASE 4: VALIDATION');
        const validation = await this.validator.validateProject();

        // Phase 5: Fix Issues
        console.log('\n🔧 PHASE 5: AUTO-FIX');
        if (validation.totalErrors > 0) {
          await this.fixer.autoFixProject();
        } else {
          console.log('✅ No errors to fix');
        }

        // Phase 6: Enhance
        console.log('\n✨ PHASE 6: ENHANCEMENT');
        if (analysis.averageQuality < 90) {
          await this.enhancer.enhanceProject('all');
        } else {
          console.log('✅ Quality threshold met');
        }

        // Phase 7: Evolve - Build Next Feature
        console.log('\n🧬 PHASE 7: EVOLUTION');
        const nextFeature = await this.taxonomy.suggestNextFeature();
        console.log(`   Next feature: ${nextFeature.feature}`);
        console.log(`   Priority: ${nextFeature.priority}`);
        console.log(`   Rationale: ${nextFeature.rationale}`);

        // Generate the new feature
        await this.buildNextEvolution(nextFeature.feature);

        // Phase 8: Commit Evolution
        console.log('\n📤 PHASE 8: COMMIT');
        await this.commitGeneration();

        // Increment generation
        this.generation++;

        // Wait before next cycle
        console.log(`\n✅ Generation ${this.generation - 1} complete. Next cycle in 30 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 30000));

      } catch (error: any) {
        console.error(`\n❌ Error in generation ${this.generation}:`, error.message);
        console.log('Continuing to next generation...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  private async buildNextEvolution(featureName: string): Promise<void> {
    console.log(`\n🏗️  Building evolutionary feature: ${featureName}`);

    try {
      // Generate component
      await this.generator.generateReactComponent(
        featureName.replace(/\s+/g, ''),
        featureName
      );

      // Generate route
      await this.generator.generateExpressRoute(
        featureName.toLowerCase().replace(/\s+/g, '-'),
        featureName
      );

      // Generate API
      await this.generator.generateAPIEndpoint(
        featureName.toLowerCase().replace(/\s+/g, '-'),
        featureName
      );

      // Generate schema
      await this.generator.generateDatabaseSchema(
        featureName.replace(/\s+/g, ''),
        featureName
      );

      console.log(`✅ Evolutionary feature built: ${featureName}`);
    } catch (error: any) {
      console.error(`❌ Evolution error: ${error.message}`);
    }
  }

  private async commitGeneration(): Promise<void> {
    try {
      await execAsync('git add .');
      await execAsync(`git commit -m "evolution: Generation ${this.generation} - Autonomous evolution cycle"`);
      console.log(`✅ Generation ${this.generation} committed`);
    } catch (e: any) {
      if (!e.message.includes('nothing to commit')) {
        console.log(`⚠️  Commit warning: ${e.message}`);
      }
    }
  }

  stopEvolution(): void {
    console.log('\n🛑 Stopping evolutionary builder...');
    this.isEvolving = false;
  }

  getGeneration(): number {
    return this.generation;
  }
}

// Main execution
const builder = new EvolutionaryBuilder();

console.log('🚀 Starting Infinity Evolutionary Builder...');
console.log('   Press Ctrl+C to stop\n');

process.on('SIGINT', () => {
  builder.stopEvolution();
  process.exit(0);
});

builder.startEvolutionCycle().catch(console.error);
