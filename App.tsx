

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import type { Chat, GenerateContentResponse } from '@google/genai';
import Header from './components/Header';
import MainChatView from './components/MainChatView';
import SettingsView from './components/SettingsView';
import ImageView from './components/ImageView';
import VideoView from './components/VideoView';
import SlideshowView from './components/SlideshowView';
import ApiKeySelector from './components/ApiKeySelector';
import { Message, Role, Source, StoryLength, AudioState } from './types';
import { initChat, generateStoryAudio, generateImageForStory, generateVideoForStory, generateSlideshowForStory, generateRandomStoryPrompt } from './services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from './utils/audioUtils';

const INITIAL_MESSAGE_CONTENT = 'শুভেচ্ছা! আমি আপনার ব্যক্তিগত গল্পকার। ইন্টারনেট থেকে যেকোনো গল্প খুঁজে বের করে আপনাকে শোনাতে পারি। আপনি কোন গল্পটি শুনতে চান?';
const INITIAL_MESSAGE: Message = { id: 'initial-message', role: Role.MODEL, content: INITIAL_MESSAGE_CONTENT };

const STORY_SUGGESTIONS = [
    "আলাদিনের আশ্চর্য প্রদীপের গল্প",
    "হ্যামেলিনের বাঁশিওয়ালার কাহিনী",
    "ঈশপের একটি ছোট গল্প বলুন",
    "হ্যারি পটারের সারসংক্ষেপ",
];

