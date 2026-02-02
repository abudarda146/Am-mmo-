
import React, { useRef, useLayoutEffect } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import SuggestionChips from './SuggestionChips';
import type { AudioState } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  audioStates: Record<string, AudioState>;
  onPlayPause: (messageId: string, content: string) => void;
  onDownloadAudio: (messageId: string) => void;
  onRequestImage: (messageId: string) => void;
  onRequestVideo: (messageId: string) => void;
  onRequestSlideshow: (messageId: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onSeek: (messageId: string, time: number) => void;
  analyser: AnalyserNode | null;
  onRegenerateVoice: (messageId: string, content: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    messages, 
    isLoading, 
    suggestions, 
    onSuggestionClick, 
    audioStates, 
    onPlayPause,
    onDownloadAudio,
    onRequestImage,
    onRequestVideo,
    onRequestSlideshow,
    volume,
    onVolumeChange,
    onSeek,
    analyser,
    onRegenerateVoice
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={msg.id}
            message={msg}
            isStreaming={isLoading && index === messages.length - 1}
            isLastMessage={index === messages.length - 1}
            audioState={audioStates[msg.id]}
            onPlayPause={onPlayPause}
            onDownloadAudio={onDownloadAudio}
            onRequestImage={onRequestImage}
            onRequestVideo={onRequestVideo}
            onRequestSlideshow={onRequestSlideshow}
            volume={volume}
            onVolumeChange={onVolumeChange}
            onSeek={onSeek}
            onSuggestionClick={onSuggestionClick}
            analyser={analyser}
            onRegenerateVoice={onRegenerateVoice}
          />
        ))}
        {suggestions.length > 0 && !isLoading && <SuggestionChips suggestions={suggestions} onSuggestionClick={onSuggestionClick} isLoading={isLoading} />}
      </div>
    </div>
  );
};

export default ChatWindow;
