'use client';

import React from 'react';
import { MapLayerState, TileProvider } from '@/lib/types';
import { Layers, Wind, Activity, CloudRain, Flame, Radio, Car, ShieldAlert, X, Globe, Satellite, Map as MapIcon } from 'lucide-react';

interface LayerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  layerState: MapLayerState;
  onToggleLayer: (layerKey: keyof MapLayerState) => void;
  onSelectTileProvider?: (provider: TileProvider) => void;
  theme?: 'dark' | 'light';
}

export const LayerMenu: React.FC<LayerMenuProps> = ({
  isOpen,
  onClose,
  layerState,
  onToggleLayer,
  onSelectTileProvider,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const basemaps: { id: TileProvider; label: string; icon: any }[] = [
    { id: 'dark', label: 'Dark Gray', icon: Globe },
    { id: 'satellite', label: 'Satellite', icon: Satellite },
    { id: 'street', label: 'Street', icon: MapIcon },
  ];

  const layerItems: { key: keyof MapLayerState; label: string; icon: any }[] = [
    { key: 'aqi', label: 'AQI Markers', icon: Wind },
  ];

  return (
    <div className={`fixed right-20 bottom-24 z-40 w-[290px] border rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3.5 backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95 ${
      isLight 
        ? 'bg-white/95 border-neutral-200 text-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.12)]' 
        : 'bg-[#121316]/95 border-white/10 text-white'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-2.5 border-b ${isLight ? 'border-neutral-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#FF5500]" />
          <div>
            <h3 className={`text-xs font-bold leading-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>Map Layers</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            isLight ? 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100' : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Segmented Control Basemap Switcher */}
      <div>
        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>
          Basemap Style
        </div>
        <div className={`p-1 rounded-xl border grid grid-cols-3 gap-1 ${
          isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-black/40 border-white/10'
        }`}>
          {basemaps.map((b) => {
            const Icon = b.icon;
            const isSelected = layerState.tileProvider === b.id;
            return (
              <button
                key={b.id}
                onClick={() => onSelectTileProvider && onSelectTileProvider(b.id)}
                className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF5500] text-white font-semibold shadow-sm'
                    : isLight
                      ? 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] leading-none">{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimal Dynamic Overlays */}
      <div>
        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>
          Overlays & Sensors
        </div>

        <div className="space-y-0.5 max-h-[230px] overflow-y-auto no-scrollbar">
          {layerItems.map((item) => {
            const Icon = item.icon;
            const isSelected = Boolean(layerState[item.key as keyof MapLayerState]);
            return (
              <button
                key={item.key}
                onClick={() => onToggleLayer(item.key as keyof MapLayerState)}
                className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer group ${
                  isSelected 
                    ? isLight 
                      ? 'bg-neutral-100 text-neutral-900' 
                      : 'bg-white/[0.07] text-white' 
                    : isLight
                      ? 'hover:bg-neutral-50 text-neutral-600'
                      : 'hover:bg-white/[0.04] text-white/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isSelected ? 'text-[#FF5500]' : isLight ? 'text-neutral-400' : 'text-white/40'
                  }`} />
                  <span className={`text-xs ${isSelected ? 'font-semibold' : 'font-normal'}`}>{item.label}</span>
                </div>

                {/* Micro Toggle Switch */}
                <div
                  className={`w-7 h-4 rounded-full transition-colors duration-200 relative flex items-center p-0.5 flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#FF5500]'
                      : isLight
                        ? 'bg-neutral-300'
                        : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                      isSelected ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
