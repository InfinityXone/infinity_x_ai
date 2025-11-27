import { SmartAIRouter } from '../ai/smart-ai-router.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface License {
  type: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'BSD-3-Clause' | 'AGPL-3.0' | 'Custom';
  url: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
}

export interface Contributor {
  name: string;
  email: string;
  contributions: number;
  role: 'maintainer' | 'core' | 'contributor' | 'community';
  joinedDate: Date;
  lastActive: Date;
}

export interface OpenSourceProject {
  name: string;
  description: string;
  license: License;
  repository: string;
  contributors: Contributor[];
  governanceModel: 'BDFL' | 'Consensus' | 'Committee' | 'Democratic';
  contributionGuidelines: string;
  codeOfConduct: string;
  securityPolicy: string;
}

export interface ContributionProposal {
  id: string;
  title: string;
  description: string;
  author: string;
  submittedDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'needs-revision';
  reviewComments: string[];
  votes: { contributor: string; vote: 'approve' | 'reject'; reason: string }[];
}

export interface CommunityMetrics {
  totalContributors: number;
  activeContributors: number;
  totalCommits: number;
  openIssues: number;
  closedIssues: number;
  pullRequests: number;
  stars: number;
  forks: number;
  communityHealth: number; // 0-100 score
}

export class OpenSourceManager {
  private aiRouter: SmartAIRouter;
  private outputDir: string;
  private projects: Map<string, OpenSourceProject>;
  private proposals: Map<string, ContributionProposal>;

  constructor() {
    this.aiRouter = new SmartAIRouter();
    this.outputDir = './infinity-output/governance/open-source';
    this.projects = new Map();
    this.proposals = new Map();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log('🌍 Open Source Manager initialized');
    console.log(`   Output: ${this.outputDir}\n`);
  }

  async registerProject(project: OpenSourceProject): Promise<void> {
    console.log(`📦 Registering project: ${project.name}`);
    
    // Validate license compliance
    await this.validateLicense(project.license);
    
    // Generate governance documents
    await this.generateGovernanceDocs(project);
    
    // Store project
    this.projects.set(project.name, project);
    
    // Save to disk
    await this.saveProject(project);
    
    console.log(`✅ Project ${project.name} registered\n`);
  }

  private async validateLicense(license: License): Promise<void> {
    console.log(`   Validating license: ${license.type}`);
    
    const prompt = `As a legal expert in open source licensing, validate this license configuration:

License Type: ${license.type}
Permissions: ${license.permissions.join(', ')}
Conditions: ${license.conditions.join(', ')}
Limitations: ${license.limitations.join(', ')}

Provide:
1. Is this configuration legally valid?
2. Are there any conflicts between permissions/conditions/limitations?
3. Any compliance risks or recommendations?
4. OSI (Open Source Initiative) approval status for this license type?

Be concise but thorough.`;

    const response = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const validation = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log(`   License validation complete`);
  }

