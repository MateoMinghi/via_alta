import { useState, useEffect } from "react";

export interface ScheduleItem {
  IdGrupo: number;
  MateriaNombre: string;
  ProfesorNombre: string;
  Semestre: number;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
  idsalon?: number;
  TipoSalon?: string;
}

export interface StudentScheduleResponse {
  success: boolean;
  data: ScheduleItem[];
  isIndividual: boolean;
  message?: string;
  error?: string;
}

export function useGetStudentSchedule(studentId: string | undefined, semester: number | undefined) {
  const [result, setResult] = useState<ScheduleItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIndividual, setIsIndividual] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!studentId || !semester) {
        setLoading(false);
        setError("Student ID and semester are required");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/student-schedule?studentId=${studentId}&semester=${semester}`);
        const data: StudentScheduleResponse = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch student schedule");
        }

        setResult(data.data);
        setIsIndividual(data.isIndividual);
      } catch (err) {
        console.error("Error fetching student schedule:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId, semester]);

  
  const confirmSchedule = async (schedule: ScheduleItem[]) => {
    if (!studentId) {
      throw new Error("Student ID is required to confirm schedule");
    }

    try {
      const response = await fetch('/api/student-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId,
          schedule
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to confirm schedule");
      }

      return data;
    } catch (err) {
      console.error("Error confirming schedule:", err);
      throw err;
    }
  };

  return { 
    result, 
    loading, 
    error, 
    isIndividual, 
    confirmSchedule 
  };
}
