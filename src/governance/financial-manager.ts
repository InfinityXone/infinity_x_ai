import { SmartAIRouter } from '../ai/smart-ai-router.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  owner: string;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  type: 'threshold' | 'overspend' | 'forecast' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggeredAt: Date;
  resolved: boolean;
}

export interface Transaction {
  id: string;
  budgetId: string;
  amount: number;
  description: string;
  category: string;
  timestamp: Date;
  approvedBy?: string;
  tags: string[];
}

export interface FinancialForecast {
  budgetId: string;
  currentSpendRate: number; // per day
  projectedSpend: number;
  projectedVariance: number; // vs allocated
  confidence: number; // 0-100
  recommendations: string[];
  risks: string[];
}

export interface CorrectionAction {
  id: string;
  budgetId: string;
  type: 'reduce-spend' | 'reallocate' | 'freeze' | 'request-increase';
  reason: string;
  impact: number; // financial impact
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  proposedAt: Date;
  executedAt?: Date;
}

export interface FinancialMetrics {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationRate: number; // percentage
  budgetsOverBudget: number;
  budgetsAtRisk: number;
  savingsOpportunities: number;
  financialHealth: number; // 0-100 score
}

export class FinancialManager {
  private client: Anthropic;
  private outputDir: string;
  private budgets: Map<string, Budget>;
  private transactions: Map<string, Transaction>;
  private corrections: Map<string, CorrectionAction>;

  // Thresholds for auto-correction
  private readonly ALERT_THRESHOLD_WARNING = 0.75; // 75% spent
  private readonly ALERT_THRESHOLD_CRITICAL = 0.90; // 90% spent
  private readonly FORECAST_DAYS = 30;

