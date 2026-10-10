'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, 
  TrendingUp, 
  AlertTriangle, 
  Flame, 
  BrainCircuit, 
  Bot, 
  Server, 
  Terminal, 
  Settings,
  ChevronLeft
} from 'lucide-react';

interface SideNavProps {
  onSelectTab?: (tab: string) => void;
  activeTab?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  theme?: 'dark' | 'light';
}

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  fullLabel: string;
  desc: string;
}

const QuantumNeuralIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Core glowing AI neural spark */}
    <path 
      d="M12 2C12 7.2 7.8 11.4 2.6 11.4C7.8 11.4 12 15.6 12 20.8C12 15.6 16.2 11.4 21.4 11.4C16.2 11.4 12 7.2 12 2Z" 
      fill="currentColor"
    />
    
    {/* Quantum orbital node ring */}
    <circle cx="12" cy="11.4" r="9.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3.5 2.5" opacity="0.85" />
    
    {/* Neural nodes on orbital perimeter */}
    <circle cx="12" cy="1.9" r="2" fill="currentColor" />
    <circle cx="21.5" cy="11.4" r="2" fill="currentColor" />
    <circle cx="12" cy="20.9" r="2" fill="currentColor" />
    <circle cx="2.5" cy="11.4" r="2" fill="currentColor" />
    
    {/* Top Right Neural Spark */}
    <path d="M19.5 2L20.2 4.2L22.4 4.9L20.2 5.6L19.5 7.8L18.8 5.6L16.6 4.9L18.8 4.2L19.5 2Z" fill="currentColor" />
  </svg>
);

