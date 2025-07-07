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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  private config: VoiceConfig = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    voiceId: 'natural-female-1',
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

      // For demo purposes, simulate connection to Kyutai
      // In production, this would connect to actual Kyutai WebSocket endpoint
      await this.simulateKyutaiConnection();

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onStatusChange('error');
      throw error;
    }
  }

  private async simulateKyutaiConnection(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.isConnected = true;
    this.onStatusChange('connected');
    
    console.log('Connected to Kyutai Voice Chat (simulated)');
  }

  private sendConfig(): void {
    // In production, this would send config to Kyutai WebSocket
    console.log('Sending voice config:', this.config);
  }

  private async handleWebSocketMessage(event: MessageEvent): Promise<void> {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'transcription':
          this.onMessage({
            id: Date.now().toString(),
            type: 'user',
            text: data.text,
            timestamp: Date.now()
          });
          break;

        case 'ai_response':
          this.onMessage({
            id: Date.now().toString(),
            type: 'assistant',
            text: data.text,
            timestamp: Date.now()
          });
          break;

        case 'audio_chunk':
          await this.playAudioChunk(data.audio);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || !this.isConnected) return;

    try {
      if (Platform.OS === 'web') {
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
          if (event.data.size > 0) {
            this.processAudioChunk(event.data);
          }
        };

        this.mediaRecorder.start(100);
        this.isRecording = true;
      } else {
        // For mobile, would use expo-av or react-native-audio-record
        this.isRecording = true;
        console.log('Started recording on mobile (simulated)');
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  private processAudioChunk(audioData: Blob): void {
    // In production, this would send audio to Kyutai for real-time processing
    console.log('Processing audio chunk:', audioData.size, 'bytes');
    
    // Simulate real-time transcription
    setTimeout(() => {
      if (this.isRecording) {
        // Simulate receiving transcription
        this.simulateTranscription();
      }
    }, 500);
  }

  private simulateTranscription(): void {
    const sampleTranscriptions = [
      "Hello, how are you today?",
      "Can you help me with something?",
      "What's the weather like?",
      "Tell me a joke",
      "How does this work?"
    ];
    
    const randomText = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
    
    this.onMessage({
      id: Date.now().toString(),
      type: 'user',
      text: randomText,
      timestamp: Date.now()
    });

    // Simulate AI response
    setTimeout(() => {
      this.simulateAIResponse(randomText);
    }, 800);
  }

  private simulateAIResponse(userText: string): void {
    const responses = [
      "I'm doing great, thank you for asking! How can I help you today?",
      "Of course! I'd be happy to help you with whatever you need.",
      "I don't have access to real-time weather data, but you can check your local weather app.",
      "Why don't scientists trust atoms? Because they make up everything!",
      "This is a demonstration of Kyutai's real-time voice technology. You can speak naturally and I'll respond with natural-sounding speech."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    this.onMessage({
      id: Date.now().toString(),
      type: 'assistant',
      text: response,
      timestamp: Date.now()
    });
  }

  stopRecording(): void {
    if (!this.isRecording) return;

    if (this.mediaRecorder && Platform.OS === 'web') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    this.isRecording = false;
    console.log('Stopped recording');
  }

  private async playAudioChunk(audioData: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const binaryData = atob(audioData);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }

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
    }
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.isConnected) return;

    // Add user message
    this.onMessage({
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: Date.now()
    });

    // Simulate AI response
    setTimeout(() => {
      this.simulateAIResponse(text);
    }, 1000);
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
    this.onStatusChange('disconnected');
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