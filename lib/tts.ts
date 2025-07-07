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
}

class TTSService {
  private isKyutaiAvailable = false;
  private kyutaiEndpoint = 'https://toolkit.rork.com/tts/kyutai'; // Using your existing toolkit endpoint
  
  constructor() {
    this.checkKyutaiAvailability();
  }

  private async checkKyutaiAvailability() {
    try {
      // Check if Kyutai TTS service is available
      const response = await fetch(`${this.kyutaiEndpoint}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      this.isKyutaiAvailable = response.ok;
    } catch (error) {
      console.log('Kyutai TTS not available, using fallback');
      this.isKyutaiAvailable = false;
    }
  }

  async speak(text: string, options: KyutaiTTSOptions = {}) {
    if (Platform.OS === 'web') {
      return this.speakWeb(text, options);
    }

    // For mobile, prefer Kyutai if available and low latency is requested
    if (this.isKyutaiAvailable && options.lowLatency) {
      return this.speakKyutai(text, options);
    }

    // Fallback to expo-speech
    return this.speakExpo(text, options);
  }

  private async speakExpo(text: string, options: TTSOptions) {
    try {
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
      console.error('TTS Error:', error);
      options.onError?.(error);
    }
  }

  private async speakKyutai(text: string, options: KyutaiTTSOptions) {
    try {
      options.onStart?.();
      
      // For iOS integration with Kyutai MLX:
      // 1. This would call a native module that interfaces with moshi-swift
      // 2. The native module would handle MLX model loading and inference
      // 3. Audio would be streamed back through the bridge
      
      if (Platform.OS === 'ios') {
        // iOS MLX integration (when available)
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
      await this.speakExpo(text, options);
    }
  }

  private async speakKyutaiMLX(text: string, options: KyutaiTTSOptions) {
    // This would interface with a React Native native module
    // that wraps the moshi-swift implementation
    
    // Example native module call:
    // const { KyutaiTTS } = NativeModules;
    // const audioData = await KyutaiTTS.synthesize(text, {
    //   streaming: options.streaming,
    //   rate: options.rate,
    //   pitch: options.pitch,
    // });
    
    console.log('MLX TTS would be called here for iOS');
    
    // For now, simulate with a delay and fallback
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('MLX integration not yet implemented');
  }

  private async speakKyutaiServer(text: string, options: KyutaiTTSOptions) {
    try {
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
    } catch (error) {
      console.error('Kyutai TTS Server Error:', error);
      throw error;
    }
  }

  private async speakWeb(text: string, options: TTSOptions) {
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
    // Handle streaming audio chunks from Kyutai
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    try {
      // This would implement actual streaming audio playback
      // For now, we'll simulate the streaming behavior
      console.log('Starting streaming audio playback...');
      
      let audioChunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        if (value) {
          audioChunks.push(value);
          // In a real implementation, you'd start playing audio
          // as soon as the first chunks arrive
          console.log(`Received audio chunk: ${value.length} bytes`);
        }
      }
      
      // Combine all chunks and play
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioChunks) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Convert to blob and play
      const audioBlob = new Blob([combinedAudio], { type: 'audio/wav' });
      await this.playAudioBlob(audioBlob, options);
      
    } finally {
      reader.releaseLock();
    }
  }

  private async playAudioBlob(blob: Blob, options: TTSOptions) {
    // Play the audio blob using expo-av or Web Audio API
    if (Platform.OS === 'web') {
      // Web implementation
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
      // Mobile implementation would use expo-av
      // const { Audio } = require('expo-av');
      // const { sound } = await Audio.Sound.createAsync({ uri: blobUri });
      // await sound.playAsync();
      
      console.log('Would play audio blob on mobile using expo-av');
      
      // Simulate playback
      setTimeout(() => {
        options.onDone?.();
      }, 2000);
    }
  }

  private async playAudioUrl(audioUrl: string, options: TTSOptions) {
    if (Platform.OS === 'web') {
      // Web implementation
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        options.onDone?.();
      };
      
      audio.onerror = (error) => {
        options.onError?.(error);
      };
      
      await audio.play();
    } else {
      // Mobile implementation using expo-av
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
}

export const ttsService = new TTSService();
export default ttsService;