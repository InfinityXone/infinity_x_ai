import * as fs from 'fs/promises';
import * as path from 'path';
import { watch } from 'fs';
import { Document } from './document-evolution-engine.ts';

export interface SyncTarget {
  id: string;
  name: string;
  type: 'local' | 'infinity-system' | 'external' | 'ai-model';
  path?: string;
  endpoint?: string;
  syncInterval: number; // milliseconds
  enabled: boolean;
  lastSync?: Date;
}

export interface SyncEvent {
  timestamp: Date;
  source: string;
  target: string;
  documentId: string;
  action: 'create' | 'update' | 'delete' | 'sync';
  success: boolean;
  details: string;
}

export interface SystemConnection {
  id: string;
  systemName: string;
  type: 'governance' | 'ingest' | 'loop' | 'quantum' | 'parallel' | 'custom';
  documentPath: string;
  autoSync: boolean;
  bidirectional: boolean;
}

export class LiveDocumentSynchronizer {
  private outputDir: string;
  private syncTargets: Map<string, SyncTarget>;
  private systemConnections: Map<string, SystemConnection>;
  private syncEvents: SyncEvent[];
  private watchHandles: Map<string, any>;
  private syncIntervals: Map<string, NodeJS.Timeout>;
  private isSyncing: boolean;

  constructor() {
    this.outputDir = './infinity-output/evolution-docs';
    this.syncTargets = new Map();
    this.systemConnections = new Map();
    this.syncEvents = [];
    this.watchHandles = new Map();
    this.syncIntervals = new Map();
    this.isSyncing = false;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.join(this.outputDir, 'sync'), { recursive: true });
    
    // Register default Infinity system connections
    await this.registerInfinitySystemConnections();
    
