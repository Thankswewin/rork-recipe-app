import { useState, useCallback, useEffect } from 'react';
import { errorHandler, AppError, addErrorListener } from '../lib/error-handler';
import { useAuthStore } from '../stores/authStore';

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  logErrors?: boolean;
  clearOnSuccess?: boolean;
  retryLimit?: number;
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isLoading: boolean;
  retryCount: number;
  
  // Error management
  setError: (error: any) => void;
  clearError: () => void;
  handleError: (error: any) => AppError;
  
  // Async operation wrapper
  executeAsync: <T>(operation: () => Promise<T>, options?: { showLoading?: boolean }) => Promise<{ data?: T; error?: AppError }>;
  
  // Retry functionality
  retry: () => Promise<void>;
  canRetry: boolean;
  
  // Loading state
  setLoading: (loading: boolean) => void;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const {
    showToast = false,
    logErrors = true,
    clearOnSuccess = true,
    retryLimit = 3
  } = options;
  
  const [error, setErrorState] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastOperation, setLastOperation] = useState<(() => Promise<any>) | null>(null);
  
  const authStore = useAuthStore();

  // Listen to global errors
  useEffect(() => {
    const unsubscribe = addErrorListener((globalError) => {
      if (logErrors) {
        console.log('Global error received:', globalError);
      }
      // Optionally handle global errors here
    });
    
    return unsubscribe;
  }, [logErrors]);

  const setError = useCallback((error: any) => {
    if (error) {
      const appError = errorHandler.handle(error, {
        logToConsole: logErrors,
        showToUser: showToast
      });
      setErrorState(appError);
      
      // Also set error in auth store for global access
      authStore.setError(appError);
    } else {
      setErrorState(null);
      authStore.clearError();
    }
  }, [logErrors, showToast, authStore]);

  const clearError = useCallback(() => {
    setErrorState(null);
    authStore.clearError();
    setRetryCount(0);
    setLastOperation(null);
  }, [authStore]);

  const handleError = useCallback((error: any) => {
    const appError = errorHandler.handle(error, {
      logToConsole: logErrors,
      showToUser: showToast
    });
    setErrorState(appError);
    authStore.setError(appError);
    return appError;
  }, [logErrors, showToast, authStore]);

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationOptions: { showLoading?: boolean } = {}
  ): Promise<{ data?: T; error?: AppError }> => {
    const { showLoading = true } = operationOptions;
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    if (clearOnSuccess) {
      clearError();
    }
    
    // Store operation for retry functionality
    setLastOperation(() => operation);
    
    try {
      const data = await operation();
      
      if (showLoading) {
        setIsLoading(false);
      }
      
      if (clearOnSuccess) {
        clearError();
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
      return { data };
    } catch (err) {
      const appError = handleError(err);
      
      if (showLoading) {
        setIsLoading(false);
      }
      
      return { error: appError };
    }
  }, [clearOnSuccess, clearError, handleError]);

  const retry = useCallback(async (): Promise<void> => {
    if (!lastOperation || !error?.retryable || retryCount >= retryLimit) {
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    const { error: retryError } = await executeAsync(lastOperation, { showLoading: true });
    
    if (retryError) {
      console.log(`Retry ${retryCount + 1}/${retryLimit} failed:`, retryError.message);
    } else {
      console.log(`Retry ${retryCount + 1} succeeded`);
    }
  }, [lastOperation, error, retryCount, retryLimit, executeAsync]);

  const canRetry = Boolean(
    lastOperation && 
    error?.retryable && 
    retryCount < retryLimit
  );

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    error,
    isLoading,
    retryCount,
    setError,
    clearError,
    handleError,
    executeAsync,
    retry,
    canRetry,
    setLoading
  };
}

// Specialized hooks for common use cases

export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: any[] = [],
  options: UseErrorHandlerOptions = {}
) {
  const errorHandler = useErrorHandler(options);
  const [data, setData] = useState<T | null>(null);
  
  const execute = useCallback(async () => {
    const result = await errorHandler.executeAsync(operation);
    if (result.data !== undefined) {
      setData(result.data);
    }
    return result;
  }, [operation, errorHandler]);
  
  useEffect(() => {
    execute();
  }, dependencies);
  
  return {
    data,
    ...errorHandler,
    execute
  };
}

export function useFormErrorHandler() {
  const errorHandler = useErrorHandler({
    showToast: false,
    clearOnSuccess: true
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  }, []);
  
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);
  
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);
  
  const validateField = useCallback((field: string, value: any, validator: (value: any) => string | null) => {
    const error = validator(value);
    if (error) {
      setFieldError(field, error);
      return false;
    } else {
      clearFieldError(field);
      return true;
    }
  }, [setFieldError, clearFieldError]);
  
  return {
    ...errorHandler,
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    validateField,
    hasFieldErrors: Object.keys(fieldErrors).length > 0
  };
}

export default useErrorHandler;