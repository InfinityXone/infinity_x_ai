/**
 * INFINITY X AI - UNIFIED CLOUD MANAGER
 * ======================================
 */

import { EventEmitter } from 'events';
import { AzureIntegration, azureIntegration } from './azure-integration.ts';
import { AWSIntegration, awsIntegration } from './aws-integration.ts';

interface CloudProvider {
  name: string;
  type: 'gcp' | 'aws' | 'azure';
  status: 'active' | 'inactive' | 'error' | 'degraded';
  priority: number;
  costMultiplier: number;
  services: string[];
  lastHealthCheck: Date;
}

export class UnifiedCloudManager extends EventEmitter {
  private providers: Map<string, CloudProvider> = new Map();
  private azure: AzureIntegration;
  private aws: AWSIntegration;
  private isInitialized = false;
  private costTracker = {
    gcp: { daily: 0, monthly: 0 },
    aws: { daily: 0, monthly: 0 },
    azure: { daily: 0, monthly: 0 },
    budget: 10.00,
    alerts: [] as string[]
  };

  constructor() {
    super();
    this.azure = azureIntegration;
    this.aws = awsIntegration;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('gcp', {
      name: 'Google Cloud Platform',
      type: 'gcp',
      status: process.env.GOOGLE_CLIENT_ID ? 'active' : 'inactive',
      priority: 1,
      costMultiplier: 0.8,
      services: ['vertex-ai', 'cloud-storage', 'firestore', 'cloud-functions', 'pubsub'],
      lastHealthCheck: new Date()
    });

    this.providers.set('aws', {
      name: 'Amazon Web Services',
      type: 'aws',
      status: process.env.AWS_ACCESS_KEY_ID ? 'active' : 'inactive',
      priority: 2,
      costMultiplier: 1.0,
      services: ['bedrock', 's3', 'dynamodb', 'lambda', 'comprehend', 'sqs'],
      lastHealthCheck: new Date()
    });

    this.providers.set('azure', {
      name: 'Microsoft Azure',
      type: 'azure',
      status: process.env.AZURE_TENANT_ID ? 'active' : 'inactive',
      priority: 3,
      costMultiplier: 1.1,
      services: ['openai', 'blob-storage', 'cognitive-services', 'functions', 'devops'],
      lastHealthCheck: new Date()
    });
  }

  async chat(request: { prompt: string; preferredProvider?: string }): Promise<{ content: string; provider: string } | null> {
    const provider = request.preferredProvider || 'aws';
    if (provider === 'aws' && this.providers.get('aws')?.status === 'active') {
      const result = await this.aws.invokeModel(request.prompt);
      if (result) return { content: result.content, provider: 'aws' };
    }
    if (provider === 'azure' && this.providers.get('azure')?.status === 'active') {
      const result = await this.azure.chatCompletion([{ role: 'user', content: request.prompt }]);
      if (result) return { content: result.content, provider: 'azure' };
    }
    return null;
  }

  async uploadFile(request: { key: string; content: Buffer | string; preferredProvider?: string }): Promise<{ url: string; provider: string } | null> {
    const provider = request.preferredProvider || 'aws';
    if (provider === 'aws') {
      const url = await this.aws.uploadToS3(request.key, request.content);
      if (url) return { url, provider: 'aws' };
    }
    if (provider === 'azure') {
      const url = await this.azure.uploadBlob(request.key, request.content);
      if (url) return { url, provider: 'azure' };
    }
    return null;
  }

  async analyzeText(text: string): Promise<Record<string, unknown> | null> {
    if (this.providers.get('aws')?.status === 'active') {
      const sentiment = await this.aws.detectSentiment(text);
      const entities = await this.aws.detectEntities(text);
      const phrases = await this.aws.detectKeyPhrases(text);
      return { sentiment, entities, keyPhrases: phrases, provider: 'aws' };
    }
    if (this.providers.get('azure')?.status === 'active') {
      const result = await this.azure.analyzeText(text);
      if (result) return { ...result, provider: 'azure' };
    }
    return null;
  }

  async checkAllHealth(): Promise<void> {
    console.log('\nChecking cloud provider health...');
    if (process.env.AWS_ACCESS_KEY_ID) {
      await this.aws.checkServiceHealth();
      this.providers.get('aws')!.status = this.aws.getStatus().hasCredentials ? 'active' : 'inactive';
      this.providers.get('aws')!.lastHealthCheck = new Date();
    }
    if (process.env.AZURE_TENANT_ID) {
      await this.azure.checkServiceHealth();
      this.providers.get('azure')!.status = this.azure.getStatus().authenticated ? 'active' : 'degraded';
      this.providers.get('azure')!.lastHealthCheck = new Date();
    }
    if (process.env.GOOGLE_CLIENT_ID) {
      this.providers.get('gcp')!.status = 'active';
      this.providers.get('gcp')!.lastHealthCheck = new Date();
    }
    const active = Array.from(this.providers.values()).filter(p => p.status === 'active').length;
    console.log('Health check complete: ' + active + '/' + this.providers.size + ' providers active');
  }

  getCostReport() {
    const totalMonthly = this.costTracker.gcp.monthly + this.costTracker.aws.monthly + this.costTracker.azure.monthly;
    return {
      totalMonthly,
      budget: this.costTracker.budget,
      byProvider: { gcp: this.costTracker.gcp, aws: this.costTracker.aws, azure: this.costTracker.azure },
      alerts: this.costTracker.alerts
    };
  }

  getStatus(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      providers: Object.fromEntries(Array.from(this.providers.entries()).map(([key, provider]) => [
        key,
        { name: provider.name, status: provider.status, priority: provider.priority, services: provider.services, lastHealthCheck: provider.lastHealthCheck }
      ])),
      costs: this.getCostReport()
    };
  }

  async initialize(): Promise<boolean> {
    console.log('\n' + '='.repeat(60));
    console.log('UNIFIED CLOUD MANAGER - INITIALIZING');
    console.log('='.repeat(60) + '\n');

    if (process.env.AWS_ACCESS_KEY_ID) {
      console.log('Initializing AWS...');
      await this.aws.initialize();
    }
    if (process.env.AZURE_TENANT_ID) {
      console.log('Initializing Azure...');
      await this.azure.initialize();
    }
    await this.checkAllHealth();

    const activeProviders = Array.from(this.providers.values()).filter(p => p.status === 'active');

    console.log('\n' + '-'.repeat(60));
    console.log('CLOUD PROVIDER STATUS:');
    console.log('-'.repeat(60));

    for (const [key, provider] of this.providers) {
      const icon = provider.status === 'active' ? '[ACTIVE]' : provider.status === 'degraded' ? '[DEGRADED]' : '[INACTIVE]';
      console.log('   ' + icon + ' ' + provider.name);
    }

    console.log('-'.repeat(60));
    console.log('   Active: ' + activeProviders.length + '/' + this.providers.size + ' providers');
    console.log('='.repeat(60) + '\n');

    this.isInitialized = true;
    return activeProviders.length > 0;
  }
}

export const unifiedCloud = new UnifiedCloudManager();

// Auto-run if executed directly
const isMainModule = import.meta.url === 'file://' + process.argv[1] || process.argv[1]?.endsWith('unified-cloud-manager.ts');

if (isMainModule) {
  (async () => {
    await unifiedCloud.initialize();
    console.log('\nUnified Cloud Status:');
    console.log(JSON.stringify(unifiedCloud.getStatus(), null, 2));
  })();
}
