import { KnowledgeIngestor, type KnowledgeType } from '../infinity/knowledge-ingestor.ts';
import { InfinityTaxonomy } from '../infinity/infinity-taxonomy.ts';

/**
 * Knowledge Crawler
 * Crawls and ingests knowledge from multiple sources
 */
export class KnowledgeCrawler {
  private ingestor: KnowledgeIngestor;
  private taxonomy: InfinityTaxonomy;
  private crawledSources: Set<string>;

  constructor() {
    this.ingestor = new KnowledgeIngestor();
    this.taxonomy = new InfinityTaxonomy();
    this.crawledSources = new Set();
  }

  /**
   * Crawl and ingest from multiple knowledge sources
   */
  async crawlKnowledgeSources(sources: KnowledgeSource[]): Promise<CrawlResult> {
    console.log(`\n🕷️  Crawling ${sources.length} knowledge sources...`);

    const results = await Promise.allSettled(
      sources.map(source => this.crawlSource(source))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    console.log(`✅ Crawl complete: ${successful} succeeded, ${failed} failed`);

    return {
      totalSources: sources.length,
      successful,
      failed,
      crawledSources: Array.from(this.crawledSources),
      timestamp: new Date().toISOString()
    };
  }

  private async crawlSource(source: KnowledgeSource): Promise<void> {
    console.log(`   Crawling: ${source.url || source.path}`);

    try {
      if (source.type === 'codebase') {
        await this.ingestor.ingestCodebase(source.path!);
      } else if (source.type === 'documentation') {
        await this.ingestor.ingestDocumentation(source.url || source.path!, source.knowledgeType);
      }

      this.crawledSources.add(source.url || source.path!);
      console.log(`   ✓ ${source.name} ingested`);
    } catch (error: any) {
      console.error(`   ✗ Failed to crawl ${source.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Auto-discover and crawl local project knowledge
   */
  async autoDiscoverLocal(projectRoot: string): Promise<LocalKnowledgeMap> {
    console.log(`\n🔍 Auto-discovering local knowledge in: ${projectRoot}`);

    // Discover code patterns
    await this.ingestor.ingestCodebase(projectRoot);

    // Build taxonomy
    const taxonomy = await this.taxonomy.buildProjectTaxonomy(projectRoot);

    // Get knowledge base
    const knowledgeBase = this.ingestor.getKnowledgeBase();

    return {
      projectRoot,
      patternsFound: taxonomy.recommendations.length,
      categoriesDiscovered: Object.keys(taxonomy.categories).length,
      knowledgeEntries: knowledgeBase.size,
      taxonomy,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Query accumulated knowledge
   */
  async queryKnowledge(query: string): Promise<string> {
    return await this.ingestor.queryKnowledge(query);
  }
}

export interface KnowledgeSource {
  name: string;
  type: 'codebase' | 'documentation' | 'api_reference';
  url?: string;
  path?: string;
  knowledgeType: KnowledgeType;
}

export interface CrawlResult {
  totalSources: number;
  successful: number;
  failed: number;
  crawledSources: string[];
  timestamp: string;
}

export interface LocalKnowledgeMap {
  projectRoot: string;
  patternsFound: number;
  categoriesDiscovered: number;
  knowledgeEntries: number;
  taxonomy: any;
  timestamp: string;
}
