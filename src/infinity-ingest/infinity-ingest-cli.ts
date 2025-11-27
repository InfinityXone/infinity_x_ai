import { InfinityIngestOrchestrator } from './infinity-ingest-orchestrator.ts';
import type { CrawlDomain } from './web-crawler.ts';

/**
 * INFINITY INGEST CLI
 * Command-line interface for the ingest system
 */
async function main() {
  console.log('\n🚀 Starting Infinity Ingest System...\n');

  const orchestrator = new InfinityIngestOrchestrator();

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  const domainArg = args.find(arg => arg.startsWith('--domain='));
  const pagesArg = args.find(arg => arg.startsWith('--pages='));
  
  if (domainArg) {
    // Single domain mode
    const domain = domainArg.split('=')[1] as CrawlDomain;
    const maxPages = pagesArg ? parseInt(pagesArg.split('=')[1]) : 20;
    
    console.log(`📌 Single Domain Mode: ${domain}\n`);
    await orchestrator.ingestDomain(domain, maxPages);
    
  } else {
    // Full ingest mode
    const maxPagesPerDomain = pagesArg ? parseInt(pagesArg.split('=')[1]) : 10;
    
    console.log(`📌 Full Ingest Mode - All Domains\n`);
    await orchestrator.ingest({
      maxPagesPerDomain,
      minValidationScore: 85
    });
  }

  console.log('\n✅ Infinity Ingest completed successfully!\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Received interrupt signal - shutting down gracefully...');
  process.exit(0);
});

// Run CLI
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
