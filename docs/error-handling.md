# Unified Error Handling System

This document describes the unified error handling system implemented across the Rork Recipe App.

## Overview

The unified error handling system provides consistent error management across all stores, components, and services. It includes:

- **Centralized error classification and handling**
- **User-friendly error messages**
- **Consistent error display components**
- **Async operation wrappers**
- **Error boundaries for React components**

## Core Components

### 1. Error Handler (`lib/error-handler.ts`)

The main error handling utility that provides:

```typescript
// Error types and severity levels
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Main error interface
interface AppError {
  message: string;
  code: string;
  type: ErrorType;
  severity: ErrorSeverity;
  originalError?: unknown;
  timestamp: number;
  userMessage: string;
}
```

### 2. Error Display Component (`components/ErrorDisplay.tsx`)

A reusable component for displaying errors with consistent styling:

```typescript
interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}
```

### 3. Error Boundary (`components/ErrorBoundary.tsx`)

Updated to use the unified error handling system:

```typescript
// Catches JavaScript errors and displays user-friendly messages
// Integrates with the error handler for consistent error processing
```

### 4. Error Handler Hook (`hooks/useErrorHandler.ts`)

Custom React hooks for error handling:

```typescript
// Main error handler hook
const { error, setError, clearError, handleError } = useErrorHandler();

// Async operation wrapper
const { execute, loading, error } = useAsyncOperation();

// Form error handling
const { errors, setFieldError, clearFieldError } = useFormErrors();
```

## Store Integration

All Zustand stores have been updated to include:

### Error State
```typescript
interface StoreState {
  // ... other state
  error: AppError | null;
}
```

### Error Actions
```typescript
interface StoreActions {
  setError: (error: AppError | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}
```

### Async Method Wrapping
```typescript
// Before
someAsyncMethod: async () => {
  try {
    // ... async operation
  } catch (error) {
    console.error(error);
    // Manual error handling
  }
}

// After
someAsyncMethod: async () => {
  return handleAsync(async () => {
    // ... async operation
  }, (error) => {
    get().handleError(error);
    // Additional error handling if needed
  });
}
```

## Updated Stores

The following stores have been integrated with the unified error handling system:

1. **authStore.ts** - Authentication and user management
2. **chefAssistantStore.ts** - Chef assistant functionality
3. **unmuteStore.ts** - Voice chat with Unmute service
4. **voiceChatStore.ts** - Real-time voice chat

## Usage Examples

### 1. Using Error Handler in Components

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/ErrorDisplay';

function MyComponent() {
  const { error, handleError, clearError } = useErrorHandler();
  
  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (err) {
      handleError(err);
    }
  };
  
  return (
    <div>
      {error && (
        <ErrorDisplay 
          error={error} 
          onDismiss={clearError}
          onRetry={handleAction}
        />
      )}
      {/* ... rest of component */}
    </div>
  );
}
```

### 2. Using Async Operation Hook

```typescript
import { useAsyncOperation } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { execute, loading, error } = useAsyncOperation();
  
  const handleSubmit = () => {
    execute(async () => {
      await submitForm(data);
    });
  };
  
  return (
    <div>
      {error && <ErrorDisplay error={error} />}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}
```

### 3. Using Store Errors

```typescript
import { useAuthStore } from '@/stores/authStore';
import { ErrorDisplay } from '@/components/ErrorDisplay';

function LoginForm() {
  const { signIn, error, clearError } = useAuthStore();
  
  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };
  
  return (
    <div>
      {error && (
        <ErrorDisplay 
          error={error} 
          onDismiss={clearError}
          onRetry={() => handleLogin(email, password)}
        />
      )}
      {/* ... login form */}
    </div>
  );
}
```

## Error Types and Handling

### Network Errors
- Connection timeouts
- Server unavailable
- API rate limiting

### Authentication Errors
- Invalid credentials
- Session expired
- Permission denied

### Validation Errors
- Invalid input format
- Missing required fields
- Data constraints

### Database Errors
- Connection failures
- Query errors
- Data integrity issues

## Best Practices

1. **Always use the unified error handling system** instead of manual error handling
2. **Clear errors when appropriate** (e.g., when starting new operations)
3. **Provide retry mechanisms** for recoverable errors
4. **Use appropriate error severity levels** for proper user experience
5. **Log errors for debugging** while showing user-friendly messages
6. **Test error scenarios** to ensure proper error handling

## Migration Guide

For existing code that needs to be migrated:

1. **Import the error handler**: `import { errorHandler, handleAsync } from '@/lib/error-handler'`
2. **Add error state to interfaces**: `error: AppError | null`
3. **Add error actions**: `setError`, `clearError`, `handleError`
4. **Wrap async operations**: Use `handleAsync` wrapper
5. **Update error displays**: Use `ErrorDisplay` component
6. **Update error boundaries**: Ensure they use the unified system

## Future Enhancements

- **Error reporting service integration** (e.g., Sentry)
- **Error analytics and monitoring**
- **Offline error handling**
- **Error recovery strategies**
- **Internationalization for error messages**