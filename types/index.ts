export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  user_id: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
  is_favorited?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants: ConversationParticipant[];
  last_message?: Message | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'follow' | 'like' | 'comment' | 'recipe_created';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  actor?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SearchFilters {
  category?: string;
  difficulty?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
}

// Chef Assistant Types
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

export interface CookingAnalysis {
  confidence: number;
  detectedIngredients: string[];
  cookingTips: string[];
  nextSteps: string[];
  safetyWarnings?: string[];
  estimatedTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface VoiceCommand {
  id: string;
  transcription: string;
  confidence: number;
  intent: 'question' | 'instruction' | 'help' | 'navigation';
  timestamp: Date;
}