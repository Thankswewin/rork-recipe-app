import * as React from 'react';
const { useState } = React;
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useErrorHandler, useAsyncOperation } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from '../ErrorDisplay';
import { useAuthStore } from '../../stores/authStore';

/**
 * Example component demonstrating the unified error handling system
 * This shows different ways to handle errors in the application
 */
export function ErrorHandlingExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Example 1: Using the error handler hook directly
  const { error: localError, handleError, clearError } = useErrorHandler();
  
  // Example 2: Using async operation hook
  const asyncOperation = async () => {
    // Simulate a long-running operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random failure
    if (Math.random() > 0.5) {
      throw new Error('Random operation failure');
    }
    
    return 'Async operation completed successfully';
  };
  
  const { execute, isLoading, error: asyncError } = useAsyncOperation(asyncOperation, []);
  
  // Example 3: Using store errors
  const { signIn, error: authError, clearError: clearAuthError } = useAuthStore();
  
  // Example 1: Manual error handling with local state
  const handleManualOperation = async () => {
    try {
      // Simulate an operation that might fail
      const response = await fetch('/api/some-endpoint');
      if (!response.ok) {
        throw new Error('Network request failed');
      }
      const data = await response.json();
      console.log('Success:', data);
    } catch (err) {
      handleError(err);
    }
  };
  
  // Example 2: Using async operation hook
  const handleAsyncOperation = () => {
    execute();
  };
  
  // Example 3: Using store method (already has error handling built-in)
  const handleLogin = async () => {
    if (!email || !password) {
      handleError(new Error('Email and password are required'));
      return;
    }
    
    await signIn(email, password);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error Handling Examples</Text>
      
      {/* Example 1: Local error handling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Local Error Handling</Text>
        {localError && (
          <ErrorDisplay 
            error={localError} 
            onDismiss={clearError}
            onRetry={handleManualOperation}
            compact
          />
        )}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleManualOperation}
        >
          <Text style={styles.buttonText}>Trigger Manual Operation</Text>
        </TouchableOpacity>
      </View>
      
      {/* Example 2: Async operation hook */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Async Operation Hook</Text>
        {asyncError && (
          <ErrorDisplay 
            error={asyncError} 
            onRetry={handleAsyncOperation}
            compact
          />
        )}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleAsyncOperation}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Trigger Async Operation'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Example 3: Store error handling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Store Error Handling</Text>
        {authError && (
          <ErrorDisplay 
            error={authError} 
            onDismiss={clearAuthError}
            onRetry={handleLogin}
            compact
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Test Login (Store Error)</Text>
        </TouchableOpacity>
      </View>
      
      {/* Error handling tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Handling Tips</Text>
        <Text style={styles.tipText}>• Use handleAsync for automatic error wrapping</Text>
        <Text style={styles.tipText}>• Store errors are automatically managed</Text>
        <Text style={styles.tipText}>• Always provide retry mechanisms when possible</Text>
        <Text style={styles.tipText}>• Clear errors when starting new operations</Text>
        <Text style={styles.tipText}>• Use appropriate error severity levels</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    fontSize: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});