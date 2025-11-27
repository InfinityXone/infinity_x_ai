import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';

dotenv.config();

/**
 * INFINITY WEB CRAWLER
 * Multi-domain web crawler for AI, business, financial, social, and intelligence sources
 */
export class InfinityWebCrawler {
  private client: Anthropic;
  private crawledUrls: Set<string> = new Set();
  private rateLimiter: Map<string, number> = new Map();

  // Curated list of high-credibility sources
  private readonly TRUSTED_SOURCES = {
    ai: [
      'https://arxiv.org',
      'https://openai.com/research',
      'https://www.anthropic.com',
      'https://deepmind.google',
      'https://ai.googleblog.com',
      'https://blog.research.google',
      'https://www.microsoft.com/en-us/research/blog',
      'https://ai.meta.com',
      'https://huggingface.co/papers',
      'https://distill.pub'
    ],
    business: [
      'https://www.forbes.com',
      'https://www.bloomberg.com',
      'https://www.wsj.com',
      'https://www.economist.com',
      'https://www.ft.com',
      'https://www.reuters.com/business',
      'https://hbr.org',
      'https://www.mckinsey.com/insights',
      'https://www.bcg.com/publications',
      'https://www.bain.com/insights'
    ],
    finance: [
      'https://www.federalreserve.gov',
      'https://www.imf.org',
      'https://www.worldbank.org',
      'https://www.bis.org',
      'https://www.sec.gov',
      'https://www.finra.org',
      'https://www.investopedia.com',
      'https://www.morningstar.com',
      'https://seekingalpha.com',
      'https://www.marketwatch.com'
    ],
    social: [
      'https://techcrunch.com',
      'https://www.theverge.com',
      'https://arstechnica.com',
      'https://www.wired.com',
      'https://www.technologyreview.com',
      'https://news.ycombinator.com',
      'https://reddit.com/r/MachineLearning',
      'https://reddit.com/r/artificial',
      'https://medium.com/tag/artificial-intelligence'
    ],
    github: [
      'https://github.com/topics/artificial-intelligence',
      'https://github.com/topics/machine-learning',
      'https://github.com/topics/deep-learning',
      'https://github.com/trending',
      'https://github.com/explore'
    ],
    intelligence: [
      'https://www.nature.com',
      'https://www.science.org',
      'https://www.pnas.org',
      'https://papers.ssrn.com',
      'https://scholar.google.com',
      'https://www.semanticscholar.org',
      'https://www.researchgate.net'
    ]
  };

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in .env');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Crawl specific domain category
   */
  async crawlDomain(domain: CrawlDomain, maxPages: number = 50): Promise<CrawlResult[]> {
    console.log(`\n🌐 Crawling ${domain} sources...`);
    
    const sources = this.TRUSTED_SOURCES[domain] || [];
    const results: CrawlResult[] = [];

    for (const source of sources) {
      try {
        // Rate limiting check
        if (!this.canCrawl(source)) {
          console.log(`   ⏸️  Rate limited: ${source}`);
          continue;
        }

        console.log(`   🔍 Crawling: ${source}`);
        
        const content = await this.fetchContent(source);
        
        if (content) {
          results.push({
            url: source,
            domain,
            content,
            timestamp: new Date().toISOString(),
            credibilityScore: 95 // High initial score for trusted sources
          });

          this.crawledUrls.add(source);
          console.log(`   ✅ Fetched: ${source} (${content.length} chars)`);
        }

        // Respect rate limits
        await this.delay(1000);

        if (results.length >= maxPages) break;

      } catch (error: any) {
        console.log(`   ⚠️  Error crawling ${source}: ${error.message}`);
      }
    }

    console.log(`✅ Crawled ${results.length} pages from ${domain}`);
    return results;
  }

  /**
   * Crawl all domains
   */
  async crawlAll(maxPagesPerDomain: number = 20): Promise<Map<CrawlDomain, CrawlResult[]>> {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`   INFINITY WEB CRAWLER - FULL CRAWL`);
    console.log(`${'═'.repeat(65)}\n`);

    const allResults = new Map<CrawlDomain, CrawlResult[]>();
    const domains: CrawlDomain[] = ['ai', 'business', 'finance', 'social', 'github', 'intelligence'];

    for (const domain of domains) {
      const results = await this.crawlDomain(domain, maxPagesPerDomain);
      allResults.set(domain, results);
      
      // Brief pause between domain categories
      await this.delay(2000);
    }

    const totalPages = Array.from(allResults.values()).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n✅ Total pages crawled: ${totalPages}`);

    return allResults;
  }

  /**
   * Fetch content from URL
   */
  private async fetchContent(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 InfinityWebCrawler/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
          // Limit data size to prevent memory issues
          if (data.length > 1000000) { // 1MB limit
            req.destroy();
            resolve(data.slice(0, 1000000));
          }
        });

        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Extract text content using AI
   */
  async extractContent(html: string, url: string): Promise<ExtractedContent> {
    console.log(`   🧠 Extracting content from ${url}...`);

    const prompt = `Extract the main content from this HTML page. Focus on:
- Article title and main text
- Key facts and data points
- Author and publication date if available
- Relevant statistics or research findings

HTML content (truncated):
${html.slice(0, 15000)}

Return structured JSON:
{
  "title": "Article title",
  "author": "Author name or Unknown",
  "publishDate": "Date or Unknown",
  "mainContent": "Main article text",
  "keyPoints": ["Key point 1", "Key point 2"],
  "statistics": ["Stat 1", "Stat 2"],
  "category": "AI/Business/Finance/etc"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      
      // Try to parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return {
          url,
          title: extracted.title || 'Unknown',
          author: extracted.author || 'Unknown',
          publishDate: extracted.publishDate || 'Unknown',
          content: extracted.mainContent || '',
          keyPoints: extracted.keyPoints || [],
          statistics: extracted.statistics || [],
          category: extracted.category || 'General'
        };
      }
    } catch (error: any) {
      console.log(`   ⚠️  Extraction error: ${error.message}`);
    }

    // Fallback: return basic extraction
    return {
      url,
      title: 'Content from ' + url,
      author: 'Unknown',
      publishDate: 'Unknown',
      content: html.slice(0, 5000).replace(/<[^>]*>/g, ' ').slice(0, 2000),
      keyPoints: [],
      statistics: [],
      category: 'General'
    };
  }

  /**
   * Check if URL can be crawled (rate limiting)
   */
  private canCrawl(url: string): boolean {
    const domain = new URL(url).hostname;
    const lastCrawl = this.rateLimiter.get(domain) || 0;
    const now = Date.now();
    
    if (now - lastCrawl < 2000) { // 2 second minimum between requests to same domain
      return false;
    }

    this.rateLimiter.set(domain, now);
    return true;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get crawl statistics
   */
  getStats(): CrawlStats {
    return {
      totalCrawled: this.crawledUrls.size,
      domains: Array.from(this.crawledUrls).reduce((acc, url) => {
        const domain = new URL(url).hostname;
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export type CrawlDomain = 'ai' | 'business' | 'finance' | 'social' | 'github' | 'intelligence';

export interface CrawlResult {
  url: string;
  domain: CrawlDomain;
  content: string;
  timestamp: string;
  credibilityScore: number;
}

export interface ExtractedContent {
  url: string;
  title: string;
  author: string;
  publishDate: string;
  content: string;
  keyPoints: string[];
  statistics: string[];
  category: string;
}

export interface CrawlStats {
  totalCrawled: number;
  domains: Record<string, number>;
}
