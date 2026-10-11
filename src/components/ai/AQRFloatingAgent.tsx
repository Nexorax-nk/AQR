'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Navigation, Wind, Flame, Sparkles } from 'lucide-react';
import { ChatMessage, RouteOption, MapLayerState, AQILocation } from '@/lib/types';
import { processAIQuery } from '@/lib/ai-agent';
import ReactMarkdown from 'react-markdown';

// Pre-populate with the initial welcome message ID so it is always static and never animates
const typedMessages = new Set<string>(['welcome-1']);

const TypewriterMessage = ({ text, isAgent, messageId }: { text: string; isAgent: boolean; messageId: string }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    if (!isAgent || typedMessages.has(messageId)) {
      setDisplayed(text);
      typedMessages.add(messageId);
      return;
    }
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        typedMessages.add(messageId);
      }
    }, 15); // Adjust typing speed here
    
    return () => clearInterval(interval);
  }, [text, isAgent, messageId]);

  return (
    <div className="leading-snug space-y-2">
      <ReactMarkdown 
        components={{
          strong: ({node, ...props}) => <strong className="text-[#FF5500] font-bold" {...props} />,
          p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />
        }}
      >
        {displayed}
      </ReactMarkdown>
    </div>
  );
};

interface AQRFloatingAgentProps {
  activeRoutes?: RouteOption[];
  onActivateRoutes?: (routes: RouteOption[]) => void;
  onSelectRoute?: (routeId: string) => void;
  activeRouteId?: string;
  onLayerUpdate?: (layerUpdate: Partial<MapLayerState>) => void;
  onZoomTo?: (lat: number, lng: number) => void;
  theme?: 'dark' | 'light';
  routeStart?: AQILocation | null;
  selectedLocation?: AQILocation | null;
}

