'use client';

import React from 'react';
import SemesterView from '../SemesterGrid';
import SearchBar from '../SearchBar';
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
      <SearchBar />
      <p className="font-bold text-2xl">Horarios Generales:</p>
      <SemesterView />
    </div>
  );
}