const CONTINUATION_SUGGESTIONS = [
    "হ্যাঁ, পরবর্তী অংশ বলুন",
    "অবশ্যই, আমি আগ্রহী",
    "এরপর কী হলো?",
];

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
    const [storyLength, setStoryLength] = useState<StoryLength>('long');
    const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
    const [volume, setVolume] = useState(1);
    const [showApiKeySelector, setShowApiKeySelector] = useState<boolean>(false);
    
    const chat = useRef<Chat | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const currentSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const currentlyPlayingIdRef = useRef<string | null>(null);
    const videoGenerationRequestRef = useRef<{ messageId: string } | null>(null);

    const playbackStartTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0);
    const animationFrameRef = useRef<number>(0);


    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            const gainNode = context.createGain();
            gainNode.connect(context.destination);
            gainNodeRef.current = gainNode;
            
            const analyser = context.createAnalyser();
            analyser.fftSize = 256; // Smaller FFT size for better time resolution for lip-sync
            analyserNodeRef.current = analyser;
        }
        return audioContextRef.current;
    };
    
    const updateProgress = useCallback(() => {
        if (!audioContextRef.current || !currentlyPlayingIdRef.current || !audioStates[currentlyPlayingIdRef.current]?.isPlaying) {
            return;
        }
        
        const playingId = currentlyPlayingIdRef.current;
        const state = audioStates[playingId];
        const context = audioContextRef.current;
        
        const elapsedTime = context.currentTime - playbackStartTimeRef.current;
        const newCurrentTime = pausedAtRef.current + elapsedTime;

        if (newCurrentTime >= state.duration) {
            // Stop the loop and reset state
            stopCurrentAudio();
        } else {
            setAudioStates(prev => ({
                ...prev,
                [playingId]: {
                    ...prev[playingId],
                    currentTime: newCurrentTime,
                    progress: (newCurrentTime / state.duration) * 100,
                }
            }));
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    }, [audioStates]);
    
    const playAudio = useCallback((messageId: string, buffer: AudioBuffer, offset = 0) => {
        const context = getAudioContext();
        if (context.state === 'suspended') {
            context.resume();
        }
        
        // Stop any currently playing audio
        if (currentSourceNodeRef.current) {
            currentSourceNodeRef.current.onended = null;
            currentSourceNodeRef.current.stop();
        }

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(analyserNodeRef.current!);
        analyserNodeRef.current!.connect(gainNodeRef.current!);
        
        playbackStartTimeRef.current = context.currentTime;
        pausedAtRef.current = offset;
        
        source.start(0, offset);
        
        currentSourceNodeRef.current = source;
        currentlyPlayingIdRef.current = messageId;

        setAudioStates(prev => ({
            ...prev,
            [messageId]: {
                ...prev[messageId],
                isPlaying: true,
                isLoading: false,
                isBuffering: false,
                duration: buffer.duration,
            }
        }));
        
        source.onended = () => {
             if (currentlyPlayingIdRef.current === messageId) {
                stopCurrentAudio(false); // don't stop source again
             }
        };

        animationFrameRef.current = requestAnimationFrame(updateProgress);

    }, [updateProgress]);
    
    const pauseAudio = useCallback(() => {
        if (!audioContextRef.current || !currentlyPlayingIdRef.current || !currentSourceNodeRef.current) return;
        
        cancelAnimationFrame(animationFrameRef.current);
        
        const playingId = currentlyPlayingIdRef.current;
        const context = audioContextRef.current;
        
        pausedAtRef.current += context.currentTime - playbackStartTimeRef.current;
        
        currentSourceNodeRef.current.onended = null;
        currentSourceNodeRef.current.stop();
        currentSourceNodeRef.current = null;
        
        setAudioStates(prev => ({
            ...prev,
            [playingId]: { ...prev[playingId], isPlaying: false }
        }));

    }, []);

    const stopCurrentAudio = useCallback((stopSource = true) => {
        cancelAnimationFrame(animationFrameRef.current);
        if (stopSource && currentSourceNodeRef.current) {
            currentSourceNodeRef.current.onended = null;
            try {
                currentSourceNodeRef.current.stop();
            } catch (e) {
                // Ignore if it's already stopped
            }
        }
        
        if (currentlyPlayingIdRef.current) {
            const finishedId = currentlyPlayingIdRef.current;
            setAudioStates(prev => ({
                ...prev,
                [finishedId]: {
                     ...prev[finishedId], 
                     isPlaying: false, 
                     currentTime: prev[finishedId]?.duration ?? 0,
                     progress: 100
                    }
            }));
        }

        currentlyPlayingIdRef.current = null;
        currentSourceNodeRef.current = null;
        pausedAtRef.current = 0;

    }, []);

    const initializeChatSession = useCallback(() => {
        try {
            stopCurrentAudio();
            chat.current = initChat(storyLength);
            setMessages([INITIAL_MESSAGE]);
            setAudioStates({});
            setError(null);
        } catch (e) {
            console.error("Failed to initialize chat:", e);
            setError("চ্যাট শুরু করতে ব্যর্থ। অনুগ্রহ করে API কী পরীক্ষা করুন।");
        }
    }, [stopCurrentAudio, storyLength]);

    useEffect(() => {
        initializeChatSession();
    }, [initializeChatSession]);

    useEffect(() => {
        return () => {
            stopCurrentAudio();
            audioContextRef.current?.close();
        }
    }, [stopCurrentAudio]);

    const handleLengthChange = (length: StoryLength) => {
        setStoryLength(length);
    };
    
    const handleVoiceChange = (voice: string) => {
        setSelectedVoice(voice);
    };

    const handlePlayPause = async (messageId: string, content: string) => {
        const currentState = audioStates[messageId];
        
        // If it's playing, pause it
        if (currentState?.isPlaying) {
            pauseAudio();
            return;
        }

        // If another audio is playing, stop it first
        if(currentlyPlayingIdRef.current && currentlyPlayingIdRef.current !== messageId) {
            stopCurrentAudio();
        }

        let buffer = currentState?.audioBuffer;

        // If it's paused, resume it
        if (buffer && !currentState.isPlaying) {
            playAudio(messageId, buffer, pausedAtRef.current);
            return;
        }

        // If no buffer (or error), fetch and play
        if (!buffer || currentState?.error) {
            setAudioStates(prev => ({
                ...prev,
                [messageId]: { ...prev[messageId], isLoading: true, isBuffering: false, error: false, audioBuffer: null, duration: 0, currentTime: 0, progress: 0 }
            }));
            try {
                const base64Audio = await generateStoryAudio(content, selectedVoice);
                setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isLoading: false, isBuffering: true } }));
                const audioData = decode(base64Audio);
                const context = getAudioContext();
                buffer = await decodeAudioData(audioData, context, 24000, 1);
                setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], audioBuffer: buffer } }));
                playAudio(messageId, buffer, 0);
            } catch (err) {
                console.error("Failed to process audio:", err);
                setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isLoading: false, isBuffering: false, error: true } }));
                stopCurrentAudio();
            }
        }
    };

    const handleDownloadAudio = async (messageId: string) => {
        const state = audioStates[messageId];
        if (!state?.audioBuffer) {
            console.error("No audio buffer to download for message:", messageId);
            return;
        }

        try {
            const wavBlob = audioBufferToWav(state.audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `story_part_${messageId}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to create and download WAV file:", err);
            setError("অডিও ফাইল ডাউনলোড করতে ব্যর্থ।");
        }
    };
    
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = newVolume;
        }
    };

    const handleSeek = (messageId: string, newTime: number) => {
        const state = audioStates[messageId];
        if (!state?.audioBuffer) return;
        
        const wasPlaying = state.isPlaying;
        if(wasPlaying) {
           pauseAudio();
        }
        
        pausedAtRef.current = newTime;
        
        setAudioStates(prev => ({
            ...prev,
            [messageId]: {
                ...prev[messageId],
                currentTime: newTime,
                progress: (newTime / state.duration) * 100,
            }
        }));

        if (wasPlaying) {
           playAudio(messageId, state.audioBuffer, newTime);
        }
    };

    const handleSendMessage = async (userInput: string) => {
        if (!chat.current) {
            setError("চ্যাট সেশন শুরু হয়নি।");
            return;
        }
        stopCurrentAudio();
        setIsLoading(true);
        setError(null);
        
        const userMessage: Message = { id: crypto.randomUUID(), role: Role.USER, content: userInput };
        setMessages(prev => [...prev, userMessage]);

        try {
            const result = await chat.current.sendMessageStream({ message: userInput });
            
            let currentContent = '';
            const modelMessageId = crypto.randomUUID();
            setMessages(prev => [...prev, { id: modelMessageId, role: Role.MODEL, content: '' }]);
            
            let finalFullResponse: GenerateContentResponse | null = null;
            for await (const chunk of result) {
                currentContent += chunk.text;
                finalFullResponse = chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const targetMessage = newMessages.find(m => m.id === modelMessageId);
                    if (targetMessage) {
                        targetMessage.content = currentContent;
                    }
                    return newMessages;
                });
            }

            // Extract sources from grounding metadata after stream is complete
            const metadata = finalFullResponse?.candidates?.[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
                const sources: Source[] = metadata.groundingChunks
                    .map((chunk: any) => ({
                        uri: chunk.web?.uri || '',
                        title: chunk.web?.title || '',
                    }))
                    .filter((source: Source) => source.uri);

                if (sources.length > 0) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const targetMessage = newMessages.find(m => m.id === modelMessageId);
                        if (targetMessage) {
                            targetMessage.sources = sources;
                        }
                        return newMessages;
                    });
                }
            }

            setIsLoading(false); // Re-enable input now that text is done.

        } catch (e) {
            console.error("Error sending message:", e);
            const errorMessage = "দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
            setError(errorMessage);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: Role.MODEL, content: errorMessage }]);
            setIsLoading(false);
        }
    };

    const handleRequestImage = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content) return;

        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: true } : m));
        setError(null);

        try {
            const imageBase64 = await generateImageForStory(message.content);
            const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
            setMessages(prev => prev.map(m => 
                m.id === messageId 
                ? { ...m, imageUrl, isGeneratingImage: false } 
                : m
            ));
        } catch (imgErr) {
            console.error("Failed to generate image for story:", imgErr);
            setError("ছবি তৈরি করতে ব্যর্থ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
        }
    };
    
    const proceedWithVideoGeneration = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content) return;

        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingVideo: true } : m));
        setError(null);

        try {
            const videoUrl = await generateVideoForStory(message.content);
            setMessages(prev => prev.map(m =>
                m.id === messageId
                ? { ...m, videoUrl, isGeneratingVideo: false }
                : m
            ));
        } catch (vidErr: any) {
            console.error("Failed to generate video for story:", vidErr);
            let errorMessage = "ভিডিও তৈরি করতে ব্যর্থ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
            if (vidErr.message.includes("Requested entity was not found.")) {
                 errorMessage = "আপনার API কী অবৈধ বলে মনে হচ্ছে। অনুগ্রহ করে একটি নতুন কী নির্বাচন করুন।";
            }
            setError(errorMessage);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingVideo: false } : m));
        }
    };

    const handleRequestVideo = async (messageId: string) => {
        videoGenerationRequestRef.current = { messageId };
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                setShowApiKeySelector(true);
                return;
            }
            await proceedWithVideoGeneration(messageId);
        } catch (e) {
            console.error("Error checking for API key:", e);
            setError("API কী পরীক্ষা করতে একটি সমস্যা হয়েছে।");
        }
    };

    const handleRequestSlideshow = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content) return;

        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingSlideshow: true } : m));
        setError(null);

        try {
            const images = await generateSlideshowForStory(message.content);
            setMessages(prev => prev.map(m => 
                m.id === messageId 
                ? { ...m, slideshow: images, isGeneratingSlideshow: false } 
                : m
            ));
        } catch (err) {
            console.error("Failed to generate slideshow:", err);
            setError("স্লাইডশো তৈরি করতে ব্যর্থ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingSlideshow: false } : m));
        }
    };
    
    const handleKeySelectedAndRetry = async () => {
        setShowApiKeySelector(false);
        if (videoGenerationRequestRef.current) {
            await proceedWithVideoGeneration(videoGenerationRequestRef.current.messageId);
            videoGenerationRequestRef.current = null;
        }
    };

    const handleRandomStory = async () => {
        setIsGeneratingPrompt(true);
        setError(null);
        try {
            const prompt = await generateRandomStoryPrompt();
            if (prompt) {
                await handleSendMessage(prompt);
            } else {
                throw new Error("Generated prompt was empty.");
            }
        } catch (e) {
            console.error("Failed to generate random story:", e);
            setError("দৈবচয়িত গল্প তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।");
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const getSuggestions = () => {
        if (isLoading || isGeneratingPrompt) return [];
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return [];

        if (lastMessage.id === 'initial-message') {
            return STORY_SUGGESTIONS;
        }
        
        if (lastMessage.role === Role.MODEL && messages.length > 1 && !lastMessage.imageUrl && !lastMessage.isGeneratingImage && !lastMessage.videoUrl && !lastMessage.isGeneratingVideo && !lastMessage.slideshow && !lastMessage.isGeneratingSlideshow) {
            return CONTINUATION_SUGGESTIONS;
        }
        
        return [];
    };
    
    const combinedIsLoading = isLoading || isGeneratingPrompt || messages.some(m => m.isGeneratingImage || m.isGeneratingVideo || m.isGeneratingSlideshow);
    
    return (
        <HashRouter>
            <div className="h-screen w-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex flex-col">
                <Header />
                <Routes>
                    <Route
                        path="/"
                        element={
                            <MainChatView
                                messages={messages}
                                isLoading={isLoading}
                                isGeneratingPrompt={isGeneratingPrompt}
                                getSuggestions={getSuggestions}
                                handleSendMessage={handleSendMessage}
                                audioStates={audioStates}
                                handlePlayPause={handlePlayPause}
                                handleDownloadAudio={handleDownloadAudio}
                                handleRequestImage={handleRequestImage}
                                handleRequestVideo={handleRequestVideo}
                                handleRequestSlideshow={handleRequestSlideshow}
                                volume={volume}
                                handleVolumeChange={handleVolumeChange}
                                handleSeek={handleSeek}
                                analyser={analyserNodeRef.current}
                                error={error}
                                initializeChatSession={initializeChatSession}
                                handleRandomStory={handleRandomStory}
                            />
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <SettingsView
                                storyLength={storyLength}
                                onLengthChange={handleLengthChange}
                                selectedVoice={selectedVoice}
                                onVoiceChange={handleVoiceChange}
                                isDisabled={combinedIsLoading}
                            />
                        }
                    />
                    <Route
                        path="/image/:messageId"
                        element={<ImageView messages={messages} />}
                    />
                    <Route
                        path="/video/:messageId"
                        element={<VideoView messages={messages} />}
                    />
                    <Route
                        path="/slideshow/:messageId"
                        element={<SlideshowView messages={messages} />}
                    />
                </Routes>
                {showApiKeySelector && (
                    <ApiKeySelector
                        onClose={() => setShowApiKeySelector(false)}
                        onKeySelected={handleKeySelectedAndRetry}
                    />
                )}
            </div>
        </HashRouter>
    );
};

export default App;