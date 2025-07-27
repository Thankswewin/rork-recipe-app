import { Platform } from 'react-native';
import { DebugLog } from '../stores/unmuteStore';

// Unmute WebSocket Protocol Events (based on OpenAI Realtime API)
export interface UnmuteEvent {
  type: string;
  event_id?: string;
}

export interface SessionUpdateEvent extends UnmuteEvent {
  type: 'session.update';
  session: {
    modalities: string[];
    instructions: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription?: {
      model: string;
    };
    turn_detection?: {
      type: string;
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    };
    tools?: any[];
    tool_choice?: string;
    temperature?: number;
    max_response_output_tokens?: number;
  };
}

export interface InputAudioBufferAppendEvent extends UnmuteEvent {
  type: 'input_audio_buffer.append';
  audio: string; // base64 encoded audio
}

export interface InputAudioBufferCommitEvent extends UnmuteEvent {
  type: 'input_audio_buffer.commit';
}

export interface ConversationItemCreateEvent extends UnmuteEvent {
  type: 'conversation.item.create';
  item: {
    id?: string;
    type: 'message';
    role: 'user' | 'assistant';
    content: Array<{
      type: 'input_text' | 'input_audio' | 'text';
      text?: string;
      audio?: string;
      transcript?: string;
    }>;
  };
}

export interface ResponseCreateEvent extends UnmuteEvent {
  type: 'response.create';
  response?: {
    modalities: string[];
    instructions?: string;
    voice?: string;
    output_audio_format?: string;
    tools?: any[];
    tool_choice?: string;
    temperature?: number;
    max_output_tokens?: number;
  };
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: number;
  isPlaying?: boolean;
}

export interface UnmuteConfig {
  serverUrl: string;
  voice: string;
  language: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
}

export class UnmuteClient {
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
  private currentSessionId: string | null = null;
  private audioQueue: HTMLAudioElement[] = [];
  private isPlayingAudio = false;

  private config: UnmuteConfig = {
    serverUrl: 'ws://localhost:8000/ws', // Will be updated with RunPod URL
    voice: 'alloy',
    language: 'en',
    instructions: 'You are a helpful voice assistant. Respond naturally and conversationally.',
    temperature: 0.8,
    maxTokens: 150
  };