  constructor() {
    this.client = new SmartAIRouter() as any;
    this.outputDir = './infinity-output/governance/financial';
    this.budgets = new Map();
    this.transactions = new Map();
    this.corrections = new Map();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'budgets'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'transactions'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'corrections'), { recursive: true });
    console.log('💰 Financial Manager initialized');
    console.log(`   Output: ${this.outputDir}\n`);
  }

  async createBudget(budget: Budget): Promise<void> {
    console.log(`📊 Creating budget: ${budget.category}`);
    console.log(`   Allocated: $${budget.allocated.toLocaleString()}`);
    console.log(`   Period: ${budget.period}`);

    budget.remaining = budget.allocated - budget.spent;
    budget.alerts = [];

    this.budgets.set(budget.id, budget);
    await this.saveBudget(budget);

    console.log(`   ✓ Budget created\n`);
  }

  async recordTransaction(transaction: Transaction): Promise<void> {
    console.log(`💸 Recording transaction: ${transaction.description}`);
    console.log(`   Amount: $${transaction.amount.toLocaleString()}`);

    const budget = this.budgets.get(transaction.budgetId);
    if (!budget) {
      throw new Error(`Budget ${transaction.budgetId} not found`);
    }

    // Update budget
    budget.spent += transaction.amount;
    budget.remaining = budget.allocated - budget.spent;

    // Store transaction
    this.transactions.set(transaction.id, transaction);

    // Check for alerts
    await this.checkBudgetThresholds(budget);

    // Auto-correction if needed
    await this.evaluateCorrections(budget);

    // Save
    await this.saveBudget(budget);
    await this.saveTransaction(transaction);

    console.log(`   Remaining: $${budget.remaining.toLocaleString()}\n`);
  }

  private async checkBudgetThresholds(budget: Budget): Promise<void> {
    const utilizationRate = budget.spent / budget.allocated;

    if (utilizationRate >= this.ALERT_THRESHOLD_CRITICAL) {
      const alert: BudgetAlert = {
        type: 'threshold',
        severity: 'critical',
        message: `Budget ${budget.category} at ${(utilizationRate * 100).toFixed(1)}% utilization - CRITICAL`,
        triggeredAt: new Date(),
        resolved: false
      };
      budget.alerts.push(alert);
      console.log(`   🚨 CRITICAL ALERT: ${alert.message}`);
    } else if (utilizationRate >= this.ALERT_THRESHOLD_WARNING) {
      const alert: BudgetAlert = {
        type: 'threshold',
        severity: 'high',
        message: `Budget ${budget.category} at ${(utilizationRate * 100).toFixed(1)}% utilization - WARNING`,
        triggeredAt: new Date(),
        resolved: false
      };
      budget.alerts.push(alert);
      console.log(`   ⚠️  WARNING: ${alert.message}`);
    }

    // Check for overspend
    if (budget.spent > budget.allocated) {
      const alert: BudgetAlert = {
        type: 'overspend',
        severity: 'critical',
        message: `Budget ${budget.category} OVERSPENT by $${(budget.spent - budget.allocated).toLocaleString()}`,
        triggeredAt: new Date(),
        resolved: false
      };
      budget.alerts.push(alert);
      console.log(`   🚨 OVERSPEND ALERT: ${alert.message}`);
    }
  }

  async generateForecast(budgetId: string): Promise<FinancialForecast> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    console.log(`📈 Generating forecast for ${budget.category}...`);

    // Get transactions for this budget
    const budgetTransactions = Array.from(this.transactions.values())
      .filter(t => t.budgetId === budgetId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate spend rate
    const now = new Date();
    const daysElapsed = Math.max(
      1,
      (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentSpendRate = budget.spent / daysElapsed;

    // Calculate days remaining
    const daysRemaining = Math.max(
      0,
      (budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Project future spend
    const projectedSpend = budget.spent + (currentSpendRate * daysRemaining);
    const projectedVariance = projectedSpend - budget.allocated;
    const variancePercent = (projectedVariance / budget.allocated) * 100;

    // Calculate confidence based on transaction consistency
    let confidence = 70;
    if (budgetTransactions.length > 10) confidence += 10;
    if (budgetTransactions.length > 30) confidence += 10;
    if (Math.abs(variancePercent) < 10) confidence += 10;

    // AI-powered recommendations
    const recommendations = await this.generateRecommendations(budget, projectedSpend, variancePercent);
    const risks = await this.identifyRisks(budget, projectedSpend);

    const forecast: FinancialForecast = {
      budgetId,
      currentSpendRate,
      projectedSpend,
      projectedVariance,
      confidence: Math.min(100, confidence),
      recommendations,
      risks
    };

    console.log(`   Current Spend Rate: $${currentSpendRate.toFixed(2)}/day`);
    console.log(`   Projected Total: $${projectedSpend.toLocaleString()}`);
    console.log(`   Variance: ${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%`);
    console.log(`   Confidence: ${forecast.confidence}%\n`);

    return forecast;
  }

  private async generateRecommendations(
    budget: Budget,
    projectedSpend: number,
    variancePercent: number
  ): Promise<string[]> {
    const prompt = `As a financial advisor, analyze this budget situation and provide recommendations:

Budget Category: ${budget.category}
Allocated: $${budget.allocated.toLocaleString()}
Spent: $${budget.spent.toLocaleString()}
Projected Final Spend: $${projectedSpend.toLocaleString()}
Variance: ${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%

Provide 3-5 specific, actionable recommendations to:
1. Optimize spending if over budget
2. Identify savings opportunities
3. Improve budget accuracy for future periods
4. Mitigate financial risks

Format as a JSON array of strings.`;

    const response = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to simple parsing
    }

    return text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
  }

  private async identifyRisks(budget: Budget, projectedSpend: number): Promise<string[]> {
    const risks: string[] = [];

    if (projectedSpend > budget.allocated * 1.1) {
      risks.push('HIGH RISK: Projected to exceed budget by >10%');
    }

    if (budget.spent > budget.allocated) {
      risks.push('CRITICAL: Already overspent');
    }

    const utilizationRate = budget.spent / budget.allocated;
    const now = new Date();
    const periodProgress = (now.getTime() - budget.startDate.getTime()) / 
                          (budget.endDate.getTime() - budget.startDate.getTime());

    if (utilizationRate > periodProgress + 0.2) {
      risks.push('MEDIUM RISK: Spending ahead of schedule');
    }

    if (budget.alerts.filter(a => !a.resolved && a.severity === 'critical').length > 0) {
      risks.push('Active critical alerts requiring attention');
    }

    return risks;
  }

  private async evaluateCorrections(budget: Budget): Promise<void> {
    const utilizationRate = budget.spent / budget.allocated;

    // Auto-generate corrections for high utilization
    if (utilizationRate >= this.ALERT_THRESHOLD_CRITICAL && budget.remaining > 0) {
      console.log(`   🔧 Evaluating auto-corrections...`);

      const correction: CorrectionAction = {
        id: `correction-${Date.now()}`,
        budgetId: budget.id,
        type: 'reduce-spend',
        reason: `Budget at ${(utilizationRate * 100).toFixed(1)}% utilization - auto-correction triggered`,
        impact: budget.remaining * 0.2, // Suggest 20% reduction in remaining spend
        priority: 'high',
        status: 'pending',
        proposedAt: new Date()
      };

      this.corrections.set(correction.id, correction);
      await this.saveCorrection(correction);

      console.log(`   ✓ Auto-correction proposed: Reduce remaining spend by $${correction.impact.toLocaleString()}`);
    }

    // Auto-freeze if overspent
    if (budget.spent > budget.allocated) {
      const correction: CorrectionAction = {
        id: `correction-${Date.now()}`,
        budgetId: budget.id,
        type: 'freeze',
        reason: `Budget overspent by $${(budget.spent - budget.allocated).toLocaleString()} - FREEZE`,
        impact: 0,
        priority: 'critical',
        status: 'pending',
        proposedAt: new Date()
      };

      this.corrections.set(correction.id, correction);
      await this.saveCorrection(correction);

      console.log(`   🛑 BUDGET FREEZE recommended`);
    }
  }

  async executeCorrection(correctionId: string): Promise<void> {
    const correction = this.corrections.get(correctionId);
    if (!correction) {
      throw new Error(`Correction ${correctionId} not found`);
    }

    console.log(`⚙️  Executing correction: ${correction.type}`);
    console.log(`   Budget: ${correction.budgetId}`);
    console.log(`   Reason: ${correction.reason}`);

    correction.status = 'executed';
    correction.executedAt = new Date();

    await this.saveCorrection(correction);

    console.log(`   ✓ Correction executed\n`);
  }

  async calculateFinancialMetrics(): Promise<FinancialMetrics> {
    console.log(`📊 Calculating financial metrics...`);

    let totalAllocated = 0;
    let totalSpent = 0;
    let budgetsOverBudget = 0;
    let budgetsAtRisk = 0;

    for (const budget of this.budgets.values()) {
      totalAllocated += budget.allocated;
      totalSpent += budget.spent;

      if (budget.spent > budget.allocated) {
        budgetsOverBudget++;
      }

      const utilizationRate = budget.spent / budget.allocated;
      if (utilizationRate >= this.ALERT_THRESHOLD_WARNING) {
        budgetsAtRisk++;
      }
    }

    const totalRemaining = totalAllocated - totalSpent;
    const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    // Calculate savings opportunities
    const savingsOpportunities = Array.from(this.budgets.values())
      .filter(b => b.spent < b.allocated * 0.5 && b.remaining > 1000)
      .length;

    // Calculate financial health score
    let healthScore = 100;
    healthScore -= budgetsOverBudget * 20; // -20 per overspent budget
    healthScore -= budgetsAtRisk * 10; // -10 per at-risk budget
    if (utilizationRate > 95) healthScore -= 15;
    if (utilizationRate < 50) healthScore -= 10; // Under-utilization

    const metrics: FinancialMetrics = {
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationRate,
      budgetsOverBudget,
      budgetsAtRisk,
      savingsOpportunities,
      financialHealth: Math.max(0, Math.min(100, healthScore))
    };

    console.log(`   Total Allocated: $${metrics.totalAllocated.toLocaleString()}`);
    console.log(`   Total Spent: $${metrics.totalSpent.toLocaleString()}`);
    console.log(`   Utilization: ${metrics.utilizationRate.toFixed(1)}%`);
    console.log(`   Financial Health: ${metrics.financialHealth}/100\n`);

    return metrics;
  }

  async generateFinancialReport(startDate: Date, endDate: Date): Promise<string> {
    console.log(`📄 Generating financial report...`);

    const relevantBudgets = Array.from(this.budgets.values()).filter(
      b => b.startDate >= startDate && b.endDate <= endDate
    );

    const relevantTransactions = Array.from(this.transactions.values()).filter(
      t => t.timestamp >= startDate && t.timestamp <= endDate
    );

    const metrics = await this.calculateFinancialMetrics();

    const prompt = `Generate a comprehensive financial report:

Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
Total Budgets: ${relevantBudgets.length}
Total Transactions: ${relevantTransactions.length}
Total Allocated: $${metrics.totalAllocated.toLocaleString()}
Total Spent: $${metrics.totalSpent.toLocaleString()}
Utilization Rate: ${metrics.utilizationRate.toFixed(1)}%
Budgets Over Budget: ${metrics.budgetsOverBudget}
Budgets At Risk: ${metrics.budgetsAtRisk}
Financial Health: ${metrics.financialHealth}/100

Include:
1. Executive Summary
2. Budget Performance by Category
3. Spending Trends and Patterns
4. Variance Analysis
5. Risk Assessment
6. Corrective Actions Taken
7. Recommendations for Next Period
8. Financial Health Assessment

Format as a professional financial report in Markdown.`;

    const response = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const report = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save report
    const filename = `financial-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.md`;
    const reportPath = path.join(this.outputDir, filename);
    await fs.writeFile(reportPath, report, 'utf-8');

    console.log(`   ✓ Report saved: ${filename}\n`);

    return report;
  }

  private async saveBudget(budget: Budget): Promise<void> {
    const filePath = path.join(this.outputDir, 'budgets', `${budget.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(budget, null, 2), 'utf-8');
  }

  private async saveTransaction(transaction: Transaction): Promise<void> {
    const filePath = path.join(this.outputDir, 'transactions', `${transaction.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(transaction, null, 2), 'utf-8');
  }

  private async saveCorrection(correction: CorrectionAction): Promise<void> {
    const filePath = path.join(this.outputDir, 'corrections', `${correction.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(correction, null, 2), 'utf-8');
  }

  getBudget(id: string): Budget | undefined {
    return this.budgets.get(id);
  }

  getAllBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  getCorrections(budgetId?: string): CorrectionAction[] {
    const all = Array.from(this.corrections.values());
    return budgetId ? all.filter(c => c.budgetId === budgetId) : all;
  }
}

