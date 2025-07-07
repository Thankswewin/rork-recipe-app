import { useState, useCallback, useRef } from 'react';
import { ttsService, KyutaiTTSOptions } from '@/lib/tts';

export interface UseTTSOptions extends KyutaiTTSOptions {
  autoStop?: boolean;
}

export const useTTS = (defaultOptions: UseTTSOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTextRef = useRef<string>('');

  const speak = useCallback(async (text: string, options: UseTTSOptions = {}) => {
    if (isSpeaking && defaultOptions.autoStop) {
      await stop();
    }

    setIsLoading(true);
    setError(null);
    currentTextRef.current = text;

    const mergedOptions: KyutaiTTSOptions = {
      ...defaultOptions,
      ...options,
      onStart: () => {
        setIsSpeaking(true);
        setIsLoading(false);
        options.onStart?.();
        defaultOptions.onStart?.();
      },
      onDone: () => {
        setIsSpeaking(false);
        setIsLoading(false);
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
    };

    try {
      await ttsService.speak(text, mergedOptions);
    } catch (err: any) {
      setError(err.message || 'Failed to speak');
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, [isSpeaking, defaultOptions]);

  const stop = useCallback(async () => {
    try {
      await ttsService.stop();
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

  return {
    speak,
    stop,
    getVoices,
    isSpeaking,
    isLoading,
    error,
    currentText: currentTextRef.current,
  };
};