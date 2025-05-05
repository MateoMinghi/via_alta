'use client';
import React, { useEffect, useState } from 'react';
import SolicitudesBanner from '@/components/SolicitudesBanner';
import { useGetStudents, Student } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import StudentStatus from '@/components/StudentStatus';

export default function Estudiantes() {
  const { result, loading, error }: ResponseType = useGetStudents();
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Filter to only show active students based on the "active" status flag
  const activeStudents = result 
    ? result.filter((student: Student) => student.status !== 'inactive')
    : null;

  // Fetch count of pending change requests directly from the database
  useEffect(() => {
    const fetchPendingRequestsCount = async () => {
      try {
        // Make a direct fetch to the database using a simple query parameter
        const response = await fetch('/api/schedule-change-request?count=true');
        const data = await response.json();
        
        if (data.success && typeof data.count === 'number') {
          console.log('Pending change requests count:', data.count);
          setPendingChangesCount(data.count);
        } else {
          console.error('Failed to fetch change requests count:', data);
          setPendingChangesCount(0);
        }
      } catch (err) {
        console.error('Error fetching change requests count:', err);
        setPendingChangesCount(0);
      }
    };

    fetchPendingRequestsCount();
  }, []);

  console.log('Pending changes count:', pendingChangesCount); // Add logging to verify count

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="text-start px-16  mx-auto py-8 flex flex-col gap-8">
      <div>
        <h2 className="font-bold text-3xl mb-4">Estudiantes Activos</h2>
        <div className="p-4 bg-white rounded-lg text-gray-600">
          <p>En esta sección, el coordinador puede gestionar los estudiantes activos, ver su horario, revisar quién solicitó cambios, buscar alumnos, entre otras funciones. Solo se muestran estudiantes con estatus "active". Si tienes alguna duda, contacta al soporte técnico.</p>
        </div>
      </div>
      
      {loading && <p className="py-4">Cargando estudiantes...</p>}
      
      {activeStudents !== null && (
        <div>
            <SolicitudesBanner numberOfChanges={pendingChangesCount} />
            <StudentStatus students={activeStudents} />
        </div>
      )}
    </div>
  );
}
