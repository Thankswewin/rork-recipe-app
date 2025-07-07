import { create } from 'zustand';
import { VoiceMessage, RealtimeVoiceChat, KYUTAI_VOICES } from '@/lib/realtime-voice';

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: number;
  data?: any;
}

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
  
  // Debug logs
  debugLogs: DebugLog[];
  
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
  addDebugLog: (log: Omit<DebugLog, 'timestamp'>) => void;
  clearDebugLogs: () => void;
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
  debugLogs: [],
  selectedVoice: KYUTAI_VOICES[0].id,
  selectedLanguage: 'en-US',
  autoPlay: true,
  pushToTalk: false,
  voiceChat: null,

  // Actions
  connect: async () => {
    const state = get();
    if (state.isConnected || state.isConnecting) return;

    get().addDebugLog({
      level: 'info',
      message: 'Starting connection to voice assistant...'
    });

    set({ isConnecting: true, connectionStatus: 'connecting' });

    try {
      const voiceChat = new RealtimeVoiceChat(
        (message: VoiceMessage) => {
          get().addMessage(message);
          get().addDebugLog({
            level: 'success',
            message: `Received ${message.type} message: "${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}"`
          });
        },
        (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
          get().setConnectionStatus(status);
          get().addDebugLog({
            level: status === 'error' ? 'error' : 'info',
            message: `Connection status changed to: ${status}`
          });
        },
        (log: Omit<DebugLog, 'timestamp'>) => {
          get().addDebugLog(log);
        }
      );

      await voiceChat.connect();
      
      set({ 
        voiceChat,
        isConnecting: false 
      });

      get().addDebugLog({
        level: 'success',
        message: 'Successfully connected to voice assistant'
      });

    } catch (error) {
      console.error('Failed to connect to voice chat:', error);
      get().addDebugLog({
        level: 'error',
        message: 'Failed to connect to voice assistant',
        data: error instanceof Error ? error.message : String(error)
      });
      
      set({ 
        isConnecting: false,
        connectionStatus: 'error'
      });
    }
  },

  disconnect: () => {
    const { voiceChat } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Disconnecting from voice assistant...'
    });

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

    get().addDebugLog({
      level: 'info',
      message: 'Disconnected from voice assistant'
    });
  },

  startRecording: async () => {
    const { voiceChat, isConnected } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Attempting to start recording...',
      data: { isConnected, hasVoiceChat: !!voiceChat }
    });

    if (!voiceChat || !isConnected) {
      get().addDebugLog({
        level: 'error',
        message: 'Cannot start recording: not connected to voice assistant'
      });
      return;
    }

    try {
      await voiceChat.startRecording();
      set({ isRecording: true, isListening: true });
      
      get().addDebugLog({
        level: 'success',
        message: 'Recording started successfully'
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      get().addDebugLog({
        level: 'error',
        message: 'Failed to start recording',
        data: error instanceof Error ? error.message : String(error)
      });
    }
  },

  stopRecording: () => {
    const { voiceChat } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Stopping recording...'
    });

    if (!voiceChat) {
      get().addDebugLog({
        level: 'warn',
        message: 'Cannot stop recording: no voice chat instance'
      });
      return;
    }

    voiceChat.stopRecording();
    set({ isRecording: false, isListening: false });
    
    get().addDebugLog({
      level: 'success',
      message: 'Recording stopped'
    });
  },

  sendMessage: async (text: string) => {
    const { voiceChat } = get();
    
    get().addDebugLog({
      level: 'info',
      message: `Sending text message: "${text}"`
    });

    if (!voiceChat) {
      get().addDebugLog({
        level: 'error',
        message: 'Cannot send message: not connected'
      });
      return;
    }

    try {
      await voiceChat.sendTextMessage(text);
      get().addDebugLog({
        level: 'success',
        message: 'Text message sent successfully'
      });
    } catch (error) {
      get().addDebugLog({
        level: 'error',
        message: 'Failed to send text message',
        data: error instanceof Error ? error.message : String(error)
      });
    }
  },

  addMessage: (message: VoiceMessage) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  clearMessages: () => {
    get().addDebugLog({
      level: 'info',
      message: 'Cleared all messages'
    });
    set({ messages: [] });
  },

  addDebugLog: (log: Omit<DebugLog, 'timestamp'>) => {
    const newLog: DebugLog = {
      ...log,
      timestamp: Date.now()
    };
    
    set((state) => ({
      debugLogs: [...state.debugLogs.slice(-99), newLog] // Keep last 100 logs
    }));
  },

  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },

  setVoice: (voiceId: string) => {
    const { voiceChat } = get();
    
    get().addDebugLog({
      level: 'info',
      message: `Changing voice to: ${voiceId}`
    });

    if (voiceChat) {
      voiceChat.setVoice(voiceId);
    }
    set({ selectedVoice: voiceId });
  },

  setLanguage: (language: string) => {
    const { voiceChat } = get();
    
    get().addDebugLog({
      level: 'info',
      message: `Changing language to: ${language}`
    });

    if (voiceChat) {
      voiceChat.setLanguage(language);
    }
    set({ selectedLanguage: language });
  },

  setAutoPlay: (enabled: boolean) => {
    get().addDebugLog({
      level: 'info',
      message: `Auto-play ${enabled ? 'enabled' : 'disabled'}`
    });
    set({ autoPlay: enabled });
  },

  setPushToTalk: (enabled: boolean) => {
    get().addDebugLog({
      level: 'info',
      message: `Push-to-talk ${enabled ? 'enabled' : 'disabled'}`
    });
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