
import React, { useState } from 'react';
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
  onDownloadAudio: (messageId: string, content: string) => void;
  onRequestImage: (messageId: string) => void;
  onRequestVideo: (messageId: string) => void;
  onRequestSlideshow: (messageId: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onSeek: (messageId: string, time: number) => void;
  onSuggestionClick: (suggestion: string) => void;
  analyser: AnalyserNode | null;
  onRegenerateVoice: (messageId: string, content: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
    message, 
    isStreaming = false,
    isLastMessage,
    audioState, 
    onPlayPause, 
    onDownloadAudio,
    onRequestImage,
    volume,
    onVolumeChange,
    onSeek,
    onSuggestionClick,
    analyser,
    onRegenerateVoice
}) => {
  const isModel = message.role === Role.MODEL;

  // New "Cosmic Card" Styles
  const containerClasses = isModel 
    ? 'items-start' 
    : 'items-end';

  const bubbleClasses = isModel
    ? 'cosmic-card-model text-gray-200 rounded-tr-[2rem] rounded-br-[2rem] rounded-bl-[2rem] max-w-[95%] md:max-w-[90%]'
    : 'cosmic-card-user text-white rounded-tl-[2rem] rounded-bl-[2rem] rounded-br-[2rem] max-w-[85%]';
  
  const handlePlayPauseClick = () => onPlayPause(message.id, message.content);

  const shouldShowActionButtons = isModel && message.content && !isStreaming && message.id !== 'initial-message' && isLastMessage && !message.imageUrl && !message.isGeneratingImage;
  const canGenerateMedia = isModel && message.id !== 'initial-message' && message.content && !isStreaming;

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col my-8 animate-slide-up px-2 ${containerClasses}`}>
      
      {/* Role Label with Glow */}
      <div className={`flex items-center gap-3 mb-2 px-2 opacity-80 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className={`text-[10px] tracking-[0.2em] uppercase font-bold ${isModel ? 'text-cosmic-purple' : 'text-cosmic-accent'}`}>
            {isModel ? 'THE NARRATOR' : 'YOU'}
        </span>
      </div>

      <div className={`relative px-8 py-8 group transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] ${bubbleClasses}`}>
            
            {/* Media Section (Images) */}
            {(message.imageUrl || message.isGeneratingImage) && (
                <div className="mb-6 rounded-lg overflow-hidden border border-white/10 w-full relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
                    {message.isGeneratingImage ? (
                        <div className="w-full aspect-video bg-black/40 flex flex-col items-center justify-center">
                             <div className="relative">
                                <div className="w-12 h-12 border-t-2 border-cosmic-accent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">✨</div>
                             </div>
                            <span className="text-xs text-cosmic-accent mt-3 font-mono tracking-widest">VISUALIZING...</span>
                        </div>
                    ) : message.imageUrl ? (
                        <Link to={`/image/${message.id}`} className="block relative group/image w-full">
                            <img src={message.imageUrl} alt="Generated" className="w-full h-auto block transform group-hover/image:scale-105 transition-transform duration-700" />
                             <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover/image:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold tracking-widest border border-white/30 px-3 py-1 rounded-full backdrop-blur-md">EXPAND</span>
                            </div>
                        </Link>
                    ) : null}
                </div>
            )}

            {/* Text Content */}
            {isModel && isStreaming && !message.content ? (
                 <div className="flex gap-2 py-4">
                    <div className="w-1.5 h-1.5 bg-cosmic-purple rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-cosmic-purple rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-cosmic-purple rounded-full animate-pulse [animation-delay:0.4s]"></div>
                 </div>
            ) : message.content ? (
              <div className={`prose prose-invert max-w-none leading-loose text-lg ${isModel ? 'font-serif text-amber-50/90' : 'font-sans font-light'}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ) : null}

            {/* Audio Player */}
            {isModel && message.content && !isStreaming && (
                <div className="mt-8 pt-6 border-t border-white/5">
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
                        onSeek={onSeek}
                        onVolumeChange={onVolumeChange}
                        onSkip={(amt) => onSeek(message.id, Math.max(0, (audioState?.currentTime || 0) + amt))}
                        analyser={audioState?.isPlaying ? analyser : null}
                        onRegenerateClick={() => onRegenerateVoice(message.id, message.content)}
                        onDownloadClick={() => onDownloadAudio(message.id, message.content)}
                    />
                </div>
            )}
            
            {/* Toolbar */}
            {canGenerateMedia && !message.imageUrl && !message.isGeneratingImage && (
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col gap-2 pl-4">
                   <button 
                        onClick={() => onRequestImage(message.id)} 
                        className="w-10 h-10 rounded-full bg-cosmic-glass flex items-center justify-center text-cosmic-accent hover:bg-cosmic-accent hover:text-black transition-colors shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                        title="চিত্রিত করুন"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                </div>
            )}
      </div>

      {/* Suggestion Chips */}
      {shouldShowActionButtons && (
          <div className="flex flex-wrap gap-3 mt-4 px-2 animate-scale-in justify-end">
              <button
                  onClick={() => onSuggestionClick("হ্যাঁ, পরবর্তী অংশ বলুন")}
                  className="px-6 py-2 bg-transparent border border-cosmic-accent/30 text-cosmic-accent hover:bg-cosmic-accent/10 hover:border-cosmic-accent rounded-full text-xs font-bold tracking-widest transition-all uppercase"
              >
                  CONTINUE STORY →
              </button>
          </div>
      )}
    </div>
  );
};

export default ChatMessage;
