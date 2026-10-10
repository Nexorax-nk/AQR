import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AWS_CONFIG, isAwsConfigured, getAwsClientConfig } from './config';

let ddbDocClient: DynamoDBDocumentClient | null = null;

function getDocClient() {
  if (!ddbDocClient && isAwsConfigured()) {
    const rawClient = new DynamoDBClient(getAwsClientConfig());
    ddbDocClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return ddbDocClient;
}

// In-memory fallback cache so the app always functions seamlessly
const localTelemetryCache: any[] = [];
const localIncidentsCache: any[] = [];

export interface AgentTelemetryRecord {
  id: string;
  timestamp: string;
  agentId: string;
  task: string;
  tokens: number;
  latencyMs: number;
  status: string;
  details?: any;
}

export interface IncidentReportRecord {
  incidentId: string;
  timestamp: string;
  zone: string;
  aqi: number;
  threatLevel: 'MODERATE' | 'CRITICAL' | 'HAZARDOUS';
  recommendation: string;
}

export async function saveAgentTelemetry(record: Omit<AgentTelemetryRecord, 'id' | 'timestamp'>) {
  const item: AgentTelemetryRecord = {
    id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...record,
  };

  localTelemetryCache.unshift(item);
  if (localTelemetryCache.length > 50) localTelemetryCache.pop();

  const client = getDocClient();
  if (!client) {
    return { success: true, mode: 'local', item };
  }

  try {
    await client.send(
      new PutCommand({
        TableName: AWS_CONFIG.tables.telemetry,
        Item: item,
      })
    );
    return { success: true, mode: 'aws-dynamodb', item };
  } catch (err: any) {
    console.warn('[AWS DynamoDB] Telemetry save fallback to local cache:', err.message);
    return { success: true, mode: 'fallback-local', item, error: err.message };
  }
}

export async function saveIncidentReport(record: Omit<IncidentReportRecord, 'timestamp'>) {
  const item: IncidentReportRecord = {
    timestamp: new Date().toISOString(),
    ...record,
  };

  localIncidentsCache.unshift(item);
  if (localIncidentsCache.length > 50) localIncidentsCache.pop();

  const client = getDocClient();
  if (!client) {
    return { success: true, mode: 'local', item };
  }

  try {
    await client.send(
      new PutCommand({
        TableName: AWS_CONFIG.tables.incidents,
        Item: item,
      })
    );
    return { success: true, mode: 'aws-dynamodb', item };
  } catch (err: any) {
    console.warn('[AWS DynamoDB] Incident save fallback to local cache:', err.message);
    return { success: true, mode: 'fallback-local', item, error: err.message };
  }
}

export async function getRecentTelemetry(limit = 10) {
  const client = getDocClient();
  if (client) {
    try {
      const res = await client.send(
        new ScanCommand({
          TableName: AWS_CONFIG.tables.telemetry,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return { items: res.Items, source: 'aws-dynamodb' };
      }
    } catch (err: any) {
      console.warn('[AWS DynamoDB] Scan fallback to local memory:', err.message);
    }
  }

  return { items: localTelemetryCache.slice(0, limit), source: 'local-memory' };
}

export async function getRecentIncidents(limit = 10) {
  const client = getDocClient();
  if (client) {
    try {
      const res = await client.send(
        new ScanCommand({
          TableName: AWS_CONFIG.tables.incidents,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return { items: res.Items as IncidentReportRecord[], source: 'aws-dynamodb' };
      }
    } catch (err: any) {
      console.warn('[AWS DynamoDB] Incidents scan fallback to local memory:', err.message);
    }
  }

  return { items: localIncidentsCache.slice(0, limit) as IncidentReportRecord[], source: 'local-memory' };
}

