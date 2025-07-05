import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, setUser, initialize, fetchProfile, setupRealtimeSubscriptions } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any;
    let unsubscribeRealtime: (() => void) | null = null;
    
    const initializeAuth = async () => {
      try {
        // Dynamically import supabase to avoid immediate execution
        const { supabase } = await import('@/lib/supabase');
        
        // Initialize auth state
        await initialize();

        // Set up realtime subscriptions
        unsubscribeRealtime = await setupRealtimeSubscriptions();

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              // Fetch user profile when signed in
              await fetchProfile(session.user.id);
              
              // Set up realtime subscriptions for the new user
              if (unsubscribeRealtime) {
                unsubscribeRealtime();
              }
              unsubscribeRealtime = await setupRealtimeSubscriptions();
            } else {
              // Clean up subscriptions when signed out
              if (unsubscribeRealtime) {
                unsubscribeRealtime();
                unsubscribeRealtime = null;
              }
            }
          }
        );
        
        subscription = data.subscription;
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Failed to initialize auth:', err);
        setError(err.message);
        setIsInitialized(true); // Still set to true to render children
      }
    };

    initializeAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    console.warn('Auth initialization error (continuing anyway):', error);
  }

  return <>{children}</>;
}