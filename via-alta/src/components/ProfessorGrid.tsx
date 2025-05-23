'use client';

import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Subject {
  id: number;
  name: string;
}

interface AvailabilityGridProps {
  selectedSlots: Record<string, boolean>
  setSelectedSlots: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  professorId?: number;
  // New props for subject preferences
  subjects?: Subject[];
  subjectPreferences: Record<string, number>;
  setSubjectPreferences: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

export default function AvailabilityGrid({
  selectedSlots,
  setSelectedSlots,
  subjects = [],
  subjectPreferences = {},
  setSubjectPreferences,
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
    setSelectedSlots((prev) => {
      const newSelection = { ...prev };
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
  // Function to handle subject selection for a slot
  const handleSubjectSelect = useCallback((slotKey: string, subjectId: number) => {
    setSubjectPreferences((prev) => ({
      ...prev,
      [slotKey]: subjectId
    }));
  }, [setSubjectPreferences]);

  const Cell = useCallback(
    ({ day, time }: { day: string; time: string }) => {
      const slotKey = `${day}-${time}`;
      const isSelected = Boolean(selectedSlots[slotKey]);
      const isTempSelected = tempSelectedSlots[slotKey];
      const selectedSubjectId = subjectPreferences[slotKey];
      
      // Find the selected subject for this slot
      const selectedSubject = selectedSubjectId 
        ? subjects.find(s => s.id === selectedSubjectId) 
        : undefined;

      let cellState: 'selected' | 'unselected' | 'selecting' | 'unselecting' = 'unselected';
      if (isSelected && isTempSelected === undefined) cellState = 'selected';
      else if (isTempSelected === true) cellState = 'selecting';
      else if (isTempSelected === false) cellState = 'unselecting';

      return (
        <div
          className={cn(
            'h-8 border border-gray-200 cursor-pointer transition-all duration-200 relative',
            cellState === 'selected' && 'bg-green-500/70',
            cellState === 'selecting' && 'bg-green-500/40',
            cellState === 'unselecting' && 'bg-red-500/70',
            cellState === 'unselected' && 'hover:bg-gray-100',
          )}
          onMouseDown={() => handleMouseDown(day, time)}
          onMouseEnter={() => handleMouseEnter(day, time)}
        >
          {isSelected && subjects.length > 0 && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger className="text-xs text-white font-medium flex items-center w-full h-full justify-center focus:outline-none">
                  {selectedSubject ? (
                    <div className="flex items-center gap-1 px-1 max-w-full overflow-hidden">
                      <span className="truncate">{selectedSubject.name}</span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1">
                      <span>Asignar</span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  {subjects.map((subject) => (
                    <DropdownMenuItem
                      key={subject.id}
                      className="flex items-center justify-between"
                      onClick={() => handleSubjectSelect(slotKey, subject.id)}
                    >
                      <span className="truncate">{subject.name}</span>
                      {selectedSubjectId === subject.id && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      );    },
    [
      selectedSlots, 
      tempSelectedSlots, 
      handleMouseDown, 
      handleMouseEnter, 
      subjects, 
      subjectPreferences, 
      handleSubjectSelect
    ],
  );

  return (
    <div className="overflow-x-auto">
      <div>
        <div className="grid grid-cols-[50px_repeat(5,1fr)]">
          <div className="h-10 pl-0 " />
          {days.map((day) => (
            <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
              {day}
            </div>
          ))}

          {timeSlots.map((time) => (
            <React.Fragment key={time}>
            <div className="h-8 flex items-center justify-start text-sm text-muted-foreground">{time}</div>
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
