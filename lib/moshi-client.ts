import { Platform } from 'react-native';
import { DebugLog } from '../stores/unmuteStore';

// Moshi WebSocket Protocol Events
export interface MoshiEvent {
  type: string;
  data?: any;
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: number;
  isPlaying?: boolean;
}

export interface MoshiConfig {
  serverUrl: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export class MoshiClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private audioChunks: Blob[] = [];
  private audioQueue: HTMLAudioElement[] = [];
  private isPlayingAudio = false;
  private currentConversationId: string | null = null;

  private config: MoshiConfig = {
    serverUrl: 'wss://9lwbtc0ch3pawy-8998.proxy.runpod.net/ws', // Your RunPod Moshi server
    sampleRate: 24000,
    channels: 1,
    bitDepth: 16
  };

  constructor(
    private onMessage: (message: VoiceMessage) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void,
    private onDebugLog: (log: Omit<DebugLog, 'timestamp'>) => void,
    config?: Partial<MoshiConfig>
  ) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize audio context for web
    if (Platform.OS === 'web') {
      this.initializeAudioContext();
    }
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      this.onDebugLog({ level: 'warn', message: 'Already connecting or connected' });
      return;
    }

    this.isConnecting = true;
    this.onStatusChange('connecting');
    this.onDebugLog({ level: 'info', message: `Connecting to Moshi server: ${this.config.serverUrl}` });

    try {
      // Convert HTTP URL to WebSocket URL if needed
      let wsUrl = this.config.serverUrl;
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      }
      
      // Ensure WebSocket endpoint
      if (!wsUrl.includes('/ws')) {
        wsUrl = wsUrl.replace(/\/$/, '') + '/ws';
      }

      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onStatusChange('connected');
        this.onDebugLog({ level: 'success', message: 'Connected to Moshi server' });
        
        // Initialize conversation
        this.initializeConversation();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        this.onStatusChange('disconnected');
        this.onDebugLog({ 
          level: 'warn', 
          message: `Connection closed: ${event.code} - ${event.reason}`,
          data: { code: event.code, reason: event.reason }
        });
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnected = false;
        this.isConnecting = false;
        this.onStatusChange('error');
        this.onDebugLog({ 
          level: 'error', 
          message: 'WebSocket error occurred',
          data: error
        });
      };

    } catch (error) {
      this.isConnecting = false;
      this.onStatusChange('error');
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to connect to Moshi server',
        data: error
      });
      throw error;
    }
  }

  private async initializeAudioContext(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.config.sampleRate
        });
        
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        this.onDebugLog({ level: 'info', message: 'Audio context initialized' });
      } catch (error) {
        this.onDebugLog({ 
          level: 'error', 
          message: 'Failed to initialize audio context',
          data: error
        });
      }
    }
  }

  private initializeConversation(): void {
    this.currentConversationId = `conv_${Date.now()}`;
    
    // Send initial configuration to Moshi
    this.sendEvent({
      type: 'conversation.start',
      data: {
        conversation_id: this.currentConversationId,
        config: {
          sample_rate: this.config.sampleRate,
          channels: this.config.channels,
          bit_depth: this.config.bitDepth
        }
      }
    });
  }

  private sendEvent(event: MoshiEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onDebugLog({ 
        level: 'warn', 
        message: 'Cannot send event: WebSocket not connected',
        data: event
      });
      return;
    }

    try {
      this.ws.send(JSON.stringify(event));
      this.onDebugLog({ 
        level: 'info', 
        message: `Sent event: ${event.type}`,
        data: event
      });
    } catch (error) {
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to send event',
        data: { event, error }
      });
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.onDebugLog({ 
        level: 'info', 
        message: `Received event: ${data.type}`,
        data
      });

      switch (data.type) {
        case 'conversation.started':
          this.handleConversationStarted(data);
          break;
        case 'audio.speech_started':
          this.handleSpeechStarted(data);
          break;
        case 'audio.speech_stopped':
          this.handleSpeechStopped(data);
          break;
        case 'audio.response_audio':
          this.handleResponseAudio(data);
          break;
        case 'text.response_text':
          this.handleResponseText(data);
          break;
        case 'conversation.turn_complete':
          this.handleTurnComplete(data);
          break;
        case 'error':
          this.handleError(data);
          break;
        default:
          this.onDebugLog({ 
            level: 'warn', 
            message: `Unknown event type: ${data.type}`,
            data
          });
      }
    } catch (error) {
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to parse WebSocket message',
        data: { message: event.data, error }
      });
    }
  }

  private handleConversationStarted(data: any): void {
    this.onDebugLog({ level: 'success', message: 'Conversation started with Moshi' });
  }

  private handleSpeechStarted(data: any): void {
    this.onDebugLog({ level: 'info', message: 'Speech detection started' });
  }

  private handleSpeechStopped(data: any): void {
    this.onDebugLog({ level: 'info', message: 'Speech detection stopped' });
  }

  private handleResponseAudio(data: any): void {
    if (data.audio_data) {
      this.playAudioData(data.audio_data);
    }
  }

  private handleResponseText(data: any): void {
    if (data.text) {
      const message: VoiceMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        text: data.text,
        timestamp: Date.now()
      };
      
      this.onMessage(message);
      this.onDebugLog({ 
        level: 'success', 
        message: 'Received text response from Moshi',
        data: { text: data.text }
      });
    }
  }

  private handleTurnComplete(data: any): void {
    this.onDebugLog({ level: 'info', message: 'Turn completed' });
  }

  private handleError(data: any): void {
    this.onDebugLog({ 
      level: 'error', 
      message: `Moshi server error: ${data.message || 'Unknown error'}`,
      data
    });
  }

  private async playAudioData(audioData: string): Promise<void> {
    if (Platform.OS === 'web' && this.audioContext) {
      try {
        // Decode base64 audio data
        const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
        const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer.buffer);
        
        // Play audio
        const source = this.audioContext.createBufferSource();
        source.buffer = decodedAudio;
        source.connect(this.audioContext.destination);
        source.start();
        
        this.onDebugLog({ level: 'info', message: 'Playing audio response' });
      } catch (error) {
        this.onDebugLog({ 
          level: 'error', 
          message: 'Failed to play audio response',
          data: error
        });
      }
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      this.onDebugLog({ level: 'warn', message: 'Already recording' });
      return;
    }

    if (!this.isConnected) {
      this.onDebugLog({ level: 'error', message: 'Cannot start recording: not connected to Moshi' });
      return;
    }

    try {
      this.isRecording = true;
      this.audioChunks = [];
      
      if (Platform.OS === 'web') {
        await this.startWebRecording();
      } else {
        await this.startMobileRecording();
      }
      
      this.onDebugLog({ level: 'success', message: 'Started recording audio' });
    } catch (error) {
      this.isRecording = false;
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to start recording',
        data: error
      });
      throw error;
    }
  }

  private async startWebRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: this.config.sampleRate,
        channelCount: this.config.channels,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
        this.sendAudioChunk(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  private async startMobileRecording(): Promise<void> {
    // Mobile recording implementation would go here
    // For now, we'll use web implementation as fallback
    await this.startWebRecording();
  }

  private async sendAudioChunk(audioBlob: Blob): Promise<void> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      this.sendEvent({
        type: 'audio.input_audio',
        data: {
          conversation_id: this.currentConversationId,
          audio_data: base64Audio,
          format: 'webm'
        }
      });
    } catch (error) {
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to send audio chunk',
        data: error
      });
    }
  }

  stopRecording(): void {
    if (!this.isRecording) {
      this.onDebugLog({ level: 'warn', message: 'Not currently recording' });
      return;
    }

    try {
      this.isRecording = false;
      
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
        
        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      
      // Send end of audio signal
      this.sendEvent({
        type: 'audio.input_audio_complete',
        data: {
          conversation_id: this.currentConversationId
        }
      });
      
      this.onDebugLog({ level: 'success', message: 'Stopped recording audio' });
    } catch (error) {
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to stop recording',
        data: error
      });
    }
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.isConnected) {
      this.onDebugLog({ level: 'error', message: 'Cannot send message: not connected to Moshi' });
      return;
    }

    try {
      // Add user message to conversation
      const userMessage: VoiceMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        text,
        timestamp: Date.now()
      };
      
      this.onMessage(userMessage);
      
      // Send text to Moshi
      this.sendEvent({
        type: 'text.input_text',
        data: {
          conversation_id: this.currentConversationId,
          text
        }
      });
      
      this.onDebugLog({ 
        level: 'success', 
        message: 'Sent text message to Moshi',
        data: { text }
      });
    } catch (error) {
      this.onDebugLog({ 
        level: 'error', 
        message: 'Failed to send text message',
        data: error
      });
      throw error;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.onDebugLog({ 
      level: 'info', 
      message: `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        this.onDebugLog({ 
          level: 'error', 
          message: 'Reconnection failed',
          data: error
        });
      });
    }, delay);
  }

  updateConfig(config: Partial<MoshiConfig>): void {
    this.config = { ...this.config, ...config };
    this.onDebugLog({ 
      level: 'info', 
      message: 'Moshi configuration updated',
      data: this.config
    });
    
    // If connected, reinitialize with new config
    if (this.isConnected) {
      this.initializeConversation();
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.currentConversationId = null;
    
    this.onStatusChange('disconnected');
    this.onDebugLog({ level: 'info', message: 'Disconnected from Moshi server' });
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get recording(): boolean {
    return this.isRecording;
  }

  get currentConfig(): MoshiConfig {
    return { ...this.config };
  }
}

export const MOSHI_SAMPLE_RATES = [
  { value: 16000, label: '16 kHz' },
  { value: 24000, label: '24 kHz (Recommended)' },
  { value: 48000, label: '48 kHz' }
];

export const MOSHI_CHANNELS = [
  { value: 1, label: 'Mono (Recommended)' },
  { value: 2, label: 'Stereo' }
];

export const MOSHI_BIT_DEPTHS = [
  { value: 16, label: '16-bit (Recommended)' },
  { value: 24, label: '24-bit' },
  { value: 32, label: '32-bit' }
];