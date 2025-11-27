import { OpenSourceManager } from './open-source-manager.ts';
import { FinancialManager } from './financial-manager.ts';
import { GovernanceEngine } from './governance-engine.ts';
import { SelfPreservationSystem } from './self-preservation.ts';
import { OptimizationEngine } from './optimization-engine.ts';

export interface GovernanceConfig {
  enableOpenSource: boolean;
  enableFinancial: boolean;
  enableCompliance: boolean;
  enablePreservation: boolean;
  enableOptimization: boolean;
  autoCorrection: boolean;
  persistentOptimization: boolean;
  healthMonitoring: boolean;
}

export interface SystemStatus {
  openSource: {
    active: boolean;
    projects: number;
    proposals: number;
  };
  financial: {
    active: boolean;
    budgets: number;
    totalAllocated: number;
    totalSpent: number;
    healthScore: number;
  };
  compliance: {
    active: boolean;
    rules: number;
    policies: number;
    violations: number;
  };
  preservation: {
    active: boolean;
    healthStatus: string;
    backups: number;
    lastCheck?: Date;
  };
  optimization: {
    active: boolean;
    targets: number;
    completedStrategies: number;
    insights: number;
  };
}

export class InfinityGovernanceOrchestrator {
  private openSourceManager?: OpenSourceManager;
  private financialManager?: FinancialManager;
  private governanceEngine?: GovernanceEngine;
  private preservationSystem?: SelfPreservationSystem;
  private optimizationEngine?: OptimizationEngine;
  private config: GovernanceConfig;

  constructor(config: Partial<GovernanceConfig> = {}) {
    this.config = {
      enableOpenSource: config.enableOpenSource ?? true,
      enableFinancial: config.enableFinancial ?? true,
      enableCompliance: config.enableCompliance ?? true,
      enablePreservation: config.enablePreservation ?? true,
      enableOptimization: config.enableOptimization ?? true,
      autoCorrection: config.autoCorrection ?? true,
      persistentOptimization: config.persistentOptimization ?? false,
      healthMonitoring: config.healthMonitoring ?? true
    };
  }