export const AQRFloatingAgent: React.FC<AQRFloatingAgentProps> = ({
  activeRoutes = [],
  onActivateRoutes,
  onSelectRoute,
  activeRouteId,
  onLayerUpdate,
  onZoomTo,
  theme = 'dark',
  routeStart,
  selectedLocation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: 'Hello! I am your AQR Intelligence Assistant. Ask me to find clean air routes, check regional PM2.5 levels, compare route pollution exposure, or find high pollution hotspots.',
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevRouteKeyRef = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // AI Route Analysis Engine - Triggers whenever routes or endpoints are plotted
  useEffect(() => {
    if (activeRoutes.length > 0) {
      const originName = routeStart?.name || 'Selected Origin';
      const destinationName = selectedLocation?.name || 'Selected Destination';
      
      // Prevent redundant fetches for the identical route set
      const currentRouteKey = `${originName}->${destinationName}:${activeRoutes.map(r => `${r.name}-${r.avgAQI}-${r.distanceKm}`).join('|')}`;
      if (currentRouteKey === prevRouteKeyRef.current) return;
      prevRouteKeyRef.current = currentRouteKey;

      const fetchAnalysis = async () => {
        setIsTyping(true);
        try {
          const promptQuery = `I just plotted a route from "${originName}" to "${destinationName}". Compare the calculated routes and advise on which one is the cleanest for AQI and why.`;
          
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: promptQuery,
              context: { 
                origin: originName,
                destination: destinationName,
                routes: activeRoutes.map(r => ({
                  name: r.name,
                  tag: r.tag,
                  isRecommended: r.isRecommended,
                  distanceKm: r.distanceKm,
                  durationMins: r.durationMins,
                  avgAQI: r.avgAQI,
                  aqiCategory: r.aqiCategory,
                  aqiDiffText: r.aqiDiffText,
                  description: r.description
                }))
              } 
            })
          });
          const data = await response.json();
          
          if (data.reply) {
            const msg: ChatMessage = {
              id: `route-analysis-${Date.now()}`,
              sender: 'agent',
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, msg]);
            setIsOpen(true);
          }
        } catch (err) {
          console.error('Route analysis error:', err);
        } finally {
          setIsTyping(false);
        }
      };
      
      fetchAnalysis();
    }
  }, [activeRoutes, routeStart, selectedLocation]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 1. Process local map actions (layer toggling, zooming)
    const localRes = processAIQuery(query);
    if (localRes.activateRoutes && localRes.message.routes && onActivateRoutes) {
      onActivateRoutes(localRes.message.routes);
    }
    if (localRes.layerUpdate && onLayerUpdate) {
      onLayerUpdate(localRes.layerUpdate);
    }
    if (localRes.zoomTarget && onZoomTo) {
      onZoomTo(localRes.zoomTarget[0], localRes.zoomTarget[1]);
    }

    // 2. Fetch conversational response from Real LLM (Groq) with full route context
    try {
      const originName = routeStart?.name;
      const destinationName = selectedLocation?.name;
      const routeContext = (originName || destinationName || activeRoutes.length > 0) ? {
        origin: originName,
        destination: destinationName,
        routes: activeRoutes.map(r => ({
          name: r.name,
          tag: r.tag,
          isRecommended: r.isRecommended,
          distanceKm: r.distanceKm,
          durationMins: r.durationMins,
          avgAQI: r.avgAQI,
          aqiCategory: r.aqiCategory,
          aqiDiffText: r.aqiDiffText,
          description: r.description
        }))
      } : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          context: routeContext 
        })
      });
      
      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply || localRes.message.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, localRes.message]);
    } finally {
      setIsTyping(false);
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed z-40">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* Collapsed Pill Button */
          <motion.div
            key="collapsed-button"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <motion.button
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-full shadow-2xl font-bold text-xs cursor-pointer backdrop-blur-xl transition-all ${
                isLight
                  ? 'bg-[#FFFBF8]/95 border-neutral-300 text-slate-900 hover:bg-neutral-100 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
                  : 'bg-[#1E1B1A] hover:bg-[#282321] border-white/12 hover:border-white/25 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              }`}
            >
              <Bot className="w-4.5 h-4.5 text-[#FF5500]" />
              <span>AQR Chatbot</span>
            </motion.button>
          </motion.div>
        ) : (
          /* Expanded Floating Chat Card View (Shifted left to right-28 to clear MapControls and LayerMenu) */
          <motion.div
            key="expanded-card"
            initial={{ opacity: 0, scale: 0.82, x: 25, y: '-42%', filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, x: 0, y: '-50%', filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.85, x: 20, y: '-45%', filter: 'blur(8px)' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.7 }}
            className={`fixed top-1/2 right-28 z-40 w-[440px] max-w-[calc(100vw-8rem)] h-[calc(100vh-120px)] max-h-[680px] min-h-[480px] border rounded-3xl flex flex-col overflow-hidden backdrop-blur-3xl transition-colors duration-300 ${
              isLight
                ? 'bg-[#FFFBF8]/95 border-amber-200/80 text-slate-900 shadow-[0_25px_60px_rgba(255,100,0,0.15)]'
                : 'bg-[#1E1B1A]/95 border-white/12 text-white shadow-[0_35px_80px_rgba(0,0,0,0.85)]'
            }`}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className={`px-5 py-4 border-b relative flex items-center justify-between ${
                isLight ? 'bg-amber-500/5 border-amber-200/60' : 'bg-[#161312]/95 border-white/10'
              }`}
            >
              {/* Subtle Glowing Accent Line */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#FF5500]/40 to-transparent" />

              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF5500] via-[#FF6611] to-[#E64A00] text-white shadow-[0_0_20px_rgba(255,85,0,0.4)] border border-white/20 overflow-hidden cursor-pointer"
                >
                  <svg className="w-5 h-5 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3.5L4.5 19.5H8.8L10.5 15.5H13.5L15.2 19.5H19.5L12 3.5ZM12 8.2L13.8 12.5H10.2L12 8.2Z" fill="currentColor" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-60 pointer-events-none" />
                </motion.div>

                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    AQR Chatbot
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" title="Online" />
                </div>
              </div>

              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-amber-100 border-slate-200' : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs no-scrollbar">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white font-semibold shadow-md shadow-[#FF5500]/20'
                          : isLight
                            ? 'bg-slate-100/90 text-slate-900 border border-slate-200/80 shadow-sm'
                            : 'bg-[#292321] text-white/95 border border-white/10 shadow-sm'
                      }`}
                    >
                      <TypewriterMessage text={msg.text} isAgent={!isUser} messageId={msg.id} />

                      {/* Route options inside chat */}
                      {msg.routes && msg.routes.length > 0 && (
                        <div className={`mt-2.5 space-y-2 pt-2.5 border-t ${isLight ? 'border-slate-200' : 'border-white/15'}`}>
                          <div className="text-[10px] font-black text-[#FF5500] uppercase tracking-wider flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-[#FF5500]" />
                            Select Clean Air Route:
                          </div>
                          {msg.routes.map((rt) => (
                            <motion.button
                              key={rt.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onSelectRoute && onSelectRoute(rt.id)}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                activeRouteId === rt.id
                                  ? 'bg-[#FF5500] text-white font-bold border-white/20 shadow-sm'
                                  : isLight
                                    ? 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                                    : 'bg-[#1E1B1A] text-white border-white/10 hover:bg-[#332B28]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">{rt.tag} ({rt.durationMins}m)</span>
                                <span className="font-mono text-[11px] font-extrabold text-[#FF5500] bg-[#FF5500]/10 px-1.5 py-0.5 rounded">AQI {rt.avgAQI}</span>
                              </div>
                              <div className="text-[10.5px] opacity-80 mt-0.5">{rt.name}</div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-[9.5px] mt-1 font-medium ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{msg.timestamp}</span>
                  </motion.div>
                );
              })}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2.5 rounded-xl w-fit text-xs font-medium ${
                    isLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-[#292321] text-white/60 border border-white/5'
                  }`}
                >
                  <span className="animate-pulse">AQR AI is thinking...</span>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>



            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-3 border-t ${isLight ? 'bg-neutral-100/60 border-neutral-200' : 'bg-[#161312]/90 border-white/10'}`}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask AQR AI navigator..."
                  className={`flex-1 h-10 px-3 border rounded-xl text-xs transition-all focus:outline-none ${
                    isLight
                      ? 'bg-white border-neutral-300 text-slate-900 placeholder-slate-400 focus:border-neutral-400'
                      : 'bg-[#292321] border-white/10 text-white placeholder-white/40 focus:border-white/30'
                  }`}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-[#FF5500] hover:bg-[#E64A00] text-white font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 shadow-md shadow-[#FF5500]/25 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