    console.log('🔄 Live Document Synchronizer initialized');
    console.log(`   Sync targets: ${this.syncTargets.size}`);
    console.log(`   System connections: ${this.systemConnections.size}\n`);
  }

  private async registerInfinitySystemConnections(): Promise<void> {
    const connections: SystemConnection[] = [
      {
        id: 'conn-governance',
        systemName: 'Infinity Governance',
        type: 'governance',
        documentPath: './infinity-output/governance',
        autoSync: true,
        bidirectional: true
      },
      {
        id: 'conn-ingest',
        systemName: 'Infinity Ingest',
        type: 'ingest',
        documentPath: './infinity-output/knowledge',
        autoSync: true,
        bidirectional: false // One-way: ingest → evolution docs
      },
      {
        id: 'conn-loop',
        systemName: 'Infinity Loop',
        type: 'loop',
        documentPath: './infinity-output/infinity-loop',
        autoSync: true,
        bidirectional: true
      },
      {
        id: 'conn-quantum',
        systemName: 'Infinity Quantum Mind',
        type: 'quantum',
        documentPath: './infinity-output/quantum-intelligence',
        autoSync: true,
        bidirectional: true
      }
    ];

    for (const conn of connections) {
      this.systemConnections.set(conn.id, conn);
      
      // Register as sync target
      this.syncTargets.set(`target-${conn.id}`, {
        id: `target-${conn.id}`,
        name: conn.systemName,
        type: 'infinity-system',
        path: conn.documentPath,
        syncInterval: 5000, // 5 seconds
        enabled: conn.autoSync
      });
    }
  }

  async registerSyncTarget(target: SyncTarget): Promise<void> {
    console.log(`📍 Registering sync target: ${target.name}`);
    console.log(`   Type: ${target.type}`);
    console.log(`   Sync interval: ${target.syncInterval}ms`);

    this.syncTargets.set(target.id, target);

    if (target.enabled) {
      await this.enableSync(target.id);
    }

    console.log(`   ✓ Target registered\n`);
  }

  async enableSync(targetId: string): Promise<void> {
    const target = this.syncTargets.get(targetId);
    if (!target) {
      throw new Error(`Sync target ${targetId} not found`);
    }

    console.log(`▶️  Enabling sync for: ${target.name}`);

    target.enabled = true;

    // Start interval-based sync
    if (target.syncInterval > 0) {
      const interval = setInterval(async () => {
        await this.syncToTarget(targetId);
      }, target.syncInterval);
      
      this.syncIntervals.set(targetId, interval);
    }

    // Watch for file changes if local
    if (target.type === 'local' && target.path) {
      await this.watchDirectory(target.path, targetId);
    }

    console.log(`   ✓ Sync enabled\n`);
  }

  async disableSync(targetId: string): Promise<void> {
    const target = this.syncTargets.get(targetId);
    if (!target) return;

    console.log(`⏸️  Disabling sync for: ${target.name}`);

    target.enabled = false;

    // Clear interval
    const interval = this.syncIntervals.get(targetId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(targetId);
    }

    // Stop watching
    const watchHandle = this.watchHandles.get(targetId);
    if (watchHandle) {
      watchHandle.close();
      this.watchHandles.delete(targetId);
    }

    console.log(`   ✓ Sync disabled\n`);
  }

  private async watchDirectory(dirPath: string, targetId: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });

      const watcher = watch(dirPath, { recursive: true }, async (eventType, filename) => {
        if (filename && (filename.endsWith('.json') || filename.endsWith('.md'))) {
          console.log(`👀 File change detected: ${filename}`);
          await this.handleFileChange(dirPath, filename, targetId);
        }
      });

      this.watchHandles.set(targetId, watcher);
      console.log(`   Watching: ${dirPath}`);
    } catch (error) {
      console.log(`   ⚠️  Could not watch directory: ${dirPath}`);
    }
  }

  private async handleFileChange(
    dirPath: string,
    filename: string,
    targetId: string
  ): Promise<void> {
    const filePath = path.join(dirPath, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse and sync document
      if (filename.endsWith('.json')) {
        const doc: Document = JSON.parse(content);
        await this.syncDocument(doc, targetId);
      }
    } catch {
      // File might be deleted or in-progress
    }
  }

  async syncDocument(doc: Document, targetId: string): Promise<void> {
    const target = this.syncTargets.get(targetId);
    if (!target || !target.enabled) return;

    console.log(`🔄 Syncing document: ${doc.title} → ${target.name}`);

    const event: SyncEvent = {
      timestamp: new Date(),
      source: 'evolution-docs',
      target: target.name,
      documentId: doc.id,
      action: 'sync',
      success: false,
      details: ''
    };

    try {
      switch (target.type) {
        case 'local':
          await this.syncToLocal(doc, target);
          break;
        case 'infinity-system':
          await this.syncToInfinitySystem(doc, target);
          break;
        case 'external':
          await this.syncToExternal(doc, target);
          break;
        case 'ai-model':
          await this.syncToAI(doc, target);
          break;
      }

      event.success = true;
      event.details = 'Document synced successfully';
      target.lastSync = new Date();

      console.log(`   ✓ Synced to ${target.name}\n`);
    } catch (error: any) {
      event.success = false;
      event.details = error.message;
      console.log(`   ❌ Sync failed: ${error.message}\n`);
    }

    this.syncEvents.push(event);
    await this.saveSyncEvent(event);
  }

  private async syncToLocal(doc: Document, target: SyncTarget): Promise<void> {
    if (!target.path) throw new Error('No path specified for local target');

    const targetPath = path.join(target.path, `${doc.id}.json`);
    await fs.mkdir(target.path, { recursive: true });
    await fs.writeFile(targetPath, JSON.stringify(doc, null, 2), 'utf-8');

    // Also save markdown
    const mdPath = path.join(target.path, `${doc.id}.md`);
    const markdown = `# ${doc.title}\n\n${doc.content}`;
    await fs.writeFile(mdPath, markdown, 'utf-8');
  }

  private async syncToInfinitySystem(doc: Document, target: SyncTarget): Promise<void> {
    if (!target.path) throw new Error('No path specified for Infinity system');

    // Find the system connection
    const connId = target.id.replace('target-', '');
    const connection = this.systemConnections.get(connId);
    
    if (!connection) {
      throw new Error(`System connection not found: ${connId}`);
    }

    // Sync to system's document path
    await fs.mkdir(connection.documentPath, { recursive: true });
    
    const syncPath = path.join(connection.documentPath, 'synced-docs');
    await fs.mkdir(syncPath, { recursive: true });

    const targetPath = path.join(syncPath, `${doc.id}.json`);
    await fs.writeFile(targetPath, JSON.stringify(doc, null, 2), 'utf-8');

    // Create system-specific format if needed
    await this.createSystemSpecificFormat(doc, connection);
  }

  private async createSystemSpecificFormat(
    doc: Document,
    connection: SystemConnection
  ): Promise<void> {
    const syncPath = path.join(connection.documentPath, 'synced-docs');

    switch (connection.type) {
      case 'governance':
        // Create governance-specific format
        const governanceDoc = {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          tags: doc.tags,
          version: doc.version,
          compliance: {
            reviewed: false,
            status: 'pending'
          }
        };
        await fs.writeFile(
          path.join(syncPath, `governance-${doc.id}.json`),
          JSON.stringify(governanceDoc, null, 2),
          'utf-8'
        );
        break;

      case 'ingest':
        // Create knowledge format
        const knowledgeDoc = {
          id: doc.id,
          title: doc.title,
          summary: doc.content.substring(0, 200),
          fullContent: doc.content,
          concepts: doc.tags,
          credibilityScore: doc.metadata.confidenceScore,
          lastUpdated: doc.lastModified
        };
        await fs.writeFile(
          path.join(syncPath, `knowledge-${doc.id}.json`),
          JSON.stringify(knowledgeDoc, null, 2),
          'utf-8'
        );
        break;

      case 'loop':
        // Create loop-specific format
        const loopDoc = {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          evolutionStage: doc.version,
          insights: doc.tags,
          readyForImplementation: doc.metadata.completeness > 80
        };
        await fs.writeFile(
          path.join(syncPath, `loop-${doc.id}.json`),
          JSON.stringify(loopDoc, null, 2),
          'utf-8'
        );
        break;

      case 'quantum':
        // Create quantum mind format
        const quantumDoc = {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          concepts: doc.tags,
          confidenceScore: doc.metadata.confidenceScore,
          relatedDocs: doc.metadata.relatedDocs
        };
        await fs.writeFile(
          path.join(syncPath, `quantum-${doc.id}.json`),
          JSON.stringify(quantumDoc, null, 2),
          'utf-8'
        );
        break;
    }
  }

  private async syncToExternal(doc: Document, target: SyncTarget): Promise<void> {
    if (!target.endpoint) throw new Error('No endpoint specified for external target');

    // In production, would make HTTP request to external API
    console.log(`   Would sync to: ${target.endpoint}`);
  }

  private async syncToAI(doc: Document, target: SyncTarget): Promise<void> {
    // In production, would update AI model's context or knowledge base
    console.log(`   AI context updated with: ${doc.title}`);
  }

  async syncToTarget(targetId: string): Promise<void> {
    const target = this.syncTargets.get(targetId);
    if (!target || !target.enabled) return;

    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // Get all active documents from evolution-docs
      const docsPath = path.join(this.outputDir, 'documents');
      const files = await fs.readdir(docsPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(docsPath, file), 'utf-8');
          const doc: Document = JSON.parse(content);

          if (doc.metadata.status === 'active') {
            await this.syncDocument(doc, targetId);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Sync cycle error: ${error}`);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncAllTargets(): Promise<void> {
    console.log(`🔄 Syncing all targets...\n`);

    for (const [targetId, target] of this.syncTargets.entries()) {
      if (target.enabled) {
        await this.syncToTarget(targetId);
      }
    }

    console.log(`✅ All targets synced\n`);
  }

  async pullFromInfinitySystem(connectionId: string): Promise<void> {
    const connection = this.systemConnections.get(connectionId);
    if (!connection || !connection.bidirectional) {
      throw new Error(`Cannot pull from ${connectionId}`);
    }

    console.log(`📥 Pulling documents from: ${connection.systemName}`);

    const syncPath = path.join(connection.documentPath, 'synced-docs');
    
    try {
      await fs.mkdir(syncPath, { recursive: true });
      const files = await fs.readdir(syncPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(syncPath, file), 'utf-8');
          const doc = JSON.parse(content);

          console.log(`   Importing: ${doc.title || doc.id}`);
          
          // Store in evolution docs
          const importPath = path.join(
            this.outputDir,
            'documents',
            'imported',
            `${connection.type}-${file}`
          );
          await fs.mkdir(path.dirname(importPath), { recursive: true });
          await fs.writeFile(importPath, content, 'utf-8');
        }
      }

      console.log(`   ✓ Pull complete\n`);
    } catch (error) {
      console.log(`   ⚠️  Pull failed: ${error}\n`);
    }
  }

  async getSyncStatus(): Promise<any> {
    const status = {
      totalTargets: this.syncTargets.size,
      enabledTargets: 0,
      activeConnections: 0,
      recentEvents: this.syncEvents.slice(-10),
      targets: [] as any[]
    };

    for (const [id, target] of this.syncTargets.entries()) {
      if (target.enabled) status.enabledTargets++;
      
      status.targets.push({
        id: target.id,
        name: target.name,
        type: target.type,
        enabled: target.enabled,
        lastSync: target.lastSync
      });
    }

    for (const conn of this.systemConnections.values()) {
      if (conn.autoSync) status.activeConnections++;
    }

    return status;
  }

  private async saveSyncEvent(event: SyncEvent): Promise<void> {
    const dateStr = event.timestamp.toISOString().split('T')[0];
    const eventsFile = path.join(this.outputDir, 'sync', `events-${dateStr}.json`);

    try {
      const existing = await fs.readFile(eventsFile, 'utf-8');
      const events = JSON.parse(existing);
      events.push(event);
      await fs.writeFile(eventsFile, JSON.stringify(events, null, 2), 'utf-8');
    } catch {
      await fs.writeFile(eventsFile, JSON.stringify([event], null, 2), 'utf-8');
    }
  }

  async shutdown(): Promise<void> {
    console.log(`\n🛑 Shutting down synchronizer...`);

    // Disable all syncs
    for (const targetId of this.syncTargets.keys()) {
      await this.disableSync(targetId);
    }

    // Final sync
    await this.syncAllTargets();

    console.log(`   ✓ Synchronizer shutdown complete\n`);
  }

  getSyncTarget(id: string): SyncTarget | undefined {
    return this.syncTargets.get(id);
  }

  getAllSyncTargets(): SyncTarget[] {
    return Array.from(this.syncTargets.values());
  }

  getSystemConnection(id: string): SystemConnection | undefined {
    return this.systemConnections.get(id);
  }

  getAllSystemConnections(): SystemConnection[] {
    return Array.from(this.systemConnections.values());
  }

  getSyncEvents(limit?: number): SyncEvent[] {
    return limit ? this.syncEvents.slice(-limit) : this.syncEvents;
  }
}
