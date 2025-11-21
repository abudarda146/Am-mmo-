

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
  isGeneratingImage?: boolean;
  videoUrl?: string;
  isGeneratingVideo?: boolean;
  slideshow?: string[];
  isGeneratingSlideshow?: boolean;
  sources?: Source[];
}

export type StoryLength = 'short' | 'medium' | 'long';

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