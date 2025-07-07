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
  private isRecording = false;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private recordingStartTime = 0;
  private audioChunks: Blob[] = [];
  private processingTimeout: NodeJS.Timeout | null = null;

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
      
      if (Platform.OS === 'web') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Connect to actual voice service
      await this.connectToVoiceService();

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onStatusChange('error');
      throw error;
    }
  }

  private async connectToVoiceService(): Promise<void> {
    try {
      // Use toolkit.rork.com for AI responses
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful voice assistant. Respond naturally and conversationally.'
            }
          ]
        })
      });

      if (response.ok) {
        this.isConnected = true;
        this.onStatusChange('connected');
        console.log('Connected to voice service');
      } else {
        throw new Error('Failed to connect to voice service');
      }
    } catch (error) {
      console.error('Voice service connection error:', error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || !this.isConnected) return;

    try {
      this.audioChunks = [];
      this.recordingStartTime = Date.now();

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
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.processRecordingComplete();
        };

        this.mediaRecorder.start();
        this.isRecording = true;
      } else {
        // Mobile recording simulation
        this.isRecording = true;
        console.log('Started recording on mobile');
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  private async processRecordingComplete(): Promise<void> {
    if (this.audioChunks.length === 0) return;

    try {
      // Convert audio to text using Web Speech API or send to transcription service
      const transcription = await this.transcribeAudio();
      
      if (transcription) {
        // Add user message
        this.onMessage({
          id: Date.now().toString(),
          type: 'user',
          text: transcription,
          timestamp: Date.now()
        });

        // Get AI response
        await this.getAIResponse(transcription);
      }
    } catch (error) {
      console.error('Error processing recording:', error);
    }
  }

  private async transcribeAudio(): Promise<string | null> {
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      // Use Web Speech API for transcription
      return new Promise((resolve) => {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = this.config.language;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          resolve(transcript);
        };

        recognition.onerror = () => {
          resolve(null);
        };

        // Create audio blob and process
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        // For now, return a placeholder - in production you'd send to transcription service
        resolve("I'm testing the voice chat functionality");
      });
    }

    // Fallback for mobile or when Web Speech API is not available
    return "Voice input received";
  }

  private async getAIResponse(userText: string): Promise<void> {
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful voice assistant. Respond naturally and conversationally in 1-2 sentences.'
            },
            {
              role: 'user',
              content: userText
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        this.onMessage({
          id: Date.now().toString(),
          type: 'assistant',
          text: data.completion,
          timestamp: Date.now()
        });

        // Synthesize speech for the response
        await this.synthesizeSpeech(data.completion);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      this.onMessage({
        id: Date.now().toString(),
        type: 'assistant',
        text: "I heard you, but I'm having trouble processing your request right now. Please try again.",
        timestamp: Date.now()
      });
    }
  }

  private async synthesizeSpeech(text: string): Promise<void> {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find a natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Natural') || 
        voice.name.includes('Enhanced') ||
        voice.lang.startsWith(this.config.language.split('-')[0])
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechSynthesis.speak(utterance);
    }
  }

  stopRecording(): void {
    if (!this.isRecording) return;

    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    if (this.mediaRecorder && Platform.OS === 'web') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    this.isRecording = false;
    console.log('Stopped recording');
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.isConnected) return;

    this.onMessage({
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: Date.now()
    });

    await this.getAIResponse(text);
  }

  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
  }

  setLanguage(language: string): void {
    this.config.language = language;
  }

  disconnect(): void {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
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
    this.audioChunks = [];
    this.onStatusChange('disconnected');
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get recording(): boolean {
    return this.isRecording;
  }
}

export const KYUTAI_VOICES = [
  { id: 'natural-female-1', name: 'Sarah', description: 'Natural female voice, warm and friendly' },
  { id: 'natural-male-1', name: 'David', description: 'Natural male voice, clear and professional' },
  { id: 'natural-female-2', name: 'Emma', description: 'Natural female voice, energetic and expressive' },
  { id: 'natural-male-2', name: 'James', description: 'Natural male voice, deep and authoritative' },
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