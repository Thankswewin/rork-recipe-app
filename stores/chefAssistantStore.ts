import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUri?: string;
  audioUri?: string;
  metadata?: {
    confidence?: number;
    detectedIngredients?: string[];
    cookingTips?: string[];
    recipeStep?: number;
  };
}

export interface CookingSession {
  id: string;
  recipeName: string;
  startTime: Date;
  currentStep: number;
  totalSteps: number;
  messages: ChatMessage[];
  isActive: boolean;
}

export interface ChefAgent {
  id: string;
  name: string;
  specialty: string;
  personality: string;
  avatar: string;
  description: string;
  isCustom: boolean;
}

interface ChefAssistantState {
  // Current session
  currentSession: CookingSession | null;
  isSessionActive: boolean;
  
  // Chat state
  messages: ChatMessage[];
  isTyping: boolean;
  
  // Camera state
  isCameraActive: boolean;
  isAnalyzing: boolean;
  lastAnalysis: any;
  
  // Voice state
  isListening: boolean;
  isRecording: boolean;
  
  // Agents
  availableAgents: ChefAgent[];
  selectedAgent: ChefAgent | null;
  
  // Settings
  language: 'en' | 'yo' | 'ig' | 'ha';
  voiceEnabled: boolean;
  cameraAnalysisEnabled: boolean;
  
  // Actions
  startSession: (recipeName: string) => void;
  endSession: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  setCameraActive: (isActive: boolean) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setListening: (isListening: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  selectAgent: (agent: ChefAgent) => void;
  updateSettings: (settings: Partial<Pick<ChefAssistantState, 'language' | 'voiceEnabled' | 'cameraAnalysisEnabled'>>) => void;
  clearMessages: () => void;
  analyzeImage: (imageUri: string) => Promise<any>;
  processVoiceCommand: (audioUri: string) => Promise<void>;
  sendMessage: (content: string, imageUri?: string) => Promise<void>;
}

const defaultAgents: ChefAgent[] = [
  {
    id: 'nigerian-chef',
    name: 'Chef Adunni',
    specialty: 'Nigerian Cuisine',
    personality: 'Warm, encouraging, traditional',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=387&q=80',
    description: 'Expert in traditional Nigerian dishes with modern techniques',
    isCustom: false,
  },
  {
    id: 'international-chef',
    name: 'Chef Marcus',
    specialty: 'International Fusion',
    personality: 'Creative, experimental, detailed',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=387&q=80',
    description: 'Specializes in fusion cuisine and innovative cooking techniques',
    isCustom: false,
  },
  {
    id: 'healthy-chef',
    name: 'Chef Kemi',
    specialty: 'Healthy & Nutritious',
    personality: 'Health-focused, informative, supportive',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=387&q=80',
    description: 'Expert in healthy cooking and nutritional guidance',
    isCustom: false,
  },
];

export const useChefAssistantStore = create<ChefAssistantState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      isSessionActive: false,
      messages: [],
      isTyping: false,
      isCameraActive: false,
      isAnalyzing: false,
      lastAnalysis: null,
      isListening: false,
      isRecording: false,
      availableAgents: defaultAgents,
      selectedAgent: defaultAgents[0],
      language: 'en',
      voiceEnabled: true,
      cameraAnalysisEnabled: true,

      // Actions
      startSession: (recipeName: string) => {
        const session: CookingSession = {
          id: Date.now().toString(),
          recipeName,
          startTime: new Date(),
          currentStep: 1,
          totalSteps: 10, // Default, can be updated
          messages: [],
          isActive: true,
        };
        
        set({
          currentSession: session,
          isSessionActive: true,
          messages: [],
        });

        // Add welcome message
        get().addMessage({
          type: 'assistant',
          content: `Hello! I'm ${get().selectedAgent?.name}. I'm here to help you cook ${recipeName}. Let's start by showing me your ingredients or tell me what step you'd like to begin with.`,
        });
      },

