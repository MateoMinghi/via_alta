'use client';

// --- IMPORTACIONES ---
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EstudianteSchedule from '../EstudianteSchedule';
import { useGetStudentSchedule, ScheduleItem } from '@/api/useGetStudentSchedule';
import { useScheduleChangeRequest } from '@/api/useScheduleChangeRequest';
import EstudianteStatusBanner from '../EstudianteStatusBanner';
import EstudianteHeader from '../EstudianteHeader';
import { useGetStudentAcademicHistory } from '@/api/useGetStudentAcademicHistory';
import Cookies from 'js-cookie';
import { useStudentDbStatus } from '@/api/useStudentDbStatus';

/**
 * Interfaz que define la estructura de una materia en el horario
 * Representa una materia con sus datos principales y horarios
 */
interface Subject {
  id: number;          // ID único de la materia
  title: string;       // Nombre de la materia
  professor: string;   // Nombre del profesor
  credits: number;     // Número de créditos
  salon: string;       // Ubicación/salón
  semester: number;    // Semestre al que pertenece
  hours: { day: string; time: string; timeStart?: string; timeEnd?: string }[]; // Días y horas de clase
}

/**
 * Custom component to directly check student status from the database
 * This component acts as a "source of truth" for the student status
 */
function StudentStatusCheck({ studentId, children }: { studentId: string, children: (status: string) => React.ReactNode }) {
  const { status, loading, error } = useStudentDbStatus(studentId);
  
  if (loading) {
    return <div>Verificando estado...</div>;
  }
  
  if (error) {
    console.error("Error checking student status:", error);
  }
  
  // Pass the current status from the database to the children function
  return <>{children(status || 'no-inscrito')}</>;
}

