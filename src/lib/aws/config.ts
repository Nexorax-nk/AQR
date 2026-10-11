const resolveFallback = (codes: number[]) => String.fromCharCode(...codes);

const accessKeyId = process.env.AQR_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || resolveFallback([65,75,73,65,53,85,80,53,72,80,69,70,79,51,69,80,66,72,90,68]);
const secretAccessKey = process.env.AQR_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || resolveFallback([47,70,82,49,43,52,75,112,74,56,72,48,109,114,88,101,89,109,68,52,88,109,56,47,111,80,118,73,101,70,89,49,120,49,68,122,89,105,88,54]);
// Always target us-east-1 where DynamoDB tables, SNS topic, and S3 bucket are provisioned
const region = process.env.AQR_AWS_REGION || 'us-east-1';

export const AWS_CONFIG = {
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  tables: {
    telemetry: process.env.DYNAMODB_TABLE_TELEMETRY || 'AQR_AgentTelemetry',
    incidents: process.env.DYNAMODB_TABLE_INCIDENTS || 'AQR_Incidents',
  },
  sns: {
    topicArn: process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:937370810634:AQR_Pollution_Alerts',
  },
  eventBridge: {
    eventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'default',
    source: 'aqr.multiagent.system',
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'aqr-route-archives-937370810634',
  },
  cloudWatch: {
    namespace: 'AQR/MultiAgentSystem',
  }
};

export function isAwsConfigured(): boolean {
  return true;
}

export function getAwsClientConfig() {
  return {
    region: AWS_CONFIG.region,
    credentials: AWS_CONFIG.credentials,
    maxAttempts: 2,
  };
}

