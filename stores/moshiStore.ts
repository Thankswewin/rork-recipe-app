import { create } from 'zustand';
import { MoshiClient, VoiceMessage, MoshiConfig } from '../lib/moshi-client';
import { errorHandler, handleAsync, AppError } from '../lib/error-handler';
import { DebugLog } from './unmuteStore';

interface MoshiState {
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
  sampleRate: number;
  channels: number;
  bitDepth: number;
  pushToTalk: boolean;
  
  // Moshi client instance
  moshiClient: MoshiClient | null;
  
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
  updateConfig: (config: Partial<MoshiConfig>) => void;
  setServerUrl: (url: string) => void;
  setSampleRate: (sampleRate: number) => void;
  setChannels: (channels: number) => void;
  setBitDepth: (bitDepth: number) => void;
  setPushToTalk: (enabled: boolean) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  
  // Error handling actions
  setError: (error: AppError | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

export const useMoshiStore = create<MoshiState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionStatus: 'disconnected',
  isRecording: false,
  isListening: false,
  messages: [],
  debugLogs: [],
  serverUrl: 'https://9lwbtc0ch3pawy-8998.proxy.runpod.net',
  sampleRate: 24000,
  channels: 1,
  bitDepth: 16,
  pushToTalk: false,
  moshiClient: null,
  error: null,

  // Actions
  connect: async () => {
    const state = get();
    if (state.isConnecting || state.isConnected) {
      return;
    }

    const [error] = await handleAsync(async () => {
      set({ isConnecting: true, error: null });
      
      // Create new Moshi client if needed
      if (!state.moshiClient) {
        const client = new MoshiClient(
          // onMessage callback
          (message: VoiceMessage) => {
            get().addMessage(message);
          },
          // onStatusChange callback
          (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
            get().setConnectionStatus(status);
          },
          // onDebugLog callback
          (log: Omit<DebugLog, 'timestamp'>) => {
            get().addDebugLog(log);
          },
          // config
          {
            serverUrl: state.serverUrl,
            sampleRate: state.sampleRate,
            channels: state.channels,
            bitDepth: state.bitDepth
          }
        );
        
        set({ moshiClient: client });
      }
      
      await state.moshiClient!.connect();
    });

    if (error) {
      get().handleError(error);
      set({ isConnecting: false });
    }
  },

  disconnect: () => {
    const state = get();
    
    try {
      if (state.moshiClient) {
        state.moshiClient.disconnect();
      }
      
      set({
        isConnected: false,
        isConnecting: false,
        isRecording: false,
        isListening: false,
        connectionStatus: 'disconnected',
        error: null
      });
      
      get().addDebugLog({
        level: 'info',
        message: 'Disconnected from Moshi server'
      });
    } catch (error) {
      get().handleError(error);
    }
  },

  startRecording: async () => {
    const state = get();
    
    if (!state.moshiClient || !state.isConnected) {
      get().addDebugLog({
        level: 'error',
        message: 'Cannot start recording: not connected to Moshi'
      });
      return;
    }

    const [error] = await handleAsync(async () => {
      set({ isRecording: true, isListening: true });
      await state.moshiClient!.startRecording();
    });

    if (error) {
      get().handleError(error);
      set({ isRecording: false, isListening: false });
    }
  },

  stopRecording: () => {
    const state = get();
    
    try {
      if (state.moshiClient && state.isRecording) {
        state.moshiClient.stopRecording();
      }
      
      set({ isRecording: false, isListening: false });
    } catch (error) {
      get().handleError(error);
    }
  },

  sendMessage: async (text: string) => {
    const state = get();
    
    if (!state.moshiClient || !state.isConnected) {
      get().addDebugLog({
        level: 'error',
        message: 'Cannot send message: not connected to Moshi'
      });
      return;
    }

    const [error] = await handleAsync(async () => {
      await state.moshiClient!.sendTextMessage(text);
    });

    if (error) {
      get().handleError(error);
    }
  },

  addMessage: (message: VoiceMessage) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
    get().addDebugLog({
      level: 'info',
      message: 'Conversation history cleared'
    });
  },

  addDebugLog: (log: Omit<DebugLog, 'timestamp'>) => {
    const timestamp = Date.now();
    set(state => ({
      debugLogs: [...state.debugLogs, { ...log, timestamp }].slice(-100) // Keep last 100 logs
    }));
  },

  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },

  updateConfig: (config: Partial<MoshiConfig>) => {
    const state = get();
    
    set({
      serverUrl: config.serverUrl ?? state.serverUrl,
      sampleRate: config.sampleRate ?? state.sampleRate,
      channels: config.channels ?? state.channels,
      bitDepth: config.bitDepth ?? state.bitDepth
    });
    
    if (state.moshiClient) {
      state.moshiClient.updateConfig(config);
    }
    
    get().addDebugLog({
      level: 'info',
      message: 'Moshi configuration updated',
      data: config
    });
  },

  setServerUrl: (url: string) => {
    set({ serverUrl: url });
    get().updateConfig({ serverUrl: url });
  },

  setSampleRate: (sampleRate: number) => {
    set({ sampleRate });
    get().updateConfig({ sampleRate });
  },

  setChannels: (channels: number) => {
    set({ channels });
    get().updateConfig({ channels });
  },

  setBitDepth: (bitDepth: number) => {
    set({ bitDepth });
    get().updateConfig({ bitDepth });
  },

  setPushToTalk: (enabled: boolean) => {
    set({ pushToTalk: enabled });
    get().addDebugLog({
      level: 'info',
      message: `Push-to-talk ${enabled ? 'enabled' : 'disabled'}`
    });
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
    const appError = errorHandler.handle(error);
    set({ error: appError });
    get().addDebugLog({
      level: 'error',
      message: appError.message,
      data: appError
    });
  }
}));