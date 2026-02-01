
import React, { useState } from 'react';
import { loginWithGoogle, loginAsGuest } from '../services/firebaseService';

const AuthView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError("গুগল লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginAsGuest();
    } catch (err) {
      setError("গেস্ট লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl animate-message-pop text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.993 7.993 0 002 12a8 8 0 008 8 8.001 8.001 0 007-11.196l-5 2.5V4.804z" />
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v5.32l5.245-2.623a1 1 0 11.894 1.789L11 10.632V18a1 1 0 11-2 0v-7.368L2.861 7.486a1 1 0 11.894-1.789L9 8.32V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-amber-400 mb-2">গল্পের আসর</h1>
        <p className="text-slate-400 mb-8">আপনার জাদুকরী গল্পের জগতে স্বাগতম। শুরু করতে লগইন করুন।</p>
        
        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-200 text-sm rounded-lg">{error}</div>}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" alt="Google" className="w-5 h-5" />
            গুগল দিয়ে লগইন
          </button>
          
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-xs uppercase tracking-widest">অথবা</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-700 text-amber-400 font-bold rounded-xl hover:bg-slate-600 border border-slate-600 transition-all disabled:opacity-50"
          >
            অতিথি হিসেবে প্রবেশ
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <p className="mt-8 text-xs text-slate-500">
          প্রবেশ করার মাধ্যমে আপনি আমাদের শর্তাবলী ও গোপনীয়তা নীতি মেনে নিচ্ছেন।
        </p>
      </div>
    </div>
  );
};

export default AuthView;
