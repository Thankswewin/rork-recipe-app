import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { errorHandler, handleAsync, AppError } from '../lib/error-handler';

// Safe platform detection
const isWeb = () => {
  try {
    return Platform.OS === 'web';
  } catch {
    return typeof window !== 'undefined';
  }
};

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

interface NotificationState {
  notifications: Notification[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  error: AppError | null;
  
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string, userId: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: Notification) => void;
  setupRealtimeSubscriptions: (userId: string) => Promise<() => void>;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadNotificationsCount: 0,
      isLoading: false,
      error: null,

      fetchNotifications: async (userId: string) => {
        if (!userId) return;
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('NotificationStore: Fetching notifications for user:', userId);
          
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
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) {
            console.error('NotificationStore: Error fetching notifications:', error);
            
            // Fallback: try to get notifications without actor data
            const { data: fallbackData } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(50);

            if (fallbackData) {
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
                unreadNotificationsCount: unreadCount,
                isLoading: false
              });
              return;
            }
          }

          const notifications = data || [];
          const unreadCount = notifications.filter((n: Notification) => !n.read).length;

          console.log(`NotificationStore: Fetched ${notifications.length} notifications, ${unreadCount} unread`);
          set({ 
            notifications,
            unreadNotificationsCount: unreadCount,
            isLoading: false
          });
        } catch (error) {
          console.error('NotificationStore: Error fetching notifications:', error);
          const appError = errorHandler.handle(error);
          set({ 
            notifications: [], 
            unreadNotificationsCount: 0,
            isLoading: false,
            error: appError
          });
        }
      },

      markNotificationAsRead: async (notificationId: string, userId: string) => {
        if (!userId) return;

        try {
          console.log('NotificationStore: Marking notification as read:', notificationId);
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

          if (error) {
            console.error('NotificationStore: Error marking notification as read:', error);
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
          console.error('NotificationStore: Error marking notification as read:', error);
          const appError = errorHandler.handle(error);
          set({ error: appError });
        }
      },

      markAllNotificationsAsRead: async (userId: string) => {
        if (!userId) return;

        try {
          console.log('NotificationStore: Marking all notifications as read');
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

          if (error) {
            console.error('NotificationStore: Error marking all notifications as read:', error);
            return;
          }

          // Update local state
          set(state => ({
            notifications: state.notifications.map((n: Notification) => ({ ...n, read: true })),
            unreadNotificationsCount: 0
          }));
        } catch (error) {
          console.error('NotificationStore: Error marking all notifications as read:', error);
          const appError = errorHandler.handle(error);
          set({ error: appError });
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

      setupRealtimeSubscriptions: async (userId: string) => {
        if (!userId) return () => {};

        try {
          console.log('NotificationStore: Setting up realtime subscriptions for user:', userId);
          
          // Subscribe to notifications for the current user
          const notificationsSubscription = supabase
            .channel('notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
              },
              async (payload: RealtimePayload) => {
                console.log('NotificationStore: New notification received:', payload);
                
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

          console.log('NotificationStore: Realtime subscriptions set up successfully');

          return () => {
            console.log('NotificationStore: Unsubscribing from realtime subscriptions');
            notificationsSubscription.unsubscribe();
          };
        } catch (error) {
          console.error('NotificationStore: Error setting up realtime subscriptions:', error);
          const appError = errorHandler.handle(error);
          set({ error: appError });
          return () => {};
        }
      },

      setError: (error: AppError | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'notification-storage',
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
        // Don't persist notifications as they should be fresh on each session
        // Only persist settings if any are added in the future
      }),
    }
  )
);