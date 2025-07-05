import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
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
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        addResult(`Connection test failed: ${error.message}`);
      } else {
        addResult('Connection test successful');
      }

      // Test authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        addResult(`User authenticated: ${session.user.id}`);
      } else {
        addResult('No active session');
      }

      // Test followers table access
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select('*')
        .limit(1);
      
      if (followersError) {
        addResult(`Followers table error: ${followersError.message}`);
      } else {
        addResult('Followers table accessible');
      }

    } catch (error: any) {
      addResult(`Test error: ${error.message}`);
    }
  };

  const testFollowInsert = async () => {
    if (!user) {
      addResult('No user logged in');
      return;
    }

    addResult('Testing follow insert...');
    
    try {
      // Try to insert a test follow relationship (will fail if user tries to follow themselves)
      const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
      
      const { data, error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: testUserId,
        })
        .select();

      if (error) {
        addResult(`Follow insert error: ${error.message} (Code: ${error.code})`);
      } else {
        addResult('Follow insert successful (cleaning up...)');
        // Clean up the test record
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', testUserId);
      }
    } catch (error: any) {
      addResult(`Follow test error: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Supabase Debug</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={testConnection}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={testFollowInsert}
        >
          <Text style={styles.buttonText}>Test Follow</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.muted }]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={[styles.resultText, { color: colors.text }]}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  results: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 10,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});