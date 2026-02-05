
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
  onDownloadAudio: (messageId: string) => void;
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

  // iOS 17 Style Bubbles
  const bubbleClasses = isModel
    ? 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/5 text-gray-100 rounded-[1.5rem] rounded-tl-sm'
    : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-[1.5rem] rounded-tr-sm shadow-lg shadow-orange-500/20';
  
  const handlePlayPauseClick = () => onPlayPause(message.id, message.content);

  const shouldShowActionButtons = isModel && message.content && !isStreaming && message.id !== 'initial-message' && isLastMessage && !message.imageUrl && !message.isGeneratingImage;
  const canGenerateMedia = isModel && message.id !== 'initial-message' && message.content && !isStreaming;

  return (
    <div className={`w-full max-w-3xl mx-auto flex flex-col my-6 animate-slide-up ${isModel ? 'items-start' : 'items-end'}`}>
      
      {/* Avatar & Name (Optional, good for group chat feel) */}
      <div className={`flex items-center gap-3 mb-2 px-2 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm ${isModel ? 'bg-gray-800 text-amber-500' : 'bg-gray-700 text-gray-300'}`}>
            {isModel ? '🤖' : '👤'}
        </div>
        <span className="text-xs font-medium text-gray-500">{isModel ? 'গল্পকার' : 'আপনি'}</span>
      </div>

      <div className={`relative px-5 py-4 max-w-[95%] md:max-w-[85%] group ${bubbleClasses}`}>
            
            {/* Media Section (Images) */}
            {(message.imageUrl || message.isGeneratingImage) && (
                <div className="mb-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {message.isGeneratingImage ? (
                        <div className="w-full aspect-video bg-gray-800/50 flex flex-col items-center justify-center animate-pulse">
                            <LoadingSpinner />
                        </div>
                    ) : message.imageUrl ? (
                        <Link to={`/image/${message.id}`} className="block relative group/image">
                            <img src={message.imageUrl} alt="Generated" className="w-full h-auto block" />
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">View</span>
                            </div>
                        </Link>
                    ) : null}
                </div>
            )}

            {/* Text Content */}
            {isModel && isStreaming && !message.content ? (
                 <div className="flex gap-1 py-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
            ) : message.content ? (
              <div className={`prose prose-invert max-w-none leading-relaxed text-[1.05rem] ${isModel ? 'font-serif' : 'font-sans'}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ) : null}

            {/* Audio Player */}
            {isModel && message.content && !isStreaming && (
                <div className="mt-4 pt-4 border-t border-white/10">
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
                        onDownloadClick={() => onDownloadAudio(message.id)}
                    />
                </div>
            )}
            
             {/* Context Menu / Actions (Generate Image) */}
             {canGenerateMedia && !message.imageUrl && !message.isGeneratingImage && (
                <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                   <button 
                        onClick={() => onRequestImage(message.id)} 
                        className="bg-gray-800/80 backdrop-blur text-xs px-3 py-1.5 rounded-full text-amber-400 hover:bg-gray-700 border border-gray-700"
                    >
                        🎨 ছবি আঁকুন
                    </button>
                </div>
            )}
      </div>

      {/* Suggestion Chips (Outside bubble) */}
      {shouldShowActionButtons && (
          <div className="flex flex-wrap gap-2 mt-2 px-2 animate-scale-in justify-end">
              <button
                  onClick={() => onSuggestionClick("হ্যাঁ, পরবর্তী অংশ বলুন")}
                  className="px-4 py-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-amber-400 rounded-full text-sm font-medium transition-colors border border-white/5"
              >
                  চালিয়ে যান →
              </button>
          </div>
      )}
    </div>
  );
};

export default ChatMessage;
