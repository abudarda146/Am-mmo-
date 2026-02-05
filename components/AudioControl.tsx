
import React, { useEffect, useRef } from 'react';

interface AudioControlProps {
  isLoading: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  hasError?: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPauseClick: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onSkip: (amount: number) => void;
  analyser?: AnalyserNode | null;
  onDownloadClick?: () => void;
  onRegenerateClick?: () => void;
}

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const AudioControl: React.FC<AudioControlProps> = ({
  isLoading,
  isBuffering,
  isPlaying,
  hasError = false,
  currentTime,
  duration,
  onPlayPauseClick,
  onSeek,
  onSkip,
  onRegenerateClick,
  analyser
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    // Visualizer Logic
    useEffect(() => {
        if (!canvasRef.current || !analyser || !isPlaying) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = 3;
            const gap = 2;
            const barCount = Math.floor(canvas.width / (barWidth + gap));
            const step = Math.floor(bufferLength / barCount);

            ctx.fillStyle = '#fbbf24'; // Amber color
            
            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step];
                const percent = value / 255;
                const height = percent * canvas.height;
                // Center the bars vertically
                const y = (canvas.height - height) / 2;
                
                // Draw rounded bars
                ctx.beginPath();
                ctx.roundRect(i * (barWidth + gap), y, barWidth, height, 5);
                ctx.fill();
            }
        };
        draw();
        return () => cancelAnimationFrame(animationRef.current);
    }, [analyser, isPlaying]);


    if (hasError) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                ⚠️ অডিও লোড করা যায়নি
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
            
            {/* Play/Pause Button */}
            <button 
                onClick={onPlayPauseClick}
                disabled={isLoading || isBuffering}
                className="w-12 h-12 flex-shrink-0 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
                {isLoading || isBuffering ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                )}
            </button>

            {/* Right Side Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                
                {/* Visualizer or Static Waveform */}
                <div className="h-8 w-full flex items-center">
                    {isPlaying ? (
                        <canvas ref={canvasRef} width={200} height={32} className="w-full h-full opacity-80" />
                    ) : (
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-gray-500/50" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                        </div>
                    )}
                </div>

                {/* Time and Scrubber */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="mx-2 flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

             {/* Actions */}
             <div className="flex items-center gap-2">
                 <button onClick={() => onSkip(-10)} className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>
                 </button>
                 <button onClick={() => onSkip(10)} className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/></svg>
                 </button>
                 {onRegenerateClick && (
                    <button onClick={onRegenerateClick} className="text-amber-400 hover:text-amber-300 p-1.5 rounded-full hover:bg-amber-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                 )}
             </div>
        </div>
    );
};

export default AudioControl;
