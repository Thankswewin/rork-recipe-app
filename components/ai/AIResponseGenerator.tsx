import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@/hooks/useTheme';

interface Chef {
  id: string;
  name: string;
  specialty: string;
  specialties: string[];
  avatar: string;
  description: string;
  personality: string;
  rating?: number;
  isCustom?: boolean;
}

interface Message {
  id: string;
  type: 'text' | 'voice' | 'image' | 'video';
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: {
    duration?: number;
    analysis?: string;
    transcription?: string;
  };
}

interface AIResponseGeneratorProps {
  chef: Chef;
  messages: Message[];
  userMessage: string;
  imageAnalysis?: string;
  onResponse: (response: string, audioUri?: string) => void;
  onError: (error: string) => void;
  enableVoice?: boolean;
  unmuteEndpoint?: string;
  aiEndpoint?: string;
}

interface AIResponse {
  text: string;
  voice_enabled: boolean;
  audio_url?: string;
  suggestions?: string[];
  recipe_context?: {
    ingredients?: string[];
    steps?: string[];
    tips?: string[];
  };
}

export function AIResponseGenerator({
  chef,
  messages,
  userMessage,
  imageAnalysis,
  onResponse,
  onError,
  enableVoice = true,
  unmuteEndpoint = 'http://localhost:8080',
  aiEndpoint = 'http://localhost:3000/api/chat',
}: AIResponseGeneratorProps) {
  const { colors } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (userMessage.trim()) {
      generateResponse();
    }

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [userMessage, imageAnalysis]);

  const generateResponse = async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      abortController.current = new AbortController();

      // Prepare conversation context
      const conversationContext = messages.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
        type: msg.type,
        metadata: msg.metadata,
      }));

      // Prepare chef personality context
        const chefContext = {
          name: chef.name,
          personality: chef.personality,
          specialties: chef.specialties,
          style: chef.personality || 'helpful and knowledgeable',
          traits: ['helpful', 'knowledgeable'],
        };

      // Prepare request payload
      const requestPayload = {
        message: userMessage,
        chef_context: chefContext,
        conversation_history: conversationContext,
        image_analysis: imageAnalysis,
        enable_voice: enableVoice,
        voice_settings: {
          personality: chef.personality || 'friendly',
          speed: 1.0,
          pitch: 1.0,
          emotion: 'helpful',
        },
        response_format: {
          include_suggestions: true,
          include_recipe_context: true,
          max_length: 500,
        },
      };

      // Generate AI response
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error(`AI response failed: ${response.statusText}`);
      }

      const aiResponse: AIResponse = await response.json();

      if (!aiResponse.text) {
        throw new Error('Empty response from AI service');
      }

      // Generate voice if enabled and requested
      let audioUri: string | undefined;
      if (enableVoice && aiResponse.voice_enabled) {
        audioUri = await generateVoiceResponse(aiResponse.text, chefContext);
      }

      // Call the response callback
      onResponse(aiResponse.text, audioUri);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error('AI response generation failed:', error);
      onError(error.message || 'Failed to generate AI response');
    } finally {
      setIsGenerating(false);
      abortController.current = null;
    }
  };

  const generateVoiceResponse = async (
    text: string,
    chefContext: any
  ): Promise<string | undefined> => {
    try {
      setIsGeneratingVoice(true);

      // Prepare voice generation request
      const voicePayload = {
        text: text,
        voice_profile: {
          name: chefContext.name,
          personality: chefContext.personality || 'friendly',
          traits: chefContext.traits,
          accent: 'neutral', // Can be customized per chef
          gender: 'neutral', // Can be customized per chef
          age: 'adult',
        },
        audio_settings: {
          format: 'mp3',
          quality: 'high',
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
        },
        processing_options: {
          add_pauses: true,
          emphasize_keywords: true,
          cooking_context: true,
        },
      };

      // Send to unmute.sh service for voice synthesis
      const voiceResponse = await fetch(`${unmuteEndpoint}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voicePayload),
      });

      if (!voiceResponse.ok) {
        throw new Error(`Voice synthesis failed: ${voiceResponse.statusText}`);
      }

      // Check if response is audio or JSON with audio URL
      const contentType = voiceResponse.headers.get('content-type');
      
      if (contentType?.includes('audio/')) {
        // Direct audio response
        const audioBlob = await voiceResponse.blob();
        const audioUri = await saveAudioToFile(audioBlob);
        return audioUri;
      } else {
        // JSON response with audio URL or base64
        const voiceResult = await voiceResponse.json();
        
        if (voiceResult.audio_url) {
          // Download audio from URL
          const audioResponse = await fetch(voiceResult.audio_url);
          const audioBlob = await audioResponse.blob();
          const audioUri = await saveAudioToFile(audioBlob);
          return audioUri;
        } else if (voiceResult.audio_data) {
          // Base64 audio data
          const audioUri = await saveBase64Audio(voiceResult.audio_data);
          return audioUri;
        }
      }

      throw new Error('No audio data received from voice service');

    } catch (error: any) {
      console.error('Voice generation failed:', error);
      // Don't throw error for voice generation failure, just log it
      // The text response should still be delivered
      return undefined;
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const saveAudioToFile = async (audioBlob: Blob): Promise<string> => {
    try {
      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:audio/mp3;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      return await saveBase64Audio(base64Audio);
    } catch (error) {
      console.error('Failed to save audio blob:', error);
      throw error;
    }
  };

  const saveBase64Audio = async (base64Audio: string): Promise<string> => {
    try {
      const fileName = `ai_response_${Date.now()}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return fileUri;
    } catch (error) {
      console.error('Failed to save base64 audio:', error);
      throw error;
    }
  };

  const cancelGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  // This component doesn't render anything visible
  // It's a utility component that handles AI response generation
  return null;
}

