
import React, { useState, useRef } from 'react';
import { generateStoryAudio } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface VoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (voiceName: string) => void;
}

const VOICES = [
  { id: 'Zephyr', label: 'তরুণী', description: 'বন্ধুত্বপূর্ণ এবং প্রাণবন্ত', gender: 'Female' },
  { id: 'Kore', label: 'নারী', description: 'শান্ত এবং গল্প বলার জন্য উপযুক্ত', gender: 'Female' },
  { id: 'Puck', label: 'পুরুষ', description: 'গম্ভীর এবং স্পষ্ট', gender: 'Male' },
];

const DEMO_TEXT = "নমস্কার, আমি আপনার গল্পকার। আমি আপনার জন্য এই গল্পটি পড়ব।";

const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [playingDemo, setPlayingDemo] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore'); // Default selection
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  if (!isOpen) return null;

  const playDemo = async (voiceName: string) => {
    // Stop previous demo
    if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e){}
    }
    setPlayingDemo(null);

    setLoadingDemo(voiceName);
    try {
        const base64Audio = await generateStoryAudio(DEMO_TEXT, voiceName);
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        };

    } catch (e) {
        console.error("Demo failed", e);
        setLoadingDemo(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-xl font-bold text-amber-400">কণ্ঠস্বর নির্বাচন করুন</h2>
            <p className="text-slate-400 text-sm mt-1">গল্পটি শোনার জন্য আপনার পছন্দের ভয়েস আর্টিস্ট বেছে নিন।</p>
        </div>

        {/* Voice List */}
        <div className="p-6 space-y-4 overflow-y-auto">
            {VOICES.map((voice) => (
                <div 
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group
                        ${selectedVoice === voice.id 
                            ? 'border-amber-500 bg-amber-500/10' 
                            : 'border-slate-700 bg-slate-700/30 hover:border-slate-600 hover:bg-slate-700/50'}
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg
                            ${selectedVoice === voice.id ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300'}
                        `}>
                            {voice.gender === 'Female' ? '👩' : '👨'}
                        </div>
                        <div>
                            <h3 className={`font-bold ${selectedVoice === voice.id ? 'text-white' : 'text-slate-200'}`}>
                                {voice.label}
                            </h3>
                            <p className="text-xs text-slate-400">{voice.description}</p>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (playingDemo === voice.id) {
                                if (sourceRef.current) sourceRef.current.stop();
                                setPlayingDemo(null);
                            } else {
                                playDemo(voice.id);
                            }
                        }}
                        className={`
                            p-2 rounded-full transition-all
                            ${playingDemo === voice.id 
                                ? 'bg-amber-500 text-white animate-pulse' 
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white'}
                        `}
                        title="ডেমো শুনুন"
                    >
                        {loadingDemo === voice.id ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : playingDemo === voice.id ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                    
                    {/* Selection Indicator */}
                    <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 ${selectedVoice === voice.id ? 'border-amber-500 bg-amber-500' : 'border-slate-500 bg-transparent'}`}></div>
                </div>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-700 bg-slate-800 flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
            >
                বাতিল করুন
            </button>
            <button 
                onClick={() => onConfirm(selectedVoice)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
                অডিও তৈরি করুন
            </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelectionModal;
