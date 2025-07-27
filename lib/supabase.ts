import { createClient } from '@supabase/supabase-js';
// Add to package.json: npm install @supabase/supabase-js
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

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase config:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  platform: isWeb() ? 'web' : 'native'
});

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file and ensure these variables are set.`;
  console.error('Supabase configuration error:', errorMessage);
  throw new Error(errorMessage);
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

// Import unified types from the main types file
import type { Database } from '../types';

// Re-export the Database type for backward compatibility
export type { Database };