
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
    <div className="relative z-50 px-4 pt-4 pb-2">
        <header className="mx-auto max-w-5xl ios-glass rounded-[2rem] px-5 py-3 flex items-center justify-between shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4">
            {user && (
                <button 
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all ios-btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}
            <Link to="/" className="flex items-center gap-3 ios-btn">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.5a.75.75 0 00.5.707c1.728.348 3.483.504 5.25.504a9.735 9.735 0 003.25-.555.75.75 0 00.5-.707V5.24a.75.75 0 00-.5-.707z" />
                    <path d="M12.75 4.533c1.728-.348 3.483-.504 5.25-.504a9.735 9.735 0 013.25.555.75.75 0 01.5.707v14.5a.75.75 0 01-.5.707c-1.728.348-3.483.504-5.25.504a9.735 9.735 0 01-3.25-.555.75.75 0 01-.5-.707V5.24a.75.75 0 01.5-.707z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold font-serif text-white tracking-wide">গল্পের আসর</h1>
            </Link>
            </div>

            <div className="flex items-center gap-3">
            {user && (
                <>
                    <Link
                        to="/settings"
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all ios-btn"
                        title="সেটিংস"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Link>

                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 ios-btn">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center font-bold text-amber-500">
                                {user.displayName?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                </>
            )}
            </div>
        </header>
    </div>
  );
};

export default Header;
