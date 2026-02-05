
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
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />
      
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-80 ios-glass border-r-0 md:border-r border-white/10
        transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-2xl
        flex flex-col h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:bg-transparent md:backdrop-filter-none md:shadow-none'}
      `}>
        {/* New Chat Area */}
        <div className="p-6">
          <button
            onClick={() => {
                onNewChat();
                if (window.innerWidth < 1024) onToggle();
            }}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white text-black font-bold rounded-[1.25rem] hover:bg-gray-100 ios-btn shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            নতুন গল্প
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">লাইব্রেরি</h3>
            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-40">
                    <span className="text-4xl mb-2">📚</span>
                    <span className="text-xs text-gray-400">খালি</span>
                </div>
            ) : (
                sessions.map(session => (
                    <div 
                        key={session.id}
                        className={`
                            group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200
                            ${currentSessionId === session.id 
                                ? 'bg-white/10 text-white shadow-lg backdrop-blur-md' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                        `}
                        onClick={() => {
                            onSelectSession(session.id);
                            if (window.innerWidth < 1024) onToggle();
                        }}
                    >
                        <span className="text-lg">{currentSessionId === session.id ? '📖' : '📄'}</span>
                        <span className="flex-1 truncate text-sm font-medium">
                            {session.title || 'শিরোনামহীন'}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
