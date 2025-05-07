'use client';

import React, { useEffect, useState } from 'react';
import RequestTable from '@/components/RequestTable';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";

export default function Estatus() {
  const { result, loading }: ResponseType = useGetStudents();
  const [hasRequests, setHasRequests] = useState<boolean>(false);

  // Check if there are any change requests when component mounts
  useEffect(() => {
    const checkForRequests = async () => {
      try {
        const response = await fetch('/api/schedule-change-request?count=true');
        const data = await response.json();
        
        if (data.success && typeof data.count === 'number') {
          setHasRequests(data.count > 0);
        }
      } catch (error) {
        console.error('Error checking for change requests:', error);
      }
    };

    checkForRequests();
  }, []);

  return (
    <div className="text-start px-16 mx-auto py-8 flex flex-col gap-8">
      <h2 className="text-3xl font-bold mb-6">Solicitudes de Cambios</h2>
      {loading ? (
        <p className="py-4">Cargando...</p>
      ) : !result ? (
        <p className="py-4 text-red-500">Error cargando datos de estudiantes</p>
      ) : !hasRequests ? (
        <div className="py-4 border rounded-md bg-white">
          <p className="text-gray-500 pl-4">No hay solicitudes de cambio pendientes.</p>
        </div>
      ) : (
        <RequestTable students={result || []} />
      )}
    </div>
  );
}