import Cookies from 'js-cookie';

/**
 * Session heartbeat function to ensure authentication persists
 * This can be called periodically to ensure session stays active
 */
export async function checkSessionValidity(): Promise<boolean> {
  try {
    // Check with the server to validate session
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    if (!data.user) {
      return false;
    }
    
    // Refresh client-side cookie and localStorage
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    const userJson = JSON.stringify(data.user);
    
    Cookies.set('user', userJson, { 
      expires: expiryDate,
      path: '/',
      secure: window.location.protocol === 'https:'
    });
    
    localStorage.setItem('via_alta_user', userJson);
    
    return true;
  } catch (error) {
    console.error('Session check failed:', error);
    return false;
  }
}

/**
 * Initialize heartbeat to periodically check session validity
 * Call this function once at app initialization
 */
export function initSessionHeartbeat(intervalMinutes: number = 30): void {
  // Check immediately on initialization
  checkSessionValidity();
  
  // Then set up periodic checks
  const interval = intervalMinutes * 60 * 1000;
  setInterval(checkSessionValidity, interval);
}