// Componente para mostrar y editar los detalles de una materia individual
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { ScheduleItem } from "@/lib/schedule-generator";
import { toast } from "sonner";

interface IndividualSubjectProps {
  subject: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedSubject: ScheduleItem, originalSubject: ScheduleItem) => void;
  onDelete?: (subject: ScheduleItem) => void;
}

export function IndividualSubject({ 
  subject, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete 
}: IndividualSubjectProps) {
  const [editedSubject, setEditedSubject] = useState<ScheduleItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Arreglo de días disponibles
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  
  // Genera horarios disponibles (7:00 a 16:30 en incrementos de media hora)
  const timeSlots = (() => {
    const slots = [];
    for (let i = 7; i <= 16; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  })();

  // Actualiza la materia editada cuando cambia la materia seleccionada
  useEffect(() => {
    if (subject) {
      setEditedSubject({...subject});
    } else {
      setEditedSubject(null);
    }
    setIsEditing(false);
  }, [subject]);

  if (!subject || !editedSubject) return null;

  const handleSave = () => {
    if (!editedSubject) return;
    
    // Calcula la hora de finalización (1 hora después del inicio)
    const calculateEndTime = (time: string): string => {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      date.setHours(date.getHours() + 1);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const updatedSubject = {
      ...editedSubject,
      endTime: calculateEndTime(editedSubject.time)
    };

    if (onUpdate) {
      onUpdate(updatedSubject, subject);
      toast.success("Clase actualizada correctamente");
    }
    
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!subject || !onDelete) return;
    
    onDelete(subject);
    onClose();
    toast.success("Clase eliminada correctamente");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Clase" : subject.subject}</DialogTitle>
        </DialogHeader>
        
        {isEditing ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-teacher" className="text-right">Profesor</Label>
              <Input
                id="edit-teacher"
                value={editedSubject.teacher}
                onChange={(e) => setEditedSubject({...editedSubject, teacher: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subject" className="text-right">Materia</Label>
              <Input
                id="edit-subject"
                value={editedSubject.subject}
                onChange={(e) => setEditedSubject({...editedSubject, subject: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-day" className="text-right">Día</Label>
              <Select 
                value={editedSubject.day} 
                onValueChange={(value) => setEditedSubject({...editedSubject, day: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-time" className="text-right">Hora</Label>
              <Select 
                value={editedSubject.time} 
                onValueChange={(value) => setEditedSubject({...editedSubject, time: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-classroom" className="text-right">Salón</Label>
              <Input
                id="edit-classroom"
                value={editedSubject.classroom}
                onChange={(e) => setEditedSubject({...editedSubject, classroom: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-semester" className="text-right">Semestre</Label>
              <Select 
                value={editedSubject.semester.toString()} 
                onValueChange={(value) => setEditedSubject({...editedSubject, semester: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{`Semestre ${sem}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Profesor:</div>
              <div className="col-span-3">{subject.teacher}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Día:</div>
              <div className="col-span-3">{subject.day}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Hora:</div>
              <div className="col-span-3">{subject.time} - {subject.endTime} </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Salón:</div>
              <div className="col-span-3">{subject.classroom}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Semestre:</div>
              <div className="col-span-3">{subject.semester}</div>
            </div>
          </div>
        )}

        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}