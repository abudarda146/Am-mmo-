
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
  onSkip,
  onDownloadClick,
  analyser
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const capsYPositionRef = useRef<number[]>([]); // To store the vertical position of caps

    useEffect(() => {
        if (!canvasRef.current || !analyser || !isPlaying) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Settings for the RGB Visualizer
        const barCount = 64; // How many bars to show
        const barWidth = (rect.width / barCount) - 2; // Subtract spacing
        const capHeight = 2;
        const capFallSpeed = 1.5;

        // Initialize caps if array length changed
        if (capsYPositionRef.current.length !== barCount) {
            capsYPositionRef.current = new Array(barCount).fill(rect.height);
        }

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, rect.width, rect.height);
            
            // Create RGB Rainbow Gradient
            const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
            gradient.addColorStop(0, '#ff0000');    // Red
            gradient.addColorStop(0.15, '#ff7f00'); // Orange
            gradient.addColorStop(0.30, '#ffff00'); // Yellow
            gradient.addColorStop(0.45, '#00ff00'); // Green
            gradient.addColorStop(0.60, '#00ffff'); // Cyan
            gradient.addColorStop(0.75, '#0000ff'); // Blue
            gradient.addColorStop(0.90, '#8b00ff'); // Violet
            gradient.addColorStop(1, '#ff00ff');    // Magenta

            ctx.fillStyle = gradient;
            
            // Add Neon Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';

            // Draw Bars and Caps
            // We use a step to sample the frequency data evenly
            const step = Math.floor(bufferLength / barCount);

            for (let i = 0; i < barCount; i++) {
                // Get frequency value (0-255)
                const value = dataArray[i * step];
                
                // Calculate bar height relative to canvas height
                // Multiplier 0.8 keeps it from hitting the very top constantly
                const height = (value / 255) * rect.height * 0.9;
                
                const x = i * (barWidth + 2); // 2 is the gap
                const y = rect.height - height;

                // --- Draw the Bar (RGB Gradient) ---
                // We use rounded top corners for a modern look
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, height, [4, 4, 0, 0]);
                ctx.fill();

                // --- Draw the Falling Cap (White) ---
                // Logic: If current audio is louder, push cap up. If quieter, let cap fall slowly.
                if (y < capsYPositionRef.current[i]) {
                    capsYPositionRef.current[i] = y;
                } else {
                    capsYPositionRef.current[i] = Math.min(rect.height, capsYPositionRef.current[i] + capFallSpeed);
                }

                // Only draw cap if it's above the bottom
                if (capsYPositionRef.current[i] < rect.height) {
                    ctx.fillStyle = '#ffffff'; // White cap
                    ctx.shadowColor = '#ffffff'; // White glow for cap
                    ctx.fillRect(x, capsYPositionRef.current[i] - capHeight - 2, barWidth, capHeight);
                    
                    // Reset fill style for next bar loop (back to gradient)
                    ctx.fillStyle = gradient;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                }
            }
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser, isPlaying]);

    if (hasError) {
        return (
            <div className="flex items-center gap-2 text-red-400 animate-fade-in p-3 bg-slate-800/50 rounded-lg border border-red-500/30">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
                 <span className="text-sm font-medium">অডিও লোড করা যায়নি</span>
                 <button 
                    onClick={onPlayPauseClick}
                    className="ml-auto px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                 >
                    পুনরায় চেষ্টা করুন
                 </button>
            </div>
        )
    }

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSeek(parseFloat(e.target.value));
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex flex-col w-full gap-3 bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 shadow-lg animate-fade-in mt-2 overflow-hidden relative group">
            
            {/* Visualizer Background (Absolute) */}
            {isPlaying && analyser && (
                <div className="absolute inset-0 opacity-100 pointer-events-none z-0 bg-black/20">
                     <canvas 
                        ref={canvasRef} 
                        className="w-full h-full opacity-80"
                    />
                </div>
            )}

            <div className="relative z-10 flex flex-col gap-3">
                {/* Top Row: Main Controls & Volume/Download */}
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-4">
                         {/* Play/Pause Button */}
                        <button
                            onClick={onPlayPauseClick}
                            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-full transition-all shadow-lg shadow-indigo-500/30 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait disabled:transform-none"
                            disabled={isLoading || isBuffering}
                            title={isPlaying ? 'বিরতি' : 'শুনুন'}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : isBuffering ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>

                        {/* Skip Controls */}
                        <div className="flex items-center bg-slate-900/60 rounded-full p-1 border border-slate-700/50 backdrop-blur-md">
                             <button onClick={() => onSkip(-10)} title="১০ সেকেন্ড পেছনে" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/>
                                </svg>
                             </button>
                             <div className="w-px h-4 bg-slate-700 mx-1"></div>
                             <button onClick={() => onSkip(10)} title="১০ সেকেন্ড সামনে" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/>
                                 </svg>
                             </button>
                        </div>
                    </div>
                    
                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {/* Volume */}
                         <div className="flex items-center gap-2 group bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-md hidden sm:flex">
                            <button 
                                onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
                                className="text-slate-400 hover:text-purple-400 transition-colors"
                            >
                                {volume === 0 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-400"
                                aria-label="Volume"
                            />
                        </div>

                        {onDownloadClick && (
                            <button 
                                onClick={onDownloadClick} 
                                title="অডিও ডাউনলোড করুন" 
                                disabled={!duration || duration === 0}
                                className="p-2.5 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-purple-300 rounded-full transition-all border border-slate-600 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                            >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                 </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Progress Bar */}
                <div className="flex items-center gap-3 mt-1 px-1">
                     <span className="text-xs text-slate-400 font-mono font-medium w-10 text-right">{formatTime(currentTime)}</span>
                     <div className="relative flex-1 h-5 flex items-center group/slider">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeekChange}
                            className="audio-progress-slider w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer z-10 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            style={{
                                background: `linear-gradient(to right, #a855f7 ${progressPercent}%, #334155 ${progressPercent}%)`
                            }}
                            aria-label="Seek"
                        />
                     </div>
                     <span className="text-xs text-slate-400 font-mono font-medium w-10">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};

export default AudioControl;
