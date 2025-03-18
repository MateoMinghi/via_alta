'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, X } from 'lucide-react';
import SubjectList from './SubjectList';
import SubjectSearch from './SubjectSearch';

interface Subject {
  id: number
  title: string
  salon: string
  professor: string
  credits: number
  hours: { day: string; time: string }[]
}

interface SubjectsProps {
  subjects: Subject[]
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '7:00',
  '7:30',
  '8:00',
  '8:30',
  '9:00',
  '9:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
];

export default function StudentSchedule({ subjects }: SubjectsProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [allSubjects, setAllSubjects] = useState<Subject[]>(subjects);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    setAllSubjects(subjects);
  }, [subjects]);

  const handleSubjectSelect = (subject: Subject) => {
    if (!selectedSubjects.some((s) => s.id === subject.id)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const removeSelectedSubject = (subjectId: number) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subjectId));
  };

  const findSubject = (day: string, time: string) => {
    const allDisplaySubjects = [
      ...subjects,
      ...selectedSubjects.filter((selected) => !subjects.some((s) => s.id === selected.id)),
    ];

    return allDisplaySubjects.find((subject) => subject.hours.some(
      (hour) => hour.day.toLowerCase() === day.toLowerCase() && hour.time === time,
    ));
  };

  const navigateDay = (direction: number) => {
    const newIndex = (activeDayIndex + direction + daysOfWeek.length) % daysOfWeek.length;
    setActiveDayIndex(newIndex);
  };

  return (
    <div className="w-full pb-8 flex justify-between flex-col sm:flex-row">
      <div className="hidden lg:block overflow-x-auto text-xs">
        <p className="text-2xl font-bold">Vista de Horario</p>
        <div className="min-w-[500px]">
          <div className="grid grid-cols-[50px_repeat(5,1fr)] gap-1 mb-1">
            <div className="h-10" />
            {daysOfWeek.map((day) => (
              <Card key={day} className="flex items-center justify-center h-10 bg-slate-50 border">
                <div className="text-center font-medium text-slate-600">{day}</div>
              </Card>
            ))}
          </div>

          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-[50px_repeat(5,1fr)] gap-1 mb-1">
              <Card className="flex items-center justify-center bg-slate-50 border h-20">
                <div className="text-center font-medium text-slate-600">{time}</div>
              </Card>

              {daysOfWeek.map((day) => {
                const subject = findSubject(day, time);
                return subject ? (
                  <Card
                    key={`${day}-${time}`}
                    className="flex items-center justify-center h-full p-2 bg-slate-50 border"
                  >
                    <div className="font-medium text-slate-600 text-center">{subject.title}</div>
                  </Card>
                ) : (
                  <div key={`${day}-${time}`} className="h-full" />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:hidden text-xs w-full">
        <p className="text-2xl font-bold">Vista de Horario</p>
        <div className="flex justify-center items-center mb-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateDay(-1)}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous day</span>
          </Button>

          <Card className="flex-1 max-w-[200px] flex items-center justify-center h-12 bg-slate-50 border mx-2">
            <div className="text-center font-medium text-slate-600">{daysOfWeek[activeDayIndex]}</div>
          </Card>

          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateDay(1)}>
            <ChevronLeft className="h-5 w-5 rotate-180" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>

        <div className="space-y-1">
          {timeSlots.map((time) => {
            const currentDay = daysOfWeek[activeDayIndex];
            const subject = findSubject(currentDay, time);

            return (
              <div key={`mobile-${currentDay}-${time}`} className="flex gap-1">
                <Card className="w-[50px] flex items-center justify-center h-10 sm:h-20 bg-slate-50 border">
                  <div className="text-center font-medium text-slate-600">{time}</div>
                </Card>

                {subject ? (
                  <Card className="flex flex-1 bg-slate-50 border items-center justify-center">
                    <div className="font-medium text-slate-600 text-center">{subject.title}</div>
                  </Card>
                ) : (
                  <div className="flex-1 h-10 sm:h-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full pl-8">
        <p className="text-2xl font-bold">Lista de Materias</p>
        <SubjectList subjects={subjects} />
        {selectedSubjects.length > 0 && (
          <div className="mt-4 mb-4">
            <p className="text-lg font-semibold mb-2">Materias Seleccionadas</p>
            <div className="space-y-2">
              {selectedSubjects.map((subject) => (
                <Card key={subject.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{subject.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.professor}
                      {' '}
                      •
                      {subject.credits}
                      {' '}
                      créditos
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSelectedSubject(subject.id)}
                    className="h-8 w-8 text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
