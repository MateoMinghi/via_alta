import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, School, MapPin } from 'lucide-react';

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
    salon?: string;
    credits?: number;
  } | null;
}

const GroupInfoDialog: React.FC<GroupInfoDialogProps> = ({ open, onClose, group }) => {
  if (!group) return null;
  
  // Get a color for the header based on the first letter of the subject name
  const colorOptions = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
    'bg-cyan-500', 'bg-orange-500', 'bg-emerald-500', 'bg-violet-500'
  ];
  
  const firstLetter = (group.MateriaNombre || 'A').charAt(0).toUpperCase();
  const colorIndex = (firstLetter.charCodeAt(0) - 65) % colorOptions.length;
  const headerColor = colorOptions[colorIndex >= 0 ? colorIndex : 0];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden max-w-md">
        {/* Colorful header */}
        <div className={`${headerColor} text-white p-6`}>
          <div className="flex flex-col items-start justify-between">
            <DialogHeader className="text-left space-y-1 p-0 w-full">
              <DialogTitle className="text-xl font-bold text-white">
                {group.MateriaNombre}
              </DialogTitle>
              
              {/* Indicadores principales: Grupo, Semestre y Créditos */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white font-bold text-sm">
                  Grupo: {group.IdGrupo}
                </span>
                
                {group.Semestre !== undefined && (
                  <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white font-bold text-sm">
                    Semestre {group.Semestre}
                  </span>
                )}

                {group.credits !== undefined && (
                  <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white font-bold text-sm">
                  créditos: {group.credits || 0} 
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
            <div className="flex gap-3 items-start">
              <div className="bg-blue-50 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Profesor</h3>
                <p className="text-base font-medium">{group.ProfesorNombre || 'Sin asignar'}</p>
              </div>
            </div>
            
            {/* Schedule info */}
            <div className="flex gap-3 items-start">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Horarios</h3>
                <div>
                  {group.hours && group.hours.length > 0 ? (
                    group.hours.map((hour, index) => (
                      <p key={index} className="text-base font-medium">
                        {hour.day}: {hour.timeStart || group.HoraInicio} - {hour.timeEnd || group.HoraFin}
                      </p>
                    ))
                  ) : (
                    <p className="text-base font-medium">{group.Dia}: {group.HoraInicio} - {group.HoraFin}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location info */}
            <div className="flex gap-3 items-start">
              <div className="bg-green-50 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Salón</h3>
                <p className="text-base font-medium">{group.salon || 'Por asignar'}</p>
              </div>
            </div>
            
            {/* Career info */}
            <div className="flex gap-3 items-start">
              <div className="bg-purple-50 p-2 rounded-lg">
                <School className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Carrera</h3>
                <p className="text-base font-medium">{group.NombreCarrera}</p>
              </div>
            </div>
            
            {/* Se eliminó la sección de créditos ya que ahora está en la parte superior */}
            
            {/* Eliminado el campo de ID Horario */}
          </div>
        </div>    
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoDialog;
