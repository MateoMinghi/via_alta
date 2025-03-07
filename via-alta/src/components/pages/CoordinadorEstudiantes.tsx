'use client';

import React from 'react';
import SemesterGrid from '../SemesterGrid';
import StudentSearch from '../StudentSearch';
import SolicitudesBanner from '../SolicitudesBanner';

export default function CoordinadorEstudiantes() {
  return (
    <div className="text-center">
      <p className="font-bold text-2xl self-center">
        Solicitudes de Cambios y estatus de Alumnos:
      </p>
      <div className="mb-8">
        <SolicitudesBanner />
      </div>

      <p className="font-bold text-2xl">Horarios de Alumnos Irregulares:</p>
      <StudentSearch />
      <p className="font-bold text-2xl">Horarios Generales:</p>
      <SemesterGrid />
    </div>
  );
}
