import { useState, useEffect } from "react";

export type Classroom = {
  id: string;
  name: string;
  capacity: number;
  type: string;
  facilities: string[];
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

export function useGetClassrooms() {
  const [result, setResult] = useState<Classroom[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        // Get auth token first
        const token = await getAuthToken();
        
        // Use the token for the classrooms API call
        const response = await fetch(`${API_BASE_URL}/v1/classrooms/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch classrooms');
        }
        
        const data = await response.json();
        
        // Transform the API data to match our expected Classroom type
        const formattedClassrooms = data.map((classroom: any) => ({
          id: classroom.id || '',
          name: classroom.name || 'Classroom',
          capacity: classroom.capacity || 0,
          type: classroom.type || 'Standard',
          facilities: classroom.facilities ? classroom.facilities.split(',').map((f: string) => f.trim()) : [],
        }));
        
        setResult(formattedClassrooms);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching classrooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  return { loading, result, error };
}

// For backward compatibility with existing code that might use the getClassrooms function
export function getClassrooms(slug: string | string[] | undefined) {
  console.warn('getClassrooms is deprecated. Please use useGetClassrooms hook instead.');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAuthToken();
        
        // Modified to use the authenticated endpoint
        const response = await fetch(`${API_BASE_URL}/v1/classrooms/all?slug=${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch classrooms');
        }
        
        const data = await response.json();
        setResult(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug]);
  
  return { loading, result, error };
}
