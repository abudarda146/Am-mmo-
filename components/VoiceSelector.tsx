
import React, { useState, useRef, useEffect } from 'react';
import { generateStoryAudio } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  isDisabled: boolean;
}

const VOICES = [
  { id: 'Kore', label: 'নারী (গল্পকার)', description: 'শান্ত, পেশাদার এবং গভীর', gender: 'Female' },
  { id: 'Charon', label: 'পুরুষ (গভীর)', description: 'রহস্যময়, গম্ভীর এবং চলচ্চিত্রধর্মী', gender: 'Male' },
  { id: 'Fenrir', label: 'পুরুষ (জোরালো)', description: 'শক্তিশালী, নাটকীয় এবং স্পষ্ট', gender: 'Male' },
  { id: 'Zephyr', label: 'নারী (প্রাণবন্ত)', description: 'বন্ধুত্বপূর্ণ, মিষ্টি এবং সাবলীল', gender: 'Female' },
  { id: 'Puck', label: 'পুরুষ (স্বাভাবিক)', description: 'সাবলীল এবং কথোপকথনধর্মী', gender: 'Male' },
];

const DEMO_TEXT = "হ্যালো! আমি আপনার ব্যক্তিগত গল্পকার।";

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ currentVoice, onVoiceChange, isDisabled }) => {
  const [playingDemo, setPlayingDemo] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) {}
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const playDemo = async (voiceName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Stop if currently playing this voice
    if (playingDemo === voiceName) {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e){}
        }
        setPlayingDemo(null);
        return;
    }

    // Stop any other playing
    if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e){}
    }
    setPlayingDemo(null);

    setLoadingDemo(voiceName);
    try {
        const base64Audio = await generateStoryAudio(DEMO_TEXT, voiceName);
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } else if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const audioData = decode(base64Audio);
        const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        sourceRef.current = source;
        
        setPlayingDemo(voiceName);
        setLoadingDemo(null);

        source.onended = () => {
            setPlayingDemo(null);
            sourceRef.current = null;
        };

    } catch (e) {
        console.error("Demo failed", e);
        setLoadingDemo(null);
        setPlayingDemo(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider text-center" id="voice-selector-label">ডিফল্ট কণ্ঠস্বর</span>
      <div 
        className="flex flex-col gap-3 w-full" 
        role="group" 
        aria-labelledby="voice-selector-label"
      >
        {VOICES.map((voice) => (
          <div
            key={voice.id}
            onClick={() => !isDisabled && onVoiceChange(voice.id)}
            className={`
                relative p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                ${currentVoice === voice.id 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/50'}
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-4">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg
                    ${currentVoice === voice.id ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300'}
                `}>
                    {voice.gender === 'Female' ? '👩' : '👨'}
                </div>
                <div>
                    <h3 className={`font-bold text-sm md:text-base ${currentVoice === voice.id ? 'text-white' : 'text-slate-200'}`}>
                        {voice.label}
                    </h3>
                    <p className="text-xs text-slate-400">{voice.description}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <button
                    onClick={(e) => playDemo(voice.id, e)}
                    disabled={isDisabled}
                    className={`
                        p-2 rounded-full transition-all z-10
                        ${playingDemo === voice.id 
                            ? 'bg-amber-500 text-white animate-pulse' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'}
                    `}
                    title="ডেমো শুনুন"
                >
                    {loadingDemo === voice.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : playingDemo === voice.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                             <rect x="6" y="4" width="4" height="12" rx="1" />
                             <rect x="14" y="4" width="4" height="12" rx="1" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                
                {/* Selection Radio Circle */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${currentVoice === voice.id ? 'border-amber-500' : 'border-slate-500'}`}>
                    {currentVoice === voice.id && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceSelector;
    