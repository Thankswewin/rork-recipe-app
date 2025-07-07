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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRealtimeMode && !realtimeSessionRef.current) {
      initializeRealtimeMode();
    }
    
    return () => {
      if (realtimeSessionRef.current) {
        realtimeSessionRef.current.stop();
        realtimeSessionRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
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

    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('TTS loading timeout reached');
      setIsLoading(false);
      setError('TTS request timed out. Please try again.');
    }, 15000);

    const startTime = Date.now();

    const mergedOptions: KyutaiTTSOptions = {
      ...defaultOptions,
      ...options,
      realTime: isRealtimeMode || options.realTime,
      lowLatency: true,
      streaming: true,
      onStart: () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsSpeaking(true);
        setIsLoading(false);
        const latency = Date.now() - startTime;
        console.log(`TTS started with ${latency}ms latency`);
        options.onStart?.();
        defaultOptions.onStart?.();
      },
      onDone: () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsSpeaking(false);
        setIsLoading(false);
        const totalTime = Date.now() - startTime;
        console.log(`TTS completed in ${totalTime}ms`);
        options.onDone?.();
        defaultOptions.onDone?.();
      },
      onStopped: () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsSpeaking(false);
        setIsLoading(false);
        options.onStopped?.();
        defaultOptions.onStopped?.();
      },
      onError: (err) => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsSpeaking(false);
        setIsLoading(false);
        setError(err.message || 'TTS Error');
        console.error('TTS Error:', err);
        options.onError?.(err);
        defaultOptions.onError?.(err);
      },
      onChunk: (audioChunk) => {
        console.log('Received audio chunk for real-time playback');
        options.onChunk?.(audioChunk);
      },
    };

    try {
      if (isRealtimeMode && realtimeSessionRef.current) {
        await realtimeSessionRef.current.speak(text);
      } else {
        await ttsService.speak(text, mergedOptions);
      }
    } catch (err: any) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      const errorMessage = err.message || 'Failed to speak';
      setError(errorMessage);
      setIsSpeaking(false);
      setIsLoading(false);
      console.error('TTS speak error:', err);
    }
  }, [isSpeaking, defaultOptions, isRealtimeMode]);

  const stop = useCallback(async () => {
    try {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (realtimeSessionRef.current) {
        await realtimeSessionRef.current.stop();
      } else {
        await ttsService.stop();
      }
      setIsSpeaking(false);
      setIsLoading(false);
      setError(null);
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
    await speak(text, {
      realTime: true,
      lowLatency: true,
      streaming: true,
      voiceStyle: 'natural-female',
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