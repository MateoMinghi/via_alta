'use client';

import React from 'react';
import StatusTable from '../StatusTable';

export default function Estatus() {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold mb-6">Estatus de Alumnos</p>
      <StatusTable />
    </div>
  );
}
