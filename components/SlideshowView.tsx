
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Message } from '../types';

interface SlideshowViewProps {
  messages: Message[];
}

const SlideshowView: React.FC<SlideshowViewProps> = ({ messages }) => {
  const { messageId } = useParams<{ messageId: string }>();
  const message = messages.find(m => m.id === messageId);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!message || !message.slideshow || message.slideshow.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <h2 className="text-2xl text-red-400 mb-4">স্লাইডশো খুঁজে পাওয়া যায়নি।</h2>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            গল্পে ফিরে যান
        </Link>
      </div>
    );
  }

  const images = message.slideshow;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownload = () => {
    const currentImage = images[currentIndex];
    const link = document.createElement('a');
    link.href = currentImage;
    const storyExcerpt = message.content ? message.content.substring(0, 20).trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').toLowerCase() : 'story';
    link.download = `gollper-asor_${storyExcerpt}_slide_${currentIndex + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in relative bg-slate-900">
        <div className="absolute top-4 right-4 flex gap-3 z-10">
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 backdrop-blur-sm"
                title="বর্তমান স্লাইড ডাউনলোড করুন"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>ডাউনলোড</span>
            </button>
            <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 backdrop-blur-sm"
                title="গল্পে ফিরে যান"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                 </svg>
                <span>ফিরে যান</span>
            </Link>
        </div>

        <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center group">
            <img 
                src={images[currentIndex]} 
                alt={`Slide ${currentIndex + 1}`} 
                className="w-full h-full object-contain rounded-lg shadow-2xl bg-black"
            />
            
            {/* Navigation Buttons */}
            <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-amber-600/80 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                title="পূর্ববর্তী"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            
            <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-amber-600/80 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                title="পরবর্তী"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

             {/* Slide Counter */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-white text-sm font-mono border border-white/20">
                {currentIndex + 1} / {images.length}
             </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="mt-6 flex gap-2 overflow-x-auto max-w-full pb-2 snap-x">
            {images.map((img, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-24 h-14 rounded-md overflow-hidden border-2 transition-all snap-start ${
                        currentIndex === idx ? 'border-amber-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
    </div>
  );
};

export default SlideshowView;
