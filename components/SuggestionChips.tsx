
import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick, isLoading }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap justify-center gap-3 animate-fade-in">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-amber-300 rounded-full hover:bg-slate-700 hover:border-amber-500 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 active:bg-slate-600"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;