  async initialize(): Promise<void> {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║         ∞ INFINITY GOVERNANCE SYSTEM ∞                        ║');
    console.log('║                                                               ║');
    console.log('║   Open Source • Financial • Compliance • Self-Preservation   ║');
    console.log('║                  Persistent Optimization                      ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('⚙️  Initializing subsystems...\n');

    // Initialize Open Source Manager
    if (this.config.enableOpenSource) {
      this.openSourceManager = new OpenSourceManager();
      await this.openSourceManager.initialize();
    }

    // Initialize Financial Manager
    if (this.config.enableFinancial) {
      this.financialManager = new FinancialManager();
      await this.financialManager.initialize();
    }

    // Initialize Governance Engine
    if (this.config.enableCompliance) {
      this.governanceEngine = new GovernanceEngine();
      await this.governanceEngine.initialize();
    }

    // Initialize Self-Preservation System
    if (this.config.enablePreservation) {
      this.preservationSystem = new SelfPreservationSystem();
      await this.preservationSystem.initialize();

      if (this.config.healthMonitoring) {
        await this.preservationSystem.startMonitoring();
      }
    }

    // Initialize Optimization Engine
    if (this.config.enableOptimization) {
      this.optimizationEngine = new OptimizationEngine();
      await this.optimizationEngine.initialize();

      if (this.config.persistentOptimization) {
        await this.optimizationEngine.startPersistentOptimization();
      }
    }

    console.log('✅ All subsystems initialized\n');
    await this.displayStatus();
  }

  async displayStatus(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                     SYSTEM STATUS                             ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (this.openSourceManager) {
      const projects = this.openSourceManager.getAllProjects();
      const proposals = this.openSourceManager.getAllProposals();
      console.log('🌍 OPEN SOURCE MANAGEMENT');
      console.log(`   Projects: ${projects.length}`);
      console.log(`   Pending Proposals: ${proposals.filter(p => p.status === 'pending').length}`);
      console.log(`   Status: ✅ Active\n`);
    }

    if (this.financialManager) {
      const budgets = this.financialManager.getAllBudgets();
      const metrics = await this.financialManager.calculateFinancialMetrics();
      console.log('💰 FINANCIAL MANAGEMENT');
      console.log(`   Active Budgets: ${budgets.length}`);
      console.log(`   Total Allocated: $${metrics.totalAllocated.toLocaleString()}`);
      console.log(`   Total Spent: $${metrics.totalSpent.toLocaleString()}`);
      console.log(`   Utilization: ${metrics.utilizationRate.toFixed(1)}%`);
      console.log(`   Financial Health: ${metrics.financialHealth}/100`);
      console.log(`   Auto-Correction: ${this.config.autoCorrection ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Status: ✅ Active\n`);
    }

    if (this.governanceEngine) {
      const rules = this.governanceEngine.getAllRules();
      const policies = this.governanceEngine.getAllPolicies();
      const violations = await this.governanceEngine.getOpenViolations();
      console.log('⚖️  GOVERNANCE & COMPLIANCE');
      console.log(`   Active Rules: ${rules.filter(r => r.enabled).length}/${rules.length}`);
      console.log(`   Active Policies: ${policies.length}`);
      console.log(`   Open Violations: ${violations.length}`);
      console.log(`   Status: ✅ Active\n`);
    }

    if (this.preservationSystem) {
      const metrics = this.preservationSystem.getLatestMetrics();
      const backups = this.preservationSystem.getAllBackups();
      console.log('🛡️  SELF-PRESERVATION');
      if (metrics) {
        console.log(`   System Status: ${metrics.status.toUpperCase()}`);
        console.log(`   CPU: ${metrics.cpu.toFixed(1)}%`);
        console.log(`   Memory: ${metrics.memory.toFixed(1)}%`);
        console.log(`   Disk: ${metrics.disk.toFixed(1)}%`);
      }
      console.log(`   Backups: ${backups.length}`);
      console.log(`   Health Monitoring: ${this.config.healthMonitoring ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Status: ✅ Active\n`);
    }

    if (this.optimizationEngine) {
      const targets = this.optimizationEngine.getAllTargets();
      const insights = this.optimizationEngine.getInsights();
      console.log('⚡ PERSISTENT OPTIMIZATION');
      console.log(`   Active Targets: ${targets.length}`);
      console.log(`   Insights Generated: ${insights.length}`);
      console.log(`   Continuous Optimization: ${this.config.persistentOptimization ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Status: ✅ Active\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const status: SystemStatus = {
      openSource: {
        active: !!this.openSourceManager,
        projects: 0,
        proposals: 0
      },
      financial: {
        active: !!this.financialManager,
        budgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        healthScore: 0
      },
      compliance: {
        active: !!this.governanceEngine,
        rules: 0,
        policies: 0,
        violations: 0
      },
      preservation: {
        active: !!this.preservationSystem,
        healthStatus: 'unknown',
        backups: 0
      },
      optimization: {
        active: !!this.optimizationEngine,
        targets: 0,
        completedStrategies: 0,
        insights: 0
      }
    };

    if (this.openSourceManager) {
      status.openSource.projects = this.openSourceManager.getAllProjects().length;
      status.openSource.proposals = this.openSourceManager.getAllProposals().length;
    }

    if (this.financialManager) {
      const budgets = this.financialManager.getAllBudgets();
      const metrics = await this.financialManager.calculateFinancialMetrics();
      status.financial.budgets = budgets.length;
      status.financial.totalAllocated = metrics.totalAllocated;
      status.financial.totalSpent = metrics.totalSpent;
      status.financial.healthScore = metrics.financialHealth;
    }

    if (this.governanceEngine) {
      status.compliance.rules = this.governanceEngine.getAllRules().length;
      status.compliance.policies = this.governanceEngine.getAllPolicies().length;
      status.compliance.violations = (await this.governanceEngine.getOpenViolations()).length;
    }

    if (this.preservationSystem) {
      const metrics = this.preservationSystem.getLatestMetrics();
      status.preservation.healthStatus = metrics?.status || 'unknown';
      status.preservation.backups = this.preservationSystem.getAllBackups().length;
      status.preservation.lastCheck = metrics?.timestamp;
    }

    if (this.optimizationEngine) {
      const targets = this.optimizationEngine.getAllTargets();
      const strategies = this.optimizationEngine.getStrategies();
      status.optimization.targets = targets.length;
      status.optimization.completedStrategies = strategies.filter(s => s.status === 'completed').length;
      status.optimization.insights = this.optimizationEngine.getInsights().length;
    }

    return status;
  }

  async shutdown(): Promise<void> {
    console.log('\n🔄 Shutting down Infinity Governance System...\n');

    if (this.preservationSystem) {
      this.preservationSystem.stopMonitoring();
      console.log('   Creating final backup...');
      await this.preservationSystem.createBackup('full');
      console.log('   Creating system snapshot...');
      await this.preservationSystem.createSnapshot();
    }

    if (this.optimizationEngine) {
      this.optimizationEngine.stopPersistentOptimization();
      console.log('   Generating optimization report...');
      await this.optimizationEngine.generateOptimizationReport();
    }

    if (this.financialManager) {
      console.log('   Generating financial report...');
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      await this.financialManager.generateFinancialReport(thirtyDaysAgo, now);
    }

    if (this.governanceEngine) {
      console.log('   Generating compliance report...');
      await this.governanceEngine.generateComplianceReport('ISO27001');
    }

    console.log('\n✅ Shutdown complete - All systems preserved\n');
  }

  // Getters for subsystems
  getOpenSourceManager(): OpenSourceManager | undefined {
    return this.openSourceManager;
  }

  getFinancialManager(): FinancialManager | undefined {
    return this.financialManager;
  }

  getGovernanceEngine(): GovernanceEngine | undefined {
    return this.governanceEngine;
  }

  getPreservationSystem(): SelfPreservationSystem | undefined {
    return this.preservationSystem;
  }

  getOptimizationEngine(): OptimizationEngine | undefined {
    return this.optimizationEngine;
  }
}
