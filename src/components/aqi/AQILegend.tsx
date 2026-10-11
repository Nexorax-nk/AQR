'use client';

import React from 'react';
import { AQI_COLORS } from '@/lib/aqi-data';
import { AQICategory } from '@/lib/types';

export const AQILegend: React.FC = () => {
  const legendItems: { key: AQICategory; range: string; label: string }[] = [
    { key: 'good', range: '0–50', label: 'Good' },
    { key: 'moderate', range: '51–100', label: 'Moderate' },
    { key: 'unhealthy', range: '101–200', label: 'Unhealthy' },
    { key: 'very-unhealthy', range: '201–300', label: 'Very Unhealthy' },
    { key: 'hazardous', range: '301+', label: 'Hazardous' },
  ];

  return (
    <div className="fixed top-16 left-16 z-20 hidden md:flex items-center gap-2 bg-[#1E2125] border border-white/15 px-3 py-1.5 rounded-full shadow-xl">
      <span className="text-[10px] font-black text-white/70 uppercase pr-1.5 border-r border-white/10">
        AQI
      </span>

      <div className="flex items-center gap-2 text-[11px]">
        {legendItems.map((item) => {
          const style = AQI_COLORS[item.key];
          return (
            <div key={item.key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.bg }} />
              <span className="font-bold text-white">{item.range}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
