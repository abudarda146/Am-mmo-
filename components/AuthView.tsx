
import React, { useState } from 'react';
import { loginWithGoogle, loginAsGuest } from '../services/firebaseService';

const AuthView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (method: 'google' | 'guest') => {
    setIsLoading(true);
    setError(null);
    try {
        if (method === 'google') await loginWithGoogle();
        else await loginAsGuest();
    } catch (err) {
      setError("লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative z-10">
      
      <div className="w-full max-w-sm ios-glass p-10 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden group border-white/10">
        
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl shadow-amber-500/30 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.5a.75.75 0 00.5.707c1.728.348 3.483.504 5.25.504a9.735 9.735 0 003.25-.555.75.75 0 00.5-.707V5.24a.75.75 0 00-.5-.707z" />
                  <path d="M12.75 4.533c1.728-.348 3.483-.504 5.25-.504a9.735 9.735 0 013.25.555.75.75 0 01.5.707v14.5a.75.75 0 01-.5.707c-1.728.348-3.483.504-5.25.504a9.735 9.735 0 01-3.25-.555.75.75 0 01-.5-.707V5.24a.75.75 0 01.5-.707z" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 font-serif">গল্পের আসর</h1>
            <p className="text-gray-400 text-sm mb-8">কথার জাদুতে হারিয়ে যান...</p>

            {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 py-2 px-3 rounded-lg">{error}</p>}

            <button
                onClick={() => handleLogin('google')}
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 ios-btn shadow-lg mb-4 flex items-center justify-center gap-3"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" alt="" className="w-5 h-5" />
                গুগল দিয়ে শুরু
            </button>

            <button
                onClick={() => handleLogin('guest')}
                disabled={isLoading}
                className="w-full py-4 bg-gray-800 text-white font-medium rounded-2xl hover:bg-gray-700 ios-btn"
            >
                অতিথি হিসেবে
            </button>

            {isLoading && <div className="mt-6 w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
