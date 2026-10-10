import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { AWS_CONFIG, isAwsConfigured, getAwsClientConfig } from './config';

let cwClient: CloudWatchClient | null = null;

function getCloudWatchClient() {
  if (!cwClient && isAwsConfigured()) {
    cwClient = new CloudWatchClient(getAwsClientConfig());
  }
  return cwClient;
}

export interface MetricRecord {
  timestamp: string;
  metricName: string;
  value: number;
  unit: string;
  dimensions?: Record<string, string>;
}

const localMetricsBuffer: MetricRecord[] = [];

export async function putAqrMetric(
  metricName: string,
  value: number,
  unit: 'Milliseconds' | 'Count' | 'Percent' | 'None' = 'None',
  dimensions?: Record<string, string>
) {
  const record: MetricRecord = {
    timestamp: new Date().toISOString(),
    metricName,
    value,
    unit,
    dimensions,
  };

  localMetricsBuffer.unshift(record);
  if (localMetricsBuffer.length > 50) localMetricsBuffer.pop();

  const client = getCloudWatchClient();
  if (!client) {
    return { success: true, mode: 'local', record };
  }

  try {
    const dims = dimensions
      ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
      : [{ Name: 'Environment', Value: 'Production' }];

    const command = new PutMetricDataCommand({
      Namespace: AWS_CONFIG.cloudWatch.namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit as any,
          Timestamp: new Date(),
          Dimensions: dims,
        },
      ],
    });

    await client.send(command);
    return { success: true, mode: 'aws-cloudwatch', record };
  } catch (err: any) {
    console.warn('[AWS CloudWatch] PutMetricData fallback to local buffer:', err.message);
    return { success: true, mode: 'fallback-local', record, error: err.message };
  }
}

export function getRecentMetrics() {
  return localMetricsBuffer;
}
