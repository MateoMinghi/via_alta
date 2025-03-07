'use client';

import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SolicitudesBanner() {
  const count = 10;

  const getColorClasses = () => {
    if (count === 0) {
      return {
        bg: 'bg-green-100',
        hoverBg: 'hover:bg-green-200',
        text: 'text-green-700',
        badgeBg: 'bg-green-500',
      };
    }
    if (count < 10) {
      return {
        bg: 'bg-amber-100',
        hoverBg: 'hover:bg-amber-200',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-red-100',
      hoverBg: 'hover:bg-red-200',
      text: 'text-red-700',
      badgeBg: 'bg-red-500',
    };
  };

  const colorClasses = getColorClasses();

  const getMessage = () => {
    if (count === 0) {
      return 'No tienes solicitudes de cambio pendientes';
    }
    if (count === 1) {
      return 'Tienes 1 solicitud de cambio pendiente';
    }
    return `Tienes ${count} solicitudes de cambio pendientes`;
  };

  return (
    <Link href="/coordinador/estatus" className="block w-full my-8">
      <div className={`w-full p-4 rounded-lg ${colorClasses.bg} ${colorClasses.hoverBg}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-x-3 ${colorClasses.text}`}>
            <Bell />
            <span className="font-semibold">{getMessage()}</span>
          </div>
          {count > 0 && (
            <div
              className={`flex text-center items-center pl-2 py-2 font-bold rounded-lg ${colorClasses.badgeBg} text-white`}
            >
              {count}
              <ChevronRight />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
