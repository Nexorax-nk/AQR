'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, ChevronDown, ChevronRight, Loader2, Sun, Moon, CloudSun, Sparkles, Navigation, TrendingUp, ArrowLeft, ArrowDownUp } from 'lucide-react';
import { AQI_LOCATIONS, getAQICategory } from '@/lib/aqi-data';
import { AQILocation } from '@/lib/types';
   
interface HeaderSearchProps {
  onSelectLocation?: (location: AQILocation) => void;
  onSearchSubmit?: (query: string) => void;
  onToggleSideNav?: () => void;
  selectedLocation?: AQILocation | null;
  isSideNavOpen?: boolean;
  isSideNavExpanded?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  mapCenter?: [number, number];
  routingMode?: boolean;
  onToggleRouting?: () => void;
  routeStart?: AQILocation | null;
  onSelectRouteStart?: (loc: AQILocation | null) => void;
  onRouteFetched?: (data: any) => void;
}

interface PhotonResult {
  properties: {
    osm_id: number;
    osm_type: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    extent?: [number, number, number, number];
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({
  onSelectLocation,
  onSearchSubmit,
  onToggleSideNav,
  selectedLocation,
  isSideNavOpen = true,
  isSideNavExpanded = false,
  theme = 'dark',
  onToggleTheme,
  mapCenter = [28.5450, 77.3300], // Default to India center
  routingMode = false,
  onToggleRouting,
  routeStart,
  onSelectRouteStart,
  onRouteFetched,
}) => {
  const [query, setQuery] = useState('');
  const [activeInput, setActiveInput] = useState<'start' | 'end' | 'none'>('none');
  const [isOpen, setIsOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<PhotonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLoc = selectedLocation;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync query when map clicks update the route Start
  useEffect(() => {
    if (routingMode && activeInput === 'start') {
      setQuery(routeStart ? routeStart.name : '');
    }
  }, [routeStart, routingMode]);

  // Sync query when map clicks update the Destination
  useEffect(() => {
    if (routingMode && activeInput === 'end') {
      setQuery(selectedLocation ? selectedLocation.name : '');
    }
  }, [selectedLocation, routingMode]);

  // Fuzzy Geocoding Search using Photon (Typo-Tolerant)
  useEffect(() => {
    setSelectedIndex(-1); // Reset selection on new query
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const abortController = new AbortController();
    
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Viewport Biasing: Soft-bias results towards the user's current map center
        const [lat, lon] = mapCenter;
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=${lat}&lon=${lon}`,
          { signal: abortController.signal }
        );
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Geocoding error:', err);
        }
      } finally {
        // Only stop loading if we haven't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      abortController.abort(); // Cancel any pending fetch immediately if user keeps typing
    };
  }, [query]);

  const handleSelectGeocodedResult = (item: PhotonResult) => {
    const lat = item.geometry.coordinates[1];
    const lng = item.geometry.coordinates[0];
    const simulatedAQI = Math.floor(45 + Math.random() * 120);
    const category = getAQICategory(simulatedAQI);

    // Fallback extent calculation for small towns/nodes without one (creates a ~3km bounding box)
    let extent = item.properties.extent;
    if (!extent) {
      const radiusLat = 3 / 111.32;
      const radiusLon = 3 / (111.32 * Math.cos((lat * Math.PI) / 180));
      extent = [lng - radiusLon, lat + radiusLat, lng + radiusLon, lat - radiusLat];
    }

    const newLocation: AQILocation = {
      id: `geo-${item.properties.osm_type || 'N'}-${item.properties.osm_id}`,
      name: item.properties.name || 'Unknown Location',
      area: [item.properties.city, item.properties.state, item.properties.country].filter(Boolean).join(', '),
      lat,
      lng,
      aqi: simulatedAQI,
      category,
      pm25: Math.round(simulatedAQI * 0.85),
      pm10: Math.round(simulatedAQI * 2.2),
      rainfall: 0,
      temperature: 28.5,
      humidity: 48,
      windSpeed: '2.4 Km/h',
      no2: 28,
      o3: 20,
      advisories: {
        faceMask: simulatedAQI > 150 ? 'MANDATORY' : simulatedAQI > 100 ? 'RECOMMENDED' : 'NOT RECOMMENDED',
        airPurifier: 'RECOMMENDED',
        outdoorExercise: simulatedAQI > 150 ? 'NOT RECOMMENDED' : 'RECOMMENDED',
        outdoorActivities: simulatedAQI > 150 ? 'NOT RECOMMENDED' : 'RECOMMENDED',
      },
      trend: 'stable',
      lastUpdated: 'Just now',
      extent: extent,
    };

    if (routingMode) {
      if (activeInput === 'end' && onSelectLocation) {
        onSelectLocation(newLocation);
      } else if (onSelectRouteStart) {
        onSelectRouteStart(newLocation);
      }
    } else if (onSelectLocation) {
      onSelectLocation(newLocation);
    }
    
    setQuery(newLocation.name);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || searchResults.length === 0) {
      if (e.key === 'Enter' && query.trim() && onSearchSubmit) {
        onSearchSubmit(query);
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
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectGeocodedResult(searchResults[selectedIndex]);
      } else {
        handleSelectGeocodedResult(searchResults[0]);
      }
    }
  };

  const handleSendClick = () => {
    if (searchResults.length > 0) {
      handleSelectGeocodedResult(selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0]);
    } else if (query.trim() && onSearchSubmit) {
      onSearchSubmit(query);
    }
  };

  return (
    <header
      ref={containerRef}
      className={`fixed top-4 ${isSideNavOpen ? (isSideNavExpanded ? 'left-[268px]' : 'left-[112px]') : 'left-4'} right-4 z-30 flex items-start gap-4 pointer-events-none transition-all duration-300 min-w-0 flex-wrap md:flex-nowrap`}
    >
      {/* 1. Left Search Bar (Short, isolated Google Maps style) */}
      <div className="relative pointer-events-auto w-full max-w-[380px] flex-shrink-0 transition-all duration-300">
        {!routingMode ? (
          <div className={`flex items-center backdrop-blur-xl border rounded-full transition-all h-[52px] px-2 relative group ${
            theme === 'light'
              ? 'bg-white border-neutral-200 focus-within:border-neutral-300 text-neutral-900 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              : 'bg-[#1E1B1A] border-white/10 focus-within:border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
          }`}>
            
            <Search className={`w-5 h-5 ml-3 mr-2.5 flex-shrink-0 group-focus-within:text-[#FF5500] transition-colors ${
              theme === 'light' ? 'text-neutral-500' : 'text-white/50'
            }`} />
            
            <input
              type="text"
              value={activeInput === 'none' && !routingMode ? query : (!routingMode ? query : query)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                setActiveInput('none');
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search AQR map..."
              className={`w-full h-full bg-transparent text-[14px] font-medium focus:outline-none ${
                theme === 'light' ? 'text-neutral-900 placeholder-neutral-400' : 'text-white placeholder-white/40'
              }`}
            />

            <div className="flex items-center gap-1 pr-1">
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setSearchResults([]);
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    theme === 'light' ? 'hover:bg-neutral-200 text-neutral-500' : 'hover:bg-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Directions Button - Show when a location is selected! */}
              {selectedLocation && onToggleRouting && (
                <button
                  onClick={onToggleRouting}
                  className={`w-9 h-9 bg-[#2A6FF5]/10 hover:bg-[#2A6FF5] text-[#2A6FF5] hover:text-white rounded-full flex items-center justify-center transition-all ml-1 border ${
                    theme === 'light' ? 'border-neutral-200 hover:border-neutral-300' : 'border-white/10 hover:border-white/20'
                  }`}
                  title="Directions"
                >
                  <ArrowDownUp className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={handleSendClick}
                className={`w-9 h-9 bg-[#FF5500]/10 hover:bg-[#FF5500] text-[#FF5500] hover:text-black rounded-full flex items-center justify-center transition-all ml-1 border ${
                  theme === 'light' ? 'border-neutral-200 hover:border-neutral-300' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" style={{ transform: 'rotate(45deg)' }} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex items-start backdrop-blur-xl border rounded-2xl p-3 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 ${
            theme === 'light'
              ? 'bg-white border-neutral-200 text-neutral-900 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
              : 'bg-[#1E1B1A] border-white/10 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
          }`}>
             <button onClick={onToggleRouting} className={`mr-1 mt-2.5 transition-opacity ${theme === 'light' ? 'text-neutral-500 hover:text-black' : 'text-white/50 hover:text-white'}`}>
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="flex-1 flex flex-col relative ml-1">
                {/* Timeline connector */}
                <div className="absolute left-[15px] top-[22px] bottom-[22px] w-[2px] border-l-[2px] border-dotted border-neutral-500/50 z-0" />
                
                {/* Start Input Row */}
                <div className="flex items-center w-full">
                  <div className="w-8 flex justify-center z-10 bg-transparent">
                     <div className={`w-3.5 h-3.5 border-[2px] rounded-full ${theme === 'light' ? 'border-black bg-white' : 'border-[#FF5500] bg-[#1E1B1A]'}`} />
                  </div>
                  <div className={`flex-1 flex items-center border rounded-xl h-[40px] px-3 ml-1 transition-colors ${theme==='light' ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200' : 'bg-[#110F0E] hover:bg-white/5 border-white/5 focus-within:border-white/10 focus-within:bg-white/5'}`}>
                     <input 
                        placeholder="Choose starting point..." 
                        className={`w-full bg-transparent outline-none text-[13px] font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`} 
                        value={activeInput === 'start' ? query : (routeStart ? routeStart.name : '')} 
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setIsOpen(true);
                          if (e.target.value === '' && onSelectRouteStart) {
                            onSelectRouteStart(null);
                          }
                        }}
                        onFocus={() => {
                          setActiveInput('start');
                          setQuery(routeStart ? routeStart.name : '');
                          setIsOpen(true);
                        }}
                        onKeyDown={handleKeyDown}
                     />
                     {isLoading && activeInput === 'start' && (
                       <Loader2 className="w-4 h-4 text-neutral-400 animate-spin flex-shrink-0 ml-2" />
                     )}
                     {(activeInput === 'start' ? query : routeStart?.name) && !isLoading && (
                       <button
                         onClick={() => {
                           setQuery('');
                           setSearchResults([]);
                           if (onSelectRouteStart) onSelectRouteStart(null);
                         }}
                         className={`w-6 h-6 flex items-center justify-center rounded-full ml-1 flex-shrink-0 transition-colors ${
                           theme === 'light' ? 'hover:bg-neutral-200 text-neutral-500' : 'hover:bg-white/10 text-white/50 hover:text-white'
                         }`}
                       >
                         <X className="w-3.5 h-3.5" />
                       </button>
                     )}
                  </div>
                </div>

                <div className="h-1.5" />

                {/* End Input Row */}
                <div className="flex items-center w-full">
                  <div className="w-8 flex justify-center z-10 bg-transparent">
                     <MapPin className="w-[18px] h-[18px] text-[#E03D3D]" />
                  </div>
                  <div className={`flex-1 flex items-center border rounded-xl h-[40px] px-3 ml-1 transition-colors ${theme==='light' ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200' : 'bg-[#110F0E] hover:bg-white/5 border-white/5 focus-within:border-white/10 focus-within:bg-white/5'}`}>
                     <input 
                        placeholder="Choose destination..." 
                        className={`w-full bg-transparent outline-none text-[13.5px] font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`} 
                        value={activeInput === 'end' ? query : (selectedLocation ? selectedLocation.name : '')} 
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setIsOpen(true);
                        }}
                        onFocus={() => {
                          setActiveInput('end');
                          setQuery(selectedLocation ? selectedLocation.name : '');
                          setIsOpen(true);
                        }}
                        onKeyDown={handleKeyDown}
                     />
                     {isLoading && activeInput === 'end' && (
                       <Loader2 className="w-4 h-4 text-neutral-400 animate-spin flex-shrink-0 ml-2" />
                     )}
                  </div>
                </div>
             </div>
             <button 
                onClick={() => {
                  if (onSelectRouteStart && onSelectLocation && selectedLocation && routeStart) {
                    const temp = selectedLocation;
                    onSelectLocation(routeStart);
                    onSelectRouteStart(temp);
                  }
                }}
                className={`ml-3 mt-[26px] p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                title="Swap locations"
             >
                <ArrowDownUp className="w-4 h-4" />
             </button>
          </div>
        )}

        {/* Global Geocoding Search Dropdown */}
        {isOpen && (searchResults.length > 0 || routingMode) && (
          <div className={`absolute ${routingMode ? 'top-[140px]' : 'top-[60px]'} left-0 w-full border rounded-2xl p-2 shadow-[0_25px_60px_rgba(0,0,0,0.65)] space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto no-scrollbar z-50 backdrop-blur-2xl ${
            theme === 'light' 
              ? 'bg-[#FFFBF8] border-neutral-200 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.08)]' 
              : 'bg-[#1E1B1A] border-white/12 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]'
          }`}>
            <div className="pt-1 pb-1">
              <div className="px-3 py-2 text-[10px] font-black text-[#FF5500] uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#FF5500]" />
                Search Results
              </div>
              
              {/* Drop Pin Option (always visible during routing focus) */}
              {routingMode && (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('enable-map-selection', { detail: { target: activeInput } }));
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 mb-1.5 rounded-xl text-left transition-all cursor-pointer group border ${
                    theme === 'light'
                      ? 'hover:bg-neutral-100 border-transparent hover:border-neutral-200'
                      : 'hover:bg-[#2E2724] border-transparent hover:border-white/15'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    theme === 'light' ? 'bg-[#FF5500]/10 text-[#FF5500]' : 'bg-[#FF5500]/20 text-[#FF5500]'
                  }`}>
                    <MapPin className="w-4 h-4 transition-colors" />
                  </div>
                  <div className={`text-[13px] font-bold transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-[#FF5500]' : 'text-white/95 group-hover:text-white'}`}>
                    Choose on Map (Drop Pin)
                  </div>
                </button>
              )}
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.properties.osm_id}-${idx}`}
                  onClick={() => handleSelectGeocodedResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group border ${
                    idx === selectedIndex
                      ? (theme === 'light' ? 'bg-neutral-100 border-neutral-200' : 'bg-[#2E2724] border-white/15')
                      : (theme === 'light'
                          ? 'hover:bg-neutral-100 border-transparent hover:border-neutral-200'
                          : 'hover:bg-[#2E2724] border-transparent hover:border-white/15')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF5500] group-hover:text-black transition-all ${
                      theme === 'light' ? 'bg-amber-100/80 text-[#FF5500]' : 'bg-[#2B2420] text-[#FF5500]'
                    }`}>
                      <MapPin className="w-4 h-4 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-bold truncate transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-[#FF5500]' : 'text-white/95 group-hover:text-white'}`}>
                        {item.properties.name}
                      </div>
                      <div className={`text-[11px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-white/45'}`}>
                        {[item.properties.city, item.properties.state, item.properties.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 flex-shrink-0 ${
                    theme === 'light' ? 'bg-neutral-200' : 'bg-[#3A3029]'
                  }`}>
                    <ChevronRight className="w-3.5 h-3.5 text-[#FF5500]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Middle Action Pills (Location Selector, Near Me) */}
      <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0 flex-wrap">
        {/* Location Dropdown Pill */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            className={`h-[52px] px-5 backdrop-blur-xl border rounded-full flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap group ${
              theme === 'light'
                ? 'bg-white/95 text-neutral-900 border-neutral-300 hover:border-neutral-400 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
                : 'bg-[#0B0C0E]/95 text-white border-white/10 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            }`}
          >
            <MapPin className={`w-4 h-4 group-hover:text-[#FF5500] transition-colors ${theme === 'light' ? 'text-neutral-500' : 'text-white/50'}`} />
            <span className="text-[13px] font-semibold">{activeLoc ? activeLoc.name.split(',')[0] : 'Select Location'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''} ${theme === 'light' ? 'text-neutral-500' : 'text-white/50'}`} />
          </button>
          
          {isCityDropdownOpen && (
            <div className={`absolute top-[60px] left-0 w-[300px] border rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.65)] space-y-1 animate-in fade-in zoom-in-95 duration-200 z-50 pointer-events-auto backdrop-blur-2xl ${
              theme === 'light' 
                ? 'bg-[#FFFBF8] border-neutral-200 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.08)]' 
                : 'bg-[#1E1B1A] border-white/12 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]'
            }`}>
              <div className="px-3 py-2 text-[10px] font-black text-[#FF5500] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Select AQI Station
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {AQI_LOCATIONS.length > 0 ? (
                  AQI_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        if (onSelectLocation) onSelectLocation(loc);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        activeLoc?.id === loc.id
                          ? 'bg-[#FF5500]/15 border border-white/20 text-[#FF5500]'
                          : theme === 'light' 
                            ? 'hover:bg-neutral-100 border border-transparent' 
                            : 'hover:bg-[#2E2724] border border-transparent'
                      }`}
                    >
                      <div className="truncate mr-3">
                        <div className={`text-sm truncate ${activeLoc?.id === loc.id ? 'text-[#FF5500] font-bold' : theme === 'light' ? 'text-slate-900 font-medium' : 'text-white/90 font-medium'}`}>
                          {loc.name}
                        </div>
                        <div className={`text-[11px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>{loc.area}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest ${activeLoc?.id === loc.id ? 'bg-[#FF5500] text-black' : theme === 'light' ? 'bg-amber-100 text-amber-900' : 'bg-white/10 text-white/70'}`}>
                        AQI {loc.aqi}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={`p-4 text-center text-xs ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
                    Use search bar to select a location
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* GPS Near Me Pill */}
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                if (onSelectLocation) {
                  onSelectLocation({
                    id: 'my-location',
                    name: 'My GPS Location',
                    area: 'Current Position',
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    aqi: 58,
                    category: 'good',
                    pm25: 18,
                    pm10: 42,
                    rainfall: 0,
                    temperature: 28,
                    humidity: 50,
                    windSpeed: '3.2 Km/h',
                    no2: 22,
                    o3: 16,
                    advisories: { faceMask: 'NOT RECOMMENDED', airPurifier: 'RECOMMENDED', outdoorExercise: 'RECOMMENDED', outdoorActivities: 'RECOMMENDED' },
                    trend: 'stable',
                    lastUpdated: 'Just now',
                  });
                }
              });
            }
          }}
          className={`h-[52px] px-5 backdrop-blur-xl border rounded-full flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap group flex-shrink-0 ${
            theme === 'light'
              ? 'bg-white/95 text-neutral-900 border-neutral-300 hover:border-neutral-400 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
              : 'bg-[#0B0C0E]/95 text-white border-white/10 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
        >
          <Navigation className={`w-4 h-4 group-hover:text-[#FF5500] transition-colors ${theme === 'light' ? 'text-neutral-500' : 'text-white/50'}`} />
          <span className="text-[13px] font-semibold">Near Me</span>
        </button>
      </div>

      {/* 3. Floating Right Header Status Group */}
      <div className="flex items-center gap-3 pointer-events-auto ml-auto flex-shrink-0">
        {/* Weather Status Pill */}
        <div className={`hidden lg:flex items-center gap-3 px-4 h-[52px] backdrop-blur-xl border rounded-full transition-all group cursor-default ${
          theme === 'light'
            ? 'bg-white/95 border-neutral-300 text-neutral-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
            : 'bg-[#0B0C0E]/90 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        }`}>
          <CloudSun className={`w-5 h-5 group-hover:text-[#FF5500] transition-colors ${theme === 'light' ? 'text-neutral-500' : 'text-white/50'}`} />
          <div className="flex flex-col justify-center">
            <div className={`text-[13px] font-bold leading-tight ${theme === 'light' ? 'text-neutral-900' : 'text-white/90'}`}>
              {activeLoc ? activeLoc.temperature : '--'}°C
            </div>
            <div className={`text-[10px] font-medium ${theme === 'light' ? 'text-neutral-500' : 'text-white/40'}`}>
              {activeLoc ? 'Partly cloudy' : 'Select a location'}
            </div>
          </div>
        </div>

        {/* AQI Status Card */}
        <div className={`h-[52px] px-4 backdrop-blur-xl border rounded-full flex items-center gap-4 transition-all cursor-pointer group ${
          theme === 'light'
            ? 'bg-white/95 text-neutral-900 border-neutral-300 hover:border-neutral-400 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
            : 'bg-[#0B0C0E]/90 text-white border-white/12 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        }`}>
          <div className="flex flex-col justify-center">
            <div className={`text-[13px] font-black leading-tight ${activeLoc ? 'text-[#FF5500]' : (theme === 'light' ? 'text-neutral-400' : 'text-white/30')}`}>
              AQI {activeLoc ? activeLoc.aqi : '--'}
            </div>
            <div className={`text-[10px] font-medium capitalize ${theme === 'light' ? 'text-neutral-500' : 'text-white/50'}`}>
              {activeLoc ? activeLoc.category.replace('-', ' ') : 'Select location'}
            </div>
          </div>

          {/* Trending Graph Icon */}
          <TrendingUp className={`w-5 h-5 stroke-[2.4] group-hover:scale-110 transition-transform duration-200 ml-1 ${
            activeLoc 
              ? 'text-[#FF5500] filter drop-shadow-[0_0_8px_rgba(255,85,0,0.85)]' 
              : (theme === 'light' ? 'text-neutral-300' : 'text-white/20')
          }`} />
        </div>

        {/* Theme Toggle Button (Dark / Light Mode) */}
        <button
          onClick={onToggleTheme}
          className={`w-[52px] h-[52px] rounded-full backdrop-blur-xl transition-all duration-300 relative cursor-pointer group flex items-center justify-center border active:scale-90 hover:scale-105 ${
            theme === 'light'
              ? 'bg-white/95 hover:bg-white border-neutral-300 hover:border-neutral-400 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
              : 'bg-[#0B0C0E]/90 hover:bg-[#15171C] border-white/10 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
          title={theme === 'light' ? 'Current: Light Mode (Click for Dark)' : 'Current: Dark Mode (Click for Light)'}
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            {theme === 'light' ? (
              <Sun
                key="sun-icon-orange"
                className="w-5.5 h-5.5 text-[#FF5500] fill-[#FF5500]/25 stroke-[2.4] filter drop-shadow-[0_0_8px_rgba(255,85,0,0.7)] animate-icon-swap group-hover:rotate-90 transition-transform duration-500"
              />
            ) : (
              <Moon
                key="moon-icon-orange"
                className="w-5.5 h-5.5 text-[#FF5500] fill-[#FF5500]/25 stroke-[2.4] filter drop-shadow-[0_0_8px_rgba(255,85,0,0.7)] animate-icon-swap group-hover:-rotate-45 transition-transform duration-500"
              />
            )}
          </div>
        </button>

        {/* Profile Avatar */}
        <button
          className={`w-[52px] h-[52px] rounded-full p-0.5 border transition-all cursor-pointer group ${
            theme === 'light'
              ? 'border-neutral-300 hover:border-neutral-400 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
              : 'border-white/12 hover:border-white/25 bg-[#0B0C0E]/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
          title="User Profile"
        >
          <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${
            theme === 'light' ? 'bg-neutral-200' : 'bg-[#1A1C21]'
          }`}>
            <span className={`font-bold text-sm group-hover:text-white transition-colors ${
              theme === 'light' ? 'text-neutral-900' : 'text-white/90'
            }`}>N</span>
          </div>
        </button>
      </div>
    </header>
  );
};
