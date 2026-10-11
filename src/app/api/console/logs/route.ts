import { NextResponse } from 'next/server';
import { getRuntimeLogs, getConsoleStats, executeRealAgentCycle, addRuntimeLog } from '@/lib/runtime-logs';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const [logs, stats] = await Promise.all([
      getRuntimeLogs(limit),
      getConsoleStats(),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      stats,
    });
  } catch (error: any) {
    console.error('Failed to get runtime logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const action = body.action || 'execute_cycle';

    if (action === 'execute_cycle') {
      const task = body.task || 'Live regional environmental scan and particulate exposure assessment';
      const result = await executeRealAgentCycle(task);
      return NextResponse.json({
        success: true,
        message: 'Agent execution cycle completed',
        incidentId: result.incidentId,
      });
    }

    if (action === 'log') {
      const { type, agent, msg, level, meta } = body;
      if (!agent || !msg) {
        return NextResponse.json({ error: 'Missing agent or msg' }, { status: 400 });
      }
      const newLog = addRuntimeLog({
        type: type || 'AGENT',
        agent,
        msg,
        level,
        meta,
      });
      return NextResponse.json({ success: true, log: newLog });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in console logs POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
