'use client';

// --- IMPORTACIONES ---
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EstudianteSchedule from '../EstudianteSchedule';
import { useGetStudentSchedule } from '@/api/useGetStudentSchedule';
import { useScheduleChangeRequest } from '@/api/useScheduleChangeRequest';
import EstudianteStatusBanner from '../EstudianteStatusBanner';
import EstudianteHeader from '../EstudianteHeader';
import { useGetStudentAcademicHistory } from '@/api/useGetStudentAcademicHistory';

// Import Model and Controller
import { StudentModel, Subject, AcademicRecommendations } from '@/lib/models/StudentModel';
import { StudentController } from '@/app/api/controllers/StudentController';

export default function Estudiante() {
    // --- ESTADOS ---
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);    // Control para diálogo de confirmación
    const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);    // Control para diálogo de solicitud de cambios
    const [isModifyingStatus, setIsModifyingStatus] = useState(false);        // Indicador de operación en proceso
    const [changeReason, setChangeReason] = useState('');                     // Razón de la solicitud de cambios
    const [comentarios, setComentarios] = useState('');                       // Comentarios guardados del estudiante
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);  // Materias procesadas
    const [academicRecommendations, setAcademicRecommendations] = useState<AcademicRecommendations>({
      obligatoryCourseIds: [],
      recommendedCourses: []
    });
    
    // --- HOOKS Y CONTEXTO ---
    const router = useRouter();
    const { user } = useAuth();
    
    // Aseguramos que el usuario siempre tenga un semestre asignado (valor por defecto: 3)
    const updatedUser = user ? { ...user, semester: user.semester || 3 } : null;

    // Obtenemos el horario del estudiante desde la API
    const { 
      result: scheduleData,      // Datos del horario
      loading: scheduleLoading,  // Indicador de carga
      error: scheduleError,      // Error (si existe)
      isIndividual,              // Indica si es un horario individual
      confirmSchedule            // Función para confirmar el horario
    } = useGetStudentSchedule(
      updatedUser?.ivd_id?.toString() || updatedUser?.id?.toString(),
      updatedUser?.semester
    );

    // Obtenemos el historial académico del estudiante
    const {
      academicHistory,
      loading: historyLoading,
      error: historyError
    } = useGetStudentAcademicHistory(updatedUser?.ivd_id?.toString());

    // Hook para manejar solicitudes de cambios en el horario
    const { 
      submitChangeRequest,            // Función para enviar solicitud
      loading: changeRequestLoading,  // Indicador de carga
      success: changeRequestSuccess,  // Indicador de éxito
      error: changeRequestError       // Error (si existe)
    } = useScheduleChangeRequest();

    // Al iniciar, recuperamos los comentarios guardados en localStorage
    useEffect(() => {
      const savedComments = StudentController.getStudentComments();
      if (savedComments) {
        setComentarios(savedComments);
      }
    }, []); // This effect should only run once

    // Procesamos los datos cuando se cargan
    useEffect(() => {
      if (!scheduleLoading && scheduleData) {
        // Usamos el modelo para transformar los datos
        const subjects = StudentModel.convertToSubjects(scheduleData);
        setFilteredSubjects(subjects);
      }
    }, [scheduleData, scheduleLoading]); // Remove scheduleError as it might change frequently

    // Analizamos el historial académico cuando esté disponible
    useEffect(() => {
      if (!historyLoading && academicHistory && updatedUser?.semester) {
        // Usamos el modelo para obtener recomendaciones
        const recommendations = StudentModel.analyzeAcademicHistory(
          academicHistory,
          updatedUser.semester || 1
        );
        
        // Only update if there's an actual change to avoid re-renders
        if (JSON.stringify(recommendations) !== JSON.stringify(academicRecommendations)) {
          setAcademicRecommendations(recommendations);
        }
      }
    }, [academicHistory, historyLoading, updatedUser?.semester]); // Remove historyError and full updatedUser object

    /**
     * Maneja la confirmación del horario por parte del estudiante
     */
    const handleConfirmSchedule = async () => {
      setIsConfirmDialogOpen(false);
      setIsModifyingStatus(true);
      
      // Usamos el controlador para manejar la confirmación
      const effectiveStudentId = updatedUser?.ivd_id?.toString() || updatedUser?.id?.toString() || '';
      const result = await StudentController.confirmSchedule(
        scheduleData,
        effectiveStudentId,
        (data) => confirmSchedule(data || [])
      );
      
      if (result.success) {
        setComentarios('');
        toast.success('Horario confirmado correctamente');
        router.push('/estudiante/confirmacion');
      } else {
        toast.error(`Error al confirmar el horario: ${result.message}`);
      }
      
      setIsModifyingStatus(false);
    };

    /**
     * Maneja el envío de solicitud de cambios al coordinador
     */
    const handleRequestChanges = async () => {
      setIsChangesDialogOpen(false);
      setIsModifyingStatus(true);
      
      // Usamos el controlador para manejar la solicitud de cambios
      const studentId = updatedUser?.id?.toString() || '';
      const result = await StudentController.requestScheduleChanges(
        studentId,
        changeReason,
        submitChangeRequest
      );
      
      if (result.success) {
        setComentarios(changeReason);
        toast.success('Solicitud de cambios enviada correctamente');
        router.push('/estudiante/confirmacion');
      } else {
        toast.error(result.message || 'Error al procesar la solicitud');
      }
      
      setIsModifyingStatus(false);
    };

    // --- RENDERIZADO CONDICIONAL: CARGA Y ERROR ---
    if (scheduleLoading || historyLoading) {
      return (
        <div className="p-4">
          <p className="text-center">Cargando materias...</p>
        </div>
      );
    }

    if (scheduleError || historyError) {
      return (
        <div className="p-4">
          <p className="text-center text-red-600">Error: {scheduleError || historyError}</p>
        </div>
      );
    }

    // --- COMPONENTE PRINCIPAL ---
    return (
      <div className="p-4">
        {/* Encabezado con información del estudiante */}
        <EstudianteHeader />
        
        {/* Banner que muestra el estado de inscripción */}
        {user && <EstudianteStatusBanner status={user.status} comments={comentarios}/>}

        {/* Sección informativa */}
        <div className="bg-white p-4 rounded-md mb-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Propuesta de Horario
          </h1>
          <p className="text-gray-700">
            Estudiante: <span className="font-semibold">{user ? `${user.name} ${user.first_surname} ${user.second_surname || ''}` : 'Cargando...'}</span> | 
            Semestre: <span className="font-semibold">{updatedUser?.semester || 'No disponible'}</span>
          </p>
          <p className="text-gray-700 mt-2">
            A continuación se muestra el horario propuesto para tu semestre. Por favor, revísalo cuidadosamente y confírmalo si estás de acuerdo. Si requieres cambios, utiliza la opción "Solicitar Cambios"
          </p>
          <p className="flex items-center gap-1 text-gray-700 mt-2">
            Se recomienda que agregues alguna de las materias recomendadas a tu horario, ya que son importantes para tu formación académica.
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 flex-shrink-0">
              <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </p>
        </div>

        {/* Horario del estudiante o mensaje si no hay materias */}
        {filteredSubjects.length > 0 ? (
          <EstudianteSchedule 
            subjects={filteredSubjects} 
            isRegular={updatedUser?.regular !== false}
            recommendedCourses={academicRecommendations.recommendedCourses || []} 
          />
        ) : (
          <p className="text-center py-4 bg-gray-50 rounded-md">
            No hay materias disponibles para tu semestre. Contacta al coordinador académico.
          </p>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 py-8">
          {/* Botón de confirmar o mensaje de confirmado */}
          {user && !(user.status === 'inscrito') ? (
            <Button 
              className="w-full font-bold bg-red-700 hover:bg-red-800"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={filteredSubjects.length === 0 || isModifyingStatus}
            >
              Confirmar Horario
            </Button>
          ) : (
            <div className="w-full text-center p-2 bg-green-50 border-2 border-green-700 rounded-full">
              <p className="text-green-700 font-semibold">
                Ya has confirmado tu horario.
              </p>
            </div>
          )}
          
          {/* Botón para solicitar cambios */}
          <Button 
            className="w-full border-2 border-red-700 text-red-700 hover:bg-red-50 font-bold" 
            variant="outline"
            onClick={() => setIsChangesDialogOpen(true)}
            disabled={filteredSubjects.length === 0 || isModifyingStatus}
          >
            Solicitar Cambios
          </Button>
        </div>
  
        {/* Diálogo de confirmación */}
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
        
        {/* Diálogo para solicitar cambios */}
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