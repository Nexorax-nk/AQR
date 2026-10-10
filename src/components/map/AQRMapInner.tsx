'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
// @ts-ignore
import Map, { Source, Layer, Marker, MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

if (typeof window !== 'undefined') {
  // Fix for Next.js Turbopack failing to load the Web Worker
  if (maplibregl.setWorkerUrl) {
    maplibregl.setWorkerUrl('/maplibre-worker.mjs');
  }
}
import { AQILocation, MapLayerState, RouteOption, AQICategory } from '@/lib/types';
import { AQI_LOCATIONS, AQI_COLORS, FIRE_HOTSPOTS, MONITORING_STATIONS, getAQICategory } from '@/lib/aqi-data';
import { getAQIForWaypoints, filterOceanWaypoints, getFullLocationData } from '@/lib/api-aqi';

interface AQRMapInnerProps {
  center: [number, number]; // [lat, lng]
  zoom: number;
  layerState: MapLayerState;
  activeRoutes?: RouteOption[];
  selectedRouteId?: string;
  onSelectLocation?: (location: AQILocation) => void;
  selectedLocation?: AQILocation | null;
  onSelectRoute?: (routeId: string) => void;
  routingMode?: boolean;
  routeStart?: AQILocation | null;
  onSelectRouteStart?: (loc: AQILocation) => void;
  routeData?: any;
  theme?: 'light' | 'dark';
}

export default function AQRMapInner({
  center,
  zoom,
  layerState,
  activeRoutes = [],
  selectedRouteId,
  onSelectLocation,
  selectedLocation,
  onSelectRoute,
  routingMode,
  routeStart,
  onSelectRouteStart,
  routeData,
  theme = 'dark',
}: AQRMapInnerProps) {
  const mapRef = useRef<MapRef>(null);
  const searchMarkerRef = useRef<HTMLDivElement>(null);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState<'start' | 'end' | null>(null);
  const [gridMarkers, setGridMarkers] = useState<{lng: number, lat: number, aqi: number}[]>([]);
  const [mapBounds, setMapBounds] = useState<{ sw: { lng: number, lat: number }, ne: { lng: number, lat: number }, zoom: number } | null>(null);

  // Custom Event listener for Drop Pin logic
  useEffect(() => {
    const handler = (e: any) => {
      setIsSelectingOnMap(e.detail.target);
    };
    window.addEventListener('enable-map-selection', handler);
    return () => window.removeEventListener('enable-map-selection', handler);
  }, []);

  // Fetch AQI grid whenever AQI layer is on and map moves
  useEffect(() => {
    if (layerState.aqi && mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = mapBounds ? mapBounds : { sw: map.getBounds().getSouthWest(), ne: map.getBounds().getNorthEast(), zoom: map.getZoom() };
      
      if (bounds.zoom >= 10) {
        const sw = bounds.sw;
        const ne = bounds.ne;
        const spanLng = ne.lng - sw.lng;
        const spanLat = ne.lat - sw.lat;
        
        let gridSize = Math.sqrt((spanLng * spanLat) / 45);
        gridSize = Math.max(gridSize, 0.001);

        const waypoints: [number, number][] = [];
        const startLng = Math.floor(sw.lng / gridSize) * gridSize;
        const endLng = Math.ceil(ne.lng / gridSize) * gridSize;
        const startLat = Math.floor(sw.lat / gridSize) * gridSize;
        const endLat = Math.ceil(ne.lat / gridSize) * gridSize;

        for (let lng = startLng; lng <= endLng; lng += gridSize) {
          for (let lat = startLat; lat <= endLat; lat += gridSize) {
            const seed = Math.abs(Math.sin(lng * 12.9898 + lat * 78.233) * 43758.5453);
            const fraction = seed - Math.floor(seed);
            if (fraction > 0.35) {
              const jitterLng = (Math.abs(Math.sin(seed * 1.1)) - 0.5) * gridSize * 0.8;
              const jitterLat = (Math.abs(Math.cos(seed * 1.2)) - 0.5) * gridSize * 0.8;
              waypoints.push([lng + jitterLng, lat + jitterLat]);
            }
          }
        }

        waypoints.sort((a, b) => (Math.sin(a[0] * b[1]) > 0 ? 1 : -1));
        const limitedWaypoints = waypoints.slice(0, 40);

        filterOceanWaypoints(limitedWaypoints).then((landWaypoints: [number, number][]) => {
          if (landWaypoints.length === 0) {
            setGridMarkers([]);
            return;
          }
          getAQIForWaypoints(landWaypoints).then((aqiValues: number[]) => {
            setGridMarkers(landWaypoints.map((wp: [number, number], i: number) => ({
              lng: wp[0],
              lat: wp[1],
              aqi: aqiValues[i] || 50,
            })));
          }).catch(console.error);
        });
      } else {
        setGridMarkers([]);
      }
    } else {
      setGridMarkers([]);
    }
  }, [layerState.aqi, mapBounds]);

  const [boundaryGeoJson, setBoundaryGeoJson] = React.useState<any>(null);

  // Fetch boundary polygon for searched locations
  useEffect(() => {
    if (!selectedLocation?.id.startsWith('geo-')) {
      setBoundaryGeoJson(null);
      return;
    }
    
    const parts = selectedLocation.id.split('-');
    if (parts.length >= 3) {
      const type = parts[1].toUpperCase(); // R, W, N
      const osmId = parts[2];
      fetch(`https://nominatim.openstreetmap.org/lookup?osm_ids=${type}${osmId}&polygon_geojson=1&format=json`)
        .then(res => res.json())
        .then(data => {
          // Only show true administrative boundaries (not Points)
          if (data && data[0] && data[0].geojson && data[0].geojson.type !== 'Point') {
            setBoundaryGeoJson(data[0].geojson);
          } else {
            setBoundaryGeoJson(null); // No fake circles, just drop a pin
          }
        })
        .catch(err => {
          console.error(err);
          setBoundaryGeoJson(null);
        });
    }
  }, [selectedLocation?.id]);

  // Dynamic map style based on layerState.tileProvider
  const mapStyle = useMemo(() => {
    const style: any = {
      version: 8,
      sources: {},
      layers: [],
    };

    const tileOptions = {
      type: 'raster',
      tileSize: 256,
    };

    if (layerState.tileProvider === 'satellite') {
      style.sources['esri-sat'] = { ...tileOptions, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], maxzoom: 19 };
      style.sources['esri-sat-labels'] = { ...tileOptions, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'], maxzoom: 19 };
      style.layers.push({ id: 'sat', type: 'raster', source: 'esri-sat', minzoom: 0, maxzoom: 24 });
      style.layers.push({ id: 'sat-labels', type: 'raster', source: 'esri-sat-labels', minzoom: 0, maxzoom: 24 });
    } else if (layerState.tileProvider === 'street') {
      style.sources['gmaps'] = { ...tileOptions, tiles: ['https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2', 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2', 'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2', 'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2'], maxzoom: 20 };
      style.layers.push({ id: 'gmaps-layer', type: 'raster', source: 'gmaps', minzoom: 0, maxzoom: 24 });
    } else {
      // Dark (ESRI Dark Gray Canvas)
      style.sources['esri-dark'] = { ...tileOptions, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'], maxzoom: 16 };
      style.sources['esri-dark-labels'] = { ...tileOptions, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'], maxzoom: 16 };
      
      style.layers.push({ id: 'dark', type: 'raster', source: 'esri-dark', minzoom: 0, maxzoom: 24 });
      style.layers.push({ id: 'dark-labels', type: 'raster', source: 'esri-dark-labels', minzoom: 0, maxzoom: 24 });
    }

    return style;
  }, [layerState.tileProvider]);

  const prevLocationId = useRef<string | undefined>(undefined);

  // Handle external center/zoom changes (like +/- buttons) and location selection
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const currentZoom = map.getZoom();
      
      const isNewLocation = selectedLocation && selectedLocation.id !== prevLocationId.current;
      if (selectedLocation) prevLocationId.current = selectedLocation.id;

      // If we just selected a new location that has an extent bbox, fit the map to it!
      if (isNewLocation && selectedLocation.extent) {
         const [minLon, maxLat, maxLon, minLat] = selectedLocation.extent;
         map.fitBounds(
           [[minLon, minLat], [maxLon, maxLat]], 
           { padding: 80, duration: 2000 }
         );
         return;
      }
      
      // If the difference is just a zoom step (buttons), use smooth continuous zoom
      if (Math.abs(currentZoom - zoom) >= 0.5) {
         map.flyTo({ center: [center[1], center[0]], zoom: zoom, duration: 1200 }); // Slowed down from 600 to 1200
      } else {
         // Fallback Location jump (for GPS / locations without extent)
         map.flyTo({ center: [center[1], center[0]], zoom: zoom, duration: 2000 }); // Slowed down from 1200 to 2000
      }
    }
  }, [center, zoom, selectedLocation]);

  // Fit bounds to route when it loads
  useEffect(() => {
    if (mapRef.current && routingMode && routeData?.geometry?.coordinates) {
      const coords = routeData.geometry.coordinates;
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      coords.forEach((c: [number, number]) => {
         minLng = Math.min(minLng, c[0]);
         maxLng = Math.max(maxLng, c[0]);
         minLat = Math.min(minLat, c[1]);
         maxLat = Math.max(maxLat, c[1]);
      });
      if (minLng !== Infinity) {
        mapRef.current.getMap().fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 100, duration: 2000 }
        );
      }
    }
  }, [routeData, routingMode]);

  return (
    <div className="relative w-full h-full bg-[#0A0A0C]">
      {/* Subtle Vignette Overlay for premium depth without dimming the map */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 70%, rgba(10, 10, 12, 0.4) 100%)'
        }} 
      />
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: zoom,
        }}
        onLoad={(e) => {
          // Slow down the native trackpad/scroll wheel zoom speeds
          if (e.target.scrollZoom) {
            e.target.scrollZoom.setWheelZoomRate(1 / 600); // Default is faster
            e.target.scrollZoom.setZoomRate(1 / 200);      // For touchpads
          }
        }}
        mapStyle={mapStyle}
        mapLib={maplibregl as any}
        cursor={isSelectingOnMap ? 'crosshair' : 'auto'}
        maxPitch={0} // Disable 3D tilt to save GPU
        dragRotate={false} // Keep it strictly 2D
        attributionControl={false}
        onMove={(e) => {
          // You can add other onMove logic here if needed
        }}
        onMoveEnd={async () => {
          if (!layerState.aqi || !mapRef.current) return;
          
          const map = mapRef.current.getMap();
          const bounds = map.getBounds();
          const zoomLevel = map.getZoom();
          
          // Only generate dense grid if zoomed in enough (e.g. > 10) to avoid excessive API calls
          if (zoomLevel < 10) {
            setGridMarkers([]);
            return;
          }

          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();

          // Create a deterministic, organic sensor network using spatial hashing
          // This looks exactly like a real crowdsourced network (like PurpleAir/WAQI)
          const spanLng = ne.lng - sw.lng;
          const spanLat = ne.lat - sw.lat;
          
          let gridSize = Math.sqrt((spanLng * spanLat) / 45);
          gridSize = Math.max(gridSize, 0.001);

          const waypoints: [number, number][] = [];
          
          const startLng = Math.floor(sw.lng / gridSize) * gridSize;
          const endLng = Math.ceil(ne.lng / gridSize) * gridSize;
          const startLat = Math.floor(sw.lat / gridSize) * gridSize;
          const endLat = Math.ceil(ne.lat / gridSize) * gridSize;

          for (let lng = startLng; lng <= endLng; lng += gridSize) {
            for (let lat = startLat; lat <= endLat; lat += gridSize) {
              // Stable pseudo-random seed for this specific grid cell
              const seed = Math.abs(Math.sin(lng * 12.9898 + lat * 78.233) * 43758.5453);
              const fraction = seed - Math.floor(seed);
              
              // Only place a sensor in ~65% of grid cells to look organic (not a perfect grid)
              if (fraction > 0.35) {
                // Add stable organic jitter within the cell
                const jitterLng = (Math.abs(Math.sin(seed * 1.1)) - 0.5) * gridSize * 0.8;
                const jitterLat = (Math.abs(Math.cos(seed * 1.2)) - 0.5) * gridSize * 0.8;
                waypoints.push([lng + jitterLng, lat + jitterLat]);
              }
            }
          }

          // Deterministic shuffle so IF we hit the 40 limit, it drops points globally, not just from the right edge
          waypoints.sort((a, b) => (Math.sin(a[0] * b[1]) > 0 ? 1 : -1));
          const limitedWaypoints = waypoints.slice(0, 40);

          // Fetch real AQI from Open-Meteo for this organic layout (filtered by land)
          try {
            const landWaypoints: [number, number][] = await filterOceanWaypoints(limitedWaypoints);
            if (landWaypoints.length === 0) {
              setGridMarkers([]);
              return;
            }
            const aqiValues: number[] = await getAQIForWaypoints(landWaypoints);
            const newMarkers = landWaypoints.map((wp: [number, number], i: number) => ({
              lng: wp[0],
              lat: wp[1],
              aqi: aqiValues[i] || 50,
            }));
            setGridMarkers(newMarkers);
          } catch (e) {
            // Silently fallback without logging to prevent Next.js Error Overlay
          }
        }}
        onClick={async (e) => {
          if (routingMode && isSelectingOnMap) {
            const target = isSelectingOnMap;
            setIsSelectingOnMap(null); // Reset immediately after one click
            
            const { lng, lat } = e.lngLat;
            
            // IMMEDIDATELY drop a loading pin so the UI responds instantly
            const fallbackLocation: AQILocation = {
              id: `route-${target}-pin`,
              name: 'Locating...',
              area: 'Fetching data...',
              lat,
              lng,
              aqi: 0, category: 'good', pm25: 0, pm10: 0, rainfall: 0, temperature: 0, humidity: 0, windSpeed: '0 Km/h', no2: 0, o3: 0,
              advisories: { faceMask: 'NOT RECOMMENDED', airPurifier: 'NOT RECOMMENDED', outdoorExercise: 'RECOMMENDED', outdoorActivities: 'RECOMMENDED' },
              trend: 'stable', lastUpdated: 'Just now'
            };

            if (target === 'start' && onSelectRouteStart) {
              onSelectRouteStart(fallbackLocation);
            } else if (target === 'end' && onSelectLocation) {
              onSelectLocation(fallbackLocation);
            }

            // ASYNCHRONOUSLY fetch the real name and environmental data in the background
            Promise.all([
              fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`).then(res => res.json()).catch(() => ({})),
              getFullLocationData(lat, lng).catch(() => ({} as Partial<AQILocation>))
            ]).then(([geoData, realEnvData]) => {
              const name = geoData?.features?.[0]?.properties?.name || 'Dropped Pin';
              const city = geoData?.features?.[0]?.properties?.city || '';
              
              const updatedLocation: AQILocation = {
                ...fallbackLocation,
                name,
                area: city,
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
                advisories: realEnvData.advisories || fallbackLocation.advisories
              };

              if (target === 'start' && onSelectRouteStart) {
                onSelectRouteStart(updatedLocation);
              } else if (target === 'end' && onSelectLocation) {
                onSelectLocation(updatedLocation);
              }
            });
          }
        }}
      >
        {/* Real AQI Pin Markers */}
        {layerState.aqi &&
          gridMarkers.map((marker, idx) => {
            const category = getAQICategory(marker.aqi) as AQICategory;
            const colorInfo = AQI_COLORS[category] || AQI_COLORS['good'];

            return (
              <Marker
                key={`grid-marker-${idx}`}
                longitude={marker.lng}
                latitude={marker.lat}
                anchor="bottom"
              >
                <div className="aqi-marker-wrapper group cursor-pointer transition-transform hover:scale-110 hover:z-50">
                  <div
                    className="aqi-pin-bubble shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: colorInfo.bg, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, color: colorInfo.text }}
                  >
                    <span className="font-bold text-[11px] px-0.5">{marker.aqi}</span>
                  </div>
                </div>
              </Marker>
            );
          })}
        {layerState.aqi &&
          AQI_LOCATIONS.map((loc) => {
            const colorInfo = AQI_COLORS[loc.category];
            const isSelected = selectedLocation?.id === loc.id;

            return (
              <Marker
                key={loc.id}
                longitude={loc.lng}
                latitude={loc.lat}
                anchor={isSelected ? 'center' : 'bottom'}
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  if (onSelectLocation) onSelectLocation(loc);
                  mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 14, duration: 800 });
                }}
              >
                {isSelected ? (
                  <div
                    className="aqi-circle-badge"
                    style={{ backgroundColor: colorInfo.bg }}
                  >
                    <svg className="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                    <span>{loc.aqi}</span>
                  </div>
                ) : (
                  <div className="aqi-marker-wrapper">
                    <div
                      className="aqi-pin-bubble"
                      style={{ backgroundColor: colorInfo.bg, borderColor: '#FFFFFF' }}
                    >
                      {loc.aqi}
                    </div>
                  </div>
                )}
              </Marker>
            );
          })}

        {selectedLocation && !AQI_LOCATIONS.find(loc => loc.id === selectedLocation.id) && (
          <Marker
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            anchor="bottom"
          >
            <div ref={searchMarkerRef} className="relative flex flex-col items-center justify-end group cursor-pointer" style={{ transition: 'transform 0.1s ease-out' }}>
              <div style={{ transform: routingMode ? 'scale(0.5)' : 'scale(0.75)', transformOrigin: 'bottom center', transition: 'transform 0.3s ease' }} className="relative flex flex-col items-center justify-end">
                {/* Glowing base plate that stays on the ground */}
                <div className="absolute bottom-[2px] w-10 h-3 bg-[#FF5500]/70 rounded-[100%] blur-[5px]" />
                <div className="absolute bottom-[4px] w-5 h-1.5 bg-[#FF5500] rounded-[100%] blur-[2px]" />
  
                {/* Bouncing Premium Teardrop Pin */}
                <div className="relative z-10 animate-bounce pb-2" style={{ animationDuration: '2s' }}>
                  <svg width="44" height="54" viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_12px_16px_rgba(255,85,0,0.5)]">
                    {/* Pin Body with vibrant orange gradient */}
                    <path d="M22 0C9.85 0 0 9.85 0 22C0 35.15 20.15 52.6 20.9 53.3C21.5 53.85 22.5 53.85 23.1 53.3C23.85 52.6 44 35.15 44 22C44 9.85 34.15 0 22 0Z" fill="url(#pin-gradient)" />
                    
                    {/* Subtle Top Edge Highlight for 3D effect */}
                    <path d="M22 1.5C10.6 1.5 1.5 10.6 1.5 22C1.5 22.4 1.2 22.8 0.8 22.8C0.3 22.8 0 22.4 0 22C0 9.8 9.8 0 22 0C34.2 0 44 9.8 44 22C44 22.4 43.7 22.8 43.2 22.8C42.8 22.8 42.5 22.4 42.5 22C42.5 10.6 33.4 1.5 22 1.5Z" fill="white" fillOpacity="0.4" />
                    
                    {/* Inner Dark Hole */}
                    <circle cx="22" cy="21" r="11" fill="#0A0A0C" className="shadow-inner" />
                    
                    {/* Glowing Core Dot */}
                    <circle cx="22" cy="21" r="5" fill="#FFFFFF" className="animate-pulse" style={{ animationDuration: '1.5s' }} />
                    <circle cx="22" cy="21" r="5" fill="url(#core-glow)" fillOpacity="0.5" />
  
                    <defs>
                      <linearGradient id="pin-gradient" x1="22" y1="0" x2="22" y2="54" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF7700" />
                        <stop offset="1" stopColor="#D93600" />
                      </linearGradient>
                      <radialGradient id="core-glow" cx="22" cy="21" r="10" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFFFFF" />
                        <stop offset="1" stopColor="#FF5500" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </Marker>
        )}

        {/* Dynamic City Boundary */}
        {boundaryGeoJson && (
          <Source id="search-boundary" type="geojson" data={boundaryGeoJson}>
            <Layer 
              id="search-boundary-fill" 
              type="fill" 
              paint={{ 'fill-color': '#FF5500', 'fill-opacity': 0.05 }} 
            />
            <Layer 
              id="search-boundary-line" 
              type="line" 
              paint={{ 'line-color': '#FF5500', 'line-width': 2.5, 'line-opacity': 0.9, 'line-dasharray': [2, 2] }} 
            />
          </Source>
        )}

        {/* Routes Polylines (Drawn via WebGL, super sharp) */}
        {activeRoutes?.length > 0 &&
          activeRoutes.map((route) => {
            const isSelected = selectedRouteId ? selectedRouteId === route.id : route.isRecommended;
            
            // If it's not the selected route, don't render it at all to prevent overlapping z-index issues
            if (!isSelected) return null;
            
            // Premium Google Maps-like Route Styling
            const primaryColor = theme === 'light' ? '#3B82F6' : '#FF5500';
            const casingColor = theme === 'light' ? '#2563EB' : '#C24100'; 
            
            // Maplibre expects [longitude, latitude]
            const geojson: any = {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.path, // Already in [lng, lat] from Mapbox/OSRM
              },
            };

            return (
              <Source key={`source-${route.id}`} id={`source-${route.id}`} type="geojson" data={geojson}>
                {/* Route Casing (Border) */}
                <Layer
                  id={`route-casing-${route.id}`}
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': casingColor,
                    'line-width': 8,
                    'line-opacity': 1.0,
                  }}
                />
                {/* Route Inner Fill */}
                <Layer
                  id={`route-line-${route.id}`}
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': primaryColor,
                    'line-width': 5,
                    'line-opacity': 1.0,
                  }}
                />
              </Source>
            );
          })}

        {/* Extra Layers: Fires */}
        {layerState.satelliteFires &&
          FIRE_HOTSPOTS.map((fire, i) => (
            <Marker key={`fire-${i}`} longitude={fire.lng} latitude={fire.lat} anchor="center">
              <div className="w-6 h-6 rounded-full bg-[#EE3E3E] border border-white text-white text-xs flex items-center justify-center font-bold shadow-lg">
                🔥
              </div>
            </Marker>
          ))}

        {/* Extra Layers: Monitoring Stations */}
        {layerState.monitoring &&
          MONITORING_STATIONS.map((station, i) => (
            <Marker key={`station-${i}`} longitude={station.lng} latitude={station.lat} anchor="center">
              <div className="w-6 h-6 rounded-full bg-[#953BD3] border border-white text-white text-xs flex items-center justify-center shadow-lg">
                📡
              </div>
            </Marker>
          ))}

        {/* Start Route Marker */}
        {routingMode && routeStart && (
          <Marker longitude={routeStart.lng} latitude={routeStart.lat} anchor="center">
             <div className={`w-5 h-5 bg-white border-[4px] ${theme === 'light' ? 'border-[#3B82F6]' : 'border-[#FF5500]'} rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)]`} />
          </Marker>
        )}

      </Map>
    </div>
  );
}
