import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'governance' | 'compliance' | 'security' | 'quality' | 'ethical' | 'operational';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface RuleCondition {
  type: 'threshold' | 'pattern' | 'time' | 'event' | 'custom';
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
  value: any;
  description: string;
}

export interface RuleAction {
  type: 'alert' | 'block' | 'log' | 'escalate' | 'auto-remediate' | 'notify';
  target: string;
  parameters: Record<string, any>;
  description: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: 'code-review' | 'deployment' | 'access-control' | 'data-governance' | 'security' | 'custom';
  rules: string[]; // Rule IDs
  enforcement: 'advisory' | 'mandatory' | 'blocking';
  effectiveDate: Date;
  expiryDate?: Date;
  approvedBy: string;
  version: string;
}

export interface RuleViolation {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: Record<string, any>;
  detectedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'accepted' | 'false-positive';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: string;
  actor: string;
  action: string;
  target: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ComplianceReport {
  framework: string; // GDPR, SOC2, ISO27001, etc.
  assessmentDate: Date;
  overallStatus: 'compliant' | 'partially-compliant' | 'non-compliant';
  score: number; // 0-100
  controls: ComplianceControl[];
  gaps: string[];
  recommendations: string[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'implemented' | 'partial' | 'not-implemented';
  evidence: string[];
  notes: string;
}

export class GovernanceEngine {
  private client: Anthropic;
  private outputDir: string;
  private rules: Map<string, Rule>;
  private policies: Map<string, Policy>;
  private violations: Map<string, RuleViolation>;
  private auditLogs: AuditLog[];

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.outputDir = './infinity-output/governance/compliance';
    this.rules = new Map();
    this.policies = new Map();
    this.violations = new Map();
    this.auditLogs = [];
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'rules'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'policies'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'violations'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'audit-logs'), { recursive: true });
    
    // Load default rules
    await this.loadDefaultRules();
    
