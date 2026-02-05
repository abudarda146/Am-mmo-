
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    sessions, 
    currentSessionId, 
    onSelectSession, 
    onNewChat, 
    onDeleteSession,
    isOpen,
    onToggle
}) => {
  return (
    <>
      {/* Dark overlay with blur */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />
      
      <div className={`
        fixed inset-y-0 left-0 z-40
        w-80 bg-[#050511]/90 backdrop-blur-xl border-r border-white/5
        transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-[0_0_50px_rgba(0,0,0,0.8)]
        flex flex-col h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-8 border-b border-white/5">
            <h2 className="text-cosmic-gold font-display text-xl tracking-widest mb-1">ARCHIVES</h2>
            <p className="text-xs text-gray-500 font-sans tracking-wide">YOUR STORY COLLECTION</p>
        </div>

        {/* New Chat Button */}
        <div className="p-6">
          <button
            onClick={() => {
                onNewChat();
                onToggle();
            }}
            className="w-full group relative overflow-hidden py-4 px-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
          >
            <div className="absolute inset-0 w-1 bg-cosmic-accent group-hover:w-full transition-all duration-300 opacity-10"></div>
            <div className="flex items-center gap-3 relative z-10">
                <span className="text-xl">✨</span>
                <span className="font-bold text-white tracking-wide text-sm uppercase">Begin New Tale</span>
            </div>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-30 text-center">
                    <span className="text-4xl mb-4 grayscale">📜</span>
                    <span className="text-xs text-gray-400 font-mono">NO RECORDS FOUND</span>
                </div>
            ) : (
                sessions.map(session => (
                    <div 
                        key={session.id}
                        className={`
                            group flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 border
                            ${currentSessionId === session.id 
                                ? 'bg-cosmic-purple/10 border-cosmic-purple/30 text-white' 
                                : 'bg-transparent border-transparent text-gray-400 hover:border-white/10 hover:text-gray-200'}
                        `}
                        onClick={() => {
                            onSelectSession(session.id);
                            onToggle();
                        }}
                    >
                        <div className={`w-1 h-8 rounded-full ${currentSessionId === session.id ? 'bg-cosmic-purple shadow-[0_0_10px_#bd00ff]' : 'bg-white/10 group-hover:bg-white/30'}`}></div>
                        <span className="flex-1 truncate text-sm font-medium font-sans">
                            {session.title || 'Untitled Chronicle'}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
