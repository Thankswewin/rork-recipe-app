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
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface Notification {
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

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  schema: string;
  table: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  notifications: Notification[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  uploadAvatar: (imageUri: string) => Promise<{ error?: string; url?: string }>;
  removeAvatar: () => Promise<{ error?: string }>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; error?: string }>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  createProfile: (userId: string, email: string, fullName?: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  
  // Notification actions
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: Notification) => void;
  setupRealtimeSubscriptions: () => Promise<() => void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      notifications: [],
      unreadNotificationsCount: 0,
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

            // Fetch user profile and notifications
            await get().fetchProfile(data.user.id);
            await get().fetchNotifications();
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
            });

            // Wait for the trigger to create the profile, then fetch it
            if (data.session) {
              setTimeout(async () => {
                try {
                  await get().fetchProfile(data.user!.id);
                  await get().fetchNotifications();
                } catch (error) {
                  console.log('Profile fetch after signup failed, will retry on next app launch');
                }
              }, 2000);
            }
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
          
          console.log('Creating profile for user:', userId);
          
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: email,
              full_name: fullName || null,
              bio: null,
              avatar_url: null,
              username: null,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating profile:', error);
            if (error.code === '23505') {
              console.log('Profile already exists, fetching existing profile');
              await get().fetchProfile(userId);
              return {};
            }
            return { error: error.message };
          }

          console.log('Profile created successfully:', data);
          set({ profile: data });
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
            notifications: [],
            unreadNotificationsCount: 0,
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
          const { data, error } = await supabase
            .from('profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating profile:', error);
            return { error: error.message };
          }

          // Update local profile with the returned data
          if (data) {
            set({ profile: data });
            console.log('Profile updated successfully:', data);
          }

          return {};
        } catch (error: any) {
          console.error('Error in updateProfile:', error);
          return { error: error?.message || 'An unexpected error occurred' };
        }
      },

      uploadAvatar: async (imageUri: string) => {
        const { user, profile } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          const supabase = await getSupabase();
          
          console.log('Starting avatar upload for user:', user.id);
          
          // Convert image to blob for upload
          const response = await fetch(imageUri);
          if (!response.ok) {
            return { error: 'Failed to fetch image from URI' };
          }
          
          const blob = await response.blob();
          console.log('Image blob created, size:', blob.size);
          
          // Delete old avatar if exists
          if (profile?.avatar_url) {
            try {
              const oldPath = profile.avatar_url.split('/').pop();
              if (oldPath && oldPath.includes(user.id)) {
                await supabase.storage
                  .from('avatars')
                  .remove([`${user.id}/${oldPath}`]);
                console.log('Old avatar deleted');
              }
            } catch (error) {
              console.log('Could not delete old avatar:', error);
            }
          }
          
          const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `avatar-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          console.log('Uploading to path:', filePath);

          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            
            if (uploadError.message.includes('Bucket not found')) {
              return { error: 'Storage bucket not configured. Please contact support.' };
            } else if (uploadError.message.includes('not allowed')) {
              return { error: 'File type not allowed. Please use JPG, PNG, or WebP images.' };
            } else if (uploadError.message.includes('too large')) {
              return { error: 'Image file is too large. Please use an image smaller than 5MB.' };
            }
            
            return { error: uploadError.message };
          }

          console.log('Upload successful:', uploadData);

          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          const avatarUrl = data.publicUrl;
          console.log('Generated public URL:', avatarUrl);

          // Update profile with new avatar URL
          const { error: updateError } = await get().updateProfile({ 
            avatar_url: avatarUrl 
          });
          
          if (updateError) {
            console.error('Profile update error:', updateError);
            return { error: updateError };
          }

          console.log('Avatar upload completed successfully');
          return { url: avatarUrl };
        } catch (error: any) {
          console.error('Avatar upload error:', error);
          return { error: error.message || 'Failed to upload avatar' };
        }
      },

      removeAvatar: async () => {
        const { user, profile } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          const supabase = await getSupabase();
          
          // Delete avatar file from storage if exists
          if (profile?.avatar_url) {
            try {
              const urlParts = profile.avatar_url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const filePath = `${user.id}/${fileName}`;
              
              await supabase.storage
                .from('avatars')
                .remove([filePath]);
              
              console.log('Avatar file deleted from storage');
            } catch (error) {
              console.log('Could not delete avatar file:', error);
            }
          }

          // Update profile to remove avatar URL
          const { error: updateError } = await get().updateProfile({ 
            avatar_url: null 
          });
          
          if (updateError) {
            console.error('Profile update error:', updateError);
            return { error: updateError };
          }

          console.log('Avatar removed successfully');
          return {};
        } catch (error: any) {
          console.error('Remove avatar error:', error);
          return { error: error.message || 'Failed to remove avatar' };
        }
      },

      checkUsernameAvailability: async (username: string) => {
        try {
          const supabase = await getSupabase();
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            return { available: false, error: error.message };
          }

          return { available: !data };
        } catch (error: any) {
          console.error('Username availability check error:', error);
          return { available: false, error: error.message };
        }
      },

      fetchProfile: async (userId: string) => {
        try {
          const supabase = await getSupabase();
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            return;
          }

          if (!data) {
            console.log('Profile not found, attempting to create one');
            const { user } = get();
            if (user) {
              const createResult = await get().createProfile(
                userId, 
                user.email || '', 
                user.user_metadata?.full_name
              );
              if (createResult.error) {
                console.error('Failed to create profile:', createResult.error);
              }
            }
            return;
          }

          console.log('Profile fetched successfully:', data);
          set({ profile: data });
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      },

      refreshProfile: async () => {
        const { user } = get();
        if (user) {
          await get().fetchProfile(user.id);
        }
      },

      fetchNotifications: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const supabase = await getSupabase();
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:actor_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) {
            console.error('Error fetching notifications:', error);
            return;
          }

          const notifications = data || [];
          const unreadCount = notifications.filter((n: any) => !n.read).length;

          set({ 
            notifications,
            unreadNotificationsCount: unreadCount
          });
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          const supabase = await getSupabase();
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error marking notification as read:', error);
            return;
          }

          // Update local state
          set(state => ({
            notifications: state.notifications.map((n: any) => 
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1)
          }));
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      },

      markAllNotificationsAsRead: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const supabase = await getSupabase();
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

          if (error) {
            console.error('Error marking all notifications as read:', error);
            return;
          }

          // Update local state
          set(state => ({
            notifications: state.notifications.map((n: any) => ({ ...n, read: true })),
            unreadNotificationsCount: 0
          }));
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      },

      clearNotifications: () => {
        set({ notifications: [], unreadNotificationsCount: 0 });
      },

      addNotification: (notification: Notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationsCount: state.unreadNotificationsCount + 1
        }));
      },

      setupRealtimeSubscriptions: async () => {
        const { user } = get();
        if (!user) return () => {};

        try {
          const supabase = await getSupabase();
          
          // Subscribe to notifications for the current user
          const notificationsSubscription = supabase
            .channel('notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
              },
              async (payload: any) => {
                console.log('New notification received:', payload);
                
                // Fetch the complete notification with actor data
                const { data } = await supabase
                  .from('notifications')
                  .select(`
                    *,
                    actor:actor_id (
                      id,
                      username,
                      full_name,
                      avatar_url
                    )
                  `)
                  .eq('id', payload.new.id)
                  .single();

                if (data) {
                  get().addNotification(data);
                }
              }
            )
            .subscribe();

          // Subscribe to followers table to update UI when someone follows/unfollows
          const followersSubscription = supabase
            .channel('followers')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'followers',
              },
              (payload: any) => {
                console.log('Followers table changed:', payload);
                // This will help refresh follower counts and states in real-time
                // Components can listen to this via custom events or state updates
              }
            )
            .subscribe();

          return () => {
            notificationsSubscription.unsubscribe();
            followersSubscription.unsubscribe();
          };
        } catch (error) {
          console.error('Error setting up realtime subscriptions:', error);
          return () => {};
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

            await get().fetchProfile(session.user.id);
            await get().fetchNotifications();
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
        user: state.user,
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        // Don't persist notifications as they should be fresh on each session
      }),
    }
  )
);