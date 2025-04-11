'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

interface Semester {
  id: string;
  numberStudents: number;
}

interface SemesterGridProps {
  semesters: Semester[];
}

export default function SemesterGrid({ semesters }: SemesterGridProps) {
  const router = useRouter();

  return (
    <>
      <Link href="/dashboard/horarios/horario-general">
        <Button variant="botonGrande" className="bg-red-700 text-white hover:bg-red-800">
          Ver Horario General
        </Button>
      </Link>
      {semesters.map((semester) => (
        <Card key={semester.id} className="flex flex-col items-center my-8">
          <CardHeader className="flex flex-row justify-between w-full">
            <CardTitle className="font-light">
              Horario del Semestre
              {' '}
              <span className="font-bold">
               
                {semester.id}
              </span>
            </CardTitle>
            <CardDescription>
              Estudiantes:
              {' '}
              <span className="font-bold">
               
              {semester.numberStudents}
              </span>
              
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row justify-between w-full" />
          <CardFooter className="flex flex-col sm:flex-row justify-between w-full pt-4 items-end h-full">
            <Button className="w-full font-bold" onClick={() => router.push(`horarios/semestre-${semester.id}`)}>Ver Horario</Button>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
