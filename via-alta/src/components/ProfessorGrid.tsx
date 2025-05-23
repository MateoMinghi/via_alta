'use client';

import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { cn } from '@/lib/utils';

interface AvailabilityGridProps {
  selectedSlots: Record<string, boolean>;
  setSelectedSlots: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function AvailabilityGrid({
  selectedSlots,
  setSelectedSlots,
}: AvailabilityGridProps) {
  const days = useMemo(() => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], []);
  const timeSlots = useMemo(
    () => [
      '07:00',
      '07:30',
      '08:00',
      '08:30',
      '09:00',
      '09:30',
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
      '16:30',
      '17:00',
    ],
    [],
  );

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(true);
  const [tempSelectedSlots, setTempSelectedSlots] = useState<Record<string, boolean>>({});

  const applySelection = useCallback(() => {
    setSelectedSlots((prevSlots: Record<string, boolean>) => {
      const newSelection = { ...prevSlots };
      Object.entries(tempSelectedSlots).forEach(([key, value]) => {
        if (value) {
          newSelection[key] = true;
        } else {
          delete newSelection[key];
        }
      });
      return newSelection;
    });
    setTempSelectedSlots({});
  }, [setSelectedSlots, tempSelectedSlots]);

  const handleMouseDown = useCallback(
    (day: string, time: string) => {
      const slotKey = `${day}-${time}`;
      const newValue = !selectedSlots[slotKey];
      setSelectionMode(newValue);
      setIsSelecting(true);
      setTempSelectedSlots({ [slotKey]: newValue });
    },
    [selectedSlots],
  );

  const handleMouseEnter = useCallback(
    (day: string, time: string) => {
      if (isSelecting) {
        const slotKey = `${day}-${time}`;
        setTempSelectedSlots((prev) => ({ ...prev, [slotKey]: selectionMode }));
      }
    },
    [isSelecting, selectionMode],
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      applySelection();
      setIsSelecting(false);
    }
  }, [isSelecting, applySelection]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  const Cell = useCallback(
    ({ day, time }: { day: string; time: string }) => {
      const slotKey = `${day}-${time}`;
      const isSelected = Boolean(selectedSlots[slotKey]);
      const isTempSelected = tempSelectedSlots[slotKey];
      const cellState = isTempSelected !== undefined
        ? isTempSelected ? 'selecting' : 'unselecting'
        : isSelected
        ? 'selected'
        : 'unselected';

      return (
        <div
          className={cn(
            'relative w-full h-full border-b border-r flex items-center justify-center cursor-pointer select-none',
            cellState === 'selected' && 'bg-via hover:bg-via/90',
            cellState === 'selecting' && 'bg-green-500/40',
            cellState === 'unselecting' && 'bg-red-500/70',
            cellState === 'unselected' && 'hover:bg-gray-100',
          )}
          onMouseDown={() => handleMouseDown(day, time)}
          onMouseEnter={() => handleMouseEnter(day, time)}
        />
      );
    },
    [selectedSlots, tempSelectedSlots, handleMouseDown, handleMouseEnter],
  );

  return (
    <div className="overflow-x-auto">
      <div>
        <div className="grid grid-cols-[50px_repeat(5,1fr)]">
          <div className="h-10 pl-0 " />
          {days.map((day) => (
            <div key={day} className="h-10 flex items-center justify-center font-medium border-b border-r">
              {day}
            </div>
          ))}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              <div className="h-10 flex items-center justify-end pr-2 text-sm text-gray-600 border-b border-r">
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
  );
}
