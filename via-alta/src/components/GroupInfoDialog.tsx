import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface GroupInfoDialogProps {
  open: boolean;
  onClose: () => void;
  group: {
    IdGrupo: number;
    MateriaNombre?: string;
    ProfesorNombre?: string;
    NombreCarrera?: string;
    Semestre?: number;
    Dia?: string;
    HoraInicio?: string;
    HoraFin?: string;
    IdHorarioGeneral?: number;
  } | null;
}

const GroupInfoDialog: React.FC<GroupInfoDialogProps> = ({ open, onClose, group }) => {
  if (!group) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Información del Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div><b>Materia:</b> {group.MateriaNombre}</div>
          <div><b>Profesor:</b> {group.ProfesorNombre}</div>
          <div><b>Carrera:</b> {group.NombreCarrera}</div>
          <div><b>Semestre:</b> {group.Semestre}</div>
          <div><b>Día:</b> {group.Dia}</div>
          <div><b>Hora Inicio:</b> {group.HoraInicio}</div>
          <div><b>Hora Fin:</b> {group.HoraFin}</div>
          <div><b>ID Grupo:</b> {group.IdGrupo}</div>
          {group.IdHorarioGeneral && <div><b>ID Horario General:</b> {group.IdHorarioGeneral}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoDialog;
