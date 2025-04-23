import { useState } from "react";

export interface ChangeRequestResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export function useScheduleChangeRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitChangeRequest = async (studentId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const response = await fetch('/api/schedule-change-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId,
          reason 
        }),
      });

      const data: ChangeRequestResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to submit change request");
      }

      setSuccess(true);
      return data;
    } catch (err) {
      console.error("Error submitting change request:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getChangeRequests = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/schedule-change-request?studentId=${studentId}`);
      const data: ChangeRequestResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch change requests");
      }

      return data.data;
    } catch (err) {
      console.error("Error fetching change requests:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    submitChangeRequest,
    getChangeRequests,
    loading, 
    error, 
    success
  };
}
