
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout } from '../services/firebaseService';

interface HeaderProps {
  user?: User | null;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar }) => {
  return (
    <header className="bg-slate-800/80 backdrop-blur-md p-3 md:p-4 border-b border-slate-700/50 shadow-lg sticky top-0 z-40">
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
          <Link to="/" className="flex flex-col group cursor-pointer">
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 tracking-wider group-hover:from-amber-300 group-hover:to-amber-100 transition-all">গল্পের আসর</h1>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user && (
            <>
                {/* Professional Settings Button */}
                <Link
                    to="/settings"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all"
                    title="সেটিংস"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </Link>

                <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-slate-600 overflow-hidden bg-slate-700 flex items-center justify-center shadow-lg hover:border-amber-500 transition-colors">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-amber-400 font-bold text-lg">
                        {user.isAnonymous ? '?' : (user.displayName?.[0] || 'U')}
                      </span>
                    )}
                  </div>
                  
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                        {user.isAnonymous ? 'অতিথি' : (user.displayName?.split(' ')[0] || user.email?.split('@')[0])}
                    </span>
                    <button 
                      onClick={() => logout()}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase font-bold tracking-wide"
                    >
                      লগআউট
                    </button>
                  </div>
                </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
