
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
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30
        w-72 bg-slate-900 border-r border-slate-800 
        transition-transform duration-300 ease-in-out
        flex flex-col h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
                onNewChat();
                if (window.innerWidth < 768) onToggle();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            নতুন চ্যাট
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">আগের গল্পগুলো</h3>
            {sessions.length === 0 ? (
                <div className="p-4 text-center text-slate-600 italic text-sm">
                    কোনো হিস্ট্রি নেই
                </div>
            ) : (
                sessions.map(session => (
                    <div 
                        key={session.id}
                        className={`
                            group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                            ${currentSessionId === session.id 
                                ? 'bg-amber-600/20 border border-amber-600/30 text-amber-200' 
                                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'}
                        `}
                        onClick={() => {
                            onSelectSession(session.id);
                            if (window.innerWidth < 768) onToggle();
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-1 truncate text-sm font-medium">
                            {session.title || 'শিরোনামহীন গল্প'}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                            title="মুছুন"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))
            )}
        </div>

        {/* User Info (Footer) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="text-[10px] text-slate-600 text-center">গল্পের আসর v2.1 - Gemini AI দ্বারা চালিত</div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
