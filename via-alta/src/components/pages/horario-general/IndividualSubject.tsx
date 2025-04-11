// Componente para mostrar y editar los detalles de una materia individual
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { GeneralScheduleItem } from "@/lib/models/general-schedule";
import { toast } from "sonner";

interface IndividualSubjectProps {
  subject: GeneralScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedSubject: GeneralScheduleItem, originalSubject: GeneralScheduleItem) => void;
  onDelete?: (subject: GeneralScheduleItem) => void;
}

export function IndividualSubject({ 
  subject, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete 
}: IndividualSubjectProps) {
  const [editedSubject, setEditedSubject] = useState<GeneralScheduleItem | null>(null);
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
    
    if (onUpdate) {
      onUpdate(editedSubject, subject);
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
          <DialogTitle>{isEditing ? "Editar Clase" : editedSubject.NombreCarrera}</DialogTitle>
        </DialogHeader>
        
        {isEditing ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-IdProfesor" className="text-right">ID Profesor</Label>
              <Input
                id="edit-IdProfesor"
                type="number"
                value={editedSubject.IdProfesor}
                onChange={(e) => setEditedSubject({...editedSubject, IdProfesor: parseInt(e.target.value)})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-IdMateria" className="text-right">ID Materia</Label>
              <Input
                id="edit-IdMateria"
                type="number"
                value={editedSubject.IdMateria}
                onChange={(e) => setEditedSubject({...editedSubject, IdMateria: parseInt(e.target.value)})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-Dia" className="text-right">Día</Label>
              <Select 
                value={editedSubject.Dia} 
                onValueChange={(value) => setEditedSubject({...editedSubject, Dia: value})}
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
              <Label htmlFor="edit-HoraInicio" className="text-right">Hora Inicio</Label>
              <Select 
                value={editedSubject.HoraInicio} 
                onValueChange={(value) => setEditedSubject({...editedSubject, HoraInicio: value})}
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
              <Label htmlFor="edit-HoraFin" className="text-right">Hora Fin</Label>
              <Select 
                value={editedSubject.HoraFin} 
                onValueChange={(value) => setEditedSubject({...editedSubject, HoraFin: value})}
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
              <Label htmlFor="edit-Semestre" className="text-right">Semestre</Label>
              <Select 
                value={editedSubject.Semestre.toString()} 
                onValueChange={(value) => setEditedSubject({...editedSubject, Semestre: parseInt(value)})}
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
              <div className="font-semibold">ID Profesor:</div>
              <div className="col-span-3">{subject.IdProfesor}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">ID Materia:</div>
              <div className="col-span-3">{subject.IdMateria}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Día:</div>
              <div className="col-span-3">{subject.Dia}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Hora:</div>
              <div className="col-span-3">{subject.HoraInicio} - {subject.HoraFin}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-semibold">Semestre:</div>
              <div className="col-span-3">{subject.Semestre}</div>
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