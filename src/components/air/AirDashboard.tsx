import React, { useState, useEffect, useRef } from 'react';
import { 
  Thermometer, Droplets, Wind, Cloud, CloudRain, Eye, 
  Activity, TrendingUp, TrendingDown, Minus, 
  Sparkles, Radio, ChevronRight, X, BarChart3, CloudLightning,
  MapPin, Gauge, ShieldAlert, Factory, Car, Sun, Flame, Hexagon,
  Search, Navigation, LocateFixed, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { AQILocation, Station } from '@/lib/types';

interface AirDashboardProps {
  theme: 'light' | 'dark';
  isSideNavOpen: boolean;
  isSideNavExpanded: boolean;
  location?: AQILocation | null;
  onSearchSubmit?: (query: string) => void;
  onLocate?: () => void;
  isLocating?: boolean;
}

// 24H Trend Data per metric
const trendDataMap: Record<string, { time: string; value: number }[]> = {
  AQI: [
    { time: '6 AM', value: 80 },
    { time: '9 AM', value: 110 },
    { time: '12 PM', value: 145 },
    { time: '3 PM', value: 164 },
    { time: '6 PM', value: 172 },
    { time: 'NOW', value: 164 },
  ],
  'PM2.5': [
    { time: '6 AM', value: 42 },
    { time: '9 AM', value: 58 },
    { time: '12 PM', value: 72 },
    { time: '3 PM', value: 82 },
    { time: '6 PM', value: 88 },
    { time: 'NOW', value: 82 },
  ],
  PM10: [
    { time: '6 AM', value: 65 },
    { time: '9 AM', value: 84 },
    { time: '12 PM', value: 105 },
    { time: '3 PM', value: 121 },
    { time: '6 PM', value: 130 },
    { time: 'NOW', value: 121 },
  ],
  'NO₂': [
    { time: '6 AM', value: 25 },
    { time: '9 AM', value: 32 },
    { time: '12 PM', value: 40 },
    { time: '3 PM', value: 48 },
    { time: '6 PM', value: 52 },
    { time: 'NOW', value: 48 },
  ],
  'O₃': [
    { time: '6 AM', value: 30 },
    { time: '9 AM', value: 42 },
    { time: '12 PM', value: 55 },
    { time: '3 PM', value: 62 },
    { time: '6 PM', value: 68 },
    { time: 'NOW', value: 62 },
  ],
};

// 72-Hour Continuous Forecast Dataset
const forecast72hData = [
  { time: 'Tonight', aqi: 168 },
  { time: 'Tomorrow 6 AM', aqi: 112 },
  { time: 'Tomorrow 9 AM', aqi: 86 },
  { time: 'Tomorrow 1 PM', aqi: 104 },
  { time: 'Tomorrow 6 PM', aqi: 157 },
  { time: 'Day 3 6 AM', aqi: 95 },
  { time: 'Day 3 6 PM', aqi: 130 },
];

const pollutants = [
  {
    id: 'PM2.5',
    name: 'Fine Particulates',
    val: '82',
    unit: 'μg/m³',
    trendText: 'High',
    trendType: 'high',
    icon: TrendingUp,
  },
  {
    id: 'PM10',
    name: 'Coarse Dust',
    val: '121',
    unit: 'μg/m³',
    trendText: 'High',
    trendType: 'high',
    icon: TrendingUp,
  },
  {
    id: 'NO₂',
    name: 'Nitrogen Dioxide',
    val: '48',
    unit: 'μg/m³',
    trendText: 'Moderate',
    trendType: 'moderate',
    icon: Minus,
  },
  {
    id: 'O₃',
    name: 'Surface Ozone',
    val: '62',
    unit: 'μg/m³',
    trendText: 'Moderate',
    trendType: 'moderate',
    icon: Minus,
  },
  {
    id: 'CO',
    name: 'Carbon Monoxide',
    val: '0.8',
    unit: 'mg/m³',
    trendText: 'Low',
    trendType: 'low',
    icon: TrendingDown,
  },
  {
    id: 'SO₂',
    name: 'Sulfur Dioxide',
    val: '12',
    unit: 'μg/m³',
    trendText: 'Low',
    trendType: 'low',
    icon: Minus,
  },
];

const stationsList: Station[] = [
  {
    id: 'anna-nagar',
    name: 'Anna Nagar Station',
    aqi: 172,
    pm25: 91,
    pm10: 138,
    no2: 52,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    status: 'Unhealthy',
    distance: '2.4 km',
    source: 'TNPCB Realtime Stream',
    lastUpdate: '2 min ago'
  },
  {
    id: 'manali',
    name: 'Manali Industrial Zone',
    aqi: 192,
    pm25: 104,
    pm10: 165,
    no2: 68,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    status: 'Unhealthy',
    distance: '5.1 km',
    source: 'CPCB Monitoring Station',
    lastUpdate: '4 min ago'
  },
  {
    id: 'guindy',
    name: 'Guindy Tech Park',
    aqi: 112,
    pm25: 58,
    pm10: 92,
    no2: 36,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    status: 'Moderate',
    distance: '7.8 km',
    source: 'IIT Madras Sensor Array',
    lastUpdate: '3 min ago'
  },
  {
    id: 'velachery',
    name: 'Velachery Station',
    aqi: 108,
    pm25: 54,
    pm10: 88,
    no2: 32,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    status: 'Moderate',
    distance: '9.2 km',
    source: 'TNPCB Sensor #04',
    lastUpdate: '5 min ago'
  }
];

export const AirDashboard: React.FC<AirDashboardProps> = ({ theme, isSideNavOpen, isSideNavExpanded, location, onSearchSubmit, onLocate, isLocating }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('AQI');
  const [trendRange, setTrendRange] = useState<'24H' | '72H' | '7D'>('24H');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Search Autocomplete State
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`, { signal: abortController.signal });
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Geocoding error:', err);
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }, 150);

    return () => { clearTimeout(timer); abortController.abort(); };
  }, [query]);

  const handleSelectGeocodedResult = (item: any) => {
    const name = item.properties.name || item.properties.city || item.properties.state || '';
    if (onSearchSubmit && name) {
      onSearchSubmit(name);
    }
    setQuery(name);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const isLight = theme === 'light';

  // Dynamic values from location, fallback to null state if none
  const currentCityName = location?.name || '--';
  const currentAreaName = location?.area || 'Select a location to view data';
  const currentAQI = location?.aqi ?? '--';
  const currentCategory = location ? (location.category || 'good') : 'none';
  const currentPM25 = location?.pm25 ?? 0;
  const currentPM10 = location?.pm10 ?? 0;
  const currentNO2 = location?.no2 ?? 0;
  const currentO3 = location?.o3 ?? 0;
  const currentTemp = location?.temperature ?? '--';
  const currentHumidity = location?.humidity ?? '--';
  const currentWindSpeed = location?.windSpeed ?? '--';
  const currentRainfall = location?.rainfall ?? 0;

  // Re-build pollutants array dynamically
  const dynamicPollutants = [
    {
      id: 'PM2.5',
      name: 'Fine Particulates',
      val: currentPM25.toString(),
      unit: 'μg/m³',
      trendText: location ? (currentPM25 > 50 ? 'High' : 'Low') : '--',
      trendType: location ? (currentPM25 > 50 ? 'high' : 'low') : 'none',
      icon: location ? (currentPM25 > 50 ? TrendingUp : TrendingDown) : Minus,
    },
    {
      id: 'PM10',
      name: 'Coarse Dust',
      val: currentPM10.toString(),
      unit: 'μg/m³',
      trendText: location ? (currentPM10 > 100 ? 'High' : 'Moderate') : '--',
      trendType: location ? (currentPM10 > 100 ? 'high' : 'moderate') : 'none',
      icon: location ? (currentPM10 > 100 ? TrendingUp : Minus) : Minus,
    },
    {
      id: 'NO₂',
      name: 'Nitrogen Dioxide',
      val: currentNO2.toString(),
      unit: 'μg/m³',
      trendText: location ? (currentNO2 > 40 ? 'Moderate' : 'Low') : '--',
      trendType: location ? (currentNO2 > 40 ? 'moderate' : 'low') : 'none',
      icon: location ? (currentNO2 > 40 ? Minus : TrendingDown) : Minus,
    },
    {
      id: 'O₃',
      name: 'Surface Ozone',
      val: currentO3.toString(),
      unit: 'μg/m³',
      trendText: location ? (currentO3 > 50 ? 'Moderate' : 'Low') : '--',
      trendType: location ? (currentO3 > 50 ? 'moderate' : 'low') : 'none',
      icon: location ? (currentO3 > 50 ? Minus : TrendingDown) : Minus,
    },
    {
      id: 'CO',
      name: 'Carbon Monoxide',
      val: location ? '0.8' : '--',
      unit: 'mg/m³',
      trendText: location ? 'Low' : '--',
      trendType: location ? 'low' : 'none',
      icon: location ? TrendingDown : Minus,
    },
    {
      id: 'SO₂',
      name: 'Sulfur Dioxide',
      val: location ? '12' : '--',
      unit: 'μg/m³',
      trendText: location ? 'Low' : '--',
      trendType: location ? 'low' : 'none',
      icon: location ? TrendingDown : Minus,
    },
  ];

  // Current metric trend dataset
  const currentTrendData = location ? (location.trendDataMap?.[selectedMetric] || location.trendDataMap?.['AQI'] || trendDataMap[selectedMetric] || trendDataMap['AQI']) : [];

  // Current forecast dataset
  const currentForecastData = location?.forecastData || forecast72hData;

  // High-end UI Classes
  const bgClass = isLight ? 'bg-[#FAFAFA]' : 'bg-[#030305]';
  const cardClass = isLight 
    ? 'bg-white border-zinc-200 shadow-sm' 
    : 'bg-[#16161A] border-white/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.12)]';
  const textPrimary = isLight ? 'text-zinc-900' : 'text-zinc-100';
  const textSecondary = isLight ? 'text-zinc-500' : 'text-zinc-400';
  const textMuted = isLight ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${bgClass} font-sans transition-all duration-500 ${
      isSideNavOpen && isSideNavExpanded ? 'lg:pl-[268px]' : (isSideNavOpen ? 'lg:pl-[110px]' : '')
    }`}>
      <div 
        className={`min-h-full w-full p-6 lg:p-10 mx-auto max-w-[1440px]`}
      >
        <div className="flex flex-col gap-8">
          
          {/* TOP ACTION BAR */}
          <div className="flex items-center justify-start w-full gap-3">
            {/* Search */}
            <div ref={searchContainerRef} className="relative w-full max-w-[400px]">
              <div className={`flex items-center p-2 rounded-full border shadow-sm backdrop-blur-md w-full transition-all ${isLight ? 'bg-white border-zinc-200 focus-within:border-zinc-300' : 'bg-[#121214] border-white/10 focus-within:border-white/20'}`}>
                <div className={`flex items-center flex-1 px-3 ${textPrimary}`}>
                  <Search className={`w-4 h-4 mr-2 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search city, region, or station..." 
                    className={`bg-transparent border-none outline-none w-full text-sm font-medium ${isLight ? 'placeholder-zinc-400' : 'placeholder-zinc-500'}`}
                    onKeyDown={(e) => {
                      if (!isOpen || searchResults.length === 0) {
                        if (e.key === 'Enter' && onSearchSubmit) {
                          onSearchSubmit(query);
                          setIsOpen(false);
                        }
                        return;
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSelectGeocodedResult(selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0]);
                      }
                    }}
                  />
                  {isLoading && <Loader2 className="w-4 h-4 text-rose-500 animate-spin ml-2" />}
                </div>
              </div>

              {/* Global Geocoding Search Dropdown */}
              {isOpen && searchResults.length > 0 && (
                <div className={`absolute top-[52px] left-0 w-full border rounded-2xl p-2 shadow-[0_25px_60px_rgba(0,0,0,0.65)] space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto no-scrollbar z-50 backdrop-blur-2xl ${
                  isLight 
                    ? 'bg-white border-zinc-200 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.08)]' 
                    : 'bg-[#1A1A1F] border-white/10 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]'
                }`}>
                  <div className="pt-1 pb-1">
                    <div className="px-3 py-2 text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-rose-500" />
                      Search Results
                    </div>
                    
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.properties.osm_id}-${idx}`}
                        onClick={() => handleSelectGeocodedResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group border ${
                          idx === selectedIndex
                            ? (isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#2A2A30] border-white/10')
                            : (isLight
                                ? 'hover:bg-zinc-100 border-transparent hover:border-zinc-200'
                                : 'hover:bg-[#2A2A30] border-transparent hover:border-white/10')
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all ${
                            isLight ? 'bg-rose-50 text-rose-500' : 'bg-[#2A2A30] text-rose-500'
                          }`}>
                            <MapPin className="w-4 h-4 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-[13px] font-bold truncate transition-colors ${isLight ? 'text-slate-900 group-hover:text-rose-500' : 'text-white/95 group-hover:text-white'}`}>
                              {item.properties.name}
                            </div>
                            <div className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                              {[item.properties.city, item.properties.state, item.properties.country].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Separate GPS Button */}
            <button 
              title="Locate Me"
              onClick={() => onLocate && onLocate()}
              disabled={isLocating}
              className={`flex items-center gap-2 px-4 h-10 rounded-full border shadow-sm transition-all font-medium text-sm ${
                isLight 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:shadow-md' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:shadow-lg hover:shadow-rose-500/10'
              } ${isLocating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
            </button>
          </div>

          {/* 1. HERO SECTION */}
          <div className={`relative overflow-hidden p-8 lg:p-10 rounded-[2rem] border transition-all ${
            isLight 
              ? 'bg-white border-zinc-200 shadow-lg' 
              : 'bg-[#16161A] border-white/[0.06] shadow-2xl'
          }`}>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose-500/20 via-orange-500/10 to-transparent rounded-full blur-[100px] pointer-events-none opacity-50" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0 ${isLight ? 'bg-zinc-900 text-white shadow-xl' : 'bg-[#1A1A1E] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-white'}`}>
                    <Activity className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${textPrimary}`}>
                      Air Quality Overview
                    </h1>
                    <div className={`flex items-center gap-2 text-sm mt-1.5 ${textSecondary}`}>
                      <MapPin className="w-3.5 h-3.5" /> {currentCityName} <span className="opacity-50">·</span> Updated {location?.lastUpdated || 'Just Now'}
                    </div>
                  </div>
                </div>

                <p className={`text-sm lg:text-base leading-relaxed max-w-xl ${textSecondary}`}>
                  Particulate concentrations are currently elevated across major monitoring zones. 
                  PM2.5 remains the dominant pollutant contributing to today's air quality status.
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    isLight 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                  }`}>
                    <Activity className="w-4 h-4" />
                    <span>↑ 12% worse than yesterday</span>
                  </div>
                  <button className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    isLight 
                      ? 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200' 
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Health Advisory</span>
                  </button>
                </div>
              </div>

              {/* Right Column AQI Focus */}
              <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
                <div className={`relative flex flex-col items-center justify-center w-48 h-48 rounded-full border shadow-[0_0_50px_rgba(244,63,94,0.15)] backdrop-blur-md ${
                  currentCategory === 'none' ? 'border-zinc-500/30 bg-gradient-to-b from-zinc-500/10 to-transparent' :
                  currentCategory === 'good' ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent' :
                  currentCategory === 'moderate' ? 'border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent' :
                  currentCategory === 'sensitive' ? 'border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-transparent' :
                  currentCategory === 'unhealthy' ? 'border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-transparent' :
                  'border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent'
                }`}>
                  <span className={`text-6xl font-bold tracking-tighter ${textPrimary}`}>
                    {currentAQI}
                  </span>
                  <div className="mt-2 text-center">
                    <span className={`text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full border ${
                      currentCategory === 'none' ? 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' :
                      currentCategory === 'good' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      currentCategory === 'moderate' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                      currentCategory === 'sensitive' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                      currentCategory === 'unhealthy' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                      'text-purple-400 bg-purple-500/10 border-purple-500/20'
                    }`}>
                      {currentCategory === 'none' ? 'No Data' : currentCategory}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>


          {/* 2. PRIMARY POLLUTANTS & 3. AQI TREND */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Primary Pollutants */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className={`text-sm font-semibold tracking-wide ${textPrimary}`}>
                    Primary Pollutants
                  </h2>
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    Select a pollutant to update the telemetry graph
                  </p>
                </div>
              </div>

              <div className={`rounded-[1.5rem] border py-8 px-6 ${cardClass}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-9 gap-x-12">
                  {dynamicPollutants.map((p) => {
                    const isSelected = selectedMetric === p.id;
                    
                    let ringColor = 'text-orange-500';
                    let dotColor = 'bg-orange-500';
                    let glowBg = 'bg-orange-500';
                    let ringOffset = '40'; // strokeDashoffset (100 = empty, 0 = full)
                    
                    if (p.trendType === 'high') {
                      ringColor = 'text-rose-500';
                      dotColor = 'bg-rose-500';
                      glowBg = 'bg-rose-500';
                      ringOffset = '20'; // mostly full ring
                    } else if (p.trendType === 'low') {
                      ringColor = 'text-emerald-500';
                      dotColor = 'bg-emerald-500';
                      glowBg = 'bg-emerald-500';
                      ringOffset = '75'; // small ring
                    }

                    let PollutantIcon = Hexagon;
                    if (p.id === 'PM2.5') PollutantIcon = Wind;
                    if (p.id === 'PM10') PollutantIcon = Factory;
                    if (p.id === 'NO₂') PollutantIcon = Car;
                    if (p.id === 'O₃') PollutantIcon = Sun;
                    if (p.id === 'CO') PollutantIcon = Flame;
                    if (p.id === 'SO₂') PollutantIcon = CloudRain;

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedMetric(p.id)}
                        className={`flex items-center gap-5 text-left group transition-all ${
                          isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* 1. Left: SVG Ring with ID */}
                        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                          {isSelected && (
                            <div className={`absolute inset-0 rounded-full blur-[10px] opacity-30 ${glowBg} transition-opacity`} />
                          )}
                          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                            {/* Background track */}
                            <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" className={isLight ? 'stroke-zinc-200' : 'stroke-white/10'} />
                            {/* Progress ring */}
                            <circle 
                              cx="18" cy="18" r="16" 
                              fill="none" 
                              strokeWidth="2.5" 
                              strokeDasharray="100 100" 
                              strokeDashoffset={ringOffset} 
                              className={`${ringColor} transition-all duration-1000 ease-out`} 
                              stroke="currentColor" 
                            />
                          </svg>
                          <PollutantIcon className={`relative z-10 w-4 h-4 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`} />
                        </div>

                        {/* 2. Center: Title & Value */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${textSecondary}`}>
                            {p.name} ({p.id})
                          </span>
                          
                          <div className="flex items-center justify-between">
                            <div className={`text-[22px] font-bold tracking-tight ${textPrimary}`}>
                              {p.val} <span className={`text-[11px] font-medium tracking-normal ${textMuted}`}>{p.unit}</span>
                            </div>

                            {/* 3. Right: Status Badge (Now on the bottom line) */}
                            <div className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-sm border ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-white/[0.03] border-white/10'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isSelected ? 'animate-pulse' : ''}`} />
                              <span className={`text-[10px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                {p.trendText}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AQI TREND CHART */}
            <div className={`lg:col-span-5 p-6 rounded-[1.5rem] border flex flex-col justify-between ${cardClass}`}>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-zinc-100' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                    <BarChart3 className={`w-4 h-4 ${textPrimary}`} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold tracking-wide ${textPrimary}`}>
                      Telemetry Graph
                    </h2>
                    <p className={`text-xs mt-0.5 ${textSecondary}`}>
                      Historical data for <span className="text-rose-400 font-semibold">{selectedMetric}</span>
                    </p>
                  </div>
                </div>

                <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-black/20 border-white/[0.05]'}`}>
                  {(['24H', '72H', '7D'] as const).map(rng => (
                    <button
                      key={rng}
                      onClick={() => setTrendRange(rng)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        trendRange === rng
                          ? isLight ? 'bg-white shadow text-zinc-900' : 'bg-zinc-800 text-white shadow-md'
                          : isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {rng}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-6 px-1">
                <span className={`text-4xl font-bold tracking-tighter ${textPrimary}`}>
                  {location ? (currentTrendData[currentTrendData.length - 1]?.value || 164) : '--'}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  <Activity className="w-3 h-3" />
                  ↑ 12%
                </span>
              </div>

              <div className="h-[150px] w-full -ml-3 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: isLight ? '#71717a' : '#71717a', fontWeight: 500 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: isLight ? '#71717a' : '#71717a', fontWeight: 500 }} 
                      width={30} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isLight ? '#fff' : '#09090b', 
                        border: isLight ? '1px solid #e4e4e7' : '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)' 
                      }}
                      itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
                      labelStyle={{ color: isLight ? '#71717a' : '#a1a1aa', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f43f5e" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#metricGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>


          {/* 4. ATMOSPHERIC CONDITIONS & 72-HOUR FORECAST GRAPH GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* ATMOSPHERIC CONDITIONS */}
            <div className={`lg:col-span-6 p-6 rounded-[1.5rem] border flex flex-col justify-between ${cardClass}`}>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-zinc-100' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                    <CloudLightning className={`w-4 h-4 ${textPrimary}`} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold tracking-wide ${textPrimary}`}>
                      Atmospheric Conditions
                    </h2>
                    <p className={`text-xs mt-0.5 ${textSecondary}`}>
                      Real-time local meteorology
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6 my-auto pt-4 pb-2">
                <div className="flex flex-col gap-2 border-l-2 border-orange-500/50 pl-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Temperature</span>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    <span className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{location ? `${currentTemp}°C` : '--'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l-2 border-blue-500/50 pl-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Humidity</span>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{location ? `${currentHumidity}%` : '--'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l-2 border-teal-500/50 pl-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Wind Speed</span>
                  <div className="flex items-baseline gap-2">
                    <Wind className="w-4 h-4 text-teal-400 self-center" />
                    <span className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{location ? currentWindSpeed.replace(' Km/h', '') : '--'} {location && <span className="text-[11px] font-medium opacity-60 tracking-normal">km/h</span>}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l-2 border-indigo-500/50 pl-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Condition</span>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-indigo-400" />
                    <span className={`text-xl font-bold tracking-tight truncate ${textPrimary}`}>{location ? (currentRainfall > 0 ? 'Rain' : 'Clear') : '--'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l-2 border-cyan-500/50 pl-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Rainfall</span>
                  <div className="flex items-baseline gap-2">
                    <CloudRain className="w-4 h-4 text-cyan-400 self-center" />
                    <span className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{location ? currentRainfall : '--'} {location && <span className="text-[11px] font-medium opacity-60 tracking-normal">mm</span>}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l-2 border-purple-500/50 pl-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Visibility</span>
                  <div className="flex items-baseline gap-2">
                    <Eye className="w-4 h-4 text-purple-400 self-center" />
                    <span className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{location ? '6.2' : '--'} {location && <span className="text-[11px] font-medium opacity-60 tracking-normal">km</span>}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 72-HOUR AIR FORECAST */}
            <div className={`lg:col-span-6 p-6 rounded-[1.5rem] border flex flex-col justify-between ${cardClass}`}>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-zinc-100' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                    <Gauge className={`w-4 h-4 ${textPrimary}`} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold tracking-wide ${textPrimary}`}>
                      72-Hour Forecast
                    </h2>
                    <p className={`text-xs mt-0.5 ${textSecondary}`}>
                      AI Predictive Simulation
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> AI Active
                </span>
              </div>

              {/* Continuous Forecast Mini Chart */}
              <div className="h-[120px] w-full -ml-3 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentForecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isLight ? '#fff' : '#09090b', 
                        border: isLight ? '1px solid #e4e4e7' : '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '12px' 
                      }} 
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Area type="monotone" dataKey="aqi" stroke="#f59e0b" strokeWidth={2.5} fill="url(#forecastGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Timeline Cards Row */}
              <div className="grid grid-cols-5 gap-2 pt-4 border-t border-white/[0.05]">
                {currentForecastData.slice(1, 6).map((item, i) => {
                  let dot = 'bg-emerald-500';
                  if (item.aqi > 50) dot = 'bg-yellow-400';
                  if (item.aqi > 100) dot = 'bg-orange-500';
                  if (item.aqi > 150) dot = 'bg-rose-500';
                  if (item.aqi > 200) dot = 'bg-purple-500';

                  return (
                    <div key={i} className={`p-2.5 rounded-xl border text-center transition-all ${
                      isLight ? 'bg-zinc-50 border-zinc-100' : 'bg-white/[0.02] border-white/[0.03]'
                    }`}>
                      <span className={`text-[10px] font-semibold block truncate ${textSecondary}`}>
                        {item.time}
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-1.5">
                        <span className={`text-sm font-bold tracking-tight ${textPrimary}`}>
                          {item.aqi}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot} shadow-sm`} />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* 5. NEARBY MONITORING STATIONS */}
          <div className={`p-6 lg:p-8 rounded-[1.5rem] border ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isLight ? 'bg-zinc-100' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                  <Radio className={`w-4 h-4 ${textPrimary} animate-pulse`} />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold tracking-wide ${textPrimary}`}>
                    Nearby Monitoring Stations
                  </h2>
                  <p className={`text-xs mt-0.5 ${textSecondary}`}>
                    Click to inspect detailed sensor telemetry
                  </p>
                </div>
              </div>

              <button className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                isLight ? 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50' : 'bg-white/[0.02] border-white/[0.05] text-zinc-300 hover:bg-white/[0.05]'
              }`}>
                View Map Mode
              </button>
            </div>

            {/* Station List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(location?.nearbyStations || []).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`p-5 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                    selectedStation?.id === st.id
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_8px_30px_rgba(244,63,94,0.1)]'
                      : isLight
                        ? 'bg-zinc-50 border-zinc-200 hover:bg-white hover:border-zinc-300 shadow-sm'
                        : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className={`text-sm font-bold tracking-tight ${textPrimary}`}>
                        {st.name}
                      </h4>
                      <span className={`text-[10px] font-medium block mt-1 ${textSecondary}`}>
                        {st.distance} away
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${st.color}`}>
                      AQI {st.aqi}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between pt-3 border-t text-[11px] font-medium ${isLight ? 'border-zinc-200' : 'border-white/[0.05]'}`}>
                    <span className={textSecondary}>
                      {st.status}
                    </span>
                    <span className="text-zinc-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Station Telemetry Drawer/Modal */}
            {selectedStation && (
              <div className={`mt-6 p-6 rounded-2xl border transition-all ${
                isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-500/5 border-rose-500/20'
              }`}>
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                    <div>
                      <h3 className={`text-base font-bold ${textPrimary}`}>
                        {selectedStation.name}
                      </h3>
                      <p className={`text-[11px] mt-0.5 ${textSecondary}`}>
                        Data Source: {selectedStation.source} · Updated: {selectedStation.lastUpdate}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedStation(null)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-black/30 border-white/[0.05]'}`}>
                    <span className={`text-[10px] font-semibold uppercase block ${textSecondary}`}>Overall AQI</span>
                    <span className="text-2xl font-bold tracking-tight text-rose-500">{selectedStation.aqi}</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-black/30 border-white/[0.05]'}`}>
                    <span className={`text-[10px] font-semibold uppercase block ${textSecondary}`}>PM2.5</span>
                    <span className={`text-lg font-bold tracking-tight ${textPrimary}`}>{selectedStation.pm25} <span className="text-[10px] font-medium opacity-60">μg/m³</span></span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-black/30 border-white/[0.05]'}`}>
                    <span className={`text-[10px] font-semibold uppercase block ${textSecondary}`}>PM10</span>
                    <span className={`text-lg font-bold tracking-tight ${textPrimary}`}>{selectedStation.pm10} <span className="text-[10px] font-medium opacity-60">μg/m³</span></span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-black/30 border-white/[0.05]'}`}>
                    <span className={`text-[10px] font-semibold uppercase block ${textSecondary}`}>NO₂</span>
                    <span className={`text-lg font-bold tracking-tight ${textPrimary}`}>{selectedStation.no2} <span className="text-[10px] font-medium opacity-60">μg/m³</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
