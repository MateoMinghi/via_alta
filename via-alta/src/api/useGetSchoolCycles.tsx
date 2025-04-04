import { useState, useEffect } from 'react';

export interface SchoolCycle {
  id: number;
  code: string;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResponseType {
  result: SchoolCycle[] | null;
  loading: boolean;
  error: string | null;
}

export const useGetSchoolCycles = (): ResponseType => {
  const [result, setResult] = useState<SchoolCycle[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolCycles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/school-cycles');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Error fetching school cycles');
        }

        setResult(data.data);
      } catch (err) {
        console.error('Error in useGetSchoolCycles:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolCycles();
  }, []);

  return { result, loading, error };
};

export default useGetSchoolCycles;