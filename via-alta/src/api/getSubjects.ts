// Importa los hooks de React para manejar el estado y los efectos
import { useState, useEffect } from "react";
import { Cycle } from "./getCycles";

// Define el tipo de datos para una materia
// Una materia tiene un id, título, profesor, créditos, salón, semestre y horarios
type Subject = {
    id: number;
    title: string;
    professor: string;
    credits: number;
    salon: string;
    semester: number;
    hours: { day: string; time: string }[];
};

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

const GENERAL_SCHEDULE_KEY = 'via-alta-schedule'; // Clave para acceder al horario general en el almacenamiento local

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

// Hook personalizado para obtener las materias
// Recibe un ciclo académico opcional para filtrar las materias
// Retorna un objeto con las materias (result), un indicador de carga (loading) y un posible error (error)
export function useGetSubjects(academicPeriod?: Cycle | null) {
    const [result, setResult] = useState<Subject[] | null>(null); // Estado para almacenar las materias
    const [loading, setLoading] = useState(true); // Estado para indicar si está cargando
    const [error, setError] = useState<string>(''); // Estado para almacenar errores

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoading(true);

                // If we have an academic period, try to fetch from API first
                if (academicPeriod) {
                    try {
                        // Get auth token
                        const token = await getAuthToken();
                        
                        // Fetch subjects for the specific cycle
                        const response = await fetch(`${API_BASE_URL}/v1/courses/by_cycle/${academicPeriod.id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                // Transform API data to our Subject format
                                const subjects: Subject[] = data.data.map((item: any) => ({
                                    id: item.id,
                                    title: item.name,
                                    professor: item.professor || 'Pending Assignment',
                                    credits: parseFloat(item.credits) || 0,
                                    salon: item.classroom || 'TBD',
                                    semester: item.semester || 1,
                                    hours: item.hours?.map((hour: any) => ({
                                        day: hour.day,
                                        time: hour.time
                                    })) || []
                                }));
                                
                                setResult(subjects);
                                setLoading(false);
                                return; // Exit early if API fetch was successful
                            }
                        }
                        
                        // If API fetch failed, fall back to localStorage
                        console.warn('API fetch failed, falling back to localStorage');
                    } catch (apiError) {
                        console.error('API error:', apiError);
                        // Continue to localStorage fallback
                    }
                }

                // Fallback to localStorage
                const savedSchedule = localStorage.getItem(GENERAL_SCHEDULE_KEY);
                if (savedSchedule) {
                    const generalSchedule = JSON.parse(savedSchedule);
                    
                    // Filter by academic period if provided
                    let filteredSchedule = generalSchedule;
                    if (academicPeriod) {
                        // Extract year and semester from academic period name (format: "Year-Semester")
                        const periodParts = academicPeriod.name.split('-');
                        if (periodParts.length === 2) {
                            const year = parseInt(periodParts[0]);
                            const semester = parseInt(periodParts[1]);
                            
                            // Filter schedule items by year and semester
                            filteredSchedule = generalSchedule.filter((item: any) => {
                                // Assuming item has academic_year and academic_semester properties
                                // or we can parse it from some other property
                                return (
                                    (item.academicYear === year || !item.academicYear) &&
                                    (item.academicSemester === semester || !item.academicSemester)
                                );
                            });
                        }
                    }
                    
                    // Crea un mapa para agrupar las clases por sus identificadores únicos
                    const subjectMap = new Map();
                    
                    filteredSchedule.forEach((item: any) => {
                        // Crea una clave única para cada materia
                        const key = `${item.subject}-${item.teacher}-${item.semester}`;
                        
                        if (!subjectMap.has(key)) {
                            // Crea una nueva entrada para la materia
                            subjectMap.set(key, {
                                id: Math.random(), // Genera un id temporal
                                title: item.subject,
                                professor: item.teacher,
                                credits: item.credits || 0, // Si no hay créditos, asigna 0 por defecto
                                salon: item.classroom,
                                semester: item.semester,
                                hours: [{
                                    day: item.day,
                                    time: item.time
                                }]
                            });
                        } else {
                            // Agrega un nuevo horario a una materia existente
                            const subject = subjectMap.get(key);
                            subject.hours.push({
                                day: item.day,
                                time: item.time
                            });
                        }
                    });
                    
                    // Convierte el mapa en un arreglo
                    const subjects: Subject[] = Array.from(subjectMap.values());
                    setResult(subjects);
                } else {
                    setResult([]); // Si no hay datos guardados, retorna un arreglo vacío
                }
                
                setLoading(false); // Finaliza la carga
            } catch (err: any) {
                console.error('Error loading subjects:', err); // Muestra el error en la consola
                setError(err?.message || 'Ocurrió un error'); // Almacena el mensaje de error
                setLoading(false); // Finaliza la carga incluso si hay un error
            }
        };

        fetchSubjects();
    }, [academicPeriod]); // Ejecuta el efecto cuando cambia el periodo académico

    return { result, loading, error }; // Retorna el estado de las materias, la carga y el error
}