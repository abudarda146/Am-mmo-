
import React from 'react';
import { Link } from 'react-router-dom';
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
  handleRequestVideo: (messageId: string) => void;
  handleRequestSlideshow: (messageId: string) => void;
  volume: number;
  handleVolumeChange: (volume: number) => void;
  handleSeek: (messageId: string, time: number) => void;
  analyser: AnalyserNode | null;
  error: string | null;
  initializeChatSession: () => void;
  handleRandomStory: () => void;
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
  } = props;

  const combinedIsLoading = isLoading || isGeneratingPrompt || messages.some(m => m.isGeneratingImage || m.isGeneratingVideo || m.isGeneratingSlideshow);

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
      />
      {error && <div className="text-center text-red-400 pb-2 animate-fade-in text-sm px-4">{error}</div>}
      <div className="flex flex-col items-center pb-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomStory}
            className="px-4 py-2 bg-slate-800/80 text-amber-400 rounded-xl hover:bg-slate-700 transition-all text-sm flex items-center gap-2 disabled:opacity-50 border border-slate-700 active:scale-95 shadow-md"
            disabled={combinedIsLoading}
            title="AI দিয়ে একটি গল্পের বিষয়বস্তু তৈরি করুন"
          >
            {isGeneratingPrompt ? <LoadingSpinner /> : <span className="text-lg leading-none">🎲</span>}
            <span className="font-bold">দৈবচয়িত গল্প</span>
          </button>
          <Link
            to="/settings"
            className="px-4 py-2 bg-slate-800/80 text-slate-300 rounded-xl hover:bg-slate-700 transition-all text-sm flex items-center gap-2 border border-slate-700 active:scale-95 shadow-md"
            aria-disabled={combinedIsLoading}
            onClick={(e) => {
              if (combinedIsLoading) e.preventDefault();
            }}
            style={{
              pointerEvents: combinedIsLoading ? 'none' : 'auto',
              opacity: combinedIsLoading ? 0.5 : 1,
            }}
            title="সেটিংস"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-1.57 1.996A1.532 1.532 0 013 8.217c-1.56.38-1.56 2.6 0 2.98a1.532 1.532 0 01.948 2.286c-.836 1.372.734 2.942 1.996 1.57A1.532 1.532 0 018.217 17c.38 1.56 2.6 1.56 2.98 0a1.532 1.532 0 012.286-.948c1.372.836 2.942-.734 1.57-1.996A1.532 1.532 0 0117 11.783c1.56-.38 1.56-2.6 0-2.98a1.532 1.532 0 01-.948-2.286c.836-1.372-.734-2.942-1.996-1.57A1.532 1.532 0 0111.783 3c-.38-.01-.543-.02-.793-.01zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="font-bold">সেটিংস</span>
          </Link>
        </div>
      </div>
      <MessageInput onSendMessage={handleSendMessage} isLoading={combinedIsLoading} />
    </div>
  );
};

export default MainChatView;
