export const AWS_CONFIG = {
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
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
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export function getAwsClientConfig() {
  return {
    region: AWS_CONFIG.region,
    credentials: AWS_CONFIG.credentials,
    maxAttempts: 1,
  };
}
