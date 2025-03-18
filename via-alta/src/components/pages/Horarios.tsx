'use client';

import React from 'react';
import SemesterGrid from '../SemesterGrid';
import StudentSearch from '../StudentSearch';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";

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

export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetStudents();

  const semesters: Semester[] = result ? Object.entries(
    result.reduce((acc: Record<string, number>, student: Student) => {
      acc[student.semestre] = (acc[student.semestre] || 0) + 1;
      return acc;
    }, {})
  ).map(([id, numberStudents]) => ({ id, numberStudents: numberStudents as number })) : [];

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