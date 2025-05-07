'use client';

import React from 'react';
import SalonList from '@/components/SalonList';

export default function Salones() {
  return (
    <div className="text-start px-16  mx-auto py-8 flex flex-col gap-8">
      <div>
        <h2 className="font-bold text-3xl mb-4">Gestión de Salones</h2>
        <div className="p-4 bg-white rounded-lg text-gray-600">
            <p>En esta sección, el coordinador puede gestionar los salones disponibles, asignar horarios, verificar la disponibilidad de los salones, realizar modificaciones en las asignaciones existentes y buscar salones específicos según sus características. Solo se muestran salones activos y disponibles para asignación. Si tienes alguna duda, contacta al soporte técnico.</p>
        </div>
      </div>
      <SalonList />
    </div>
  );
}
