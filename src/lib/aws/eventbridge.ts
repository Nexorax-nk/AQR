import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { AWS_CONFIG, isAwsConfigured, getAwsClientConfig } from './config';

let ebClient: EventBridgeClient | null = null;

function getEventBridgeClient() {
  if (!ebClient && isAwsConfigured()) {
    ebClient = new EventBridgeClient(getAwsClientConfig());
  }
  return ebClient;
}

export interface AqrEventItem {
  id: string;
  timestamp: string;
  source: string;
  detailType: string;
  detail: Record<string, any>;
}

const localEventBus: AqrEventItem[] = [];

export async function emitAqrEvent(detailType: string, detail: Record<string, any>) {
  const eventId = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item: AqrEventItem = {
    id: eventId,
    timestamp: new Date().toISOString(),
    source: AWS_CONFIG.eventBridge.source,
    detailType,
    detail,
  };

  localEventBus.unshift(item);
  if (localEventBus.length > 30) localEventBus.pop();

  const client = getEventBridgeClient();
  if (!client) {
    return { success: true, mode: 'local', eventId, item };
  }

  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: AWS_CONFIG.eventBridge.eventBusName,
          Source: AWS_CONFIG.eventBridge.source,
          DetailType: detailType,
          Detail: JSON.stringify(detail),
          Time: new Date(),
        },
      ],
    });

    const res = await client.send(command);
    const awsEntryId = res.Entries?.[0]?.EventId || eventId;
    return {
      success: true,
      mode: 'aws-eventbridge',
      eventId: awsEntryId,
      item,
    };
  } catch (err: any) {
    console.warn('[AWS EventBridge] PutEvents fallback to local bus:', err.message);
    return {
      success: true,
      mode: 'fallback-local',
      eventId,
      item,
      error: err.message,
    };
  }
}

export function getRecentEvents() {
  return localEventBus;
}
