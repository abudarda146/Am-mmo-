
import React from 'react';
import { User } from 'firebase/auth';
import { logout } from '../services/firebaseService';

interface HeaderProps {
  user?: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 border-b border-slate-700 shadow-lg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="w-10 h-10 hidden md:block"></div> {/* Spacer for balance */}
        
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-amber-400 tracking-wider">গল্পের আসর</h1>
          <p className="text-slate-400 text-[10px] md:text-xs">আপনার ব্যক্তিগত গল্পকার</p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-slate-300">{user.isAnonymous ? 'অতিথি' : user.displayName}</span>
                <button 
                  onClick={() => logout()}
                  className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-tighter"
                >
                  লগআউট
                </button>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-amber-500/50 overflow-hidden bg-slate-700 flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-amber-400 font-bold">
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
