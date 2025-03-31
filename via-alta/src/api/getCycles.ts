// Fetch academic periods (cycles) from the API
import { useState, useEffect } from "react";

// Define the structure of a cycle (academic period)
export type Cycle = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

// API base URL
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';

// Hook to get authentication token
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: 'payments_app',
      client_secret: 'a_client_secret',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate');
  }

  const data = await response.json();
  return data.token;
}

// Custom hook to fetch academic cycles
export function useGetCycles() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setLoading(true);
        
        // Get auth token
        const token = await getAuthToken();
        
        // Fetch cycles data
        const response = await fetch(`${API_BASE_URL}/v1/school_cycles/index`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch academic periods');
        }
        
        const data = await response.json();
        setCycles(data.data || []);
      } catch (err) {
        console.error("Error fetching academic periods:", err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCycles();
  }, []);
  
  return { cycles, loading, error };
}

// Function to get the current active cycle
export function useGetCurrentCycle() {
  const { cycles, loading, error } = useGetCycles();
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  
  useEffect(() => {
    if (!loading && cycles.length > 0) {
      const active = cycles.find(cycle => cycle.is_active);
      setCurrentCycle(active || cycles[0]); // Use the active cycle or first one if none is active
    }
  }, [cycles, loading]);
  
  return { currentCycle, loading, error };
}