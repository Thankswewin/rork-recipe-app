import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Safe platform detection
const isWeb = () => {
  try {
    return Platform.OS === 'web';
  } catch {
    return typeof window !== 'undefined';
  }
};

interface Profile {
  id: string;
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
  databaseError: string | null;
  
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
  refreshProfile: () => Promise<void>;
  
  // Notification actions
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: Notification) => void;
  setupRealtimeSubscriptions: () => Promise<() => void>;
  
  // Messaging actions
  createOrGetConversation: (otherUserId: string) => Promise<{ conversationId?: string; error?: string }>;
  
  // Database error handling
  setDatabaseError: (error: string | null) => void;
  clearDatabaseError: () => void;
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
      databaseError: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          console.log('AuthStore: Starting sign in process for:', email);
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (error) {
            console.error('AuthStore: Sign in error:', error);
            set({ isLoading: false });
            
            // Provide more user-friendly error messages
            if (error.message.includes('Invalid login credentials')) {
              return { error: 'Invalid email or password. Please check your credentials and try again.' };
            } else if (error.message.includes('Email not confirmed')) {
              return { error: 'Please check your email and click the confirmation link before signing in.' };
            } else if (error.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            } else if (error.message.includes('Too many requests')) {
              return { error: 'Too many sign in attempts. Please wait a few minutes and try again.' };
            }
            
            return { error: error.message };
          }

          if (data.user && data.session) {
            console.log('AuthStore: Sign in successful for user:', data.user.id);
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            });

            // Fetch user profile and notifications
            try {
              await get().fetchProfile(data.user.id);
              await get().fetchNotifications();
            } catch (profileError) {
              console.error('AuthStore: Error fetching profile after sign in:', profileError);
              // Don't fail sign in if profile fetch fails
            }
          }

          return {};
        } catch (error: any) {
          console.error('AuthStore: Sign in error:', error);
          set({ isLoading: false });
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error?.message || 'An unexpected error occurred' };
        }
      },

      signUp: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true });
        
        try {
          console.log('AuthStore: Starting sign up process for:', email);
          
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                full_name: fullName?.trim(),
              },
            },
          });

          console.log('AuthStore: Sign up response:', { 
            user: !!data.user, 
            session: !!data.session,
            error: error?.message 
          });

          if (error) {
            console.error('AuthStore: Sign up error:', error);
            set({ isLoading: false });
            
            // Provide more user-friendly error messages
            if (error.message.includes('User already registered')) {
              return { error: 'An account with this email already exists. Please sign in instead.' };
            } else if (error.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            } else if (error.message.includes('Database error saving new user')) {
              return { error: 'Account creation failed. Please try again or contact support if the problem persists.' };
            } else if (error.message.includes('Password should be at least')) {
              return { error: 'Password must be at least 6 characters long.' };
            } else if (error.message.includes('Unable to validate email address')) {
              return { error: 'Please enter a valid email address.' };
            }
            
            return { error: error.message };
          }

          if (data.user) {
            console.log('AuthStore: Sign up successful for user:', data.user.id);
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: !!data.session,
            });

            // The profile should be created automatically by the trigger
            // Wait a moment then fetch it
            if (data.session) {
              setTimeout(async () => {
                try {
                  await get().fetchProfile(data.user!.id);
                  await get().fetchNotifications();
                } catch (error) {
                  console.log('AuthStore: Profile fetch after signup failed, will retry on next app launch');
                }
              }, 2000);
            }
          }
          
          set({ isLoading: false });
          return {};
        } catch (error: any) {
          console.error('AuthStore: Sign up error:', error);
          set({ isLoading: false });
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error?.message || 'An unexpected error occurred during sign up' };
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          console.log('AuthStore: Starting sign out process');
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
          console.log('AuthStore: Sign out successful');
        } catch (error) {
          console.error('AuthStore: Error signing out:', error);
          set({ isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        try {
          console.log('AuthStore: Sending password reset email');
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
          
          if (error) {
            console.error('AuthStore: Password reset error:', error);
            
            if (error.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: error.message };
          }

          console.log('AuthStore: Password reset email sent successfully');
          return {};
        } catch (error: any) {
          console.error('AuthStore: Password reset error:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: 'An unexpected error occurred' };
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          console.log('AuthStore: Updating profile for user:', user.id);
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
            console.error('AuthStore: Error updating profile:', error);
            
            if (error.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: error.message };
          }

          // Update local profile with the returned data
          if (data) {
            set({ profile: data });
            console.log('AuthStore: Profile updated successfully:', data);
          }

          return {};
        } catch (error: any) {
          console.error('AuthStore: Error in updateProfile:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error?.message || 'An unexpected error occurred' };
        }
      },

      uploadAvatar: async (imageUri: string) => {
        const { user, profile } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          console.log('AuthStore: Starting avatar upload for user:', user.id);
          
          // Convert image to blob for upload
          const response = await fetch(imageUri);
          if (!response.ok) {
            return { error: 'Failed to fetch image from URI' };
          }
          
          const blob = await response.blob();
          console.log('AuthStore: Image blob created, size:', blob.size);
          
          // Delete old avatar if exists
          if (profile?.avatar_url) {
            try {
              const oldPath = profile.avatar_url.split('/').pop();
              if (oldPath && oldPath.includes(user.id)) {
                await supabase.storage
                  .from('avatars')
                  .remove([`${user.id}/${oldPath}`]);
                console.log('AuthStore: Old avatar deleted');
              }
            } catch (error) {
              console.log('AuthStore: Could not delete old avatar:', error);
            }
          }
          
          const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `avatar-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          console.log('AuthStore: Uploading to path:', filePath);

          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('AuthStore: Upload error:', uploadError);
            
            if (uploadError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            } else if (uploadError.message.includes('Bucket not found')) {
              return { error: 'Storage bucket not configured. Please contact support.' };
            } else if (uploadError.message.includes('not allowed')) {
              return { error: 'File type not allowed. Please use JPG, PNG, or WebP images.' };
            } else if (uploadError.message.includes('too large')) {
              return { error: 'Image file is too large. Please use an image smaller than 5MB.' };
            }
            
            return { error: uploadError.message };
          }

          console.log('AuthStore: Upload successful:', uploadData);

          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          const avatarUrl = data.publicUrl;
          console.log('AuthStore: Generated public URL:', avatarUrl);

          // Update profile with new avatar URL
          const { error: updateError } = await get().updateProfile({ 
            avatar_url: avatarUrl 
          });
          
          if (updateError) {
            console.error('AuthStore: Profile update error:', updateError);
            return { error: updateError };
          }

          console.log('AuthStore: Avatar upload completed successfully');
          return { url: avatarUrl };
        } catch (error: any) {
          console.error('AuthStore: Avatar upload error:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error.message || 'Failed to upload avatar' };
        }
      },

      removeAvatar: async () => {
        const { user, profile } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          console.log('AuthStore: Removing avatar for user:', user.id);
          
          // Delete avatar file from storage if exists
          if (profile?.avatar_url) {
            try {
              const urlParts = profile.avatar_url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const filePath = `${user.id}/${fileName}`;
              
              await supabase.storage
                .from('avatars')
                .remove([filePath]);
              
              console.log('AuthStore: Avatar file deleted from storage');
            } catch (error) {
              console.log('AuthStore: Could not delete avatar file:', error);
            }
          }

          // Update profile to remove avatar URL
          const { error: updateError } = await get().updateProfile({ 
            avatar_url: null 
          });
          
          if (updateError) {
            console.error('AuthStore: Profile update error:', updateError);
            return { error: updateError };
          }

          console.log('AuthStore: Avatar removed successfully');
          return {};
        } catch (error: any) {
          console.error('AuthStore: Remove avatar error:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error.message || 'Failed to remove avatar' };
        }
      },

      checkUsernameAvailability: async (username: string) => {
        try {
          console.log('AuthStore: Checking username availability:', username);
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username.trim().toLowerCase())
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('AuthStore: Username availability check error:', error);
            
            if (error.message.includes('Failed to fetch')) {
              return { available: false, error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { available: false, error: error.message };
          }

          const available = !data;
          console.log('AuthStore: Username availability result:', available);
          return { available };
        } catch (error: any) {
          console.error('AuthStore: Username availability check error:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { available: false, error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { available: false, error: error.message };
        }
      },

      fetchProfile: async (userId: string) => {
        try {
          console.log('AuthStore: Fetching profile for user:', userId);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('AuthStore: Error fetching profile:', error);
            return;
          }

          if (data) {
            console.log('AuthStore: Profile fetched successfully:', data);
            set({ profile: data });
          } else {
            console.log('AuthStore: Profile not found for user:', userId);
            // Profile should be created by trigger, but if it doesn't exist, wait a bit and try again
            if (userId === get().user?.id) {
              console.log('AuthStore: Waiting for profile to be created by trigger...');
              setTimeout(async () => {
                await get().fetchProfile(userId);
              }, 3000);
            }
          }
        } catch (error) {
          console.error('AuthStore: Error fetching profile:', error);
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
          console.log('AuthStore: Fetching notifications for user:', user.id);
          
          // First check if notifications table exists
          const { data: tableCheck, error: tableError } = await supabase
            .from('notifications')
            .select('id')
            .limit(1);

          if (tableError) {
            console.error('AuthStore: Notifications table not accessible:', tableError);
            // If table doesn't exist, just return empty notifications
            set({ notifications: [], unreadNotificationsCount: 0 });
            return;
          }

          // Try the full query with join
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:profiles!notifications_actor_id_fkey (
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
            console.error('AuthStore: Error fetching notifications with join:', error);
            // Fallback to simple query without join
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50);

            if (fallbackError) {
              console.error('AuthStore: Error with fallback notifications query:', fallbackError);
              return;
            }

            // For each notification, fetch the actor profile separately
            const notificationsWithActors = await Promise.all(
              (fallbackData || []).map(async (notification: any) => {
                const { data: actorData } = await supabase
                  .from('profiles')
                  .select('id, username, full_name, avatar_url')
                  .eq('id', notification.actor_id)
                  .single();

                return {
                  ...notification,
                  actor: actorData
                };
              })
            );

            const unreadCount = notificationsWithActors.filter((n: Notification) => !n.read).length;
            set({ 
              notifications: notificationsWithActors,
              unreadNotificationsCount: unreadCount
            });
            return;
          }

          const notifications = data || [];
          const unreadCount = notifications.filter((n: Notification) => !n.read).length;

          console.log(`AuthStore: Fetched ${notifications.length} notifications, ${unreadCount} unread`);
          set({ 
            notifications,
            unreadNotificationsCount: unreadCount
          });
        } catch (error) {
          console.error('AuthStore: Error fetching notifications:', error);
          // Set empty notifications on error
          set({ notifications: [], unreadNotificationsCount: 0 });
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          console.log('AuthStore: Marking notification as read:', notificationId);
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

          if (error) {
            console.error('AuthStore: Error marking notification as read:', error);
            return;
          }

          // Update local state
          set(state => ({
            notifications: state.notifications.map((n: Notification) => 
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1)
          }));
        } catch (error) {
          console.error('AuthStore: Error marking notification as read:', error);
        }
      },

      markAllNotificationsAsRead: async () => {
        const { user } = get();
        if (!user) return;

        try {
          console.log('AuthStore: Marking all notifications as read');
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

          if (error) {
            console.error('AuthStore: Error marking all notifications as read:', error);
            return;
          }

          // Update local state
          set(state => ({
            notifications: state.notifications.map((n: Notification) => ({ ...n, read: true })),
            unreadNotificationsCount: 0
          }));
        } catch (error) {
          console.error('AuthStore: Error marking all notifications as read:', error);
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
          console.log('AuthStore: Setting up realtime subscriptions for user:', user.id);
          
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
              async (payload: RealtimePayload) => {
                console.log('AuthStore: New notification received:', payload);
                
                // Fetch the complete notification with actor data
                const { data } = await supabase
                  .from('notifications')
                  .select(`
                    *,
                    actor:profiles!notifications_actor_id_fkey (
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
              (payload: RealtimePayload) => {
                console.log('AuthStore: Followers table changed:', payload);
                // This will help refresh follower counts and states in real-time
                // Components can listen to this via custom events or state updates
              }
            )
            .subscribe();

          console.log('AuthStore: Realtime subscriptions set up successfully');

          return () => {
            console.log('AuthStore: Unsubscribing from realtime subscriptions');
            notificationsSubscription.unsubscribe();
            followersSubscription.unsubscribe();
          };
        } catch (error) {
          console.error('AuthStore: Error setting up realtime subscriptions:', error);
          return () => {};
        }
      },

      createOrGetConversation: async (otherUserId: string) => {
        const { user } = get();
        if (!user) return { error: 'Not authenticated' };

        if (user.id === otherUserId) {
          return { error: 'Cannot create conversation with yourself' };
        }

        try {
          console.log('AuthStore: Creating/getting conversation between:', user.id, 'and', otherUserId);
          
          // Use the RPC function to find existing conversation
          const { data: existingConversation, error: rpcError } = await supabase
            .rpc('find_conversation_between_users', {
              user1_id: user.id,
              user2_id: otherUserId
            });

          if (!rpcError && existingConversation) {
            console.log('AuthStore: Found existing conversation:', existingConversation);
            return { conversationId: existingConversation };
          }

          if (rpcError && rpcError.code !== '42883') {
            console.error('AuthStore: RPC error:', rpcError);
            
            if (rpcError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to check existing conversations' };
          }

          console.log('AuthStore: No existing conversation found, creating new one');

          // Create new conversation
          const { data: newConversation, error: conversationError } = await supabase
            .from('conversations')
            .insert({
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (conversationError) {
            console.error('AuthStore: Error creating conversation:', conversationError);
            
            if (conversationError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to create conversation' };
          }

          console.log('AuthStore: Created new conversation:', newConversation.id);

          // Add both users as participants
          const { error: participantsError } = await supabase
            .from('conversation_participants')
            .insert([
              { conversation_id: newConversation.id, user_id: user.id },
              { conversation_id: newConversation.id, user_id: otherUserId },
            ]);

          if (participantsError) {
            console.error('AuthStore: Error adding participants:', participantsError);
            // Clean up the conversation if participants couldn't be added
            await supabase.from('conversations').delete().eq('id', newConversation.id);
            
            if (participantsError.message.includes('Failed to fetch')) {
              return { error: 'Network connection failed. Please check your internet connection and try again.' };
            }
            
            return { error: 'Failed to create conversation' };
          }

          console.log('AuthStore: Successfully created conversation with participants');
          return { conversationId: newConversation.id };
        } catch (error: any) {
          console.error('AuthStore: Error creating conversation:', error);
          
          if (error.message?.includes('Failed to fetch')) {
            return { error: 'Network connection failed. Please check your internet connection and try again.' };
          }
          
          return { error: error.message || 'Failed to create conversation' };
        }
      },

      setDatabaseError: (error: string | null) => {
        set({ databaseError: error });
      },

      clearDatabaseError: () => {
        set({ databaseError: null });
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
          console.log('AuthStore: Initializing auth state');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('AuthStore: Error getting session:', error);
            set({ isLoading: false });
            return;
          }

          if (session?.user) {
            console.log('AuthStore: Found existing session for user:', session.user.id);
            set({
              user: session.user,
              session,
              isAuthenticated: true,
            });

            try {
              await get().fetchProfile(session.user.id);
              await get().fetchNotifications();
            } catch (profileError) {
              console.error('AuthStore: Error fetching profile during initialization:', profileError);
              // Don't fail initialization if profile fetch fails
            }
          } else {
            console.log('AuthStore: No existing session found');
          }

          set({ isLoading: false });
          console.log('AuthStore: Auth initialization completed');
        } catch (error) {
          console.error('AuthStore: Error initializing auth:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (isWeb()) {
          return {
            getItem: (name: string) => {
              try {
                return localStorage.getItem(name);
              } catch {
                return null;
              }
            },
            setItem: (name: string, value: string) => {
              try {
                localStorage.setItem(name, value);
              } catch {
                // Ignore errors
              }
            },
            removeItem: (name: string) => {
              try {
                localStorage.removeItem(name);
              } catch {
                // Ignore errors
              }
            },
          };
        }
        return AsyncStorage;
      }),
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