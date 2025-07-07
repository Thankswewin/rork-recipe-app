import { Platform } from 'react-native';

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: number;
  isPlaying?: boolean;
}

export interface VoiceConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  voiceId: string;
  language: string;
}

export class RealtimeVoiceChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isRecording = false;
  private isConnected = false;
  private currentAudio: HTMLAudioElement | null = null;

  private config: VoiceConfig = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    voiceId: 'natural-female-1', // Kyutai voice ID
    language: 'en-US'
  };

  constructor(
    private onMessage: (message: VoiceMessage) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  ) {}

  async connect(): Promise<void> {
    try {
      this.onStatusChange('connecting');
      
      // Initialize audio context for web
      if (Platform.OS === 'web') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Connect to WebSocket server
      this.ws = new WebSocket('wss://api.kyutai.org/v1/realtime-voice');
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.onStatusChange('connected');
        this.sendConfig();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onStatusChange('disconnected');
      };

      this.ws.onerror = () => {
        this.onStatusChange('error');
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onStatusChange('error');
    }
  }

  private sendConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'config',
      config: this.config
    }));
  }

  private async handleWebSocketMessage(event: MessageEvent): Promise<void> {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'transcription':
          // Real-time speech recognition result
          this.onMessage({
            id: Date.now().toString(),
            type: 'user',
            text: data.text,
            timestamp: Date.now()
          });
          break;

        case 'ai_response':
          // AI generated response text
          this.onMessage({
            id: Date.now().toString(),
            type: 'assistant',
            text: data.text,
            timestamp: Date.now()
          });
          break;

        case 'audio_chunk':
          // Streaming audio from Kyutai TTS
          await this.playAudioChunk(data.audio);
          break;

        case 'audio_complete':
          // Audio generation complete
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || !this.isConnected) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Send audio chunks in real-time
          this.ws.send(JSON.stringify({
            type: 'audio_chunk',
            audio: event.data
          }));
        }
      };

      this.mediaRecorder.start(100); // Send chunks every 100ms for real-time processing
      this.isRecording = true;

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.stop();
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    this.isRecording = false;

    // Send end of speech signal
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'end_speech'
      }));
    }
  }

  private async playAudioChunk(audioData: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        // Decode base64 audio data
        const binaryData = atob(audioData);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }

        // Create audio buffer and play
        if (this.audioContext) {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          const source = this.audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioContext.destination);
          source.start();
        }
      } catch (error) {
        console.error('Error playing audio chunk:', error);
      }
    } else {
      // For React Native, use expo-av or react-native-sound
      // This would require additional setup for mobile platforms
    }
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'text_message',
      text: text
    }));

    // Add user message to chat
    this.onMessage({
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: Date.now()
    });
  }

  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
    if (this.isConnected) {
      this.sendConfig();
    }
  }

  setLanguage(language: string): void {
    this.config.language = language;
    if (this.isConnected) {
      this.sendConfig();
    }
  }

  disconnect(): void {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get recording(): boolean {
    return this.isRecording;
  }
}

// Available Kyutai voices
export const KYUTAI_VOICES = [
  { id: 'natural-female-1', name: 'Sarah', description: 'Natural female voice, warm and friendly' },
  { id: 'natural-male-1', name: 'David', description: 'Natural male voice, clear and professional' },
  { id: 'natural-female-2', name: 'Emma', description: 'Natural female voice, energetic and expressive' },
  { id: 'natural-male-2', name: 'James', description: 'Natural male voice, deep and authoritative' },
  { id: 'natural-child-1', name: 'Alex', description: 'Natural child voice, playful and curious' }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' }
];