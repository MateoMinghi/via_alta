import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Subject {
    id: number;
    title: string;
    description: string;
    professor: string;
    credits: number;
    hours: { day: string; time: string }[];
}
  interface SubjectsGridProps {
    subjects: Subject[];
  }

export default function SubjectsGrid({ subjects }: SubjectsGridProps) {
  return (
    <>
      {subjects.map((subject) => (
        <Card key={subject.id} className="flex flex-col items-center">
          <CardHeader className="flex flex-row justify-between w-full">
            <div>
              <CardTitle>{subject.title}</CardTitle>
              <CardDescription>{subject.professor}</CardDescription>
            </div>
            <p>{subject.id}</p>
          </CardHeader>
          <CardContent className="flex flex-row justify-between w-full">
            <p>{subject.description}</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between w-full pt-4 items-end h-full">
            <div className="flex flex-row gap-2">
              <p className="text-neutral-500">Creditos:</p>
              <p className="font-bold">{subject.credits}</p>
            </div>
            <div className="flex flex-row gap-2 ">
              <p className="text-neutral-500">Hrs/sem:</p>
              <p className="font-bold">
                {subject.hours.length}
                {' '}
                hrs
              </p>
            </div>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
