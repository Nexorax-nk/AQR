'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SideNav } from '@/components/layout/SideNav';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { AQRMap } from '@/components/map/AQRMap';
import { MapControls } from '@/components/map/MapControls';
import { LayerMenu } from '@/components/layers/LayerMenu';
import { AQIDetailsDrawer } from '@/components/aqi/AQIDetailsDrawer';
import { AQRFloatingAgent } from '@/components/ai/AQRFloatingAgent';
import { AirDashboard } from '@/components/air/AirDashboard';
import { ZonesDashboard } from '@/components/zones/ZonesDashboard';
import { AWSInfraDashboard } from '@/components/aws/AWSInfraDashboard';
import { AgentsDashboard } from '@/components/agents/AgentsDashboard';
import { RuntimeConsole } from '@/components/console/RuntimeConsole';
import { AqrAiDashboard } from '@/components/ai/AqrAiDashboard';
import { MapLayerState, RouteOption, AQILocation, TileProvider } from '@/lib/types';
import { INITIAL_CENTER, INITIAL_ZOOM, AQI_LOCATIONS } from '@/lib/aqi-data';
import { getFullLocationData } from '@/lib/api-aqi';
import { Navigation, X } from 'lucide-react';

export default function AQRMainPage() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(INITIAL_ZOOM);
  const [activeTab, setActiveTab] = useState<string>('map');
  const [isSideNavOpen, setIsSideNavOpen] = useState<boolean>(true);
  const [isSideNavExpanded, setIsSideNavExpanded] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Routing State
  const [routingMode, setRoutingMode] = useState<boolean>(false);
  const [routeStart, setRouteStart] = useState<AQILocation | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [isRouting, setIsRouting] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Map Layer & Basemap States
  const [layerState, setLayerState] = useState<MapLayerState>({
    tileProvider: 'dark',
    aqi: true,
  });

  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState<boolean>(false);
  const [isAQIMode, setIsAQIMode] = useState<boolean>(true);

  // Selected Station for Skymet Bottom Drawer & Top Navbar Status (null by default - no mock markers)
  const [selectedLocation, setSelectedLocation] = useState<AQILocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Active comparative routes
  const [activeRoutes, setActiveRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();

  // Handlers
  const handleZoomIn = () => setMapZoom((prev) => Math.min(prev + 1, 18));
  const handleZoomOut = () => setMapZoom((prev) => Math.max(prev - 1, 10));

  const handleToggleTheme = () => {
    const performToggle = () => {
      setTheme((prev) => {
        const nextTheme = prev === 'dark' ? 'light' : 'dark';
        setLayerState((lPrev) => ({
          ...lPrev,
          tileProvider: nextTheme === 'light' ? 'street' : 'dark',
        }));
        return nextTheme;
      });
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        performToggle();
      });
    } else {
      performToggle();
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Optimistic UI for GPS
          handleSelectLocation({
            id: 'my-gps-loc',
            name: 'My GPS Location',
            area: 'Locating...',
            lat,
            lng,
            aqi: 0, category: 'good', pm25: 0, pm10: 0, rainfall: 0, temperature: 0, humidity: 0, windSpeed: '0 Km/h', no2: 0, o3: 0,
            advisories: { faceMask: 'NOT RECOMMENDED', airPurifier: 'NOT RECOMMENDED', outdoorExercise: 'RECOMMENDED', outdoorActivities: 'RECOMMENDED' },
            trend: 'stable', lastUpdated: 'Just now',
          });

          // Fetch real data
          try {
            const [geoRes, realEnvData] = await Promise.all([
              fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`).then(res => res.json()).catch(() => ({})),
              getFullLocationData(lat, lng).catch(() => ({} as Partial<AQILocation>))
            ]);

            const city = geoRes?.features?.[0]?.properties?.city || geoRes?.features?.[0]?.properties?.state || 'Current Position';

            handleSelectLocation({
              id: 'my-gps-loc',
              name: 'My GPS Location',
              area: city,
              lat,
              lng,
              aqi: realEnvData.aqi || 0,
              category: realEnvData.category || 'good',
              pm25: realEnvData.pm25 || 0,
              pm10: realEnvData.pm10 || 0,
              rainfall: realEnvData.rainfall || 0,
              temperature: realEnvData.temperature || 0,
              humidity: realEnvData.humidity || 0,
              windSpeed: realEnvData.windSpeed || '0 Km/h',
              no2: realEnvData.no2 || 0,
              o3: realEnvData.o3 || 0,
              advisories: realEnvData.advisories || { faceMask: 'NOT RECOMMENDED', airPurifier: 'NOT RECOMMENDED', outdoorExercise: 'RECOMMENDED', outdoorActivities: 'RECOMMENDED' },
              trend: 'stable',
              lastUpdated: 'Just now',
              forecastData: realEnvData.forecastData,
              trendDataMap: realEnvData.trendDataMap,
              nearbyStations: realEnvData.nearbyStations,
            });
          } catch (e) {
            console.error("Failed to fetch GPS data", e);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setMapCenter([28.5450, 77.3300]);
      setMapZoom(14);
    }
  };

  const handleToggleLayer = (key: keyof MapLayerState) => {
    setLayerState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectTileProvider = (provider: TileProvider) => {
    const updateTileAndTheme = () => {
      setLayerState((prev) => ({ ...prev, tileProvider: provider }));
      if (provider === 'street' || provider === 'satellite') {
        setTheme('light');
      } else if (provider === 'dark') {
        setTheme('dark');
      }
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        updateTileAndTheme();
      });
    } else {
      updateTileAndTheme();
    }
  };

  const handleLayerUpdateFromAI = (partialState: Partial<MapLayerState>) => {
    setLayerState((prev) => ({ ...prev, ...partialState }));
  };

  const handleSelectLocation = (loc: AQILocation) => {
    setSelectedLocation(loc);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(14);
  };

  const handleSearchSubmit = async (query: string) => {
    try {
      const geoResult = await import('@/lib/api-aqi').then(m => m.forwardGeocode(query));
      
      if (geoResult) {
        const { lat, lng, name } = geoResult;
        
        // Optimistic UI for Search
        handleSelectLocation({
          id: `search-${Date.now()}`,
          name: name,
          area: name,
          lat, lng,
          aqi: 0, category: 'good', pm25: 0, pm10: 0, rainfall: 0, temperature: 0, humidity: 0, windSpeed: '0 Km/h', no2: 0, o3: 0,
          advisories: { faceMask: 'NOT RECOMMENDED', airPurifier: 'NOT RECOMMENDED', outdoorExercise: 'RECOMMENDED', outdoorActivities: 'RECOMMENDED' },
          trend: 'stable', lastUpdated: 'Fetching...'
        });

        const realEnvData = await getFullLocationData(lat, lng);
        handleSelectLocation({
          id: `search-${Date.now()}`,
          name: name,
          area: name,
          lat, lng,
          aqi: realEnvData.aqi || 0,
          category: realEnvData.category || 'good',
          pm25: realEnvData.pm25 || 0,
          pm10: realEnvData.pm10 || 0,
          rainfall: realEnvData.rainfall || 0,
          temperature: realEnvData.temperature || 0,
          humidity: realEnvData.humidity || 0,
          windSpeed: realEnvData.windSpeed || '0 Km/h',
          no2: realEnvData.no2 || 0,
          o3: realEnvData.o3 || 0,
          advisories: realEnvData.advisories || { faceMask: 'NOT RECOMMENDED', airPurifier: 'NOT RECOMMENDED', outdoorExercise: 'RECOMMENDED', outdoorActivities: 'RECOMMENDED' },
          trend: 'stable',
          lastUpdated: 'Just now',
          forecastData: realEnvData.forecastData,
          trendDataMap: realEnvData.trendDataMap,
          nearbyStations: realEnvData.nearbyStations,
        });
      }
    } catch (e) {
      console.error("Failed to fetch search data", e);
    }
  };

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'settings') {
      setIsLayersMenuOpen(true);
    } else if (tab === 'air') {
      setLayerState((prev) => ({ ...prev, aqi: true }));
    }
  };

  // Track previous coordinates to prevent double-fetching routes when only metadata updates
  const prevCoordsRef = useRef<string>('');

  // Fetch Advanced AQR Route Data when both points exist
  useEffect(() => {
    if (routingMode && routeStart && selectedLocation) {
      const coordsKey = `${routeStart.lng},${routeStart.lat}|${selectedLocation.lng},${selectedLocation.lat}`;
      if (coordsKey === prevCoordsRef.current) return; // Skip if coordinates haven't changed
      prevCoordsRef.current = coordsKey;

      const fetchRoutes = async () => {
        setIsRouting(true);
        try {
          const { analyzeRoutes } = await import('@/lib/api-routing');
          
          const routes = await analyzeRoutes(
            routeStart.lng, routeStart.lat,
            selectedLocation.lng, selectedLocation.lat
          );
          
          setActiveRoutes(routes);
          if (routes.length > 0) {
            // Select the recommended route by default
            const recommended = routes.find(r => r.isRecommended) || routes[0];
            setSelectedRouteId(recommended.id);
            // We can also set routeData for legacy compatibility with AQRMapInner
            setRouteData({ geometry: { type: 'LineString', coordinates: recommended.path } });
          } else {
            setActiveRoutes([]);
            setRouteData(null);
          }
        } catch (e) {
          console.error("Failed to fetch AQR routes:", e);
          setActiveRoutes([]);
          setRouteData(null);
        } finally {
          setIsRouting(false);
        }
      };
      fetchRoutes();
    } else {
      setActiveRoutes([]);
      setRouteData(null);
    }
  }, [routingMode, routeStart, selectedLocation]);

  if (!isMounted) {
    return (
      <main 
        className="w-screen h-screen bg-[#000000] text-white flex items-center justify-center font-sans"
        suppressHydrationWarning
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-white/70 tracking-wider uppercase">Loading AQR Platform...</span>
        </div>
      </main>
    );
  }

  return (
    <main 
      className={`w-screen h-screen relative overflow-hidden font-sans transition-colors duration-500 ease-in-out ${
        theme === 'light' ? 'bg-neutral-100 text-neutral-900' : 'bg-[#000000] text-white'
      }`}
      suppressHydrationWarning
    >
      {/* 1. Left Floating Sidebar Navigation */}
      {isSideNavOpen && (
        <SideNav 
          activeTab={activeTab} 
          onSelectTab={handleTabSelect} 
          isExpanded={isSideNavExpanded}
          onToggleExpand={() => setIsSideNavExpanded(!isSideNavExpanded)}
          theme={theme}
        />
      )}

      {/* 2. Top Header Navbar */}
      {activeTab === 'map' && (
        <HeaderSearch
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          onSearchSubmit={handleSearchSubmit}
          onToggleSideNav={() => setIsSideNavOpen(!isSideNavOpen)}
          isSideNavOpen={isSideNavOpen}
          isSideNavExpanded={isSideNavExpanded}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          mapCenter={mapCenter}
          routingMode={routingMode}
          onToggleRouting={() => setRoutingMode(!routingMode)}
          routeStart={routeStart}
          onSelectRouteStart={setRouteStart}
          onRouteFetched={setRouteData}
        />
      )}

      {activeTab === 'map' ? (
        <>
          {/* 3. Hero Real Map View (Extends 100% full screen behind floating sidebar) */}
      <div className="absolute inset-0 w-full h-full">
        <AQRMap
          center={mapCenter}
          zoom={mapZoom}
          layerState={layerState}
          activeRoutes={activeRoutes}
          selectedRouteId={selectedRouteId}
          onSelectLocation={handleSelectLocation}
          selectedLocation={selectedLocation}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          routingMode={routingMode}
          routeStart={routeStart}
          onSelectRouteStart={setRouteStart}
          routeData={routeData}
          theme={theme}
        />
      </div>

      {/* 4. Routing Loading Overlay */}
      <AnimatePresence>
        {isRouting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`absolute top-28 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-[#1E1B1A]/95 border-white/10'
            }`}
          >
            <div className="w-4 h-4 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
            <span className={`text-xs font-bold tracking-wide uppercase ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
              Analyzing AQI Routes...
            </span>
          </motion.div>
        )}
      </AnimatePresence>      {/* 5. Floating Right-Side Circular Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        onToggleLayers={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
        isLayersOpen={isLayersMenuOpen}
        onToggleAQIMode={() => {
          setIsAQIMode(!isAQIMode);
          setLayerState((prev) => ({ ...prev, aqi: !prev.aqi }));
        }}
        isAQIMode={isAQIMode}
        theme={theme}
      />

      {/* 6. Floating Layers Selector Dialog */}
      <LayerMenu
        isOpen={isLayersMenuOpen}
        onClose={() => setIsLayersMenuOpen(false)}
        layerState={layerState}
        onToggleLayer={handleToggleLayer}
        onSelectTileProvider={handleSelectTileProvider}
        theme={theme}
      />

      {/* 7. AQI Bottom Details Drawer */}
      <AQIDetailsDrawer 
        location={selectedLocation} 
        isSideNavOpen={isSideNavOpen} 
        isSideNavExpanded={isSideNavExpanded}
        theme={theme}
        routingMode={routingMode}
        activeRoutes={activeRoutes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={(id) => setSelectedRouteId(id)}
      />

        {/* 8. Floating AQR AI Agent */}
        <AQRFloatingAgent
          activeRoutes={activeRoutes}
          routeStart={routeStart}
          selectedLocation={selectedLocation}
          onActivateRoutes={(routes) => {
            if (!routes || routes.length === 0) return; // Prevent crash if mock array is empty
            setActiveRoutes(routes);
            const rec = routes.find((r) => r.isRecommended) || routes[0];
            if (rec) setSelectedRouteId(rec.id);
          }}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          activeRouteId={selectedRouteId}
          onLayerUpdate={handleLayerUpdateFromAI}
          onZoomTo={(lat, lng) => {
            setMapCenter([lat, lng]);
            setMapZoom(14);
          }}
          theme={theme}
        />
        </>
      ) : activeTab === 'air' ? (
        <AirDashboard 
          location={selectedLocation} 
          theme={theme} 
          isSideNavOpen={isSideNavOpen} 
          isSideNavExpanded={isSideNavExpanded}
          onLocate={handleLocate}
          onSearchSubmit={handleSearchSubmit}
          isLocating={isLocating}
        />
      ) : activeTab === 'zones' ? (
        <ZonesDashboard theme={theme} isSideNavOpen={isSideNavOpen} isSideNavExpanded={isSideNavExpanded} />
      ) : activeTab === 'aws-infra' ? (
        <AWSInfraDashboard theme={theme} isSideNavOpen={isSideNavOpen} isSideNavExpanded={isSideNavExpanded} />
      ) : activeTab === 'agents' ? (
        <AgentsDashboard theme={theme} isSideNavOpen={isSideNavOpen} isSideNavExpanded={isSideNavExpanded} />
      ) : activeTab === 'runtime-console' ? (
        <RuntimeConsole theme={theme} isSideNavOpen={isSideNavOpen} isSideNavExpanded={isSideNavExpanded} />
      ) : activeTab === 'aqr-ai' ? (
        <AqrAiDashboard theme={theme} isSideNavOpen={isSideNavOpen} isSideNavExpanded={isSideNavExpanded} />
      ) : (
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${
          theme === 'light' ? 'bg-neutral-50' : 'bg-[#0A0A0C]'
        }`}>
          <div className={`text-center space-y-4 ${isSideNavOpen && isSideNavExpanded ? 'ml-[268px]' : (isSideNavOpen ? 'ml-[110px]' : '')} transition-all duration-300`}>
            <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center shadow-[0_0_40px_rgba(255,85,0,0.2)] ${
              theme === 'light' ? 'border-[#FF5500]/20 bg-[#FF5500]/5' : 'border-[#FF5500]/20 bg-[#FF5500]/10'
            }`}>
              <div className="text-4xl animate-pulse">🚀</div>
            </div>
            <h1 className={`text-4xl font-black tracking-tight ${theme === 'light' ? 'text-neutral-900' : 'text-white'}`}>
              <span className="capitalize">{activeTab}</span> <span className="text-[#FF5500]">Dashboard</span>
            </h1>
            <p className={`text-lg font-medium max-w-md mx-auto ${theme === 'light' ? 'text-neutral-500' : 'text-white/50'}`}>
              We are actively building this module. It will be available in the next major update!
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
