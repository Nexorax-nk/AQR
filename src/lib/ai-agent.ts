import { ChatMessage, MapLayerState } from './types';
import { SAMPLE_ROUTES, AQI_LOCATIONS } from './aqi-data';

export interface AIResponseResult {
  message: ChatMessage;
  layerUpdate?: Partial<MapLayerState>;
  activateRoutes?: boolean;
  highlightLocationId?: string;
  zoomTarget?: [number, number];
}

export function processAIQuery(queryText: string): AIResponseResult {
  const lower = queryText.toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const id = `msg-${Date.now()}`;

  // 1. Clean route request
  if (lower.includes('route') || lower.includes('cleaner') || lower.includes('destination') || lower.includes('way')) {
    return {
      message: {
        id,
        sender: 'agent',
        text: 'To find the cleanest air route, please use the map interface! Click the 📍 icon to drop a Start and Destination pin, and I will analyze the live air quality data along the real streets for you.',
        timestamp,
      },
    };
  }

  // 2. High pollution hotspots
  if (lower.includes('hotspot') || lower.includes('pollution') || lower.includes('dirty') || lower.includes('hazardous') || lower.includes('worst')) {
    const hazardousLoc = AQI_LOCATIONS.find((l) => l.aqi > 180) || AQI_LOCATIONS[4];
    return {
      message: {
        id,
        sender: 'agent',
        text: `⚠️ **High Pollution Alert**: **${hazardousLoc.name}** is currently recording severe air degradation (**AQI ${hazardousLoc.aqi}** - ${hazardousLoc.category.toUpperCase()}).\n\nPM2.5 levels are at **${hazardousLoc.pm25} µg/m³** due to heavy rail/industrial idling. I recommend wearing an N95 mask in this corridor.`,
        timestamp,
        selectedHotspot: hazardousLoc,
      },
      highlightLocationId: hazardousLoc.id,
      zoomTarget: [hazardousLoc.lat, hazardousLoc.lng],
    };
  }

  // 3. Best time to run / exercise
  if (lower.includes('run') || lower.includes('exercise') || lower.includes('walk') || lower.includes('jog') || lower.includes('outdoor')) {
    return {
      message: {
        id,
        sender: 'agent',
        text: '🏃 **Outdoor Activity Recommendation for Today**:\n\n• **Best Window**: **6:00 AM – 7:30 AM** (AQI avg ~45 near Guindy & Adyar parks)\n• **Avoid**: **5:30 PM – 8:30 PM** (Peak vehicular NO₂ and PM10 buildup along arterial roads)\n\n📍 *Recommended Running Spot*: IIT Madras forest loops (AQI 48 - Good).',
        timestamp,
      },
      highlightLocationId: 'iit-madras',
      zoomTarget: [12.9915, 80.2337],
    };
  }

  // 4. Traffic or Layer toggles
  if (lower.includes('traffic') || lower.includes('congestion')) {
    return {
      message: {
        id,
        sender: 'agent',
        text: '🚦 I have toggled the **Live Traffic Overlay** on the map. High congestion along GST Road and Anna Salai directly correlates with the +45 AQI spike observed over central corridors.',
        timestamp,
        layerTrigger: 'traffic',
      },
      layerUpdate: { traffic: true },
    };
  }

  if (lower.includes('fire') || lower.includes('stubble') || lower.includes('satellite') || lower.includes('hotspots')) {
    return {
      message: {
        id,
        sender: 'agent',
        text: '🔥 Enabling **Satellite Fire Hotspot Detection**. Active thermal anomalies detected in the Ennore Port industrial sector and northern peri-urban zones.',
        timestamp,
        layerTrigger: 'satelliteFires',
      },
      layerUpdate: { satelliteFires: true },
    };
  }

  // Default intelligent response
  return {
    message: {
      id,
      sender: 'agent',
      text: `Air quality in Chennai is currently **Moderate overall (AQI 84)**. Air flows from the Bay of Bengal (East-South-East at 11 km/h) are helping disperse urban fine particulates across coastal sectors like Adyar and Besant Nagar.\n\nAsk me to find clean routes, inspect PM2.5 heatmaps, or pinpoint pollution spikes!`,
      timestamp,
    },
  };
}
