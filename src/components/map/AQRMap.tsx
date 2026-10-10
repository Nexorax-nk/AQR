'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { AQILocation, MapLayerState, RouteOption } from '@/lib/types';

interface AQRMapProps {
  center: [number, number];
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

const DynamicAQRMapInner = dynamic(() => import('./AQRMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#202326] flex items-center justify-center text-white/50 space-x-2">
      <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Loading Live AQI Vector Map...</span>
    </div>
  ),
});

export const AQRMap: React.FC<AQRMapProps> = (props) => {
  return <DynamicAQRMapInner {...props} />;
};
