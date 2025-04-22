import { useState, useEffect } from "react";

export interface ScheduleItem {
  idgrupo: number;
  materianombre: string;
  profesornombre: string;
  semestre: number;
  dia: string;
  horainicio: string;
  horafin: string;
  idsalon?: number;
  tiposalon?: string;
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

  // Funcion para confirmar el horario
  const confirmSchedule = async (schedule: ScheduleItem[], testMode = true) => {
    if (!studentId) {
      throw new Error("Student ID is required to confirm schedule");
    }

    try {
      console.log('Confirming schedule for student:', studentId);
      console.log('Schedule data being sent:', schedule);
      
    
      const validScheduleItems = schedule.filter(item => {
        const idGrupo = item.idgrupo;
        if (!idGrupo) {
          console.warn('Skipping schedule item without IdGrupo:', item);
          return false;
        }
        return true;
      });
      
      if (validScheduleItems.length === 0) {
        throw new Error("No valid schedule items to confirm");
      }

      const response = await fetch('/api/student-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId,
          schedule: validScheduleItems,
          testMode // Add testMode flag
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to confirm schedule");
      }
      
      // Only update isIndividual if not in test mode
      if (!testMode) {
        setIsIndividual(true);
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
