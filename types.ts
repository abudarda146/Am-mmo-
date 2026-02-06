
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  imageUrl?: string;
  isGeneratingImage?: boolean; // Now implies "Searching Image"
  sources?: Source[];
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
}

export type StoryLength = 'short' | 'medium' | 'long';

export type StoryTheme = 'general' | 'fantasy' | 'scifi' | 'mystery' | 'romance' | 'horror';

export interface AudioState {
  isLoading: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  audioBuffer: AudioBuffer | null;
  error: boolean;
  progress: number;
  currentTime: number;
  duration: number;
}
