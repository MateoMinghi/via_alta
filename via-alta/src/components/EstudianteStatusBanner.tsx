'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';

interface StatusBannerProps {
  status: string;
  comments?: string;
}

export default function EstudianteStatusBanner({ status, comments }: StatusBannerProps) {
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

  return (
    <div className={`mb-6 p-4 rounded-lg border ${
      status === 'inscrito' 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center gap-3">
        {status === 'inscrito' ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-yellow-500" />
        )}
        
        <div>
          <h2 className="text-lg font-semibold">
            {status === 'inscrito' 
              ? 'Horario Confirmado' 
              : 'Cambios Solicitados'}
          </h2>
          <p className="text-sm">
            {status === 'inscrito'
              ? 'Tu horario ha sido confirmado exitosamente.'
              : 'Has solicitado cambios en tu horario.'}
          </p>
        </div>
      </div>

      {status === 'cambios-solicitados' && comments && (
        <div className="mt-3 bg-white p-3 rounded border border-yellow-200">
          <p className="text-sm font-semibold mb-1">Motivo de tu solicitud:</p>
          <p className="text-sm">{comments}</p>
        </div>
      )}
    </div>
  );
}