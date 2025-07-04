import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user && data.session) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            });

            // Fetch user profile
            await get().fetchProfile(data.user.id);
          }

          return {};
        } catch (error: any) {
          set({ isLoading: false });
          console.error('Sign in error:', error);
          return { error: error?.message || 'An unexpected error occurred' };
        }
      },

      signUp: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true });
        
        try {
          console.log('Auth store: Starting sign up process');
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          console.log('Auth store: Sign up response:', { 
            user: !!data.user, 
            session: !!data.session,
            error: error?.message 
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          // The trigger should automatically create the profile
          // We don't need to manually create it here
          
          set({ isLoading: false });
          return {};
        } catch (error: any) {
          set({ isLoading: false });
          console.error('Sign up error:', error);
          return { error: error?.message || 'An unexpected error occurred during sign up' };
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error signing out:', error);
          set({ isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          
          if (error) {
            return { error: error.message };
          }

          return {};
        } catch (error) {
          return { error: 'An unexpected error occurred' };
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (error) {
            return { error: error.message };
          }

          // Update local profile
          const { profile } = get();
          if (profile) {
            set({
              profile: {
                ...profile,
                ...updates,
                updated_at: new Date().toISOString(),
              },
            });
          }

          return {};
        } catch (error) {
          return { error: 'An unexpected error occurred' };
        }
      },

      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          set({ profile: data });
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      },

      setSession: (session: Session | null) => {
        set({ 
          session,
          isAuthenticated: !!session,
        });
      },

      setUser: (user: User | null) => {
        set({ 
          user,
          isAuthenticated: !!user,
        });
      },

      setProfile: (profile: Profile | null) => {
        set({ profile });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initialize: async () => {
        set({ isLoading: true });
        
        try {
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ isLoading: false });
            return;
          }

          if (session?.user) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
            });

            // Fetch profile
            await get().fetchProfile(session.user.id);
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist essential data
        user: state.user,
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);