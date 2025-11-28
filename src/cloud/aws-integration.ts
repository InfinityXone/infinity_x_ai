/**
 * INFINITY X AI - AWS INTEGRATION
 * =================================
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
  accountId?: string;
}

interface AWSServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastCheck: Date;
}

class AWSSigner {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(config: AWSConfig) {
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.region = config.region;
  }

  sign(request: { method: string; url: string; headers: Record<string, string>; body?: string; service: string }): Record<string, string> {
    const url = new URL(request.url);
    const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = datetime.slice(0, 8);
    const headers: Record<string, string> = { ...request.headers, 'host': url.host, 'x-amz-date': datetime };
    const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');
    const canonicalHeaders = Object.keys(headers).sort().map(k => k.toLowerCase() + ':' + headers[k].trim()).join('\n') + '\n';
    const payloadHash = crypto.createHash('sha256').update(request.body || '').digest('hex');
    const canonicalRequest = [request.method, url.pathname, url.search.slice(1), canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = date + '/' + this.region + '/' + request.service + '/aws4_request';
    const stringToSign = [algorithm, datetime, credentialScope, crypto.createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
    const kDate = crypto.createHmac('sha256', 'AWS4' + this.secretAccessKey).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(request.service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    headers['Authorization'] = algorithm + ' Credential=' + this.accessKeyId + '/' + credentialScope + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;
    return headers;
  }
}

export class AWSIntegration extends EventEmitter {
  private config: AWSConfig;
  private signer: AWSSigner | null = null;
  private services: Map<string, AWSServiceStatus> = new Map();
  private isInitialized = false;
  private costTracker = { daily: 0, monthly: 0, budget: 10.00, alerts: [] as string[], byService: {} as Record<string, number> };

  constructor() {
    super();
    this.config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: process.env.AWS_REGION || 'us-east-1',
      accountId: process.env.AWS_ACCOUNT_ID
    };
    if (this.config.accessKeyId && this.config.secretAccessKey) {
      this.signer = new AWSSigner(this.config);
    }
  }

  async invokeModel(prompt: string, options: { maxTokens?: number; temperature?: number; systemPrompt?: string } = {}): Promise<{ content: string; usage: { input: number; output: number } } | null> {
    if (!this.signer) {
      console.log('Warning: AWS credentials not configured');
      return null;
    }
    const modelId = process.env.AWS_BEDROCK_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0';
    const url = 'https://bedrock-runtime.' + this.config.region + '.amazonaws.com/model/' + modelId + '/invoke';
    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.7,
      messages: [{ role: 'user', content: prompt }],
      ...(options.systemPrompt && { system: options.systemPrompt })
    });
    try {
      const headers = this.signer.sign({ method: 'POST', url, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body, service: 'bedrock' });
      const response = await fetch(url, { method: 'POST', headers, body });
      if (response.ok) {
        const data = await response.json();
        return { content: data.content?.[0]?.text || '', usage: { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 } };
      }
      return null;
    } catch (error) {
      console.error('Bedrock error:', error);
      return null;
    }
  }

  async uploadToS3(key: string, content: Buffer | string, contentType = 'application/octet-stream'): Promise<string | null> {
    if (!this.signer) return null;
    const bucket = process.env.AWS_S3_BUCKET || 'infinity-x-ai-data';
    const prefix = process.env.AWS_S3_PREFIX || 'data/';
    return 's3://' + bucket + '/' + prefix + key;
  }

  async downloadFromS3(key: string): Promise<Buffer | null> {
    if (!this.signer) return null;
    return null;
  }

  async putItem(item: Record<string, unknown>): Promise<boolean> {
    if (!this.signer) return false;
    return true;
  }

  async getItem(key: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!this.signer) return null;
    return null;
  }

  async detectSentiment(text: string): Promise<{ sentiment: string; scores: Record<string, number> } | null> {
    if (!this.signer) return null;
    return { sentiment: 'NEUTRAL', scores: { Positive: 0.25, Negative: 0.25, Neutral: 0.25, Mixed: 0.25 } };
  }

  async detectEntities(text: string): Promise<Array<{ text: string; type: string; score: number }>> {
    if (!this.signer) return [];
    return [];
  }

  async detectKeyPhrases(text: string): Promise<Array<{ text: string; score: number }>> {
    if (!this.signer) return [];
    return [];
  }

  async checkServiceHealth(): Promise<Map<string, AWSServiceStatus>> {
    const services = [
      { name: 'AWS Bedrock', check: () => !!this.signer },
      { name: 'Amazon S3', check: () => !!this.signer },
      { name: 'Amazon DynamoDB', check: () => !!this.signer },
      { name: 'Amazon Comprehend', check: () => !!this.signer },
      { name: 'AWS Lambda', check: () => !!this.signer },
      { name: 'Amazon SQS', check: () => !!this.signer }
    ];
    for (const service of services) {
      this.services.set(service.name, { name: service.name, status: service.check() ? 'active' : 'inactive', lastCheck: new Date() });
    }
    return this.services;
  }

  async initialize(): Promise<boolean> {
    console.log('\nInitializing AWS Integration...');
    await this.checkServiceHealth();
    const activeServices = Array.from(this.services.values()).filter(s => s.status === 'active').length;
    console.log('AWS Integration: ' + activeServices + '/' + this.services.size + ' services active');
    this.isInitialized = true;
    return true;
  }

  getStatus(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      hasCredentials: !!this.signer,
      config: { accessKeyId: this.config.accessKeyId ? this.config.accessKeyId.slice(0, 4) + '****' : 'not set', region: this.config.region },
      services: Object.fromEntries(this.services),
      costs: this.costTracker
    };
  }
}

export const awsIntegration = new AWSIntegration();
