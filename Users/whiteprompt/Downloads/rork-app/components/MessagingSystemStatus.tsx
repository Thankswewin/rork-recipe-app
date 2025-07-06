import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export const MessagingSystemStatus: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Messaging system has been disabled
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
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
});