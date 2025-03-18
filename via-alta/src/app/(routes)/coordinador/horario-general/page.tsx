"use client";
import React, { useState, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { generateSchedule, ScheduleItem } from '../../../../lib/schedule-generator';
import { cn } from '@/lib/utils';
import { IndividualSubject } from '@/components/IndividualSubject';

export default function Page() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ScheduleItem | null>(null);

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

  const DraggableCell = ({ item, heightClass }: { item: ScheduleItem; heightClass: string }) => {
    const [{ isDragging }, dragRef] = useDrag<ScheduleItem, void, { isDragging: boolean }>(() => ({
      type: 'scheduleItem',
      item: item,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));
  
    return (
      <div
        ref={(node) => {
          if (typeof dragRef === 'function') {
            dragRef(node);
          }
        }}
        className={cn(
          'p-1 text-xs cursor-pointer rounded-md border border-gray-200 bg-white shadow-sm',
          'hover:shadow-md transition-shadow flex',
          isDragging && 'opacity-50',
          heightClass
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubject(item);
        }}
      >
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="font-medium text-red-700 truncate">{item.subject}</div>
          <div className="text-[10px] text-gray-600 truncate">{item.teacher}</div>
          <div className="text-[10px] text-gray-500 truncate">{item.classroom}</div>
        </div>
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

    // Calculate width class based on number of items
    const getWidthClass = (total: number, index: number) => {
      switch(total) {
        case 1: return 'w-full';
        case 2: return 'w-[calc(50%-2px)]';
        case 3: return 'w-[calc(33.333%-2px)]';
        default: return 'w-[calc(25%-2px)]';
      }
    };
  
    return (
      <div
        ref={(node) => {
          if (typeof dropRef === 'function') {
            dropRef(node);
          }
        }}
        className={cn(
          'h-20 border border-gray-200 p-1',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && 'bg-gray-100'
        )}>
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableCell 
              key={`${item.teacher}-${item.subject}-${index}`} 
              item={item}
              heightClass={getWidthClass(items.length, index)}
            />
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
        <IndividualSubject 
          subject={selectedSubject}
          isOpen={!!selectedSubject}
          onClose={() => setSelectedSubject(null)}
        />
      </main>
    </DndProvider>
  );
}