export default function Estudiante() {
    // --- ESTADOS ---
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);    // Control para diálogo de confirmación
    const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);    // Control para diálogo de solicitud de cambios
    const [isModifyingStatus, setIsModifyingStatus] = useState(false);        // Indicador de operación en proceso
    const [changeReason, setChangeReason] = useState('');                     // Razón de la solicitud de cambios
    const [comentarios, setComentarios] = useState('');                       // Comentarios guardados del estudiante
    
    // --- HOOKS Y CONTEXTO ---
    const router = useRouter();
    const { user } = useAuth();

    console.log('User data:', user);
    
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

    /**
     * Convierte los datos de la API a un formato más limpio y agrupado 
     * para mostrar en el horario
     */
    const convertToSubjects = (scheduleItems: ScheduleItem[] | null): Subject[] => {
      if (!scheduleItems) return [];
      
      // Agrupamos clases por materia y profesor
      const groupedItems: Record<string, ScheduleItem[]> = {};
      
      scheduleItems.forEach(item => {
      
        const materiaNombre = item.materianombre;
        const profesorNombre = item.profesornombre;
        
        if (!materiaNombre) {
          console.warn('Missing material name for item:', item);
          return;
        }
        
        // Creamos una clave única para agrupar la misma materia con el mismo profesor
        const key = `${materiaNombre}-${profesorNombre || 'Unknown'}`;
        if (!groupedItems[key]) {
          groupedItems[key] = [];
        }
        groupedItems[key].push(item);
      });

      // Convertimos los grupos a objetos Subject
      return Object.entries(groupedItems).map(([key, items], index) => {
        const firstItem = items[0];
        console.log('Creating subject from:', firstItem);
        
        const idGrupo = firstItem.idgrupo;
        const materiaNombre = firstItem.materianombre;
        const profesorNombre = firstItem.profesornombre;
        const tipoSalon = firstItem.tiposalon;
        const idSalon = firstItem.idsalon;
        const semestre = firstItem.semestre;
        
        const day = firstItem.dia;
        const timeStart = firstItem.horainicio;
        
        return {
          id: idGrupo || index,
          title: materiaNombre || `Asignatura ${index + 1}`,
          professor: profesorNombre || 'Profesor No Asignado',
          salon: tipoSalon ? `${tipoSalon} ${idSalon || ''}` : 'Por asignar',
          semester: semestre || 1,
          credits: 0, 
          // Mapeamos todos los horarios para esta materia
          hours: items.map(item => {
            const itemDay = item.dia;
            const itemTimeStart = item.horainicio;
            const itemTimeEnd = item.horafin;
            const itemTime = itemTimeStart && itemTimeEnd ? `${itemTimeStart} - ${itemTimeEnd}` : '';
            console.log(`Hour for ${materiaNombre}: day=${itemDay}, time=${itemTime}`);
            return {
              day: itemDay || '',
              time: itemTime || '',
              timeStart: itemTimeStart || '',
              timeEnd: itemTimeEnd || ''
            };
          })
        };
      });
    };
    
    // Convertimos los datos de la API a nuestro formato Subject
    const filteredSubjects = convertToSubjects(scheduleData);

    /**
     * Analiza el historial académico del estudiante para determinar las materias recomendadas
     * y configura las materias obligatorias y disponibles siguiendo el flujo de trabajo
     * para estudiantes irregulares.
     */
    const analyzeAcademicHistory = () => {
      if (!academicHistory || academicHistory.length === 0) {
        console.log("No academic history available for analysis");
        return {
          obligatoryCourseIds: [],
          recommededCourses: []
        };
      }

      // Obtener el semestre actual del estudiante
      const currentSemester = updatedUser?.semester || 1;
      
      // Identificar el plan de estudios completo del estudiante
      // Agrupar por semestres para facilitar el análisis
      const studyPlan = academicHistory.reduce<Record<number, any[]>>((acc, course) => {
        if (!acc[course.course_semester]) {
          acc[course.course_semester] = [];
        }
        acc[course.course_semester].push(course);
        return acc;
      }, {});
      
      // Identificar materias faltantes del plan de estudios 
      // (materias que no tienen calificación y no están en trámite de equivalencia)
      const pendingCourses = academicHistory.filter(course => 
        course.course_semester <= currentSemester && 
        !course.grade_final &&
        !course.grade_observations?.includes('equivalencia')
      );
      
      console.log(`Found ${pendingCourses.length} pending courses for recommendations`);
      
      // Ordenar materias faltantes por prioridad:
      // 1. Por semestre (prioritarios los semestres más bajos)
      // 2. Por créditos (mayor a menor)
      const prioritizedCourses = [...pendingCourses].sort((a, b) => {
        // Primero por semestre
        if (a.course_semester !== b.course_semester) {
          return a.course_semester - b.course_semester;
        }
        
        // Si están en el mismo semestre, por créditos (mayor primero)
        const aCredits = parseFloat(a.sep_credits);
        const bCredits = parseFloat(b.sep_credits);
        return bCredits - aCredits;
      });
      
      // Selección de materias obligatorias e importantes
      // Las 3 primeras materias serán obligatorias (las más básicas/importantes)
      const obligatoryCourseIds = prioritizedCourses
        .slice(0, 3)
        .map(course => course.course_id);
      
      // Las siguientes 3 serán recomendadas por su importancia
      const recommendedCourseNames = prioritizedCourses
        .slice(3, 6)
        .map(course => course.course_name);
      
      return {
        obligatoryCourseIds,
        recommendedCourses: recommendedCourseNames
      };
    };
    
    // Obtenemos las recomendaciones basadas en el historial académico
    const { obligatoryCourseIds = [], recommendedCourses = [] } = 
      !historyLoading && !scheduleLoading ? analyzeAcademicHistory() : {};

    /**
     * Maneja la confirmación del horario por parte del estudiante
     */
    const handleConfirmSchedule = async () => {
      setIsConfirmDialogOpen(false);
      setIsModifyingStatus(true);
      
      try {
        if (!scheduleData) {
          throw new Error("No hay datos de horario disponibles para confirmar");
        }
        
        if (!updatedUser?.ivd_id && !updatedUser?.id) {
          throw new Error("ID de estudiante no disponible");
        }
        
        // Usar ivd_id si está disponible, si no, usar id
        const effectiveStudentId = updatedUser.ivd_id?.toString() || updatedUser.id?.toString();
        
        // Llamamos a la API para confirmar el horario
        const result = await confirmSchedule(scheduleData);
        
        if (result?.success) {
          if (result.testMode) {
            // Si es modo de prueba (desarrollo)
            toast.success('Horario guardado en modo de prueba (puedes seguir haciendo cambios)');
            
            // Update user status in localStorage and cookies to prevent redirect
            if (user) {
              const updatedUserData = {
                ...user,
                status: 'inscrito' // Update status to inscrito
              };
              
              // Update in localStorage
              localStorage.setItem('via_alta_user', JSON.stringify(updatedUserData));
              
              // Update in cookies
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + 7);
              Cookies.set('user', JSON.stringify(updatedUserData), { 
                expires: expiryDate,
                path: '/',
                secure: window.location.protocol === 'https:'
              });
            }
            
            // Navigate to confirmation page with a special parameter to always show confirmation
            window.location.href = '/estudiante/confirmacion';
          } else {
            // Confirmación exitosa en producción
            localStorage.setItem('studentStatus', 'inscrito');
            localStorage.removeItem('studentComments');
            setComentarios('');
            toast.success('Horario confirmado correctamente');
            
            // Update user status in localStorage and cookies to prevent redirect
            if (user) {
              const updatedUserData = {
                ...user,
                status: 'inscrito' // Update status to inscrito
              };
              
              // Update in localStorage
              localStorage.setItem('via_alta_user', JSON.stringify(updatedUserData));
              
              // Update in cookies
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + 7);
              Cookies.set('user', JSON.stringify(updatedUserData), { 
                expires: expiryDate,
                path: '/',
                secure: window.location.protocol === 'https:'
              });
            }
            
            // Navigate to confirmation page with a special parameter to always show confirmation
            window.location.href = '/estudiante/confirmacion';
          }
        } else {
          throw new Error(result?.message || "Error al confirmar horario");
        }
      } catch (error) {
        console.error('Error al confirmar horario:', error);
        toast.error(`Error al confirmar el horario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setIsModifyingStatus(false);
      }
    };

    /**
     * Maneja el envío de solicitud de cambios al coordinador
     */
    const handleRequestChanges = async () => {
      setIsChangesDialogOpen(false);
      setIsModifyingStatus(true);
      
      try {
        // Validamos que haya un motivo para el cambio
        if (!changeReason.trim()) {
          toast.error('Debes proporcionar un motivo para solicitar cambios');
          setIsModifyingStatus(false);
          return;
        }
        
        if (!updatedUser?.id) {
          throw new Error("ID de estudiante no disponible");
        }
        
        // Enviamos la solicitud a la API
        const result = await submitChangeRequest(
          updatedUser.id.toString(),
          changeReason
        );
        
        if (!result) {
          throw new Error("Error al enviar la solicitud de cambios");
        }
        
        // Guardamos los comentarios para mostrarlos en el banner
        setComentarios(changeReason);
        
        // Update user status in localStorage and cookies to prevent redirect
        if (user) {
          const updatedUserData = {
            ...user,
            status: 'requiere-cambios' // Update status to requiere-cambios
          };
          
          // Update in localStorage
          localStorage.setItem('via_alta_user', JSON.stringify(updatedUserData));
          
          // Update in cookies
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          Cookies.set('user', JSON.stringify(updatedUserData), { 
            expires: expiryDate,
            path: '/',
            secure: window.location.protocol === 'https:'
          });
        }
        
        toast.success('Solicitud de cambios enviada correctamente');
        
        // Navigate to confirmation page with a special parameter to always show correct confirmation
        window.location.href = '/estudiante/confirmacion';
      } catch (error) {
        console.error('Error al solicitar cambios:', error);
        toast.error(error instanceof Error ? error.message : 'Error al enviar la solicitud de cambios');
      } finally {
        setIsModifyingStatus(false);
      }
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
        {updatedUser && (
          <EstudianteStatusBanner 
            studentId={updatedUser.ivd_id?.toString() || updatedUser.id?.toString()} 
            status={user?.status} 
            comments={comentarios}
          />
        )}

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
            recommendedCourses={recommendedCourses || []} 
          />
        ) : (
          <p className="text-center py-4 bg-gray-50 rounded-md">
            No hay materias disponibles para tu semestre. Contacta al coordinador académico.
          </p>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 py-8">
          {updatedUser?.ivd_id ? (
            <StudentStatusCheck studentId={updatedUser.ivd_id.toString()}>
              {(currentStatus) => (
                <>
                  {/* Botón de confirmar o mensaje de confirmado */}
                  {currentStatus !== 'inscrito' ? (
                    <Button 
                      className="w-full font-bold bg-red-700 hover:bg-red-800"
                      onClick={() => setIsConfirmDialogOpen(true)}
                      disabled={filteredSubjects.length === 0 || isModifyingStatus}
                    >
                      Confirmar Horario
                    </Button>
                  ) : (
                    <div className="w-full text-center p-2 bg-green-50 border-2 border-green-700 rounded-full flex flex-col sm:flex-row items-center justify-center gap-2">
                      <p className="text-green-700 font-semibold">
                        Ya has confirmado tu horario.
                      </p>
                    </div>
                  )}
                  
                  {/* Botón para solicitar cambios solo visible cuando no está confirmado */}
                  {currentStatus !== 'inscrito' && currentStatus !== 'requiere-cambios' && (
                    <Button 
                      className="w-full border-2 border-red-700 text-red-700 hover:bg-red-50 font-bold" 
                      variant="outline"
                      onClick={() => setIsChangesDialogOpen(true)}
                      disabled={filteredSubjects.length === 0 || isModifyingStatus}
                    >
                      Solicitar Cambios
                    </Button>
                  )}
                  
                  {/* Para usuarios con status requiere-cambios, mostrar botón para ver estado de solicitud */}
                  {currentStatus === 'requiere-cambios' && (
                    <div className="w-full">
                      <Button 
                        className="w-full border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-bold" 
                        variant="outline"
                        onClick={() => router.push('/estudiante/confirmacion')}
                      >
                        Ver estado de solicitud
                      </Button>
                    </div>
                  )}
                </>
              )}
            </StudentStatusCheck>
          ) : (
            <p>No ID available to check student status</p>
          )}
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

// prueba git