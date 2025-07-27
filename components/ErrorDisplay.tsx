import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppError, ErrorSeverity, ErrorType } from '../lib/error-handler';

interface ErrorDisplayProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDismiss = true,
  compact = false
}) => {
  if (!error) return null;

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '#DC2626';
      case ErrorSeverity.HIGH:
        return '#D97706';
      case ErrorSeverity.MEDIUM:
        return '#CA8A04';
      case ErrorSeverity.LOW:
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const getSeverityBackgroundColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '#FEF2F2';
      case ErrorSeverity.HIGH:
        return '#FFFBEB';
      case ErrorSeverity.MEDIUM:
        return '#FEFCE8';
      case ErrorSeverity.LOW:
        return '#F0FDF4';
      default:
        return '#F9FAFB';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '⚡';
      case ErrorSeverity.LOW:
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const handleShowDetails = () => {
    Alert.alert(
      'Error Details',
      `Type: ${error.type}\nCode: ${error.code || 'N/A'}\nTimestamp: ${new Date(error.timestamp).toLocaleString()}\n\nTechnical Details:\n${error.message}`,
      [{ text: 'OK' }]
    );
  };

  if (compact) {
    return (
      <View style={[
        styles.compactContainer,
        { backgroundColor: getSeverityBackgroundColor(error.severity) }
      ]}>
        <Text style={styles.compactIcon}>{getSeverityIcon(error.severity)}</Text>
        <Text style={[
          styles.compactMessage,
          { color: getSeverityColor(error.severity) }
        ]}>
          {error.userMessage}
        </Text>
        {onRetry && error.retryable && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetryButton}>
            <Text style={styles.compactRetryText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: getSeverityBackgroundColor(error.severity) }
    ]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getSeverityIcon(error.severity)}</Text>
        <View style={styles.headerText}>
          <Text style={[
            styles.title,
            { color: getSeverityColor(error.severity) }
          ]}>
            {error.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Error
          </Text>
          {error.code && (
            <Text style={styles.code}>Code: {error.code}</Text>
          )}
        </View>
      </View>
      
      <Text style={styles.message}>{error.userMessage}</Text>
      
      <View style={styles.actions}>
        {onRetry && error.retryable && (
          <TouchableOpacity 
            style={[
              styles.button,
              styles.retryButton,
              { backgroundColor: getSeverityColor(error.severity) }
            ]} 
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>{error.action || 'Retry'}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.detailsButton]} 
          onPress={handleShowDetails}
        >
          <Text style={[styles.buttonText, { color: getSeverityColor(error.severity) }]}>Details</Text>
        </TouchableOpacity>
        
        {showDismiss && onDismiss && (
          <TouchableOpacity 
            style={[styles.button, styles.dismissButton]} 
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error.severity === ErrorSeverity.CRITICAL && (
        <Text style={styles.criticalNote}>
          If this problem persists, please contact support with the error code above.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  icon: {
    fontSize: 24,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  code: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  message: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  compactMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  retryButton: {
    // backgroundColor set dynamically
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
  },
  compactRetryButton: {
    padding: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  compactRetryText: {
    fontSize: 16,
    color: '#6B7280',
  },
  criticalNote: {
    fontSize: 12,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ErrorDisplay;