  private async generateGovernanceDocs(project: OpenSourceProject): Promise<void> {
    console.log(`   Generating governance documents...`);
    
    // Generate CONTRIBUTING.md
    const contributingPrompt = `Generate a comprehensive CONTRIBUTING.md file for an open source project:

Project: ${project.name}
Description: ${project.description}
Governance Model: ${project.governanceModel}
License: ${project.license.type}

Include:
1. How to contribute (code, docs, issues)
2. Development setup instructions
3. Code style guidelines
4. Pull request process
5. Review criteria
6. Community guidelines

Format as proper Markdown.`;

    const contributingResponse = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.5,
      messages: [{ role: 'user', content: contributingPrompt }]
    });

    const contributing = contributingResponse.content[0].type === 'text' 
      ? contributingResponse.content[0].text 
      : '';

    // Generate CODE_OF_CONDUCT.md
    const cocPrompt = `Generate a Code of Conduct for an open source project based on the Contributor Covenant:

Project: ${project.name}
Governance: ${project.governanceModel}

Include:
1. Our Pledge
2. Our Standards
3. Enforcement Responsibilities
4. Scope
5. Enforcement Guidelines
6. Attribution

Format as proper Markdown.`;

    const cocResponse = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.3,
      messages: [{ role: 'user', content: cocPrompt }]
    });

    const coc = cocResponse.content[0].type === 'text' 
      ? cocResponse.content[0].text 
      : '';

    // Generate SECURITY.md
    const securityPrompt = `Generate a SECURITY.md file for an open source project:

Project: ${project.name}

Include:
1. Supported versions
2. Reporting a vulnerability
3. Security update process
4. Security best practices for users
5. Disclosure policy

Format as proper Markdown.`;

    const securityResponse = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: securityPrompt }]
    });

    const security = securityResponse.content[0].type === 'text' 
      ? securityResponse.content[0].text 
      : '';

    // Save documents
    const projectDir = path.join(this.outputDir, project.name);
    await fs.mkdir(projectDir, { recursive: true });
    
    await fs.writeFile(path.join(projectDir, 'CONTRIBUTING.md'), contributing, 'utf-8');
    await fs.writeFile(path.join(projectDir, 'CODE_OF_CONDUCT.md'), coc, 'utf-8');
    await fs.writeFile(path.join(projectDir, 'SECURITY.md'), security, 'utf-8');
    
    console.log(`   ✓ Generated CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md`);
  }

  async submitContribution(proposal: ContributionProposal): Promise<void> {
    console.log(`📝 New contribution: ${proposal.title}`);
    
    // AI-powered contribution review
    const review = await this.reviewContribution(proposal);
    
    proposal.reviewComments.push(review);
    this.proposals.set(proposal.id, proposal);
    
    // Save proposal
    await this.saveProposal(proposal);
    
    console.log(`   Status: ${proposal.status}\n`);
  }

  private async reviewContribution(proposal: ContributionProposal): Promise<string> {
    console.log(`   AI reviewing contribution...`);
    
    const prompt = `As an open source project maintainer, review this contribution proposal:

Title: ${proposal.title}
Description: ${proposal.description}
Author: ${proposal.author}

Evaluate:
1. Alignment with project goals
2. Code quality standards
3. Documentation completeness
4. Test coverage expectations
5. Breaking changes assessment
6. Community impact
7. Recommendation (approve/needs-revision/reject)

Provide constructive feedback.`;

    const response = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async voteOnProposal(
    proposalId: string,
    contributor: string,
    vote: 'approve' | 'reject',
    reason: string
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    proposal.votes.push({ contributor, vote, reason });
    
    // Update status based on votes
    const approvals = proposal.votes.filter(v => v.vote === 'approve').length;
    const rejections = proposal.votes.filter(v => v.vote === 'reject').length;
    
    if (approvals >= 3) {
      proposal.status = 'approved';
    } else if (rejections >= 3) {
      proposal.status = 'rejected';
    }

    await this.saveProposal(proposal);
    
    console.log(`🗳️  Vote recorded for ${proposal.title}`);
    console.log(`   ${approvals} approvals, ${rejections} rejections\n`);
  }

  async calculateCommunityMetrics(projectName: string): Promise<CommunityMetrics> {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    console.log(`📊 Calculating community metrics for ${projectName}...`);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activeContributors = project.contributors.filter(
      c => c.lastActive >= thirtyDaysAgo
    ).length;

    const totalCommits = project.contributors.reduce(
      (sum, c) => sum + c.contributions,
      0
    );

    // Calculate community health score
    let healthScore = 0;
    
    // Active contributor ratio (0-30 points)
    const activeRatio = activeContributors / project.contributors.length;
    healthScore += activeRatio * 30;
    
    // Governance model score (0-20 points)
    const governanceScores = {
      'Democratic': 20,
      'Committee': 18,
      'Consensus': 15,
      'BDFL': 12
    };
    healthScore += governanceScores[project.governanceModel];
    
    // Contribution activity (0-25 points)
    const avgContributions = totalCommits / project.contributors.length;
    healthScore += Math.min(avgContributions / 10, 1) * 25;
    
    // Documentation completeness (0-25 points)
    healthScore += project.contributionGuidelines ? 10 : 0;
    healthScore += project.codeOfConduct ? 10 : 0;
    healthScore += project.securityPolicy ? 5 : 0;

    const metrics: CommunityMetrics = {
      totalContributors: project.contributors.length,
      activeContributors,
      totalCommits,
      openIssues: 0, // Would integrate with GitHub API
      closedIssues: 0,
      pullRequests: 0,
      stars: 0,
      forks: 0,
      communityHealth: Math.round(healthScore)
    };

    console.log(`   Community Health Score: ${metrics.communityHealth}/100`);
    console.log(`   Active Contributors: ${metrics.activeContributors}/${metrics.totalContributors}\n`);

    return metrics;
  }

  async generateLicenseCompliance(projectName: string): Promise<string> {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    console.log(`⚖️  Generating license compliance report for ${projectName}...`);

    const prompt = `Generate a comprehensive license compliance report for this open source project:

Project: ${project.name}
License: ${project.license.type}
Permissions: ${project.license.permissions.join(', ')}
Conditions: ${project.license.conditions.join(', ')}
Limitations: ${project.license.limitations.join(', ')}

Include:
1. License obligations for users
2. Attribution requirements
3. Modification and redistribution rules
4. Commercial use guidelines
5. Patent clauses (if applicable)
6. Compatibility with other licenses
7. Compliance checklist for contributors
8. Common compliance pitfalls to avoid

Format as a professional compliance document.`;

    const response = await this.aiRouter.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const report = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save report
    const reportPath = path.join(this.outputDir, projectName, 'LICENSE_COMPLIANCE_REPORT.md');
    await fs.writeFile(reportPath, report, 'utf-8');

    console.log(`   ✓ Compliance report saved\n`);

    return report;
  }

  private async saveProject(project: OpenSourceProject): Promise<void> {
    const filePath = path.join(this.outputDir, `${project.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
  }

  private async saveProposal(proposal: ContributionProposal): Promise<void> {
    const filePath = path.join(this.outputDir, 'proposals', `${proposal.id}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(proposal, null, 2), 'utf-8');
  }

  getProject(name: string): OpenSourceProject | undefined {
    return this.projects.get(name);
  }

  getAllProjects(): OpenSourceProject[] {
    return Array.from(this.projects.values());
  }

  getProposal(id: string): ContributionProposal | undefined {
    return this.proposals.get(id);
  }

  getAllProposals(): ContributionProposal[] {
    return Array.from(this.proposals.values());
  }
}

