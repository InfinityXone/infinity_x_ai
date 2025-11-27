import { EvolutionDocOrchestrator } from './evolution-doc-orchestrator.ts';
import { IncomingInformation } from './document-evolution-engine.ts';

interface CLIArgs {
  mode: 'full' | 'evolution' | 'sync' | 'ai' | 'taxonomy' | 'demo';
  noSync?: boolean;
  noAI?: boolean;
  noTaxonomy?: boolean;
  evolutionInterval?: number;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  
  const parsed: CLIArgs = {
    mode: 'full'
  };

  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      parsed.mode = arg.split('=')[1] as any;
    } else if (arg === '--no-sync') {
      parsed.noSync = true;
    } else if (arg === '--no-ai') {
      parsed.noAI = true;
    } else if (arg === '--no-taxonomy') {
      parsed.noTaxonomy = true;
    } else if (arg.startsWith('--evolution-interval=')) {
      parsed.evolutionInterval = parseInt(arg.split('=')[1]);
    }
  }

  return parsed;
}

async function runDemo(orchestrator: EvolutionDocOrchestrator): Promise<void> {
  console.log('🎭 Running Evolution Doc System Demo\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Demo data: Ingest information about a fictional system
  const demoInfo: IncomingInformation[] = [
    {
      source: 'demo-1',
      content: `
# Quantum Computing Basics

Quantum computing is a revolutionary approach to computation that leverages the principles 
of quantum mechanics. Unlike classical computers that use bits (0 or 1), quantum computers 
use quantum bits or qubits which can exist in superposition states.

Key concepts:
- Superposition: Qubits can be in multiple states simultaneously
- Entanglement: Qubits can be correlated in ways impossible classically
- Quantum gates: Operations that manipulate qubit states

Applications include cryptography, drug discovery, and optimization problems.
      `,
      timestamp: new Date(),
      type: 'article',
      relevance: 95
    },
    {
      source: 'demo-2',
      content: `
Update on quantum computing: Recent breakthrough in quantum error correction has improved 
qubit stability by 40%. This advancement brings us closer to practical quantum computers.
Researchers at TechLab achieved this by implementing a new surface code technique.
      `,
      timestamp: new Date(),
      type: 'update',
      relevance: 88
    },
    {
      source: 'demo-3',
      content: `
# AI and Machine Learning Integration

Artificial Intelligence (AI) and Machine Learning (ML) are transforming industries.
Machine learning algorithms can learn patterns from data without explicit programming.

Types of ML:
- Supervised Learning: Training with labeled data
- Unsupervised Learning: Finding patterns in unlabeled data
- Reinforcement Learning: Learning through trial and error

Deep learning, a subset of ML, uses neural networks with multiple layers.
      `,
      timestamp: new Date(),
      type: 'article',
      relevance: 92
    },
    {
      source: 'demo-4',
      content: `
Connection between quantum computing and AI: Quantum machine learning combines quantum 
computing with ML algorithms. This could exponentially speed up certain ML tasks like 
optimization and pattern recognition. IBM and Google are leading research in this area.
      `,
      timestamp: new Date(),
      type: 'insight',
      relevance: 90
    },
    {
      source: 'demo-5',
      content: `
# Data Security and Encryption

Modern encryption relies on mathematical problems that are hard for classical computers 
to solve. However, quantum computers pose a threat to current encryption methods.

Post-quantum cryptography is being developed to protect against quantum attacks.
NIST is standardizing quantum-resistant algorithms for future security.
      `,
      timestamp: new Date(),
      type: 'article',
      relevance: 85
    }
  ];

  console.log(`📥 Ingesting ${demoInfo.length} demo documents...\n`);

  // Ingest documents one by one with delays
  for (let i = 0; i < demoInfo.length; i++) {
    const info = demoInfo[i];
    console.log(`\n[${i + 1}/${demoInfo.length}] Processing: ${info.source}`);
    console.log(`   Type: ${info.type}`);
    console.log(`   Relevance: ${info.relevance}%\n`);
    
    await orchestrator.ingestInformation(info);
    
    // Small delay between ingestions
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('              DEMO INGESTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Wait for processing
  console.log('⏳ Allowing system to process and evolve documents...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Show results
  console.log('📊 DEMO RESULTS\n');
  
  const documents = orchestrator.getEvolutionEngine().getAllDocuments();
  console.log(`Total Documents Created: ${documents.length}\n`);

  for (const doc of documents) {
    console.log(`📄 ${doc.title}`);
    console.log(`   Category: ${doc.category}`);
    console.log(`   Version: ${doc.version}`);
    console.log(`   Completeness: ${doc.metadata.completeness}%`);
    console.log(`   Confidence: ${doc.metadata.confidenceScore}%`);
    console.log(`   Evolution: ${doc.evolutionHistory.length} changes`);
    console.log('');
  }

  // Show taxonomy
  console.log('\n📚 TAXONOMY\n');
  const taxonomy = await orchestrator.exportTaxonomy('markdown');
  console.log(taxonomy);

  // Show AI insights
  console.log('\n🧠 AI INSIGHTS\n');
  const insights = orchestrator.getAILayer().getActionableInsights();
  for (const insight of insights) {
    console.log(`💡 ${insight.title}`);
    console.log(`   ${insight.description}`);
    if (insight.suggestedAction) {
      console.log(`   Action: ${insight.suggestedAction}`);
    }
    console.log('');
  }

  console.log('\n✅ Demo complete!\n');
}

async function main(): Promise<void> {
  const args = parseArgs();

  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║       INFINITY EVOLUTION DOC SYSTEM v1.0              ║');
  console.log('║     Autonomous Document Evolution & Synchronization   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log(`Mode: ${args.mode.toUpperCase()}\n`);

  // Configure based on mode and args
  const config = {
    autoSync: args.mode === 'sync' || (args.mode === 'full' && !args.noSync),
    syncInterval: 10000,
    autoEvolve: args.mode === 'evolution' || args.mode === 'full',
    evolutionInterval: args.evolutionInterval || 30000,
    aiAnalysis: args.mode === 'ai' || (args.mode === 'full' && !args.noAI),
    taxonomyGeneration: args.mode === 'taxonomy' || (args.mode === 'full' && !args.noTaxonomy),
    enabledSubsystems: {
      evolution: args.mode === 'evolution' || args.mode === 'full' || args.mode === 'demo',
      sync: args.mode === 'sync' || (args.mode === 'full' && !args.noSync),
      ai: args.mode === 'ai' || (args.mode === 'full' && !args.noAI) || args.mode === 'demo',
      taxonomy: args.mode === 'taxonomy' || (args.mode === 'full' && !args.noTaxonomy) || args.mode === 'demo'
    }
  };

  const orchestrator = new EvolutionDocOrchestrator(config);
  await orchestrator.initialize();

  if (args.mode === 'demo') {
    await orchestrator.start();
    await runDemo(orchestrator);
    await orchestrator.shutdown();
    process.exit(0);
  } else {
    await orchestrator.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Received shutdown signal...\n');
      await orchestrator.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Received termination signal...\n');
      await orchestrator.shutdown();
      process.exit(0);
    });

    // Keep alive
    console.log('Press Ctrl+C to stop the system\n');
    await new Promise(() => {}); // Run indefinitely
  }
}

// Run CLI
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
