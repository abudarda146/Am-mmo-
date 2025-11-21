import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Message } from '../types';

interface VideoViewProps {
  messages: Message[];
}

const VideoView: React.FC<VideoViewProps> = ({ messages }) => {
  const { messageId } = useParams<{ messageId: string }>();
  const message = messages.find(m => m.id === messageId);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;
    
    const fetchVideo = async () => {
      if (!message?.videoUrl) {
        setError('ভিডিওর লিঙ্ক খুঁজে পাওয়া যায়নি।');
        setIsLoading(false);
        return;
      }
      try {
        // The API key is injected into process.env.API_KEY by the environment
        const response = await fetch(`${message.videoUrl}&key=${process.env.API_KEY}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setVideoSrc(objectUrl);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
            setError('ভিডিও লোড করতে ব্যর্থ হয়েছে।');
        }
      } finally {
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    fetchVideo();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message?.id, message?.videoUrl]);

  if (!message) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl text-red-400 mb-4">বার্তা খুঁজে পাওয়া যায়নি।</h2>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            গল্পে ফিরে যান
        </Link>
      </div>
    );
  }

  const handleDownload = () => {
    if (!videoSrc) return;
    const link = document.createElement('a');
    link.href = videoSrc;
    const storyExcerpt = message.content ? message.content.substring(0, 30).trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').toLowerCase() : 'story';
    link.download = `gollper-asor_${storyExcerpt}_${message.id.substring(0, 6)}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in relative">
        <div className="absolute top-4 right-4 flex gap-3 z-10">
            {videoSrc && (
                 <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 backdrop-blur-sm" title="ভিডিও ডাউনলোড করুন">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>ডাউনলোড</span>
                 </button>
            )}
            <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 text-amber-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 backdrop-blur-sm" title="গল্পে ফিরে যান">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                <span>ফিরে যান</span>
            </Link>
        </div>
        <div className="w-full h-full max-w-7xl max-h-[80vh] flex items-center justify-center">
            {isLoading && (
              <div className="text-white text-lg flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>ভিডিও লোড হচ্ছে...</span>
              </div>
            )}
            {error && <div className="text-red-400 text-lg">{error}</div>}
            {!isLoading && !error && videoSrc && (
              <video src={videoSrc} controls autoPlay className="w-full h-full object-contain rounded-lg shadow-2xl" />
            )}
        </div>
        {message.content && (
            <p className="text-slate-400 mt-4 text-center text-sm max-w-4xl bg-black/20 p-2 rounded-md">
                {message.content.substring(0, 250)}...
            </p>
        )}
    </div>
  );
};

export default VideoView;
