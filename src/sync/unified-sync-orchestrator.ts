/**
 * UNIFIED SYNC ORCHESTRATOR
 * ==========================
 * Master synchronization controller that coordinates:
 * - Google Gemini AI
 * - Hostinger Horizons Dashboard
 * - Local file system
 * - Google Workspace (Calendar, Tasks, Gmail)
 * 
 * Implements the Master Infinity Orchestrator sync protocol
 * for 24/7 autonomous operation.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiSyncManager, geminiSync } from './gemini-sync-manager';
import { HostingerSyncManager, hostingerSync } from './hostinger-sync-manager';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface UnifiedSyncStatus {
  orchestratorOnline: boolean;
  geminiStatus: 'online' | 'offline' | 'degraded';
  hostingerStatus: 'online' | 'offline' | 'degraded';
  workspaceStatus: 'online' | 'offline' | 'degraded';
  lastUnifiedSync: number;
  syncHealth: number; // 0-100
  activeAgents: string[];
  pendingOperations: number;
}

export interface SyncEvent {
  id: string;
  source: 'gemini' | 'hostinger' | 'workspace' | 'local';
  type: string;
  payload: any;
  timestamp: number;
  propagated: boolean;
}

export interface AgentDirective {
  agentId: string;
  directive: string;
  parameters: any;
  priority: 'critical' | 'high' | 'normal' | 'low';
  deadline?: number;
}

// ============================================================
// UNIFIED SYNC ORCHESTRATOR
// ============================================================

export class UnifiedSyncOrchestrator extends EventEmitter {
  private geminiSync: GeminiSyncManager;
  private hostingerSync: HostingerSyncManager;
  private isRunning: boolean = false;
  private syncInterval?: NodeJS.Timeout;
  private eventLog: SyncEvent[] = [];
  private localStatePath: string;

  // Sync configuration
  private readonly UNIFIED_SYNC_INTERVAL = 60000; // 1 minute
  private readonly EVENT_LOG_MAX_SIZE = 1000;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  // System state
  private systemState: {
    lastSync: number;
    activeAgents: Map<string, { lastSeen: number; status: string }>;
    pendingDirectives: AgentDirective[];
    metrics: Record<string, number>;
  };

  constructor() {
    super();
    
    this.geminiSync = geminiSync;
    this.hostingerSync = hostingerSync;
    this.localStatePath = path.join(process.cwd(), '.infinity-cache', 'unified-sync-state.json');

    this.systemState = {
      lastSync: 0,
      activeAgents: new Map(),
      pendingDirectives: [],
      metrics: {}
    };

    this.loadState();
    this.setupEventHandlers();

    console.log('🎯 Unified Sync Orchestrator instantiated');
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 INITIALIZING UNIFIED SYNC ORCHESTRATOR');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      // Initialize Gemini Sync
      console.log('\n📡 Phase 1: Initializing Gemini Sync...');
      await this.geminiSync.initialize();

      // Initialize Hostinger Sync
      console.log('\n🌐 Phase 2: Initializing Hostinger Sync...');
      await this.hostingerSync.initialize();

      // Perform initial unified sync
      console.log('\n🔄 Phase 3: Performing initial unified sync...');
      await this.performUnifiedSync();

      // Start orchestration loop
      console.log('\n⚡ Phase 4: Starting orchestration loop...');
      this.startOrchestrationLoop();

      this.isRunning = true;
      this.registerAgent('unified-orchestrator', 'active');

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('✅ UNIFIED SYNC ORCHESTRATOR ONLINE');
      console.log('═══════════════════════════════════════════════════════════\n');

      // Emit ready event
      this.emit('orchestrator:ready', await this.getStatus());

    } catch (error) {
      console.error('Failed to initialize Unified Sync Orchestrator:', error);
      throw error;
    }
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  private setupEventHandlers(): void {
    // Gemini events
    this.geminiSync.on('command:completed', (command) => {
      this.logEvent('gemini', 'command:completed', command);
      this.propagateToHostinger('gemini-command', command);
    });

    this.geminiSync.on('command:failed', (command) => {
      this.logEvent('gemini', 'command:failed', command);
      this.hostingerSync.pushAlert({
        severity: 'error',
        title: 'Gemini Command Failed',
        message: `Command ${command.id} failed after ${command.retryCount} retries`,
        action: 'Review command payload and retry'
      });
    });

    this.geminiSync.on('sync:complete', (data) => {
      this.logEvent('gemini', 'sync:complete', data);
      this.systemState.metrics['gemini_syncs'] = (this.systemState.metrics['gemini_syncs'] || 0) + 1;
    });

    // Hostinger events
    this.hostingerSync.on('command:received', async (command) => {
      this.logEvent('hostinger', 'command:received', command);
      await this.processHorizonsCommand(command);
    });

    this.hostingerSync.on('sync:complete', (data) => {
      this.logEvent('hostinger', 'sync:complete', data);
      this.systemState.metrics['hostinger_syncs'] = (this.systemState.metrics['hostinger_syncs'] || 0) + 1;
    });

    this.hostingerSync.on('config:updated', (config) => {
      this.logEvent('hostinger', 'config:updated', config);
      this.emit('config:updated', config);
    });
  }

  // ============================================================
  // ORCHESTRATION LOOP
  // ============================================================

  private startOrchestrationLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.performUnifiedSync();
    }, this.UNIFIED_SYNC_INTERVAL);

    console.log(`🔄 Orchestration loop started (interval: ${this.UNIFIED_SYNC_INTERVAL}ms)`);
  }

  async performUnifiedSync(): Promise<void> {
    const syncStart = Date.now();

    try {
      // 1. Collect status from all systems
      const geminiStatus = await this.geminiSync.getStatus();
      const hostingerStatus = await this.hostingerSync.getStatus();

      // 2. Sync system metrics to Hostinger dashboard
      await this.hostingerSync.pushMetrics([
        { name: 'gemini_commands_pending', value: geminiStatus.pendingCommands, unit: 'count' },
        { name: 'gemini_processed_today', value: geminiStatus.processedToday, unit: 'count' },
        { name: 'gemini_quota_used', value: geminiStatus.quotaUsed, unit: 'count' },
        { name: 'hostinger_queued_updates', value: hostingerStatus.queuedUpdates, unit: 'count' },
        { name: 'active_agents', value: this.systemState.activeAgents.size, unit: 'count' },
        { name: 'pending_directives', value: this.systemState.pendingDirectives.length, unit: 'count' },
        { name: 'memory_usage_mb', value: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), unit: 'MB' },
        { name: 'uptime_seconds', value: Math.round(process.uptime()), unit: 'seconds' }
      ]);

      // 3. Push unified status to Hostinger
      await this.hostingerSync.pushStatusUpdate({
        systemHealth: this.calculateSystemHealth(geminiStatus, hostingerStatus),
        activeAgents: Array.from(this.systemState.activeAgents.keys()),
        metrics: {
          ...this.systemState.metrics,
          syncDuration: Date.now() - syncStart
        },
        alerts: this.getActiveAlerts()
      });

      // 4. Process pending directives
      await this.processPendingDirectives();

      // 5. Cleanup old events
      this.cleanupEventLog();

      // 6. Update state
      this.systemState.lastSync = Date.now();
      this.saveState();

      // 7. Emit sync complete
      this.emit('unified-sync:complete', {
        timestamp: this.systemState.lastSync,
        duration: Date.now() - syncStart
      });

    } catch (error) {
      console.error('Unified sync error:', error);
      this.logEvent('local', 'sync:error', { error: String(error) });
    }
  }

  // ============================================================
  // COMMAND PROCESSING
  // ============================================================

  /**
   * Process commands received from Hostinger Horizons dashboard
   */
  private async processHorizonsCommand(command: any): Promise<void> {
    console.log(`📥 Processing Horizons command: ${command.type}`);

    switch (command.type) {
      case 'dispatch-to-gemini':
        // Forward command to Gemini
        await this.geminiSync.dispatchCommand(
          command.geminiType || 'execute',
          command.payload,
          command.priority || 'normal'
        );
        break;

      case 'force-sync':
        // Force sync all systems
        await this.forceFullSync();
        break;

      case 'update-agent-directive':
        // Add directive for an agent
        this.addAgentDirective(command.directive);
        break;

      case 'system-command':
        // Execute system-level command
        await this.executeSystemCommand(command);
        break;

      case 'get-status':
        // Push current status
        const status = await this.getStatus();
        await this.hostingerSync.pushStatusUpdate({
          systemHealth: status.syncHealth >= 80 ? 'healthy' : 
                       status.syncHealth >= 50 ? 'degraded' : 'critical',
          activeAgents: status.activeAgents,
          metrics: this.systemState.metrics,
          alerts: this.getActiveAlerts()
        });
        break;

      default:
        console.warn(`Unknown Horizons command type: ${command.type}`);
    }
  }

  private async executeSystemCommand(command: any): Promise<void> {
    switch (command.action) {
      case 'restart-sync':
        this.startOrchestrationLoop();
        break;
      case 'clear-queue':
        this.systemState.pendingDirectives = [];
        break;
      case 'reset-metrics':
        this.systemState.metrics = {};
        break;
      default:
        console.warn(`Unknown system command: ${command.action}`);
    }
  }

  // ============================================================
  // AGENT MANAGEMENT
  // ============================================================

  /**
   * Register an active agent
   */
  registerAgent(agentId: string, status: string): void {
    this.systemState.activeAgents.set(agentId, {
      lastSeen: Date.now(),
      status
    });
    this.logEvent('local', 'agent:registered', { agentId, status });
  }

  /**
   * Update agent heartbeat
   */
  agentHeartbeat(agentId: string, status?: string): void {
    const agent = this.systemState.activeAgents.get(agentId);
    if (agent) {
      agent.lastSeen = Date.now();
      if (status) agent.status = status;
    } else {
      this.registerAgent(agentId, status || 'active');
    }
  }

  /**
   * Add directive for an agent
   */
  addAgentDirective(directive: AgentDirective): void {
    this.systemState.pendingDirectives.push(directive);
    this.logEvent('local', 'directive:added', directive);
    this.saveState();
  }

  /**
   * Get directives for a specific agent
   */
  getAgentDirectives(agentId: string): AgentDirective[] {
    return this.systemState.pendingDirectives.filter(d => d.agentId === agentId);
  }

  /**
   * Mark directive as completed
   */
  completeDirective(agentId: string, directiveId: string): void {
    this.systemState.pendingDirectives = this.systemState.pendingDirectives.filter(
      d => !(d.agentId === agentId && d.directive === directiveId)
    );
    this.saveState();
  }

  private async processPendingDirectives(): Promise<void> {
    const now = Date.now();
    
    // Remove expired directives
    this.systemState.pendingDirectives = this.systemState.pendingDirectives.filter(d => {
      if (d.deadline && d.deadline < now) {
        this.logEvent('local', 'directive:expired', d);
        return false;
      }
      return true;
    });

    // Process critical directives immediately
    const criticalDirectives = this.systemState.pendingDirectives.filter(
      d => d.priority === 'critical'
    );

    for (const directive of criticalDirectives) {
      this.emit('directive:execute', directive);
    }
  }

  // ============================================================
  // STATUS & HEALTH
  // ============================================================

  async getStatus(): Promise<UnifiedSyncStatus> {
    const geminiStatus = await this.geminiSync.getStatus();
    const hostingerStatus = await this.hostingerSync.getStatus();

    const syncHealth = this.calculateSyncHealth(geminiStatus, hostingerStatus);

    return {
      orchestratorOnline: this.isRunning,
      geminiStatus: geminiStatus.online ? 'online' : 'offline',
      hostingerStatus: hostingerStatus.online ? 'online' : 'offline',
      workspaceStatus: 'online', // TODO: Implement workspace health check
      lastUnifiedSync: this.systemState.lastSync,
      syncHealth,
      activeAgents: Array.from(this.systemState.activeAgents.keys()),
      pendingOperations: this.systemState.pendingDirectives.length + 
                         geminiStatus.pendingCommands + 
                         hostingerStatus.queuedUpdates
    };
  }

  private calculateSystemHealth(geminiStatus: any, hostingerStatus: any): 'healthy' | 'degraded' | 'critical' {
    const health = this.calculateSyncHealth(geminiStatus, hostingerStatus);
    if (health >= 80) return 'healthy';
    if (health >= 50) return 'degraded';
    return 'critical';
  }

  private calculateSyncHealth(geminiStatus: any, hostingerStatus: any): number {
    let health = 100;

    // Gemini factors
    if (!geminiStatus.online) health -= 30;
    if (geminiStatus.errorRate > 0.1) health -= 20;
    if (geminiStatus.quotaUsed / geminiStatus.quotaLimit > 0.9) health -= 10;

    // Hostinger factors
    if (!hostingerStatus.online) health -= 30;
    if (hostingerStatus.queuedUpdates > 100) health -= 10;

    // Stale sync penalty
    const timeSinceSync = Date.now() - this.systemState.lastSync;
    if (timeSinceSync > 300000) health -= 10; // 5 minutes
    if (timeSinceSync > 600000) health -= 20; // 10 minutes

    return Math.max(0, Math.min(100, health));
  }

  private getActiveAlerts(): string[] {
    const alerts: string[] = [];

    // Check for stale agents
    const staleThreshold = Date.now() - 300000; // 5 minutes
    this.systemState.activeAgents.forEach((agent, id) => {
      if (agent.lastSeen < staleThreshold) {
        alerts.push(`Agent ${id} is stale (last seen ${Math.round((Date.now() - agent.lastSeen) / 1000)}s ago)`);
      }
    });

    // Check pending directives
    const criticalCount = this.systemState.pendingDirectives.filter(d => d.priority === 'critical').length;
    if (criticalCount > 0) {
      alerts.push(`${criticalCount} critical directive(s) pending`);
    }

    return alerts;
  }

  // ============================================================
  // EVENT LOGGING
  // ============================================================

  private logEvent(source: SyncEvent['source'], type: string, payload: any): void {
    const event: SyncEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      type,
      payload,
      timestamp: Date.now(),
      propagated: false
    };

    this.eventLog.push(event);
    this.emit('event:logged', event);
  }

  private cleanupEventLog(): void {
    if (this.eventLog.length > this.EVENT_LOG_MAX_SIZE) {
      this.eventLog = this.eventLog.slice(-this.EVENT_LOG_MAX_SIZE / 2);
    }
  }

  getRecentEvents(count: number = 50): SyncEvent[] {
    return this.eventLog.slice(-count);
  }

  // ============================================================
  // CROSS-SYSTEM PROPAGATION
  // ============================================================

  private async propagateToHostinger(eventType: string, data: any): Promise<void> {
    try {
      await this.hostingerSync.pushLog({
        level: 'info',
        source: 'gemini',
        message: `Gemini event: ${eventType}`,
        details: data
      });
    } catch (error) {
      console.warn('Failed to propagate to Hostinger:', error);
    }
  }

  // ============================================================
  // PUBLIC INTERFACE
  // ============================================================

  /**
   * Dispatch command to Gemini through orchestrator
   */
  async dispatchToGemini(type: string, payload: any, priority: string = 'normal'): Promise<string> {
    this.logEvent('local', 'dispatch:gemini', { type, payload });
    return await this.geminiSync.dispatchCommand(type as any, payload, priority as any);
  }

  /**
   * Push update to Hostinger through orchestrator
   */
  async pushToHostinger(update: { type: string; payload: any; priority?: string }): Promise<void> {
    this.logEvent('local', 'push:hostinger', update);
    
    switch (update.type) {
      case 'status':
        await this.hostingerSync.pushStatusUpdate(update.payload);
        break;
      case 'log':
        await this.hostingerSync.pushLog(update.payload);
        break;
      case 'metric':
        await this.hostingerSync.pushMetrics(update.payload);
        break;
      case 'alert':
        await this.hostingerSync.pushAlert(update.payload);
        break;
      case 'code-patch':
        await this.hostingerSync.pushCodePatch(update.payload);
        break;
    }
  }

  /**
   * Force full sync across all systems
   */
  async forceFullSync(): Promise<void> {
    console.log('🔄 Force full sync initiated');
    
    await Promise.all([
      this.geminiSync.forceSync(),
      this.hostingerSync.forceSync()
    ]);

    await this.performUnifiedSync();
    
    console.log('✅ Force full sync complete');
  }

  /**
   * Get dashboard data for API response
   */
  async getDashboardData(): Promise<any> {
    const status = await this.getStatus();
    const hostingerData = this.hostingerSync.getDashboardData();
    const geminiState = this.geminiSync.getSyncState();

    return {
      status,
      hostinger: hostingerData,
      gemini: {
        online: geminiState.systemStatus.online,
        pendingCommands: geminiState.commands.filter(c => c.status === 'pending').length,
        recentCommands: geminiState.commands.slice(-10)
      },
      events: this.getRecentEvents(20),
      agents: Array.from(this.systemState.activeAgents.entries()).map(([id, data]) => ({
        id,
        ...data
      })),
      directives: this.systemState.pendingDirectives
    };
  }

  // ============================================================
  // STATE PERSISTENCE
  // ============================================================

  private loadState(): void {
    try {
      if (fs.existsSync(this.localStatePath)) {
        const data = fs.readFileSync(this.localStatePath, 'utf-8');
        const saved = JSON.parse(data);
        
        this.systemState.lastSync = saved.lastSync || 0;
        this.systemState.pendingDirectives = saved.pendingDirectives || [];
        this.systemState.metrics = saved.metrics || {};
        
        // Restore agents map
        if (saved.activeAgents) {
          this.systemState.activeAgents = new Map(Object.entries(saved.activeAgents));
        }

        console.log('  📁 Loaded orchestrator state from cache');
      }
    } catch (error) {
      console.warn('Failed to load orchestrator state:', error);
    }
  }

  private saveState(): void {
    try {
      const cacheDir = path.dirname(this.localStatePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const data = JSON.stringify({
        lastSync: this.systemState.lastSync,
        pendingDirectives: this.systemState.pendingDirectives,
        metrics: this.systemState.metrics,
        activeAgents: Object.fromEntries(this.systemState.activeAgents)
      }, null, 2);

      fs.writeFileSync(this.localStatePath, data);
    } catch (error) {
      console.warn('Failed to save orchestrator state:', error);
    }
  }

  // ============================================================
  // SHUTDOWN
  // ============================================================

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Unified Sync Orchestrator...');

    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Shutdown child managers
    await Promise.all([
      this.geminiSync.shutdown(),
      this.hostingerSync.shutdown()
    ]);

    // Save final state
    this.saveState();

    console.log('✅ Unified Sync Orchestrator shutdown complete');
  }
}

// Export singleton instance
export const unifiedSync = new UnifiedSyncOrchestrator();

// Export initialization function
export async function initializeSync(): Promise<UnifiedSyncOrchestrator> {
  await unifiedSync.initialize();
  return unifiedSync;
}
