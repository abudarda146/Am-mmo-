

import React from 'react';
import { Link } from 'react-router-dom';
import StoryLengthSelector from './StoryLengthSelector';
import VoiceSelector from './VoiceSelector';
import { StoryLength } from '../types';

interface SettingsViewProps {
  storyLength: StoryLength;
  onLengthChange: (length: StoryLength) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  isDisabled: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const {
    storyLength,
    onLengthChange,
    selectedVoice,
    onVoiceChange,
    isDisabled,
  } = props;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in">
        <div className="w-full max-w-lg bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-3xl font-bold text-amber-400 mb-6 text-center">সেটিংস</h2>
            <div className="space-y-8">
                <StoryLengthSelector
                    currentLength={storyLength}
                    onLengthChange={onLengthChange}
                    isDisabled={isDisabled}
                />
                <VoiceSelector
                    currentVoice={selectedVoice}
                    onVoiceChange={onVoiceChange}
                    isDisabled={isDisabled}
                />
            </div>
            <div className="mt-8 text-center">
                 <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    গল্পে ফিরে যান
                </Link>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;