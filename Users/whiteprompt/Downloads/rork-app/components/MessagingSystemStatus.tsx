import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { trpc } from '@/lib/trpc';

export const MessagingSystemStatus: React.FC = () => {
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const query = trpc.conversations.checkMessagingStatus.useQuery();

  useEffect(() => {
    if (query.data) {
      setStatus({ success: query.data.success, message: query.data.message });
    }
  }, [query.data]);

  if (query.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" />
        <Text style={styles.text}>Checking messaging system status...</Text>
      </View>
    );
  }

  if (query.error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.errorText]}>
          Error checking messaging status: {query.error.message}
        </Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <View style={[styles.container, !status.success && styles.errorContainer]}>
      <Text style={[styles.text, !status.success && styles.errorText]}>
        {status.message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
  },
  errorText: {
    color: '#D32F2F',
  },
});
