import React from 'react';

interface Subject {
    id: number;
    title: string;
    salon: string;
    professor: string;
    credits: number;
    semester: number;
    hours: { day: string; time: string }[];
}
  interface SubjectsGridProps {
    subjects: Subject[];
  }

export default function SubjectList({ subjects }: SubjectsGridProps) {
  return (
    <div className="max-h-[400px] overflow-y-auto">
      {subjects.map((subject) => (
        <div key={subject.id} className="flex flex-col items-center p-2 border rounded-lg my-2">
          <div className="flex flex-row justify-between w-full">
            <div className="pb-1">
              <p className="font-bold text-sm truncate">{subject.title}</p>
              <p className="text-xs truncate">{subject.professor}</p>
            </div>
            <p className="text-xs">{subject.id}</p>
          </div>
          <div className="pb-1 flex flex-row justify-between w-full text-xs font-semibold">
            <p className="truncate">
              Salón: {subject.salon}
            </p>
          </div>
          <div className="text-xs w-full truncate mb-1">
            {subject.hours.map((hour, index) => (
              <span key={`${hour.day}-${hour.time}`} className="mr-1">
                {hour.day.substring(0, 3)} {hour.time}
                {index < subject.hours.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
          <div className="flex flex-row justify-between w-full items-end h-full text-xs">
            <div className="flex flex-row gap-1">
              <p className="text-neutral-500">Cr:</p>
              <p className="font-bold">{subject.credits}</p>
            </div>
            <div className="flex flex-row gap-1">
              <p className="text-neutral-500">Hrs:</p>
              <p className="font-bold">{subject.hours.length}</p>
            </div>
            <div className="flex flex-row gap-1">
              <p className="text-neutral-500">Sem:</p>
              <p className="font-bold">{subject.semester}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
