'use client';

import { AlertCircle, CheckCircle, Calendar, Clock } from 'lucide-react';
import { useStudentDbStatus } from '@/api/useStudentDbStatus';

interface StatusBannerProps {
  studentId?: string;
  status?: string;  // This becomes optional as we'll prioritize direct database status
  comments?: string;
}

/**
 * Component that shows a banner with the student's status
 * Uses direct database checking for real-time status
 */
export default function EstudianteStatusBanner({ studentId, status: propStatus, comments }: StatusBannerProps) {
  // If we have a studentId, directly check status from database
  if (studentId) {
    return <DatabaseStatusBanner studentId={studentId} comments={comments} />;
  }
  
  // Fallback to prop-based status if no studentId provided
  return <StatusBannerByProp status={propStatus || 'no-inscrito'} comments={comments} />;
}

/**
 * Banner component that gets status directly from database
 */
function DatabaseStatusBanner({ studentId, comments }: { studentId: string, comments?: string }) {
  const { status, loading } = useStudentDbStatus(studentId);
  
  if (loading) {
    return (
      <div className="mb-6 p-4 rounded-lg border bg-gray-50 border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-gray-300 animate-pulse"></div>
          <div>
            <h2 className="text-lg font-semibold">Verificando estado...</h2>
            <p className="text-sm">Consultando información del estudiante.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return <StatusBannerByProp status={status || 'no-inscrito'} comments={comments} />;
}

/**
 * Banner component that displays based on provided status
 */
function StatusBannerByProp({ status, comments }: { status: string, comments?: string }) {
  if (status === 'no-inscrito' || status === 'active') {
    return (
      <div className="mb-6 p-4 rounded-lg border bg-red-50 border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <h2 className="text-lg font-semibold">No has confirmado tu horario</h2>
            <p className="text-sm">Revisa con detenimiento tu horario y confirma si estas de acuerdo con la propuesta.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'inscrito') {
    return (
      <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <h2 className="text-lg font-semibold">¡Horario Confirmado!</h2>
            <p className="text-sm">
              Tu horario ha sido confirmado exitosamente. A continuación puedes ver los detalles de las materias y horarios asignados.
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
              <Calendar className="h-4 w-4" />
              <span>Las materias mostradas son las que cursarás este ciclo académico</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-green-700">
              <Clock className="h-4 w-4" />
              <span>Si requieres algún cambio, deberás contactar a tu coordinador académico</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-lg border bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-6 w-6 text-yellow-500" />
        <div>
          <h2 className="text-lg font-semibold">Cambios Solicitados</h2>
          <p className="text-sm">Has solicitado cambios en tu horario. El coordinador académico revisará tu solicitud.</p>
        </div>
      </div>

      {comments && (
        <div className="mt-3 bg-white p-3 rounded border border-yellow-200">
          <p className="text-sm font-semibold mb-1">Motivo de tu solicitud:</p>
          <p className="text-sm">{comments}</p>
        </div>
      )}
    </div>
  );
}