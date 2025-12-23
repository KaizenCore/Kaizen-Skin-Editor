import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function OAuthCallback() {
  const { handleCallback } = useAuthStore();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (processedRef.current) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check if this is an OAuth callback
    if (url.pathname === '/oauth/callback') {
      processedRef.current = true;

      if (error) {
        console.error('OAuth error:', error);
        // Clear URL and redirect to home
        window.history.replaceState({}, '', '/');
        return;
      }

      if (code && state) {
        // Handle the callback
        handleCallback(code, state).finally(() => {
          // Clear URL parameters and redirect to home
          window.history.replaceState({}, '', '/');
        });
      }
    }
  }, [handleCallback]);

  return null;
}
