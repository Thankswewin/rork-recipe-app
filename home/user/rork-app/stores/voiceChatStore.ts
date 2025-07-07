import { create } from 'zustand';
import { VoiceMessage, RealtimeVoiceChat, KYUTAI_VOICES } from '@/lib/realtime-voice';

interface VoiceChatState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Recording state
  isRecording: boolean;
  isListening: boolean;
  
  // Messages
  messages: VoiceMessage[];
  
  // Settings
  selectedVoice: string;
  selectedLanguage: string;
  autoPlay: boolean;
  pushToTalk: boolean;
  
  // Voice chat instance
  voiceChat: RealtimeVoiceChat | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  sendMessage: (text: string) => Promise<void>;
  addMessage: (message: VoiceMessage) => void;
  clearMessages: () => void;
  setVoice: (voiceId: string) => void;
  setLanguage: (language: string) => void;
  setAutoPlay: (enabled: boolean) => void;
  setPushToTalk: (enabled: boolean) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionStatus: 'disconnected',
  isRecording: false,
  isListening: false,
  messages: [],
  selectedVoice: KYUTAI_VOICES[0].id,
  selectedLanguage: 'en-US',
  autoPlay: true,
  pushToTalk: false,
  voiceChat: null,

  // Actions
  connect: async () => {
    const state = get();
    if (state.isConnected || state.isConnecting) return;

    set({ isConnecting: true });

    try {
      const voiceChat = new RealtimeVoiceChat(
        (message) => {
          get().addMessage(message);
        },
        (status) => {
          get().setConnectionStatus(status);
        }
      );

      await voiceChat.connect();
      
      set({ 
        voiceChat,
        isConnecting: false 
      });

    } catch (error) {
      console.error('Failed to connect to voice chat:', error);
      set({ 
        isConnecting: false,
        connectionStatus: 'error'
      });
    }
  },

  disconnect: () => {
    const { voiceChat } = get();
    if (voiceChat) {
      voiceChat.disconnect();
    }
    
    set({
      voiceChat: null,
      isConnected: false,
      isConnecting: false,
      isRecording: false,
      isListening: false,
      connectionStatus: 'disconnected'
    });
  },

  startRecording: async () => {
    const { voiceChat, isConnected } = get();
    if (!voiceChat || !isConnected) return;

    try {
      await voiceChat.startRecording();
      set({ isRecording: true, isListening: true });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  },

  stopRecording: () => {
    const { voiceChat } = get();
    if (!voiceChat) return;

    voiceChat.stopRecording();
    set({ isRecording: false, isListening: false });
  },

  sendMessage: async (text: string) => {
    const { voiceChat } = get();
    if (!voiceChat) return;

    await voiceChat.sendTextMessage(text);
  },

  addMessage: (message: VoiceMessage) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setVoice: (voiceId: string) => {
    const { voiceChat } = get();
    if (voiceChat) {
      voiceChat.setVoice(voiceId);
    }
    set({ selectedVoice: voiceId });
  },

  setLanguage: (language: string) => {
    const { voiceChat } = get();
    if (voiceChat) {
      voiceChat.setLanguage(language);
    }
    set({ selectedLanguage: language });
  },

  setAutoPlay: (enabled: boolean) => {
    set({ autoPlay: enabled });
  },

  setPushToTalk: (enabled: boolean) => {
    set({ pushToTalk: enabled });
  },

  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    set({ 
      connectionStatus: status,
      isConnected: status === 'connected',
      isConnecting: status === 'connecting'
    });
  }
}));