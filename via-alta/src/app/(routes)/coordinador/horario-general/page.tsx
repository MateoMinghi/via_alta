"use client";
import React, { useState, useMemo } from 'react';
import { generateSchedule, ScheduleItem } from '../../../../lib/schedule-generator';
import { cn } from '@/lib/utils';

export default function Page() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  async function handleGenerateSchedule() {
    const result = await generateSchedule();
    setSchedule(result);
  }

  const days = useMemo(() => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], []);
  const timeSlots = useMemo(() => [
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00'
  ], []);

  const scheduleMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: ScheduleItem | null } } = {};
    
    // Initialize empty matrix
    timeSlots.forEach(time => {
      matrix[time] = {};
      days.forEach(day => {
        matrix[time][day] = null;
      });
    });

    // Fill matrix with schedule items
    schedule.forEach(item => {
      const time = item.time;
      if (timeSlots.includes(time)) {
        matrix[time][item.day] = item;
      }
    });

    return matrix;
  }, [schedule, days, timeSlots]);

  const Cell = ({ day, time }: { day: string; time: string }) => {
    const item = scheduleMatrix[time][day];

    return (
      <div className={cn(
        'h-20 border border-gray-200',
        item ? 'bg-blue-50' : 'bg-white'
      )}>
        {item && (
          <div className="p-2 text-sm">
            <div className="font-medium">{item.subject}</div>
            <div className="text-gray-600">{item.teacher}</div>
            <div className="text-gray-500 text-xs">{item.classroom}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Horario General</h1>
        <button
          onClick={handleGenerateSchedule}
          className="w-full bg-red-700 text-white px-4 py-2 rounded transition-colors"
        >
        Generar Horario
      </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[100px_repeat(5,1fr)]">
            <div className="h-10" />
            {days.map((day) => (
              <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                {day}
              </div>
            ))}

            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="h-20 flex items-center justify-end pr-2 text-sm text-muted-foreground">
                  {time}
                </div>
                {days.map((day) => (
                  <Cell key={`${day}-${time}`} day={day} time={time} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}