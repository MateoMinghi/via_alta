import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, School, MapPin } from 'lucide-react';
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
      <DialogContent className="p-0 overflow-hidden max-w-md border-none">
        {/* Colorful header */}
        <div className="bg-black text-white p-6 ">
          <div className="flex flex-col items-start justify-between ">
            <DialogHeader className="text-left space-y-1 p-0 w-full ">
              <DialogTitle className="text-xl font-bold text-white">
                {group.MateriaNombre}
              </DialogTitle>
              
              {/* Indicadores principales: Grupo, Semestre y Créditos */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 bg-white/50 rounded-full text-white font-bold text-sm">
                  Grupo: {group.IdGrupo}
                </span>
                
                {group.Semestre !== undefined && (
                  <span className="inline-flex items-center px-3 py-1 bg-white/50 rounded-full text-white font-bold text-sm">
                    Semestre {group.Semestre}
                  </span>
                )}
              </div>
            </DialogHeader>
          </div>
        </div>
        
        {/* Content section */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Professor info */}
            <div className="flex gap-3 items-center pl-4">
                <User className="h-5 w-5 text-via" />
                <div>
                <h3 className="text-sm font-medium text-gray-500">Profesor</h3>
                <p className="text-base font-medium">{group.ProfesorNombre || 'Sin asignar'}</p>
              </div>
            </div>
            
            {/* Schedule info */}
         
              <div className="flex gap-3 items-center pl-4">
                 <Clock className="h-5 w-5 text-via" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Horarios</h3>
                <div>
                  <p className="text-base font-medium">{group.Dia}: {group.HoraInicio} - {group.HoraFin}</p>
                </div>
              </div>
            </div>
            
            {/* Location info */}
            <div className="flex gap-3 items-center pl-4">
                <MapPin className="h-5 w-5 text-via" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Salón</h3>
                <p className="text-base font-medium">{group.IdSalon ? `Salón ${group.IdSalon}` : 'Por asignar'}</p>
              </div>
            </div>
            
            {/* Career info */}
            <div className="flex gap-3 items-center pl-4">
                <School className="h-5 w-5 text-via" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Carrera</h3>
                <p className="text-base font-medium">{group.NombreCarrera}</p>
              </div>
            </div>

          </div>
        </div>    
        <div className="flex justify-center items-center gap-4 p-4 w-full">
          {onEdit && (
            <Button 
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-600"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoDialog;
