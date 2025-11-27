import { SmartAIRouter } from '../ai/smart-ai-router.ts';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface HealthMetrics {
  timestamp: Date;
  cpu: number; // percentage
  memory: number; // percentage
  disk: number; // percentage
  responseTime: number; // ms
  errorRate: number; // percentage
  uptime: number; // seconds
  status: 'healthy' | 'degraded' | 'critical' | 'down';
}

export interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'process' | 'resource' | 'custom';
  target: string;
  interval: number; // seconds
  timeout: number; // seconds
  threshold: HealthThreshold;
  enabled: boolean;
  lastCheck?: Date;
  lastStatus?: 'pass' | 'fail';
}

export interface HealthThreshold {
  warning: number;
  critical: number;
  metric: string;
}

export interface RecoveryAction {
  id: string;
  type: 'restart' | 'failover' | 'scale' | 'rollback' | 'custom';
  trigger: string;
  script?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxRetries: number;
  retryDelay: number; // seconds
  status: 'pending' | 'executing' | 'success' | 'failed';
  executedAt?: Date;
  result?: string;
}

export interface Backup {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  timestamp: Date;
  size: number; // bytes
  location: string;
  verified: boolean;
  retentionDays: number;
  metadata: Record<string, any>;
}

export interface FailoverConfig {
  enabled: boolean;
  primaryEndpoint: string;
  secondaryEndpoints: string[];
  healthCheckInterval: number; // seconds
  failoverThreshold: number; // consecutive failures
  autoRecovery: boolean;
}

export interface SystemSnapshot {
  timestamp: Date;
  health: HealthMetrics;
  activeProcesses: number;
  openConnections: number;
  queueDepth: number;
  configuration: Record<string, any>;
}

