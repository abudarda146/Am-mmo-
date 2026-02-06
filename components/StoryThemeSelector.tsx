
import React from 'react';
import { StoryTheme } from '../types';

interface StoryThemeSelectorProps {
  currentTheme: StoryTheme;
  onThemeChange: (theme: StoryTheme) => void;
  isDisabled: boolean;
}

const themeOptions: { value: StoryTheme; label: string; icon: string }[] = [
  { value: 'general', label: 'সাধারণ', icon: '✨' },
  { value: 'fantasy', label: 'ফ্যান্টাসি', icon: '🦄' },
  { value: 'scifi', label: 'কল্পবিজ্ঞান', icon: '🚀' },
  { value: 'mystery', label: 'রহস্য', icon: '🕵️' },
  { value: 'romance', label: 'রোমান্টিক', icon: '❤️' },
  { value: 'horror', label: 'ভৌতিক', icon: '👻' },
];

const StoryThemeSelector: React.FC<StoryThemeSelectorProps> = ({ currentTheme, onThemeChange, isDisabled }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider text-center" id="story-theme-label">গল্পের ধরণ (Theme)</span>
      <div 
        className="grid grid-cols-2 md:grid-cols-3 gap-3" 
        role="group" 
        aria-labelledby="story-theme-label"
      >
        {themeOptions.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => onThemeChange(value)}
            disabled={isDisabled}
            className={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border flex items-center justify-center gap-2 ${
              currentTheme === value
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
            } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95'}`}
            aria-pressed={currentTheme === value}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoryThemeSelector;
