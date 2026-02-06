
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Chat, GenerateContentResponse } from '@google/genai';
import { User } from 'firebase/auth';

import Header from './components/Header';
import MainChatView from './components/MainChatView';
import SettingsView from './components/SettingsView';
import ImageView from './components/ImageView';
import AuthView from './components/AuthView';
import Sidebar from './components/Sidebar';
import VoiceSelectionModal from './components/VoiceSelectionModal';

import { Message, Role, Source, StoryLength, StoryTheme, AudioState, ChatSession } from './types';
import { initChat, generateStoryAudio, generateImageForStory, generateRandomStoryPrompt } from './services/geminiService';
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

const INITIAL_MESSAGE_CONTENT = 'মহাবিশ্বের অসীম আখ্যান থেকে আজ কোন গল্পটি শুনতে চান?';
const INITIAL_MESSAGE: Message = { id: 'initial-message', role: Role.MODEL, content: INITIAL_MESSAGE_CONTENT, timestamp: Date.now() };

const STORY_SUGGESTIONS = [
    "রহস্যময় নক্ষত্রের গল্প",
    "হারানো সভ্যতার উপকথা",
    "ভবিষ্যতের পৃথিবীর কাহিনী",
    "ধ্রুপদী সাহিত্যের পুনর্নির্মাণ",
];

