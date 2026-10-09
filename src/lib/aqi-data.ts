import { AQILocation, RouteOption, AQICategory } from './types';

export const AQI_COLORS: Record<AQICategory, { bg: string; text: string; label: string; border: string }> = {
  good: { bg: '#38C958', text: '#FFFFFF', label: 'Good (0–50)', border: '#2BB049' },
  moderate: { bg: '#F5A623', text: '#000000', label: 'Moderate (51–100)', border: '#D9911A' },
  sensitive: { bg: '#FF9E1B', text: '#000000', label: 'Sensitive Groups (101–150)', border: '#E0850D' },
  unhealthy: { bg: '#FF8E2D', text: '#FFFFFF', label: 'Unhealthy (151–200)', border: '#E87D1A' },
  'very-unhealthy': { bg: '#EE3E3E', text: '#FFFFFF', label: 'Very Unhealthy (201–300)', border: '#D92D2D' },
  hazardous: { bg: '#953BD3', text: '#FFFFFF', label: 'Hazardous (301+)', border: '#8328C4' },
};

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
}

export const INITIAL_CENTER: [number, number] = [28.5450, 77.3300]; // Noida Center
export const INITIAL_ZOOM = 13;

// Emptyed Mock Data (No mock markers or fake data pointers)
export const AQI_LOCATIONS: AQILocation[] = [];
export const SAMPLE_ROUTES: RouteOption[] = [];
export const FIRE_HOTSPOTS: any[] = [];
export const MONITORING_STATIONS: any[] = [];
