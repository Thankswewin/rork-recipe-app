import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import DatabaseSetupGuide from './DatabaseSetupGuide';

const DatabaseErrorHandler = () => {
  const { databaseError, clearDatabaseError } = useAuthStore();

  if (!databaseError) {
    return null;
  }

  return (
    <Modal
      visible={!!databaseError}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Database Setup Required</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={clearDatabaseError}
          >
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <DatabaseSetupGuide />
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={clearDatabaseError}
          >
            <Text style={styles.continueButtonText}>Continue Anyway</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatabaseErrorHandler;