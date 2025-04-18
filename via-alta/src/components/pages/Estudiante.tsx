'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import EstudianteSchedule from '../EstudianteSchedule';
import { useGetStudentSchedule, ScheduleItem } from '@/api/useGetStudentSchedule';
import { useScheduleChangeRequest } from '@/api/useScheduleChangeRequest';

interface Subject {
  id: number;
  title: string;
  professor: string;
  credits: number;
  salon: string;
  semester: number;
  hours: { day: string; time: string }[];
}

// Posibles estados del estudiante
type StudentStatus = 'no-inscrito' | 'inscrito' | 'cambios-solicitados' | 'cancelado';

export default function Estudiante() {
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);
    const [isModifyingStatus, setIsModifyingStatus] = useState(false);
    const [changeReason, setChangeReason] = useState('');
    const router = useRouter();
    const [comentarios, setComentarios] = useState('');

    const { user } = useAuth();
    // Crear un nuevo objeto de usuario con el semestre por defecto
    const updatedUser = user ? { ...user, semester: user.semester || 3 } : null;
    console.log('User from context:', updatedUser);

    // Obtener el horario del estudiante
    const { 
      result: scheduleData, 
      loading, 
      error, 
      isIndividual,
      confirmSchedule
    } = useGetStudentSchedule(
      updatedUser?.id?.toString(), 
      updatedUser?.semester
    );

    const { 
      submitChangeRequest, 
      loading: changeRequestLoading,
      success: changeRequestSuccess,
      error: changeRequestError
    } = useScheduleChangeRequest();

    // Verificar si el estudiante tiene comentarios guardados
    useEffect(() => {
      // En un entorno real, esto vendría de una API
      // Por ahora usamos localStorage para persistencia de la demo
      const savedComments = localStorage.getItem('studentComments');
      
      if (savedComments) {
          setComentarios(savedComments);
      }
    }, []);

    // Convertir los datos del horario a un formato más manejable
    const convertToSubjects = (scheduleItems: ScheduleItem[] | null): Subject[] => {
      if (!scheduleItems) return [];
      
      // Agrupar los items por materia y profesor
      const groupedItems: Record<string, ScheduleItem[]> = {};
      
      scheduleItems.forEach(item => {
        const key = `${item.MateriaNombre}-${item.ProfesorNombre}`;
        if (!groupedItems[key]) {
          groupedItems[key] = [];
        }
        groupedItems[key].push(item);
      });
      
      // Crear un nuevo array de objetos Subject
      return Object.entries(groupedItems).map(([key, items], index) => {
        const firstItem = items[0];
        return {
          id: firstItem.IdGrupo || index,
          title: firstItem.MateriaNombre || `Asignatura ${index + 1}`,
          professor: firstItem.ProfesorNombre || `Profesor No Asignado`,
          salon: firstItem.TipoSalon ? `${firstItem.TipoSalon} ${firstItem.idsalon || ''}` : 'Por asignar',
          semester: firstItem.Semestre || 1,
          credits: 0, // Créditos no disponibles en la API
          hours: items.map(item => ({
            day: item.Dia,
            time: item.HoraInicio
          }))
        };
      });
    };
    
    const filteredSubjects = convertToSubjects(scheduleData);

    const handleConfirmSchedule = async () => {
      // Cambiar el estado del estudiante a inscrito
      setIsConfirmDialogOpen(false);
      setIsModifyingStatus(true);
      
      try {
        if (!scheduleData) {
          throw new Error("No schedule data available to confirm");
        }
        
        // Llamar a la función de confirmación del horario
        await confirmSchedule(scheduleData);
        
        localStorage.setItem('studentStatus', 'inscrito');
        localStorage.removeItem('studentComments');
        setComentarios('');
        toast.success('Horario confirmado correctamente');
        router.push('/estudiante/confirmacion');
      } catch (error) {
        console.error('Error confirming schedule:', error);
        toast.error('Error al confirmar el horario');
      } finally {
        setIsModifyingStatus(false);
      }
    };

    const handleRequestChanges = async () => {
      setIsChangesDialogOpen(false);
      setIsModifyingStatus(true);
      
      try {
        if (!changeReason.trim()) {
          toast.error('Debes proporcionar un motivo para solicitar cambios');
          setIsModifyingStatus(false);
          return;
        }
        
        if (!updatedUser?.id) {
          throw new Error("ID de estudiante no disponible");
        }
        
        // Subir la solicitud de cambios
        const result = await submitChangeRequest(
          updatedUser.id.toString(),
          changeReason
        );
        
        if (!result) {
          throw new Error("Error al enviar la solicitud de cambios");
        }
        
        // Aactualizar el estado del estudiante
        setComentarios(changeReason);
        
        toast.success('Solicitud de cambios enviada correctamente');
        router.push('/estudiante/confirmacion');
      } catch (error) {
        console.error('Error requesting changes:', error);
        toast.error(error instanceof Error ? error.message : 'Error al enviar la solicitud de cambios');
      } finally {
        setIsModifyingStatus(false);
      }
    };

    if (loading) {
      return (
        <div className="p-4">
          <p className="text-center">Cargando materias...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4">
          <p className="text-center text-red-600">Error: {error}</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        {user && user.status !== 'no-inscrito' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            user.status === 'inscrito' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {user.status === 'inscrito' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                )}
                
                <div>
                  <h2 className="text-lg font-semibold">
                    {user.status === 'inscrito' 
                      ? 'Horario Confirmado' 
                      : 'Cambios Solicitados'}
                  </h2>
                  <p className="text-sm">
                    {user.status === 'inscrito'
                      ? 'Tu horario ha sido confirmado exitosamente.'
                      : 'Has solicitado cambios en tu horario.'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {user.status === 'inscrito' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    onClick={() => setIsChangesDialogOpen(true)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Solicitar Cambios
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Horario
                  </Button>
                )}
                
                <Button
                  size="sm"
                  className="bg-red-700 hover:bg-red-800"
                  onClick={() => router.push('/estudiante/confirmacion')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Confirmación
                </Button>
              </div>
            </div>
            
            {user.status === 'cambios-solicitados' && comentarios && (
              <div className="mt-3 bg-white p-3 rounded border border-yellow-200">
                <p className="text-sm font-semibold mb-1">Motivo de tu solicitud:</p>
                <p className="text-sm">{comentarios}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-4 rounded-md mb-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            {isIndividual ? 'Tu Horario Confirmado' : 'Propuesta de Horario'}
          </h1>
          <p className="text-gray-700">
            Estudiante: <span className="font-semibold">{user ? `${user.name} ${user.first_surname} ${user.second_surname || ''}` : 'Cargando...'}</span> | 
            Semestre: <span className="font-semibold">{user?.semester || 'No disponible'}</span>
            {isIndividual && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Confirmado</span>}
          </p>
          <p className="text-gray-700 mt-2">
            {isIndividual 
              ? 'Este es tu horario confirmado para el semestre actual.' 
              : 'A continuación se muestra el horario propuesto para tu semestre. Por favor, revísalo cuidadosamente y confírmalo si estás de acuerdo. Si requieres cambios, utiliza la opción "Solicitar Cambios".'}
          </p>
        </div>
        
        {filteredSubjects.length > 0 ? (
          <EstudianteSchedule subjects={filteredSubjects} />
        ) : (
          <p className="text-center py-4 bg-gray-50 rounded-md">
            No hay materias disponibles para tu semestre. Contacta al coordinador académico.
          </p>
        )}
        
        {!isIndividual && (
          <div className="flex flex-col sm:flex-row justify-between gap-8 py-8">
            <Button 
              className="w-full font-bold bg-red-700 hover:bg-red-800"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={filteredSubjects.length === 0 || isModifyingStatus}
            >
              Confirmar Horario
            </Button>
            
            <Button 
              className="w-full border-2 border-red-700 text-red-700 hover:bg-red-50 font-bold" 
              variant="outline"
              onClick={() => setIsChangesDialogOpen(true)}
              disabled={filteredSubjects.length === 0 || isModifyingStatus}
            >
              Solicitar Cambios
            </Button>
          </div>
        )}
        
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmación de Horario</DialogTitle>
              <DialogDescription>
                ¿Estás seguro que deseas confirmar este horario? Una vez confirmado, no podrás realizar cambios sin la autorización del coordinador.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-red-700 hover:bg-red-800"
                onClick={handleConfirmSchedule}
                disabled={isModifyingStatus}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isChangesDialogOpen} onOpenChange={setIsChangesDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitud de Cambios</DialogTitle>
              <DialogDescription>
                Por favor describe detalladamente qué cambios necesitas realizar en tu horario.
                El coordinador evaluará tu solicitud.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              <textarea 
                className="w-full border-2 border-gray-200 rounded-md p-2 min-h-[100px]"
                placeholder="Explica aquí tu solicitud de cambios..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangesDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-red-700 hover:bg-red-800"
                onClick={handleRequestChanges}
                disabled={isModifyingStatus || !changeReason.trim()}
              >
                Enviar Solicitud
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
}