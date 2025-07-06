import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, Database, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { trpc } from '@/lib/trpc';

interface MessagingSystemStatusProps {
  onRetry?: () => void;
}

export default function MessagingSystemStatus({ onRetry }: MessagingSystemStatusProps) {
  const { colors } = useTheme();
  
  const { data: status, isLoading, error, mutate: refetch } = trpc.conversations.checkMessagingStatus.useMutation({
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleRetry = () => {
    refetch();
    onRetry?.();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Database size={24} color={colors.muted} />
        <Text style={[styles.title, { color: colors.text }]}>Checking messaging system...</Text>
      </View>
    );
  }

  if (status?.success) {
    return (
      <View style={[styles.container, { backgroundColor: '#10B981', borderColor: '#059669' }]}>
        <CheckCircle size={24} color="white" />
        <Text style={[styles.title, { color: 'white' }]}>Messaging system is ready</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
      <AlertTriangle size={24} color="#D97706" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#92400E' }]}>Messaging System Setup Required</Text>
        <Text style={[styles.subtitle, { color: '#A16207' }]}>
          {status?.message || error?.message || 'The messaging system needs to be configured. Please run the database setup script.'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#F59E0B' }]}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Check Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});