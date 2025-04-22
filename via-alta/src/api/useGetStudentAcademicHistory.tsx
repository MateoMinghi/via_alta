import { useState, useEffect } from "react";
import { authenticatedRequest } from "@/lib/m2mAuth";

export interface CourseHistoryItem {
  grade_id: number | null;
  student_id: number;
  course_id: number;
  course_name: string;
  sep_id: string;
  sep_credits: string;
  grade_final: number | null;
  absence_final: number | null;
  cycle_id: number | null;
  cycle_code: string | null;
  grade_observations: string | null;
  course_semester: number;
}

interface AcademicHistoryResponse {
  data: CourseHistoryItem[];
  status: string;
  message: string | null;
}

export function useGetStudentAcademicHistory(ivdId: string | undefined) {
  const [academicHistory, setAcademicHistory] = useState<CourseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAcademicHistory = async () => {
      if (!ivdId) {
        setLoading(false);
        setError("Student IVD ID is required");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Using authenticatedRequest utility to handle auth and fetch data
        const response = await authenticatedRequest<AcademicHistoryResponse>(
          `/v1/students/academic_history?ivd_id=${ivdId}`
        );
        
        if (response.status !== "success") {
          throw new Error(response.message || "Failed to fetch academic history");
        }

        setAcademicHistory(response.data);
      } catch (err) {
        console.error("Error fetching academic history:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicHistory();
  }, [ivdId]);

  return { 
    academicHistory, 
    loading, 
    error 
  };
}