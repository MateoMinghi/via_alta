import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';

interface GroupInfoDialogProps {
  open: boolean;
  onClose: () => void;
  group: GeneralScheduleItem | null;
  onEdit?: (group: GeneralScheduleItem) => void;
  onDelete?: (group: GeneralScheduleItem) => void;
}

const GroupInfoDialog: React.FC<GroupInfoDialogProps> = ({ open, onClose, group, onEdit, onDelete }) => {
  if (!group) return null;

  const handleEdit = () => {
    if (onEdit && group) {
      onEdit(group);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && group) {
      onDelete(group);
      onClose();
    }
  };

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
          <div><b>Semestre:</b> {group.Semestre !== undefined ? group.Semestre : 'No disponible'}</div>
          <div><b>Día:</b> {group.Dia}</div>
          <div><b>Hora Inicio:</b> {group.HoraInicio}</div>
          <div><b>Hora Fin:</b> {group.HoraFin}</div>
          <div><b>ID Grupo:</b> {group.IdGrupo}</div>
          <div><b>ID Salón:</b> {group.IdSalon || 'No asignado'}</div>
        </div>
        <DialogFooter className="mt-6 flex justify-between sm:justify-end gap-2">
          {onEdit && (
            <Button 
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Pencil size={16} />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={handleDelete} 
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Eliminar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoDialog;
