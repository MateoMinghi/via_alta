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
    hours: { day: string; time: string }    [];
};

const GENERAL_SCHEDULE_KEY = 'via-alta-schedule'; // Clave para acceder al horario general en el almacenamiento local

// Extrae las materias de la base de datos o del almacenamiento local
export async function getSubjects(): Promise<{ result: Array<{ id: number, name: string }> | null; error: string }> {
    try {
        // Intenta obtener las materias del almacenamiento local primero
        const savedSchedule = localStorage.getItem(GENERAL_SCHEDULE_KEY);
        let subjects: Array<{ id: number, name: string }> = [];
        
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
        } else {
            // Si no hay materias en localStorage, intenta obtenerlas de la tabla Materia en la DB
            try {
                const response = await fetch('/api/subjects');
                if (response.ok) {
                    const data = await response.json();
                    subjects = data.map((subject: any) => ({
                        id: subject.IdMateria,
                        name: subject.Nombre
                    }));
                }
            } catch (err) {
                console.error("Error fetching subjects from API:", err);
                // Fallback a materias codificadas si ambos métodos fallan
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
            }
        }
        
        return { result: subjects, error: '' };
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
                const response = await getSubjects();
                setResult(response.result);
                if (response.error) {
                    setError(response.error);
                }
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    return { result, loading, error };
}