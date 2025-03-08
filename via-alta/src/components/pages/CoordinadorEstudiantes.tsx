'use client';

import React from 'react';
import StatusTable from '../StatusTable';
import SolicitudesBanner from '../SolicitudesBanner';

export default function CoordinadorEstudiantes() {
  return (
    <div className="text-center">
      <p className="font-bold text-2xl self-center">
        Solicitudes de Cambios:
      </p>
      <div className="mb-8">
        <SolicitudesBanner />
      </div>
    <div className="text-center">
      <p className="text-2xl font-bold mb-6">Estatus de Alumnos</p>
      <StatusTable />
    </div>
    </div>
  );
}
