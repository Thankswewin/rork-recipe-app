import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Chef {
  id: string;
  name: string;
  specialty: string;
  specialties: string[];
  avatar: string;
  description: string;
  personality: string;
  rating?: number;
  isCustom?: boolean;
  usageCount?: number;
  isDefault?: boolean;
  isPublic?: boolean;
  isPremium?: boolean;
  creator?: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'video';
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: {
    fileName?: string;
    duration?: number;
    analysis?: string;
    audioUrl?: string;
    transcription?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  chef: Chef;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // Current session
  currentSession: ChatSession | null;
  currentChef: Chef;
  
  // All sessions
  sessions: ChatSession[];
  
  // UI state
  isGeneratingResponse: boolean;
  isRecording: boolean;
  
  // Actions
  setCurrentChef: (chef: Chef) => void;
  createNewSession: (chef?: Chef) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setGeneratingResponse: (isGenerating: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

const defaultChef: Chef = {
  id: 'chef-adunni',
  name: 'Chef Adunni',
  specialty: 'Nigerian Cuisine',
  specialties: ['Nigerian Cuisine', 'West African Dishes', 'Traditional Cooking'],
  avatar: '👨‍🍳',
  description: 'Expert in traditional and modern Nigerian cooking techniques',
  personality: 'Friendly, encouraging, and knowledgeable about West African cuisine',
  rating: 4.9,
  usageCount: 15420,
  isDefault: true,
  isPublic: true,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      currentChef: defaultChef,
      sessions: [],
      isGeneratingResponse: false,
      isRecording: false,

      setCurrentChef: (chef) => {
        set({ currentChef: chef });
        // If there's a current session, update it with the new chef
        const { currentSession } = get();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            chef,
            updatedAt: new Date(),
          };
          set({
            currentSession: updatedSession,
            sessions: get().sessions.map(s => 
              s.id === currentSession.id ? updatedSession : s
            ),
          });
        }
      },

      createNewSession: (chef) => {
        const selectedChef = chef || get().currentChef;
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: `Chat with ${selectedChef.name}`,
          chef: selectedChef,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set({
          currentSession: newSession,
          currentChef: selectedChef,
          sessions: [newSession, ...get().sessions],
        });
      },

      addMessage: (messageData) => {
        const { currentSession } = get();
        if (!currentSession) {
          // Create a new session if none exists
          get().createNewSession();
          return get().addMessage(messageData);
        }

        const newMessage: Message = {
          ...messageData,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, newMessage],
          updatedAt: new Date(),
          // Auto-generate title from first user message
          title: currentSession.messages.length === 0 && messageData.sender === 'user'
            ? messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '')
            : currentSession.title,
        };

        set({
          currentSession: updatedSession,
          sessions: get().sessions.map(s => 
            s.id === currentSession.id ? updatedSession : s
          ),
        });
      },

      updateMessage: (messageId, updates) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedSession = {
          ...currentSession,
          messages: currentSession.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
          updatedAt: new Date(),
        };

        set({
          currentSession: updatedSession,
          sessions: get().sessions.map(s => 
            s.id === currentSession.id ? updatedSession : s
          ),
        });
      },

      deleteMessage: (messageId) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const updatedSession = {
          ...currentSession,
          messages: currentSession.messages.filter(msg => msg.id !== messageId),
          updatedAt: new Date(),
        };

        set({
          currentSession: updatedSession,
          sessions: get().sessions.map(s => 
            s.id === currentSession.id ? updatedSession : s
          ),
        });
      },

      setGeneratingResponse: (isGenerating) => {
        set({ isGeneratingResponse: isGenerating });
      },

      setRecording: (isRecording) => {
        set({ isRecording });
      },

      loadSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (session) {
          set({ 
            currentSession: session,
            currentChef: session.chef,
          });
        }
      },

      deleteSession: (sessionId) => {
        const { currentSession, sessions } = get();
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        
        set({
          sessions: updatedSessions,
          currentSession: currentSession?.id === sessionId ? null : currentSession,
        });
      },

      updateSessionTitle: (sessionId, title) => {
        const { currentSession } = get();
        const updatedSessions = get().sessions.map(s =>
          s.id === sessionId ? { ...s, title, updatedAt: new Date() } : s
        );
        
        set({
          sessions: updatedSessions,
          currentSession: currentSession?.id === sessionId 
            ? { ...currentSession, title, updatedAt: new Date() }
            : currentSession,
        });
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        currentChef: state.currentChef,
      }),
    }
  )
);