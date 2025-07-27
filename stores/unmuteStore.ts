import { create } from 'zustand';
import { UnmuteClient, VoiceMessage, UnmuteConfig } from '../lib/unmute-client';
import { errorHandler, handleAsync, AppError } from '../lib/error-handler';

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: number;
  data?: any;
}

interface UnmuteState {
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
  serverUrl: string;
  selectedVoice: string;
  selectedLanguage: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
  pushToTalk: boolean;
  
  // Unmute client instance
  unmuteClient: UnmuteClient | null;
  
  // Error handling
  error: AppError | null;
  
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
  updateConfig: (config: Partial<UnmuteConfig>) => void;
  setServerUrl: (url: string) => void;
  setVoice: (voiceId: string) => void;
  setLanguage: (language: string) => void;
  setInstructions: (instructions: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setPushToTalk: (enabled: boolean) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  
  // Error handling actions
  setError: (error: AppError | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

export const useUnmuteStore = create<UnmuteState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionStatus: 'disconnected',
  isRecording: false,
  isListening: false,
  messages: [],
  debugLogs: [],
  serverUrl: 'ws://localhost:8000/ws',
  selectedVoice: 'alloy',
  selectedLanguage: 'en',
  instructions: 'You are a helpful voice assistant. Respond naturally and conversationally in 1-2 sentences.',
  temperature: 0.8,
  maxTokens: 150,
  pushToTalk: false,
  unmuteClient: null,
  error: null,

  // Actions
  connect: async () => {
    return handleAsync(async () => {
      const state = get();
      if (state.isConnected || state.isConnecting) return;

      get().addDebugLog({
        level: 'info',
        message: 'Initializing Unmute connection...'
      });

      set({ isConnecting: true, connectionStatus: 'connecting', error: null });

      try {
        const config: UnmuteConfig = {
          serverUrl: state.serverUrl,
          voice: state.selectedVoice,
          language: state.selectedLanguage,
          instructions: state.instructions,
          temperature: state.temperature,
          maxTokens: state.maxTokens
        };

        const unmuteClient = new UnmuteClient(
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
          },
          config
        );

        await unmuteClient.connect();
        
        set({ 
          unmuteClient,
          isConnecting: false 
        });

        get().addDebugLog({
          level: 'success',
          message: 'Successfully connected to Unmute server'
        });

      } catch (error) {
        set({ 
          isConnecting: false,
          connectionStatus: 'error'
        });
        throw error;
      }
    }, (error) => {
      get().handleError(error);
      get().addDebugLog({
        level: 'error',
        message: 'Failed to connect to Unmute server',
        data: error instanceof Error ? error.message : String(error)
      });
    });
  },

  disconnect: () => {
    const { unmuteClient } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Disconnecting from Unmute server...'
    });

    if (unmuteClient) {
      unmuteClient.disconnect();
    }
    
    set({
      unmuteClient: null,
      isConnected: false,
      isConnecting: false,
      isRecording: false,
      isListening: false,
      connectionStatus: 'disconnected'
    });

    get().addDebugLog({
      level: 'info',
      message: 'Disconnected from Unmute server'
    });
  },

  startRecording: async () => {
    const { unmuteClient, isConnected } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Attempting to start recording...',
      data: { isConnected, hasUnmuteClient: !!unmuteClient }
    });

    if (!unmuteClient || !isConnected) {
      get().addDebugLog({
        level: 'error',
        message: 'Cannot start recording: not connected to Unmute server'
      });
      return;
    }

    try {
      await unmuteClient.startRecording();
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
    const { unmuteClient } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Stopping recording...'
    });

    if (!unmuteClient) {
      get().addDebugLog({
        level: 'warn',
        message: 'Cannot stop recording: no Unmute client instance'
      });
      return;
    }

    unmuteClient.stopRecording();
    set({ isRecording: false, isListening: false });
    
    get().addDebugLog({
      level: 'success',
      message: 'Recording stopped'
    });
  },

  sendMessage: async (text: string) => {
    const { unmuteClient } = get();
    
    get().addDebugLog({
      level: 'info',
      message: `Sending text message: "${text}"`
    });

    if (!unmuteClient) {
      get().addDebugLog({
        level: 'error',
        message: 'Cannot send message: not connected'
      });
      return;
    }

    try {
      await unmuteClient.sendTextMessage(text);
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

  updateConfig: (config: Partial<UnmuteConfig>) => {
    const { unmuteClient } = get();
    
    get().addDebugLog({
      level: 'info',
      message: 'Updating Unmute configuration',
      data: config
    });

    // Update local state
    set((state) => ({
      serverUrl: config.serverUrl || state.serverUrl,
      selectedVoice: config.voice || state.selectedVoice,
      selectedLanguage: config.language || state.selectedLanguage,
      instructions: config.instructions || state.instructions,
      temperature: config.temperature !== undefined ? config.temperature : state.temperature,
      maxTokens: config.maxTokens !== undefined ? config.maxTokens : state.maxTokens
    }));

    // Update client config if connected
    if (unmuteClient) {
      unmuteClient.updateConfig(config);
    }
  },

  setServerUrl: (url: string) => {
    get().addDebugLog({
      level: 'info',
      message: `Server URL changed to: ${url}`
    });
    set({ serverUrl: url });
  },

  setVoice: (voiceId: string) => {
    get().addDebugLog({
      level: 'info',
      message: `Voice changed to: ${voiceId}`
    });
    get().updateConfig({ voice: voiceId });
  },

  setLanguage: (language: string) => {
    get().addDebugLog({
      level: 'info',
      message: `Language changed to: ${language}`
    });
    get().updateConfig({ language });
  },

  setInstructions: (instructions: string) => {
    get().addDebugLog({
      level: 'info',
      message: 'Instructions updated'
    });
    get().updateConfig({ instructions });
  },

  setTemperature: (temperature: number) => {
    get().addDebugLog({
      level: 'info',
      message: `Temperature changed to: ${temperature}`
    });
    get().updateConfig({ temperature });
  },

  setMaxTokens: (maxTokens: number) => {
    get().addDebugLog({
      level: 'info',
      message: `Max tokens changed to: ${maxTokens}`
    });
    get().updateConfig({ maxTokens });
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
  },
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  handleError: (error) => {
    console.error('Unmute Store Error:', error);
    const appError = errorHandler.handle(error);
    set({ error: appError });
  }
}));