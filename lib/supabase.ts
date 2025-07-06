import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Safe platform detection
const isWeb = () => {
  try {
    return Platform.OS === 'web';
  } catch {
    return typeof window !== 'undefined';
  }
};

// Use the provided credentials as fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qczagsahfjpzottzamwk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjemFnc2FoZmpwem90dHphbXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyODYzNjksImV4cCI6MjA2Njg2MjM2OX0.bNu5mt1OEkUrYHop7nvQcJHX4ouD12npL0yfhUnOaGA';

console.log('Supabase config:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  platform: isWeb() ? 'web' : 'native'
});

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  throw new Error('Missing Supabase URL or API key');
}

// Create a custom storage adapter for React Native
const customStorage = {
  getItem: async (key: string) => {
    try {
      if (isWeb()) {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (isWeb()) {
        localStorage.setItem(key, value);
        return;
      }
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (isWeb()) {
        localStorage.removeItem(key);
        return;
      }
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'rork-recipe-app',
    },
  },
});

// Test Supabase connection with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First try a simple health check
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Network connection failed. Please check your internet connection and try again.' 
        };
      } else if (error.message.includes('Invalid API key')) {
        return { 
          success: false, 
          error: 'Invalid Supabase configuration. Please check your API keys.' 
        };
      } else if (error.message.includes('CORS')) {
        return { 
          success: false, 
          error: 'CORS error. Please check your Supabase project settings.' 
        };
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Database tables not found. Please run the database schema setup.' 
        };
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection test successful');
    return { success: true };
  } catch (error: any) {
    console.error('Supabase connection test error:', error);
    
    // Handle network errors specifically
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: 'Network connection failed. Please check your internet connection and try again.' 
      };
    }
    
    return { success: false, error: error.message || 'Unknown connection error' };
  }
};

// Test authentication specifically
export const testSupabaseAuth = async () => {
  try {
    console.log('Testing Supabase auth...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Auth test successful, session:', !!session);
    return { success: true, hasSession: !!session };
  } catch (error: any) {
    console.error('Auth test error:', error);
    return { success: false, error: error.message || 'Unknown auth error' };
  }
};

// Initialize connection test on module load (but don't block)
setTimeout(() => {
  testSupabaseConnection().then(result => {
    if (!result.success) {
      console.warn('Initial Supabase connection test failed:', result.error);
    }
  });
}, 1000);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email?: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          category: string;
          difficulty: string;
          prep_time: number;
          cook_time: number;
          servings: number;
          ingredients: string[];
          instructions: string[];
          user_id: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          category?: string;
          difficulty?: string;
          prep_time?: number;
          cook_time?: number;
          servings?: number;
          ingredients?: string[];
          instructions?: string[];
          user_id?: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          created_at?: string;
        };
      };
      followers: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: 'follow' | 'like' | 'comment' | 'recipe_created';
          title: string;
          message: string;
          data: any;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: 'follow' | 'like' | 'comment' | 'recipe_created';
          title: string;
          message: string;
          data?: any;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: 'follow' | 'like' | 'comment' | 'recipe_created';
          title?: string;
          message?: string;
          data?: any;
          read?: boolean;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string;
          created_at?: string;
        };
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