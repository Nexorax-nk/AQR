// AQR Intelligence Engine
// Fuses Routing Geometries with Environmental Data to rank and recommend routes.

import { RouteOption } from '@/lib/types';
import { getAQICategory, AQI_COLORS } from '@/lib/aqi-data';
import { getRouteCandidates } from './api-routing';
import { getAQIForWaypoints } from './api-aqi';

// Helper to decode OSRM/Mapbox polyline (if geometry is not geojson)
// For this implementation, we assume we request geojson geometry directly from the API.

/**
 * Main AQR Engine Function
 * Takes a start and end point, fetches alternative routes, samples environmental data,
 * and classifies them into Fastest, Cleanest, and Balanced.
 */
export async function calculateAQRRoutes(startLng: number, startLat: number, endLng: number, endLat: number): Promise<RouteOption[]> {
  // 1. Fetch Candidate Routes
  const candidates = await getRouteCandidates(startLng, startLat, endLng, endLat);
  
  if (!candidates || candidates.length === 0) {
    throw new Error('No routes found.');
  }

  const processedRoutes: RouteOption[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const route = candidates[i];
    
    // Extract path (array of [lng, lat])
    let path: [number, number][] = [];
    if (route.geometry && route.geometry.type === 'LineString') {
      path = route.geometry.coordinates;
    } else {
      // Fallback if it's encoded (shouldn't happen since we request geojson)
      continue;
    }

    // 2. Route Sampling
    // Sample a waypoint every ~10% of the route to avoid overloading the API
    const sampleCount = 5; 
    const step = Math.max(1, Math.floor(path.length / sampleCount));
    const waypoints: [number, number][] = [];
    
    for (let j = 0; j < path.length; j += step) {
      waypoints.push(path[j]);
    }
    // Ensure the last point is included
    if (waypoints[waypoints.length - 1] !== path[path.length - 1]) {
      waypoints.push(path[path.length - 1]);
    }

    // 3. Fetch AQI for Waypoints
    const aqiData = await getAQIForWaypoints(waypoints);
    
    // 4. Calculate Total Exposure & Averages
    const avgAQI = Math.round(aqiData.reduce((a, b) => a + b, 0) / aqiData.length);
    
    const durationMins = Math.round((route.duration || 0) / 60);
    const distanceKm = Number(((route.distance || 0) / 1000).toFixed(1));

    processedRoutes.push({
      id: `route-${i}`,
      name: `Route Option ${i + 1}`,
      tag: 'FASTEST', // Temporary, will be assigned below
      distanceKm,
      durationMins,
      avgAQI,
      aqiCategory: getAQICategory(avgAQI),
      color: '#ffffff', // Temporary
      aqiDiffText: '',
      path,
      description: 'Analyzing...'
    });
  }

  // 5. Route Classification (Fastest, Cleanest, Balanced)
  if (processedRoutes.length === 1) {
    processedRoutes[0].tag = 'BALANCED';
    processedRoutes[0].color = '#FF5500';
    processedRoutes[0].isRecommended = true;
    processedRoutes[0].description = 'Only one route available.';
    return processedRoutes;
  }

  // Find extremes
  const fastestRoute = [...processedRoutes].sort((a, b) => a.durationMins - b.durationMins)[0];
  const cleanestRoute = [...processedRoutes].sort((a, b) => a.avgAQI - b.avgAQI)[0];
  
  // Calculate a "Balanced" score. Lower is better.
  // We normalize time and AQI against the minimums.
  processedRoutes.forEach(r => {
    const timeScore = r.durationMins / fastestRoute.durationMins; // 1.0 is best
    const aqiScore = r.avgAQI / cleanestRoute.avgAQI; // 1.0 is best
    (r as any)._balancedScore = (timeScore * 0.5) + (aqiScore * 0.5);
  });

  const balancedRoute = [...processedRoutes].sort((a, b) => (a as any)._balancedScore - (b as any)._balancedScore)[0];

  // Assign Tags
  processedRoutes.forEach(r => {
    if (r.id === cleanestRoute.id) {
      r.tag = 'CLEANEST';
      r.color = '#10B981'; // Green
      r.description = 'Lowest pollution exposure.';
    } else if (r.id === fastestRoute.id) {
      r.tag = 'FASTEST';
      r.color = '#E03D3D'; // Red
      r.description = 'Shortest travel time, higher exposure.';
    } else {
      r.tag = 'BALANCED';
      r.color = '#FF5500'; // Orange
      r.description = 'Best tradeoff between time and air quality.';
      r.isRecommended = true;
    }
  });

  // If fastest is also cleanest, it becomes balanced/recommended
  if (fastestRoute.id === cleanestRoute.id) {
    fastestRoute.tag = 'BALANCED';
    fastestRoute.color = '#FF5500';
    fastestRoute.isRecommended = true;
    fastestRoute.description = 'Optimal route: Fastest and Cleanest.';
  } else if (!processedRoutes.find(r => r.isRecommended)) {
     balancedRoute.isRecommended = true;
     balancedRoute.tag = 'BALANCED';
     balancedRoute.color = '#FF5500';
  }

  // Add AQI diff text (e.g. "-20% PM2.5 compared to Fastest")
  processedRoutes.forEach(r => {
    if (r.tag !== 'FASTEST' && fastestRoute.avgAQI > 0) {
      const diff = Math.round(((fastestRoute.avgAQI - r.avgAQI) / fastestRoute.avgAQI) * 100);
      if (diff > 0) {
        r.aqiDiffText = `-${diff}% AQI vs Fastest`;
      }
    }
  });

  return processedRoutes.sort((a, b) => (a as any)._balancedScore - (b as any)._balancedScore);
}
