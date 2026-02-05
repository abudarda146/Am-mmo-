
import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full shrink-0 px-4 pb-6 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 ios-glass rounded-[2rem] p-1.5 shadow-2xl ring-1 ring-white/10 transition-all focus-within:ring-amber-500/50">
            
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="গল্পের মোড় ঘোরান..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-gray-500 resize-none py-3 px-5 max-h-32 min-h-[50px] custom-scrollbar text-base"
                rows={1}
                disabled={isLoading}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
            />
            
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-1 mr-1 transition-all duration-300
                ${isLoading || !input.trim() 
                    ? 'bg-gray-800 text-gray-500 cursor-default' 
                    : 'bg-amber-500 text-white hover:bg-amber-400 hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20'}
                `}
            >
                {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
                )}
            </button>
        </form>
        <p className="text-center text-[10px] text-gray-600 mt-3 font-medium tracking-wide">AI এর গল্প কাল্পনিক হতে পারে</p>
      </div>
    </div>
  );
};

export default MessageInput;
