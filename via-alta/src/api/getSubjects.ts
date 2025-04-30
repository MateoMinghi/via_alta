// Importa los hooks de React para manejar el estado y los efectos
import { useState, useEffect } from "react";

// Define el tipo de datos para una materia
// Una materia tiene un id, título, profesor, créditos, salón, semestre y horarios
export type Subject = {
    id: number;
    title: string;
    professor: string;
    credits: number;
    salon: string;
    semester: number;
    hours: { day: string; time: string }[];
};

const GENERAL_SCHEDULE_KEY = 'via-alta-schedule'; // Clave para acceder al horario general en el almacenamiento local

// Extrae las materias de la base de datos o del almacenamiento local
export async function getSubjects(): Promise<{ result: Array<{ id: number, name: string }> | null; error: string }> {
    try {
        let subjects: Array<{ id: number, name: string }> = [];
        let apiError = false;
        
        // Primary method: Try to get subjects directly from the API first
        try {
            console.log("Fetching subjects from API...");
            const response = await fetch('/api/subjects');
            if (response.ok) {
                const data = await response.json();
                console.log("API Subject data:", data); // Debug log to see what we're receiving
                
                if (data) {
                    // Handle different response structures
                    let subjectsData = data;
                    
                    // If data is wrapped in a 'data' property
                    if (!Array.isArray(data) && data.data && Array.isArray(data.data)) {
                        subjectsData = data.data;
                    }
                    
                    if (Array.isArray(subjectsData)) {
                        // Map database fields to the expected format
                        subjects = subjectsData.map((subject: any) => ({
                            id: subject.IdMateria || subject.idmateria || subject.id,
                            name: subject.Nombre || subject.nombre || subject.name
                        }));
                        console.log(`Successfully mapped ${subjects.length} subjects from API:`, subjects);
                        return { result: subjects, error: '' };
                    } else {
                        console.warn("API response is not an array:", data);
                        apiError = true;
                    }
                } else {
                    console.warn("Empty API response");
                    apiError = true;
                }
            } else {
                console.warn(`API request failed with status: ${response.status}`);
                apiError = true;
            }
        } catch (err) {
            console.error("Error fetching subjects from API:", err);
            apiError = true;
        }

        // Secondary method: If API fails, try localStorage
        if (apiError) {
            console.log("API fetch failed, trying localStorage...");
            try {
                const savedSchedule = localStorage.getItem(GENERAL_SCHEDULE_KEY);
                if (savedSchedule) {
                    const generalSchedule = JSON.parse(savedSchedule);
                    
                    // Crea un mapa para agrupar las clases por sus identificadores únicos
                    const subjectMap = new Map();
                    
                    generalSchedule.forEach((item: any) => {
                        // Crea una clave única para cada materia
                        const key = `${item.subject}-${item.teacher}-${item.semester}`;
                        
                        if (!subjectMap.has(key)) {
                            // Crea una nueva entrada para la materia
                            subjectMap.set(key, {
                                id: item.id || Math.random(), // Genera un id temporal o usa el existente
                                name: item.subject
                            });
                        }
                    });
                    
                    // Convierte el mapa en un arreglo
                    subjects = Array.from(subjectMap.values());
                    console.log(`Retrieved ${subjects.length} subjects from localStorage`);
                    
                    if (subjects.length > 0) {
                        return { result: subjects, error: '' };
                    }
                } else {
                    console.warn("No saved schedule found in localStorage");
                }
            } catch (localStorageErr) {
                console.error("Error accessing localStorage:", localStorageErr);
            }
        }
        
        // Fallback: If both API and localStorage fail, use hardcoded data
        console.warn("Using hardcoded fallback subjects");
        subjects = [
            { id: 1, name: 'Fundamentos de Diseño' },
            { id: 2, name: 'Dibujo del Cuerpo' },
            { id: 3, name: 'Patronaje de Prendas Básicas' },
            { id: 4, name: 'Confección de Prendas Básicas' },
            { id: 5, name: 'Técnicas de Expresión Gráfica' },
            { id: 6, name: 'Historia de la Moda' },
            { id: 7, name: 'Herramientas y Puntadas Básicas' },
            { id: 8, name: 'Patronaje de Prendas Femeninas' },
            { id: 9, name: 'Confección de Prendas Femeninas' },
            { id: 10, name: 'Conceptos y Tendencias de la Moda I' }
        ];
        
        return { result: subjects, error: 'Could not fetch subjects from API or localStorage, using fallback data' };
    } catch (err: any) {
        console.error("Error in getSubjects:", err);
        return { result: null, error: err.message || "Error fetching subjects" };
    }
}

// Hook personalizado para obtener las materias
// No recibe parámetros
// Retorna un objeto con las materias (result), un indicador de carga (loading) y un posible error (error)
export function useGetSubjects() {
    const [result, setResult] = useState<Array<{ id: number, name: string }> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
      const fetchSubjects = async () => {
        try {
          console.log("🔍 [DEBUG] Starting subject fetch process");
          const response = await getSubjects();
          console.log("🔍 [DEBUG] getSubjects response:", response);
          
          if (response.result && response.result.length > 0) {
            console.log("🔍 [DEBUG] Setting subjects:", response.result);
            console.log("🔍 [DEBUG] First subject:", response.result[0]);
            setResult(response.result);
          } else {
            console.warn("🔍 [DEBUG] No subjects returned from getSubjects");
            setResult([]);
          }
          
          if (response.error) {
            console.error("🔍 [DEBUG] Error from getSubjects:", response.error);
            setError(response.error);
          }
        } catch (err: any) {
          console.error("🔍 [DEBUG] Exception in fetchSubjects:", err);
          setError(err.message || "An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      };

      fetchSubjects();
    }, []);

    return { result, loading, error };
  }