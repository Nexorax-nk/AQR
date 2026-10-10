'use client';

import React from 'react';
import { Locate, Plus, Minus, Layers, Wind, Box, MapPin, Navigation } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onToggleLayers: () => void;
  isLayersOpen: boolean;
  onToggleAQIMode: () => void;
  isAQIMode: boolean;
  theme?: 'dark' | 'light';
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleLayers,
  isLayersOpen,
  onToggleAQIMode,
  isAQIMode,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <div className="fixed right-4 bottom-24 z-30 flex flex-col items-center gap-2.5">
      {/* 1. Layers / List View Button */}
      <button
        onClick={onToggleLayers}
        className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-xl transition-all active:scale-95 ${
          isLayersOpen
            ? 'bg-[#F5A623] border-[#F5A623] text-black font-bold'
            : isLight
              ? 'bg-white/95 border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-md'
              : 'bg-[#1E2125] border-white/15 text-white hover:bg-[#282C31]'
        }`}
        title="Map Layers & Stations"
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* 2. 3D / Heatmap Overlay Toggle */}
      <button
        onClick={onToggleAQIMode}
        className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-xl transition-all active:scale-95 ${
          isAQIMode
            ? 'bg-[#38C958] border-[#38C958] text-white font-bold'
            : isLight
              ? 'bg-white/95 border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-md'
              : 'bg-[#1E2125] border-white/15 text-white hover:bg-[#282C31]'
        }`}
        title="3D Heatmap Overlay"
      >
        <Box className="w-5 h-5" />
      </button>

      {/* 3. Zoom Controls Stack */}
      <div className={`flex flex-col border rounded-full p-1 shadow-xl space-y-1 ${
        isLight ? 'bg-white/95 border-neutral-300 text-neutral-800' : 'bg-[#1E2125] border-white/15 text-white'
      }`}>
        <button
          onClick={onZoomIn}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isLight ? 'hover:bg-neutral-100 text-neutral-800' : 'hover:bg-white/10 text-white'
          }`}
          title="Zoom In"
        >
          <Plus className="w-4.5 h-4.5" />
        </button>

        <div className={`h-px my-0.5 mx-2 ${isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />

        <button
          onClick={onZoomOut}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isLight ? 'hover:bg-neutral-100 text-neutral-800' : 'hover:bg-white/10 text-white'
          }`}
          title="Zoom Out"
        >
          <Minus className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 4. Target Current Location Pin Button */}
      <button
        onClick={onLocate}
        className={`w-11 h-11 rounded-full border text-[#0284C7] flex items-center justify-center shadow-xl transition-all active:scale-95 ${
          isLight
            ? 'bg-white/95 border-neutral-300 hover:bg-neutral-100 shadow-md'
            : 'bg-[#1E2125] border-white/15 hover:bg-[#282C31]'
        }`}
        title="My Location"
      >
        <Locate className="w-5.5 h-5.5 stroke-[2.5]" />
      </button>
    </div>
  );
};
