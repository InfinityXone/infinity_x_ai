/**
 * HOSTINGER HORIZONS SYNC MANAGER
 * ================================
 * Bidirectional synchronization with Hostinger Horizons Dashboard
 * 
 * Priority Order:
 * 1. Railway (Primary) - Production deployment
 * 2. infinityxonesystems.com (Secondary) - Hostinger
 * 3. localhost (Fallback) - Development
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface HorizonsSystemStatus {
  online: boolean;
  lastSync: number;
  dashboardUrl: string;
  activeListeners: number;
  queuedUpdates: number;
  activeEndpoint: string;
}

export interface DashboardUpdate {
  id: string;
  type: 'status' | 'log' | 'metric' | 'alert' | 'command' | 'code-patch';
  payload: any;
  timestamp: number;
  synced: boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface HorizonsConfig {
  primaryUrl: string;      // Railway
  secondaryUrl: string;    // Hostinger  
  fallbackUrl: string;     // localhost
  apiKey: string;
  webhookSecret: string;
  projectId: string;
  enableRealtime: boolean;
}

export interface FirebaseCredentials {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// ============================================================
// HOSTINGER HORIZONS SYNC MANAGER
// ============================================================

export class HostingerSyncManager extends EventEmitter {
  private config: HorizonsConfig;
  private firebaseConfig: FirebaseCredentials | null = null;
  private isConnected: boolean = false;
  private activeEndpoint: string = '';
  private syncInterval?: NodeJS.Timeout;
  private updateQueue: DashboardUpdate[] = [];
  private localCachePath: string;
  private lastSyncTime: number = 0;
  private connectionAttempts: number = 0;

  // Sync configuration
  private readonly SYNC_INTERVAL_MS = 15000;
  private readonly MAX_QUEUE_SIZE = 500;
  private readonly BATCH_SIZE = 25;
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000];
  private readonly MAX_CONNECTION_ATTEMPTS = 3;

  constructor() {
    super();
    
    // Priority: Railway > Hostinger > localhost
    this.config = {
      primaryUrl: process.env.RAILWAY_API_URL || 'https://infinity-x-ai-production.up.railway.app/api',
      secondaryUrl: process.env.HOSTINGER_API_URL || 'https://infinityxonesystems.com/api',
      fallbackUrl: 'http://localhost:' + (process.env.PORT || 3000) + '/api',
      apiKey: process.env.HOSTINGER_API_KEY || '',
      webhookSecret: process.env.HOSTINGER_WEBHOOK_SECRET || '',
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'infinity-x-one-systems',
      enableRealtime: process.env.HOSTINGER_REALTIME === 'true'
    };

    this.localCachePath = path.join(process.cwd(), '.infinity-cache', 'hostinger-sync.json');
    
    this.loadLocalCache();
    console.log(' Hostinger Horizons Sync Manager instantiated');
    console.log('   Primary:   ' + this.config.primaryUrl);
    console.log('   Secondary: ' + this.config.secondaryUrl);
    console.log('   Fallback:  ' + this.config.fallbackUrl);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize(): Promise<void> {
    console.log(' Initializing Hostinger Horizons Sync Manager...');

    const cacheDir = path.dirname(this.localCachePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    await this.loadFirebaseCredentials();

    // Try endpoints in priority order
    this.isConnected = await this.connectToEndpoint();

    if (this.isConnected) {
      console.log('   Connected to: ' + this.activeEndpoint);
      await this.performInitialSync();
    } else {
      console.log('   All endpoints offline - using local cache only');
      this.activeEndpoint = 'local-cache';
    }

    this.startSyncLoop();
    console.log(' Hostinger Horizons Sync Manager initialized');
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  private async connectToEndpoint(): Promise<boolean> {
    const endpoints = [
      { name: 'Railway (Primary)', url: this.config.primaryUrl },
      { name: 'Hostinger (Secondary)', url: this.config.secondaryUrl },
      { name: 'Localhost (Fallback)', url: this.config.fallbackUrl }
    ];

    for (const endpoint of endpoints) {
      console.log('   Trying ' + endpoint.name + '...');
      try {
        const isUp = await this.testEndpoint(endpoint.url);
        if (isUp) {
          this.activeEndpoint = endpoint.url;
          this.connectionAttempts = 0;
          return true;
        }
      } catch (error) {
        console.log('      ' + endpoint.name + ' unavailable');
      }
    }
    return false;
  }

  private async testEndpoint(baseUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = new URL('/health', baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const req = httpModule.request({
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  }

  async reconnect(): Promise<void> {
    this.connectionAttempts++;
    if (this.connectionAttempts > this.MAX_CONNECTION_ATTEMPTS) {
      // Reset and try all endpoints again
      this.connectionAttempts = 0;
    }
    this.isConnected = await this.connectToEndpoint();
  }

  async getStatus(): Promise<HorizonsSystemStatus> {
    return {
      online: this.isConnected,
      lastSync: this.lastSyncTime,
      dashboardUrl: this.activeEndpoint.replace('/api', ''),
      activeListeners: 0,
      queuedUpdates: this.updateQueue.length,
      activeEndpoint: this.activeEndpoint
    };
  }

  // ============================================================
  // FIREBASE CREDENTIALS
  // ============================================================

  private async loadFirebaseCredentials(): Promise<void> {
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID ||
                     process.env.FIREBASE_PROJECT_ID ||
                     process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (projectId) {
      this.firebaseConfig = {
        projectId: projectId,
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 
                process.env.FIREBASE_API_KEY || '',
        authDomain: projectId + '.firebaseapp.com',
        storageBucket: projectId + '.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || ''
      };
      console.log('   Firebase config loaded for project: ' + projectId);
    }
  }

  getFirebaseCredentials(): FirebaseCredentials | null {
    return this.firebaseConfig;
  }

  // ============================================================
  // DASHBOARD UPDATES
  // ============================================================

  async pushStatusUpdate(status: {
    systemHealth: 'healthy' | 'degraded' | 'critical';
    activeAgents: string[];
    metrics: Record<string, number>;
    alerts: string[];
  }): Promise<void> {
    await this.queueUpdate({
      type: 'status',
      payload: status,
      priority: status.systemHealth === 'critical' ? 'critical' : 'normal'
    });
  }

  async pushLog(log: {
    level: 'debug' | 'info' | 'warn' | 'error';
    source: string;
    message: string;
    details?: any;
  }): Promise<void> {
    await this.queueUpdate({
      type: 'log',
      payload: log,
      priority: log.level === 'error' ? 'high' : 'normal'
    });
  }

  async pushMetrics(metrics: {
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
  }[]): Promise<void> {
    await this.queueUpdate({
      type: 'metric',
      payload: { metrics, timestamp: Date.now() },
      priority: 'normal'
    });
  }

  async pushAlert(alert: {
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    action?: string;
  }): Promise<void> {
    await this.queueUpdate({
      type: 'alert',
      payload: alert,
      priority: alert.severity === 'critical' ? 'critical' : 
                alert.severity === 'error' ? 'high' : 'normal'
    });
  }

  async pushCodePatch(patch: {
    file: string;
    changes: string;
    reason: string;
    author: string;
  }): Promise<void> {
    await this.queueUpdate({
      type: 'code-patch',
      payload: patch,
      priority: 'high'
    });
  }

  // ============================================================
  // UPDATE QUEUE MANAGEMENT
  // ============================================================

  private async queueUpdate(update: Omit<DashboardUpdate, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const fullUpdate: DashboardUpdate = {
      id: 'upd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...update,
      timestamp: Date.now(),
      synced: false
    };

    if (update.priority === 'critical') {
      this.updateQueue.unshift(fullUpdate);
    } else {
      this.updateQueue.push(fullUpdate);
    }

    if (this.updateQueue.length > this.MAX_QUEUE_SIZE) {
      this.updateQueue = [
        ...this.updateQueue.filter(u => u.priority === 'critical' || u.priority === 'high'),
        ...this.updateQueue.filter(u => u.priority === 'normal' || u.priority === 'low')
          .slice(-this.MAX_QUEUE_SIZE / 2)
      ];
    }

    this.saveLocalCache();
    this.emit('update:queued', fullUpdate);

    if (this.isConnected && update.priority === 'critical') {
      await this.processUpdateQueue();
    }
  }

  // ============================================================
  // SYNC OPERATIONS
  // ============================================================

  private startSyncLoop(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);

    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, this.SYNC_INTERVAL_MS);

    console.log(' Sync loop started (interval: ' + this.SYNC_INTERVAL_MS + 'ms)');
  }

  async performSync(): Promise<void> {
    try {
      // Check if current endpoint is still up
      if (this.activeEndpoint && this.activeEndpoint !== 'local-cache') {
        const stillUp = await this.testEndpoint(this.activeEndpoint);
        if (!stillUp) {
          console.log(' ' + this.activeEndpoint + ' went offline, reconnecting...');
          await this.reconnect();
        }
      } else {
        // No active endpoint, try to connect
        await this.reconnect();
      }

      if (!this.isConnected) {
        // Silent when all offline - just save to cache
        this.saveLocalCache();
        return;
      }

      await this.processUpdateQueue();
      await this.pullDashboardCommands();

      this.lastSyncTime = Date.now();
      this.saveLocalCache();

      this.emit('sync:complete', {
        timestamp: this.lastSyncTime,
        endpoint: this.activeEndpoint,
        updatesProcessed: this.updateQueue.filter(u => u.synced).length
      });

    } catch (error) {
      this.emit('sync:error', error);
    }
  }

  private async performInitialSync(): Promise<void> {
    console.log(' Performing initial sync with ' + this.activeEndpoint + '...');

    await this.pushStatusUpdate({
      systemHealth: 'healthy',
      activeAgents: ['gemini', 'copilot', 'master-orchestrator'],
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
      },
      alerts: []
    });

    await this.processUpdateQueue();
    console.log(' Initial sync complete');
  }

  private async processUpdateQueue(): Promise<void> {
    const unsynced = this.updateQueue.filter(u => !u.synced);
    if (unsynced.length === 0 || !this.isConnected) return;

    const batch = unsynced.slice(0, this.BATCH_SIZE);

    try {
      const response = await this.makeRequest('POST', '/v1/sync/updates', {
        updates: batch,
        projectId: this.config.projectId,
        timestamp: Date.now()
      });

      if (response?.success) {
        batch.forEach(update => { update.synced = true; });

        const oneHourAgo = Date.now() - 3600000;
        this.updateQueue = this.updateQueue.filter(
          u => !u.synced || u.timestamp > oneHourAgo
        );

        console.log(' Synced ' + batch.length + ' updates to ' + this.activeEndpoint);
      }
    } catch (error) {
      // Will retry on next sync cycle
    }

    this.saveLocalCache();
  }

  private async pullDashboardCommands(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const response = await this.makeRequest('GET', '/v1/sync/commands?projectId=' + 
        encodeURIComponent(this.config.projectId) + '&since=' + this.lastSyncTime);

      if (response?.commands && Array.isArray(response.commands)) {
        for (const command of response.commands) {
          this.emit('command:received', command);
        }
      }
    } catch (error) {
      // Silent fail - commands will be pulled on next sync
    }
  }

  // ============================================================
  // HTTP REQUEST HELPERS
  // ============================================================

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.activeEndpoint || this.activeEndpoint === 'local-cache') {
      throw new Error('No active endpoint');
    }

    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.activeEndpoint);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.config.apiKey,
          'X-Project-ID': this.config.projectId
        },
        timeout: 10000
      };

      const req = httpModule.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ raw: body });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));

      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  // ============================================================
  // LOCAL CACHE MANAGEMENT
  // ============================================================

  private loadLocalCache(): void {
    try {
      if (fs.existsSync(this.localCachePath)) {
        const data = fs.readFileSync(this.localCachePath, 'utf-8');
        const cached = JSON.parse(data);
        
        this.updateQueue = cached.updateQueue || [];
        this.lastSyncTime = cached.lastSyncTime || 0;

        console.log('   Loaded ' + this.updateQueue.length + ' pending updates from cache');
      }
    } catch (error) {
      // Start fresh if cache is corrupted
    }
  }

  private saveLocalCache(): void {
    try {
      const cacheDir = path.dirname(this.localCachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const data = JSON.stringify({
        updateQueue: this.updateQueue.slice(-200),
        lastSyncTime: this.lastSyncTime,
        activeEndpoint: this.activeEndpoint,
        firebaseConfig: this.firebaseConfig
      }, null, 2);

      fs.writeFileSync(this.localCachePath, data);
    } catch (error) {
      // Cache save failed - not critical
    }
  }

  // ============================================================
  // WEBHOOK HANDLER
  // ============================================================

  async handleWebhook(payload: any, signature: string): Promise<{ success: boolean; message: string }> {
    if (this.config.webhookSecret && signature !== this.config.webhookSecret) {
      return { success: false, message: 'Invalid webhook signature' };
    }

    switch (payload.type) {
      case 'command':
        this.emit('command:received', payload.data);
        break;
      case 'config-update':
        this.emit('config:updated', payload.data);
        break;
      case 'sync-request':
        await this.forceSync();
        break;
    }

    return { success: true, message: 'Webhook processed' };
  }

  // ============================================================
  // PUBLIC INTERFACE
  // ============================================================

  async forceSync(): Promise<void> {
    console.log(' Force sync triggered');
    await this.reconnect();
    await this.performSync();
  }

  getDashboardData(): {
    status: HorizonsSystemStatus;
    recentUpdates: DashboardUpdate[];
    firebaseConfig: FirebaseCredentials | null;
  } {
    return {
      status: {
        online: this.isConnected,
        lastSync: this.lastSyncTime,
        dashboardUrl: this.activeEndpoint.replace('/api', ''),
        activeListeners: 0,
        queuedUpdates: this.updateQueue.filter(u => !u.synced).length,
        activeEndpoint: this.activeEndpoint
      },
      recentUpdates: this.updateQueue.slice(-20),
      firebaseConfig: this.firebaseConfig
    };
  }

  async shutdown(): Promise<void> {
    console.log(' Shutting down Hostinger Sync Manager...');

    if (this.syncInterval) clearInterval(this.syncInterval);

    if (this.isConnected) {
      await this.processUpdateQueue();
    }

    this.saveLocalCache();
    console.log(' Hostinger Sync Manager shutdown complete');
  }
}

// Export singleton instance
export const hostingerSync = new HostingerSyncManager();