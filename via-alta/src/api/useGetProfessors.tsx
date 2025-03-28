import { useState, useEffect } from "react";

export type Professor = {
    id: number;
    name: string;
    department: string;
};

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

// Function to get authentication token
async function getAuthToken(): Promise<string> {
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
    throw new Error('Failed to authenticate');
  }
  
  const data = await response.json();
  return data.token;
}

export function useGetProfessors() {
    const [result, setResult] = useState<Professor[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        
        const fetchProfessors = async () => {
            try {
                // Get auth token first
                const token = await getAuthToken();
                
                // Use the token for the professors API call
                const response = await fetch(`${API_BASE_URL}/v1/users/all?type=Users::Professor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch professors');
                }
                
                const data = await response.json();
                
                // Transform the API data to match our expected Professor type
                const formattedProfessors = data.map((professor: any) => ({
                    id: professor.id || 0,
                    name: `${professor.title || ''} ${professor.first_name || ''} ${professor.last_name || ''}`.trim(),
                    department: professor.department || 'General',
                }));
                
                setResult(formattedProfessors);
            } catch (error: any) {
                setError(error.message);
                console.error("Error fetching professors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfessors();
    }, []);

    return { loading, result, error };
}