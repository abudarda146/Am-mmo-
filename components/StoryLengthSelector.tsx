
import React from 'react';

type StoryLength = 'short' | 'medium' | 'long';

interface StoryLengthSelectorProps {
  currentLength: StoryLength;
  onLengthChange: (length: StoryLength) => void;
  isDisabled: boolean;
}

const lengthOptions: { value: StoryLength; label: string }[] = [
  { value: 'short', label: 'ছোট' },
  { value: 'medium', label: 'মাঝারি' },
  { value: 'long', label: 'দীর্ঘ' },
];

const StoryLengthSelector: React.FC<StoryLengthSelectorProps> = ({ currentLength, onLengthChange, isDisabled }) => {
  return (
    <div className="flex justify-center items-center gap-2">
      <span className="text-slate-400 text-sm mr-2" id="story-length-label">গল্পের দৈর্ঘ্য:</span>
      <div 
        className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700" 
        role="group" 
        aria-labelledby="story-length-label"
      >
        {lengthOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onLengthChange(value)}
            disabled={isDisabled}
            className={`px-4 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              currentLength === value
                ? 'bg-amber-600 text-white shadow'
                : 'bg-transparent text-slate-300 hover:bg-slate-700'
            } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-pressed={currentLength === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoryLengthSelector;
