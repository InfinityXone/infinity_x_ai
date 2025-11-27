import { InfinityGovernanceOrchestrator } from './infinity-governance-orchestrator.ts';

async function main() {
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'full';
  const monitoring = !args.includes('--no-monitoring');
  const optimization = args.includes('--persistent-optimization');

  // Configure orchestrator
  const config = {
    enableOpenSource: mode === 'full' || mode === 'open-source',
    enableFinancial: mode === 'full' || mode === 'financial',
    enableCompliance: mode === 'full' || mode === 'compliance',
    enablePreservation: mode === 'full' || mode === 'preservation',
    enableOptimization: mode === 'full' || mode === 'optimization',
    autoCorrection: true,
    persistentOptimization: optimization,
    healthMonitoring: monitoring
  };

  const orchestrator = new InfinityGovernanceOrchestrator(config);

  // Initialize system
  await orchestrator.initialize();

  // Demonstrate capabilities
  if (mode === 'full' || mode === 'demo') {
    console.log('🎯 Running demonstration...\n');
    await runDemonstration(orchestrator);
  }

  // Keep running if monitoring or persistent optimization is enabled
  if (monitoring || optimization) {
    console.log('⏳ System running... Press Ctrl+C to shutdown\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n📡 Shutdown signal received...');
      await orchestrator.shutdown();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  } else {
    await orchestrator.shutdown();
  }
}

async function runDemonstration(orchestrator: InfinityGovernanceOrchestrator) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                   DEMONSTRATION MODE                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Open Source Demo
  const openSourceMgr = orchestrator.getOpenSourceManager();
  if (openSourceMgr) {
    console.log('📦 OPEN SOURCE DEMONSTRATION\n');

    await openSourceMgr.registerProject({
      name: 'infinity-governance',
      description: 'Comprehensive governance system for organizations',
      license: {
        type: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
        permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
        conditions: ['include-copyright', 'include-license'],
        limitations: ['liability', 'warranty']
      },
      repository: 'https://github.com/InfinityXone/infinity-governance',
      contributors: [
        {
          name: 'System Architect',
          email: 'architect@infinity.ai',
          contributions: 150,
          role: 'maintainer',
          joinedDate: new Date('2025-01-01'),
          lastActive: new Date()
        }
      ],
      governanceModel: 'Committee',
      contributionGuidelines: 'See CONTRIBUTING.md',
      codeOfConduct: 'See CODE_OF_CONDUCT.md',
      securityPolicy: 'See SECURITY.md'
    });

    const metrics = await openSourceMgr.calculateCommunityMetrics('infinity-governance');
    console.log(`Community Health: ${metrics.communityHealth}/100\n`);
  }

  // Financial Demo
  const financialMgr = orchestrator.getFinancialManager();
  if (financialMgr) {
    console.log('💰 FINANCIAL DEMONSTRATION\n');

    // Create sample budgets
    await financialMgr.createBudget({
      id: 'budget-infrastructure',
      category: 'Infrastructure',
      allocated: 50000,
      spent: 35000,
      remaining: 15000,
      period: 'monthly',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      owner: 'CTO',
      alerts: []
    });

    await financialMgr.createBudget({
      id: 'budget-development',
      category: 'Development',
      allocated: 100000,
      spent: 45000,
      remaining: 55000,
      period: 'monthly',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      owner: 'VP Engineering',
      alerts: []
    });

    // Record a transaction
    await financialMgr.recordTransaction({
      id: 'txn-001',
      budgetId: 'budget-infrastructure',
      amount: 5000,
      description: 'Cloud infrastructure upgrade',
      category: 'Infrastructure',
      timestamp: new Date(),
      approvedBy: 'CTO',
      tags: ['cloud', 'aws', 'upgrade']
    });

    // Generate forecast
    const forecast = await financialMgr.generateForecast('budget-infrastructure');
    console.log(`Forecast Confidence: ${forecast.confidence}%\n`);
  }

  // Governance Demo
  const governanceEngine = orchestrator.getGovernanceEngine();
  if (governanceEngine) {
    console.log('⚖️  GOVERNANCE DEMONSTRATION\n');

    // Evaluate a sample context
    await governanceEngine.evaluateRules({
      actor: 'developer',
      action: 'commit',
      code_content: 'const data = fetchUserData(); // Contains personal_data',
      code_quality_score: 85,
      deployment_target: 'staging'
    });

    // Generate compliance report
    const complianceReport = await governanceEngine.generateComplianceReport('GDPR');
    console.log(`GDPR Compliance Score: ${complianceReport.score}/100\n`);
  }

  // Preservation Demo
  const preservationSys = orchestrator.getPreservationSystem();
  if (preservationSys) {
    console.log('🛡️  PRESERVATION DEMONSTRATION\n');

    const metrics = preservationSys.getLatestMetrics();
    if (metrics) {
      console.log(`Current System Health: ${metrics.status}`);
    }

    // Create backup
    await preservationSys.createBackup('full');

    // Create snapshot
    await preservationSys.createSnapshot();
    console.log('');
  }

  // Optimization Demo
  const optimizationEngine = orchestrator.getOptimizationEngine();
  if (optimizationEngine) {
    console.log('⚡ OPTIMIZATION DEMONSTRATION\n');

    // Define optimization targets
    await optimizationEngine.defineTarget({
      id: 'target-api-response',
      category: 'performance',
      name: 'API Response Time',
      currentValue: 350,
      targetValue: 200,
      unit: 'ms',
      priority: 'high'
    });

    await optimizationEngine.defineTarget({
      id: 'target-cost-reduction',
      category: 'cost',
      name: 'Monthly Infrastructure Cost',
      currentValue: 50000,
      targetValue: 40000,
      unit: 'USD',
      priority: 'high'
    });

    // Identify cost savings
    const savings = await optimizationEngine.identifyCostSavings();
    const totalSavings = savings.reduce((sum, s) => sum + s.potentialSavings, 0);
    console.log(`Total Potential Savings: $${totalSavings.toLocaleString()}/month\n`);

    // Execute a strategy
    const strategies = optimizationEngine.getStrategies('target-api-response');
    if (strategies.length > 0) {
      await optimizationEngine.executeStrategy(strategies[0].id);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                  DEMONSTRATION COMPLETE                       ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Final status
  await orchestrator.displayStatus();
}

// Run CLI
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
