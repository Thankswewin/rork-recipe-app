import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, setUser, initialize, fetchProfile } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any;
    
    const initializeAuth = async () => {
      try {
        // Dynamically import supabase to avoid immediate execution
        const { supabase } = await import('@/lib/supabase');
        
        // Initialize auth state
        await initialize();

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              // Fetch user profile when signed in
              await fetchProfile(session.user.id);
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