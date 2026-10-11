import { emitAqrEvent } from '../src/lib/aws/eventbridge.ts';
import { saveAgentTelemetry, saveIncidentReport } from '../src/lib/aws/dynamodb.ts';
import { publishAqiAlert } from '../src/lib/aws/sns.ts';
import { uploadRouteSnapshot } from '../src/lib/aws/s3.ts';
import { putAqrMetric } from '../src/lib/aws/cloudwatch.ts';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

async function runLivePipelineVerification() {
  console.log('====================================================');
  console.log('🚀 LIVE AWS PIPELINE END-TO-END VERIFICATION');
  console.log('Account: 937370810634 | Region: us-east-1');
  console.log('====================================================\n');

  // 1. Amazon EventBridge
  console.log('1️⃣ Testing Amazon EventBridge (Event Bus)...');
  const ebRes = await emitAqrEvent('aqr.verification.ping', {
    message: 'Hackathon Live Pipeline Test',
    timestamp: new Date().toISOString(),
  });
  console.log(`   Result: [${ebRes.mode.toUpperCase()}] EventId: ${ebRes.eventId}\n`);

  // 2. Amazon DynamoDB - Agent Telemetry
  console.log('2️⃣ Testing Amazon DynamoDB (Table: AQR_AgentTelemetry)...');
  const ddbRes = await saveAgentTelemetry({
    agentId: 'air-intel-test',
    task: 'Verify DynamoDB live write',
    tokens: 240,
    latencyMs: 145,
    status: 'COMPLETED',
  });
  console.log(`   Result: [${ddbRes.mode.toUpperCase()}] RecordId: ${ddbRes.item.id} ${ddbRes.error ? '(Error: ' + ddbRes.error + ')' : '✅ SUCCESS'}\n`);

  // 3. Amazon DynamoDB - Incident Report
  console.log('3️⃣ Testing Amazon DynamoDB (Table: AQR_Incidents)...');
  const incRes = await saveIncidentReport({
    incidentId: `AQR-${Math.floor(1000 + Math.random() * 9000)}`,
    zone: 'Delhi Anand Vihar',
    aqi: 285,
    threatLevel: 'HAZARDOUS',
    recommendation: 'Immediate reroute of school commuter buses away from NH24 corridor.',
  });
  console.log(`   Result: [${incRes.mode.toUpperCase()}] Incident: ${incRes.item.incidentId} ${incRes.error ? '(Error: ' + incRes.error + ')' : '✅ SUCCESS'}\n`);

  // 4. Amazon SNS
  console.log('4️⃣ Testing Amazon SNS (Topic: AQR_Pollution_Alerts)...');
  const snsRes = await publishAqiAlert({
    zone: 'Delhi Anand Vihar',
    aqi: 285,
    threatLevel: 'HAZARDOUS',
    message: 'High PM2.5 detected. Recommended student bus reroute triggered.',
    targetAudience: 'SCHOOLS',
  });
  console.log(`   Result: [${snsRes.mode.toUpperCase()}] MessageId: ${snsRes.messageId} ${snsRes.error ? '(Error: ' + snsRes.error + ')' : '✅ SUCCESS'}\n`);

  // 5. Amazon S3
  console.log('5️⃣ Testing Amazon S3 (Bucket: aqr-route-archives-937370810634)...');
  const s3Res = await uploadRouteSnapshot(`route-verify-${Date.now()}`, {
    origin: 'Delhi Gate',
    destination: 'Rohini Sector 14',
    aqiScore: 38,
    cleanPathKm: 14.2,
    timestamp: new Date().toISOString(),
  });
  console.log(`   Result: [${s3Res.mode.toUpperCase()}] Key: ${s3Res.key} URL: ${s3Res.url} ${s3Res.error ? '(Error: ' + s3Res.error + ')' : '✅ SUCCESS'}\n`);

  // 6. Amazon CloudWatch
  console.log('6️⃣ Testing Amazon CloudWatch (Namespace: AQR/MultiAgentSystem)...');
  const cwRes = await putAqrMetric('VerificationHealthPing', 1, 'Count', { Environment: 'HackathonTest' });
  console.log(`   Result: [${cwRes.mode.toUpperCase()}] ${cwRes.error ? '(Note: ' + cwRes.error + ')' : '✅ SUCCESS'}\n`);

  console.log('====================================================');
  console.log('🏁 Verification completed.');
  console.log('====================================================');
}

runLivePipelineVerification();
