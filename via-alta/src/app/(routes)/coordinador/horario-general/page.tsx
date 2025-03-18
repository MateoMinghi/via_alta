"use client";
import React, { useState, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
    const matrix: { [key: string]: { [key: string]: ScheduleItem[] } } = {};
    
    timeSlots.forEach(time => {
      matrix[time] = {};
      days.forEach(day => {
        matrix[time][day] = [];
      });
    });
  
    schedule.forEach(item => {
      const time = item.time;
      if (timeSlots.includes(time)) {
        matrix[time][item.day].push(item);
      }
    });
  
    return matrix;
  }, [schedule, days, timeSlots]);

  const moveItem = (item: ScheduleItem, toDay: string, toTime: string) => {
    setSchedule(prev => {
      const newSchedule = [...prev];
      
      // Find the item being moved
      const movingItemIndex = newSchedule.findIndex(scheduleItem => 
        scheduleItem.teacher === item.teacher && 
        scheduleItem.subject === item.subject && 
        scheduleItem.day === item.day && 
        scheduleItem.time === item.time
      );
  
      // Find any existing item in the target cell
      const targetItemIndex = newSchedule.findIndex(scheduleItem =>
        scheduleItem.day === toDay &&
        scheduleItem.time === toTime
      );
  
      if (movingItemIndex === -1) return prev;
  
      if (targetItemIndex === -1) {
        // If target cell is empty, update the item's position
        newSchedule[movingItemIndex] = {
          ...item,
          day: toDay,
          time: toTime
        };
      } else {
        // If target cell has an item, swap their positions
        const targetItem = newSchedule[targetItemIndex];
        newSchedule[targetItemIndex] = {
          ...item,
          day: toDay,
          time: toTime
        };
        newSchedule[movingItemIndex] = {
          ...targetItem,
          day: item.day,
          time: item.time
        };
      }
  
      return newSchedule;
    });
  };

  const DraggableCell = ({ item }: { item: ScheduleItem }) => {
    const [{ isDragging }, dragRef] = useDrag<ScheduleItem, void, { isDragging: boolean }>(() => ({
      type: 'scheduleItem',
      item: item,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));
  
    return (
      <div
        ref={(node) => dragRef(node)}
        className={cn(
          'p-1.5 text-xs cursor-move rounded-md border border-gray-200 bg-white shadow-sm',
          'hover:shadow-md transition-shadow',
          isDragging && 'opacity-50'
        )}
      >
        <div className="font-medium text-red-700">{item.subject}</div>
        <div className="text-gray-600 text-[10px]">{item.teacher}</div>
        <div className="text-gray-500 text-[10px]">{item.classroom}</div>
      </div>
    );
  };
  
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
  
    const [{ isOver }, dropRef] = useDrop<ScheduleItem, void, { isOver: boolean }>(() => ({
      accept: 'scheduleItem',
      drop: (draggedItem) => moveItem(draggedItem, day, time),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));
  
    return (
      <div
        ref={(node) => dropRef(node)}
        className={cn(
          'h-20 border border-gray-200 p-1',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && 'bg-gray-100'
        )}
      >
        <div className="flex flex-col gap-1.5 h-full">
          {items.map((item, index) => (
            <DraggableCell key={`${item.teacher}-${item.subject}-${index}`} item={item} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Horario General</h1>
          <button
            onClick={handleGenerateSchedule}
            className="w-full bg-red-700 text-white px-4 py-2 rounded transition-colors hover:bg-red-800"
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
    </DndProvider>
  );
}