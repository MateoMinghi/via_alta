'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Search, Eye, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  name: string;
  semestre: string;
  status: string;
  comentario: string;
}

interface RequestTableProps {
  students: Student[];
}

export default function RequestTable({ students }: RequestTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(students.filter((student) => student.status === 'requiere-cambios'));
  const router = useRouter();
  const [selectedComment, setSelectedComment] = useState('');
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students.filter((student) => student.status === 'requiere-cambios'));
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = students.filter(
      (student) => (student.id.toLowerCase().includes(query)
                || student.name.toLowerCase().includes(query))
                && student.status === 'requiere-cambios',
    );
    setFilteredStudents(results);
  }, [searchQuery, students]);

  const handleViewComment = (comment: string) => {
    setSelectedComment(comment);
    setIsCommentOpen(true);
  };

  const handleViewSchedule = (studentId: string) => {
    router.push(`coordinador/horarios/${studentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inscrito': return 'bg-emerald-500';
      case 'requiere-cambios': return 'bg-amber-400';
      case 'no-inscrito': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full mx-auto py-6">
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

      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="text-center self-center font-medium">Matrícula de Alumno</TableHead>
              <TableHead className="text-center self-center font-medium">Nombre de Alumno</TableHead>
              <TableHead className="text-center self-center font-medium">Semestre</TableHead>
              <TableHead className="" />
              <TableHead className="" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id} className="border-b border-gray-200">
                <TableCell className="font-medium text-gray-500">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell className="text-center">
                  Semestre {student.semestre}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 text-via border-2 border-via"
                    onClick={() => handleViewComment(student.comentario)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver comentario</span>
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="default"
                    className="flex items-center gap-1 text-white"
                    onClick={() => handleViewSchedule(student.id)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Ver horario</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
