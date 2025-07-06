import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { AlertTriangle, Settings, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import DatabaseSetupGuide from './DatabaseSetupGuide';

export default function DatabaseErrorHandler() {
  const { colors } = useTheme();
  const { databaseError, clearDatabaseError } = useAuthStore();
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  if (!databaseError) {
    return null;
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
        <View style={styles.content}>
          <AlertTriangle size={20} color="#DC2626" />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: '#DC2626' }]}>Database Setup Required</Text>
            <Text style={[styles.message, { color: '#7F1D1D' }]}>{databaseError}</Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.setupButton, { backgroundColor: '#DC2626' }]}
            onPress={() => setShowSetupGuide(true)}
          >
            <Settings size={16} color="white" />
            <Text style={styles.setupButtonText}>Setup Database</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.dismissButton, { borderColor: '#DC2626' }]}
            onPress={clearDatabaseError}
          >
            <Text style={[styles.dismissButtonText, { color: '#DC2626' }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showSetupGuide}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Database Setup</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSetupGuide(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <DatabaseSetupGuide />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  setupButton: {
    // backgroundColor set inline
  },
  setupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});