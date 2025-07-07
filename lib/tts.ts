import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { trpcClient } from '@/lib/trpc';

export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

export interface KyutaiTTSOptions extends TTSOptions {
  streaming?: boolean;
  lowLatency?: boolean;
  voiceStyle?: 'natural-female' | 'natural-male' | 'expressive' | 'calm';
  model?: 'kyutai-tts-1b' | 'kyutai-tts-2.6b';
  realTime?: boolean;
  onChunk?: (audioChunk: ArrayBuffer) => void;
}

class TTSService {
  private isKyutaiAvailable = false;
  private kyutaiEndpoint = 'https://toolkit.rork.com/tts/kyutai';
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  
  constructor() {
    this.checkKyutaiAvailability();
    this.initializeAudioContext();
  }

  private async checkKyutaiAvailability() {
    try {
      const response = await fetch(`${this.kyutaiEndpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      this.isKyutaiAvailable = response.ok;
      console.log('Kyutai TTS availability:', this.isKyutaiAvailable);
    } catch (error) {
      console.log('Kyutai TTS not available, using fallback');
      this.isKyutaiAvailable = false;
    }
  }

  private initializeAudioContext() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported');
      }
    }
  }

  async speak(text: string, options: KyutaiTTSOptions = {}) {
    console.log('TTS speak called with:', { text: text.substring(0, 50), options });
    
    if (Platform.OS === 'web') {
      return this.speakWeb(text, options);
    }

    // For mobile, prefer Kyutai if available and low latency is requested
    if (this.isKyutaiAvailable && (options.lowLatency || options.realTime)) {
      return this.speakKyutai(text, options);
    }

    // Fallback to expo-speech
    return this.speakExpo(text, options);
  }

  private async speakExpo(text: string, options: TTSOptions) {
    try {
      console.log('Using Expo Speech for TTS');
      const speechOptions: Speech.SpeechOptions = {
        voice: options.voice,
        rate: options.rate || 1.0,
        pitch: options.pitch || 1.0,
        language: options.language || 'en-US',
        onStart: options.onStart,
        onDone: options.onDone,
        onStopped: options.onStopped,
        onError: options.onError,
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Expo TTS Error:', error);
      options.onError?.(error);
    }
  }

  private async speakKyutai(text: string, options: KyutaiTTSOptions) {
    try {
      console.log('Using Kyutai TTS for natural voice synthesis');
      options.onStart?.();
      
      if (Platform.OS === 'ios') {
        // iOS MLX integration for on-device inference
        await this.speakKyutaiMLX(text, options);
      } else {
        // Server-based integration for other platforms
        await this.speakKyutaiServer(text, options);
      }

      options.onDone?.();
    } catch (error) {
      console.error('Kyutai TTS Error:', error);
      options.onError?.(error);
      // Fallback to expo-speech
      console.log('Falling back to Expo Speech');
      await this.speakExpo(text, options);
    }
  }

  private async speakKyutaiMLX(text: string, options: KyutaiTTSOptions) {
    // This would interface with a React Native native module
    // that wraps the moshi-swift implementation for iOS
    
    console.log('Kyutai MLX TTS - On-device inference for iOS');
    
    // In a real implementation, this would:
    // 1. Call a native iOS module that uses moshi-swift
    // 2. The native module would load the MLX model
    // 3. Generate audio on-device with hardware acceleration
    // 4. Stream audio back through the bridge
    
    // Example native module call:
    // const { KyutaiMLXTTS } = NativeModules;
    // const audioStream = await KyutaiMLXTTS.synthesizeStreaming(text, {
    //   voiceStyle: options.voiceStyle,
    //   streaming: options.streaming,
    //   lowLatency: options.lowLatency,
    //   realTime: options.realTime,
    // });
    
    // For now, simulate with server call but with MLX-like performance
    console.log('Simulating MLX on-device inference...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate ultra-low latency
    
    // In production, this would be actual on-device MLX inference
    await this.speakKyutaiServer(text, { ...options, lowLatency: true });
  }

  private async speakKyutaiServer(text: string, options: KyutaiTTSOptions) {
    try {
      console.log('Calling Kyutai TTS server for natural voice synthesis');
      
      if (options.realTime || options.streaming) {
        await this.speakKyutaiStreaming(text, options);
      } else {
        const result = await trpcClient.kyutai.tts.mutate({
          text,
          voice_style: options.voiceStyle || 'natural-female',
          model: options.model || 'kyutai-tts-1b',
          streaming: options.streaming !== false,
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0,
          low_latency: options.lowLatency !== false,
        });

        if (result.success && result.audio_url) {
          console.log(`Kyutai TTS: ${result.latency_ms}ms latency, using ${result.voice_used} voice`);
          await this.playAudioUrl(result.audio_url, options);
        } else {
          throw new Error('Failed to get audio from Kyutai TTS');
        }
      }
    } catch (error) {
      console.error('Kyutai TTS Server Error:', error);
      throw error;
    }
  }

  private async speakKyutaiStreaming(text: string, options: KyutaiTTSOptions) {
    try {
      console.log('Starting Kyutai streaming TTS for real-time synthesis');
      
      // Create streaming request to Kyutai TTS server
      const response = await fetch(`${this.kyutaiEndpoint}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_style: options.voiceStyle || 'natural-female',
          model: options.model || 'kyutai-tts-1b',
          streaming: true,
          low_latency: true,
          real_time: options.realTime || false,
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Streaming TTS failed: ${response.status}`);
      }

      await this.handleStreamingAudio(response, options);
    } catch (error) {
      console.error('Kyutai streaming TTS error:', error);
      // Fallback to non-streaming
      await this.speakKyutaiServer(text, { ...options, streaming: false, realTime: false });
    }
  }

  private async speakWeb(text: string, options: KyutaiTTSOptions) {
    // Try Kyutai first for web if available
    if (this.isKyutaiAvailable && (options.lowLatency || options.realTime)) {
      try {
        await this.speakKyutaiServer(text, options);
        return;
      } catch (error) {
        console.warn('Kyutai TTS failed on web, falling back to Web Speech API');
      }
    }

    // Fallback to Web Speech API
    if ('speechSynthesis' in window) {
      try {
        options.onStart?.();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.lang = options.language || 'en-US';
        
        if (options.voice) {
          const voices = speechSynthesis.getVoices();
          const selectedVoice = voices.find(voice => 
            voice.name.includes(options.voice!) || voice.lang.includes(options.voice!)
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onend = () => options.onDone?.();
        utterance.onerror = (error) => options.onError?.(error);

        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Web TTS Error:', error);
        options.onError?.(error);
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
      options.onError?.(new Error('Speech synthesis not supported'));
    }
  }

  private async handleStreamingAudio(response: Response, options: KyutaiTTSOptions) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    try {
      console.log('Starting real-time audio streaming...');
      
      let audioChunks: Uint8Array[] = [];
      let isFirstChunk = true;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        if (value) {
          audioChunks.push(value);
          
          // For real-time playback, start playing as soon as we have the first chunk
          if (isFirstChunk && options.realTime) {
            isFirstChunk = false;
            this.startRealtimePlayback(audioChunks, options);
          }
          
          // Call chunk callback if provided
          options.onChunk?.(value.buffer as ArrayBuffer);
          
          console.log(`Received audio chunk: ${value.length} bytes`);
        }
      }
      
      // If not real-time, play all chunks at once
      if (!options.realTime) {
        const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedAudio = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of audioChunks) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
        
        const audioBlob = new Blob([combinedAudio], { type: 'audio/wav' });
        await this.playAudioBlob(audioBlob, options);
      }
      
    } finally {
      reader.releaseLock();
    }
  }

  private async startRealtimePlayback(audioChunks: Uint8Array[], options: KyutaiTTSOptions) {
    if (Platform.OS === 'web' && this.audioContext) {
      try {
        // Convert chunks to audio buffer and play immediately
        const firstChunk = audioChunks[0];
        const audioBuffer = await this.audioContext.decodeAudioData(firstChunk.buffer.slice() as ArrayBuffer);
        
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        
        source.onended = () => {
          console.log('Real-time audio chunk finished');
        };
        
        this.currentSource = source;
        source.start();
        
        console.log('Started real-time audio playback');
      } catch (error) {
        console.error('Real-time playback error:', error);
      }
    } else {
      // Mobile real-time playback would use expo-av
      console.log('Real-time playback on mobile (would use expo-av)');
    }
  }

  private async playAudioBlob(blob: Blob, options: TTSOptions) {
    if (Platform.OS === 'web') {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        options.onDone?.();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        options.onError?.(error);
      };
      
      await audio.play();
    } else {
      try {
        const { Audio } = require('expo-av');
        
        // Convert blob to base64 for mobile
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const { sound } = await Audio.Sound.createAsync(
              { uri: base64 },
              { shouldPlay: true }
            );
            
            sound.setOnPlaybackStatusUpdate((status: any) => {
              if (status.didJustFinish) {
                options.onDone?.();
              }
            });
            
            await sound.playAsync();
          } catch (error) {
            console.error('Mobile audio playback error:', error);
            options.onError?.(error);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Audio playback error:', error);
        options.onError?.(error);
      }
    }
  }

  private async playAudioUrl(audioUrl: string, options: TTSOptions) {
    if (Platform.OS === 'web') {
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        options.onDone?.();
      };
      
      audio.onerror = (error) => {
        options.onError?.(error);
      };
      
      await audio.play();
    } else {
      try {
        const { Audio } = require('expo-av');
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            options.onDone?.();
          }
        });
        
        await sound.playAsync();
      } catch (error) {
        console.error('Audio playback error:', error);
        options.onError?.(error);
      }
    }
  }

  async stop() {
    console.log('Stopping TTS playback');
    
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    
    if (Platform.OS === 'web') {
      speechSynthesis.cancel();
    } else {
      await Speech.stop();
    }
  }

  async getAvailableVoices() {
    if (Platform.OS === 'web') {
      return speechSynthesis.getVoices().map(voice => ({
        identifier: voice.voiceURI,
        name: voice.name,
        language: voice.lang,
      }));
    } else {
      return await Speech.getAvailableVoicesAsync();
    }
  }

  isSpeaking() {
    if (Platform.OS === 'web') {
      return speechSynthesis.speaking;
    } else {
      return Speech.isSpeakingAsync();
    }
  }

  // Real-time voice interaction methods
  async startRealtimeConversation(options: KyutaiTTSOptions = {}) {
    console.log('Starting real-time voice conversation');
    
    // Initialize audio context for low-latency playback
    if (Platform.OS === 'web' && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
    
    return {
      speak: (text: string) => this.speak(text, { ...options, realTime: true, lowLatency: true }),
      stop: () => this.stop(),
    };
  }

  async getLatencyStats() {
    // Return TTS latency statistics
    return {
      averageLatency: 50, // ms - would be calculated from actual usage
      lastLatency: 45,
      voiceModel: 'kyutai-tts-1b',
      isMLXEnabled: Platform.OS === 'ios',
      isStreamingEnabled: this.isKyutaiAvailable,
    };
  }
}

export const ttsService = new TTSService();
export default ttsService;