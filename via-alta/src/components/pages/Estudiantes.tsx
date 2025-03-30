'use client';
import React, { useState } from 'react';
import StatusTable from '../StatusTable';
import SolicitudesBanner from '../SolicitudesBanner';
import { useGetStudents, groupStudentsBySemester, Student } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Estudiantes() {
  const { result, loading, error }: ResponseType = useGetStudents();
  const [activeView, setActiveView] = useState<'all' | 'semester'>('all');
  const router = useRouter();
  
  // Filter to only show active students based on the "active" status flag
  const activeStudents = result 
    ? result.filter((student: Student) => student.status === 'active')
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
    router.push(`coordinador/horarios/${studentId}`);
  };

  const getStatusColor = (status: string) => {
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
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <Tabs defaultValue="all" value={activeView} onValueChange={(value) => setActiveView(value as 'all' | 'semester')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Vista general</TabsTrigger>
                  <TabsTrigger value="semester">Por semestre</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div>
                    <p className="font-bold text-xl text-via mb-2">ESTATUS DE ALUMNOS ACTIVOS</p>
                    <StatusTable students={activeStudents} />
                  </div>
                </TabsContent>
                
                <TabsContent value="semester">
                  <p className="font-bold text-xl text-via mb-4">ESTUDIANTES ACTIVOS POR SEMESTRE</p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {semesters.map((semester) => (
                      <Card key={semester}>
                        <CardHeader>
                          <CardTitle>
                            {semester === 'N/A' ? 'Estudiantes Irregulares' : `Semestre ${semester}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Total: {studentsBySemester[semester].length} estudiantes
                          </p>
                          <div className="max-h-60 overflow-y-auto">
                            <ul className="divide-y">
                              {studentsBySemester[semester].map((student) => (
                                <li key={student.id} className="py-2">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">
                                        {student.name} {student.first_surname} {student.second_surname}
                                      </span>
                                      <span 
                                        className={`px-2 py-1 text-xs rounded ${getStatusColor(student.status)}`}
                                      >
                                        {student.status === 'active' ? 'Activo' : student.status.replace('-', ' ')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                      <div>
                                        <span className="font-medium">Matrícula:</span> {student.ivd_id || 'N/A'}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 border-via text-via hover:bg-red-50"
                                        onClick={() => handleViewSchedule(student.id)}
                                      >
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-xs">Horario</span>
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
