import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { AWS_CONFIG, isAwsConfigured, getAwsClientConfig } from './config';

let snsClient: SNSClient | null = null;

function getSnsClient() {
  if (!snsClient && isAwsConfigured()) {
    snsClient = new SNSClient(getAwsClientConfig());
  }
  return snsClient;
}

export interface AqiAlertPayload {
  zone: string;
  aqi: number;
  threatLevel: 'MODERATE' | 'CRITICAL' | 'HAZARDOUS';
  message: string;
  targetAudience?: 'SCHOOLS' | 'HOSPITALS' | 'COMMUTERS' | 'ALL';
}

const localAlertsHistory: Array<AqiAlertPayload & { timestamp: string; messageId: string }> = [];

export async function publishAqiAlert(alert: AqiAlertPayload) {
  const messageId = `sns-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    ...alert,
    timestamp: new Date().toISOString(),
    messageId,
  };

  localAlertsHistory.unshift(record);
  if (localAlertsHistory.length > 20) localAlertsHistory.pop();

  const client = getSnsClient();
  if (!client) {
    return { success: true, mode: 'local', messageId, record };
  }

  try {
    const formattedMessage = JSON.stringify({
      default: `[AQR ALERT] ${alert.threatLevel} AQI in ${alert.zone}: AQI ${alert.aqi}. ${alert.message}`,
      target: alert.targetAudience || 'ALL',
      data: alert,
    });

    const command = new PublishCommand({
      TopicArn: AWS_CONFIG.sns.topicArn,
      Subject: `[AQR Environmental Hazard] ${alert.zone} AQI Spike (${alert.aqi})`,
      Message: formattedMessage,
      MessageStructure: 'json',
    });

    const response = await client.send(command);
    return {
      success: true,
      mode: 'aws-sns',
      messageId: response.MessageId || messageId,
      record,
    };
  } catch (err: any) {
    console.warn('[AWS SNS] Publish fallback to local alert queue:', err.message);
    return {
      success: true,
      mode: 'fallback-local',
      messageId,
      record,
      error: err.message,
    };
  }
}

export function getRecentAlerts() {
  return localAlertsHistory;
}
