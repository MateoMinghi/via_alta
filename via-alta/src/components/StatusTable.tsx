'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, Calendar, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  name: string;
  first_surname: string;
  second_surname: string;
  ivd_id: string;
  semestre: string;
  status: string;
  comentario: string;
  isIrregular: boolean;
}

interface StatusTableProps {
  students: Student[];
}

export default function StatusTable({ students }: StatusTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(students);
  const router = useRouter();
  const [selectedComment, setSelectedComment] = useState('');
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

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
        student.id.toLowerCase().includes(query) ||
        student.name.toLowerCase().includes(query) ||
        (student.ivd_id && String(student.ivd_id).toLowerCase().includes(query)),
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
    router.push(`coordinador/horarios/${studentId}`);
  };

  const toggleSemester = (semester: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semester]: !prev[semester],
    }));
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
        return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full mx-auto">
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
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          {['inscrito', 'requiere-cambios', 'no-inscrito'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`} />
              <span className="text-sm capitalize">{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

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
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(student.status)}`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Button
                              variant="default"
                              size="sm"
                              className="flex items-center gap-1 text-white"
                              onClick={() => handleViewSchedule(student.id)}
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

      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Estudiante</DialogTitle>
          </DialogHeader>
          <p className="mt-4">{selectedComment}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
