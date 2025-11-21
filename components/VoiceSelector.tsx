

import React from 'react';

type VoiceOption = { value: string; label: string };

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  isDisabled: boolean;
}

const voiceOptions: VoiceOption[] = [
  { value: 'Zephyr', label: 'তরুণী' }, // Young female voice (Conversational)
  { value: 'Kore', label: 'নারী' },    // Mature female voice (Storytelling)
  { value: 'Puck', label: 'পুরুষ' },   // Mature male voice (Storytelling)
];

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ currentVoice, onVoiceChange, isDisabled }) => {
  return (
    <div className="flex justify-center items-center gap-2">
      <span className="text-slate-400 text-sm mr-2" id="voice-selector-label">কণ্ঠস্বর:</span>
      <div 
        className="flex flex-wrap justify-center items-center bg-slate-800 rounded-lg p-1 border border-slate-700" 
        role="group" 
        aria-labelledby="voice-selector-label"
      >
        {voiceOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onVoiceChange(value)}
            disabled={isDisabled}
            className={`px-4 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              currentVoice === value
                ? 'bg-amber-600 text-white shadow'
                : 'bg-transparent text-slate-300 hover:bg-slate-700'
            } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-pressed={currentVoice === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VoiceSelector;