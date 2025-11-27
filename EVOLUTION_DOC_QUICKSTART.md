# Evolution Doc System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install & Configure

```bash
# Install dependencies (if not already done)
pnpm install

# Set your Anthropic API key
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

### 2. Run the Demo

```bash
# Run with TypeScript directly
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=demo
```

The demo will:
- ✨ Ingest 5 sample documents about quantum computing, AI, and security
- 🤖 Use AI to transform and structure them
- 📚 Generate automatic taxonomy
- 🔗 Detect relationships between documents
- 💡 Provide AI insights

### 3. Run Full System

```bash
# Start all subsystems
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=full
```

Press `Ctrl+C` to stop gracefully.

---

## 📁 System Components

### Core Files

1. **`document-evolution-engine.ts`** - Document transformation engine
2. **`live-document-synchronizer.ts`** - Real-time sync across systems
3. **`ai-integration-layer.ts`** - AI-powered analysis
4. **`taxonomy-manager.ts`** - Auto taxonomy generation
5. **`evolution-doc-orchestrator.ts`** - Master coordinator
6. **`evolution-doc-cli.ts`** - Command-line interface

### Documentation

- **`EVOLUTION_DOC_SYSTEM.md`** - Complete documentation (2,000+ lines)

---

## 🎯 Usage Modes

### Full System (Default)
```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=full
```
All subsystems enabled with automatic cycles.

### Demo Mode
```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=demo
```
Run demonstration with sample data.

### Evolution Only
```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=evolution
```
Document transformation only (no sync, AI runs on-demand).

### Sync Only
```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=sync
```
Synchronization only (watches files, syncs across systems).

### AI Analysis Only
```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=ai
```
AI-powered concept extraction and analysis.

### Taxonomy Only
```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=taxonomy
```
Taxonomy generation and knowledge graphs.

---

## ⚙️ Configuration Options

### Disable Subsystems
```bash
# Full mode without sync
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=full --no-sync

# Full mode without AI
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=full --no-ai

# Full mode without taxonomy
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=full --no-taxonomy
```

### Custom Intervals
```bash
# Evolve every 60 seconds instead of 30
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=full --evolution-interval=60000
```

---

## 📤 Output Location

All output goes to:
```
./infinity-output/evolution-docs/
├── documents/          # Your evolved documents
├── taxonomy/          # Auto-generated taxonomy
├── ai-insights/       # AI analysis results
├── concepts/          # Extracted concepts
├── relationships/     # Document relationships
└── sync/             # Sync event logs
```

---

## 🔗 Integration with Other Infinity Systems

The system automatically syncs with:

✅ **Infinity Governance** → `./infinity-output/governance/synced-docs/`  
✅ **Infinity Ingest** → `./infinity-output/knowledge/synced-docs/`  
✅ **Infinity Loop** → `./infinity-output/infinity-loop/synced-docs/`  
✅ **Infinity Quantum Mind** → `./infinity-output/quantum-intelligence/synced-docs/`

Documents are automatically converted to each system's format.

---

## 💻 Programmatic Usage

### TypeScript Example

```typescript
import { EvolutionDocOrchestrator } from './evolution-doc-orchestrator';

// Create orchestrator
const orchestrator = new EvolutionDocOrchestrator({
  autoSync: true,
  autoEvolve: true,
  aiAnalysis: true,
  taxonomyGeneration: true
});

// Initialize and start
await orchestrator.initialize();
await orchestrator.start();

// Ingest information
await orchestrator.ingestInformation({
  source: 'my-source',
  content: 'Your content here...',
  timestamp: new Date(),
  type: 'article',
  relevance: 85
});

// Search documents
const docs = await orchestrator.searchDocuments('quantum');

// Get system status
const status = await orchestrator.getStatus();
console.log(status);

// Graceful shutdown
await orchestrator.shutdown();
```

---

## 🎨 Key Features

### 1. Autonomous Document Evolution
- AI automatically creates, updates, enriches, merges, and restructures documents
- Every change tracked with reasoning
- Version history for full audit trail

### 2. Real-Time Synchronization
- File watching for instant updates
- Sync to 4+ Infinity systems automatically
- Bidirectional sync where appropriate

### 3. AI-Powered Intelligence
- Claude Sonnet 4 analyzes every document
- Extracts concepts and relationships
- Identifies gaps and quality issues
- Auto-generates tags and summaries

### 4. Automatic Taxonomy
- Builds hierarchical knowledge structure
- Evolves as documents evolve
- Exports as JSON, Markdown, and Graphviz DOT

---

## 📊 What Happens When You Run It?

1. **Initialization** (~2-5 seconds)
   - Creates output directories
   - Loads existing documents
   - Registers Infinity system connections

2. **Evolution Cycle** (every 30s by default)
   - Processes incoming information queue
   - AI analyzes intent and determines action
   - Creates/updates documents with reasoning
   - Syncs to all connected systems

3. **AI Cycle** (every 60s by default)
   - Extracts concepts from all documents
   - Detects relationships between documents
   - Identifies content gaps
   - Generates/updates taxonomy

4. **Continuous Sync** (every 10s by default)
   - Watches for file changes
   - Syncs documents to all enabled targets
   - Logs all sync events

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY not found"
Set environment variable:
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-..."
```

### "Cannot find module"
Install dependencies:
```bash
pnpm install
```

### "Permission denied" on output directories
The system creates directories automatically, but ensure write permissions in:
```
./infinity-output/evolution-docs/
```

### Documents not evolving
- Check that `--mode=full` or `--mode=evolution` is used
- Verify API key is valid
- Check queue size in status output

---

## 📚 Next Steps

1. **Read Full Documentation:** `EVOLUTION_DOC_SYSTEM.md`
2. **Run Demo:** See the system in action
3. **Ingest Real Data:** Connect to your data sources
4. **Review Outputs:** Check `./infinity-output/evolution-docs/`
5. **Integrate Systems:** Connect with other Infinity components

---

## 🎯 Example Use Cases

### Knowledge Base Evolution
Continuously ingest articles, research, and documentation. The system automatically:
- Structures content into coherent documents
- Builds taxonomy of topics
- Identifies knowledge gaps
- Merges duplicate information

### System Documentation
Feed system logs, code changes, and design docs. Get:
- Auto-generated architecture docs
- Relationship maps between components
- Quality analysis of documentation
- Synchronized docs across all systems

### Research Assistant
Ingest papers, notes, and findings. Receive:
- Concept extraction and relationships
- Automatic literature review structure
- Gap analysis in research coverage
- Cross-reference generation

---

**Ready to evolve your documents? Run the demo now! 🚀**

```bash
npx ts-node --esm src/evolution-docs/evolution-doc-cli.ts --mode=demo
```
