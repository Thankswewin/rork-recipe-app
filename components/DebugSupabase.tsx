import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { supabase, testSupabaseConnection, testSupabaseAuth } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

export default function DebugSupabase() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { user } = useAuthStore();
  const { colors } = useTheme();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    addResult('Testing Supabase connection...');
    
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        addResult('✅ Connection test successful');
      } else {
        addResult(`❌ Connection test failed: ${result.error}`);
      }

      // Test auth
      const authResult = await testSupabaseAuth();
      if (authResult.success) {
        addResult(`✅ Auth test successful (session: ${authResult.hasSession ? 'yes' : 'no'})`);
      } else {
        addResult(`❌ Auth test failed: ${authResult.error}`);
      }

    } catch (error: any) {
      addResult(`❌ Test error: ${error.message}`);
    }
  };

  const testTables = async () => {
    addResult('Testing database tables...');
    
    const tables = ['profiles', 'recipes', 'favorites', 'followers', 'notifications', 'conversations', 'messages', 'conversation_participants'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          addResult(`❌ ${table}: ${error.message}`);
        } else {
          addResult(`✅ ${table}: accessible`);
        }
      } catch (error: any) {
        addResult(`❌ ${table}: ${error.message}`);
      }
    }
  };

  const testAuth = async () => {
    addResult('Testing authentication...');
    
    try {
      // Test current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addResult(`❌ Session error: ${sessionError.message}`);
      } else {
        addResult(`✅ Session: ${session ? 'active' : 'none'}`);
        if (session) {
          addResult(`   User ID: ${session.user.id}`);
          addResult(`   Email: ${session.user.email}`);
        }
      }

      // Test profile access if user is logged in
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          addResult(`❌ Profile error: ${profileError.message}`);
        } else {
          addResult(`✅ Profile found: ${profile.full_name || profile.email}`);
        }
      }

    } catch (error: any) {
      addResult(`❌ Auth test error: ${error.message}`);
    }
  };

  const testSignUp = async () => {
    addResult('Testing sign up process...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      });

      if (error) {
        addResult(`❌ Sign up error: ${error.message}`);
      } else {
        addResult(`✅ Sign up successful: ${data.user?.id}`);
        
        // Clean up - sign out the test user
        await supabase.auth.signOut();
        addResult('   Test user signed out');
      }
    } catch (error: any) {
      addResult(`❌ Sign up test error: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Supabase Debug Console</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={testConnection}
        >
          <Text style={styles.buttonText}>Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={testTables}
        >
          <Text style={styles.buttonText}>Tables</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={testAuth}
        >
          <Text style={styles.buttonText}>Auth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={testSignUp}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.muted }]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {testResults.map((result, index) => (
          <Text key={index} style={[styles.resultText, { color: colors.text }]}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  results: {
    flex: 1,
    maxHeight: 250,
  },
  resultText: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
});