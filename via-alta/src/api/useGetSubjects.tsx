import { useState, useEffect } from "react";

type Subject = {
    id: number;
    title: string;
    professor: string;
    credits: number;
    salon: string;
    semester: number; // Add semester property
    hours: { day: string; time: string }[];
};

const subjects: Subject[] = [
    {
        id: 129,
        title: 'Matemáticas',
        professor: 'Dr. John Doe',
        credits: 3,
        salon: 'A101',
        semester: 1, // First semester subject
        hours: [
            { day: 'Lunes', time: '10:00' },
            { day: 'Lunes', time: '11:00' },
            { day: 'Miércoles', time: '10:00' },
        ],
    },
    {
        id: 202,
        title: 'Historia',
        professor: 'Dr. Jane Doe',
        credits: 9,
        salon: 'B202',
        semester: 1, // First semester subject
        hours: [
            { day: 'Martes', time: '14:00' },
            { day: 'Jueves', time: '14:00' },
            { day: 'Viernes', time: '10:00' },
        ],
    },
    {
        id: 401,
        title: 'Literatura',
        professor: 'Dr. Emily Bronte',
        credits: 4,
        salon: 'C303',
        semester: 2, // Second semester subject
        hours: [
            { day: 'Lunes', time: '08:00' },
            { day: 'Miércoles', time: '08:00' },
        ],
    },
    {
        id: 502,
        title: 'Física',
        professor: 'Dr. Albert Einstein',
        credits: 5,
        salon: 'D404',
        semester: 2, // Second semester subject
        hours: [
            { day: 'Martes', time: '10:00' },
            { day: 'Jueves', time: '10:00' },
            { day: 'Viernes', time: '08:00' },
        ],
    },
    {
        id: 603,
        title: 'Química',
        professor: 'Dr. Marie Curie',
        credits: 4,
        salon: 'E505',
        semester: 3, // Third semester subject
        hours: [
            { day: 'Lunes', time: '14:00' },
            { day: 'Miércoles', time: '14:00' },
        ],
    },
    {
        id: 704,
        title: 'Filosofía',
        professor: 'Dr. Sócrates',
        credits: 3,
        salon: 'F606',
        semester: 3, // Third semester subject
        hours: [
            { day: 'Martes', time: '08:00' },
            { day: 'Jueves', time: '08:00' },
        ],
    },
    {
        id: 805,
        title: 'Arte',
        professor: 'Dr. Leonardo da Vinci',
        credits: 2,
        salon: 'G707',
        semester: 4, // Fourth semester subject
        hours: [
            { day: 'Viernes', time: '16:00' },
        ],
    },
    {
        id: 906,
        title: 'Ciencias de la Computación',
        professor: 'Dr. Alan Turing',
        credits: 6,
        salon: 'H808',
        semester: 4, // Fourth semester subject
        hours: [
            { day: 'Lunes', time: '18:00' },
            { day: 'Miércoles', time: '18:00' },
            { day: 'Viernes', time: '12:00' },
        ],
    },
    {
        id: 9346,
        title: 'Coordinación de eventos de moda',
        professor: 'Dr. Alan Turing',
        credits: 6,
        salon: 'I909',
        semester: 5, // Fifth semester subject
        hours: [
            { day: 'Lunes', time: '8:00' },
            { day: 'Miércoles', time: '8:00' },
            { day: 'Viernes', time: '8:00' },
        ],
    },
];

export function useGetSubjects() {
    const [result, setResult] = useState<Subject[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        try {
            setTimeout(() => {
                setResult(subjects);
                setLoading(false);
            }, 1000);
        } catch (error: any) {
            setError(error.message);
            setLoading(false);
        }
    }, []);

    return { loading, result, error };
}