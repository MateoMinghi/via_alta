'use client';
import React, { useEffect, useState } from 'react';
import StatusTable from '../StatusTable';
import SolicitudesBanner from '../SolicitudesBanner';
import { useGetStudents, groupStudentsBySemester, Student } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import StatusGrid from '../StatusGrid';
import StudentStatus from '../StudentStatus';

export default function Estudiantes() {
  const { result, loading, error }: ResponseType = useGetStudents();
  const [activeView, setActiveView] = useState<'all' | 'semester'>('all');
  const router = useRouter();

  // Filter to only show active students based on the "active" status flag
  const activeStudents = result 
    ? result.filter((student: Student) => student.status !== 'inactive')
    : null;

  // Group active students by semester
  const studentsBySemester = groupStudentsBySemester(activeStudents);

  // Get semesters sorted with "N/A" at the end
  const semesters = activeStudents 
    ? Object.keys(studentsBySemester).sort((a, b) => {
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        return parseInt(a) - parseInt(b);
      })
    : [];

  const pendingChangesCount = activeStudents 
    ? activeStudents.filter((student: Student) => student.status === 'requiere-cambios').length
    : 0;

  const handleViewSchedule = (studentId: string) => {
    router.push(`dashboard/horarios/${studentId}`);
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inscrito':
        return 'bg-green-100 text-green-800';
      case 'requiere-cambios':
        return 'bg-yellow-100 text-yellow-800';
      case 'no-inscrito':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  // Function to format the name to show both first name and surname
  const formatFullName = (student: Student) => {
    // If we have at least one of first_name or first_surname
    if (student.first_name || student.first_surname) {
      return [student.first_name, student.first_surname]
        .filter(Boolean)
        .join(' ');
    }
    
    // Fall back to the name field if the specific parts are not available
    return student.name || 'Sin nombre';
  };

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div>
      <div>
        <p className="font-bold text-xl text-via">ESTUDIANTES ACTIVOS</p>
        <div className="p-4 bg-white rounded-lg">
          <p>En esta sección, el coordinador puede gestionar los estudiantes activos, ver su horario, revisar quién solicitó cambios, buscar alumnos, entre otras funciones. Solo se muestran estudiantes con estatus "active". Si tienes alguna duda, contacta al soporte técnico.</p>
        </div>
      </div>
      
      {loading && <p className="py-4">Cargando estudiantes...</p>}
      
      {activeStudents !== null && (
        <>
          <div className="my-4">
            <SolicitudesBanner numberOfChanges={pendingChangesCount} />
          </div>
          
          <div className="mb-6">
            <p className="font-bold text-xl text-via mb-2">VISTA DE ESTUDIANTES ACTIVOS</p>
            <div className="bg-white p-4 rounded-lg">
              <StudentStatus students={activeStudents} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
