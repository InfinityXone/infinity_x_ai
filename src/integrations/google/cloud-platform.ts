import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

export interface CloudRunService {
  name: string;
  image: string;
  memory: string;
  cpu: string;
  env?: Record<string, string>;
  port?: number;
}

export interface PubSubMessage {
  topic: string;
  data: any;
  attributes?: Record<string, string>;
}

export interface BigQueryJob {
  query: string;
  parameters?: any[];
}

export class GoogleCloudPlatformManager {
  private projectId: string;
  private region: string;
  private auth: GoogleAuth;
  private pubsub: PubSub;
  private bigquery: BigQuery;
  private storage: Storage;
  private run: any;
  private compute: any;
  private container: any;
  private sql: any;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.region = process.env.GOOGLE_CLOUD_REGION || 'us-central1';

    // Initialize auth
    this.auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/pubsub',
        'https://www.googleapis.com/auth/bigquery',
        'https://www.googleapis.com/auth/compute'
      ]
    });

    // Initialize Google Cloud services
    this.pubsub = new PubSub({
      projectId: this.projectId,
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    });

    this.bigquery = new BigQuery({
      projectId: this.projectId,
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    });

    this.storage = new Storage({
      projectId: this.projectId,
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    });

    // Initialize Google APIs
    this.run = google.run({ version: 'v2', auth: this.auth });
    this.compute = google.compute({ version: 'v1', auth: this.auth });
    this.container = google.container({ version: 'v1', auth: this.auth });
    this.sql = google.sqladmin({ version: 'v1', auth: this.auth });
  }

  // ============================================================
  // CLOUD RUN OPERATIONS
  // ============================================================

  async deployCloudRunService(service: CloudRunService): Promise<any> {
    console.log(`🚀 Deploying Cloud Run service: ${service.name}`);

    const parent = `projects/${this.projectId}/locations/${this.region}`;

    const serviceSpec: any = {
      template: {
        containers: [
          {
            image: service.image,
            resources: {
              limits: {
                memory: service.memory || '512Mi',
                cpu: service.cpu || '1'
              }
            },
            ports: [
              {
                containerPort: service.port || 8080
              }
            ]
          }
        ]
      }
    };

    if (service.env) {
      serviceSpec.template.containers[0].env = Object.entries(service.env).map(
        ([name, value]) => ({ name, value })
      );
    }

    const response = await this.run.projects.locations.services.create({
      parent,
      serviceId: service.name,
      requestBody: serviceSpec
    });

    console.log(`✅ Cloud Run service deployed: ${service.name}`);
    return response.data;
  }

  async listCloudRunServices(): Promise<any[]> {
    const parent = `projects/${this.projectId}/locations/${this.region}`;

    const response = await this.run.projects.locations.services.list({
      parent
    });

    return response.data.services || [];
  }

  async deleteCloudRunService(serviceName: string): Promise<void> {
    const name = `projects/${this.projectId}/locations/${this.region}/services/${serviceName}`;

    await this.run.projects.locations.services.delete({ name });

    console.log(`🗑️ Deleted Cloud Run service: ${serviceName}`);
  }

  // ============================================================
  // CLOUD PUB/SUB OPERATIONS
  // ============================================================

  async createTopic(topicName: string): Promise<any> {
    const [topic] = await this.pubsub.createTopic(topicName);
    console.log(`📢 Created Pub/Sub topic: ${topicName}`);
    return topic;
  }

  async publishMessage(message: PubSubMessage): Promise<string> {
    const topic = this.pubsub.topic(message.topic);
    const dataBuffer = Buffer.from(JSON.stringify(message.data));

    const messageId = await topic.publishMessage({
      data: dataBuffer,
      attributes: message.attributes
    });

    console.log(`📤 Published message to ${message.topic}: ${messageId}`);
    return messageId;
  }

  async createSubscription(
    topicName: string,
    subscriptionName: string
  ): Promise<any> {
    const [subscription] = await this.pubsub
      .topic(topicName)
      .createSubscription(subscriptionName);

    console.log(`📥 Created subscription: ${subscriptionName}`);
    return subscription;
  }

  async subscribeToMessages(
    subscriptionName: string,
    callback: (message: any) => void
  ): Promise<void> {
    const subscription = this.pubsub.subscription(subscriptionName);

    subscription.on('message', (message) => {
      console.log(`📨 Received message: ${message.id}`);
      const data = JSON.parse(message.data.toString());
      callback(data);
      message.ack();
    });

    subscription.on('error', (error) => {
      console.error('❌ Subscription error:', error);
    });

    console.log(`👂 Listening to subscription: ${subscriptionName}`);
  }

  // ============================================================
  // BIGQUERY OPERATIONS
  // ============================================================

  async createDataset(datasetId: string): Promise<any> {
    const [dataset] = await this.bigquery.createDataset(datasetId);
    console.log(`📊 Created BigQuery dataset: ${datasetId}`);
    return dataset;
  }

  async runQuery(job: BigQueryJob): Promise<any[]> {
    const options: any = {
      query: job.query,
      location: this.region
    };

    if (job.parameters) {
      options.params = job.parameters;
    }

    const [rows] = await this.bigquery.query(options);
    console.log(`📊 Query returned ${rows.length} rows`);
    return rows;
  }

  async insertRows(datasetId: string, tableId: string, rows: any[]): Promise<void> {
    await this.bigquery.dataset(datasetId).table(tableId).insert(rows);
    console.log(`📊 Inserted ${rows.length} rows into ${datasetId}.${tableId}`);
  }

  async createTable(
    datasetId: string,
    tableId: string,
    schema: any[]
  ): Promise<any> {
    const [table] = await this.bigquery.dataset(datasetId).createTable(tableId, {
      schema
    });

    console.log(`📊 Created BigQuery table: ${datasetId}.${tableId}`);
    return table;
  }

  // ============================================================
  // CLOUD STORAGE OPERATIONS
  // ============================================================

  async createBucket(bucketName: string): Promise<any> {
    const [bucket] = await this.storage.createBucket(bucketName);
    console.log(`🪣 Created Cloud Storage bucket: ${bucketName}`);
    return bucket;
  }

  async uploadToStorage(
    bucketName: string,
    fileName: string,
    content: string | Buffer
  ): Promise<any> {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(content);

    console.log(`☁️ Uploaded ${fileName} to ${bucketName}`);
    return file;
  }

  async downloadFromStorage(bucketName: string, fileName: string): Promise<Buffer> {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const [content] = await file.download();

    console.log(`⬇️ Downloaded ${fileName} from ${bucketName}`);
    return content;
  }

  async listBuckets(): Promise<any[]> {
    const [buckets] = await this.storage.getBuckets();
    return buckets;
  }

  // ============================================================
  // KUBERNETES ENGINE (GKE) OPERATIONS
  // ============================================================

  async createGKECluster(clusterName: string, nodeCount: number = 3): Promise<any> {
    const parent = `projects/${this.projectId}/locations/${this.region}`;

    const cluster = {
      name: clusterName,
      initialNodeCount: nodeCount,
      nodeConfig: {
        machineType: 'e2-medium',
        diskSizeGb: 100
      }
    };

    const response = await this.container.projects.locations.clusters.create({
      parent,
      requestBody: { cluster }
    });

    console.log(`☸️ Creating GKE cluster: ${clusterName}`);
    return response.data;
  }

  async listGKEClusters(): Promise<any[]> {
    const parent = `projects/${this.projectId}/locations/${this.region}`;

    const response = await this.container.projects.locations.clusters.list({
      parent
    });

    return response.data.clusters || [];
  }

  // ============================================================
  // CLOUD SQL OPERATIONS
  // ============================================================

  async createCloudSQLInstance(
    instanceName: string,
    databaseVersion: string = 'POSTGRES_14'
  ): Promise<any> {
    const instance = {
      name: instanceName,
      databaseVersion,
      region: this.region,
      settings: {
        tier: 'db-f1-micro',
        backupConfiguration: {
          enabled: true
        }
      }
    };

    const response = await this.sql.instances.insert({
      project: this.projectId,
      requestBody: instance
    });

    console.log(`🗄️ Creating Cloud SQL instance: ${instanceName}`);
    return response.data;
  }

  async listCloudSQLInstances(): Promise<any[]> {
    const response = await this.sql.instances.list({
      project: this.projectId
    });

    return response.data.items || [];
  }

  // ============================================================
  // COMPUTE ENGINE OPERATIONS
  // ============================================================

  async createComputeInstance(
    instanceName: string,
    machineType: string = 'e2-micro'
  ): Promise<any> {
    const zone = `${this.region}-a`;

    const instance = {
      name: instanceName,
      machineType: `zones/${zone}/machineTypes/${machineType}`,
      disks: [
        {
          boot: true,
          initializeParams: {
            sourceImage: 'projects/debian-cloud/global/images/family/debian-11'
          }
        }
      ],
      networkInterfaces: [
        {
          network: 'global/networks/default',
          accessConfigs: [
            {
              name: 'External NAT',
              type: 'ONE_TO_ONE_NAT'
            }
          ]
        }
      ]
    };

    const response = await this.compute.instances.insert({
      project: this.projectId,
      zone,
      requestBody: instance
    });

    console.log(`💻 Creating Compute Engine instance: ${instanceName}`);
    return response.data;
  }

  async listComputeInstances(): Promise<any[]> {
    const zone = `${this.region}-a`;

    const response = await this.compute.instances.list({
      project: this.projectId,
      zone
    });

    return response.data.items || [];
  }
}
