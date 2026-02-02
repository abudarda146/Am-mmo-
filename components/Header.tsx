
import React from 'react';
import { User } from 'firebase/auth';
import { logout } from '../services/firebaseService';

interface HeaderProps {
  user?: User | null;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-md p-4 border-b border-slate-700 shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user && (
            <button 
                onClick={onToggleSidebar}
                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-all active:scale-90"
                title="হিস্ট্রি দেখান/লুকান"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-amber-400 tracking-wider">গল্পের আসর</h1>
            <p className="text-slate-400 text-[8px] md:text-[10px] uppercase tracking-widest hidden sm:block">AI গল্পকার</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">
                    {user.isAnonymous ? 'অতিথি' : (user.displayName || user.email?.split('@')[0])}
                </span>
                <button 
                  onClick={() => logout()}
                  className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase font-bold"
                >
                  লগআউট
                </button>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 overflow-hidden bg-slate-700 flex items-center justify-center shadow-lg">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-amber-400 font-bold text-lg">
                    {user.isAnonymous ? '?' : (user.displayName?.[0] || 'U')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
