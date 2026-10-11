import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Clock, 
  Activity, 
  Terminal as TerminalIcon, 
  Database, 
  Zap, 
  Cloud, 
  Bell, 
  Layers, 
  FolderGit2, 
  CheckCircle2, 
  Radio, 
  Server
} from 'lucide-react';

interface AgentsDashboardProps {
  theme: 'light' | 'dark';
  isSideNavOpen: boolean;
  isSideNavExpanded: boolean;
}

const AGENTS = [
  { id: 'air-intel', name: 'Air Intelligence', status: 'ACTIVE' },
  { id: 'weather', name: 'Weather & Forecast', status: 'STANDBY' },
  { id: 'geo-intel', name: 'Geo Intelligence', status: 'STANDBY' },
  { id: 'route', name: 'Route Optimizer', status: 'STANDBY' },
  { id: 'air-advisor', name: 'Air Advisor', status: 'STANDBY' },
];

export const AgentsDashboard: React.FC<AgentsDashboardProps> = ({ theme, isSideNavOpen, isSideNavExpanded }) => {
  const [activeAgent, setActiveAgent] = useState('none');
  const [logs, setLogs] = useState<{timestamp: string, message: string, color: string}[]>([]);
  const [memory, setMemory] = useState<any>({});
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [telemetry, setTelemetry] = useState({ tokens: 0, latency: 0 });
  const [awsStatus, setAwsStatus] = useState<any>(null);
  const [isTestingAws, setIsTestingAws] = useState(false);
  const isLight = theme === 'light';
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load AWS Status on mount
  useEffect(() => {
    fetchAwsStatus();
  }, []);

  const fetchAwsStatus = async () => {
    try {
      const res = await fetch('/api/aws/status');
      if (res.ok) {
        const data = await res.json();
        setAwsStatus(data);
      }
    } catch (e) {
      console.warn('Failed to fetch AWS status', e);
    }
  };

  const testAwsPipeline = async () => {
    if (isTestingAws) return;
    setIsTestingAws(true);
    try {
      const res = await fetch('/api/aws/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_all' }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAwsStatus();
        setLogs(prev => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `[AWS Pipeline Diagnostic] Dispatched test across all 5 services: DynamoDB, SNS, EventBridge, S3, CloudWatch.`,
            color: 'text-cyan-400 font-bold',
          },
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `[AWS Response] EventBridge ID: ${data.results?.eventBridge?.eventId?.slice(0, 16)}... | S3: ${data.results?.s3?.key}`,
            color: 'text-emerald-400',
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingAws(false);
    }
  };

  const startTask = async () => {
    if (!taskInput.trim() || isProcessing) return;
    setIsProcessing(true);
    setLogs([]);
    setMemory({});
    setTelemetry({ tokens: 0, latency: 0 });
    setActiveAgent('none');

    try {
      const res = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput }),
      });

      if (!res.body) {
        setIsProcessing(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('event: ')) continue;
          
          const eventMatch = line.match(/event: (.*)\n/);
          const dataMatch = line.match(/data: (.*)/);
          
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            if (eventType === 'log') {
              setLogs((prev: {timestamp: string, message: string, color: string}[]) => [...prev, data]);
            } else if (eventType === 'memory') {
              setMemory((prev: any) => ({ ...prev, ...data }));
            } else if (eventType === 'agent') {
              setActiveAgent(data.active);
            } else if (eventType === 'telemetry') {
              setTelemetry((prev: {tokens: number, latency: number}) => ({
                tokens: prev.tokens + data.tokens,
                latency: prev.latency + data.latency
              }));
            } else if (eventType === 'done') {
              setIsProcessing(false);
              fetchAwsStatus(); // Refresh AWS metrics
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const currentAgentName = AGENTS.find(a => a.id === activeAgent)?.name || '';

  const bgClass = isLight ? 'bg-[#FAFAFA]' : 'bg-[#030305]';
  const cardClass = isLight 
    ? 'bg-white border-zinc-200 shadow-sm' 
    : 'bg-[#16161A] border-white/[0.06] shadow-xl';
  const textPrimary = isLight ? 'text-zinc-900' : 'text-zinc-100';
  const textSecondary = isLight ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div className={`absolute inset-0 overflow-hidden flex flex-col ${bgClass} transition-all duration-300 font-sans ${
      isSideNavOpen && isSideNavExpanded ? 'lg:pl-[268px]' : (isSideNavOpen ? 'lg:pl-[110px]' : '')
    }`}>
      <div className="flex-1 flex flex-col p-6 lg:p-8 mx-auto max-w-[1400px] w-full h-full">
        
        {/* AWS CLOUD INFRASTRUCTURE BAR */}
        <div className={`mb-6 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
          isLight ? 'bg-orange-50/50 border-orange-200' : 'bg-[#121318] border-white/10 shadow-lg'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>AWS CLOUD INFRASTRUCTURE</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {awsStatus?.region || 'us-east-1'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
                  5 SERVICES ACTIVE
                </span>
              </div>
              <p className={`text-[11px] ${textSecondary}`}>
                DynamoDB (State) • SNS (Hazards) • EventBridge (Bus) • S3 (Archives) • CloudWatch (Telemetry)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={testAwsPipeline}
              disabled={isTestingAws}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 text-[#FF5500] ${isTestingAws ? 'animate-spin' : ''}`} />
              {isTestingAws ? 'DISPATCHING PING...' : 'RUN AWS PIPELINE PING'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
          
          {/* LEFT SIDEBAR: AGENT ROSTER */}
          <div className={`w-full xl:w-[320px] rounded-[1.5rem] border flex flex-col shrink-0 ${cardClass}`}>
            <div className={`p-6 flex justify-between items-center border-b ${isLight ? 'border-zinc-200' : 'border-white/[0.06]'}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>AGENT ROSTER</h2>
              <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 tracking-wider">
                1 ACTIVE
              </div>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto scrollbar-hide">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgent(agent.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    activeAgent === agent.id
                      ? isLight ? 'bg-orange-50 border-orange-200 shadow-md' : 'bg-[#FF5500]/10 border-[#FF5500]/30 shadow-lg'
                      : isLight ? 'bg-white border-transparent hover:border-zinc-200' : 'bg-[#16161A] border-transparent hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Cpu className={`w-4 h-4 ${activeAgent === agent.id ? 'text-[#FF5500]' : textSecondary}`} />
                    <span className={`text-sm font-bold ${activeAgent === agent.id ? (isLight ? 'text-orange-700' : 'text-[#FF5500]') : textPrimary}`}>
                      {agent.name}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider ${
                    activeAgent === agent.id ? 'text-[#FF5500]' : textSecondary
                  }`}>
                    {agent.status === 'STANDBY' && <Clock className="w-3 h-3" />}
                    {agent.status}
                  </div>
                </button>
              ))}

              {/* AWS CLOUD STACK STATUS MINI-CARDS */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">
                  AWS INFRASTRUCTURE
                </div>
                {[
                  { icon: Database, name: 'DynamoDB', desc: 'AQR_Incidents & Tel', color: 'text-blue-400' },
                  { icon: Bell, name: 'Amazon SNS', desc: 'School Hazard Push', color: 'text-pink-400' },
                  { icon: Layers, name: 'EventBridge', desc: 'aqr.multiagent bus', color: 'text-cyan-400' },
                  { icon: FolderGit2, name: 'Amazon S3', desc: 'aqr-route-archives', color: 'text-emerald-400' },
                  { icon: Activity, name: 'CloudWatch', desc: 'AQR/MAS Latency & Tok', color: 'text-yellow-400' },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                      <span className="font-semibold text-zinc-200">{s.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIVE DIRECTIVE PANEL */}
            <div className={`m-4 p-5 rounded-2xl border relative overflow-hidden group ${
              isLight 
                ? 'bg-zinc-50 border-orange-200 shadow-md' 
                : 'bg-gradient-to-b from-[#1C120C] to-[#0A0705] border-[#FF5500]/30 shadow-[0_0_20px_rgba(255,85,0,0.1)]'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#FF5500] animate-pulse" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5500]">ACTIVE DIRECTIVE</h3>
                </div>
                <div className={`text-sm font-black tracking-wide mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  AIR QUALITY ROUTING
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-[9px] font-black bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 tracking-widest mb-3">
                  INCIDENT: AQR-9042
                </div>
                
                {/* Audio Visualizer */}
                <div className="flex items-end gap-1.5 h-6">
                  {[12, 6, 20, 10, 24, 16, 26, 20, 14, 8, 22, 12].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-[#FF5500] rounded-t-sm animate-audio-bounce" 
                      style={{ 
                        height: `${h}px`, 
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: `${0.8 + (Math.random() * 0.4)}s`
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: TERMINAL & MEMORY */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            
            {/* TOP BAR BADGES */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Cpu, label: 'Model', val: 'Qwen 3.8-27B' },
                { icon: Zap, label: 'Latency', val: telemetry.latency > 0 ? `${telemetry.latency}ms` : '--' },
                { icon: Database, label: 'Tokens', val: telemetry.tokens > 0 ? telemetry.tokens.toLocaleString() : '--' },
                { icon: Server, label: 'AWS State', val: 'Connected (us-east-1)' },
              ].map((badge, idx) => (
                <div key={idx} className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${cardClass}`}>
                  <badge.icon className="w-4 h-4 text-[#FF5500]" />
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${textSecondary}`}>
                    {badge.label}: <span className={textPrimary}>{badge.val}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* LIVE TERMINAL */}
            <div className={`flex-[2] rounded-[1.5rem] border flex flex-col overflow-hidden bg-[#16161A] border-white/[0.06] shadow-xl`}>
              <div className={`p-5 border-b flex items-center justify-between border-white/[0.06] bg-[#16161A]`}>
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    LIVE TERMINAL <span className="opacity-50">({currentAgentName || 'Awaiting Task'})</span>
                  </h3>
                </div>
                {isProcessing && <div className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse shadow-[0_0_8px_rgba(255,85,0,0.8)]" />}
              </div>
              <div className={`flex-1 p-6 overflow-y-auto font-mono text-[11px] sm:text-xs leading-loose space-y-1 bg-[#0B0C0E] text-zinc-300 shadow-inner`}>
                {logs.length === 0 && !isProcessing && (
                  <div className="text-zinc-600 italic">Waiting for MAS trigger... Click 'DISPATCH' or 'RUN AWS PIPELINE PING' above.</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="hover:bg-white/[0.02] px-2 -mx-2 rounded transition-colors flex gap-3">
                    <span className="text-[#FF5500] shrink-0 font-mono">
                      [{log.timestamp}]
                    </span>
                    <span className={log.color}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
              
              {/* TASK INPUT BAR */}
              <div className="p-4 bg-[#16161A] border-t border-white/[0.06] flex gap-3">
                <input 
                  type="text" 
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startTask()}
                  disabled={isProcessing}
                  placeholder="Enter MAS Directive (e.g. Find cleanest route in Chennai or Delhi)"
                  className="flex-1 bg-[#0B0C0E] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF5500]/50 transition-colors disabled:opacity-50"
                />
                <button 
                  onClick={startTask}
                  disabled={isProcessing || !taskInput.trim()}
                  className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E64D00] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,85,0,0.2)]"
                >
                  {isProcessing ? 'EXECUTING...' : 'DISPATCH'}
                </button>
              </div>
            </div>

            {/* SHORT-TERM MEMORY */}
            <div className={`flex-1 rounded-[1.5rem] border flex flex-col overflow-hidden bg-[#16161A] border-white/[0.06] shadow-xl`}>
              <div className={`p-5 border-b flex items-center justify-between border-white/[0.06] bg-[#16161A]`}>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    SHORT-TERM AGENT MEMORY (DYNAMODB CACHE)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Live Sync</span>
              </div>
              <div className={`flex-1 p-6 overflow-y-auto font-mono text-[11px] sm:text-[13px] leading-relaxed bg-[#0B0C0E] text-[#FF5500]/80 shadow-inner`}>
<pre className="m-0 whitespace-pre-wrap">
{Object.keys(memory).length === 0 
  ? "// Shared agent memory is empty. Dispatch a directive to populate state." 
  : JSON.stringify(memory, null, 2)}
</pre>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
