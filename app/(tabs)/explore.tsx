// This file has been removed - functionality moved to search.tsx
// Redirect to search if someone tries to access this route
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function ExploreRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/search');
  }, []);

  return null;
}