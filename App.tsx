
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Chat, GenerateContentResponse } from '@google/genai';
import { User } from 'firebase/auth';

import Header from './components/Header';
import MainChatView from './components/MainChatView';
import SettingsView from './components/SettingsView';
import ImageView from './components/ImageView';
import VideoView from './components/VideoView';
import SlideshowView from './components/SlideshowView';
import ApiKeySelector from './components/ApiKeySelector';
import AuthView from './components/AuthView';
import Sidebar from './components/Sidebar';
import VoiceSelectionModal from './components/VoiceSelectionModal';

import { Message, Role, Source, StoryLength, AudioState, ChatSession } from './types';
import { initChat, generateStoryAudio, generateImageForStory, generateVideoForStory, generateSlideshowForStory, generateRandomStoryPrompt } from './services/geminiService';
import { 
    onAuthChange, 
    getChatSessions, 
    getChatMessages, 
    saveChatSession, 
    saveMessage, 
    deleteChatSession,
    updateChatSessionTime 
} from './services/firebaseService';
import { decode, decodeAudioData, audioBufferToWav } from './utils/audioUtils';

const INITIAL_MESSAGE_CONTENT = 'শুভেচ্ছা! আমি আপনার ব্যক্তিগত গল্পকার। ইন্টারনেট থেকে যেকোনো গল্প খুঁজে বের করে আপনাকে শোনাতে পারি। আপনি কোন গল্পটি শুনতে চান?';
const INITIAL_MESSAGE: Message = { id: 'initial-message', role: Role.MODEL, content: INITIAL_MESSAGE_CONTENT, timestamp: Date.now() };

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

