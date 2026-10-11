import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { EventBridgeClient, ListEventBusesCommand } from '@aws-sdk/client-eventbridge';
import { CloudWatchClient, ListMetricsCommand } from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually to avoid dotenv dependency
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const config = {
  region: env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }
};

console.log('Testing IAM user for Region:', config.region);

async function testAll() {
  const results = {};

  // 1. EventBridge
  try {
    const eb = new EventBridgeClient(config);
    const res = await eb.send(new ListEventBusesCommand({}));
    results.eventBridge = { success: true, count: res.EventBuses?.length, buses: res.EventBuses?.map(b => b.Name) };
  } catch (err) {
    results.eventBridge = { success: false, error: err.message };
  }

  // 2. DynamoDB
  try {
    const ddb = new DynamoDBClient(config);
    const res = await ddb.send(new ListTablesCommand({}));
    results.dynamoDb = { success: true, count: res.TableNames?.length, tables: res.TableNames };
  } catch (err) {
    results.dynamoDb = { success: false, error: err.message };
  }

  // 3. S3
  try {
    const s3 = new S3Client(config);
    const res = await s3.send(new ListBucketsCommand({}));
    results.s3 = { success: true, count: res.Buckets?.length, buckets: res.Buckets?.map(b => b.Name) };
  } catch (err) {
    results.s3 = { success: false, error: err.message };
  }

  // 4. SNS
  try {
    const sns = new SNSClient(config);
    const res = await sns.send(new ListTopicsCommand({}));
    results.sns = { success: true, count: res.Topics?.length, topics: res.Topics?.map(t => t.TopicArn) };
  } catch (err) {
    results.sns = { success: false, error: err.message };
  }

  // 5. CloudWatch
  try {
    const cw = new CloudWatchClient(config);
    const res = await cw.send(new ListMetricsCommand({}));
    results.cloudWatch = { success: true, count: res.Metrics?.length };
  } catch (err) {
    results.cloudWatch = { success: false, error: err.message };
  }

  console.log(JSON.stringify(results, null, 2));
}

testAll();
