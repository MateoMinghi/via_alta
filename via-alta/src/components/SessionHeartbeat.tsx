'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initSessionHeartbeat } from '@/lib/session-heartbeat';

/**
 * This component initializes the session heartbeat mechanism
 * and handles visibility changes to check session when tab becomes visible again
 */
export default function SessionHeartbeat() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize heartbeat for authenticated users
      initSessionHeartbeat(15); // Check every 15 minutes
      
      // Add visibility change listener
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // When tab becomes visible again, check session validity
          import('@/lib/session-heartbeat').then(({ checkSessionValidity }) => {
            checkSessionValidity();
          });
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Also check when the browser is online again after being offline
      const handleOnline = () => {
        import('@/lib/session-heartbeat').then(({ checkSessionValidity }) => {
          checkSessionValidity();
        });
      };
      
      window.addEventListener('online', handleOnline);
      
      // Cleanup
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
      };
    }
  }, [isAuthenticated]);

  // This component doesn't render anything
  return null;
}