
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Message } from '../types';

interface ImageViewProps {
  messages: Message[];
}

const ImageView: React.FC<ImageViewProps> = ({ messages }) => {
  const { messageId } = useParams<{ messageId: string }>();
  const message = messages.find(m => m.id === messageId);

  if (!message || !message.imageUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl text-red-400 mb-4">ছবি খুঁজে পাওয়া যায়নি।</h2>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            গল্পে ফিরে যান
        </Link>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!message?.imageUrl) return;
    
    const filename = `gollper-asor_${message.id.substring(0, 6)}.jpeg`;

    try {
        // Try to fetch as blob first to force download behavior
        const response = await fetch(message.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (e) {
        // Fallback for CORS issues: Open in new tab/simple download
        console.warn("Fetch failed (likely CORS), falling back to simple link");
        const link = document.createElement('a');
        link.href = message.imageUrl;
        link.target = "_blank"; // Open in new tab if download is blocked
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in relative">
        <div className="absolute top-4 right-4 flex gap-3 z-10">
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 backdrop-blur-sm"
                title="ছবি ডাউনলোড করুন"
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
        <div className="w-full h-full max-w-7xl max-h-[80vh] flex items-center justify-center">
            <img 
                src={message.imageUrl} 
                alt="Story illustration from web" 
                className="w-full h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450/334155/fbbf24?text=ছবি+লোড+করা+যাচ্ছে+না';
                }}
            />
        </div>
        {message.content && (
            <p className="text-slate-400 mt-4 text-center text-sm max-w-4xl bg-black/20 p-2 rounded-md">
                {message.content.substring(0, 250)}...
            </p>
        )}
    </div>
  );
};

export default ImageView;
