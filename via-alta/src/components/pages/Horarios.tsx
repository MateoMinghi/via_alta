'use client';

//importaciones

import React from 'react';
import SemesterGrid from '../SemesterGrid';
import StudentSearch from '../StudentSearch';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";


//interfaces
interface Student {
  id: string;
  name: string;
  semestre: string;
  regular: boolean;
}

interface Semester {
  id: string;
  numberStudents: number;
}

//componente
export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetStudents();

  const semesters: Semester[] = result ? Object.entries(
    result.reduce((acc: Record<string, number>, student: Student) => {
      acc[student.semestre] = (acc[student.semestre] || 0) + 1;
      return acc;
    }, {})
  ).map(([id, numberStudents]) => ({ id, numberStudents: numberStudents as number })) : [];

  //retorno
  return (
    <div className="text-center">
      {loading && <p>cargando...</p>}
      {result !== null && (
        <>
          <p className="font-bold text-2xl">Horarios de Alumnos Irregulares:</p>
          <StudentSearch students={result} />

          <p className="font-bold text-2xl">Horarios Generales:</p>
          <SemesterGrid semesters={semesters} />



        </>
      )}
    </div>
  );
}