// =====================================================
// UNIFIED ERROR HANDLING SYSTEM
// =====================================================
// Centralized error handling for consistent user experience

import { Platform } from 'react-native';

// =====================================================
// ERROR TYPES AND INTERFACES
// =====================================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  stack?: string;
  retryable: boolean;
  action?: string;
}

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
  retryable?: boolean;
  customAction?: string;
  details?: Record<string, any>;
}

// =====================================================
// ERROR CLASSIFICATION
// =====================================================

class ErrorClassifier {
  static classify(error: any): { type: ErrorType; severity: ErrorSeverity } {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || error?.status;

    // Network errors
    if (
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('connection failed') ||
      message.includes('timeout') ||
      code === 'NETWORK_ERROR'
    ) {
      return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM };
    }

    // Authentication errors
    if (
      message.includes('invalid login credentials') ||
      message.includes('email not confirmed') ||
      message.includes('invalid token') ||
      message.includes('session expired') ||
      code === 401
    ) {
      return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.HIGH };
    }

    // Authorization errors
    if (
      message.includes('insufficient privileges') ||
      message.includes('access denied') ||
      message.includes('forbidden') ||
      code === 403
    ) {
      return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.HIGH };
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid email') ||
      message.includes('password should be') ||
      message.includes('required field') ||
      code === 400
    ) {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
    }

    // Database errors
    if (
      message.includes('relation') && message.includes('does not exist') ||
      message.includes('database error') ||
      message.includes('constraint violation') ||
      message.includes('duplicate key') ||
      code === '42P01' || code === '23505'
    ) {
      return { type: ErrorType.DATABASE, severity: ErrorSeverity.CRITICAL };
    }

    // Storage errors
    if (
      message.includes('bucket not found') ||
      message.includes('file not found') ||
      message.includes('storage') ||
      message.includes('upload failed')
    ) {
      return { type: ErrorType.STORAGE, severity: ErrorSeverity.MEDIUM };
    }

    // Rate limiting
    if (
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      code === 429
    ) {
      return { type: ErrorType.RATE_LIMIT, severity: ErrorSeverity.MEDIUM };
    }

    // Server errors
    if (code >= 500 && code < 600) {
      return { type: ErrorType.SERVER, severity: ErrorSeverity.HIGH };
    }

    // Client errors
    if (code >= 400 && code < 500) {
      return { type: ErrorType.CLIENT, severity: ErrorSeverity.MEDIUM };
    }

    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM };
  }
}

// =====================================================
// USER-FRIENDLY MESSAGE GENERATOR
// =====================================================

class MessageGenerator {
  static generateUserMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Network connection failed. Please check your internet connection and try again.';
      
      case ErrorType.AUTHENTICATION:
        if (error.message.includes('invalid login credentials')) {
          return 'Invalid email or password. Please check your credentials and try again.';
        }
        if (error.message.includes('email not confirmed')) {
          return 'Please check your email and click the confirmation link before signing in.';
        }
        if (error.message.includes('session expired')) {
          return 'Your session has expired. Please sign in again.';
        }
        return 'Authentication failed. Please sign in again.';
      
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      
      case ErrorType.VALIDATION:
        if (error.message.includes('email')) {
          return 'Please enter a valid email address.';
        }
        if (error.message.includes('password')) {
          return 'Password must be at least 6 characters long.';
        }
        return 'Please check your input and try again.';
      
      case ErrorType.DATABASE:
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          return 'Database setup required. Please run the database migration.';
        }
        if (error.message.includes('duplicate')) {
          return 'This item already exists. Please try a different value.';
        }
        return 'Database error occurred. Please try again or contact support.';
      
      case ErrorType.STORAGE:
        if (error.message.includes('bucket not found')) {
          return 'File storage not configured. Please contact support.';
        }
        if (error.message.includes('too large')) {
          return 'File is too large. Please use a smaller file.';
        }
        if (error.message.includes('not allowed')) {
          return 'File type not allowed. Please use a supported file format.';
        }
        return 'File upload failed. Please try again.';
      
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a few minutes and try again.';
      
      case ErrorType.SERVER:
        return 'Server error occurred. Please try again later.';
      
      case ErrorType.CLIENT:
        return 'Request failed. Please check your input and try again.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  static generateAction(error: AppError): string | undefined {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Check connection and retry';
      
      case ErrorType.AUTHENTICATION:
        return 'Sign in again';
      
      case ErrorType.DATABASE:
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          return 'Run database setup';
        }
        return 'Contact support';
      
      case ErrorType.RATE_LIMIT:
        return 'Wait and retry';
      
      default:
        return error.retryable ? 'Retry' : undefined;
    }
  }
}

