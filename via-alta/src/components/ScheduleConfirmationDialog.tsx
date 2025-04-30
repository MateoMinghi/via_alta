import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ScheduleConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isCoordinator?: boolean;
}

const ScheduleConfirmationDialog: React.FC<ScheduleConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isCoordinator = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-red-500">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            Confirmación de Horario
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-base py-2">
            {isCoordinator 
              ? "¿Está seguro que desea guardar este horario? Esta acción confirmará la selección de materias para el estudiante."
              : "¿Estás seguro que deseas confirmar este horario? Una vez confirmado, no podrás realizar cambios sin la autorización del coordinador."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="text-gray-600 bg-gray-100 hover:bg-gray-200 border-none">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-700 text-white hover:bg-red-800"
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ScheduleConfirmationDialog;