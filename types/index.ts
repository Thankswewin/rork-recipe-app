// =====================================================
// UNIFIED TYPE DEFINITIONS
// =====================================================
// This file contains all type definitions for the RORK Recipe App
// Unified to match the database schema and ensure consistency

// =====================================================
// CORE ENTITY TYPES
// =====================================================

/**
 * User profile type - matches the profiles table
 */
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

/**
 * Recipe type - matches the recipes table with computed fields
 */
export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  created_by: string; // Foreign key to profiles.id
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  is_favorited?: boolean;
  author?: UserProfile;
}

/**
 * Favorite type - matches the favorites table
 */
export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

/**
 * Follower relationship type - matches the followers table
 */
export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * Notification type - matches the notifications table
 */
export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'follow' | 'like' | 'comment' | 'recipe_created' | 'message';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  // Joined fields
  actor?: UserProfile;
}

/**
 * Conversation type - matches the conversations table
 */
export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  // Joined fields
  participants?: ConversationParticipant[];
  last_message?: Message | null;
}

/**
 * Conversation participant type - matches the conversation_participants table
 */
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  // Joined fields
  user?: UserProfile;
}

/**
 * Message type - matches the messages table
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  // Joined fields
  sender?: UserProfile;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Simplified user profile for joins and references
 */
export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Recipe category type (for UI purposes)
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  recipe_count: number;
  description?: string;
}

/**
 * Search filters for recipes
 */
export interface RecipeFilters {
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxPrepTime?: number;
  maxCookTime?: number;
  searchQuery?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================================
// DATABASE TYPES (for Supabase)
// =====================================================

/**
 * Database schema type for Supabase
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      recipes: {
        Row: Omit<Recipe, 'is_favorited' | 'author'>;
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count' | 'is_favorited' | 'author'> & {
          id?: string;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Recipe, 'id' | 'is_favorited' | 'author'>>;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Favorite, 'id'>>;
      };
      followers: {
        Row: Follower;
        Insert: Omit<Follower, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Follower, 'id'>>;
      };
      notifications: {
        Row: Omit<Notification, 'actor'>;
        Insert: Omit<Notification, 'id' | 'created_at' | 'actor'> & {
          id?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<Notification, 'id' | 'actor'>>;
      };
      conversations: {
        Row: Omit<Conversation, 'participants' | 'last_message'>;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at' | 'participants' | 'last_message'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
        Update: Partial<Omit<Conversation, 'id' | 'participants' | 'last_message'>>;
      };
      conversation_participants: {
        Row: Omit<ConversationParticipant, 'user'>;
        Insert: Omit<ConversationParticipant, 'id' | 'joined_at' | 'user'> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Omit<ConversationParticipant, 'id' | 'user'>>;
      };
      messages: {
        Row: Omit<Message, 'sender'>;
        Insert: Omit<Message, 'id' | 'created_at' | 'sender'> & {
          id?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<Message, 'id' | 'sender'>>;
      };
    };
    Functions: {
      find_conversation_between_users: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: string | null;
      };
    };
  };
};

// =====================================================
// FORM TYPES
// =====================================================

/**
 * Recipe creation/edit form data
 */
export interface RecipeFormData {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  image_url?: string;
}

/**
 * User profile update form data
 */
export interface ProfileFormData {
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Authentication form data
 */
export interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
}

// =====================================================
// STATE TYPES
// =====================================================

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  session: any | null;
  profile: User | null;
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Recipe state
 */
export interface RecipeState {
  recipes: Recipe[];
  favorites: Recipe[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

/**
 * Messaging state
 */
export interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}