'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useGetSubjects } from '@/api/getSubjects';
import { ResponseType } from "@/types/response";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import EstudianteSchedule from '../EstudianteSchedule';

interface Subject {
  id: number;
  title: string;
  professor: string;
  credits: number;
  salon: string;
  semester: number;
  hours: { day: string; time: string }[];
}

// Possible student statuses
type StudentStatus = 'no-inscrito' | 'inscrito' | 'cambios-solicitados' | 'cancelado';

export default function Estudiante() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);
    const [isModifyingStatus, setIsModifyingStatus] = useState(false);
    const [changeReason, setChangeReason] = useState('');
    const router = useRouter();
    const [comentarios, setComentarios] = useState('');

    const { user, login } = useAuth();
    // Create a user object with semester if it doesn't exist
    const updatedUser = user ? { ...user, semester: user.semester || 3 } : null;
    console.log('User from context:', updatedUser);

    // Verificar si el estudiante tiene comentarios guardados
    useEffect(() => {
      // En un entorno real, esto vendría de una API
      // Por ahora usamos localStorage para persistencia de la demo
      const savedComments = localStorage.getItem('studentComments');
      
      if (savedComments) {
          setComentarios(savedComments);
      }
  }, []);

    // Set loading to false if there's no user semester after a delay
    useEffect(() => {
      if (!updatedUser?.semester) {
        // If there's no semester, wait a bit and then set loading to false
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1000); // Give the user object a chance to load
        return () => clearTimeout(timer);
      }
    }, [updatedUser]);

    // Effect para redireccionar si ya tiene un status definido


    // Fetch and filter subjects for the specific semester
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/schedule');
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch schedule');
        }        console.log('Raw data from API:', result.data);
        console.log('Filtering for semester:', user?.semester);
        
        // Filter subjects for the current semester and transform the data
        const subjectsForSemester = result.data
          .filter((item: any) => {
            // Check for both uppercase and lowercase field names
            const itemSemester = item.Semestre || item.semestre;
            console.log('Item:', item);
            console.log('Item semester:', itemSemester, 'Target semester:', user?.semester);
            return (itemSemester === updatedUser?.semester);
          })
          .reduce((acc: Subject[], item: any) => {
            // Find if we already have this subject in our accumulator
            const subjectTitle = item.materianombre || item.MateriaNombre || item.NombreCarrera || item.nombrecarrera;
            const professorName = item.profesornombre || item.ProfesorNombre || `Prof ${item.IdProfesor || item.idprofesor}`;
            
            const existingSubject = acc.find(
              s => s.title === subjectTitle && s.professor === professorName
            );
  
            if (existingSubject) {
              // Add the new hour to existing subject
              existingSubject.hours.push({
                day: item.Dia || item.dia,
                time: item.HoraInicio || item.horainicio
              });
              return acc;
            } else {
              // Create new subject entry
              const newSubject = {
                id: item.IdMateria || item.idmateria || acc.length + 1,
                title: subjectTitle,
                professor: professorName,
                salon: item.classroom || item.Salon || 'Por asignar',
                semester: item.Semestre || item.semestre,
                credits: item.credits || 0,
                hours: [{
                  day: item.Dia || item.dia,
                  time: item.HoraInicio || item.horainicio
                }]
              };
              console.log('Creating new subject:', newSubject);
              acc.push(newSubject);
              return acc;
            }
          }, []);
  
        setFilteredSubjects(subjectsForSemester);
        
        if (subjectsForSemester.length === 0) {
          toast.warning(`No hay materias disponibles para el semestre ${user?.semester}`);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar las materias');
        toast.error('Error al cargar las materias');
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      if (updatedUser?.semester !== null && updatedUser?.semester !== undefined) {
        fetchSubjects();
      }
    }, [updatedUser?.semester]);

  const handleConfirmSchedule = () => {
    // Cambiar el estado del estudiante a inscrito
    setIsConfirmDialogOpen(false);
    setIsModifyingStatus(true);
    
    try {
      // En un entorno real, aquí se haría una llamada a la API para actualizar el estado del usuario
      localStorage.setItem('studentStatus', 'inscrito');
      localStorage.removeItem('studentComments');
      setComentarios('');
      toast.success('Horario confirmado correctamente');
      router.push('/estudiante/confirmacion');
    } catch (error) {
      toast.error('Error al confirmar el horario');
      setIsModifyingStatus(false);
    }
  };

  const handleRequestChanges = () => {
    setIsChangesDialogOpen(false);
    setIsModifyingStatus(true);
    
    try {
      if (!changeReason.trim()) {
        toast.error('Debes proporcionar un motivo para solicitar cambios');
        setIsModifyingStatus(false);
        return;
      }
      
      // En un entorno real, aquí se haría una llamada a la API para actualizar el estado del usuario
      localStorage.setItem('studentStatus', 'cambios-solicitados');
      localStorage.setItem('studentComments', changeReason);
      setComentarios(changeReason);
      
      toast.success('Solicitud de cambios enviada correctamente');
      router.push('/estudiante/confirmacion');
    } catch (error) {
      toast.error('Error al enviar la solicitud de cambios');
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
        <h1 className="text-2xl font-bold text-red-700 mb-2">Propuesta de Horario</h1>
        <p className="text-gray-700">
          Estudiante: <span className="font-semibold">{user ? `${user.name} ${user.first_surname} ${user.second_surname || ''}` : 'Cargando...'}</span> | 
          Semestre: <span className="font-semibold">{user?.semester || 'No disponible'}</span>
        </p>
        <p className="text-gray-700 mt-2">
          A continuación se muestra el horario propuesto para tu semestre.
          Por favor, revísalo cuidadosamente y confírmalo si estás de acuerdo.
          Si requieres cambios, utiliza la opción "Solicitar Cambios".
        </p>
      </div>
      
      {filteredSubjects.length > 0 ? (
        <EstudianteSchedule subjects={filteredSubjects} />
      ) : (
        <p className="text-center py-4 bg-gray-50 rounded-md">
          No hay materias disponibles para tu semestre. Contacta al coordinador académico.
        </p>
      )}
      
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