    console.log('⚖️  Governance Engine initialized');
    console.log(`   Output: ${this.outputDir}`);
    console.log(`   Active Rules: ${this.rules.size}`);
    console.log(`   Active Policies: ${this.policies.size}\n`);
  }

  private async loadDefaultRules(): Promise<void> {
    // Code Quality Rules
    const codeQualityRule: Rule = {
      id: 'rule-code-quality-001',
      name: 'Minimum Code Quality Standards',
      description: 'Enforce minimum code quality scores for all commits',
      category: 'quality',
      priority: 'high',
      conditions: [
        {
          type: 'threshold',
          field: 'code_quality_score',
          operator: '<',
          value: 70,
          description: 'Code quality score below 70'
        }
      ],
      actions: [
        {
          type: 'block',
          target: 'commit',
          parameters: { message: 'Code quality below minimum threshold' },
          description: 'Block commit until quality improves'
        },
        {
          type: 'notify',
          target: 'developer',
          parameters: { channel: 'email' },
          description: 'Notify developer of quality issue'
        }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Security Rules
    const securityRule: Rule = {
      id: 'rule-security-001',
      name: 'No Secrets in Code',
      description: 'Prevent committing API keys, passwords, or secrets',
      category: 'security',
      priority: 'critical',
      conditions: [
        {
          type: 'pattern',
          field: 'code_content',
          operator: 'matches',
          value: '(api[_-]?key|password|secret|token)\\s*=\\s*["\'][^"\']+["\']',
          description: 'Detected potential secret in code'
        }
      ],
      actions: [
        {
          type: 'block',
          target: 'commit',
          parameters: { message: 'SECURITY: Potential secret detected' },
          description: 'Block commit with secrets'
        },
        {
          type: 'alert',
          target: 'security-team',
          parameters: { severity: 'high' },
          description: 'Alert security team'
        },
        {
          type: 'log',
          target: 'audit-log',
          parameters: { category: 'security-violation' },
          description: 'Log security violation'
        }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Compliance Rules
    const dataPrivacyRule: Rule = {
      id: 'rule-compliance-001',
      name: 'Data Privacy Compliance',
      description: 'Ensure PII handling complies with privacy regulations',
      category: 'compliance',
      priority: 'critical',
      conditions: [
        {
          type: 'pattern',
          field: 'code_content',
          operator: 'contains',
          value: 'personal_data',
          description: 'Code handles personal data'
        }
      ],
      actions: [
        {
          type: 'escalate',
          target: 'compliance-officer',
          parameters: { reviewRequired: true },
          description: 'Require compliance review'
        },
        {
          type: 'log',
          target: 'audit-log',
          parameters: { category: 'data-privacy' },
          description: 'Log data privacy handling'
        }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Operational Rules
    const deploymentRule: Rule = {
      id: 'rule-operational-001',
      name: 'Production Deployment Approval',
      description: 'Require approval for production deployments',
      category: 'operational',
      priority: 'high',
      conditions: [
        {
          type: 'event',
          field: 'deployment_target',
          operator: '==',
          value: 'production',
          description: 'Deploying to production'
        }
      ],
      actions: [
        {
          type: 'block',
          target: 'deployment',
          parameters: { requireApprovals: 2 },
          description: 'Block until 2 approvals received'
        },
        {
          type: 'notify',
          target: 'ops-team',
          parameters: { channel: 'slack' },
          description: 'Notify ops team'
        }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.rules.set(codeQualityRule.id, codeQualityRule);
    this.rules.set(securityRule.id, securityRule);
    this.rules.set(dataPrivacyRule.id, dataPrivacyRule);
    this.rules.set(deploymentRule.id, deploymentRule);

    // Save default rules
    for (const rule of this.rules.values()) {
      await this.saveRule(rule);
    }
  }

  async createRule(rule: Rule): Promise<void> {
    console.log(`📋 Creating rule: ${rule.name}`);
    console.log(`   Category: ${rule.category}`);
    console.log(`   Priority: ${rule.priority}`);

    this.rules.set(rule.id, rule);
    await this.saveRule(rule);

    console.log(`   ✓ Rule created\n`);
  }

  async createPolicy(policy: Policy): Promise<void> {
    console.log(`📜 Creating policy: ${policy.name}`);
    console.log(`   Type: ${policy.type}`);
    console.log(`   Enforcement: ${policy.enforcement}`);
    console.log(`   Rules: ${policy.rules.length}`);

    // Validate all rules exist
    for (const ruleId of policy.rules) {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Rule ${ruleId} not found`);
      }
    }

    this.policies.set(policy.id, policy);
    await this.savePolicy(policy);

    console.log(`   ✓ Policy created\n`);
  }

  async evaluateRules(context: Record<string, any>): Promise<RuleViolation[]> {
    console.log(`🔍 Evaluating rules against context...`);

    const violations: RuleViolation[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const isViolated = await this.evaluateRule(rule, context);

      if (isViolated) {
        const violation: RuleViolation = {
          id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          severity: this.priorityToSeverity(rule.priority),
          description: `Rule violation: ${rule.name}`,
          context,
          detectedAt: new Date(),
          status: 'open'
        };

        violations.push(violation);
        this.violations.set(violation.id, violation);
        await this.saveViolation(violation);

        // Execute rule actions
        await this.executeRuleActions(rule, violation, context);

        console.log(`   ⚠️  Violation detected: ${rule.name}`);
      }
    }

    if (violations.length === 0) {
      console.log(`   ✓ No violations detected\n`);
    } else {
      console.log(`   Found ${violations.length} violation(s)\n`);
    }

    return violations;
  }

  private priorityToSeverity(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    return priority as 'low' | 'medium' | 'high' | 'critical';
  }

  private async evaluateRule(rule: Rule, context: Record<string, any>): Promise<boolean> {
    for (const condition of rule.conditions) {
      const fieldValue = context[condition.field];

      switch (condition.operator) {
        case '==':
          if (fieldValue !== condition.value) return false;
          break;
        case '!=':
          if (fieldValue === condition.value) return false;
          break;
        case '>':
          if (!(fieldValue > condition.value)) return false;
          break;
        case '<':
          if (!(fieldValue < condition.value)) return false;
          break;
        case '>=':
          if (!(fieldValue >= condition.value)) return false;
          break;
        case '<=':
          if (!(fieldValue <= condition.value)) return false;
          break;
        case 'contains':
          if (!String(fieldValue).includes(condition.value)) return false;
          break;
        case 'matches':
          const regex = new RegExp(condition.value);
          if (!regex.test(String(fieldValue))) return false;
          break;
      }
    }

    return true;
  }

  private async executeRuleActions(
    rule: Rule,
    violation: RuleViolation,
    context: Record<string, any>
  ): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'alert':
          console.log(`   🚨 ALERT: ${action.description}`);
          break;
        case 'block':
          console.log(`   🛑 BLOCKED: ${action.description}`);
          break;
        case 'log':
          await this.logAuditEvent({
            id: `audit-${Date.now()}`,
            timestamp: new Date(),
            eventType: 'rule-violation',
            actor: context.actor || 'system',
            action: rule.name,
            target: action.target,
            result: 'blocked',
            details: { ruleId: rule.id, violationId: violation.id, context }
          });
          break;
        case 'escalate':
          console.log(`   ⬆️  ESCALATED to ${action.target}`);
          break;
        case 'notify':
          console.log(`   📧 NOTIFIED: ${action.target}`);
          break;
        case 'auto-remediate':
          console.log(`   🔧 AUTO-REMEDIATE: ${action.description}`);
          break;
      }
    }
  }

  async logAuditEvent(event: AuditLog): Promise<void> {
    this.auditLogs.push(event);

    // Save to daily log file
    const dateStr = event.timestamp.toISOString().split('T')[0];
    const logFile = path.join(this.outputDir, 'audit-logs', `${dateStr}.json`);

    try {
      const existing = await fs.readFile(logFile, 'utf-8');
      const logs = JSON.parse(existing);
      logs.push(event);
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
    } catch {
      await fs.writeFile(logFile, JSON.stringify([event], null, 2), 'utf-8');
    }
  }

  async generateComplianceReport(framework: string): Promise<ComplianceReport> {
    console.log(`📊 Generating compliance report for ${framework}...`);

    const prompt = `Generate a comprehensive compliance assessment for ${framework}:

Active Rules: ${this.rules.size}
Active Policies: ${this.policies.size}
Open Violations: ${Array.from(this.violations.values()).filter(v => v.status === 'open').length}
Total Audit Events: ${this.auditLogs.length}

For ${framework}, assess:
1. Overall compliance status (compliant/partially-compliant/non-compliant)
2. Compliance score (0-100)
3. Key controls and their implementation status
4. Identified gaps
5. Recommendations for improvement

Provide response as JSON with this structure:
{
  "overallStatus": "compliant" | "partially-compliant" | "non-compliant",
  "score": 0-100,
  "controls": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "implemented" | "partial" | "not-implemented",
      "evidence": ["string"],
      "notes": "string"
    }
  ],
  "gaps": ["string"],
  "recommendations": ["string"]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    let reportData: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      throw new Error('Failed to parse compliance report');
    }

    const report: ComplianceReport = {
      framework,
      assessmentDate: new Date(),
      overallStatus: reportData.overallStatus,
      score: reportData.score,
      controls: reportData.controls,
      gaps: reportData.gaps,
      recommendations: reportData.recommendations
    };

    // Save report
    const filename = `compliance-report-${framework.toLowerCase()}-${Date.now()}.json`;
    const reportPath = path.join(this.outputDir, filename);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`   Overall Status: ${report.overallStatus}`);
    console.log(`   Compliance Score: ${report.score}/100`);
    console.log(`   Controls: ${report.controls.length}`);
    console.log(`   Gaps: ${report.gaps.length}`);
    console.log(`   ✓ Report saved: ${filename}\n`);

    return report;
  }

  async getViolationsByRule(ruleId: string): Promise<RuleViolation[]> {
    return Array.from(this.violations.values()).filter(v => v.ruleId === ruleId);
  }

  async getOpenViolations(): Promise<RuleViolation[]> {
    return Array.from(this.violations.values()).filter(v => v.status === 'open');
  }

  async resolveViolation(violationId: string, resolution: string, resolvedBy: string): Promise<void> {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation ${violationId} not found`);
    }

    console.log(`✅ Resolving violation: ${violation.description}`);
    
    violation.status = 'resolved';
    violation.resolution = resolution;
    violation.resolvedAt = new Date();
    violation.assignedTo = resolvedBy;

    await this.saveViolation(violation);
    await this.logAuditEvent({
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      eventType: 'violation-resolved',
      actor: resolvedBy,
      action: 'resolve-violation',
      target: violationId,
      result: 'success',
      details: { resolution }
    });

    console.log(`   ✓ Violation resolved\n`);
  }

  private async saveRule(rule: Rule): Promise<void> {
    const filePath = path.join(this.outputDir, 'rules', `${rule.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(rule, null, 2), 'utf-8');
  }

  private async savePolicy(policy: Policy): Promise<void> {
    const filePath = path.join(this.outputDir, 'policies', `${policy.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(policy, null, 2), 'utf-8');
  }

  private async saveViolation(violation: RuleViolation): Promise<void> {
    const filePath = path.join(this.outputDir, 'violations', `${violation.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(violation, null, 2), 'utf-8');
  }

  getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  getPolicy(id: string): Policy | undefined {
    return this.policies.get(id);
  }

  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  getAuditLogs(limit?: number): AuditLog[] {
    return limit ? this.auditLogs.slice(-limit) : this.auditLogs;
  }
}
