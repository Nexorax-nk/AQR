import React, { useState } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, Wind, MapPin, Activity, Flame, ChevronRight, X, Navigation, Bell, MessageSquare, Thermometer, Droplets, Eye, ShieldAlert, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ZonesDashboardProps {
  theme: 'light' | 'dark';
  isSideNavOpen: boolean;
  isSideNavExpanded: boolean;
}

// mockZones removed since we now fetch live data

import { getCityRiskZones } from '@/lib/api-aqi';

const trendData = [
  { time: '6 AM', aqi: 150 },
  { time: '9 AM', aqi: 180 },
  { time: '12 PM', aqi: 195 },
  { time: '3 PM', aqi: 220 },
  { time: '6 PM', aqi: 238 },
];

export const ZonesDashboard: React.FC<ZonesDashboardProps> = ({ theme, isSideNavOpen, isSideNavExpanded }) => {
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('LIVE');
  const [activeLayer, setActiveLayer] = useState('AQI');

  React.useEffect(() => {
    // Fetch live risk zones across Tamil Nadu
    getCityRiskZones().then(data => {
      setZones(data);
      if (data.length > 0) setSelectedZoneId(data[0].id);
    });
  }, []);

  const isLight = theme === 'light';
  const selectedZone = zones.find(z => z.id === selectedZoneId);

  const mapStyle = isLight
    ? { version: 8, sources: { esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 } }, layers: [{ id: 'esri', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 19 }] }
    : { version: 8, sources: { esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 } }, layers: [{ id: 'esri', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 19 }] };

  const bgClass = isLight ? 'bg-[#FAFAFA]' : 'bg-[#030305]';
  const cardClass = isLight 
    ? 'bg-white border-zinc-200 shadow-sm' 
    : 'bg-[#16161A] border-white/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.12)]';
  const textPrimary = isLight ? 'text-zinc-900' : 'text-zinc-100';
  const textSecondary = isLight ? 'text-zinc-500' : 'text-zinc-400';
  const textMuted = isLight ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`absolute inset-0 overflow-hidden flex flex-col ${bgClass} font-sans transition-all duration-300 ${
      isSideNavOpen && isSideNavExpanded ? 'lg:pl-[268px]' : (isSideNavOpen ? 'lg:pl-[110px]' : '')
    }`}>
      <div className={`flex-1 flex flex-col p-6 lg:p-8 mx-auto w-full max-w-[1600px] h-full`}>
        
        {/* HEADER & TOP BAR */}
        <div className="flex items-end justify-between shrink-0 mb-6 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="relative flex items-center justify-center w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                  <div className="relative rounded-full w-1.5 h-1.5 bg-red-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Live Updates</span>
              </div>
            </div>
            <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${textPrimary}`}>
              Risk Zones <span className="opacity-40">Command Center</span>
            </h1>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#16161A] border-white/[0.06] shadow-sm'}`}>
              {['Live', '1H', '6H', '24H'].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t.toUpperCase())}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    timeFilter === t.toUpperCase()
                      ? isLight ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-white'
                      : isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 mb-6">
          {[
            { title: 'CRITICAL ZONES', val: zones.filter(z => z.aqi > 200).length.toString().padStart(2, '0'), sub: 'AQI > 200', trend: 'Live', color: 'text-rose-500', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.1)]', icon: ShieldAlert },
            { title: 'HIGH POLLUTION', val: zones.filter(z => z.aqi > 150 && z.aqi <= 200).length.toString().padStart(2, '0'), sub: 'AQI 150-200', trend: 'Live', color: 'text-orange-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.1)]', icon: AlertCircle },
            { title: 'MODERATE ZONES', val: zones.filter(z => z.aqi > 100 && z.aqi <= 150).length.toString().padStart(2, '0'), sub: 'AQI 100-150', trend: 'Live', color: 'text-yellow-500', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.1)]', icon: Zap },
            { title: 'SAFE ZONES', val: zones.filter(z => z.aqi <= 100).length.toString().padStart(2, '0'), sub: 'AQI < 100', trend: 'Live', color: 'text-emerald-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]', icon: Wind }
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-[1.5rem] border flex flex-col justify-between ${cardClass}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>
                  {stat.title}
                </span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="flex items-end justify-between">
                <div className={`text-4xl font-bold tracking-tighter ${textPrimary}`}>
                  {stat.val}
                </div>
                <div className={`flex flex-col items-end`}>
                   <span className={`text-xs font-bold ${stat.color}`}>{stat.trend}</span>
                   <span className={`text-[10px] font-semibold mt-1 ${textMuted}`}>{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN SPLIT AREA - FILL REMAINING HEIGHT */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* MAIN MAP AREA */}
          <div className={`flex-1 rounded-[1.5rem] border overflow-hidden relative flex flex-col ${cardClass}`}>
            {/* Map Layers overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['AQI'].map(layer => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg backdrop-blur-md ${
                    activeLayer === layer
                      ? 'bg-zinc-900 text-white border border-transparent'
                      : isLight ? 'bg-white/90 border border-zinc-200 text-zinc-600 hover:bg-zinc-50' : 'bg-[#16161A]/80 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>

            <Map
              initialViewState={{ longitude: 78.6, latitude: 10.8, zoom: 6.2 }}
              mapStyle={mapStyle as any}
              style={{ width: '100%', height: '100%' }}
            >
              {zones.map(zone => (
                <Marker key={zone.id} longitude={zone.lng} latitude={zone.lat} anchor="center">
                  <button 
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform ${selectedZoneId === zone.id ? 'ring-4' : ''}`}
                    style={{ backgroundColor: zone.color, boxShadow: `0 0 20px ${zone.color}66` }}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {zone.name} AQI {zone.aqi}
                  </button>
                </Marker>
              ))}
            </Map>
          </div>

          {/* ZONES LIST / EXPLORER */}
          <div className={`w-full lg:w-[420px] rounded-[1.5rem] border flex flex-col overflow-hidden shrink-0 ${cardClass}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-zinc-200' : 'border-white/[0.06]'}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest ${textPrimary}`}>Directory</h2>
              <span className={`text-[10px] font-semibold ${textSecondary}`}>SORT BY: AQI</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedZoneId === zone.id
                      ? isLight ? 'border-rose-300 bg-rose-50 shadow-md' : 'border-rose-500/30 bg-rose-500/10 shadow-lg'
                      : isLight ? 'border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50' : 'border-white/[0.04] hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: zone.color }} />
                      <span className={`font-bold text-sm ${textPrimary}`}>{zone.name}</span>
                    </div>
                    <span className="font-bold text-base" style={{ color: zone.color }}>{zone.aqi} <span className={`text-[10px] font-medium opacity-60`}>AQI</span></span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <div className={`text-[10px] font-bold tracking-widest uppercase ${textSecondary}`}>{zone.type}</div>
                      <div className={`text-xs font-semibold ${textMuted}`}>PM2.5: {zone.pm25} μg/m³</div>
                    </div>
                    <div className="text-[11px] font-bold px-2 py-1 rounded bg-black/20" style={{ color: zone.color }}>{zone.trend}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ZONE DETAILS DRAWER (Overlay on the right) */}
      {selectedZone && (
        <div className="absolute inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedZoneId(null)} />
          <div className={`w-full max-w-md h-full shadow-2xl flex flex-col transition-transform transform translate-x-0 border-l ${
            isLight ? 'bg-white border-zinc-200' : 'bg-[#0B0C0E]/95 backdrop-blur-2xl border-white/10'
          }`}>
            <div className={`p-6 border-b flex justify-between items-start ${isLight ? 'border-zinc-200' : 'border-white/10'}`}>
              <div>
                <h2 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{selectedZone.name}</h2>
                <div className="text-[10px] font-bold tracking-widest uppercase mt-1.5 px-2 py-0.5 rounded inline-block bg-white/5" style={{ color: selectedZone.color }}>
                  {selectedZone.type} ZONE
                </div>
              </div>
              <button onClick={() => setSelectedZoneId(null)} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-zinc-100' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* AQI Overview */}
              <div className="flex items-center gap-8">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4" style={{ borderColor: selectedZone.color }}>
                  <div className="absolute inset-0 rounded-full opacity-20 blur-md" style={{ backgroundColor: selectedZone.color }} />
                  <span className={`text-4xl font-bold tracking-tighter ${textPrimary}`}>{selectedZone.aqi}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-y-4">
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>PM2.5</div>
                    <div className={`text-lg font-bold tracking-tight ${textPrimary}`}>{selectedZone.pm25} <span className="text-[10px] font-medium opacity-50 tracking-normal">μg/m³</span></div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Trend</div>
                    <div className="text-sm font-bold mt-1" style={{ color: selectedZone.color }}>{selectedZone.trend}</div>
                  </div>
                </div>
              </div>

              {/* AQR Analysis */}
              <div>
                <h3 className={`text-[10px] font-bold mb-3 uppercase tracking-widest ${textSecondary}`}>AI Assessment</h3>
                <div className={`p-4 rounded-2xl border text-sm font-medium leading-relaxed ${
                  isLight ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 'bg-blue-900/10 border-blue-900/30 text-blue-100'
                }`}>
                  {selectedZone.desc}
                </div>
              </div>

              {/* Trend Chart */}
              <div className={`p-6 rounded-[1.5rem] border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#16161A] border-white/[0.06]'}`}>
                <h3 className={`text-[10px] font-bold mb-4 uppercase tracking-widest flex justify-between items-center ${textSecondary}`}>
                  AQI TREND <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-sm">24H</span>
                </h3>
                <div className="h-[140px] w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorZone" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedZone.color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={selectedZone.color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isLight ? '#9CA3AF' : '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isLight ? '#9CA3AF' : '#6B7280' }} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: isLight ? '#fff' : '#1A1C21', border: 'none', borderRadius: '12px' }} itemStyle={{ color: selectedZone.color, fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="aqi" stroke={selectedZone.color} strokeWidth={3} fillOpacity={1} fill="url(#colorZone)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
