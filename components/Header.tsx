
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';

interface HeaderProps {
  user?: User | null;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar }) => {
  return (
    <div className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
            {user && (
                <button 
                    onClick={onToggleSidebar}
                    className="group relative w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-cosmic-accent/50"
                >
                    <div className="space-y-1.5">
                        <span className="block w-5 h-0.5 bg-gray-400 group-hover:bg-cosmic-accent transition-colors"></span>
                        <span className="block w-3 h-0.5 bg-gray-400 group-hover:bg-cosmic-accent transition-colors"></span>
                    </div>
                </button>
            )}
            
            <Link to="/" className="group flex items-center gap-3">
                <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-cosmic-gold blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-cosmic-gold relative z-10">
                         <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.5a.75.75 0 00.5.707c1.728.348 3.483.504 5.25.504a9.735 9.735 0 003.25-.555.75.75 0 00.5-.707V5.24a.75.75 0 00-.5-.707z" />
                         <path d="M12.75 4.533c1.728-.348 3.483-.504 5.25-.504a9.735 9.735 0 013.25.555.75.75 0 01.5.707v14.5a.75.75 0 01-.5.707c-1.728.348-3.483.504-5.25.504a9.735 9.735 0 01-3.25-.555.75.75 0 01-.5-.707V5.24a.75.75 0 01.5-.707z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-amber-200 tracking-widest uppercase opacity-90 group-hover:opacity-100 transition-opacity">
                    Gollper Asor
                </h1>
            </Link>
        </div>

        {/* Right: User/Settings */}
        <div className="flex items-center gap-4">
            {user && (
                <>
                    <Link
                        to="/settings"
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <circle cx="12" cy="12" r="3" strokeWidth="2"></circle>
                             <path strokeWidth="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
                        </svg>
                    </Link>

                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-cosmic-gold text-xs">
                                {user.displayName?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default Header;
