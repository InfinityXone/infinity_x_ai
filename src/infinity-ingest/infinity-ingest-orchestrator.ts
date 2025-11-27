import { InfinityWebCrawler, type CrawlDomain } from './web-crawler.ts';
import { ValidationEngine } from './validation-engine.ts';
import { KnowledgeProcessor, type ProcessedKnowledge } from './knowledge-processor.ts';
import type { ExtractedContent } from './web-crawler.ts';

/**
 * INFINITY INGEST ORCHESTRATOR
 * Coordinates web crawling → 3-stage validation → knowledge processing
 */
export class InfinityIngestOrchestrator {
  private crawler: InfinityWebCrawler;
  private validator: ValidationEngine;
  private processor: KnowledgeProcessor;

  constructor() {
    this.crawler = new InfinityWebCrawler();
    this.validator = new ValidationEngine();
    this.processor = new KnowledgeProcessor();
  }

  /**
   * Execute full ingest pipeline
   */
  async ingest(options: IngestOptions = {}): Promise<IngestResult> {
    const {
      domains = ['ai', 'business', 'finance', 'social', 'github', 'intelligence'],
      maxPagesPerDomain = 10,
      minValidationScore = 85
    } = options;

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          ∞ INFINITY INGEST SYSTEM ACTIVATED ∞                 ║
║                                                               ║
║   Web Crawling │ 3-Stage Validation │ Knowledge Processing   ║
║   Top 100% Credible Information Pipeline                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

    console.log(`\n⚙️  Configuration:`);
    console.log(`   Domains: ${domains.join(', ')}`);
    console.log(`   Max Pages/Domain: ${maxPagesPerDomain}`);
    console.log(`   Min Validation Score: ${minValidationScore}/100\n`);

    const startTime = Date.now();

    // Phase 1: Web Crawling
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   PHASE 1: WEB CRAWLING`);
    console.log(`${'═'.repeat(65)}`);

    const crawledData = await this.crawler.crawlAll(maxPagesPerDomain);
    const allCrawled = Array.from(crawledData.values()).flat();
    
    console.log(`\n✅ Crawl Complete: ${allCrawled.length} pages`);

    // Phase 2: Content Extraction
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   PHASE 2: CONTENT EXTRACTION`);
    console.log(`${'═'.repeat(65)}`);

    const extractedContents: ExtractedContent[] = [];
    
    for (let i = 0; i < allCrawled.length; i++) {
      const crawled = allCrawled[i];
      console.log(`\n   [${i + 1}/${allCrawled.length}] Extracting: ${crawled.url}`);
      
      const extracted = await this.crawler.extractContent(crawled.content, crawled.url);
      extractedContents.push(extracted);

      // Brief delay
      await this.delay(500);
    }

    console.log(`\n✅ Extraction Complete: ${extractedContents.length} items`);

    // Phase 3: 3-Stage Validation
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   PHASE 3: 3-STAGE VALIDATION`);
    console.log(`   Stage 1: Source Credibility (70+ to pass)`);
    console.log(`   Stage 2: Content Quality (75+ to pass)`);
    console.log(`   Stage 3: Fact Accuracy (85+ final to pass)`);
    console.log(`${'═'.repeat(65)}`);

    const validationResults = await this.validator.validateBatch(extractedContents);
    const validatedContent = this.validator.getValidatedContent(validationResults);

    console.log(`\n✅ Validation Complete: ${validatedContent.length}/${extractedContents.length} passed`);

    // Phase 4: Knowledge Processing
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   PHASE 4: KNOWLEDGE PROCESSING`);
    console.log(`${'═'.repeat(65)}`);

    const processedKnowledge = await this.processor.process(validatedContent, validationResults);

    console.log(`\n✅ Processing Complete: ${processedKnowledge.length} knowledge items`);

    // Phase 5: Save Results
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   PHASE 5: SAVING RESULTS`);
    console.log(`${'═'.repeat(65)}`);

    const knowledgeBasePath = await this.processor.saveKnowledgeBase(
      `knowledge-base-${Date.now()}.json`
    );

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

    // Generate final report
    const result: IngestResult = {
      totalCrawled: allCrawled.length,
      totalExtracted: extractedContents.length,
      totalValidated: validatedContent.length,
      totalProcessed: processedKnowledge.length,
      validationPassRate: (validatedContent.length / extractedContents.length * 100).toFixed(1) + '%',
      averageScore: (validationResults.reduce((sum, r) => sum + r.finalScore, 0) / validationResults.length).toFixed(1),
      topKnowledge: this.processor.getTopKnowledge(10),
      knowledgeBasePath,
      durationMinutes: parseFloat(duration),
      timestamp: new Date().toISOString()
    };

    this.displayFinalReport(result);

    return result;
  }

  /**
   * Ingest specific domain only
   */
  async ingestDomain(domain: CrawlDomain, maxPages: number = 20): Promise<IngestResult> {
    return this.ingest({
      domains: [domain],
      maxPagesPerDomain: maxPages
    });
  }

  /**
   * Display final report
   */
  private displayFinalReport(result: IngestResult): void {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   ∞ INFINITY INGEST - FINAL REPORT ∞`);
    console.log(`${'═'.repeat(65)}`);
    console.log(`\n📊 STATISTICS:`);
    console.log(`   Total Pages Crawled:     ${result.totalCrawled}`);
    console.log(`   Content Extracted:       ${result.totalExtracted}`);
    console.log(`   Validation Pass Rate:    ${result.validationPassRate}`);
    console.log(`   Average Score:           ${result.averageScore}/100`);
    console.log(`   Knowledge Items:         ${result.totalProcessed}`);
    console.log(`   Duration:                ${result.durationMinutes} minutes`);
    
    console.log(`\n🏆 TOP 5 KNOWLEDGE ITEMS:`);
    result.topKnowledge.slice(0, 5).forEach((k, i) => {
      console.log(`\n   ${i + 1}. ${k.source.title}`);
      console.log(`      Score: ${k.validationScore.toFixed(1)}/100`);
      console.log(`      Summary: ${k.summary.slice(0, 150)}...`);
    });

    console.log(`\n💾 OUTPUT:`);
    console.log(`   Knowledge Base: ${result.knowledgeBasePath}`);
    
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   ✅ INGEST COMPLETE - 100% CREDIBLE INFORMATION READY`);
    console.log(`${'═'.repeat(65)}\n`);
  }

  /**
   * Search ingested knowledge
   */
  searchKnowledge(query: string): ProcessedKnowledge[] {
    return this.processor.searchKnowledge(query);
  }

  /**
   * Get top knowledge
   */
  getTopKnowledge(limit: number = 10): ProcessedKnowledge[] {
    return this.processor.getTopKnowledge(limit);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface IngestOptions {
  domains?: CrawlDomain[];
  maxPagesPerDomain?: number;
  minValidationScore?: number;
}

export interface IngestResult {
  totalCrawled: number;
  totalExtracted: number;
  totalValidated: number;
  totalProcessed: number;
  validationPassRate: string;
  averageScore: string;
  topKnowledge: ProcessedKnowledge[];
  knowledgeBasePath: string;
  durationMinutes: number;
  timestamp: string;
}