  constructor(
    private onMessage: (message: VoiceMessage) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void,
    private onDebugLog: (log: Omit<DebugLog, 'timestamp'>) => void,
    config?: Partial<UnmuteConfig>
  ) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.onDebugLog({
      level: 'info',
      message: 'UnmuteClient initialized',
      data: { 
        platform: Platform.OS,
        serverUrl: this.config.serverUrl,
        voice: this.config.voice
      }
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      this.onDebugLog({
        level: 'warn',
        message: 'Already connected or connecting'
      });
      return;
    }

    this.isConnecting = true;
    this.onStatusChange('connecting');
    
    this.onDebugLog({
      level: 'info',
      message: 'Connecting to Unmute server...',
      data: { url: this.config.serverUrl }
    });

    try {
      // Initialize audio context for web
      if (Platform.OS === 'web') {
        await this.initializeAudioContext();
      }

      // Create WebSocket connection
      this.ws = new WebSocket(this.config.serverUrl);
      
      this.ws.onopen = () => {
        this.onDebugLog({
          level: 'success',
          message: 'WebSocket connection established'
        });
        
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onStatusChange('connected');
        
        // Initialize session
        this.initializeSession();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onclose = (event) => {
        this.onDebugLog({
          level: 'warn',
          message: 'WebSocket connection closed',
          data: { code: event.code, reason: event.reason }
        });
        
        this.isConnected = false;
        this.isConnecting = false;
        
        if (event.code !== 1000) { // Not a normal closure
          this.onStatusChange('error');
          this.attemptReconnect();
        } else {
          this.onStatusChange('disconnected');
        }
      };

      this.ws.onerror = (error) => {
        this.onDebugLog({
          level: 'error',
          message: 'WebSocket error',
          data: error
        });
        
        this.isConnected = false;
        this.isConnecting = false;
        this.onStatusChange('error');
      };

    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to create WebSocket connection',
        data: error instanceof Error ? error.message : String(error)
      });
      
      this.isConnecting = false;
      this.onStatusChange('error');
      throw error;
    }
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.onDebugLog({
        level: 'success',
        message: 'Audio context initialized',
        data: { 
          sampleRate: this.audioContext.sampleRate,
          state: this.audioContext.state
        }
      });
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to initialize audio context',
        data: error
      });
      throw error;
    }
  }

  private initializeSession(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onDebugLog({
        level: 'error',
        message: 'Cannot initialize session - WebSocket not ready'
      });
      return;
    }

    this.currentSessionId = `session_${Date.now()}`;
    
    const sessionUpdate: SessionUpdateEvent = {
      type: 'session.update',
      event_id: `event_${Date.now()}`,
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxTokens
      }
    };

    this.sendEvent(sessionUpdate);
    
    this.onDebugLog({
      level: 'success',
      message: 'Session initialized',
      data: { sessionId: this.currentSessionId }
    });
  }

  private sendEvent(event: UnmuteEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onDebugLog({
        level: 'error',
        message: 'Cannot send event - WebSocket not ready',
        data: { eventType: event.type }
      });
      return;
    }

    try {
      const message = JSON.stringify(event);
      this.ws.send(message);
      
      this.onDebugLog({
        level: 'info',
        message: `Sent event: ${event.type}`,
        data: { eventId: event.event_id }
      });
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to send event',
        data: { eventType: event.type, error }
      });
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      this.onDebugLog({
        level: 'info',
        message: `Received event: ${data.type}`,
        data: { eventId: data.event_id }
      });

      switch (data.type) {
        case 'session.created':
          this.handleSessionCreated(data);
          break;
        case 'session.updated':
          this.handleSessionUpdated(data);
          break;
        case 'input_audio_buffer.speech_started':
          this.handleSpeechStarted(data);
          break;
        case 'input_audio_buffer.speech_stopped':
          this.handleSpeechStopped(data);
          break;
        case 'conversation.item.created':
          this.handleConversationItemCreated(data);
          break;
        case 'response.created':
          this.handleResponseCreated(data);
          break;
        case 'response.output_item.added':
          this.handleResponseOutputItemAdded(data);
          break;
        case 'response.audio.delta':
          this.handleResponseAudioDelta(data);
          break;
        case 'response.audio_transcript.delta':
          this.handleResponseAudioTranscriptDelta(data);
          break;
        case 'response.done':
          this.handleResponseDone(data);
          break;
        case 'error':
          this.handleError(data);
          break;
        default:
          this.onDebugLog({
            level: 'warn',
            message: `Unhandled event type: ${data.type}`,
            data: data
          });
      }
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to parse WebSocket message',
        data: { error, rawData: event.data }
      });
    }
  }

  private handleSessionCreated(data: any): void {
    this.onDebugLog({
      level: 'success',
      message: 'Session created successfully',
      data: { sessionId: data.session?.id }
    });
  }

  private handleSessionUpdated(data: any): void {
    this.onDebugLog({
      level: 'success',
      message: 'Session updated successfully'
    });
  }

  private handleSpeechStarted(data: any): void {
    this.onDebugLog({
      level: 'info',
      message: 'Speech detection started'
    });
  }

  private handleSpeechStopped(data: any): void {
    this.onDebugLog({
      level: 'info',
      message: 'Speech detection stopped'
    });
  }

  private handleConversationItemCreated(data: any): void {
    const item = data.item;
    if (item && item.content) {
      const textContent = item.content.find((c: any) => c.type === 'text' || c.type === 'input_text');
      if (textContent && textContent.text) {
        const message: VoiceMessage = {
          id: item.id || `msg_${Date.now()}`,
          type: item.role === 'user' ? 'user' : 'assistant',
          text: textContent.text,
          timestamp: Date.now()
        };
        
        this.onMessage(message);
        
        this.onDebugLog({
          level: 'success',
          message: `${item.role} message created`,
          data: { text: textContent.text.substring(0, 100) }
        });
      }
    }
  }

  private handleResponseCreated(data: any): void {
    this.onDebugLog({
      level: 'info',
      message: 'Response generation started',
      data: { responseId: data.response?.id }
    });
  }

  private handleResponseOutputItemAdded(data: any): void {
    this.onDebugLog({
      level: 'info',
      message: 'Response output item added',
      data: { itemId: data.item?.id, type: data.item?.type }
    });
  }

  private handleResponseAudioDelta(data: any): void {
    if (data.delta && Platform.OS === 'web') {
      // Handle streaming audio playback
      this.playAudioDelta(data.delta);
    }
  }

  private handleResponseAudioTranscriptDelta(data: any): void {
    // Handle streaming text updates
    if (data.delta) {
      this.onDebugLog({
        level: 'info',
        message: 'Audio transcript delta received',
        data: { delta: data.delta }
      });
    }
  }

  private handleResponseDone(data: any): void {
    this.onDebugLog({
      level: 'success',
      message: 'Response generation completed',
      data: { responseId: data.response?.id }
    });
  }

  private handleError(data: any): void {
    this.onDebugLog({
      level: 'error',
      message: 'Server error received',
      data: { error: data.error }
    });
  }

  private async playAudioDelta(audioData: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Decode base64 audio data
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create audio buffer and play
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();

      this.onDebugLog({
        level: 'info',
        message: 'Playing audio delta',
        data: { bufferLength: audioBuffer.length }
      });
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to play audio delta',
        data: error
      });
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || !this.isConnected) {
      this.onDebugLog({
        level: 'warn',
        message: 'Cannot start recording',
        data: { isRecording: this.isRecording, isConnected: this.isConnected }
      });
      return;
    }

    this.onDebugLog({
      level: 'info',
      message: 'Starting audio recording...'
    });

    try {
      if (Platform.OS === 'web') {
        await this.startWebRecording();
      } else {
        await this.startMobileRecording();
      }

      this.isRecording = true;
      
      this.onDebugLog({
        level: 'success',
        message: 'Recording started successfully'
      });
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to start recording',
        data: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async startWebRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          // Send audio data to server in real-time
          this.sendAudioChunk(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      
      this.onDebugLog({
        level: 'success',
        message: 'Web recording started',
        data: { mimeType: this.mediaRecorder.mimeType }
      });
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to start web recording',
        data: error
      });
      throw error;
    }
  }

  private async startMobileRecording(): Promise<void> {
    // For mobile, we'll use a placeholder implementation
    // In a real app, you'd use expo-av or react-native-audio-recorder-player
    this.onDebugLog({
      level: 'info',
      message: 'Mobile recording not fully implemented - using placeholder'
    });
    
    // Simulate recording
    setTimeout(() => {
      this.sendTextMessage("Hello from mobile recording simulation");
    }, 2000);
  }

  private async sendAudioChunk(audioBlob: Blob): Promise<void> {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))));

      const event: InputAudioBufferAppendEvent = {
        type: 'input_audio_buffer.append',
        event_id: `audio_${Date.now()}`,
        audio: base64Audio
      };

      this.sendEvent(event);
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
      this.onDebugLog({
        level: 'warn',
        message: 'Cannot stop recording - not currently recording'
      });
      return;
    }

    this.onDebugLog({
      level: 'info',
      message: 'Stopping recording...'
    });

    if (Platform.OS === 'web' && this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
    }

    // Commit the audio buffer
    const commitEvent: InputAudioBufferCommitEvent = {
      type: 'input_audio_buffer.commit',
      event_id: `commit_${Date.now()}`
    };

    this.sendEvent(commitEvent);

    this.isRecording = false;
    
    this.onDebugLog({
      level: 'success',
      message: 'Recording stopped successfully'
    });
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.isConnected) {
      this.onDebugLog({
        level: 'error',
        message: 'Cannot send text message - not connected'
      });
      return;
    }

    this.onDebugLog({
      level: 'info',
      message: 'Sending text message',
      data: { text: text.substring(0, 100) }
    });

    // Create conversation item
    const createItemEvent: ConversationItemCreateEvent = {
      type: 'conversation.item.create',
      event_id: `item_${Date.now()}`,
      item: {
        id: `msg_${Date.now()}`,
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    };

    this.sendEvent(createItemEvent);

    // Create response
    const createResponseEvent: ResponseCreateEvent = {
      type: 'response.create',
      event_id: `response_${Date.now()}`,
      response: {
        modalities: ['text', 'audio'],
        voice: this.config.voice,
        output_audio_format: 'pcm16'
      }
    };

    this.sendEvent(createResponseEvent);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onDebugLog({
        level: 'error',
        message: 'Max reconnection attempts reached'
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

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

  updateConfig(config: Partial<UnmuteConfig>): void {
    this.config = { ...this.config, ...config };
    
    this.onDebugLog({
      level: 'info',
      message: 'Configuration updated',
      data: config
    });

    // If connected, update the session
    if (this.isConnected) {
      this.initializeSession();
    }
  }

  disconnect(): void {
    this.onDebugLog({
      level: 'info',
      message: 'Disconnecting from Unmute server...'
    });

    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.isRecording = false;
    this.reconnectAttempts = 0;
    this.currentSessionId = null;
    this.audioChunks = [];
    
    this.onStatusChange('disconnected');
    
    this.onDebugLog({
      level: 'success',
      message: 'Disconnected from Unmute server'
    });
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get recording(): boolean {
    return this.isRecording;
  }

  get currentConfig(): UnmuteConfig {
    return { ...this.config };
  }
}

export const UNMUTE_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Clear, articulate voice' },
  { id: 'fable', name: 'Fable', description: 'Warm, storytelling voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Bright, energetic voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Gentle, soothing voice' }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];