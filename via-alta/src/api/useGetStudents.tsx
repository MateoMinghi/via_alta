import { useState, useEffect } from "react";

type Student = {
    id: string;
    name: string;
    semestre: string;
    status: string;
    comentario: string;
    isIrregular: boolean;
};

const students: Student[] = [
    {
        id: '00001',
        name: 'Renata López',
        semestre: '3',
        status: 'requiere-cambios',
        comentario: 'Necesita completar documentación pendiente para inscripción.',
        isIrregular: false,
      },
      {
        id: '00002',
        name: 'Alejandro Martínez',
        semestre: '2',
        status: 'inscrito',
        comentario: 'Inscripción completa. Sin observaciones.',
        isIrregular: false,
      },
      {
        id: '00003',
        name: 'Diana Pérez',
        semestre: '4',
        status: 'inscrito',
        comentario: 'Inscripción exitosa. Buen rendimiento académico.',
        isIrregular: false,
      },
      {
        id: '00004',
        name: 'Emiliano García',
        semestre: '1',
        status: 'inscrito',
        comentario: 'Primer semestre. Todos los documentos en regla.',
        isIrregular: false,
      },
      {
        id: '00005',
        name: 'Fernando Torres',
        semestre: '5',
        status: 'requiere-cambios',
        comentario: 'Pendiente pago de matrícula para completar inscripción.',
        isIrregular: false,
      },
      {
        id: '00006',
        name: 'Gabriela Sánchez',
        semestre: '2',
        status: 'inscrito',
        comentario: 'Inscripción completa. Excelente desempeño.',
        isIrregular: false,
      },
      {
        id: '00007',
        name: 'Sofia Ramírez',
        semestre: '3',
        status: 'requiere-cambios',
        comentario: 'Falta certificado médico para actividades deportivas.',
        isIrregular: false,
      },
      {
        id: '00008',
        name: 'Diana Gómez',
        semestre: '6',
        status: 'no-inscrito',
        comentario: 'No ha iniciado proceso de inscripción para este semestre.',
        isIrregular: false,
      },
      {
        id: '00009',
        name: 'Lucia Fernández',
        semestre: '4',
        status: 'inscrito',
        comentario: 'Inscripción completa. Participante en programa de intercambio.',
        isIrregular: false,
      },
      {
        id: '00010',
        name: 'Fernanda Ruiz',
        semestre: '1',
        status: 'no-inscrito',
        comentario: 'Documentación incompleta. No ha pagado matrícula.',
        isIrregular: false,
      },
      {
        id: '00011',
        name: 'Héctor Mendoza',
        semestre: '5',
        status: 'no-inscrito',
        comentario: 'Baja temporal solicitada por el estudiante.',
        isIrregular: false,
      },
      {
        id: '00012',
        name: 'Alejandro Ortiz',
        semestre: '2',
        status: 'requiere-cambios',
        comentario: 'Pendiente validación de materias previas.',
        isIrregular: false,
      },
      {
        id: '00013',
        name: 'Carlos Vega',
        semestre: 'N/A',
        status: 'no-inscrito',
        comentario: 'Estudiante con materias de diferentes semestres.',
        isIrregular: true,
      },
      {
        id: '00014',
        name: 'María Jiménez',
        semestre: 'N/A',
        status: 'requiere-cambios',
        comentario: 'Reincorporación después de baja temporal.',
        isIrregular: true,
      },
      {
        id: '00015',
        name: 'José Morales',
        semestre: 'N/A',
        status: 'inscrito',
        comentario: 'Cursando materias de diferentes semestres por reprobación.',
        isIrregular: true,
      },
];

export function useGetStudents() {
    const [result, setResult] = useState<Student[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        try {
            setTimeout(() => {
                setResult(students);
                setLoading(false);
            }, 1000);
        } catch (error: any) {
            setError(error.message);
            setLoading(false);
        }
    }, []);

    return { loading, result, error };
}