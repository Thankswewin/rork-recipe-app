import { useState, useCallback, useRef, useEffect } from 'react';
import { ttsService, KyutaiTTSOptions } from '@/lib/tts';

export interface UseTTSOptions extends KyutaiTTSOptions {
  autoStop?: boolean;
  realTimeMode?: boolean;
}

export const useTTS = (defaultOptions: UseTTSOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyStats, setLatencyStats] = useState<any>(null);
  const [isRealtimeMode, setIsRealtimeMode] = useState(defaultOptions.realTimeMode || false);
  const currentTextRef = useRef<string>('');
  const realtimeSessionRef = useRef<any>(null);

  // Initialize real-time mode if requested
  useEffect(() => {
    if (isRealtimeMode && !realtimeSessionRef.current) {
      initializeRealtimeMode();
    }
    
    return () => {
      if (realtimeSessionRef.current) {
        realtimeSessionRef.current.stop();
        realtimeSessionRef.current = null;
      }
    };
  }, [isRealtimeMode]);

  const initializeRealtimeMode = async () => {
    try {
      console.log('Initializing real-time TTS mode');
      const session = await ttsService.startRealtimeConversation({
        ...defaultOptions,
        realTime: true,
        lowLatency: true,
        streaming: true,
      });
      realtimeSessionRef.current = session;
      
      // Get latency stats
      const stats = await ttsService.getLatencyStats();
      setLatencyStats(stats);
      
      console.log('Real-time TTS mode initialized', stats);
    } catch (error) {
      console.error('Failed to initialize real-time mode:', error);
      setError('Failed to initialize real-time voice mode');
    }
  };

  const speak = useCallback(async (text: string, options: UseTTSOptions = {}) => {
    if (isSpeaking && defaultOptions.autoStop) {
      await stop();
    }

    setIsLoading(true);
    setError(null);
    currentTextRef.current = text;

    const startTime = Date.now();

    const mergedOptions: KyutaiTTSOptions = {
      ...defaultOptions,
      ...options,
      realTime: isRealtimeMode || options.realTime,
      lowLatency: true, // Always use low latency for better UX
      streaming: true, // Enable streaming for faster response
      onStart: () => {
        setIsSpeaking(true);
        setIsLoading(false);
        const latency = Date.now() - startTime;
        console.log(`TTS started with ${latency}ms latency`);
        options.onStart?.();
        defaultOptions.onStart?.();
      },
      onDone: () => {
        setIsSpeaking(false);
        setIsLoading(false);
        const totalTime = Date.now() - startTime;
        console.log(`TTS completed in ${totalTime}ms`);
        options.onDone?.();
        defaultOptions.onDone?.();
      },
      onStopped: () => {
        setIsSpeaking(false);
        setIsLoading(false);
        options.onStopped?.();
        defaultOptions.onStopped?.();
      },
      onError: (err) => {
        setIsSpeaking(false);
        setIsLoading(false);
        setError(err.message || 'TTS Error');
        options.onError?.(err);
        defaultOptions.onError?.(err);
      },
      onChunk: (audioChunk) => {
        // Handle real-time audio chunks
        console.log('Received audio chunk for real-time playback');
        options.onChunk?.(audioChunk);
      },
    };

    try {
      if (isRealtimeMode && realtimeSessionRef.current) {
        // Use real-time session for ultra-low latency
        await realtimeSessionRef.current.speak(text);
      } else {
        // Use standard TTS service
        await ttsService.speak(text, mergedOptions);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to speak');
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, [isSpeaking, defaultOptions, isRealtimeMode]);

  const stop = useCallback(async () => {
    try {
      if (realtimeSessionRef.current) {
        await realtimeSessionRef.current.stop();
      } else {
        await ttsService.stop();
      }
      setIsSpeaking(false);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop');
    }
  }, []);

  const getVoices = useCallback(async () => {
    try {
      return await ttsService.getAvailableVoices();
    } catch (err: any) {
      setError(err.message || 'Failed to get voices');
      return [];
    }
  }, []);

  const toggleRealtimeMode = useCallback(async () => {
    const newMode = !isRealtimeMode;
    setIsRealtimeMode(newMode);
    
    if (newMode) {
      await initializeRealtimeMode();
    } else if (realtimeSessionRef.current) {
      await realtimeSessionRef.current.stop();
      realtimeSessionRef.current = null;
      setLatencyStats(null);
    }
  }, [isRealtimeMode]);

  const speakInstant = useCallback(async (text: string) => {
    // Ultra-fast speech for real-time interaction
    await speak(text, {
      realTime: true,
      lowLatency: true,
      streaming: true,
      voiceStyle: 'natural-female', // Use fastest voice
    });
  }, [speak]);

  return {
    speak,
    speakInstant,
    stop,
    getVoices,
    toggleRealtimeMode,
    isSpeaking,
    isLoading,
    isRealtimeMode,
    error,
    latencyStats,
    currentText: currentTextRef.current,
  };
};