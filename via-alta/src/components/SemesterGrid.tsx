'use client';

import React from 'react';
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

export default function SemesterGrid() {
  const router = useRouter();
  const semesters = [
    {
      id: 1,
      numberStudents: 10,
    },
    {
      id: 2,
      numberStudents: 20,
    },
    {
      id: 3,
      numberStudents: 30,
    },
  ];

  return (
    <>
      {semesters.map((semester) => (
        <Card key={semester.id} className="flex flex-col items-center my-8">
          <CardHeader className="flex flex-row justify-between w-full">

            <CardTitle className="font-light">
              Horario del
              {' '}
              <span className="font-bold">
                Semestre
                {semester.id}
              </span>
            </CardTitle>
            <CardDescription>
              Estudiantes:
              {semester.numberStudents}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row justify-between w-full" />
          <CardFooter className="flex flex-col sm:flex-row justify-between w-full pt-4 items-end h-full">

            <Button className="w-full font-bold" onClick={() => router.push(`coordinador/semestre${semester.id}`)}>Ver Horario</Button>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
