import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, ChatSession, Message, UserProfile, CustomAgent, TrainingVideo, CookingSession, Agent } from "@/types";
import { agents } from "@/constants/agents";
import { nanoid } from "@/utils/helpers";
import { CancellationToken } from "@/utils/gemma";

const initialState: AppState = {
  currentAgent: null,
  currentRecipe: null,
  chatSessions: {},
  activeChatId: null,
  cameraActive: false,
  isRecording: false,
  preferences: {
    darkMode: true,
    language: "en",
    voiceEnabled: true,
    cameraEnabled: true,
    notificationsEnabled: true,
    dataCollectionEnabled: true,
    autoUploadSessions: true,
  },
  isFirstLaunch: true,
  typingMessageId: null,
  loadingMessageId: null,
  // Voice-related state
  voiceMode: false,
  isHandsFreeMode: false,
  isListening: false,
  speechQueue: [],
  // User profile and data collection
  userProfile: null,
  customAgents: [],
  trainingVideos: [],
  cookingSessions: [],
  userStats: {
    totalCookingSessions: 0,
    favoriteRecipes: [],
    mostUsedIngredients: [],
    cookingSkillLevel: "beginner",
    totalCookingTime: 0,
  },
  // Data collection state
  isCollectingData: false,
  currentCookingSession: null,
};

// Enhanced store type with better cancellation handling
type AppStore = AppState & {
  setCurrentAgent: (agentId: string | null) => void;
  setCurrentRecipe: (recipeId: string | null) => void;
  toggleCamera: () => void;
  toggleRecording: () => void;
  sendMessage: (content: string, image?: string) => void;
  receiveMessage: (content: string) => void;
  startLoadingMessage: () => string;
  finishLoadingMessage: (messageId: string) => void;
  startTypingMessage: (content: string) => string;
  updateTypingMessage: (messageId: string, displayedContent: string, fullContent: string) => void;
  finishTypingMessage: (messageId: string) => void;
  cancelTypingMessage: (messageId: string) => void;
  cancelLoadingMessage: (messageId: string) => void;
  preserveTypingMessage: (messageId: string) => void;
  createNewChat: (agentId: string) => string;
  setActiveChat: (chatId: string) => void;
  updatePreference: <K extends keyof AppState["preferences"]>(
    key: K,
    value: AppState["preferences"][K]
  ) => void;
  completeOnboarding: () => void;
  resetCameraToSafePosition: () => void;
  // Enhanced response cancellation with text preservation
  currentCancellationToken: CancellationToken | null;
  setCurrentCancellationToken: (token: CancellationToken | null) => void;
  cancelCurrentResponse: () => void;
  isGeneratingResponse: boolean;
  setIsGeneratingResponse: (generating: boolean) => void;
  // Voice-related methods
  setVoiceMode: (enabled: boolean) => void;
  setHandsFreeMode: (enabled: boolean) => void;
  setIsListening: (listening: boolean) => void;
  addToSpeechQueue: (text: string, priority?: number) => void;
  clearSpeechQueue: () => void;
  removeFromSpeechQueue: (index: number) => void;
  // User profile and data collection methods - FIXED to accept null
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  addCustomAgent: (agent: CustomAgent) => void;
  updateCustomAgent: (agentId: string, updates: Partial<CustomAgent>) => void;
  deleteCustomAgent: (agentId: string) => void;
  addTrainingVideo: (video: TrainingVideo) => void;
  updateTrainingVideo: (videoId: string, updates: Partial<TrainingVideo>) => void;
  deleteTrainingVideo: (videoId: string) => void;
  startCookingSession: (recipeId?: string, agentId?: string) => string;
  endCookingSession: (sessionId: string, success: boolean) => void;
  updateCookingSession: (sessionId: string, updates: Partial<CookingSession>) => void;
  collectUserData: (data: any) => void;
  uploadCookingSession: (sessionId: string) => Promise<void>;
  syncUserData: () => Promise<void>;
  // Analytics and learning
  updateUserStats: (updates: Partial<AppState["userStats"]>) => void;
  recordIngredientUsage: (ingredients: string[]) => void;
  recordRecipeCompletion: (recipeId: string, success: boolean, duration: number) => void;
  getPersonalizedRecommendations: () => Promise<any[]>;
  // MANU ASSIST specific methods
  contributeTrainingData: (dataType: string, content: any, metadata?: any) => Promise<void>;
  getTrainingContributions: () => Promise<any>;
  improveAIModel: (feedback: any) => Promise<void>;
};

