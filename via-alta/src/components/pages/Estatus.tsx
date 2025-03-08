'use client';

import React from 'react';
import RequestTable from '../RequestTable';

export default function Estatus() {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold mb-6">Solicitudes de Cambios</p>
      <RequestTable />
    </div>
  );
}
