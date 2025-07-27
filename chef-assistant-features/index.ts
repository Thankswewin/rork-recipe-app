export interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji?: string;
  examples: string[];
  capabilities: string[];
  isCustom?: boolean;
  trainingData?: TrainingData[];
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  isPublic?: boolean;
  performance?: AgentPerformance;
}

export interface CustomAgent extends Agent {
  isCustom: true;
  trainingData: TrainingData[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  performance: AgentPerformance;
}

export interface AgentPerformance {
  accuracy: number;
  responseTime: number;
  userRating: number;
  totalInteractions: number;
}

export interface TrainingData {
  id: string;
  type: "video" | "text" | "conversation";
  content: string;
  metadata: any;
  uploadedAt: number;
}

export interface TrainingVideo {
  id: string;
  title: string;
  url: string;
  source: "youtube" | "upload" | "url";
  duration: number;
  thumbnail?: string;
  description: string;
  tags: string[];
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  uploadedAt: number;
  status: "pending" | "processing" | "completed" | "failed";
}

// Import unified Recipe type from main types file
import type { Recipe } from '../types';

// Export for backward compatibility
export type { Recipe };

// Additional recipe-related types specific to chef assistant
export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface EnhancedRecipe extends Recipe {
  tags?: string[];
  cuisine?: string;
  nutrition?: RecipeNutrition;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  image?: string;
  isLoading?: boolean;
  isTyping?: boolean;
  displayedContent?: string;
}

export interface ChatSession {
  id: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number;
}

export interface UserPreferences {
  cuisineTypes: string[];
  dietaryRestrictions: string[];
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  favoriteIngredients: string[];
  cookingGoals: string[];
}

export interface UserSubscription {
  type: "free" | "premium" | "pro";
  expiresAt?: number;
  features: string[];
}

export interface CookingSession {
  id: string;
  recipeId?: string;
  agentId?: string;
  startTime: number;
  endTime: number | null;
  success: boolean;
  ingredients: string[];
  steps: string[];
  notes: string;
  images: string[];
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  metadata?: {
    temperature?: number;
    humidity?: number;
    equipment?: string[];
    techniques?: string[];
  };
}

export interface UserStats {
  totalCookingSessions: number;
  favoriteRecipes: string[];
  mostUsedIngredients: Array<{
    name: string;
    count: number;
  }>;
  cookingSkillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  totalCookingTime: number;
}

export interface SpeechQueueItem {
  text: string;
  priority: number;
  id: string;
}

export interface AppState {
  // Current state
  currentAgent: Agent | null;
  currentRecipe: Recipe | null;
  
  // Chat state
  chatSessions: Record<string, ChatSession>;
  activeChatId: string | null;
  typingMessageId: string | null;
  loadingMessageId: string | null;
  
  // Camera state
  cameraActive: boolean;
  isRecording: boolean;
  
  // Voice state
  voiceMode: boolean;
  isHandsFreeMode: boolean;
  isListening: boolean;
  speechQueue: SpeechQueueItem[];
  
  // User preferences
  preferences: {
    darkMode: boolean;
    language: string;
    voiceEnabled: boolean;
    cameraEnabled: boolean;
    notificationsEnabled: boolean;
    dataCollectionEnabled: boolean;
    autoUploadSessions: boolean;
  };
  
  // App state
  isFirstLaunch: boolean;
  
  // User profile and data
  userProfile: UserProfile | null;
  customAgents: CustomAgent[];
  trainingVideos: TrainingVideo[];
  cookingSessions: CookingSession[];
  userStats: UserStats;
  
  // Data collection
  isCollectingData: boolean;
  currentCookingSession: CookingSession | null;
}

export interface DataEvent {
  id: string;
  type: string;
  data: any;
  userId: string;
  sessionId?: string;
  agentId?: string;
  timestamp: number;
}

export interface AIRecommendation {
  id: string;
  type: "recipe" | "technique" | "ingredient" | "equipment";
  title: string;
  description: string;
  reason: string;
  confidence: number;
  metadata: any;
  createdAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress?: number;
  target?: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export interface GlobalInsights {
  totalUsers: number;
  totalSessions: number;
  mostPopularRecipes: Array<{
    name: string;
    popularity: number;
  }>;
  commonChallenges: Array<{
    challenge: string;
    frequency: number;
  }>;
  aiPerformance: {
    averageResponseTime: number;
    userSatisfaction: number;
    accuracyRate: number;
  };
}

export interface ModelPerformance {
  modelId: string;
  timeRange: string;
  metrics: {
    totalInteractions: number;
    averageResponseTime: number;
    userSatisfactionRate: number;
    accuracyRate: number;
    successfulCompletions: number;
  };
  trends: {
    responseTime: number[];
    satisfaction: number[];
    accuracy: number[];
  };
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  commonIssues: Array<{
    issue: string;
    frequency: number;
  }>;
}

export interface UserAnalytics {
  totalSessions: number;
  totalCookingTime: number;
  successRate: number;
  favoriteRecipes: Array<{
    name: string;
    count: number;
  }>;
  skillProgression: Array<{
    date: string;
    level: number;
  }>;
  weeklyActivity: Array<{
    week: string;
    sessions: number;
    duration: number;
  }>;
}

export interface SubscriptionInfo {
  type: "free" | "premium" | "pro";
  status: "active" | "expired" | "cancelled";
  expiresAt?: number;
  features: string[];
  usage: {
    customAgents: number;
    maxCustomAgents: number;
    trainingVideos: number;
    maxTrainingVideos: number;
    cookingSessions: number;
    maxCookingSessions: number;
  };
  billing?: {
    amount: number;
    currency: string;
    interval: "monthly" | "yearly";
    nextBillingDate: number;
  };
}