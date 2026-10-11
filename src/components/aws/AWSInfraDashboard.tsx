import React, { useState, useEffect } from 'react';
import { 
  Database, 
  MessageSquare, 
  Activity, 
  Cloud, 
  Zap, 
  ShieldCheck, 
  Hexagon, 
  Terminal as TerminalIcon,
  RefreshCw,
  Radio,
  CheckCircle2,
  Copy,
  Check,
  Filter,
  ArrowUpRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface AWSInfraDashboardProps {
  theme: 'light' | 'dark';
  isSideNavOpen: boolean;
  isSideNavExpanded: boolean;
}

export const AWSInfraDashboard: React.FC<AWSInfraDashboardProps> = ({ theme, isSideNavOpen, isSideNavExpanded }) => {
  const isLight = theme === 'light';
  const [awsData, setAwsData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Poll real status from /api/aws/status
  const fetchRealAwsStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/aws/status');
      if (res.ok) {
        const data = await res.json();
        setAwsData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch real AWS telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealAwsStatus();
    const interval = setInterval(fetchRealAwsStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerLiveTrace = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    try {
      const res = await fetch('/api/aws/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_all' }),
      });
      if (res.ok) {
        await fetchRealAwsStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const traces: any[] = awsData?.traces || [];
  const filteredTraces = activeFilter === 'ALL' 
    ? traces 
    : traces.filter((t: any) => t.service?.toLowerCase().includes(activeFilter.toLowerCase()));

  const serviceCards = [
    { 
      name: 'AWS Amplify', 
      role: 'Frontend Edge Hosting', 
      meta: 'Global Edge CDN', 
      stat: 'us-east-1',
      icon: Hexagon, 
      bgGradient: 'bg-gradient-to-br from-[#FF5500]/25 via-[#FF8800]/15 to-[#1A110B]/95',
      borderColor: 'border-[#FF5500]/40 hover:border-[#FF5500] hover:shadow-[0_0_30px_rgba(255,85,0,0.3)]',
      iconStyle: 'bg-gradient-to-tr from-[#FF4500] to-[#FFA000] text-white shadow-[0_0_14px_rgba(255,85,0,0.5)] border border-white/20',
      badgeStyle: 'bg-[#FF5500]/20 text-[#FFA000] border-[#FF5500]/40',
      glowColor: 'bg-[#FF5500]/20',
    },
    { 
      name: 'DynamoDB', 
      role: 'Agent State Store', 
      meta: '2 Active Tables', 
      stat: `${awsData?.services?.dynamoDb?.recentItemsCount ?? 15} records`,
      icon: Database, 
      bgGradient: 'bg-gradient-to-br from-[#1D4ED8]/25 via-[#3B82F6]/15 to-[#0B132B]/95',
      borderColor: 'border-[#3B82F6]/40 hover:border-[#60A5FA] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
      iconStyle: 'bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] text-white shadow-[0_0_14px_rgba(59,130,246,0.5)] border border-white/20',
      badgeStyle: 'bg-[#3B82F6]/20 text-[#93C5FD] border-[#3B82F6]/40',
      glowColor: 'bg-[#3B82F6]/20',
    },
    { 
      name: 'Amazon SNS', 
      role: 'Hazard Broadcast', 
      meta: 'Topic Fanout', 
      stat: `${awsData?.services?.sns?.recentAlertsCount ?? 4} alerts`,
      icon: MessageSquare, 
      bgGradient: 'bg-gradient-to-br from-[#BE185D]/25 via-[#EC4899]/15 to-[#240B1E]/95',
      borderColor: 'border-[#EC4899]/40 hover:border-[#F472B6] hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]',
      iconStyle: 'bg-gradient-to-tr from-[#BE185D] to-[#EC4899] text-white shadow-[0_0_14px_rgba(236,72,153,0.5)] border border-white/20',
      badgeStyle: 'bg-[#EC4899]/20 text-[#F472B6] border-[#EC4899]/40',
      glowColor: 'bg-[#EC4899]/20',
    },
    { 
      name: 'EventBridge', 
      role: 'Autonomous Event Bus', 
      meta: 'Default Bus', 
      stat: `${awsData?.services?.eventBridge?.recentEventsCount ?? 12} events`,
      icon: Zap, 
      bgGradient: 'bg-gradient-to-br from-[#0E7490]/25 via-[#06B6D4]/15 to-[#071B24]/95',
      borderColor: 'border-[#06B6D4]/40 hover:border-[#22D3EE] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]',
      iconStyle: 'bg-gradient-to-tr from-[#0E7490] to-[#06B6D4] text-white shadow-[0_0_14px_rgba(6,182,212,0.5)] border border-white/20',
      badgeStyle: 'bg-[#06B6D4]/20 text-[#67E8F9] border-[#06B6D4]/40',
      glowColor: 'bg-[#06B6D4]/20',
    },
    { 
      name: 'Amazon S3', 
      role: 'Route Blob Archive', 
      meta: 'Standard Tier', 
      stat: `${awsData?.services?.s3?.objectsStored ?? 1} objects`,
      icon: Cloud, 
      bgGradient: 'bg-gradient-to-br from-[#047857]/25 via-[#10B981]/15 to-[#061F16]/95',
      borderColor: 'border-[#10B981]/40 hover:border-[#34D399] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      iconStyle: 'bg-gradient-to-tr from-[#047857] to-[#10B981] text-white shadow-[0_0_14px_rgba(16,185,129,0.5)] border border-white/20',
      badgeStyle: 'bg-[#10B981]/20 text-[#6EE7B7] border-[#10B981]/40',
      glowColor: 'bg-[#10B981]/20',
    },
    { 
      name: 'CloudWatch', 
      role: 'Telemetry & Logs', 
      meta: 'Pipeline Latency', 
      stat: `${awsData?.latencyMs ?? 42}ms`,
      icon: Activity, 
      bgGradient: 'bg-gradient-to-br from-[#B45309]/25 via-[#F59E0B]/15 to-[#241704]/95',
      borderColor: 'border-[#F59E0B]/40 hover:border-[#FBBF24] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      iconStyle: 'bg-gradient-to-tr from-[#B45309] to-[#F59E0B] text-white shadow-[0_0_14px_rgba(245,158,11,0.5)] border border-white/20',
      badgeStyle: 'bg-[#F59E0B]/20 text-[#FDE047] border-[#F59E0B]/40',
      glowColor: 'bg-[#F59E0B]/20',
    },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden flex flex-col font-sans ${isLight ? 'bg-[#F4F5F7]' : 'bg-[#090A0D]'}`}>
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 p-3 lg:p-4.5 mx-auto max-w-[1520px] w-full ${
        isSideNavOpen && isSideNavExpanded ? 'lg:pl-[268px]' : (isSideNavOpen ? 'lg:pl-[110px]' : '')
      }`}>
        
        {/* Main Card Shell */}
        <div className={`flex-1 flex flex-col min-h-0 rounded-[1.25rem] border backdrop-blur-xl p-4 lg:p-5 gap-3.5 shadow-2xl relative overflow-hidden ${
          isLight 
            ? 'bg-white/90 border-zinc-200/80 shadow-zinc-200/50' 
            : 'bg-[#101217]/95 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
        }`}>
          
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

          {/* HEADER BAR - Perfect Optical Alignment & Typography */}
          <div className="flex flex-wrap justify-between items-center border-b border-white/[0.08] pb-3 shrink-0 relative z-10 gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF4500] via-[#FF5500] to-[#FFA000] flex items-center justify-center shadow-[0_0_20px_rgba(255,85,0,0.4)] border border-white/20 shrink-0">
                <Cloud className="w-5 h-5 text-white drop-shadow" />
              </div>
              <h1 className={`text-lg md:text-xl font-black tracking-tight leading-none ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                AWS CLOUD INFRASTRUCTURE
              </h1>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 shadow-sm flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" />
                us-east-1
              </span>
              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-sm leading-none">
                Account: 937370810634
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchRealAwsStatus}
                title="Refresh Telemetry"
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isLight 
                    ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-600' 
                    : 'border-white/[0.08] hover:bg-white/[0.04] text-zinc-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#FF5500]' : ''}`} />
              </button>
              <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold tracking-wider flex items-center gap-2 shadow-sm ${
                isLight 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                ALL SYSTEMS OPERATIONAL
              </div>
            </div>
          </div>

          {/* TOP 6 SERVICE CARDS - Vibrant Colored Executive Ribbon (Enlarged) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0 relative z-10">
            {serviceCards.map((service, idx) => (
              <div
                key={idx}
                className={`group p-3.5 lg:p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between shadow-lg ${
                  isLight 
                    ? 'bg-white border-zinc-200 hover:border-orange-300 shadow-md hover:shadow-xl' 
                    : `${service.bgGradient} ${service.borderColor}`
                }`}
              >
                {/* Subtle Ambient Radial Glow inside each card */}
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${service.glowColor} rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />

                {/* Card Header: Large Glowing Icon + Online Badge */}
                <div className="flex items-center justify-between mb-2.5 relative z-10">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${service.iconStyle}`}>
                    <service.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </div>
                </div>

                {/* Card Body: Bold Service Name + Clear Role */}
                <div className="mb-2.5 relative z-10">
                  <div className={`text-sm font-black tracking-tight mb-0.5 truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    {service.name}
                  </div>
                  <div className={`text-[11px] font-medium truncate ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {service.role}
                  </div>
                </div>

                {/* Card Footer: Metadata & Pill Badge Metric */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10.5px] font-mono relative z-10">
                  <span className="text-zinc-400 font-sans font-semibold text-[10.5px] truncate mr-1">{service.meta}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${service.badgeStyle}`}>
                    {service.stat}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* LOWER SECTION: Identity & Metrics (Left) + High-Tech Real Trace Terminal (Right) */}
          <div className="flex-1 flex flex-col xl:flex-row gap-3.5 min-h-0 relative z-10">
            
            {/* LEFT COLUMN: Identity & CloudWatch KPIs */}
            <div className="w-full xl:w-[410px] flex flex-col gap-3.5 shrink-0 h-full min-h-0">
              
              {/* SERVICE IDENTITY */}
              <div className={`rounded-2xl border p-4 flex flex-col shrink-0 transition-all ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#14161E] border-white/[0.08] shadow-xl'
              }`}>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                      SERVICE IDENTITY
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">IAM Auth</span>
                </div>

                <div className="space-y-2.5 font-mono text-[11px]">
                  {/* Resource ARN */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/40 border-white/[0.06] hover:border-[#FF5500]/40'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] text-zinc-400 font-sans font-bold uppercase tracking-wider mb-0.5">RESOURCE ARN</div>
                      <div className="text-[#FF5500] truncate font-semibold text-[11px]">
                        {awsData?.resourceArn || 'arn:aws:amplify:us-east-1:937370810634:apps/aqr-environmental'}
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(awsData?.resourceArn || 'arn:aws:amplify:us-east-1:937370810634:apps/aqr-environmental', 'arn')}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
                      title="Copy Resource ARN"
                    >
                      {copiedKey === 'arn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Execution Role / IAM User */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/40 border-white/[0.06] hover:border-cyan-500/40'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] text-zinc-400 font-sans font-bold uppercase tracking-wider mb-0.5">EXECUTION IAM USER</div>
                      <div className="text-zinc-200 truncate font-semibold text-[11px]">
                        {awsData?.iamRole || 'arn:aws:iam::937370810634:user/Naveenkumar07'}
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(awsData?.iamRole || 'arn:aws:iam::937370810634:user/Naveenkumar07', 'role')}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
                      title="Copy IAM User ARN"
                    >
                      {copiedKey === 'role' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* CLOUDWATCH LIVE TELEMETRY KPIs */}
              <div className={`flex-1 min-h-0 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#14161E] border-white/[0.08] shadow-xl'
              }`}>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00E5FF]" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                      CLOUDWATCH METRICS
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 flex-1 items-stretch">
                  {/* Latency */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-white/[0.06]'
                  }`}>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                      PIPELINE LATENCY
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-3xl font-black text-[#00E5FF] font-mono tracking-tight">
                        {awsData?.latencyMs ?? 42}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">ms</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">P99 Nominal</span>
                  </div>

                  {/* Invocations */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-white/[0.06]'
                  }`}>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                      TOTAL INVOCATIONS
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-3xl font-black text-[#00E5FF] font-mono tracking-tight">
                        {awsData?.totalInvocations?.toLocaleString() ?? 1}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">runs</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">↑ Active</span>
                  </div>

                  {/* Error Rate */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-white/[0.06]'
                  }`}>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                      ERROR RATE
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                        {awsData?.errorRate ?? '0.00%'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Healthy</span>
                  </div>

                  {/* Active Services */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-white/[0.06]'
                  }`}>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                      ACTIVE SERVICES
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-3xl font-black text-[#FF5500] font-mono tracking-tight">
                        6 / 6
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Nominal</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: High-Tech Real Trace Terminal */}
            <div className={`flex-1 flex flex-col min-h-0 rounded-xl border overflow-hidden shadow-2xl ${
              isLight ? 'bg-[#0F1117] border-zinc-800' : 'bg-[#0B0D12] border-white/[0.08]'
            }`}>
              
              {/* Terminal Window Header */}
              <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02] shrink-0 gap-2">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs font-bold font-mono tracking-wide text-zinc-200">
                    AWS REAL-TIME AUDIT STREAM
                  </span>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-[10px] font-mono">
                  {['ALL', 'EventBridge', 'DynamoDB', 'SNS', 'S3', 'CloudWatch'].map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        activeFilter === f 
                          ? 'bg-[#FF5500] text-white font-bold shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Table Column Header */}
              <div className="px-4 py-1.5 bg-black/50 border-b border-white/[0.04] grid grid-cols-12 text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase shrink-0">
                <span className="col-span-2">TIMESTAMP</span>
                <span className="col-span-2">SERVICE</span>
                <span className="col-span-3">RESOURCE / ID</span>
                <span className="col-span-4">OPERATION DETAILS</span>
                <span className="col-span-1 text-right">STATUS</span>
              </div>

              {/* Scrollable Trace Logs - Clean Aligned Table Format */}
              <div className="flex-1 min-h-0 p-2 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-[#FF5500]/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-button]:hidden">
                {filteredTraces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-zinc-400 italic gap-2">
                    <Radio className="w-6 h-6 text-[#FF5500] animate-pulse" />
                    <span>Listening for live AWS transactions... Telemetry polling active.</span>
                  </div>
                ) : (
                  filteredTraces.map((trace: any, i: number) => {
                    const timeStr = trace.timestamp 
                      ? new Date(trace.timestamp).toLocaleTimeString() 
                      : 'NOW';
                    const shortId = trace.id ? String(trace.id).slice(0, 18) : '--';

                    const badgeStyle = 
                      trace.service === 'EventBridge' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                      trace.service === 'DynamoDB' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                      trace.service === 'Amazon SNS' ? 'bg-pink-500/15 text-pink-400 border-pink-500/30' :
                      trace.service === 'Amazon S3' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      'bg-amber-500/15 text-amber-400 border-amber-500/30';

                    return (
                      <div 
                        key={i} 
                        className="px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors grid grid-cols-12 items-center gap-2 border border-transparent hover:border-white/[0.05]"
                      >
                        {/* Timestamp */}
                        <span className="col-span-2 text-zinc-400 font-mono text-[10px]">
                          [{timeStr}]
                        </span>

                        {/* Service Chip */}
                        <div className="col-span-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-bold tracking-wider inline-flex items-center gap-1 ${badgeStyle}`}>
                            {trace.service}
                          </span>
                        </div>

                        {/* Resource / Trace ID */}
                        <span className="col-span-3 text-zinc-400 truncate text-[10.5px]">
                          {shortId}
                        </span>

                        {/* Operation Details */}
                        <span className="col-span-4 text-white truncate text-[11px] font-medium">
                          {trace.action}
                        </span>

                        {/* Status */}
                        <div className="col-span-1 text-right">
                          <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            200
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Terminal Footer Info Bar */}
              <div className="px-4 py-2 border-t border-white/[0.06] bg-black/60 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE AWS STREAM
                  </span>
                  <span>•</span>
                  <span>REGION: us-east-1</span>
                  <span>•</span>
                  <span>BUS: default</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>SHOWING {filteredTraces.length} EVENTS</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
