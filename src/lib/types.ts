export type AQICategory = 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
export type TileProvider = 'dark' | 'satellite' | 'street';

export interface AQIAdvisories {
  faceMask: 'RECOMMENDED' | 'NOT RECOMMENDED' | 'MANDATORY' | string;
  airPurifier: 'RECOMMENDED' | 'NOT RECOMMENDED' | string;
  outdoorExercise: 'RECOMMENDED' | 'NOT RECOMMENDED' | string;
  outdoorActivities: 'RECOMMENDED' | 'NOT RECOMMENDED' | string;
}

export interface AQILocation {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  aqi: number;
  category: AQICategory;
  pm25: number;
  pm10: number;
  rainfall: number;
  temperature: number;
  humidity: number;
  windSpeed: string;
  no2: number;
  o3: number;
  advisories: AQIAdvisories;
  trend: 'improving' | 'stable' | 'worsening';
  lastUpdated: string;
  boundaryGeoJson?: any;
  extent?: [number, number, number, number];
  forecastData?: { time: string; aqi: number }[];
  trendDataMap?: Record<string, { time: string; value: number }[]>;
  nearbyStations?: Station[];
}

export interface Station {
  id: string;
  name: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  color: string;
  status: string;
  distance: string;
  source: string;
  lastUpdate: string;
}

export interface RouteOption {
  id: string;
  name: string;
  tag: 'FASTEST' | 'BALANCED' | 'CLEANEST';
  isRecommended?: boolean;
  distanceKm: number;
  durationMins: number;
  avgAQI: number;
  aqiCategory: AQICategory;
  color: string;
  aqiDiffText: string;
  path: [number, number][];
  description: string;
}

export interface MapLayerState {
  tileProvider: TileProvider;
  aqi: boolean;
  traffic?: boolean;
  satelliteFires?: boolean;
  monitoring?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  routes?: RouteOption[];
  layerTrigger?: keyof MapLayerState;
  selectedHotspot?: AQILocation;
}
