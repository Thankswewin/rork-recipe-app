import * as React from 'react';
import { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorHandler, AppError, ErrorSeverity } from '../lib/error-handler';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  appError?: AppError;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error?: Error; appError?: AppError; retry: () => void }>;
  title?: string;
  showRetry?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = errorHandler.handle(error, {
      logToConsole: true,
      showToUser: true
    });
    return { hasError: true, error, appError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = errorHandler.handle(error, {
      logToConsole: true,
      details: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
    
    // Update state with processed error if not already set
    if (!this.state.appError) {
      this.setState({ appError });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, appError: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { appError } = this.state;
      const { fallback, title = 'Something went wrong', showRetry = true } = this.props;
      
      if (fallback) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent, { 
          error: this.state.error, 
          appError: appError, 
          retry: this.retry 
        });
      }

      const shouldShowRetry = showRetry && (appError?.retryable ?? true);
      const errorMessage = appError?.userMessage || this.state.error?.message || 'An unexpected error occurred';
      const actionText = appError?.action || 'Try Again';
      
      return React.createElement(SafeAreaView, 
        { style: [styles.container, this.getSeverityStyle(appError?.severity)] },
        React.createElement(View, { style: styles.content },
          React.createElement(Text, { style: styles.title }, title),
          React.createElement(Text, { style: styles.message }, errorMessage),
          
          appError?.code && React.createElement(Text, { style: styles.errorCode }, `Error Code: ${appError.code}`),
          
          shouldShowRetry && React.createElement(TouchableOpacity, 
            { 
              style: [styles.button, this.getButtonStyle(appError?.severity)], 
              onPress: this.retry
            },
            React.createElement(Text, { style: styles.buttonText }, actionText)
          ),
          
          appError?.severity === ErrorSeverity.CRITICAL && React.createElement(Text, 
            { style: styles.criticalNote },
            'If this problem persists, please contact support.'
          )
        )
      );
    }

    return this.props.children;
  }
  
  private getSeverityStyle(severity?: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return { backgroundColor: '#FFF5F5' };
      case ErrorSeverity.HIGH:
        return { backgroundColor: '#FFFBF0' };
      default:
        return {};
    }
  }
  
  private getButtonStyle(severity?: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return { backgroundColor: '#DC2626' };
      case ErrorSeverity.HIGH:
        return { backgroundColor: '#D97706' };
      default:
        return {};
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorCode: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  criticalNote: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});