import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SNSClient, CreateTopicCommand } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local
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

async function setup() {
  console.log('--- Setting up dedicated AWS resources for AQR in us-east-1 ---');
  const ddb = new DynamoDBClient(config);
  const s3 = new S3Client(config);
  const sns = new SNSClient(config);

  // 1. DynamoDB: AQR_AgentTelemetry
  try {
    await ddb.send(new CreateTableCommand({
      TableName: 'AQR_AgentTelemetry',
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    console.log('✅ DynamoDB Table created: AQR_AgentTelemetry');
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('ℹ️ DynamoDB Table already exists: AQR_AgentTelemetry');
    } else {
      console.log('⚠️ DynamoDB Table creation note:', err.message);
    }
  }

  // 2. DynamoDB: AQR_Incidents
  try {
    await ddb.send(new CreateTableCommand({
      TableName: 'AQR_Incidents',
      AttributeDefinitions: [{ AttributeName: 'incidentId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'incidentId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    console.log('✅ DynamoDB Table created: AQR_Incidents');
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('ℹ️ DynamoDB Table already exists: AQR_Incidents');
    } else {
      console.log('⚠️ DynamoDB Table creation note:', err.message);
    }
  }

  // 3. SNS Topic: AQR_Pollution_Alerts
  let topicArn = 'arn:aws:sns:us-east-1:937370810634:AQR_Pollution_Alerts';
  try {
    const res = await sns.send(new CreateTopicCommand({ Name: 'AQR_Pollution_Alerts' }));
    topicArn = res.TopicArn || topicArn;
    console.log('✅ SNS Topic created/ready:', topicArn);
  } catch (err) {
    console.log('⚠️ SNS Topic note:', err.message);
  }

  // 4. S3 Bucket: aqr-route-archives-937370810634
  const bucketName = 'aqr-route-archives-937370810634';
  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log('✅ S3 Bucket created: ' + bucketName);
  } catch (err) {
    if (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists') {
      console.log('ℹ️ S3 Bucket already owned: ' + bucketName);
    } else {
      console.log('⚠️ S3 Bucket note:', err.message);
    }
  }

  console.log('--- Provisioning check completed ---');
  return { topicArn, bucketName };
}

setup();
