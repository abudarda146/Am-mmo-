
import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
    <div className="w-full shrink-0 px-4 pb-8 pt-4 z-20 flex justify-center">
      <div className={`
        relative max-w-2xl w-full transition-all duration-500
        ${isFocused ? 'scale-105' : 'scale-100'}
      `}>
        {/* Glowing Aura behind input */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-cosmic-purple to-cosmic-accent rounded-[3rem] blur opacity-30 transition-opacity duration-500 ${isFocused ? 'opacity-70' : 'opacity-20'}`}></div>

        <form 
            onSubmit={handleSubmit} 
            className="relative bg-[#0a0a15]/90 backdrop-blur-xl rounded-[3rem] border border-white/10 flex items-end p-2 shadow-2xl overflow-hidden"
        >
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="গল্পের সুতো ধরিয়ে দিন..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-gray-500/50 resize-none py-4 px-6 max-h-32 min-h-[60px] custom-scrollbar text-lg font-sans tracking-wide"
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
                w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mb-1.5 mr-1.5 transition-all duration-500
                ${isLoading 
                    ? 'bg-white/5 cursor-wait' 
                    : !input.trim() 
                        ? 'bg-white/5 text-gray-600' 
                        : 'bg-gradient-to-br from-cosmic-purple to-cosmic-accent text-white shadow-[0_0_15px_rgba(189,0,255,0.5)] rotate-0 hover:rotate-90'}
                `}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                         <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
