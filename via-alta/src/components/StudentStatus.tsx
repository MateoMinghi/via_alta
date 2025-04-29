'use client';

import React, { useState, useEffect } from 'react';
import confirmStudentsEnrollment from '@/lib/models/student';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useStudentDbStatus } from '@/api/useStudentDbStatus';

interface Student {
  id: string;
  name: string;
  first_surname: string;
  second_surname: string;
  ivd_id: string;
  semestre: string;
  status: string;
  comentario?: string;
  isIrregular: boolean;
}

interface StudentStatusProps {
  students: Student[];
}

function StudentStatusDot({ studentId }: { studentId: string }) {
  const { status, loading } = useStudentDbStatus(studentId);
  
  
  if (loading) {
    return <div className="w-4 h-4 rounded-full bg-gray-300 animate-pulse"></div>;
  }
  
  let dotColor = 'bg-red-500'; // Color por defecto
  
  
  if (status === 'requiere-cambios') {
    dotColor = 'bg-amber-400'; //Ambar
  } else if (status === 'inscrito') {
    dotColor = 'bg-emerald-500'; //Verde
  } else {
    dotColor = 'bg-red-500'; // Rojo (no inscrito)
  }

  return <div className={`w-4 h-4 rounded-full ${dotColor}`}></div>;
}

