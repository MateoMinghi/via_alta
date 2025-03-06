'use client';

import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SolicitudesBanner() {
  let count = 5;

  const getColor = () => {
    if (count === 0) return 'green';
    if (count < 10) return 'amber';
    return 'red';
  };

  return (
    <Link href="/coordinador/estudiantes/estatus" className="block w-full my-8">
      <div className={`w-full p-4 rounded-lg bg-${getColor()}-100 hover:bg-${getColor()}-200`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-x-3 text-${getColor()}-700`}>
            <Bell />
            <span className="font-semibold">
              {count === 0
                ? 'No tienes solicitudes de cambio pendientes'
                : count === 1
                  ? 'Tienes 1 solicitud de cambio pendiente'
                  : `Tienes ${count} solicitudes de cambio pendientes`}
            </span>
          </div>
          {count > 0 && (
          <div className={`flex text-center items-center pl-2 py-2 font-bold rounded-lg bg-${getColor()}-500 text-white`}>
            {count}
            <ChevronRight />
          </div>
          )}

        </div>
      </div>
    </Link>
  );
}