// Helper to generate IDs safely
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    
    // Sessions and State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
    const [storyLength, setStoryLength] = useState<StoryLength>('long');
    const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
    const [volume, setVolume] = useState(1);
    const [showApiKeySelector, setShowApiKeySelector] = useState<boolean>(false);
    
    // Voice Modal State
    const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
    const [pendingAudioMessage, setPendingAudioMessage] = useState<{id: string, content: string} | null>(null);
    
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

    // Auth Change Listener
    useEffect(() => {
        const unsubscribe = onAuthChange(async (currentUser) => {
            setUser(currentUser);
            setIsAuthChecking(false);
            if (currentUser) {
                try {
                    const userSessions = await getChatSessions(currentUser.uid);
                    setSessions(userSessions);
                } catch (e) {
                    console.error("Failed to load sessions", e);
                }
            } else {
                setSessions([]);
                setCurrentSessionId(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Load messages when session changes
    useEffect(() => {
        const loadSessionMessages = async () => {
            if (currentSessionId && user) {
                setIsLoading(true);
                stopCurrentAudio();
                try {
                    const sessionMessages = await getChatMessages(currentSessionId);
                    if (sessionMessages.length > 0) {
                        setMessages(sessionMessages);
                        chat.current = initChat(storyLength, sessionMessages);
                    } else {
                        // If no messages found (should not happen for valid session), reset
                        setMessages([INITIAL_MESSAGE]);
                        chat.current = initChat(storyLength, []);
                    }
                } catch (e) {
                    setError("চ্যাট হিস্ট্রি লোড করতে সমস্যা হয়েছে।");
                    setMessages([INITIAL_MESSAGE]);
                } finally {
                    setIsLoading(false);
                }
            } else if (!currentSessionId) {
                 setMessages([INITIAL_MESSAGE]);
                 chat.current = null;
            }
        };
        loadSessionMessages();
    }, [currentSessionId, user, storyLength]);

    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            const gainNode = context.createGain();
            gainNode.connect(context.destination);
            gainNodeRef.current = gainNode;
            
            const analyser = context.createAnalyser();
            // Increased FFT size for better visualization resolution
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.85; // Smoother transitions
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
                stopCurrentAudio(false);
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
            } catch (e) {}
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

    const startNewChat = useCallback(() => {
        if (!user) return;
        stopCurrentAudio();
        setCurrentSessionId(null);
        setMessages([INITIAL_MESSAGE]);
        setAudioStates({});
        setError(null);
        chat.current = initChat(storyLength, []);
        // Close sidebar on mobile when starting new chat
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, [stopCurrentAudio, storyLength, user]);

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

    const generateAndPlayAudio = async (messageId: string, content: string, voiceName: string) => {
         // Reset state for new generation
         setAudioStates(prev => ({
            ...prev,
            [messageId]: { ...prev[messageId], isLoading: true, isBuffering: false, error: false, audioBuffer: null, duration: 0, currentTime: 0, progress: 0 }
        }));

        try {
            const base64Audio = await generateStoryAudio(content, voiceName);
            setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isLoading: false, isBuffering: true } }));
            const audioData = decode(base64Audio);
            const context = getAudioContext();
            const buffer = await decodeAudioData(audioData, context, 24000, 1);
            setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], audioBuffer: buffer } }));
            playAudio(messageId, buffer, 0);
        } catch (err) {
            console.error("Failed to process audio:", err);
            setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isLoading: false, isBuffering: false, error: true } }));
            stopCurrentAudio();
        }
    };

    const handlePlayPause = async (messageId: string, content: string) => {
        const currentState = audioStates[messageId];

        // If playing, pause
        if (currentState?.isPlaying) {
            pauseAudio();
            return;
        }

        // If another audio is playing, stop it
        if(currentlyPlayingIdRef.current && currentlyPlayingIdRef.current !== messageId) {
            stopCurrentAudio();
        }

        // If we have buffer and it's paused, resume
        let buffer = currentState?.audioBuffer;
        if (buffer && !currentState.isPlaying) {
            playAudio(messageId, buffer, pausedAtRef.current);
            return;
        }

        // If no buffer, or explicit request to generate, we need to ask for voice FIRST
        // This is where we open the modal. Stop current audio first to avoid overlap.
        stopCurrentAudio();
        setPendingAudioMessage({ id: messageId, content });
        setShowVoiceModal(true);
    };

    const handleVoiceConfirm = (voiceName: string) => {
        setShowVoiceModal(false);
        if (pendingAudioMessage) {
            generateAndPlayAudio(pendingAudioMessage.id, pendingAudioMessage.content, voiceName);
            // Optionally update selectedVoice for global settings sync (optional)
            setSelectedVoice(voiceName);
        }
        setPendingAudioMessage(null);
    };
    
    const handleRegenerateVoice = (messageId: string, content: string) => {
        stopCurrentAudio();
        setPendingAudioMessage({ id: messageId, content });
        setShowVoiceModal(true);
    };

    const handleDownloadAudio = async (messageId: string) => {
        const state = audioStates[messageId];
        if (!state?.audioBuffer) return;
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
        if(wasPlaying) pauseAudio();
        pausedAtRef.current = newTime;
        setAudioStates(prev => ({
            ...prev,
            [messageId]: {
                ...prev[messageId],
                currentTime: newTime,
                progress: (newTime / state.duration) * 100,
            }
        }));
        if (wasPlaying) playAudio(messageId, state.audioBuffer, newTime);
    };

    const handleSendMessage = async (userInput: string) => {
        if (!user) return;
        
        stopCurrentAudio();
        setIsLoading(true);
        setError(null);
        
        let activeSessionId = currentSessionId;
        let isNewSession = false;

        // If it's a new session, create one
        if (!activeSessionId) {
            isNewSession = true;
            activeSessionId = generateId();
            setCurrentSessionId(activeSessionId);
            const title = userInput.substring(0, 30) + (userInput.length > 30 ? '...' : '');
            
            // Save new session
            await saveChatSession(user.uid, activeSessionId, title);
            
            // Refresh sessions list
            const updatedSessions = await getChatSessions(user.uid);
            setSessions(updatedSessions);
            
            // Initialize chat
            chat.current = initChat(storyLength, []);
        } else {
            // Update existing session time
            await updateChatSessionTime(activeSessionId);
            
             // Ensure chat is initialized if user refreshed or navigated back
            if (!chat.current) {
                 chat.current = initChat(storyLength, messages);
            }
        }
        
        const userMessage: Message = { id: generateId(), role: Role.USER, content: userInput, timestamp: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        
        // Save user message
        await saveMessage(activeSessionId, userMessage);

        try {
            if (!chat.current) chat.current = initChat(storyLength, messages);
            
            const result = await chat.current.sendMessageStream({ message: userInput });
            let currentContent = '';
            const modelMessageId = generateId();
            setMessages(prev => [...prev, { id: modelMessageId, role: Role.MODEL, content: '', timestamp: Date.now() }]);
            
            let finalFullResponse: GenerateContentResponse | null = null;
            for await (const chunk of result) {
                currentContent += chunk.text;
                finalFullResponse = chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const targetMessage = newMessages.find(m => m.id === modelMessageId);
                    if (targetMessage) targetMessage.content = currentContent;
                    return newMessages;
                });
            }

            const modelMessage: Message = { 
                id: modelMessageId, 
                role: Role.MODEL, 
                content: currentContent, 
                timestamp: Date.now() 
            };

            const metadata = finalFullResponse?.candidates?.[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
                const sources: Source[] = metadata.groundingChunks
                    .map((chunk: any) => ({
                        uri: chunk.web?.uri || '',
                        title: chunk.web?.title || '',
                    }))
                    .filter((source: Source) => source.uri);

                if (sources.length > 0) {
                    modelMessage.sources = sources;
                    setMessages(prev => prev.map(m => m.id === modelMessageId ? modelMessage : m));
                }
            }
            
            // Save model response to Firestore
            await saveMessage(activeSessionId, modelMessage);
            setIsLoading(false);
            
            // Re-fetch sessions to update order if needed (since timestamp changed)
             const updatedSessions = await getChatSessions(user.uid);
             setSessions(updatedSessions);

        } catch (e) {
            console.error(e);
            const errorMessage = "দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm("আপনি কি এই চ্যাট হিস্ট্রি মুছে ফেলতে চান?")) return;
        try {
            await deleteChatSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                startNewChat();
            }
        } catch (e) {
            setError("চ্যাট মুছতে ব্যর্থ হয়েছে।");
        }
    };

    const handleRequestImage = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content || !currentSessionId) return;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: true } : m));
        try {
            const imageBase64 = await generateImageForStory(message.content);
            const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, imageUrl, isGeneratingImage: false } : m));
            // Update message in Firestore
            await saveMessage(currentSessionId, { ...message, imageUrl });
        } catch (imgErr) {
            setError("ছবি তৈরি করতে ব্যর্থ।");
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
        }
    };
    
    const proceedWithVideoGeneration = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content || !currentSessionId) return;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingVideo: true } : m));
        try {
            const videoUrl = await generateVideoForStory(message.content);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, videoUrl, isGeneratingVideo: false } : m));
            await saveMessage(currentSessionId, { ...message, videoUrl });
        } catch (vidErr: any) {
            setError("ভিডিও তৈরি করতে ব্যর্থ।");
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
            setError("API কী পরীক্ষা করতে একটি সমস্যা হয়েছে।");
        }
    };

    const handleRequestSlideshow = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content || !currentSessionId) return;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingSlideshow: true } : m));
        try {
            const images = await generateSlideshowForStory(message.content);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, slideshow: images, isGeneratingSlideshow: false } : m));
            await saveMessage(currentSessionId, { ...message, slideshow: images });
        } catch (err) {
            setError("স্লাইডশো তৈরি করতে ব্যর্থ।");
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
            if (prompt) await handleSendMessage(prompt);
        } catch (e) {
            setError("দৈবচয়িত গল্প তৈরি করতে ব্যর্থ।");
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const getSuggestions = () => {
        if (isLoading || isGeneratingPrompt) return [];
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return [];
        if (lastMessage.id === 'initial-message') return STORY_SUGGESTIONS;
        if (lastMessage.role === Role.MODEL && messages.length > 1 && !lastMessage.imageUrl && !lastMessage.videoUrl && !lastMessage.slideshow) {
            return CONTINUATION_SUGGESTIONS;
        }
        return [];
    };
    
    const combinedIsLoading = isLoading || isGeneratingPrompt || messages.some(m => m.isGeneratingImage || m.isGeneratingVideo || m.isGeneratingSlideshow);
    
    if (isAuthChecking) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <HashRouter>
            <div className="h-screen w-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] flex flex-col overflow-hidden">
                <Header 
                    user={user} 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                />
                
                <div className="flex-1 flex overflow-hidden">
                    {user && (
                        <Sidebar 
                            sessions={sessions}
                            currentSessionId={currentSessionId}
                            onSelectSession={setCurrentSessionId}
                            onNewChat={startNewChat}
                            onDeleteSession={handleDeleteSession}
                            isOpen={isSidebarOpen}
                            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    )}

                    <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 relative">
                        {!user ? (
                        <AuthView />
                        ) : (
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
                                            initializeChatSession={startNewChat}
                                            handleRandomStory={handleRandomStory}
                                            handleRegenerateVoice={handleRegenerateVoice}
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
                                <Route path="/image/:messageId" element={<ImageView messages={messages} />} />
                                <Route path="/video/:messageId" element={<VideoView messages={messages} />} />
                                <Route path="/slideshow/:messageId" element={<SlideshowView messages={messages} />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        )}
                    </div>
                </div>

                {/* Voice Selection Modal */}
                <VoiceSelectionModal 
                    isOpen={showVoiceModal}
                    onClose={() => {
                        setShowVoiceModal(false);
                        setPendingAudioMessage(null);
                    }}
                    onConfirm={handleVoiceConfirm}
                />

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
