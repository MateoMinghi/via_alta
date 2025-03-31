// Importa los hooks de React para manejar el estado y los efectos
import { useState, useEffect } from "react";

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

const GENERAL_SCHEDULE_KEY = 'via-alta-schedule'; // Clave para acceder al horario general en el almacenamiento local

// Hook personalizado para obtener las materias
// No recibe parámetros
// Retorna un objeto con las materias (result), un indicador de carga (loading) y un posible error (error)
export function useGetSubjects() {
    const [result, setResult] = useState<Subject[] | null>(null); // Estado para almacenar las materias
    const [loading, setLoading] = useState(true); // Estado para indicar si está cargando
    const [error, setError] = useState<string>(''); // Estado para almacenar errores

    useEffect(() => {
        try {
            // Obtiene los datos del horario general desde el almacenamiento local
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
    }, []); // Ejecuta el efecto solo una vez al montar el componente

    return { result, loading, error }; // Retorna el estado de las materias, la carga y el error
}