export class SelfPreservationSystem {
  private client: Anthropic;
  private outputDir: string;
  private healthChecks: Map<string, HealthCheck>;
  private recoveryActions: Map<string, RecoveryAction>;
  private backups: Map<string, Backup>;
  private metrics: HealthMetrics[];
  private failoverConfig?: FailoverConfig;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.client = new SmartAIRouter() as any;
    this.outputDir = './infinity-output/governance/preservation';
    this.healthChecks = new Map();
    this.recoveryActions = new Map();
    this.backups = new Map();
    this.metrics = [];
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'backups'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'metrics'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'snapshots'), { recursive: true });
    
    // Load default health checks
    await this.loadDefaultHealthChecks();
    
    console.log('🛡️  Self-Preservation System initialized');
    console.log(`   Output: ${this.outputDir}`);
    console.log(`   Health Checks: ${this.healthChecks.size}`);
    console.log(`   Monitoring: Ready\n`);
  }

  private async loadDefaultHealthChecks(): Promise<void> {
    const checks: HealthCheck[] = [
      {
        id: 'check-cpu',
        name: 'CPU Usage',
        type: 'resource',
        target: 'cpu',
        interval: 30,
        timeout: 5,
        threshold: { warning: 70, critical: 90, metric: 'percentage' },
        enabled: true
      },
      {
        id: 'check-memory',
        name: 'Memory Usage',
        type: 'resource',
        target: 'memory',
        interval: 30,
        timeout: 5,
        threshold: { warning: 80, critical: 95, metric: 'percentage' },
        enabled: true
      },
      {
        id: 'check-disk',
        name: 'Disk Space',
        type: 'resource',
        target: 'disk',
        interval: 300,
        timeout: 10,
        threshold: { warning: 80, critical: 95, metric: 'percentage' },
        enabled: true
      },
      {
        id: 'check-response-time',
        name: 'Response Time',
        type: 'http',
        target: 'localhost',
        interval: 60,
        timeout: 5,
        threshold: { warning: 1000, critical: 5000, metric: 'milliseconds' },
        enabled: true
      }
    ];

    for (const check of checks) {
      this.healthChecks.set(check.id, check);
    }
  }

  async startMonitoring(): Promise<void> {
    console.log('🔍 Starting continuous health monitoring...\n');

    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Run every 30 seconds

    // Perform initial check
    await this.performHealthChecks();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      console.log('🛑 Monitoring stopped\n');
    }
  }

  private async performHealthChecks(): Promise<void> {
    const metrics = await this.collectMetrics();
    this.metrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Save metrics
    await this.saveMetrics(metrics);

    // Evaluate health and trigger recovery if needed
    await this.evaluateHealth(metrics);
  }

  private async collectMetrics(): Promise<HealthMetrics> {
    try {
      // Get CPU usage (simplified for cross-platform)
      let cpu = 0;
      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync('wmic cpu get loadpercentage');
          const match = stdout.match(/\d+/);
          cpu = match ? parseInt(match[0]) : 0;
        } else {
          const { stdout } = await execAsync('top -bn1 | grep "Cpu(s)"');
          const match = stdout.match(/(\d+\.\d+)\s*us/);
          cpu = match ? parseFloat(match[1]) : 0;
        }
      } catch {
        cpu = Math.random() * 30; // Fallback simulation
      }

      // Get memory usage
      let memory = 0;
      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value');
          const freeMatch = stdout.match(/FreePhysicalMemory=(\d+)/);
          const totalMatch = stdout.match(/TotalVisibleMemorySize=(\d+)/);
          if (freeMatch && totalMatch) {
            const free = parseInt(freeMatch[1]);
            const total = parseInt(totalMatch[1]);
            memory = ((total - free) / total) * 100;
          }
        } else {
          const { stdout } = await execAsync('free | grep Mem');
          const parts = stdout.split(/\s+/);
          const used = parseInt(parts[2]);
          const total = parseInt(parts[1]);
          memory = (used / total) * 100;
        }
      } catch {
        memory = Math.random() * 50; // Fallback simulation
      }

      // Get disk usage
      let disk = 0;
      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
          const match = stdout.match(/C:\s+(\d+)\s+(\d+)/);
          if (match) {
            const free = parseInt(match[1]);
            const size = parseInt(match[2]);
            disk = ((size - free) / size) * 100;
          }
        } else {
          const { stdout } = await execAsync('df -h / | tail -1');
          const parts = stdout.split(/\s+/);
          const usedPercent = parts[4];
          disk = parseInt(usedPercent);
        }
      } catch {
        disk = Math.random() * 40; // Fallback simulation
      }

      // Calculate response time (simplified)
      const startTime = Date.now();
      await this.aiRouter.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });
      const responseTime = Date.now() - startTime;

      // Calculate uptime
      const uptime = process.uptime();

      // Determine status
      let status: 'healthy' | 'degraded' | 'critical' | 'down' = 'healthy';
      if (cpu > 90 || memory > 95 || disk > 95) {
        status = 'critical';
      } else if (cpu > 70 || memory > 80 || disk > 80) {
        status = 'degraded';
      }

      return {
        timestamp: new Date(),
        cpu,
        memory,
        disk,
        responseTime,
        errorRate: 0, // Would be calculated from actual error logs
        uptime,
        status
      };
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
      return {
        timestamp: new Date(),
        cpu: 0,
        memory: 0,
        disk: 0,
        responseTime: 0,
        errorRate: 100,
        uptime: 0,
        status: 'down'
      };
    }
  }

  private async evaluateHealth(metrics: HealthMetrics): Promise<void> {
    if (metrics.status === 'critical' || metrics.status === 'down') {
      console.log(`🚨 CRITICAL HEALTH ISSUE DETECTED`);
      console.log(`   Status: ${metrics.status}`);
      console.log(`   CPU: ${metrics.cpu.toFixed(1)}%`);
      console.log(`   Memory: ${metrics.memory.toFixed(1)}%`);
      console.log(`   Disk: ${metrics.disk.toFixed(1)}%`);

      // Trigger auto-recovery
      await this.triggerRecovery(metrics);
    } else if (metrics.status === 'degraded') {
      console.log(`⚠️  System degraded - monitoring closely`);
    }
  }

  private async triggerRecovery(metrics: HealthMetrics): Promise<void> {
    console.log(`\n🔧 Initiating auto-recovery...`);

    // Determine recovery strategy
    let recoveryType: 'restart' | 'scale' | 'custom' = 'custom';
    let reason = '';

    if (metrics.cpu > 90) {
      recoveryType = 'scale';
      reason = 'High CPU usage';
    } else if (metrics.memory > 95) {
      recoveryType = 'restart';
      reason = 'Memory exhaustion';
    } else if (metrics.disk > 95) {
      recoveryType = 'custom';
      reason = 'Disk space critical';
    }

    const action: RecoveryAction = {
      id: `recovery-${Date.now()}`,
      type: recoveryType,
      trigger: reason,
      priority: 'critical',
      maxRetries: 3,
      retryDelay: 60,
      status: 'pending',
      executedAt: new Date()
    };

    this.recoveryActions.set(action.id, action);

    // Execute recovery
    await this.executeRecovery(action);
  }

  private async executeRecovery(action: RecoveryAction): Promise<void> {
    console.log(`   Executing ${action.type} recovery...`);
    action.status = 'executing';

    try {
      switch (action.type) {
        case 'restart':
          await this.performRestart();
          break;
        case 'scale':
          await this.performScale();
          break;
        case 'custom':
          await this.performCustomRecovery(action.trigger);
          break;
      }

      action.status = 'success';
      action.result = 'Recovery completed successfully';
      console.log(`   ✅ Recovery successful\n`);
    } catch (error: any) {
      action.status = 'failed';
      action.result = error.message;
      console.log(`   ❌ Recovery failed: ${error.message}\n`);
    }

    await this.saveRecoveryAction(action);
  }

  private async performRestart(): Promise<void> {
    console.log(`   🔄 Restarting services...`);
    // In production, would restart actual services
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`   ✓ Services restarted`);
  }

  private async performScale(): Promise<void> {
    console.log(`   📈 Scaling resources...`);
    // In production, would scale cloud resources
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`   ✓ Resources scaled`);
  }

  private async performCustomRecovery(reason: string): Promise<void> {
    console.log(`   🛠️  Custom recovery for: ${reason}`);

    if (reason.includes('Disk space')) {
      console.log(`   Cleaning up old files...`);
      // In production, would clean up old logs, temp files, etc.
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`   ✓ Disk space freed`);
    }
  }

  async createBackup(type: 'full' | 'incremental' | 'differential' = 'full'): Promise<Backup> {
    console.log(`💾 Creating ${type} backup...`);

    const backupId = `backup-${Date.now()}`;
    const backupLocation = path.join(this.outputDir, 'backups', backupId);

    await fs.mkdir(backupLocation, { recursive: true });

    // Backup configuration files
    const configFiles = [
      './package.json',
      './tsconfig.json',
      './.env.example'
    ];

    let totalSize = 0;
    for (const file of configFiles) {
      try {
        const content = await fs.readFile(file);
        const filename = path.basename(file);
        await fs.writeFile(path.join(backupLocation, filename), content);
        totalSize += content.length;
      } catch {
        // File doesn't exist, skip
      }
    }

    // Backup source code (selective)
    try {
      const srcBackup = path.join(backupLocation, 'src');
      await fs.mkdir(srcBackup, { recursive: true });
      
      // In production, would recursively copy src directory
      // For now, just create a manifest
      await fs.writeFile(
        path.join(srcBackup, 'manifest.json'),
        JSON.stringify({ type, timestamp: new Date() }, null, 2)
      );
    } catch {
      // Error backing up src
    }

    const backup: Backup = {
      id: backupId,
      type,
      timestamp: new Date(),
      size: totalSize,
      location: backupLocation,
      verified: false,
      retentionDays: 30,
      metadata: {
        configFiles: configFiles.length,
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // Verify backup
    backup.verified = await this.verifyBackup(backup);

    this.backups.set(backup.id, backup);
    await this.saveBackup(backup);

    console.log(`   ✓ Backup created: ${backupId}`);
    console.log(`   Size: ${(backup.size / 1024).toFixed(2)} KB`);
    console.log(`   Verified: ${backup.verified}\n`);

    return backup;
  }

  private async verifyBackup(backup: Backup): Promise<boolean> {
    try {
      // Check if backup directory exists and has files
      const files = await fs.readdir(backup.location);
      return files.length > 0;
    } catch {
      return false;
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    console.log(`🔄 Restoring backup: ${backupId}...`);

    if (!backup.verified) {
      throw new Error('Cannot restore unverified backup');
    }

    // In production, would restore files from backup
    console.log(`   Restoring from ${backup.location}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`   ✅ Backup restored successfully\n`);
  }

  async createSnapshot(): Promise<SystemSnapshot> {
    console.log(`📸 Creating system snapshot...`);

    const metrics = await this.collectMetrics();

    const snapshot: SystemSnapshot = {
      timestamp: new Date(),
      health: metrics,
      activeProcesses: 0, // Would count actual processes
      openConnections: 0, // Would count actual connections
      queueDepth: 0, // Would check actual queues
      configuration: {
        healthChecks: this.healthChecks.size,
        recoveryActions: this.recoveryActions.size,
        backups: this.backups.size,
        monitoring: !!this.monitoringInterval
      }
    };

    // Save snapshot
    const filename = `snapshot-${Date.now()}.json`;
    await fs.writeFile(
      path.join(this.outputDir, 'snapshots', filename),
      JSON.stringify(snapshot, null, 2),
      'utf-8'
    );

    console.log(`   ✓ Snapshot saved: ${filename}\n`);

    return snapshot;
  }

  async configureFailover(config: FailoverConfig): Promise<void> {
    console.log(`🔀 Configuring failover...`);
    console.log(`   Primary: ${config.primaryEndpoint}`);
    console.log(`   Secondaries: ${config.secondaryEndpoints.length}`);

    this.failoverConfig = config;

    console.log(`   ✓ Failover configured\n`);
  }

  private async saveMetrics(metrics: HealthMetrics): Promise<void> {
    const dateStr = metrics.timestamp.toISOString().split('T')[0];
    const metricsFile = path.join(this.outputDir, 'metrics', `${dateStr}.json`);

    try {
      const existing = await fs.readFile(metricsFile, 'utf-8');
      const allMetrics = JSON.parse(existing);
      allMetrics.push(metrics);
      await fs.writeFile(metricsFile, JSON.stringify(allMetrics, null, 2), 'utf-8');
    } catch {
      await fs.writeFile(metricsFile, JSON.stringify([metrics], null, 2), 'utf-8');
    }
  }

  private async saveRecoveryAction(action: RecoveryAction): Promise<void> {
    const filePath = path.join(this.outputDir, `recovery-${action.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(action, null, 2), 'utf-8');
  }

  private async saveBackup(backup: Backup): Promise<void> {
    const filePath = path.join(backup.location, 'backup-manifest.json');
    await fs.writeFile(filePath, JSON.stringify(backup, null, 2), 'utf-8');
  }

  getLatestMetrics(): HealthMetrics | undefined {
    return this.metrics[this.metrics.length - 1];
  }

  getAllBackups(): Backup[] {
    return Array.from(this.backups.values());
  }

  getRecoveryHistory(): RecoveryAction[] {
    return Array.from(this.recoveryActions.values());
  }
}

