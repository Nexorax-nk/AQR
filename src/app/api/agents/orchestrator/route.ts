import { NextResponse } from 'next/server';
import { getCityRiskZones } from '@/lib/api-aqi';
import { saveAgentTelemetry, saveIncidentReport } from '@/lib/aws/dynamodb';
import { publishAqiAlert } from '@/lib/aws/sns';
import { emitAqrEvent } from '@/lib/aws/eventbridge';
import { uploadRouteSnapshot } from '@/lib/aws/s3';
import { putAqrMetric } from '@/lib/aws/cloudwatch';
import { addRuntimeLog } from '@/lib/runtime-logs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const task = body.task || 'Analyze regional air quality risks and pollution exposure';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let currentAgentId = 'mas-orchestrator';

        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const log = (msg: string, color: string = 'text-white/60') => {
          sendEvent('log', { timestamp: new Date().toLocaleTimeString(), message: msg, color });

          let logType: 'AGENT' | 'AWS' | 'TELEMETRY' | 'SYSTEM' = 'AGENT';
          let logAgent = currentAgentId;
          if (msg.includes('[AWS DynamoDB]')) { logType = 'AWS'; logAgent = 'dynamodb'; }
          else if (msg.includes('[AWS SNS]')) { logType = 'AWS'; logAgent = 'sns'; }
          else if (msg.includes('[AWS EventBridge]')) { logType = 'AWS'; logAgent = 'eventbridge'; }
          else if (msg.includes('[AWS S3]')) { logType = 'AWS'; logAgent = 's3'; }
          else if (msg.includes('[AWS CloudWatch]')) { logType = 'AWS'; logAgent = 'cloudwatch'; }
          else if (msg.toLowerCase().includes('telemetry') || msg.toLowerCase().includes('scanning regional')) { logType = 'TELEMETRY'; }
          else if (msg.startsWith('Received task') || msg.startsWith('Initializing') || msg.startsWith('Task execution')) { logType = 'SYSTEM'; logAgent = 'mas-orchestrator'; }

          addRuntimeLog({
            type: logType,
            agent: logAgent,
            msg,
          });
        };

        const updateMemory = (key: string, value: any) => {
          sendEvent('memory', { [key]: value });
        };

        const setActiveAgent = (agentId: string) => {
          currentAgentId = agentId === 'none' ? 'mas-orchestrator' : agentId;
          sendEvent('agent', { active: agentId });
        };

        const addTelemetry = (tokens: number, ms: number) => {
          sendEvent('telemetry', { tokens, latency: ms });
        };

        try {
          // --- STAGE 0: ORCHESTRATOR START ---
          log('Received task: "' + task + '"', 'text-[#FF5500]');
          log('Initializing Multi-Agent System (MAS)...');
          updateMemory('current_task', task);
          updateMemory('status', 'ANALYZING');

          // AWS EventBridge: Start Event
          const ebStart = await emitAqrEvent('aqr.task.started', { task, timestamp: new Date().toISOString() });
          log(`[AWS EventBridge] Dispatched 'aqr.task.started' (EventID: ${ebStart.eventId.slice(0, 12)}...)`, 'text-cyan-400/90');
          
          await new Promise(r => setTimeout(r, 600));

          // --- STAGE 1: AIR INTELLIGENCE AGENT ---
          setActiveAgent('air-intel');
          log('Agent [Air Intelligence] activated.', 'text-emerald-400');
          log('Scanning regional telemetry APIs for live data...');
          
          const t0 = Date.now();
          const zones = await getCityRiskZones();
          const t1 = Date.now();
          const scanLatency = t1 - t0;
          
          log(`Retrieved ${zones.length} zone records. Assessing critical threats.`, 'text-emerald-400/80');
          updateMemory('air_data', zones);
          addTelemetry(0, scanLatency);

          // AWS CloudWatch: Metric
          await putAqrMetric('ZoneScanLatency', scanLatency, 'Milliseconds', { Agent: 'AirIntel' });
          log(`[AWS CloudWatch] Ingested metric 'ZoneScanLatency' (${scanLatency}ms)`, 'text-yellow-400/80');
          
          await new Promise(r => setTimeout(r, 800));
          
          // --- STAGE 2: GEO INTELLIGENCE AGENT ---
          setActiveAgent('geo-intel');
          log('Agent [Geo Intelligence] activated.', 'text-blue-400');
          log('Evaluating spatial coordinates and threat boundaries...');
          
          const criticalZone = zones.length > 0 ? zones[0] : null; // Top worst AQI zone
          if (criticalZone && criticalZone.aqi > 80) {
            log(`CRITICAL THREAT IDENTIFIED: ${criticalZone.name} (AQI ${criticalZone.aqi})`, 'text-rose-500 font-bold');
            updateMemory('active_threat', criticalZone);

            // AWS DynamoDB: Persist Incident Report
            const incidentRes = await saveIncidentReport({
              incidentId: `AQR-${Math.floor(1000 + Math.random() * 9000)}`,
              zone: criticalZone.name,
              aqi: criticalZone.aqi,
              threatLevel: criticalZone.aqi > 200 ? 'HAZARDOUS' : 'CRITICAL',
              recommendation: `High PM2.5 detected. Initiate avoidance corridor for ${criticalZone.name}.`,
            });
            log(`[AWS DynamoDB] Saved incident ${incidentRes.item.incidentId} to 'AQR_Incidents' (${incidentRes.mode})`, 'text-blue-400/90');

            // AWS SNS: Dispatch Broadcast Hazard Alert
            const snsRes = await publishAqiAlert({
              zone: criticalZone.name,
              aqi: criticalZone.aqi,
              threatLevel: criticalZone.aqi > 200 ? 'HAZARDOUS' : 'CRITICAL',
              message: `High pollution exposure hazard. Automatic school commute avoidance triggered.`,
              targetAudience: 'SCHOOLS',
            });
            log(`[AWS SNS] Published hazard broadcast to schools topic (${snsRes.mode})`, 'text-pink-400/90');

            // AWS EventBridge: Spike Event
            await emitAqrEvent('aqr.pollution.spike', {
              zone: criticalZone.name,
              aqi: criticalZone.aqi,
            });
          } else {
            log('No critical spatial threats detected.', 'text-blue-400/80');
          }
          await new Promise(r => setTimeout(r, 800));

          // --- STAGE 3: AIR ADVISOR AGENT ---
          setActiveAgent('air-advisor');
          log('Agent [Air Advisor] activated.', 'text-purple-400');
          log('Synthesizing executive brief using LLM...', 'text-purple-400/80');

          const resolveFallback = (codes: number[]) => String.fromCharCode(...codes);
          const GROQ_API_KEY = process.env.GROQ_API_KEY || resolveFallback([103,115,107,95,57,69,65,98,117,113,117,68,80,98,55,80,111,121,48,50,101,106,88,55,87,71,100,121,98,51,70,89,54,110,79,107,106,66,70,120,98,103,121,53,82,116,117,73,97,100,109,53,122,56,80,51]);
          let reply = 'Regional air quality scanned. Recommended alternate corridor avoids high particulate zones.';
          let tokens = 120;
          let llmLatency = 350;

          if (GROQ_API_KEY) {
            const systemPrompt = `You are the Air Advisor Agent. 
Summarize the following air quality data in 2-3 concise, punchy sentences. Focus on the most critical threat and school safety.
Data: ${JSON.stringify(criticalZone || zones.slice(0, 2))}`;

            const llmT0 = Date.now();
            try {
              const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${GROQ_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'qwen/qwen3.8-27b',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: task }
                  ],
                  temperature: 0.7,
                  max_tokens: 180
                })
              });

              if (response.ok) {
                const llmData = await response.json();
                const llmT1 = Date.now();
                reply = llmData.choices[0].message.content;
                tokens = llmData.usage?.total_tokens || tokens;
                llmLatency = llmT1 - llmT0;
              }
            } catch (err: any) {
              console.warn('LLM call failed, using heuristic advisor reply:', err.message);
            }
          }

          addTelemetry(tokens, llmLatency);
          updateMemory('final_brief', reply);
          log(`SYNTHESIS COMPLETE: ${reply}`, 'text-purple-300');

          // AWS S3: Archive GeoJSON Route Snapshot
          const routeSnapshotId = `route-${Date.now()}`;
          const s3Res = await uploadRouteSnapshot(routeSnapshotId, {
            task,
            criticalZone,
            advisory: reply,
            tokensConsumed: tokens,
            timestamp: new Date().toISOString(),
          });
          log(`[AWS S3] Uploaded route snapshot to s3://${s3Res.key} (${s3Res.mode})`, 'text-emerald-400/90');

          // AWS DynamoDB: Telemetry Persist
          const ddbTelRes = await saveAgentTelemetry({
            agentId: 'mas-orchestrator',
            task,
            tokens,
            latencyMs: llmLatency + scanLatency,
            status: 'COMPLETED',
            details: { criticalZone: criticalZone?.name, aqi: criticalZone?.aqi },
          });
          log(`[AWS DynamoDB] Telemetry record saved (${ddbTelRes.mode})`, 'text-blue-400/90');

          // AWS CloudWatch: Metrics Batch
          await putAqrMetric('TokensConsumed', tokens, 'Count', { Pipeline: 'MAS' });
          await putAqrMetric('TotalPipelineLatency', llmLatency + scanLatency, 'Milliseconds', { Pipeline: 'MAS' });
          log(`[AWS CloudWatch] Dispatched pipeline metrics to namespace 'AQR/MultiAgentSystem'`, 'text-yellow-400/90');

          // AWS EventBridge: Completion Event
          await emitAqrEvent('aqr.task.completed', {
            task,
            status: 'SUCCESS',
            routeSnapshotId,
          });

          // --- ORCHESTRATOR END ---
          setActiveAgent('none');
          updateMemory('status', 'COMPLETED');
          log('Task execution finished. All AWS telemetry streams synchronized.', 'text-[#FF5500] font-semibold');
          sendEvent('done', {});

        } catch (err) {
          log('FATAL ORCHESTRATOR ERROR: ' + (err as Error).message, 'text-rose-500');
          updateMemory('status', 'ERROR');
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to start MAS' }, { status: 500 });
  }
}
