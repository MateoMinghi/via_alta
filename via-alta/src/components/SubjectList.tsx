import React from 'react';

interface Subject {
    id: number;
    title: string;
    salon: string;
    professor: string;
    credits: number;
    hours: { day: string; time: string }[];
}
  interface SubjectsGridProps {
    subjects: Subject[];
  }

export default function SubjectList({ subjects }: SubjectsGridProps) {
  return (
    <>
      {subjects.map((subject) => (
        <div key={subject.id} className="flex flex-col items-center p-2 border rounded-lg my-2">
          <div className="flex flex-row justify-between w-full">
            <div className="pb-2">
              <p className="font-bold">{subject.title}</p>
              <p className="text-xs">{subject.professor}</p>
            </div>
            <p className="text-xs">{subject.id}</p>
          </div>
          <div className="pb-2 flex flex-row justify-between w-full text-xs font-semibold">
            <p>
              Salón:
              {subject.salon}
            </p>
            <p>
              {subject.hours.map((hour) => (
                <span key={`${hour.day}-${hour.time}`}>
                  {hour.day}
                  {' '}
                  {hour.time}
                  {subject.hours.indexOf(hour) < subject.hours.length - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between w-full items-end h-full text-xs">
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
          </div>
        </div>
      ))}
    </>
  );
}
