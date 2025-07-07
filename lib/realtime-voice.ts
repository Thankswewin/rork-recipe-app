import { Platform } from 'react-native';
import { DebugLog } from '@/stores/voiceChatStore';

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
  private speechRecognition: any = null;

  private config: VoiceConfig = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    voiceId: 'natural-female-1',
    language: 'en-US'
  };

  constructor(
    private onMessage: (message: VoiceMessage) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void,
    private onDebugLog: (log: Omit<DebugLog, 'timestamp'>) => void
  ) {
    this.onDebugLog({
      level: 'info',
      message: 'RealtimeVoiceChat instance created',
      data: { platform: Platform.OS }
    });
  }

  async connect(): Promise<void> {
    try {
      this.onDebugLog({
        level: 'info',
        message: 'Initializing voice chat connection...'
      });

      this.onStatusChange('connecting');
      
      // Initialize audio context for web
      if (Platform.OS === 'web') {
        this.onDebugLog({
          level: 'info',
          message: 'Initializing Web Audio Context...'
        });

        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          this.onDebugLog({
            level: 'success',
            message: 'Audio context initialized',
            data: { sampleRate: this.audioContext.sampleRate }
          });
        } catch (error) {
          this.onDebugLog({
            level: 'error',
            message: 'Failed to initialize audio context',
            data: error
          });
        }

        // Initialize speech recognition
        this.initializeSpeechRecognition();
      }

      // Test connection to AI service
      await this.testAIConnection();

      this.isConnected = true;
      this.onStatusChange('connected');

    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to connect to voice service',
        data: error instanceof Error ? error.message : String(error)
      });
      this.onStatusChange('error');
      throw error;
    }
  }

  private initializeSpeechRecognition(): void {
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      this.onDebugLog({
        level: 'info',
        message: 'Initializing Web Speech Recognition...'
      });

      try {
        this.speechRecognition = new (window as any).webkitSpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = this.config.language;

        this.speechRecognition.onstart = () => {
          this.onDebugLog({
            level: 'success',
            message: 'Speech recognition started'
          });
        };

        this.speechRecognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          this.onDebugLog({
            level: 'success',
            message: 'Speech recognized',
            data: { transcript, confidence }
          });

          this.processTranscription(transcript);
        };

        this.speechRecognition.onerror = (event: any) => {
          this.onDebugLog({
            level: 'error',
            message: 'Speech recognition error',
            data: { error: event.error, message: event.message }
          });
        };

        this.speechRecognition.onend = () => {
          this.onDebugLog({
            level: 'info',
            message: 'Speech recognition ended'
          });
        };

        this.onDebugLog({
          level: 'success',
          message: 'Speech recognition initialized successfully'
        });
      } catch (error) {
        this.onDebugLog({
          level: 'error',
          message: 'Failed to initialize speech recognition',
          data: error
        });
      }
    } else {
      this.onDebugLog({
        level: 'warn',
        message: 'Speech recognition not available on this platform'
      });
    }
  }

  private async testAIConnection(): Promise<void> {
    this.onDebugLog({
      level: 'info',
      message: 'Testing AI service connection...'
    });

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
              content: 'You are a helpful voice assistant. Respond with just "Connection test successful" to confirm the connection.'
            },
            {
              role: 'user',
              content: 'Test connection'
            }
          ]
        })
      });

      this.onDebugLog({
        level: 'info',
        message: 'AI service response received',
        data: { 
          status: response.status, 
          statusText: response.statusText,
          ok: response.ok 
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.onDebugLog({
          level: 'success',
          message: 'AI service connection successful',
          data: { response: data.completion }
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'AI service connection failed',
        data: error instanceof Error ? error.message : String(error)
      });
      throw error;
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
      this.audioChunks = [];
      this.recordingStartTime = Date.now();

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
    this.onDebugLog({
      level: 'info',
      message: 'Requesting microphone access...'
    });

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

      this.onDebugLog({
        level: 'success',
        message: 'Microphone access granted',
        data: { 
          tracks: stream.getAudioTracks().length,
          settings: stream.getAudioTracks()[0]?.getSettings()
        }
      });

      // Use speech recognition if available, otherwise use MediaRecorder
      if (this.speechRecognition) {
        this.onDebugLog({
          level: 'info',
          message: 'Using Web Speech Recognition for transcription'
        });
        this.speechRecognition.start();
      } else {
        this.onDebugLog({
          level: 'info',
          message: 'Using MediaRecorder for audio capture'
        });
        await this.setupMediaRecorder(stream);
      }

    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to access microphone',
        data: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async setupMediaRecorder(stream: MediaStream): Promise<void> {
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.onDebugLog({
        level: 'info',
        message: 'Setting up MediaRecorder',
        data: { mimeType, isSupported: !!mimeType }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.onDebugLog({
            level: 'info',
            message: 'Audio chunk received',
            data: { size: event.data.size, totalChunks: this.audioChunks.length }
          });
        }
      };

      this.mediaRecorder.onstop = () => {
        this.onDebugLog({
          level: 'info',
          message: 'MediaRecorder stopped, processing audio...'
        });
        this.processRecordingComplete();
      };

      this.mediaRecorder.onerror = (event) => {
        this.onDebugLog({
          level: 'error',
          message: 'MediaRecorder error',
          data: event
        });
      };

      this.mediaRecorder.start();
      this.onDebugLog({
        level: 'success',
        message: 'MediaRecorder started'
      });

    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to setup MediaRecorder',
        data: error
      });
      throw error;
    }
  }

  private async startMobileRecording(): Promise<void> {
    this.onDebugLog({
      level: 'info',
      message: 'Starting mobile recording (simulation)'
    });

    // For mobile, we'll simulate recording and use a placeholder transcription
    setTimeout(() => {
      this.onDebugLog({
        level: 'info',
        message: 'Mobile recording simulation - generating placeholder transcription'
      });
      this.processTranscription("Hello, this is a test message from mobile recording");
    }, 2000);
  }

  private async processRecordingComplete(): Promise<void> {
    this.onDebugLog({
      level: 'info',
      message: 'Processing completed recording...',
      data: { audioChunks: this.audioChunks.length }
    });

    if (this.audioChunks.length === 0) {
      this.onDebugLog({
        level: 'warn',
        message: 'No audio chunks to process'
      });
      return;
    }

    try {
      // For now, use a placeholder transcription since we don't have a real transcription service
      const placeholderTranscription = "I spoke something but transcription is not fully implemented yet";
      this.onDebugLog({
        level: 'info',
        message: 'Using placeholder transcription (real transcription service not implemented)'
      });
      
      this.processTranscription(placeholderTranscription);
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Error processing recording',
        data: error
      });
    }
  }

  private async processTranscription(transcription: string): Promise<void> {
    if (!transcription || transcription.trim().length === 0) {
      this.onDebugLog({
        level: 'warn',
        message: 'Empty transcription received'
      });
      return;
    }

    this.onDebugLog({
      level: 'success',
      message: 'Processing transcription',
      data: { text: transcription, length: transcription.length }
    });

    // Add user message
    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: transcription,
      timestamp: Date.now()
    };

    this.onMessage(userMessage);

    // Get AI response
    await this.getAIResponse(transcription);
  }

  private async getAIResponse(userText: string): Promise<void> {
    this.onDebugLog({
      level: 'info',
      message: 'Requesting AI response...',
      data: { userText: userText.substring(0, 100) }
    });

    try {
      const requestBody = {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful voice assistant. Respond naturally and conversationally in 1-2 sentences. Be friendly and engaging.'
          },
          {
            role: 'user',
            content: userText
          }
        ]
      };

      this.onDebugLog({
        level: 'info',
        message: 'Sending request to AI service...',
        data: { url: 'https://toolkit.rork.com/text/llm/', method: 'POST' }
      });

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      this.onDebugLog({
        level: 'info',
        message: 'AI service response received',
        data: { 
          status: response.status, 
          statusText: response.statusText,
          ok: response.ok 
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        this.onDebugLog({
          level: 'success',
          message: 'AI response processed successfully',
          data: { 
            responseLength: data.completion?.length || 0,
            response: data.completion?.substring(0, 100) + (data.completion?.length > 100 ? '...' : '')
          }
        });

        const assistantMessage: VoiceMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          text: data.completion,
          timestamp: Date.now()
        };

        this.onMessage(assistantMessage);

        // Synthesize speech for the response
        await this.synthesizeSpeech(data.completion);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.onDebugLog({
        level: 'error',
        message: 'Failed to get AI response',
        data: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback response
      const fallbackMessage: VoiceMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        text: "I heard you, but I'm having trouble processing your request right now. Please try again.",
        timestamp: Date.now()
      };

      this.onMessage(fallbackMessage);
    }
  }

  private async synthesizeSpeech(text: string): Promise<void> {
    this.onDebugLog({
      level: 'info',
      message: 'Synthesizing speech...',
      data: { text: text.substring(0, 50), platform: Platform.OS }
    });

    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a natural voice
        const voices = speechSynthesis.getVoices();
        this.onDebugLog({
          level: 'info',
          message: 'Available voices',
          data: { count: voices.length, voices: voices.slice(0, 5).map(v => v.name) }
        });

        const preferredVoice = voices.find(voice => 
          voice.name.includes('Natural') || 
          voice.name.includes('Enhanced') ||
          voice.lang.startsWith(this.config.language.split('-')[0])
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          this.onDebugLog({
            level: 'success',
            message: 'Using preferred voice',
            data: { voiceName: preferredVoice.name, lang: preferredVoice.lang }
          });
        }

        utterance.onstart = () => {
          this.onDebugLog({
            level: 'success',
            message: 'Speech synthesis started'
          });
        };

        utterance.onend = () => {
          this.onDebugLog({
            level: 'success',
            message: 'Speech synthesis completed'
          });
        };

        utterance.onerror = (event) => {
          this.onDebugLog({
            level: 'error',
            message: 'Speech synthesis error',
            data: event.error
          });
        };

        speechSynthesis.speak(utterance);
      } catch (error) {
        this.onDebugLog({
          level: 'error',
          message: 'Failed to synthesize speech',
          data: error
        });
      }
    } else {
      this.onDebugLog({
        level: 'warn',
        message: 'Speech synthesis not available on this platform'
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

    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    if (Platform.OS === 'web') {
      if (this.speechRecognition) {
        try {
          this.speechRecognition.stop();
          this.onDebugLog({
            level: 'info',
            message: 'Speech recognition stopped'
          });
        } catch (error) {
          this.onDebugLog({
            level: 'error',
            message: 'Error stopping speech recognition',
            data: error
          });
        }
      }

      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.stop();
          this.mediaRecorder.stream.getTracks().forEach(track => {
            track.stop();
            this.onDebugLog({
              level: 'info',
              message: 'Audio track stopped',
              data: { trackKind: track.kind, trackLabel: track.label }
            });
          });
        } catch (error) {
          this.onDebugLog({
            level: 'error',
            message: 'Error stopping media recorder',
            data: error
          });
        }
      }
    }
    
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

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: Date.now()
    };

    this.onMessage(userMessage);
    await this.getAIResponse(text);
  }

  setVoice(voiceId: string): void {
    this.onDebugLog({
      level: 'info',
      message: 'Voice changed',
      data: { from: this.config.voiceId, to: voiceId }
    });
    this.config.voiceId = voiceId;
  }

  setLanguage(language: string): void {
    this.onDebugLog({
      level: 'info',
      message: 'Language changed',
      data: { from: this.config.language, to: language }
    });
    this.config.language = language;
    
    if (this.speechRecognition) {
      this.speechRecognition.lang = language;
    }
  }

  disconnect(): void {
    this.onDebugLog({
      level: 'info',
      message: 'Disconnecting voice chat...'
    });

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
    this.speechRecognition = null;
    
    this.onStatusChange('disconnected');
    this.onDebugLog({
      level: 'success',
      message: 'Voice chat disconnected successfully'
    });
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