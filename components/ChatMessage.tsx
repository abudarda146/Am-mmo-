

import React from 'react';
import { Link } from 'react-router-dom';
import { Message, Role } from '../types';
import AudioControl from './AudioControl';
import type { AudioState } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  isLastMessage: boolean;
  audioState?: AudioState;
  onPlayPause: (messageId: string, content: string) => void;
  onDownloadAudio: (messageId: string) => void;
  onRequestImage: (messageId: string) => void;
  onRequestVideo: (messageId: string) => void;
  onRequestSlideshow: (messageId: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onSeek: (messageId: string, time: number) => void;
  onSuggestionClick: (suggestion: string) => void;
  analyser: AnalyserNode | null;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
    message, 
    isStreaming = false,
    isLastMessage,
    audioState, 
    onPlayPause, 
    onDownloadAudio,
    onRequestImage,
    onRequestVideo,
    onRequestSlideshow,
    volume,
    onVolumeChange,
    onSeek,
    onSuggestionClick,
    analyser
}) => {
  const isModel = message.role === Role.MODEL;

  const bubbleClasses = isModel
    ? 'bg-slate-800 text-slate-300 rounded-lg rounded-bl-none'
    : 'bg-amber-600 text-white rounded-lg rounded-br-none';
  
  const avatarContainerClasses = isModel
    ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 rounded-lg' // AI Storyteller gets a rounded square
    : 'bg-slate-700 rounded-full'; // User gets a circle

  const avatarPlayingClasses = isModel && audioState?.isPlaying ? 'animate-pulse-glow' : '';

  const handlePlayPauseClick = () => {
    onPlayPause(message.id, message.content);
  }

  const handleDownloadClick = () => {
    onDownloadAudio(message.id);
  }

  const handleSeek = (time: number) => {
    onSeek(message.id, time);
  }

  const handleSkip = (amount: number) => {
    const newTime = Math.max(0, Math.min(audioState?.duration ?? 0, (audioState?.currentTime ?? 0) + amount));
    onSeek(message.id, newTime);
  }
  
  const shouldShowActionButtons = isModel && message.content && !isStreaming && message.id !== 'initial-message' && isLastMessage && !message.imageUrl && !message.isGeneratingImage && !message.videoUrl && !message.isGeneratingVideo && !message.slideshow && !message.isGeneratingSlideshow;
  const canGenerateMedia = isModel && message.id !== 'initial-message' && message.content && !isStreaming;

  return (
    <div className={`w-full max-w-4xl mx-auto flex items-end gap-3 my-4 ${isModel ? 'flex-row' : 'flex-row-reverse'} animate-fade-in-up`}>
      <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl shadow-md ${avatarContainerClasses} ${avatarPlayingClasses} transition-all duration-300`}>
        {isModel ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-400">
            <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.5a.75.75 0 00.5.707c1.728.348 3.483.504 5.25.504a9.735 9.735 0 003.25-.555.75.75 0 00.5-.707V5.24a.75.75 0 00-.5-.707z" />
            <path d="M12.75 4.533c1.728-.348 3.483-.504 5.25-.504a9.735 9.735 0 013.25.555.75.75 0 01.5.707v14.5a.75.75 0 01-.5.707c-1.728.348-3.483.504-5.25.504a9.735 9.735 0 01-3.25-.555.75.75 0 01-.5-.707V5.24a.75.75 0 01.5-.707z" />
          </svg>
        ) : '👤'}
      </div>
      <div className={`p-4 md:p-5 shadow-md max-w-[80%] ${bubbleClasses} transition-all`}>
        {(message.imageUrl || message.isGeneratingImage) && (
            <div className="mb-2 rounded-lg overflow-hidden border border-slate-700">
                {message.isGeneratingImage ? (
                    <div className="relative w-full aspect-video bg-slate-700/50 flex flex-col items-center justify-center p-4 animate-shimmer">
                        <span className="text-slate-300 text-sm font-medium z-10">ছবি তৈরি হচ্ছে...</span>
                    </div>
                ) : message.imageUrl ? (
                    <Link to={`/image/${message.id}`} className="block relative group" title="ছবিটি বড় করে দেখুন">
                        <img src={message.imageUrl} alt="Generated content" className="max-w-full h-auto rounded-lg block group-hover:opacity-70 transition-opacity" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white font-bold flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                বড় করে দেখুন
                            </span>
                        </div>
                    </Link>
                ) : null}
            </div>
        )}
        
        {(message.videoUrl || message.isGeneratingVideo) && (
            <div className="mb-2 rounded-lg overflow-hidden border border-slate-700">
                {message.isGeneratingVideo ? (
                    <div className="relative w-full aspect-video bg-slate-700/50 flex flex-col items-center justify-center p-4 animate-shimmer">
                        <span className="text-slate-300 text-sm font-medium z-10 text-center">
                            ভিডিও তৈরি হচ্ছে... <br/>
                            <span className="text-xs">এটি কয়েক মিনিট সময় নিতে পারে।</span>
                        </span>
                    </div>
                ) : message.videoUrl ? (
                    <Link to={`/video/${message.id}`} className="block relative group" title="ভিডিওটি দেখুন">
                        <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg">
                            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center border-2 border-white/50 group-hover:bg-amber-600 group-hover:border-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <span className="text-white font-bold flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                ভিডিও দেখুন
                            </span>
                        </div>
                    </Link>
                ) : null}
            </div>
        )}
        
        {(message.slideshow || message.isGeneratingSlideshow) && (
            <div className="mb-2 rounded-lg overflow-hidden border border-slate-700">
                 {message.isGeneratingSlideshow ? (
                    <div className="relative w-full aspect-video bg-slate-700/50 flex flex-col items-center justify-center p-4 animate-shimmer">
                        <span className="text-slate-300 text-sm font-medium z-10 text-center">
                            স্লাইডশো তৈরি হচ্ছে... <br/>
                            <span className="text-xs">একাধিক ছবি তৈরি করা হচ্ছে।</span>
                        </span>
                    </div>
                ) : message.slideshow && message.slideshow.length > 0 ? (
                    <Link to={`/slideshow/${message.id}`} className="block relative group" title="স্লাইডশো দেখুন">
                        <div className="relative w-full aspect-video">
                             <img src={message.slideshow[0]} alt="Slideshow cover" className="w-full h-full object-cover rounded-lg" />
                             {/* Stack effect */}
                             <div className="absolute top-1 right-1 bottom-2 left-2 bg-slate-800 rounded-lg -z-10 transform rotate-2"></div>
                             <div className="absolute top-2 right-2 bottom-1 left-1 bg-slate-800 rounded-lg -z-20 transform -rotate-2"></div>
                             
                             <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="bg-black/50 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md flex items-center gap-2 group-hover:bg-amber-600 group-hover:border-amber-400 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                    </svg>
                                    <span className="text-white text-sm font-bold">{message.slideshow.length}টি ছবি</span>
                                </div>
                             </div>
                        </div>
                    </Link>
                ) : null}
            </div>
        )}

        {isModel && isStreaming && !message.content ? (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 italic">গল্পকার লিখছেন...</span>
              <LoadingSpinner />
            </div>
        ) : message.content ? (
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {message.content}
            {isStreaming && <span className="inline-block align-bottom w-1 h-5 bg-amber-400 ml-1 animate-blink"></span>}
          </p>
        ) : null}

        {canGenerateMedia && (
            <div className="mt-4 border-t border-slate-700 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {!message.imageUrl && !message.isGeneratingImage && !message.videoUrl && !message.isGeneratingVideo && !message.slideshow && !message.isGeneratingSlideshow && (
                   <>
                    <button onClick={() => onRequestImage(message.id)} className="px-3 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                        ছবি
                    </button>
                    
                    <button onClick={() => onRequestSlideshow(message.id)} className="px-3 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                        স্লাইডশো
                    </button>

                    <button onClick={() => onRequestVideo(message.id)} className="px-3 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" /><path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                        ভিডিও
                    </button>
                   </>
                )}
            </div>
        )}

        {isModel && message.content && !isStreaming && (
            <div className="mt-3">
                <AudioControl 
                    isLoading={audioState?.isLoading ?? false}
                    isBuffering={audioState?.isBuffering ?? false}
                    isPlaying={audioState?.isPlaying ?? false}
                    hasError={audioState?.error}
                    progress={audioState?.progress ?? 0}
                    currentTime={audioState?.currentTime ?? 0}
                    duration={audioState?.duration ?? 0}
                    volume={volume}
                    onPlayPauseClick={handlePlayPauseClick}
                    onDownloadClick={handleDownloadClick}
                    onSeek={handleSeek}
                    onVolumeChange={onVolumeChange}
                    onSkip={handleSkip}
                    analyser={audioState?.isPlaying ? analyser : null}
                />
            </div>
        )}
        {shouldShowActionButtons && (
            <div className="mt-4 border-t border-slate-700 pt-3 flex items-center gap-3">
                <button
                    onClick={() => onSuggestionClick("হ্যাঁ, পরবর্তী অংশ বলুন")}
                    className="flex-1 text-center px-4 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                >
                    গল্প চালিয়ে যান...
                </button>
                <button
                    onClick={() => onSuggestionClick("আচ্ছা এখন গল্প শেষ কর")}
                    className="flex-1 text-center px-4 py-2 bg-rose-800/60 text-rose-200 rounded-lg hover:bg-rose-700/80 transition-colors duration-200"
                >
                    গল্প শেষ করুন
                </button>
            </div>
        )}
        {message.sources && message.sources.length > 0 && (
            <div className="mt-4 border-t border-slate-700 pt-3">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">উৎস:</h4>
                <ul className="list-disc list-inside space-y-1">
                    {message.sources.map((source, index) => (
                        <li key={index} className="text-sm truncate">
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-amber-400 hover:text-amber-300 underline transition-colors"
                                title={source.title}
                            >
                                {source.title || new URL(source.uri).hostname}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;