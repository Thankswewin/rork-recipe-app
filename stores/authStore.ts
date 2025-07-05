import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';

// Lazy import supabase to avoid immediate execution
let supabaseClient: any = null;
const getSupabase = async () => {
  if (!supabaseClient) {
    const { supabase } = await import('@/lib/supabase');
    supabaseClient = supabase;
  }
  return supabaseClient;
};

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
  createProfile: (userId: string, email: string, fullName?: string) => Promise<{ error?: string }>;
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
          const supabase = await getSupabase();
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
          
          const supabase = await getSupabase();
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

          if (data.user) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: !!data.session,
              isLoading: false,
            });

            // Wait a bit for the trigger to create the profile, then try to fetch it
            setTimeout(async () => {
              try {
                await get().fetchProfile(data.user!.id);
              } catch (error) {
                console.log('Profile fetch after signup failed, will retry on next app launch');
              }
            }, 1000);
          }
          
          set({ isLoading: false });
          return {};
        } catch (error: any) {
          set({ isLoading: false });
          console.error('Sign up error:', error);
          return { error: error?.message || 'An unexpected error occurred during sign up' };
        }
      },

      createProfile: async (userId: string, email: string, fullName?: string) => {
        try {
          const supabase = await getSupabase();
          
          // Check if profile already exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

          if (existingProfile) {
            console.log('Profile already exists');
            return {};
          }

          // Only try to create if we're sure it doesn't exist
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing profile:', fetchError);
            return { error: fetchError.message };
          }

          // Create new profile using upsert to handle race conditions
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: email,
              full_name: fullName || null,
              bio: null,
              avatar_url: null,
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Error creating profile:', error);
            return { error: error.message };
          }

          console.log('Profile created successfully');
          return {};
        } catch (error: any) {
          console.error('Error in createProfile:', error);
          return { error: error.message };
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          const supabase = await getSupabase();
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
          const supabase = await getSupabase();
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
          const supabase = await getSupabase();
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
          const supabase = await getSupabase();
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            // If profile doesn't exist, try to create it
            if (error.code === 'PGRST116') {
              const { user } = get();
              if (user) {
                await get().createProfile(userId, user.email || '', user.user_metadata?.full_name);
              }
            }
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
          const supabase = await getSupabase();
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