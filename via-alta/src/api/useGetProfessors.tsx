import { useState, useEffect } from "react";

type Professor = {
    id: number;
    name: string;
    department: string;
};

const professors: Professor[] = [
    { id: 1, name: 'Dr. Juan Pérez', department: 'Matemáticas' },
    { id: 2, name: 'Dra. Ana Gómez', department: 'Física' },
    { id: 3, name: 'Dr. Carlos Ruiz', department: 'Química' },
    { id: 4, name: 'Dra. Laura Fernández', department: 'Biología' },
    { id: 5, name: 'Dr. Miguel Torres', department: 'Ingeniería' },
    { id: 6, name: 'Dra. Sofía Martínez', department: 'Historia' },
    { id: 7, name: 'Dr. Pedro Sánchez', department: 'Literatura' },
    { id: 8, name: 'Dra. Elena López', department: 'Filosofía' },
    { id: 9, name: 'Dr. Javier García', department: 'Economía' },
    { id: 10, name: 'Dra. Marta Rodríguez', department: 'Psicología' },
    { id: 11, name: 'Dr. Andrés Hernández', department: 'Sociología' },
    { id: 12, name: 'Dra. Patricia Jiménez', department: 'Antropología' },
];

export function useGetProfessors() {
    const [result, setResult] = useState<Professor[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        try {
            setTimeout(() => {
                setResult(professors);
                setLoading(false);
            }, 1000);
        } catch (error: any) {
            setError(error.message);
            setLoading(false);
        }
    }, []);

    return { loading, result, error };
}