export const SideNav: React.FC<SideNavProps> = ({ 
  onSelectTab, 
  activeTab = 'map',
  isExpanded: externalIsExpanded,
  onToggleExpand,
  theme = 'dark',
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState<boolean>(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  // Group 1: Environmental Telemetry & Map Layers
  const telemetryItems: NavItem[] = [
    { id: 'map', icon: MapIcon, label: 'Map', fullLabel: 'Live Telemetry Map', desc: 'Real-time spatial AQI' },
    { id: 'air', icon: TrendingUp, label: 'Air', fullLabel: 'Air Quality Metrics', desc: 'Pollutant index & PM2.5' },
    { id: 'zones', icon: AlertTriangle, label: 'Zones', fullLabel: 'Critical Zones', desc: 'High-risk breach areas' },
  ];

  // Group 2: Intelligence, Cloud & Operations
  const systemItems: NavItem[] = [
    { id: 'aqr-ai', icon: QuantumNeuralIcon, label: 'AQR AI', fullLabel: 'AQR Neural Engine', desc: 'Predictive intelligence' },
    { id: 'agents', icon: Bot, label: 'Agents', fullLabel: 'Autonomous Agents', desc: 'Mitigation swarms' },
    { id: 'aws-infra', icon: Server, label: 'AWS Infra', fullLabel: 'AWS Cloud Pipeline', desc: 'IoT stream ingestion' },
    { id: 'runtime-console', icon: Terminal, label: 'Console', fullLabel: 'Runtime Console', desc: 'Logs, CLI & feed' },
  ];

  const renderCollapsedButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isLight = theme === 'light';

    return (
      <div key={item.id} className="relative w-full group flex justify-center">
        <button
          onClick={() => onSelectTab && onSelectTab(item.id)}
          className={`relative w-full px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer ${
            isActive ? 'py-3.5' : 'py-2'
          } ${
            isActive
              ? isLight
                ? 'bg-gradient-to-b from-[#FF5500] to-[#E64A00] border border-white/30 text-white shadow-[0_4px_16px_rgba(255,85,0,0.35)]'
                : 'bg-gradient-to-b from-[#FF5500]/22 via-[#FF5500]/12 to-[#FF5500]/5 border border-white/20 text-[#FFA266] shadow-[0_0_18px_rgba(255,85,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]'
              : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.07] border border-transparent'
          }`}
          aria-label={item.fullLabel}
        >
          {isActive && (
            <span className={`absolute left-1 top-2 bottom-2 w-1 rounded-full ${
              isLight ? 'bg-white shadow-[0_0_6px_#FFFFFF]' : 'bg-[#FF5500] shadow-[0_0_8px_#FF5500]'
            }`} />
          )}

          <Icon 
            className={`${item.id === 'aqr-ai' ? 'w-[20px] h-[20px]' : 'w-4.5 h-4.5'} transition-transform duration-200 ${
              isActive 
                ? isLight ? 'text-white filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)] scale-105' : 'text-[#FF5500] filter drop-shadow-[0_2px_8px_rgba(255,85,0,0.5)] scale-105'
                : isLight
                  ? 'text-neutral-600 group-hover:text-neutral-900 group-hover:scale-110'
                  : 'text-neutral-400 group-hover:text-white group-hover:scale-110'
            }`} 
          />

          <span 
            className={`text-[9.5px] tracking-tight leading-none select-none transition-colors ${
              isActive 
                ? 'font-bold text-white' 
                : isLight ? 'font-semibold text-neutral-600 group-hover:text-neutral-900' : 'font-medium text-neutral-400 group-hover:text-white'
            }`}
          >
            {item.label}
          </span>
        </button>

        {/* Hover Flyout Tooltip */}
        <div className={`absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl border shadow-xl backdrop-blur-xl pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap min-w-[150px] ${
          isLight ? 'bg-white/95 border-neutral-300 text-neutral-900 shadow-[0_12px_36px_rgba(0,0,0,0.15)]' : 'bg-[#0D0F13]/95 border-white/15 text-white shadow-[0_12px_36px_rgba(0,0,0,0.8)]'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-xs font-bold tracking-wide ${isLight ? 'text-neutral-900' : 'text-white'}`}>{item.fullLabel}</span>
            {isActive && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500] border border-white/15">
                ACTIVE
              </span>
            )}
          </div>
          <p className={`text-[10.5px] leading-tight ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>{item.desc}</p>
        </div>
      </div>
    );
  };

  const renderExpandedButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isLight = theme === 'light';

    return (
      <button
        key={item.id}
        onClick={() => onSelectTab && onSelectTab(item.id)}
        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer group ${
          isActive
            ? isLight
              ? 'bg-gradient-to-r from-[#FF5500] to-[#E64A00] border border-white/30 text-white font-bold shadow-[0_4px_16px_rgba(255,85,0,0.35)]'
              : 'bg-[#FF5500]/15 border border-white/20 text-white shadow-[0_0_16px_rgba(255,85,0,0.25)]'
            : isLight
              ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isActive && (
            <span className={`w-1 h-4 rounded-full flex-shrink-0 ${
              isLight ? 'bg-white shadow-[0_0_6px_#FFFFFF]' : 'bg-[#FF5500] shadow-[0_0_8px_#FF5500]'
            }`} />
          )}
          <Icon className={`${item.id === 'aqr-ai' ? 'w-4.5 h-4.5' : 'w-4 h-4'} flex-shrink-0 ${
            isActive ? 'text-white filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]' : isLight ? 'text-neutral-500 group-hover:text-neutral-900' : 'text-neutral-400 group-hover:text-white'
          }`} />
          <span className={`text-xs tracking-tight truncate ${
            isActive ? 'text-white font-bold' : isLight ? 'text-neutral-700 group-hover:text-black font-medium' : 'text-neutral-300 group-hover:text-white font-semibold'
          }`}>
            {item.fullLabel}
          </span>
        </div>
      </button>
    );
  };

  const isLight = theme === 'light';

  return (
    <motion.aside 
      initial={false}
      animate={{
        width: isExpanded ? 240 : 84,
        paddingLeft: isExpanded ? 12 : 8,
        paddingRight: isExpanded ? 12 : 8,
      }}
      transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.75 }}
      className={`fixed left-4 top-4 bottom-4 z-40 backdrop-blur-2xl rounded-[28px] py-4 flex flex-col justify-between select-none overflow-hidden ${
        isLight
          ? 'bg-white/95 border border-neutral-300 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
          : 'bg-[#0B0C0E]/95 border border-white/[0.09] shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.1)]'
      } ${!isExpanded ? 'items-center' : ''}`}
    >
      {/* Ambient Top Glow Accent (Dark mode only) */}
      {!isLight && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#FF5500]/12 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* 1. Top Header */}
      {isExpanded ? (
        <div className={`flex items-center justify-between w-full pb-3 border-b z-10 px-1 mb-1 ${
          isLight ? 'border-neutral-200' : 'border-white/10'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] shadow-[0_0_12px_#FF5500] animate-pulse flex-shrink-0" />
            <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF5500] via-[#FF7700] to-[#FF5500] filter drop-shadow-[0_2px_10px_rgba(255,85,0,0.4)]">
              AQR
            </span>
          </div>

          <motion.button
            onClick={handleToggle}
            whileHover={{ scale: 1.12, x: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center flex-shrink-0 ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-[#FF5500] border border-neutral-300'
                : 'bg-white/[0.06] hover:bg-[#FF5500]/20 border border-white/10 hover:border-white/25 text-neutral-300 hover:text-[#FF5500]'
            }`}
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
          </motion.button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full flex-shrink-0 z-10 mb-2">
          <motion.button 
            onClick={handleToggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative group cursor-pointer w-10 h-10 rounded-2xl flex items-center justify-center" 
            title="Expand Command Menu"
          >
            {/* Custom Sleek Gradient Menu Bars */}
            <div className="flex flex-col items-center justify-center gap-[4px] w-5 h-5 z-10 group-hover:scale-105 transition-transform duration-200">
              <span className="w-4.5 h-[2.5px] rounded-full bg-gradient-to-r from-[#FF5500] via-[#FF7700] to-[#FF5500] shadow-[0_0_8px_rgba(255,85,0,0.7)]" />
              <span className="w-4.5 h-[2.5px] rounded-full bg-gradient-to-r from-[#FF5500] via-[#FFA266] to-[#FF5500] shadow-[0_0_8px_rgba(255,85,0,0.7)] group-hover:w-3 transition-all duration-200" />
              <span className="w-4.5 h-[2.5px] rounded-full bg-gradient-to-r from-[#FF5500] via-[#FF7700] to-[#FF5500] shadow-[0_0_8px_rgba(255,85,0,0.7)]" />
            </div>

            {/* Hover Glass Tile Background */}
            <div className={`absolute inset-0 rounded-2xl border transition-all duration-300 ${
              isLight
                ? 'bg-neutral-100 group-hover:bg-[#FF5500]/10 border-neutral-300 group-hover:border-neutral-400 shadow-sm'
                : 'bg-white/[0.04] group-hover:bg-gradient-to-b group-hover:from-[#FF5500]/20 group-hover:to-[#FF5500]/5 border-white/10 group-hover:border-white/25 shadow-md'
            }`} />

            {/* Menu Tooltip */}
            <div className={`absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl border shadow-xl backdrop-blur-xl pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap ${
              isLight ? 'bg-white/95 border-neutral-300 text-neutral-900' : 'bg-[#0D0F13]/95 border-white/15 text-white'
            }`}>
              <span className="text-xs font-bold block">Expand Menu</span>
              <span className={`text-[10px] block ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Show full sidebar layout</span>
            </div>
          </motion.button>

          <div className={`w-8 h-[2px] mt-3 rounded-full opacity-70 ${isLight ? 'bg-gradient-to-r from-transparent via-[#FF5500]/60 to-transparent' : 'bg-gradient-to-r from-transparent via-[#FF5500] to-transparent shadow-[0_0_8px_rgba(255,85,0,0.6)]'}`} />
        </div>
      )}

      {/* 2. Navigation Items List */}
      <nav className={`flex-1 flex flex-col justify-between w-full z-10 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden my-2 ${
        isExpanded ? 'px-0' : 'items-center gap-1'
      }`}>
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div 
              key="expanded-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 flex flex-col justify-between w-full h-full py-0.5"
            >
              <span className={`text-[9.5px] font-bold tracking-widest uppercase px-2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Telemetry
              </span>
              {telemetryItems.map(renderExpandedButton)}

              <div className={`w-full h-px my-4 ${isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />

              <span className={`text-[9.5px] font-bold tracking-widest uppercase px-2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Systems & AI
              </span>
              {systemItems.map(renderExpandedButton)}
            </motion.div>
          ) : (
            <motion.div 
              key="collapsed-list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 flex flex-col justify-evenly w-full h-full items-center"
            >
              {telemetryItems.concat(systemItems).map(renderCollapsedButton)}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 3. Bottom Settings */}
      <div className={`flex flex-col w-full flex-shrink-0 z-10 mt-2 ${isExpanded ? `pt-2 border-t ${isLight ? 'border-neutral-200' : 'border-white/10'}` : 'items-center'}`}>
        {!isExpanded && <div className={`w-8 h-[2px] mb-3 rounded-full opacity-70 ${isLight ? 'bg-gradient-to-r from-transparent via-[#FF5500]/60 to-transparent' : 'bg-gradient-to-r from-transparent via-[#FF5500] to-transparent shadow-[0_0_8px_rgba(255,85,0,0.6)]'}`} />}

        {isExpanded ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTab && onSelectTab('settings')}
            className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white font-bold flex items-center gap-2.5 shadow-[0_4px_16px_rgba(255,85,0,0.35)] transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="text-xs font-bold text-white">Settings</span>
          </motion.button>
        ) : (
          <div className="relative group w-full flex justify-center">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectTab && onSelectTab('settings')}
              className="w-10 h-10 rounded-2xl border border-white/20 bg-gradient-to-b from-[#FF5500] via-[#FF6600] to-[#E64A00] text-white font-bold shadow-[0_4px_16px_rgba(255,85,0,0.35)] hover:shadow-[0_6px_22px_rgba(255,85,0,0.55)] transition-all duration-300 cursor-pointer flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-4.5 h-4.5 text-white stroke-[2.5] group-hover:rotate-90 transition-transform duration-500 ease-out" />
            </motion.button>

            <div className={`absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl border shadow-xl backdrop-blur-xl pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap ${
              isLight ? 'bg-white/95 border-neutral-300 text-neutral-900 shadow-[0_12px_36px_rgba(0,0,0,0.15)]' : 'bg-[#0D0F13]/95 border-white/15 text-white shadow-[0_12px_36px_rgba(0,0,0,0.8)]'
            }`}>
              <span className="text-xs font-bold block">System Settings</span>
              <span className={`text-[10px] block ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Layers, API tokens & controls</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
