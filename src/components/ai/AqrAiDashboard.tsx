'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Navigation, Mic, LayoutDashboard, MessageSquare, Terminal } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

const typedMessages = new Set<string>();

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
    }, 10);
    
    return () => clearInterval(interval);
  }, [text, isAgent, messageId]);

  return (
    <div className="leading-snug space-y-2">
      <ReactMarkdown 
        components={{
          strong: ({node, ...props}) => <strong className="text-[#FF5500] font-bold" {...props} />,
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />
        }}
      >
        {displayed}
      </ReactMarkdown>
    </div>
  );
};

interface AqrAiDashboardProps {
  theme: 'light' | 'dark';
  isSideNavOpen: boolean;
  isSideNavExpanded: boolean;
}

export const AqrAiDashboard: React.FC<AqrAiDashboardProps> = ({ theme, isSideNavOpen, isSideNavExpanded }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Start empty for the centered layout
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOpacity, setVideoOpacity] = useState(0.9);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, {
        id: `agent-error-${Date.now()}`,
        sender: 'agent',
        text: 'Sorry, I encountered an error connecting to the intelligence server.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }

    setIsTyping(false);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration) return;

    // Fade out slightly during the last 0.8 seconds to mask the hard cut
    if (duration - currentTime < 0.8) {
      setVideoOpacity(0);
    } else {
      setVideoOpacity(0.9);
    }
  };

  const isInitialState = messages.length === 0;

  return (
    <div className={`absolute inset-0 overflow-hidden flex flex-col font-sans transition-all duration-300 bg-[#0A0705] text-white ${
      isSideNavOpen && isSideNavExpanded ? 'lg:pl-[268px]' : (isSideNavOpen ? 'lg:pl-[110px]' : '')
    }`}>
      
      {/* --- CINEMATIC BACKGROUND VIDEO --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#0A0705]">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onTimeUpdate={handleVideoTimeUpdate}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-700 ease-in-out"
          style={{ opacity: videoOpacity }}
        >
          <source src="/vbg.mp4" type="video/mp4" />
        </video>
        {/* Soft vignette/gradient to blend the video into the app edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0705] via-transparent to-[#0A0705]/50" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-6 lg:p-8 w-full h-full min-h-0">
        
        {/* TOP NAV BAR MATCHING SCREENSHOT */}
        <div className="flex justify-between items-start w-full">
          {/* Left Buttons (Removed) */}
          <div className="flex flex-col gap-4 w-32"></div>

          {/* Center Pill */}
          <div className="absolute left-1/2 -translate-x-1/2 top-8">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white/80 text-[10px] font-bold tracking-[0.2em] uppercase">
              Listening
            </div>
          </div>

          {/* Right Pill */}
          <div>
            <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#FF5500]/30 bg-[#160B05]/80 backdrop-blur-md text-[#FF5500] text-[10px] font-bold tracking-[0.15em] uppercase shadow-[0_0_20px_rgba(255,85,0,0.1)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse shadow-[0_0_8px_#FF5500]" />
              AQR CONNECTED
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-4xl mx-auto min-h-0">
          
          {isInitialState ? (
              <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-1000 -translate-y-8">
                <h1 className="text-4xl md:text-[3.5rem] font-semibold tracking-tight text-white mb-4">
                  How can I <span className="text-[#FF5500]">help?</span>
                </h1>
                <p className="text-base md:text-lg text-white/50 mb-10 font-normal">
                  Speak naturally. I'm listening.
                </p>

                {/* Main Search Bar */}
                <div className="relative w-full max-w-3xl">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Mic className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask AQR AI or describe the emergency..."
                    className="w-full pl-14 pr-20 py-5 rounded-2xl outline-none transition-all border border-white/[0.03] bg-[#161618]/90 backdrop-blur-xl focus:border-[#FF5500]/30 text-white placeholder:text-white/30 text-[15px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                    disabled={isTyping}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                      !input.trim() || isTyping
                        ? 'bg-[#FF5500]/40 text-white/40'
                        : 'bg-[#FF5500] text-white hover:bg-[#E64D00] shadow-[0_0_15px_rgba(255,85,0,0.4)]'
                    }`}
                  >
                    <Send className="w-4 h-4 ml-[-2px] mt-[1px]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col mt-8 animate-in slide-in-from-bottom-8 duration-500 min-h-0">
                
                {/* CHAT HISTORY */}
                <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>

                      
                      <div className={`p-5 rounded-3xl text-base leading-relaxed backdrop-blur-md shadow-xl ${
                        msg.sender === 'user'
                          ? 'bg-[#1C1C1E]/90 text-white rounded-tr-sm border border-white/10'
                          : 'bg-[#FF5500]/10 border border-[#FF5500]/20 text-white/90 rounded-tl-sm'
                      }`}>
                        <TypewriterMessage text={msg.text} isAgent={msg.sender === 'agent'} messageId={msg.id} />
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex flex-col max-w-[80%] mr-auto items-start">

                      <div className="p-5 rounded-3xl rounded-tl-sm bg-[#FF5500]/5 border border-[#FF5500]/10 backdrop-blur-md">
                        <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5500]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} className="h-4" />
                </div>

                {/* BOTTOM FLOATING INPUT (When chatting) */}
                <div className="absolute bottom-6 left-0 right-0 px-4">
                  <div className="max-w-3xl mx-auto relative">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Mic className="w-5 h-5 text-white/40" />
                    </div>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Reply to AQR AI..."
                      className="w-full pl-16 pr-16 py-5 rounded-full outline-none transition-all border border-white/10 bg-[#1C1C1E]/90 backdrop-blur-xl focus:border-[#FF5500]/50 text-white placeholder:text-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                      disabled={isTyping}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isTyping}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                        !input.trim() || isTyping
                          ? 'text-white/20 bg-transparent'
                          : 'text-white bg-[#FF5500] hover:bg-[#E64D00] shadow-[0_0_15px_rgba(255,85,0,0.4)]'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
};
