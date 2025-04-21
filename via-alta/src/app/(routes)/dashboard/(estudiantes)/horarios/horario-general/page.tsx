'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubjectList from '@/components/SubjectList';
import SubjectSearch from '@/components/SubjectSearch';

// Dummy data for UI demonstration
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

const dummySubjects = [
  { id: 1, title: 'Matemáticas', salon: 'A1', professor: 'Prof. López', credits: 5, semester: 1, hours: [{ day: 'Lunes', time: '08:00' }] },
  { id: 2, title: 'Inglés', salon: 'B2', professor: 'Prof. Smith', credits: 4, semester: 2, hours: [{ day: 'Martes', time: '09:00' }] },
  { id: 3, title: 'Historia', salon: 'C3', professor: 'Prof. Pérez', credits: 3, semester: 1, hours: [{ day: 'Miércoles', time: '10:00' }] },
];

export default function HorarioGeneralPage() {
  const [selectedSubjects, setSelectedSubjects] = useState(dummySubjects);

  // Helper to find subject in a cell
  const findSubject = (day: string, time: string) => {
    return selectedSubjects.find((subject) =>
      subject.hours.some((hour) => hour.day === day && hour.time === time)
    );
  };

  return (
    <div className="w-full pb-8 flex flex-col gap-4">
      <div className="overflow-x-auto w-full">
        <div className="w-full">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)] w-full">
            <div className="h-10" />
            {daysOfWeek.map((day) => (
              <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                {day}
              </div>
            ))}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="flex items-start justify-end pr-2 text-sm text-muted-foreground -mt-2">
                  {time}
                </div>
                {daysOfWeek.map((day) => {
                  const subject = findSubject(day, time);
                  return (
                    <div
                      key={`${day}-${time}`}
                      className={cn(
                        'border border-gray-200 p-1 relative h-full',
                        subject ? 'bg-blue-50/50' : 'bg-white'
                      )}
                    >
                      {subject && (
                        <div className="p-1 text-xs rounded-md border border-gray-200 bg-white shadow-sm h-full flex justify-center items-center">
                          <div className="truncate font-medium text-blue-500">{subject.title}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}