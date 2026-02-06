
import React, { useEffect, useRef, useState } from 'react';

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
  volume,
  onPlayPauseClick,
  onSeek,
  onVolumeChange,
  onRegenerateClick,
  onDownloadClick,
  analyser
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);

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

            // Dynamic Cosmic Gradient (Purple -> Cyan -> Gold)
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#bd00ff'); // Purple
            gradient.addColorStop(0.5, '#00f3ff'); // Cyan
            gradient.addColorStop(1, '#ffd700'); // Gold
            ctx.fillStyle = gradient;
            
            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step];
                const percent = value / 255;
                // Add min height for visibility
                const height = Math.max(percent * canvas.height * 0.8, 2); 
                
                // Center the bars vertically
                const y = (canvas.height - height) / 2;
                
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(i * (barWidth + gap), y, barWidth, height, 4);
                } else {
                    ctx.rect(i * (barWidth + gap), y, barWidth, height);
                }
                ctx.fill();
            }
        };
        draw();
        return () => cancelAnimationFrame(animationRef.current);
    }, [analyser, isPlaying]);

    // Handle click on the visualizer/progress bar to seek
    const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || duration <= 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        // Calculate percentage and new time
        const percent = Math.max(0, Math.min(1, x / width));
        const newTime = percent * duration;
        onSeek(newTime);
    };

    if (hasError) {
        return (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2 font-mono animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>অডিও লোড করতে সমস্যা হয়েছে</span>
                {onRegenerateClick && (
                    <button onClick={onRegenerateClick} className="ml-auto text-xs underline hover:text-white">আবার চেষ্টা করুন</button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-[#0f111a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4 w-full group hover:border-cosmic-purple/30 transition-colors duration-500">
            
            <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button 
                    onClick={onPlayPauseClick}
                    disabled={isLoading || isBuffering}
                    className={`
                        w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-lg
                        ${isPlaying 
                            ? 'bg-gradient-to-br from-cosmic-gold to-orange-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] scale-105' 
                            : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'}
                    `}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isLoading || isBuffering ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* Scrubber & Visualizer Area */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div 
                        ref={containerRef}
                        onClick={handleSeekClick}
                        className="h-10 w-full flex items-center bg-black/40 rounded-lg px-2 border border-white/5 cursor-pointer relative group/scrubber overflow-hidden"
                        title="টেনে শুনতে ক্লিক করুন"
                    >
                        {/* Audio Wave Visualizer */}
                        <canvas 
                            ref={canvasRef} 
                            width={400} 
                            height={40} 
                            className={`absolute inset-0 w-full h-full opacity-60 transition-opacity duration-300 ${isPlaying ? 'opacity-90' : 'opacity-40'}`} 
                        />
                        
                        {/* Progress Bar Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 group-hover/scrubber:h-1.5 transition-all">
                             <div 
                                className="h-full bg-gradient-to-r from-cosmic-purple to-cosmic-gold shadow-[0_0_10px_rgba(189,0,255,0.5)] transition-all duration-100 ease-linear"
                                style={{ width: `${(currentTime/duration)*100}%` }}
                             />
                        </div>
                        
                        {/* Hover Indicator */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono tracking-wider px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Controls: Volume & Actions */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                
                {/* Volume Control */}
                <div 
                    className="relative flex items-center group/vol"
                    onMouseEnter={() => setIsVolumeHovered(true)}
                    onMouseLeave={() => setIsVolumeHovered(false)}
                >
                    <button 
                        className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5 flex items-center gap-2"
                        aria-label="Volume"
                    >
                        {volume === 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        ) : volume < 0.5 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                    
                    {/* Vertical Slider Popover */}
                    <div className={`
                        absolute bottom-full left-0 mb-2 p-3 bg-[#1a1a2e] rounded-xl border border-white/10 shadow-2xl transition-all duration-300 origin-bottom-left z-20
                        ${isVolumeHovered ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible translate-y-2'}
                    `}>
                        <div className="h-32 w-8 flex items-center justify-center relative">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                className="w-28 -rotate-90 absolute cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cosmic-gold [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,215,0,0.5)] [&::-webkit-slider-track]:bg-white/10 [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:h-1.5 hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                            />
                        </div>
                        <div className="text-center text-[10px] text-gray-400 mt-1 font-mono">{Math.round(volume * 100)}%</div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {onRegenerateClick && (
                        <button 
                            onClick={onRegenerateClick} 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-cosmic-purple/20 text-gray-400 hover:text-cosmic-purple border border-transparent hover:border-cosmic-purple/30 transition-all" 
                            title="ভয়েস পরিবর্তন করুন"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                                <path d="M16 21h5v-5"/>
                            </svg>
                            <span className="hidden sm:inline">CHANGE VOICE</span>
                        </button>
                    )}
                    
                    {onDownloadClick && (
                        <button 
                            onClick={onDownloadClick} 
                            className="p-2 text-gray-400 hover:text-cosmic-gold hover:bg-white/5 rounded-full transition-colors" 
                            title="অডিও ডাউনলোড করুন"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioControl;
