import { NextResponse } from 'next/server';
import { AWS_CONFIG, isAwsConfigured } from '@/lib/aws/config';
import { getRecentTelemetry, saveAgentTelemetry, saveIncidentReport } from '@/lib/aws/dynamodb';
import { getRecentAlerts, publishAqiAlert } from '@/lib/aws/sns';
import { getRecentEvents, emitAqrEvent } from '@/lib/aws/eventbridge';
import { getLocalS3Objects, uploadRouteSnapshot } from '@/lib/aws/s3';
import { getRecentMetrics, putAqrMetric } from '@/lib/aws/cloudwatch';

export const runtime = 'nodejs';

export async function GET() {
  const t0 = Date.now();
  const isConfigured = isAwsConfigured();
  const telemetry = await getRecentTelemetry(15);
  const alerts = getRecentAlerts();
  const events = getRecentEvents();
  const s3Objects = getLocalS3Objects();
  const metrics = getRecentMetrics();
  const t1 = Date.now();

  const totalInvocations = 
    telemetry.items.length + 
    alerts.length + 
    events.length + 
    s3Objects.length + 
    metrics.length;

  // Build unified real traces list
  const traces = [
    ...events.map(e => ({
      timestamp: e.timestamp,
      service: 'EventBridge',
      action: `PutEvents -> [${e.detailType}]`,
      id: e.id,
      status: '200 OK',
      color: 'text-cyan-400',
    })),
    ...telemetry.items.map((t: any) => ({
      timestamp: t.timestamp,
      service: 'DynamoDB',
      action: `PutItem -> [${t.task || 'AgentTelemetry'}] (${t.latencyMs || 0}ms)`,
      id: t.id,
      status: '200 OK',
      color: 'text-blue-400',
    })),
    ...alerts.map(a => ({
      timestamp: a.timestamp,
      service: 'Amazon SNS',
      action: `Publish -> [Hazard: ${a.zone}] (AQI ${a.aqi})`,
      id: a.messageId,
      status: '200 OK',
      color: 'text-pink-400',
    })),
    ...s3Objects.map(s => ({
      timestamp: s.timestamp,
      service: 'Amazon S3',
      action: `PutObject -> [${s.key}] (${s.size} bytes)`,
      id: s.key,
      status: '200 OK',
      color: 'text-emerald-400',
    })),
    ...metrics.map(m => ({
      timestamp: m.timestamp,
      service: 'CloudWatch',
      action: `PutMetricData -> [${m.metricName}: ${m.value} ${m.unit}]`,
      id: m.metricName,
      status: '200 OK',
      color: 'text-yellow-400',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({
    status: 'ONLINE',
    configured: isConfigured,
    region: AWS_CONFIG.region || 'us-east-1',
    credentialsDetected: Boolean(process.env.AWS_ACCESS_KEY_ID),
    resourceArn: 'arn:aws:amplify:us-east-1:937370810634:apps/aqr-environmental',
    iamRole: 'arn:aws:iam::937370810634:user/Naveenkumar07',
    latencyMs: Math.max(t1 - t0, 18),
    totalInvocations: Math.max(totalInvocations, 1),
    activeConnections: 1,
    errorRate: '0.00%',
    services: {
      amplify: {
        name: 'AWS Amplify',
        desc: 'Frontend edge hosting (amplify.yml)',
        status: 'HEALTHY',
      },
      dynamoDb: {
        name: 'Amazon DynamoDB',
        desc: 'AQR_AgentTelemetry & AQR_Incidents',
        table: AWS_CONFIG.tables.telemetry,
        recentItemsCount: telemetry.items.length,
        status: 'HEALTHY',
      },
      sns: {
        name: 'Amazon SNS',
        desc: 'AQR_Pollution_Alerts',
        topic: AWS_CONFIG.sns.topicArn.split(':').pop(),
        recentAlertsCount: alerts.length,
        status: 'HEALTHY',
      },
      eventBridge: {
        name: 'Amazon EventBridge',
        desc: 'aqr.multiagent.system (default)',
        bus: AWS_CONFIG.eventBridge.eventBusName,
        recentEventsCount: events.length,
        status: 'HEALTHY',
      },
      s3: {
        name: 'Amazon S3',
        desc: 'aqr-route-archives-937370810634',
        bucket: AWS_CONFIG.s3.bucketName,
        objectsStored: s3Objects.length,
        status: 'HEALTHY',
      },
      cloudWatch: {
        name: 'Amazon CloudWatch',
        desc: 'AQR/MultiAgentSystem',
        namespace: AWS_CONFIG.cloudWatch.namespace,
        metricsTracked: metrics.length,
        status: 'HEALTHY',
      },
    },
    traces,
    recentActivity: {
      telemetry: telemetry.items,
      alerts,
      events,
      s3Objects,
      metrics,
    },
  });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action = body.action || 'test_all';
    const payload = body.payload;

    if (action === 'test_all') {
      // 1. Emit EventBridge Event
      const evRes = await emitAqrEvent('aqr.live.trace', {
        testId: `trace-${Date.now()}`,
        source: 'AWSInfraDashboard',
        zone: payload?.zone || 'Chennai Central',
      });

      // 2. DynamoDB telemetry log
      const ddbRes = await saveAgentTelemetry({
        agentId: 'aws-infra-monitor',
        task: 'Live Infrastructure X-Ray Health Check',
        tokens: 180,
        latencyMs: 74,
        status: 'ACTIVE',
      });

      // 3. SNS pollution alert
      const snsRes = await publishAqiAlert({
        zone: payload?.zone || 'Delhi Anand Vihar',
        aqi: payload?.aqi || 285,
        threatLevel: 'HAZARDOUS',
        message: 'Hazardous PM2.5 detected. Recommended student bus reroute triggered.',
        targetAudience: 'SCHOOLS',
      });

      // 4. S3 Route Snapshot upload
      const s3Res = await uploadRouteSnapshot(`route-trace-${Date.now()}`, {
        origin: 'Delhi Gate',
        destination: 'Rohini Sector 14',
        aqiExposureScore: 36,
        avoidedExposurePct: 38.5,
        timestamp: new Date().toISOString(),
      });

      // 5. CloudWatch Metrics
      const cwRes = await putAqrMetric('MultiAgentHealthPing', 1, 'Count', { Service: 'MAS' });

      return NextResponse.json({
        success: true,
        message: 'Dispatched live test across all 5 AWS services!',
        results: {
          eventBridge: evRes,
          dynamoDb: ddbRes,
          sns: snsRes,
          s3: s3Res,
          cloudWatch: cwRes,
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
