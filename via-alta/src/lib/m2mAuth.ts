// M2M Authentication utility for Via Diseño API access

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'enrollments_app';
const CLIENT_SECRET = 'VgwMa3qPS85rrtDHt72mhKejQfTQnNth';

/**
 * Gets an authentication token for machine-to-machine communication with Via Diseño API
 */
export async function getAuthToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('M2M authentication failed:', errorData);
    throw new Error('Failed to authenticate with the API');
  }
  
  const data = await response.json();
  return data.token;
}

/**
 * Make an authenticated request to the Via Diseño API
 */
export async function authenticatedRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get auth token
    const token = await getAuthToken();
    
    // Add authorization header to provided options
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    // Make the authenticated request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
}