// Create the enhanced store for MANU ASSIST
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      currentCancellationToken: null,
      isGeneratingResponse: false,

      setCurrentAgent: (agentId) => {
        const allAgents: Agent[] = [...agents, ...get().customAgents];
        const agent = agentId ? allAgents.find((a) => a.id === agentId) || null : null;
        set({ currentAgent: agent });
      },

      setCurrentRecipe: (recipeId) => {
        set({ currentRecipe: recipeId ? { id: recipeId } as any : null });
      },

      toggleCamera: () => {
        set((state) => ({ cameraActive: !state.cameraActive }));
      },

      toggleRecording: () => {
        set((state) => ({ isRecording: !state.isRecording }));
      },

      createNewChat: (agentId) => {
        const chatId = nanoid();
        const allAgents: Agent[] = [...agents, ...get().customAgents];
        const agent = allAgents.find((a) => a.id === agentId);
        
        const newChat: ChatSession = {
          id: chatId,
          agentId,
          messages: [
            {
              id: nanoid(),
              role: "system",
              content: `You are MANU ASSIST, a helpful AI cooking assistant specializing in ${
                agent?.name || "general assistance"
              } for Nigerian cuisine and kitchen tasks. You are powered by Gemma 3n, a multimodal AI model.`,
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          chatSessions: { ...state.chatSessions, [chatId]: newChat },
          activeChatId: chatId,
        }));

        return chatId;
      },

      setActiveChat: (chatId) => {
        set({ activeChatId: chatId });
      },

      sendMessage: (content, image) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        // Cancel any ongoing response when sending a new message
        get().cancelCurrentResponse();
        
        const message: Message = {
          id: nanoid(),
          role: "user",
          content,
          timestamp: Date.now(),
          image,
        };

        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: [...state.chatSessions[activeChatId].messages, message],
              updatedAt: Date.now(),
            },
          },
        }));

        // Collect user interaction data for AI training
        get().collectUserData({
          type: "message_sent",
          content: content.substring(0, 100),
          hasImage: !!image,
          agentId: chatSessions[activeChatId].agentId,
          timestamp: Date.now(),
          appName: "MANU ASSIST",
        });
      },

      receiveMessage: (content) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        const message: Message = {
          id: nanoid(),
          role: "assistant",
          content,
          timestamp: Date.now(),
        };

        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: [...state.chatSessions[activeChatId].messages, message],
              updatedAt: Date.now(),
            },
          },
        }));
      },

      startLoadingMessage: () => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return "";
        
        const messageId = nanoid();
        const message: Message = {
          id: messageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          isLoading: true,
        };

        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: [...state.chatSessions[activeChatId].messages, message],
              updatedAt: Date.now(),
            },
          },
          loadingMessageId: messageId,
        }));

        return messageId;
      },

      finishLoadingMessage: (messageId) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: state.chatSessions[activeChatId].messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, isLoading: false, isTyping: true, displayedContent: "" }
                  : msg
              ),
              updatedAt: Date.now(),
            },
          },
          loadingMessageId: null,
          typingMessageId: messageId,
        }));
      },

      startTypingMessage: (content) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return "";
        
        const messageId = nanoid();
        const message: Message = {
          id: messageId,
          role: "assistant",
          content,
          timestamp: Date.now(),
          isTyping: true,
          displayedContent: "",
        };

        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: [...state.chatSessions[activeChatId].messages, message],
              updatedAt: Date.now(),
            },
          },
          typingMessageId: messageId,
        }));

        return messageId;
      },

      // Enhanced updateTypingMessage for real-time streaming
      updateTypingMessage: (messageId, displayedContent, fullContent) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: state.chatSessions[activeChatId].messages.map(msg =>
                msg.id === messageId
                  ? { 
                      ...msg, 
                      displayedContent, 
                      content: fullContent,
                      isTyping: true
                    }
                  : msg
              ),
              updatedAt: Date.now(),
            },
          },
        }));
      },

      finishTypingMessage: (messageId) => {
        const { activeChatId, chatSessions, voiceMode, preferences } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        const message = chatSessions[activeChatId].messages.find(msg => msg.id === messageId);
        
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: state.chatSessions[activeChatId].messages.map(msg =>
                msg.id === messageId
                  ? { 
                      ...msg, 
                      isTyping: false, 
                      displayedContent: msg.content
                    }
                  : msg
              ),
              updatedAt: Date.now(),
            },
          },
          typingMessageId: null,
        }));

        // Auto-speak response if voice mode is enabled
        if (voiceMode && preferences.voiceEnabled && message?.content) {
          const language = preferences.language === "en" ? "en-NG" : preferences.language;
          get().addToSpeechQueue(message.content, 1);
          
          import("@/utils/gemma").then(({ speakText }) => {
            speakText(message.content, language, 1);
          });
        }
      },

      cancelTypingMessage: (messageId) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        // Remove the cancelled typing message completely
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: state.chatSessions[activeChatId].messages.filter(msg => msg.id !== messageId),
              updatedAt: Date.now(),
            },
          },
          typingMessageId: null,
        }));
      },

      cancelLoadingMessage: (messageId) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        // Remove the cancelled loading message
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: state.chatSessions[activeChatId].messages.filter(msg => msg.id !== messageId),
              updatedAt: Date.now(),
            },
          },
          loadingMessageId: null,
        }));
      },

      // Enhanced preserveTypingMessage - FIXED to preserve already typed text
      preserveTypingMessage: (messageId) => {
        const { activeChatId, chatSessions } = get();
        
        if (!activeChatId || !chatSessions[activeChatId]) return;
        
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [activeChatId]: {
              ...state.chatSessions[activeChatId],
              messages: state.chatSessions[activeChatId].messages.map(msg =>
                msg.id === messageId
                  ? { 
                      ...msg, 
                      isTyping: false,
                      // IMPORTANT: Preserve the displayedContent as the final content
                      content: msg.displayedContent || msg.content || "",
                      displayedContent: msg.displayedContent || msg.content || ""
                    }
                  : msg
              ),
              updatedAt: Date.now(),
            },
          },
          typingMessageId: null,
        }));
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }));
      },

      completeOnboarding: () => {
        set({ isFirstLaunch: false });
      },

      resetCameraToSafePosition: () => {
        set((state) => ({ ...state }));
      },

      // Enhanced cancellation with better text preservation
      setCurrentCancellationToken: (token) => {
        set({ currentCancellationToken: token });
      },

      cancelCurrentResponse: () => {
        const { currentCancellationToken, typingMessageId, loadingMessageId } = get();
        
        if (currentCancellationToken) {
          currentCancellationToken.cancel("User cancelled response");
          set({ currentCancellationToken: null });
        }
        
        // IMPORTANT: Preserve typed text for typing messages
        if (typingMessageId) {
          get().preserveTypingMessage(typingMessageId);
        }
        
        // Remove loading messages (no text to preserve)
        if (loadingMessageId) {
          get().cancelLoadingMessage(loadingMessageId);
        }
        
        set({ isGeneratingResponse: false });
      },

      setIsGeneratingResponse: (generating) => {
        set({ isGeneratingResponse: generating });
      },

      // Voice-related methods
      setVoiceMode: (enabled) => {
        set({ voiceMode: enabled });
        
        if (enabled) {
          get().addToSpeechQueue("MANU ASSIST voice mode enabled. I'll speak my responses.", 2);
        }
      },

      setHandsFreeMode: (enabled) => {
        set({ isHandsFreeMode: enabled });
        
        if (enabled) {
          get().addToSpeechQueue("MANU ASSIST hands-free mode activated. I'm listening for your commands.", 3);
        } else {
          get().addToSpeechQueue("Hands-free mode deactivated.", 3);
        }
      },

      setIsListening: (listening) => {
        set({ isListening: listening });
      },

      addToSpeechQueue: (text, priority = 0) => {
        set((state) => ({
          speechQueue: [...state.speechQueue, { text, priority, id: nanoid() }].sort((a, b) => b.priority - a.priority)
        }));
      },

      clearSpeechQueue: () => {
        set({ speechQueue: [] });
      },

      removeFromSpeechQueue: (index) => {
        set((state) => ({
          speechQueue: state.speechQueue.filter((_, i) => i !== index)
        }));
      },

      // User profile and data collection methods - FIXED to handle null
      setUserProfile: (profile) => {
        set({ userProfile: profile });
      },

      updateUserProfile: (updates) => {
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
        }));
      },

      addCustomAgent: (agent) => {
        set((state) => ({
          customAgents: [...state.customAgents, agent]
        }));
      },

      updateCustomAgent: (agentId, updates) => {
        set((state) => ({
          customAgents: state.customAgents.map(agent =>
            agent.id === agentId ? { ...agent, ...updates } : agent
          )
        }));
      },

      deleteCustomAgent: (agentId) => {
        set((state) => ({
          customAgents: state.customAgents.filter(agent => agent.id !== agentId)
        }));
      },

      addTrainingVideo: (video) => {
        set((state) => ({
          trainingVideos: [...state.trainingVideos, video]
        }));
      },

      updateTrainingVideo: (videoId, updates) => {
        set((state) => ({
          trainingVideos: state.trainingVideos.map(video =>
            video.id === videoId ? { ...video, ...updates } : video
          )
        }));
      },

      deleteTrainingVideo: (videoId) => {
        set((state) => ({
          trainingVideos: state.trainingVideos.filter(video => video.id !== videoId)
        }));
      },

      startCookingSession: (recipeId, agentId) => {
        const sessionId = nanoid();
        const session: CookingSession = {
          id: sessionId,
          recipeId,
          agentId,
          startTime: Date.now(),
          endTime: null,
          success: false,
          ingredients: [],
          steps: [],
          notes: "",
          images: [],
          difficulty: "medium",
          duration: 0,
        };

        set((state) => ({
          cookingSessions: [...state.cookingSessions, session],
          currentCookingSession: session,
          isCollectingData: true,
        }));

        return sessionId;
      },

      endCookingSession: (sessionId, success) => {
        const endTime = Date.now();
        
        set((state) => {
          const updatedSessions = state.cookingSessions.map(session =>
            session.id === sessionId
              ? { 
                  ...session, 
                  endTime, 
                  success,
                  duration: endTime - session.startTime
                }
              : session
          );

          const completedSession = updatedSessions.find(s => s.id === sessionId);
          
          if (completedSession) {
            const newStats = {
              ...state.userStats,
              totalCookingSessions: state.userStats.totalCookingSessions + 1,
              totalCookingTime: state.userStats.totalCookingTime + completedSession.duration,
            };

            if (success && completedSession.recipeId) {
              newStats.favoriteRecipes = [
                ...new Set([...state.userStats.favoriteRecipes, completedSession.recipeId])
              ];
            }

            return {
              cookingSessions: updatedSessions,
              currentCookingSession: null,
              isCollectingData: false,
              userStats: newStats,
            };
          }

          return {
            cookingSessions: updatedSessions,
            currentCookingSession: null,
            isCollectingData: false,
          };
        });

        if (get().preferences.autoUploadSessions) {
          get().uploadCookingSession(sessionId);
        }
      },

      updateCookingSession: (sessionId, updates) => {
        set((state) => ({
          cookingSessions: state.cookingSessions.map(session =>
            session.id === sessionId ? { ...session, ...updates } : session
          ),
          currentCookingSession: state.currentCookingSession?.id === sessionId
            ? { ...state.currentCookingSession, ...updates }
            : state.currentCookingSession,
        }));
      },

      collectUserData: (data) => {
        if (!get().preferences.dataCollectionEnabled) return;

        const dataPoint = {
          id: nanoid(),
          ...data,
          userId: get().userProfile?.id || "anonymous",
          timestamp: Date.now(),
          appName: "MANU ASSIST",
          version: "1.0.0",
        };

        // Store locally and queue for server upload
        AsyncStorage.setItem(
          `manu_assist_data_${Date.now()}`, 
          JSON.stringify(dataPoint)
        ).catch(error => {
          console.error("Error storing training data:", error);
        });

        console.log("MANU ASSIST: Collecting user data for AI improvement:", dataPoint);
      },

      uploadCookingSession: async (sessionId) => {
        try {
          const session = get().cookingSessions.find(s => s.id === sessionId);
          if (!session) return;

          console.log("MANU ASSIST: Uploading cooking session for AI training:", session);
          
          // In a real implementation, this would upload to your backend
          // await trpcClient.data.uploadCookingSession.mutate(session);
        } catch (error) {
          console.error("MANU ASSIST: Failed to upload cooking session:", error);
        }
      },

      syncUserData: async () => {
        try {
          console.log("MANU ASSIST: Syncing user data for AI improvement...");
          
          // In a real implementation, sync with backend
          // await trpcClient.data.syncUserData.mutate({
          //   userId: get().userProfile?.id,
          //   sessions: get().cookingSessions,
          //   customAgents: get().customAgents,
          //   trainingVideos: get().trainingVideos,
          // });
        } catch (error) {
          console.error("MANU ASSIST: Failed to sync user data:", error);
        }
      },

      updateUserStats: (updates) => {
        set((state) => ({
          userStats: { ...state.userStats, ...updates }
        }));
      },

      recordIngredientUsage: (ingredients) => {
        set((state) => {
          const updatedIngredients = [...state.userStats.mostUsedIngredients];
          
          ingredients.forEach(ingredient => {
            const existing = updatedIngredients.find(item => item.name === ingredient);
            if (existing) {
              existing.count += 1;
            } else {
              updatedIngredients.push({ name: ingredient, count: 1 });
            }
          });

          updatedIngredients.sort((a, b) => b.count - a.count);
          updatedIngredients.splice(20);

          return {
            userStats: {
              ...state.userStats,
              mostUsedIngredients: updatedIngredients,
            }
          };
        });
      },

      recordRecipeCompletion: (recipeId, success, duration) => {
        get().collectUserData({
          type: "recipe_completion",
          recipeId,
          success,
          duration,
          timestamp: Date.now(),
        });

        if (success) {
          set((state) => {
            const favoriteRecipes = [...state.userStats.favoriteRecipes];
            if (!favoriteRecipes.includes(recipeId)) {
              favoriteRecipes.push(recipeId);
            }

            return {
              userStats: {
                ...state.userStats,
                favoriteRecipes,
                totalCookingTime: state.userStats.totalCookingTime + duration,
              }
            };
          });
        }
      },

      getPersonalizedRecommendations: async () => {
        try {
          const { userStats, cookingSessions, customAgents } = get();
          
          console.log("MANU ASSIST: Getting personalized recommendations...");
          
          // Mock recommendations based on user data
          return [
            {
              type: "recipe",
              title: "Jollof Rice with Plantain",
              reason: "Based on your frequent use of rice and plantain",
              confidence: 0.85,
            },
            {
              type: "technique",
              title: "Advanced Pepper Soup Preparation",
              reason: "You've mastered basic soups, ready for advanced techniques",
              confidence: 0.78,
            },
          ];
        } catch (error) {
          console.error("MANU ASSIST: Failed to get recommendations:", error);
          return [];
        }
      },

      // MANU ASSIST specific methods for AI training
      contributeTrainingData: async (dataType, content, metadata = {}) => {
        try {
          const trainingData = {
            id: nanoid(),
            type: dataType,
            content,
            metadata: {
              ...metadata,
              userId: get().userProfile?.id || "anonymous",
              appName: "MANU ASSIST",
              contributedAt: Date.now(),
            },
          };

          // Store locally
          await AsyncStorage.setItem(
            `manu_assist_training_${Date.now()}`, 
            JSON.stringify(trainingData)
          );

          // Add to training videos if it's a video
          if (dataType === "video") {
            const video: TrainingVideo = {
              id: trainingData.id,
              title: metadata.title || "User Contribution",
              description: metadata.description || "",
              url: content,
              source: "upload",
              uploadedAt: Date.now(),
              duration: metadata.duration || 0,
              thumbnail: metadata.thumbnail,
              status: "processing",
              difficulty: metadata.difficulty || "intermediate",
              tags: metadata.tags || [],
              language: metadata.language || "en",
            };
            
            get().addTrainingVideo(video);
          }

          console.log("MANU ASSIST: Training data contributed successfully");
        } catch (error) {
          console.error("MANU ASSIST: Error contributing training data:", error);
          throw error;
        }
      },

      getTrainingContributions: async () => {
        try {
          // In a real implementation, this would fetch from backend
          return {
            totalContributions: get().trainingVideos.length,
            videoContributions: get().trainingVideos.length,
            recipeContributions: 0,
            aiImpactScore: 0.75,
            communityRank: "Contributor",
          };
        } catch (error) {
          console.error("MANU ASSIST: Error getting training contributions:", error);
          return null;
        }
      },

      improveAIModel: async (feedback) => {
        try {
          const improvementData = {
            id: nanoid(),
            type: "ai_feedback",
            feedback,
            userId: get().userProfile?.id || "anonymous",
            timestamp: Date.now(),
            appName: "MANU ASSIST",
          };

          await AsyncStorage.setItem(
            `manu_assist_feedback_${Date.now()}`, 
            JSON.stringify(improvementData)
          );

          console.log("MANU ASSIST: AI improvement feedback collected");
        } catch (error) {
          console.error("MANU ASSIST: Error collecting AI feedback:", error);
          throw error;
        }
      },
    }),
    {
      name: "manu-assist-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        chatSessions: state.chatSessions,
        preferences: state.preferences,
        isFirstLaunch: state.isFirstLaunch,
        voiceMode: state.voiceMode,
        isHandsFreeMode: state.isHandsFreeMode,
        userProfile: state.userProfile,
        customAgents: state.customAgents,
        trainingVideos: state.trainingVideos,
        cookingSessions: state.cookingSessions,
        userStats: state.userStats,
      }),
    }
  )
);