// Hook for using AI response generation
export function useAIResponseGenerator({
  chef,
  messages,
  enableVoice = true,
  unmuteEndpoint = 'http://localhost:8080',
  aiEndpoint = 'http://localhost:3000/api/chat',
}: {
  chef: Chef;
  messages: Message[];
  enableVoice?: boolean;
  unmuteEndpoint?: string;
  aiEndpoint?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatorRef = useRef<any>(null);

  const generateResponse = async (
    userMessage: string,
    imageAnalysis?: string
  ): Promise<{ text: string; audioUri?: string }> => {
    return new Promise((resolve, reject) => {
      const handleResponse = (text: string, audioUri?: string) => {
        resolve({ text, audioUri });
      };

      const handleError = (errorMessage: string) => {
        setError(errorMessage);
        reject(new Error(errorMessage));
      };

      // Create a temporary generator component
      generatorRef.current = (
        <AIResponseGenerator
          chef={chef}
          messages={messages}
          userMessage={userMessage}
          imageAnalysis={imageAnalysis}
          onResponse={handleResponse}
          onError={handleError}
          enableVoice={enableVoice}
          unmuteEndpoint={unmuteEndpoint}
          aiEndpoint={aiEndpoint}
        />
      );
    });
  };

  const clearError = () => {
    setError(null);
  };

  return {
    generateResponse,
    isGenerating,
    isGeneratingVoice,
    error,
    clearError,
    generator: generatorRef.current,
  };
}

// Utility functions for AI response processing
export const AIResponseUtils = {
  // Extract recipe information from AI response
  extractRecipeInfo: (response: string) => {
    const recipePatterns = {
      ingredients: /(?:ingredients?|you'?ll need|required):[\s\n]*([^\n]*(?:\n[^\n]*)*?)(?=\n\n|steps?|instructions?|method|$)/i,
      steps: /(?:steps?|instructions?|method|directions?):[\s\n]*([^\n]*(?:\n[^\n]*)*?)(?=\n\n|tips?|notes?|$)/i,
      tips: /(?:tips?|notes?|suggestions?):[\s\n]*([^\n]*(?:\n[^\n]*)*?)(?=\n\n|$)/i,
    };

    const extracted: any = {};
    
    Object.entries(recipePatterns).forEach(([key, pattern]) => {
      const match = response.match(pattern);
      if (match && match[1]) {
        extracted[key] = match[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    });

    return extracted;
  },

  // Format response for better readability
  formatResponse: (response: string) => {
    return response
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2'); // Ensure proper spacing
  },

  // Extract cooking time estimates
  extractTimeEstimates: (response: string) => {
    const timePatterns = [
      /(?:prep time|preparation)[:\s]*([0-9]+)\s*(?:min|minutes?|hrs?|hours?)/i,
      /(?:cook time|cooking)[:\s]*([0-9]+)\s*(?:min|minutes?|hrs?|hours?)/i,
      /(?:total time)[:\s]*([0-9]+)\s*(?:min|minutes?|hrs?|hours?)/i,
    ];

    const times: any = {};
    const labels = ['prep', 'cook', 'total'];

    timePatterns.forEach((pattern, index) => {
      const match = response.match(pattern);
      if (match && match[1]) {
        times[labels[index]] = parseInt(match[1]);
      }
    });

    return times;
  },

  // Extract difficulty level
  extractDifficulty: (response: string) => {
    const difficultyPatterns = [
      /(?:difficulty|level)[:\s]*(easy|medium|hard|beginner|intermediate|advanced)/i,
      /(?:this is|it's)\s*(?:an?\s*)?(easy|medium|hard|simple|complex|difficult)/i,
    ];

    for (const pattern of difficultyPatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const level = match[1].toLowerCase();
        if (['easy', 'simple', 'beginner'].includes(level)) return 'easy';
        if (['medium', 'intermediate'].includes(level)) return 'medium';
        if (['hard', 'difficult', 'complex', 'advanced'].includes(level)) return 'hard';
      }
    }

    return null;
  },
};

const styles = StyleSheet.create({
  // No styles needed for this utility component
});