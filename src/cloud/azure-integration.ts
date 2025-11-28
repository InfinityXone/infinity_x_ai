/**
 * INFINITY X AI - AZURE INTEGRATION
 * ==================================
 */

import { EventEmitter } from 'events';

interface AzureConfig {
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  resourceGroup: string;
  region: string;
}

interface AzureServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastCheck: Date;
}

export class AzureIntegration extends EventEmitter {
  private config: AzureConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private services: Map<string, AzureServiceStatus> = new Map();
  private isInitialized = false;
  private costTracker = { daily: 0, monthly: 0, budget: 10.00, alerts: [] as string[] };

  constructor() {
    super();
    this.config = {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID || '',
      clientId: process.env.AZURE_CLIENT_ID || '',
      clientSecret: process.env.AZURE_CLIENT_SECRET || '',
      resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'infinity-x-ai-rg',
      region: process.env.AZURE_REGION || 'eastus'
    };
  }

  async authenticate(): Promise<boolean> {
    if (!this.config.tenantId || !this.config.clientId || !this.config.clientSecret) {
      console.log('Warning: Azure credentials not configured');
      return false;
    }
    try {
      const tokenUrl = 'https://login.microsoftonline.com/' + this.config.tenantId + '/oauth2/v2.0/token';
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'https://management.azure.com/.default',
          grant_type: 'client_credentials'
        })
      });
      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
        console.log('Azure authentication successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Azure auth error:', error);
      return false;
    }
  }

  async chatCompletion(messages: Array<{ role: string; content: string }>, options: { temperature?: number; maxTokens?: number } = {}): Promise<{ content: string; usage: { prompt: number; completion: number; total: number } } | null> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    if (!endpoint || !apiKey) return null;
    try {
      const url = endpoint + '/openai/deployments/' + deployment + '/chat/completions?api-version=2024-02-15-preview';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 2000 })
      });
      if (response.ok) {
        const data = await response.json();
        return { content: data.choices[0]?.message?.content || '', usage: { prompt: data.usage?.prompt_tokens || 0, completion: data.usage?.completion_tokens || 0, total: data.usage?.total_tokens || 0 } };
      }
      return null;
    } catch (error) {
      console.error('Azure OpenAI error:', error);
      return null;
    }
  }

  async uploadBlob(blobName: string, content: Buffer | string, contentType = 'application/octet-stream'): Promise<string | null> {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT;
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'infinity-data';
    if (!accountName) return null;
    return 'https://' + accountName + '.blob.core.windows.net/' + containerName + '/' + blobName;
  }

  async analyzeText(text: string, features: string[] = ['sentiment']): Promise<Record<string, unknown> | null> {
    const endpoint = process.env.AZURE_COGNITIVE_ENDPOINT;
    const apiKey = process.env.AZURE_COGNITIVE_KEY;
    if (!endpoint || !apiKey) return null;
    return { sentiment: 'neutral', text };
  }

  async checkServiceHealth(): Promise<Map<string, AzureServiceStatus>> {
    const services = [
      { name: 'Azure OpenAI', check: () => !!process.env.AZURE_OPENAI_ENDPOINT },
      { name: 'Azure Storage', check: () => !!process.env.AZURE_STORAGE_ACCOUNT },
      { name: 'Azure Cognitive', check: () => !!process.env.AZURE_COGNITIVE_ENDPOINT },
      { name: 'Azure DevOps', check: () => !!process.env.AZURE_DEVOPS_ORG }
    ];
    for (const service of services) {
      this.services.set(service.name, { name: service.name, status: service.check() ? 'active' : 'inactive', lastCheck: new Date() });
    }
    return this.services;
  }

  async initialize(): Promise<boolean> {
    console.log('\nInitializing Azure Integration...');
    if (this.config.tenantId && this.config.clientId) await this.authenticate();
    await this.checkServiceHealth();
    const activeServices = Array.from(this.services.values()).filter(s => s.status === 'active').length;
    console.log('Azure Integration: ' + activeServices + '/' + this.services.size + ' services active');
    this.isInitialized = true;
    return true;
  }

  getStatus(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      authenticated: !!this.accessToken,
      config: { tenantId: this.config.tenantId ? 'configured' : 'not set', region: this.config.region },
      services: Object.fromEntries(this.services),
      costs: this.costTracker
    };
  }
}

export const azureIntegration = new AzureIntegration();
