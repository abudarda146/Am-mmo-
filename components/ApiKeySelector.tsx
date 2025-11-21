
import React from 'react';

interface ApiKeySelectorProps {
  onClose: () => void;
  onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onClose, onKeySelected }) => {
  const handleSelectKey = async () => {
    try {
        await window.aistudio.openSelectKey();
        onKeySelected();
    } catch (e) {
        console.error("Could not open API key selector", e);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-selector-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full border border-slate-700 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="api-key-selector-title" className="text-2xl font-bold text-amber-400 mb-4">API কী প্রয়োজন</h2>
        <p className="text-slate-300 mb-6">
          ভিডিও তৈরি করার জন্য, আপনাকে আপনার নিজস্ব Gemini API কী নির্বাচন করতে হবে। এটি Veo মডেল ব্যবহারের জন্য প্রয়োজন।
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors duration-200"
        >
          API কী নির্বাচন করুন
        </button>
        <p className="text-xs text-slate-500 mt-4 text-center">
          এই বৈশিষ্ট্যটি ব্যবহার করে আপনার অ্যাকাউন্টে চার্জ প্রযোজ্য হতে পারে। বিস্তারিত জানতে{' '}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">
            বিলিং ডকুমেন্টেশন
          </a>{' '}
          দেখুন।
        </p>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="বন্ধ করুন"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ApiKeySelector;
