'use client';

import React, { useState } from 'react';
import { AQILocation, RouteOption } from '@/lib/types';
import { ChevronUp, ChevronDown, MapPin, ShieldAlert, Wind, Thermometer, Droplets, CloudRain, Activity, CheckCircle2, XCircle, Navigation, Shield, Bike } from 'lucide-react';

interface AQIDetailsDrawerProps {
  location: AQILocation | null;
  onClose?: () => void;
  isSideNavOpen?: boolean;
  isSideNavExpanded?: boolean;
  theme?: 'dark' | 'light';
  routingMode?: boolean;
  activeRoutes?: RouteOption[];
  selectedRouteId?: string;
  onSelectRoute?: (id: string) => void;
}

export const AQIDetailsDrawer: React.FC<AQIDetailsDrawerProps> = ({ 
  location, 
  isSideNavOpen = true,
  isSideNavExpanded = false,
  theme = 'dark',
  routingMode = false,
  activeRoutes = [],
  selectedRouteId,
  onSelectRoute
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // If we are in routing mode but have no routes AND no location, hide.
  if (!location && activeRoutes.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className={`fixed bottom-0 ${isSideNavOpen ? (isSideNavExpanded ? 'left-[268px]' : 'left-[112px]') : 'left-4'} right-0 lg:right-auto lg:w-[480px] z-30 transition-all duration-300`}>
      
      {/* ROUTING MODE UI */}
      {routingMode && activeRoutes.length > 0 ? (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full h-14 px-5 flex items-center justify-between shadow-sm transition-all cursor-pointer rounded-t-3xl border border-b-0 ${
              isLight ? 'bg-white border-neutral-200' : 'bg-[#181615] border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#FF5500]/10 p-2 rounded-full">
                <Navigation className="w-4 h-4 text-[#FF5500] flex-shrink-0" />
              </div>
              <span className={`font-semibold tracking-wide text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>AQR Route Evaluator</span>
            </div>
            {isExpanded ? (
              <ChevronDown className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            ) : (
              <ChevronUp className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            )}
          </button>

          {isExpanded && (
            <div className={`p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar rounded-b-3xl transition-colors duration-300 border ${
              isLight
                ? 'bg-white/95 border-neutral-200 text-neutral-900 shadow-2xl backdrop-blur-3xl'
                : 'bg-[#181615]/95 border-white/10 text-white shadow-2xl backdrop-blur-3xl'
            }`}>
              <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 flex items-center gap-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                <Activity className="w-3 h-3" />
                Available Routes
              </div>
              
              {activeRoutes.map((route) => {
                const isSelected = selectedRouteId === route.id || (selectedRouteId === undefined && route.isRecommended);
                
                return (
                  <div 
                    key={route.id}
                    onClick={() => onSelectRoute?.(route.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
                      isSelected 
                        ? (isLight ? 'bg-amber-50/50 border-[#FF5500]/40 shadow-sm' : 'bg-[#1E1917] border-[#FF5500]/40 shadow-sm') 
                        : (isLight ? 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50' : 'bg-[#1C1A19] border-white/5 hover:border-white/10 hover:bg-[#201D1C]')
                    }`}
                  >
                    {/* Subtle highlight for selected route */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF5500]/5 to-transparent blur-xl pointer-events-none rounded-full" />
                    )}
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-medium tracking-wide border ${
                            route.tag === 'CLEANEST' ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') :
                            route.tag === 'FASTEST' ? (isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20') :
                            (isLight ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20')
                          }`}>
                            {route.tag === 'BALANCED' && '⭐ '}
                            {route.tag === 'CLEANEST' && '🌿 '}
                            {route.tag === 'FASTEST' && '⚡ '}
                            {route.tag}
                          </span>
                          {route.isRecommended && (
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${isLight ? 'text-[#FF5500]' : 'text-[#FF5500]'}`}>
                              <CheckCircle2 className="w-3 h-3" /> Recommended
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] font-normal leading-relaxed max-w-[220px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          {route.description}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xl font-medium flex items-baseline justify-end gap-1 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                          {route.durationMins} <span className={`text-[11px] font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>min</span>
                        </div>
                        <div className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{route.distanceKm} km</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 relative z-10 pt-1">
                      <div className={`flex items-center gap-2 px-0 py-1 rounded-lg text-xs transition-colors`}>
                        <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Avg AQI</span>
                        <span className={`text-sm font-semibold ${
                          route.avgAQI < 50 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') :
                          route.avgAQI < 100 ? (isLight ? 'text-amber-500' : 'text-amber-400') :
                          route.avgAQI < 150 ? (isLight ? 'text-orange-500' : 'text-orange-400') :
                          (isLight ? 'text-red-500' : 'text-red-400')
                        }`}>{route.avgAQI}</span>
                      </div>
                      
                      {route.aqiDiffText && (
                        <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isLight ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {route.aqiDiffText}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* LOCATION DETAILS UI */
        location && (
          <>
            {/* Top Toggle Bar / Header */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-12 bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white px-4 flex items-center justify-between font-bold text-sm shadow-xl transition-colors cursor-pointer rounded-t-2xl"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 fill-white flex-shrink-0" />
                <span className="truncate">{location.name}</span>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md text-xs font-black text-white">
                  <span>AQI</span>
                  <span className="text-base">{location.aqi}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
              </div>
            </button>

            {/* Expanded Content Sheet */}
            {isExpanded && (
              <div className={`border-t p-4 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar rounded-b-2xl transition-colors duration-300 ${
                isLight
                  ? 'bg-white/95 border-neutral-300 text-neutral-900 shadow-[0_25px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl'
                  : 'bg-[#1E2125] border-white/10 text-white shadow-2xl backdrop-blur-xl'
              }`}>
                {/* Section 1: Current Pollutant & Weather Levels */}
                <div>
                  <div className={`text-[11px] font-black uppercase tracking-wider mb-2.5 ${isLight ? 'text-[#FF5500]' : 'text-[#FF5500]'}`}>
                    CURRENT POLLUTANT LEVELS
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`p-2.5 rounded-xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>PM 2.5</div>
                      <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{location.pm25} <span className={`text-[10px] font-normal ${isLight ? 'text-slate-400' : 'text-white/50'}`}>ug/m³</span></div>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>PM 10</div>
                      <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{location.pm10} <span className={`text-[10px] font-normal ${isLight ? 'text-slate-400' : 'text-white/50'}`}>ug/m³</span></div>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Rainfall</div>
                      <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{location.rainfall} <span className={`text-[10px] font-normal ${isLight ? 'text-slate-400' : 'text-white/50'}`}>mm</span></div>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Temperature</div>
                      <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{location.temperature}°C</div>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Humidity</div>
                      <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{location.humidity}%</div>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Wind</div>
                      <div className={`text-sm font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{location.windSpeed}</div>
                    </div>
                  </div>
                </div>

                {/* Category Banner */}
                <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-extrabold border ${
                  isLight
                    ? 'bg-neutral-100 border-neutral-200 text-neutral-800'
                    : 'bg-[#FF5500]/10 border-white/10 text-[#FF5500]'
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse" />
                  <span className="capitalize">{location.category} Air Quality Level</span>
                  <span className={`ml-auto text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Updated {location.lastUpdated}</span>
                </div>

                {/* Section 2: Health Advisories */}
                <div>
                  <div className={`text-[11px] font-black uppercase tracking-wider mb-2.5 ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
                    HEALTH ADVISORIES
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Mask */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${isLight ? 'bg-slate-200/70 text-slate-500' : 'bg-white/5 text-white/50'}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>FACE MASK</div>
                        <div className={`text-[10px] font-bold ${
                          location.advisories.faceMask === 'NOT RECOMMENDED' 
                            ? (isLight ? 'text-slate-400 font-medium' : 'text-white/40') 
                            : (isLight ? 'text-amber-600' : 'text-[#FF5500]')
                        }`}>
                          {location.advisories.faceMask}
                        </div>
                      </div>
                    </div>

                    {/* Purifier */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${isLight ? 'bg-slate-200/70 text-slate-500' : 'bg-white/5 text-white/50'}`}>
                        <Wind className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>AIR PURIFIER</div>
                        <div className={`text-[10px] font-bold ${
                          location.advisories.airPurifier === 'RECOMMENDED' 
                            ? (isLight ? 'text-emerald-600' : 'text-[#38C958]') 
                            : (isLight ? 'text-slate-400 font-medium' : 'text-white/40')
                        }`}>
                          {location.advisories.airPurifier}
                        </div>
                      </div>
                    </div>

                    {/* Exercise */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${isLight ? 'bg-slate-200/70 text-slate-500' : 'bg-white/5 text-white/50'}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>OUTDOOR EXERCISE</div>
                        <div className={`text-[10px] font-bold ${
                          location.advisories.outdoorExercise === 'RECOMMENDED' 
                            ? (isLight ? 'text-emerald-600' : 'text-[#38C958]') 
                            : (isLight ? 'text-rose-600' : 'text-[#EE3E3E]')
                        }`}>
                          {location.advisories.outdoorExercise}
                        </div>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#16181B] border-white/5'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${isLight ? 'bg-slate-200/70 text-slate-500' : 'bg-white/5 text-white/50'}`}>
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>OUTDOOR ACTIVITIES</div>
                        <div className={`text-[10px] font-bold ${
                          location.advisories.outdoorActivities === 'RECOMMENDED' 
                            ? (isLight ? 'text-emerald-600' : 'text-[#38C958]') 
                            : (isLight ? 'text-rose-600' : 'text-[#EE3E3E]')
                        }`}>
                          {location.advisories.outdoorActivities}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};
