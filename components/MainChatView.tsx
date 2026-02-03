
import React from 'react';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import LoadingSpinner from './LoadingSpinner';
import { Message } from '../types';
import type { AudioState } from '../types';

interface MainChatViewProps {
  messages: Message[];
  isLoading: boolean;
  isGeneratingPrompt: boolean;
  getSuggestions: () => string[];
  handleSendMessage: (message: string) => void;
  audioStates: Record<string, AudioState>;
  handlePlayPause: (messageId: string, content: string) => void;
  handleDownloadAudio: (messageId: string) => void;
  handleRequestImage: (messageId: string) => void;
  // Removed unused video/slideshow handlers
  handleRequestVideo: (messageId: string) => void;
  handleRequestSlideshow: (messageId: string) => void;
  volume: number;
  handleVolumeChange: (volume: number) => void;
  handleSeek: (messageId: string, time: number) => void;
  analyser: AnalyserNode | null;
  error: string | null;
  initializeChatSession: () => void;
  handleRandomStory: () => void;
  handleRegenerateVoice: (messageId: string, content: string) => void;
}

const MainChatView: React.FC<MainChatViewProps> = (props) => {
  const {
    messages,
    isLoading,
    isGeneratingPrompt,
    getSuggestions,
    handleSendMessage,
    audioStates,
    handlePlayPause,
    handleDownloadAudio,
    handleRequestImage,
    handleRequestVideo,
    handleRequestSlideshow,
    volume,
    handleVolumeChange,
    handleSeek,
    analyser,
    error,
    handleRandomStory,
    handleRegenerateVoice
  } = props;

  const combinedIsLoading = isLoading || isGeneratingPrompt || messages.some(m => m.isGeneratingImage);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        suggestions={getSuggestions()}
        onSuggestionClick={handleSendMessage}
        audioStates={audioStates}
        onPlayPause={handlePlayPause}
        onDownloadAudio={handleDownloadAudio}
        onRequestImage={handleRequestImage}
        onRequestVideo={handleRequestVideo}
        onRequestSlideshow={handleRequestSlideshow}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        analyser={analyser}
        onRegenerateVoice={handleRegenerateVoice}
      />
      {error && <div className="text-center text-red-400 pb-2 animate-fade-in text-sm px-4">{error}</div>}
      <div className="flex flex-col items-center pb-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomStory}
            className="px-5 py-2.5 bg-slate-800/90 text-amber-400 rounded-full hover:bg-slate-700 transition-all text-sm flex items-center gap-2 disabled:opacity-50 border border-slate-700 active:scale-95 shadow-lg hover:shadow-amber-500/10"
            disabled={combinedIsLoading}
            title="AI দিয়ে একটি গল্পের বিষয়বস্তু তৈরি করুন"
          >
            {isGeneratingPrompt ? <LoadingSpinner /> : <span className="text-lg leading-none">🎲</span>}
            <span className="font-bold">দৈবচয়িত গল্প তৈরি করুন</span>
          </button>
        </div>
      </div>
      <MessageInput onSendMessage={handleSendMessage} isLoading={combinedIsLoading} />
    </div>
  );
};

export default MainChatView;