const CONTINUATION_SUGGESTIONS = [
    "হ্যাঁ, আরও গভীরে যান...",
    "তারপর কী ঘটলো?",
    "গল্পটি এখানে শেষ করুন",
];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    
    // Sessions and State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
    const [storyLength, setStoryLength] = useState<StoryLength>('long');
    const [storyTheme, setStoryTheme] = useState<StoryTheme>('general');
    const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
    const [volume, setVolume] = useState(1);
    
    const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
    const [pendingAudioMessage, setPendingAudioMessage] = useState<{id: string, content: string, action: 'play' | 'download'} | null>(null);
    
    const chat = useRef<Chat | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const currentSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const currentlyPlayingIdRef = useRef<string | null>(null);

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

    useEffect(() => {
        const loadSessionMessages = async () => {
            if (currentSessionId && user) {
                setIsLoading(true);
                stopCurrentAudio();
                try {
                    const sessionMessages = await getChatMessages(currentSessionId);
                    if (sessionMessages.length > 0) {
                        setMessages(sessionMessages);
                        chat.current = initChat(storyLength, storyTheme, sessionMessages);
                    } else {
                        setMessages([INITIAL_MESSAGE]);
                        chat.current = initChat(storyLength, storyTheme, []);
                    }
                } catch (e) {
                    setError("স্মৃতি লোড করতে সমস্যা হয়েছে।");
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
    }, [currentSessionId, user, storyLength, storyTheme]);

    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            const gainNode = context.createGain();
            gainNode.connect(context.destination);
            gainNodeRef.current = gainNode;
            
            const analyser = context.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.85;
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
        
        // Accurate Time Calculation
        const elapsedTime = context.currentTime - playbackStartTimeRef.current;
        const newCurrentTime = pausedAtRef.current + elapsedTime;

        if (newCurrentTime >= state.duration) {
            stopCurrentAudio(false); 
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
        
        // Stop existing before starting new
        if (currentSourceNodeRef.current) {
            currentSourceNodeRef.current.onended = null;
            try { currentSourceNodeRef.current.stop(); } catch(e){}
        }

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(analyserNodeRef.current!);
        analyserNodeRef.current!.connect(gainNodeRef.current!);
        
        // Store Timing
        playbackStartTimeRef.current = context.currentTime;
        pausedAtRef.current = offset; // Store where we started from
        
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
                currentTime: offset // Update UI immediately
            }
        }));
        
        source.onended = () => {
             // Only stop if natural end, not if seek/pause stopped it
             if (currentlyPlayingIdRef.current === messageId) {
                 const contextTime = audioContextRef.current?.currentTime || 0;
                 const elapsed = contextTime - playbackStartTimeRef.current;
                 if (pausedAtRef.current + elapsed >= buffer.duration - 0.1) {
                    stopCurrentAudio(false);
                 }
             }
        };

        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(updateProgress);

    }, [updateProgress]);
    
    const pauseAudio = useCallback(() => {
        if (!audioContextRef.current || !currentlyPlayingIdRef.current || !currentSourceNodeRef.current) return;
        
        cancelAnimationFrame(animationFrameRef.current);
        
        const playingId = currentlyPlayingIdRef.current;
        const context = audioContextRef.current;
        
        // Calculate where we paused
        const elapsed = context.currentTime - playbackStartTimeRef.current;
        pausedAtRef.current = pausedAtRef.current + elapsed;
        
        currentSourceNodeRef.current.onended = null;
        try { currentSourceNodeRef.current.stop(); } catch(e) {}
        currentSourceNodeRef.current = null;
        
        setAudioStates(prev => ({
            ...prev,
            [playingId]: { 
                ...prev[playingId], 
                isPlaying: false,
                currentTime: pausedAtRef.current 
            }
        }));

    }, []);

    const stopCurrentAudio = useCallback((resetTime = true) => {
        cancelAnimationFrame(animationFrameRef.current);
        if (currentSourceNodeRef.current) {
            currentSourceNodeRef.current.onended = null;
            try { currentSourceNodeRef.current.stop(); } catch (e) {}
        }
        
        if (currentlyPlayingIdRef.current) {
            const finishedId = currentlyPlayingIdRef.current;
            setAudioStates(prev => ({
                ...prev,
                [finishedId]: {
                     ...prev[finishedId], 
                     isPlaying: false, 
                     currentTime: resetTime ? 0 : prev[finishedId]?.duration,
                     progress: resetTime ? 0 : 100
                    }
            }));
        }

        currentlyPlayingIdRef.current = null;
        currentSourceNodeRef.current = null;
        if (resetTime) pausedAtRef.current = 0;

    }, []);

    const startNewChat = useCallback(() => {
        if (!user) return;
        stopCurrentAudio();
        setCurrentSessionId(null);
        setMessages([INITIAL_MESSAGE]);
        setAudioStates({});
        setError(null);
        chat.current = initChat(storyLength, storyTheme, []);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }, [stopCurrentAudio, storyLength, storyTheme, user]);

    useEffect(() => {
        return () => {
            stopCurrentAudio();
            audioContextRef.current?.close();
        }
    }, [stopCurrentAudio]);

    const handleLengthChange = (length: StoryLength) => {
        setStoryLength(length);
    };

    const handleThemeChange = (theme: StoryTheme) => {
        setStoryTheme(theme);
    };
    
    const handleVoiceChange = (voice: string) => {
        setSelectedVoice(voice);
    };

    const generateAndPlayAudio = async (messageId: string, content: string, voiceName: string) => {
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

    const generateAndDownloadAudio = async (messageId: string, content: string, voiceName: string) => {
        setAudioStates(prev => ({
            ...prev,
            [messageId]: { ...prev[messageId], isLoading: true }
        }));

        try {
            const base64Audio = await generateStoryAudio(content, voiceName);
            const audioData = decode(base64Audio);
            const context = getAudioContext();
            const buffer = await decodeAudioData(audioData, context, 24000, 1);
            
            setAudioStates(prev => ({ 
                ...prev, 
                [messageId]: { 
                    ...prev[messageId], 
                    isLoading: false, 
                    audioBuffer: buffer,
                    duration: buffer.duration 
                } 
            }));

            const wavBlob = audioBufferToWav(buffer);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `story_${voiceName}_${messageId.substring(0, 6)}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            setError("অডিও ডাউনলোড করতে সমস্যা হয়েছে।");
            setAudioStates(prev => ({ 
                ...prev, 
                [messageId]: { ...prev[messageId], isLoading: false, error: true } 
            }));
        }
    };

    const handlePlayPause = async (messageId: string, content: string) => {
        const currentState = audioStates[messageId];

        if (currentState?.isPlaying) {
            pauseAudio();
            return;
        }

        if(currentlyPlayingIdRef.current && currentlyPlayingIdRef.current !== messageId) {
            stopCurrentAudio();
        }

        let buffer = currentState?.audioBuffer;
        if (buffer && !currentState.isPlaying) {
            // Resume from paused position
            playAudio(messageId, buffer, pausedAtRef.current);
            return;
        }

        stopCurrentAudio();
        setPendingAudioMessage({ id: messageId, content, action: 'play' });
        setShowVoiceModal(true);
    };

    const handleVoiceConfirm = (voiceName: string) => {
        setShowVoiceModal(false);
        if (pendingAudioMessage) {
            const { id, content, action } = pendingAudioMessage;
            if (action === 'play') {
                generateAndPlayAudio(id, content, voiceName);
                setSelectedVoice(voiceName);
            } else {
                generateAndDownloadAudio(id, content, voiceName);
            }
        }
        setPendingAudioMessage(null);
    };
    
    const handleRegenerateVoice = (messageId: string, content: string) => {
        stopCurrentAudio();
        setPendingAudioMessage({ id: messageId, content, action: 'play' });
        setShowVoiceModal(true);
    };

    const handleRequestDownload = (messageId: string, content: string) => {
        if (audioStates[messageId]?.audioBuffer) {
             const buffer = audioStates[messageId].audioBuffer;
             if(buffer) {
                const wavBlob = audioBufferToWav(buffer);
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `story_${messageId.substring(0, 6)}.wav`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                return;
             }
        }
        stopCurrentAudio();
        setPendingAudioMessage({ id: messageId, content, action: 'download' });
        setShowVoiceModal(true);
    };
    
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = newVolume;
        }
    };

    // FIXED SEEK LOGIC
    const handleSeek = (messageId: string, newTime: number) => {
        const state = audioStates[messageId];
        if (!state?.audioBuffer) return;

        // If currently playing this specific message, restart it at new offset
        if (currentlyPlayingIdRef.current === messageId && state.isPlaying) {
            playAudio(messageId, state.audioBuffer, newTime);
        } else {
            // Just update UI state if paused
            pausedAtRef.current = newTime;
            setAudioStates(prev => ({
                ...prev,
                [messageId]: {
                    ...prev[messageId],
                    currentTime: newTime,
                    progress: (newTime / state.duration) * 100,
                }
            }));
        }
    };

    const handleSendMessage = async (userInput: string) => {
        if (!user) return;
        
        stopCurrentAudio();
        setIsLoading(true);
        setError(null);
        
        let activeSessionId = currentSessionId;
        
        if (!activeSessionId) {
            activeSessionId = generateId();
            setCurrentSessionId(activeSessionId);
            const title = userInput.substring(0, 30) + (userInput.length > 30 ? '...' : '');
            await saveChatSession(user.uid, activeSessionId, title);
            const updatedSessions = await getChatSessions(user.uid);
            setSessions(updatedSessions);
            chat.current = initChat(storyLength, storyTheme, []);
        } else {
            await updateChatSessionTime(activeSessionId);
            if (!chat.current) {
                 chat.current = initChat(storyLength, storyTheme, messages);
            }
        }
        
        const userMessage: Message = { id: generateId(), role: Role.USER, content: userInput, timestamp: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        
        await saveMessage(activeSessionId, userMessage);

        try {
            if (!chat.current) chat.current = initChat(storyLength, storyTheme, messages);
            
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
            
            await saveMessage(activeSessionId, modelMessage);
            setIsLoading(false);
            const updatedSessions = await getChatSessions(user.uid);
            setSessions(updatedSessions);

        } catch (e) {
            console.error("Gemini API Error:", e);
            const errorMessage = "দুঃখিত, সংযোগে বিঘ্ন ঘটেছে।";
            setError(errorMessage);
            setIsLoading(false);
            chat.current = null;
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm("আপনি কি এই স্মৃতি মুছে ফেলতে চান?")) return;
        try {
            await deleteChatSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                startNewChat();
            }
        } catch (e) {
            setError("মুছতে ব্যর্থ হয়েছে।");
        }
    };

    const handleRequestImage = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.content || !currentSessionId) return;
        
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: true } : m));
        
        try {
            const imageUrl = await generateImageForStory(message.content);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, imageUrl, isGeneratingImage: false } : m));
            await saveMessage(currentSessionId, { ...message, imageUrl });
        } catch (imgErr) {
            setError("দৃশ্যকল্প তৈরি করা যায়নি।");
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isGeneratingImage: false } : m));
        }
    };

    const handleRandomStory = async () => {
        setIsGeneratingPrompt(true);
        setError(null);
        try {
            const prompt = await generateRandomStoryPrompt();
            if (prompt) await handleSendMessage(prompt);
        } catch (e) {
            setError("দৈবচয়িত গল্প তৈরি ব্যর্থ।");
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const getSuggestions = () => {
        if (isLoading || isGeneratingPrompt) return [];
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return [];
        if (lastMessage.id === 'initial-message') return STORY_SUGGESTIONS;
        if (lastMessage.role === Role.MODEL && messages.length > 1) {
            return CONTINUATION_SUGGESTIONS;
        }
        return [];
    };
    
    const combinedIsLoading = isLoading || isGeneratingPrompt || messages.some(m => m.isGeneratingImage);
    
    if (isAuthChecking) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-cosmic-accent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-cosmic-accent animate-pulse">...</div>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <div className="fixed inset-0 h-full w-full overflow-hidden flex flex-col font-sans">
                <div className="fixed inset-0 pointer-events-none z-0">
                     <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-purple-900/10 rounded-full blur-[100px] animate-pulse-slow"></div>
                     <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    <Header 
                        user={user} 
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                    />
                    
                    <div className="flex-1 flex overflow-hidden relative">
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

                        <div className="flex-1 flex flex-col min-w-0 relative h-full">
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
                                                handleDownloadAudio={handleRequestDownload}
                                                handleRequestImage={handleRequestImage}
                                                handleRequestVideo={() => {}} 
                                                handleRequestSlideshow={() => {}}
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
                                                storyTheme={storyTheme}
                                                onThemeChange={handleThemeChange}
                                                selectedVoice={selectedVoice}
                                                onVoiceChange={handleVoiceChange}
                                                isDisabled={combinedIsLoading}
                                            />
                                        }
                                    />
                                    <Route path="/image/:messageId" element={<ImageView messages={messages} />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            )}
                        </div>
                    </div>

                    <VoiceSelectionModal 
                        isOpen={showVoiceModal}
                        mode={pendingAudioMessage?.action || 'play'}
                        onClose={() => {
                            setShowVoiceModal(false);
                            setPendingAudioMessage(null);
                        }}
                        onConfirm={handleVoiceConfirm}
                    />
                </div>
            </div>
        </HashRouter>
    );
};

export default App;