      endSession: () => {
        set({
          currentSession: null,
          isSessionActive: false,
          isCameraActive: false,
          isAnalyzing: false,
          isListening: false,
          isRecording: false,
        });
      },

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        set(state => ({
          messages: [...state.messages, newMessage],
          currentSession: state.currentSession ? {
            ...state.currentSession,
            messages: [...state.currentSession.messages, newMessage],
          } : null,
        }));
      },

      setTyping: (isTyping) => set({ isTyping }),
      setCameraActive: (isActive) => set({ isCameraActive: isActive }),
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setListening: (isListening) => set({ isListening }),
      setRecording: (isRecording) => set({ isRecording }),

      selectAgent: (agent) => set({ selectedAgent: agent }),

      updateSettings: (settings) => set(settings),

      clearMessages: () => set({ messages: [] }),

      analyzeImage: async (imageUri: string) => {
        set({ isAnalyzing: true });
        
        try {
          // Convert image to base64
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
            };
            reader.readAsDataURL(blob);
          });

          // Send to AI for analysis
          const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: `You are ${get().selectedAgent?.name}, a professional chef assistant. Analyze cooking images and provide helpful guidance. Focus on:
                  1. Identifying ingredients and their quality
                  2. Cooking technique assessment
                  3. Next steps or improvements
                  4. Safety considerations
                  5. Nigerian cuisine expertise when relevant
                  
                  Respond in a warm, encouraging tone with specific, actionable advice.`,
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Please analyze this cooking image and provide guidance.',
                    },
                    {
                      type: 'image',
                      image: base64,
                    },
                  ],
                },
              ],
            }),
          });

          const result = await aiResponse.json();
          const analysis = {
            confidence: 0.9,
            detectedIngredients: [], // Would be populated by more sophisticated AI
            cookingTips: [],
            guidance: result.completion,
          };

          set({ lastAnalysis: analysis, isAnalyzing: false });

          // Add AI response as message
          get().addMessage({
            type: 'assistant',
            content: result.completion,
            metadata: analysis,
          });

          return analysis;
        } catch (error) {
          console.error('Image analysis error:', error);
          set({ isAnalyzing: false });
          
          get().addMessage({
            type: 'assistant',
            content: "I'm having trouble analyzing the image right now. Could you describe what you're cooking or ask me a specific question?",
          });
          
          return null;
        }
      },

      processVoiceCommand: async (audioUri: string) => {
        set({ isListening: true });
        
        try {
          // In a real implementation, you'd use speech-to-text
          // For now, we'll simulate with a placeholder
          const transcription = "Show me how to cut onions properly";
          
          // Add user message
          get().addMessage({
            type: 'user',
            content: transcription,
            audioUri,
          });

          // Process with AI
          await get().sendMessage(transcription);
        } catch (error) {
          console.error('Voice processing error:', error);
        } finally {
          set({ isListening: false });
        }
      },

      sendMessage: async (content: string, imageUri?: string) => {
        // Add user message
        get().addMessage({
          type: 'user',
          content,
          imageUri,
        });

        set({ isTyping: true });

        try {
          const messages = [
            {
              role: 'system' as const,
              content: `You are ${get().selectedAgent?.name}, a professional chef assistant specializing in ${get().selectedAgent?.specialty}. 
              
              Your personality: ${get().selectedAgent?.personality}
              
              You are helping with cooking in real-time. Provide:
              1. Clear, step-by-step guidance
              2. Safety tips when relevant
              3. Ingredient substitutions if needed
              4. Cooking techniques and tips
              5. Encouragement and support
              
              Keep responses concise but helpful. If the user is cooking Nigerian food, incorporate traditional techniques and cultural context.
              
              Current session: ${get().currentSession?.recipeName || 'General cooking assistance'}`,
            },
            {
              role: 'user' as const,
              content: imageUri ? [
                { type: 'text' as const, text: content },
                { type: 'image' as const, image: imageUri },
              ] : content,
            },
          ];

          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
          });

          const result = await response.json();

          // Add AI response
          get().addMessage({
            type: 'assistant',
            content: result.completion,
          });
        } catch (error) {
          console.error('Send message error:', error);
          get().addMessage({
            type: 'assistant',
            content: "I'm having trouble responding right now. Please try again in a moment.",
          });
        } finally {
          set({ isTyping: false });
        }
      },
    }),
    {
      name: 'chef-assistant-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        availableAgents: state.availableAgents,
        selectedAgent: state.selectedAgent,
        language: state.language,
        voiceEnabled: state.voiceEnabled,
        cameraAnalysisEnabled: state.cameraAnalysisEnabled,
        // Don't persist active session state
      }),
    }
  )
);