export default function StudentStatus({ students }: StudentStatusProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(students);
  const router = useRouter();
  const [selectedComment, setSelectedComment] = useState('');
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState('table');
  const [isModifyingStatus, setIsModifyingStatus] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<{ success: number; failed: number } | null>(null);

  const groupedStudents = filteredStudents.reduce(
    (acc, student) => {
      const key = student.isIrregular ? 'irregular' : student.semestre;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(student);
      return acc;
    },
    {} as Record<string, Student[]>,
  );

  const sortedSemesters = Object.keys(groupedStudents).sort((a, b) => {
    if (a === 'irregular') return 1;
    if (b === 'irregular') return -1;
    return Number.parseInt(a) - Number.parseInt(b);
  });

  useEffect(() => {
    if (sortedSemesters.length === 0) return;

    const initialExpandedState: Record<string, boolean> = {};
    sortedSemesters.forEach((semester) => {
      initialExpandedState[semester] = false;
    });
    setExpandedSemesters(initialExpandedState);
  }, [students]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      setExpandedSemesters((prev) => {
        const newState = { ...prev };
        Object.keys(newState).forEach((sem) => {
          newState[sem] = false;
        });
        return newState;
      });
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = students.filter(
      (student) =>
        (student.ivd_id && String(student.ivd_id).toLowerCase().includes(query)) ||
        student.name.toLowerCase().includes(query) ||
        student.first_surname.toLowerCase().includes(query) ||
        student.second_surname.toLowerCase().includes(query)
    );
    setFilteredStudents(results);

    if (results.length > 0) {
      const currentSemesters = Object.keys(
        results.reduce(
          (acc, student) => {
            const key = student.isIrregular ? 'irregular' : student.semestre;
            acc[key] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      );

      setExpandedSemesters((prev) => {
        const newState = { ...prev };
        Object.keys(newState).forEach((sem) => {
          newState[sem] = false;
        });
        currentSemesters.forEach((sem) => {
          newState[sem] = true;
        });
        return newState;
      });
    }
  }, [searchQuery, students]);

  const handleViewSchedule = (studentId: string) => {
    router.push(`/dashboard/horarios/${studentId}`);
  };

  const toggleSemester = (semester: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semester]: !prev[semester],
    }));
  };

  const showStudentComment = (comment: string) => {
    if (!comment) return;
    setSelectedComment(comment);
    setIsCommentOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inscrito':
        return 'bg-emerald-500';
      case 'requiere-cambios':
        return 'bg-amber-400';
      case 'no-inscrito':
        return 'bg-red-500';
      default:
        return 'bg-red-500';
    }
  };

  const getTextStatusColor = (status: string) => {
    switch (status) {
      case 'inscrito':
        return 'bg-emerald-500 text-white';
      case 'requiere-cambios':
        return 'bg-amber-400 text-white';
      case 'no-inscrito':
        return 'bg-red-500 text-white';
      default:
        return 'bg-red-500 text-white';
    }
  };

  const modifyStatus = async (status: string) => {
    if (status === 'true') {
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmAllSchedules = async () => {
    try {
      setProcessingStatus(true);
      setIsConfirmDialogOpen(false);

      const response = await fetch('/api/confirm-all-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Inscripciones confirmadas: ${result.data.confirmed} estudiantes procesados`);
        setConfirmationResult({
          success: result.data.confirmed,
          failed: result.data.failed || 0,
        });

        window.location.reload();
      } else {
        toast.error(`Error al confirmar inscripciones: ${result.message}`);
      }
    } catch (error) {
      console.error('Error al confirmar inscripciones:', error);
      toast.error('Error al procesar la confirmación de inscripciones');
    } finally {
      setProcessingStatus(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <Tabs defaultValue="table" value={viewMode} onValueChange={setViewMode} className="w-full mb-4">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="flex gap-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span>Lista</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span>Bloques</span>
            </TabsTrigger>
          </TabsList>

          <Button
            variant="secondary"
            className="bg-red-700 text-white"
            onClick={() => modifyStatus('true')}
            disabled={processingStatus}
          >
            {processingStatus ? 'Procesando...' : 'Confirmar inscripciones'}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Buscar Alumno"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              {['inscrito', 'requiere-cambios', 'no-inscrito'].map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`} />
                  <span className="text-sm capitalize">{status.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <TabsContent value="table">
          <div className="border rounded-md overflow-hidden">
            {sortedSemesters.length > 0 ? (
              sortedSemesters.map((semester) => (
                <div key={semester} className="border-b last:border-b-0">
                  <div
                    className="bg-gray-100 p-3 font-medium flex items-center cursor-pointer"
                    onClick={() => toggleSemester(semester)}
                  >
                    {expandedSemesters[semester] ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <span>
                      {semester === 'irregular'
                        ? `Estudiantes Irregulares (${groupedStudents[semester].length})`
                        : `Semestre ${semester} (${groupedStudents[semester].length} estudiantes)`}
                    </span>
                  </div>

                  {expandedSemesters[semester] && (
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-center self-center font-medium">Matrícula</TableHead>
                          <TableHead className="text-center self-center font-medium">Nombre de Alumno</TableHead>
                          <TableHead className="text-center self-center font-medium">Status de Inscripción</TableHead>
                          <TableHead className="" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedStudents[semester].map((student) => (
                          <TableRow key={student.id} className="border-b border-gray-200 last:border-b-0">
                            <TableCell className="text-center self-center font-medium text-gray-500">
                              {student.ivd_id || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center self-center">
                              {student.name} {student.first_surname} {student.second_surname}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <StudentStatusDot studentId={student.ivd_id} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex items-center gap-1 text-white"
                                  onClick={() => handleViewSchedule(student.ivd_id)}
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span>Ver horario</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No se encontraron estudiantes que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grid">
          <div>
            <p className="font-bold text-xl text-via mb-4">ESTUDIANTES ACTIVOS POR SEMESTRE</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedSemesters.map((semester) => (
                <Card key={semester}>
                  <CardHeader>
                    <CardTitle>
                      {semester === 'irregular' ? 'Estudiantes Irregulares' : `Semestre ${semester}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Total: {groupedStudents[semester].length} estudiantes
                    </p>
                    <div className="max-h-60 overflow-y-auto">
                      <ul className="divide-y">
                        {groupedStudents[semester].map((student) => (
                          <li key={student.id} className="py-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {student.name} {student.first_surname} {student.second_surname}
                                </span>
                                <div className="flex items-center gap-2">
                                  <StudentStatusDot studentId={student.ivd_id} />
                                  <span className="text-xs">
                                    {student.status === 'active' ? 'Verificando...' : student.status.replace('-', ' ') || 'Verificando...'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-500">
                                <div>
                                  <span className="font-medium">Matrícula:</span> {student.ivd_id || 'N/A'}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1 border-via text-via hover:bg-red-50"
                                  onClick={() => handleViewSchedule(student.ivd_id)}
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
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Estudiante</DialogTitle>
          </DialogHeader>
          <p className="mt-4">{selectedComment}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar todas las inscripciones pendientes</DialogTitle>
          </DialogHeader>
          <p className="py-4">Esta acción realizará lo siguiente:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Confirmará automáticamente la inscripción de todos los estudiantes que no lo hayan hecho</li>
            <li>Registrará los horarios correspondientes para cada estudiante según su semestre</li>
            <li>Cambiará el estado de todos los estudiantes a "Inscrito"</li>
          </ul>
          <p className="py-2 text-amber-600 font-medium">Esta acción no se puede deshacer. ¿Deseas continuar?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-red-700 text-white" onClick={confirmAllSchedules}>
              Confirmar todos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
