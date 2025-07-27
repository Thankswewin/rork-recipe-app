import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { supabase, testSupabaseConnection } from '@/lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, setUser, initialize, fetchProfile } = useAuthStore();
  const { setupRealtimeSubscriptions } = useNotificationStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    let subscription: any;
    let unsubscribeRealtime: (() => void) | null = null;
    
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Starting initialization...');
        setConnectionStatus('connecting');
        
        // Test Supabase connection first
        const connectionTest = await testSupabaseConnection();
        if (!connectionTest.success) {
          console.error('AuthProvider: Connection test failed:', connectionTest.error);
          setError(connectionTest.error || 'Failed to connect to server');
          setConnectionStatus('error');
          setIsInitialized(true); // Still allow app to continue
          return;
        }
        
        console.log('AuthProvider: Connection test successful');
        setConnectionStatus('connected');
        
        // Initialize auth state
        await initialize();

        // Set up realtime subscriptions
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          unsubscribeRealtime = await setupRealtimeSubscriptions(user.id);
        }

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('AuthProvider: Auth state changed:', event, session?.user?.id);
            
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              // Fetch user profile when signed in
              try {
                await fetchProfile(session.user.id);
                
                // Set up realtime subscriptions for the new user
                if (unsubscribeRealtime) {
                  unsubscribeRealtime();
                }
                unsubscribeRealtime = await setupRealtimeSubscriptions(session.user.id);
              } catch (profileError) {
                console.error('AuthProvider: Error fetching profile:', profileError);
                // Don't fail initialization if profile fetch fails
              }
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
        console.log('AuthProvider: Initialization completed successfully');
      } catch (err: any) {
        console.error('AuthProvider: Failed to initialize auth:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to initialize authentication';
        if (err.message?.includes('Failed to fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (err.message?.includes('Invalid API key')) {
          errorMessage = 'Authentication configuration error. Please contact support.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setConnectionStatus('error');
        setIsInitialized(true); // Still set to true to render children
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleaning up subscriptions');
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Loading...'}
        </Text>
        {connectionStatus === 'connecting' && (
          <Text style={styles.subText}>Establishing secure connection</Text>
        )}
      </View>
    );
  }

  if (error && connectionStatus === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubText}>
          The app will continue to work with limited functionality.
        </Text>
        {children}
      </View>
    );
  }

  if (error) {
    console.warn('AuthProvider: Auth initialization error (continuing anyway):', error);
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
});