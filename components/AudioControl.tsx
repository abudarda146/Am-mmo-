
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
  onDownloadClick,
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

            const barWidth = 2;
            const gap = 3;
            const barCount = Math.floor(canvas.width / (barWidth + gap));
            const step = Math.floor(bufferLength / barCount);

            // Gold to transparent gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#ffd700');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
            ctx.fillStyle = gradient;
            
            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step];
                const percent = value / 255;
                const height = percent * canvas.height;
                // Center the bars vertically
                const y = (canvas.height - height) / 2;
                
                ctx.beginPath();
                ctx.roundRect(i * (barWidth + gap), y, barWidth, height, 2);
                ctx.fill();
            }
        };
        draw();
        return () => cancelAnimationFrame(animationRef.current);
    }, [analyser, isPlaying]);


    if (hasError) {
        return (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2 font-mono">
                [AUDIO_ERROR_DETECTED]
            </div>
        );
    }

    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-cosmic-gold/30 transition-colors duration-500">
            
            {/* Play/Pause Button */}
            <button 
                onClick={onPlayPauseClick}
                disabled={isLoading || isBuffering}
                className={`
                    w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-lg
                    ${isPlaying ? 'bg-cosmic-gold text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}
                `}
            >
                {isLoading || isBuffering ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                )}
            </button>

            {/* Right Side Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                
                {/* Visualizer or Static Waveform */}
                <div className="h-10 w-full flex items-center bg-black/40 rounded-lg px-2 border border-white/5">
                    {isPlaying ? (
                        <canvas ref={canvasRef} width={200} height={32} className="w-full h-full opacity-90 mix-blend-screen" />
                    ) : (
                        <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden relative">
                             <div className="absolute top-0 left-0 h-full bg-cosmic-gold shadow-[0_0_10px_#ffd700]" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                        </div>
                    )}
                </div>

                {/* Time and Scrubber */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono tracking-wider">
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="mx-3 flex-1 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cosmic-gold"
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

             {/* Actions */}
             <div className="flex items-center gap-1">
                 {onRegenerateClick && (
                    <button onClick={onRegenerateClick} className="text-cosmic-purple hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors" title="ভয়েস পরিবর্তন">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                 )}
                 {onDownloadClick && (
                    <button onClick={onDownloadClick} className="text-gray-400 hover:text-cosmic-gold p-2 rounded-full hover:bg-white/5 transition-colors" title="ডাউনলোড">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                 )}
             </div>
        </div>
    );
};

export default AudioControl;