// =====================================================
// MAIN ERROR HANDLER
// =====================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: AppError) => void)[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle any error and convert it to a standardized AppError
   */
  handle(error: any, options: ErrorHandlerOptions = {}): AppError {
    const { type, severity } = ErrorClassifier.classify(error);
    
    const appError: AppError = {
      type,
      severity,
      message: error?.message || 'Unknown error',
      userMessage: '',
      code: error?.code || error?.status,
      details: {
        originalError: error,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        ...error?.details,
        ...options.details
      },
      timestamp: new Date().toISOString(),
      stack: error?.stack,
      retryable: options.retryable ?? this.isRetryable(type),
      action: options.customAction
    };

    // Generate user-friendly message
    appError.userMessage = MessageGenerator.generateUserMessage(appError);
    
    // Generate suggested action if not provided
    if (!appError.action) {
      appError.action = MessageGenerator.generateAction(appError);
    }

    // Log error if requested
    if (options.logToConsole !== false) {
      this.logError(appError);
    }

    // Notify listeners
    this.notifyListeners(appError);

    return appError;
  }

  /**
   * Handle async operations with automatic error handling
   */
  async handleAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<{ data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      const appError = this.handle(error, options);
      return { error: appError };
    }
  }

  /**
   * Wrap a function with error handling
   */
  wrap<T extends (...args: any[]) => any>(
    fn: T,
    options: ErrorHandlerOptions = {}
  ): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error) => {
            throw this.handle(error, options);
          });
        }
        return result;
      } catch (error) {
        throw this.handle(error, options);
      }
    }) as T;
  }

  /**
   * Add error listener for global error handling
   */
  addListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  private isRetryable(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.SERVER,
      ErrorType.RATE_LIMIT
    ].includes(type);
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, error.details);
        break;
      case 'warn':
        console.warn(logMessage, error.details);
        break;
      default:
        console.log(logMessage, error.details);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'log';
    }
  }

  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Quick error handling for async operations
 */
export const handleAsync = errorHandler.handleAsync.bind(errorHandler);

/**
 * Quick error handling for any error
 */
export const handleError = errorHandler.handle.bind(errorHandler);

/**
 * Wrap function with error handling
 */
export const withErrorHandling = errorHandler.wrap.bind(errorHandler);

/**
 * Add global error listener
 */
export const addErrorListener = errorHandler.addListener.bind(errorHandler);

// =====================================================
// REACT HOOK FOR ERROR HANDLING
// =====================================================

import { useState, useCallback } from 'react';

export interface UseErrorHandlerReturn {
  error: AppError | null;
  setError: (error: any) => void;
  clearError: () => void;
  handleAsync: <T>(operation: () => Promise<T>) => Promise<{ data?: T; error?: AppError }>;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<AppError | null>(null);
  const [isLoading, setLoading] = useState(false);

  const setError = useCallback((error: any) => {
    if (error) {
      const appError = errorHandler.handle(error);
      setErrorState(appError);
    } else {
      setErrorState(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<{ data?: T; error?: AppError }> => {
    setLoading(true);
    clearError();
    
    try {
      const data = await operation();
      setLoading(false);
      return { data };
    } catch (err) {
      const appError = errorHandler.handle(err);
      setError(appError);
      setLoading(false);
      return { error: appError };
    }
  }, [setError, clearError]);

  return {
    error,
    setError,
    clearError,
    handleAsync: handleAsyncOperation,
    isLoading,
    setLoading
  };
}

// =====================================================
// ERROR BOUNDARY HELPERS
// =====================================================

export function createErrorBoundaryFallback(
  title: string = 'Something went wrong',
  showRetry: boolean = true
) {
  return ({ error, retry }: { error?: Error; retry: () => void }) => {
    const appError = error ? errorHandler.handle(error) : null;
    
    return {
      title,
      message: appError?.userMessage || 'An unexpected error occurred',
      action: showRetry && appError?.retryable ? 'Retry' : undefined,
      onAction: retry,
      severity: appError?.severity || ErrorSeverity.MEDIUM
    };
  };
}

// =====================================================
// EXPORTS
// =====================================================

// All exports are already declared above