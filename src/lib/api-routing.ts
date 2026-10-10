// AQR Routing Engine - Core API Utility
// This file handles fetching multiple candidate routes between two points.

import { RouteOption, AQICategory } from '@/lib/types';
import { getAQICategory, AQI_COLORS } from '@/lib/aqi-data';
import { getAQIForWaypoints } from '@/lib/api-aqi';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/**
 * Route Geometry type definition
 */
interface RouteCandidate {
  distance?: number;
  duration?: number;
  geometry?: {
    type: string;
    coordinates: [number, number][];
  };
  [key: string]: unknown;
}

/**
 * Fetches routing candidates from Mapbox Directions API.
 * Requests alternative routes and GeoJSON geometry.
 */
export async function getRouteCandidates(startLng: number, startLat: number, endLng: number, endLat: number): Promise<RouteCandidate[]> {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn('Mapbox Token is missing! Falling back to OSRM Public API for demonstration.');
    return getFallbackRoutesOSRM(startLng, startLat, endLng, endLat);
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startLng},${startLat};${endLng},${endLat}?alternatives=true&geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from Mapbox');
    const data = await res.json();
    
    return data.routes; // Array of route objects
  } catch (error) {
    console.error('Mapbox Routing Error:', error);
    // Fallback if Mapbox fails
    return getFallbackRoutesOSRM(startLng, startLat, endLng, endLat);
  }
}

/**
 * Fallback to Public OSRM API if Mapbox token is unavailable.
 * Completely free, no API key required, provides multiple routes.
 */
async function getFallbackRoutesOSRM(startLng: number, startLat: number, endLng: number, endLat: number) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?alternatives=3&geometries=geojson&overview=full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from OSRM');
    const data = await res.json();
    return data.routes;
  } catch (error) {
    console.error('OSRM Routing Error:', error);
    return [];
  }
}

/**
 * The Core AQR Engine: Analyzes route geometries and calculates actual AQI exposure.
 */
export async function analyzeRoutes(startLng: number, startLat: number, endLng: number, endLat: number): Promise<RouteOption[]> {
  const routes = await getRouteCandidates(startLng, startLat, endLng, endLat);
  
  if (!routes || routes.length === 0) return [];

  const analyzedRoutes: RouteOption[] = [];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const distanceKm = (route.distance || 0) / 1000;
    const durationMins = (route.duration || 0) / 60;
    
    // Geometry can be a string (encoded polyline) or GeoJSON object depending on the API.
    // Both Mapbox and OSRM with geometries=geojson return an object: { type: 'LineString', coordinates: [...] }
    let coords: [number, number][] = [];
    if (route.geometry && route.geometry.coordinates) {
      coords = route.geometry.coordinates;
    } else {
      continue; // Skip if no geometry
    }

    // Downsample coordinates to ~15 points per route to avoid API rate limits while keeping accuracy
    const sampleSize = 15;
    const step = Math.max(1, Math.floor(coords.length / sampleSize));
    const sampledCoords = coords.filter((_, index) => index % step === 0);
    
    // Ensure the destination is always included in the sample
    if (sampledCoords[sampledCoords.length - 1] !== coords[coords.length - 1]) {
      sampledCoords.push(coords[coords.length - 1]);
    }

    // Fetch REAL AQI for the specific points along this exact route!
    let aqiValues: number[] = [];
    try {
      aqiValues = await getAQIForWaypoints(sampledCoords);
    } catch (e) {
      console.error('Failed to fetch AQI for route', e);
      // Fallback fake AQI for demo if API fails
      aqiValues = sampledCoords.map(() => 50 + Math.random() * 80);
    }

    // Calculate Average Exposure
    const totalAQI = aqiValues.reduce((sum, val) => sum + val, 0);
    const avgAQI = Math.round(totalAQI / aqiValues.length);
    const aqiCategory = getAQICategory(avgAQI) as AQICategory;
    const colorInfo = AQI_COLORS[aqiCategory] || AQI_COLORS['good'];

    analyzedRoutes.push({
      id: `route-${i}`,
      name: i === 0 ? 'Primary Route' : `Alternative ${i}`,
      tag: 'BALANCED', // Will be determined in the ranking step
      distanceKm: Number(distanceKm.toFixed(1)),
      durationMins: Math.round(durationMins),
      avgAQI,
      aqiCategory,
      color: colorInfo.bg,
      aqiDiffText: '', // Will be set in ranking
      path: coords,
      description: `Travel time is ${Math.round(durationMins)} mins with an average exposure of ${avgAQI} AQI.`,
    });
  }

  // RANKING LOGIC (The magic of AQR)
  if (analyzedRoutes.length > 0) {
    // Sort by duration to find the fastest
    const sortedByTime = [...analyzedRoutes].sort((a, b) => a.durationMins - b.durationMins);
    const fastestRoute = sortedByTime[0];
    fastestRoute.tag = 'FASTEST';
    fastestRoute.name = 'Fastest Route';

    // Sort by AQI to find the cleanest
    const sortedByAQI = [...analyzedRoutes].sort((a, b) => a.avgAQI - b.avgAQI);
    const cleanestRoute = sortedByAQI[0];
    
    if (cleanestRoute.id !== fastestRoute.id) {
      cleanestRoute.tag = 'CLEANEST';
      cleanestRoute.name = 'Healthiest Route';
      cleanestRoute.isRecommended = true; // AQR always recommends the cleanest if it's different!
      
      const timeDiff = cleanestRoute.durationMins - fastestRoute.durationMins;
      const aqiSaved = fastestRoute.avgAQI - cleanestRoute.avgAQI;
      
      cleanestRoute.aqiDiffText = `Breathe ${aqiSaved} less AQI for just +${timeDiff} mins`;
      cleanestRoute.description = `Recommended! You avoid highly polluted zones for a small detour of ${timeDiff} minutes.`;
      
      fastestRoute.aqiDiffText = `High exposure warning (+${aqiSaved} AQI)`;
    } else {
      fastestRoute.tag = 'CLEANEST';
      fastestRoute.name = 'Fastest & Healthiest';
      fastestRoute.isRecommended = true;
      fastestRoute.aqiDiffText = 'Best all-around route';
    }
  }

  // Sort final array: Recommended first, then fastest, then others
  return analyzedRoutes.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
}
