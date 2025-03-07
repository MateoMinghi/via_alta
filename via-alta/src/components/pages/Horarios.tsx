'use client';

import React from 'react';
import SemesterGrid from '../SemesterGrid';
import StudentSearch from '../StudentSearch';

export default function Horarios() {
  return (
    <div className="text-center">
      <p className="font-bold text-2xl">Horarios de Alumnos Irregulares:</p>
      <StudentSearch />
      <p className="font-bold text-2xl">Horarios Generales:</p>
      <SemesterGrid />
    </div>
  );
}
