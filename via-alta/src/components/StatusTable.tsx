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

const students = [
  {
    id: '00001', name: 'Renata López', semestre: '3', status: 'requiere-cambios', comentario: 'Necesita completar documentación pendiente para inscripción.',
  },
  {
    id: '00002', name: 'Alejandro Martínez', semestre: '2', status: 'inscrito', comentario: 'Inscripción completa. Sin observaciones.',
  },
  {
    id: '00003', name: 'Diana Pérez', semestre: '4', status: 'inscrito', comentario: 'Inscripción exitosa. Buen rendimiento académico.',
  },
  {
    id: '00004', name: 'Emiliano García', semestre: '1', status: 'inscrito', comentario: 'Primer semestre. Todos los documentos en regla.',
  },
  {
    id: '00005', name: 'Fernando Torres', semestre: '5', status: 'requiere-cambios', comentario: 'Pendiente pago de matrícula para completar inscripción.',
  },
  {
    id: '00006', name: 'Gabriela Sánchez', semestre: '2', status: 'inscrito', comentario: 'Inscripción completa. Excelente desempeño.',
  },
  {
    id: '00007', name: 'Sofia Ramírez', semestre: '3', status: 'requiere-cambios', comentario: 'Falta certificado médico para actividades deportivas.',
  },
  {
    id: '00008', name: 'Diana Gómez', semestre: '6', status: 'no-inscrito', comentario: 'No ha iniciado proceso de inscripción para este semestre.',
  },
  {
    id: '00009', name: 'Lucia Fernández', semestre: '4', status: 'inscrito', comentario: 'Inscripción completa. Participante en programa de intercambio.',
  },
  {
    id: '00010', name: 'Fernanda Ruiz', semestre: '1', status: 'no-inscrito', comentario: 'Documentación incompleta. No ha pagado matrícula.',
  },
  {
    id: '00011', name: 'Héctor Mendoza', semestre: '5', status: 'no-inscrito', comentario: 'Baja temporal solicitada por el estudiante.',
  },
  {
    id: '00012', name: 'Alejandro Ortiz', semestre: '2', status: 'requiere-cambios', comentario: 'Pendiente validación de materias previas.',
  },
];

export default function StudentTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(students);
  const router = useRouter();
  const [selectedComment, setSelectedComment] = useState('');
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = students.filter(
      (student) => student.id.toLowerCase().includes(query)
        || student.name.toLowerCase().includes(query),
    );
    setFilteredStudents(results);
  }, [searchQuery]);

  const handleViewComment = (comment: string) => {
    setSelectedComment(comment);
    setIsCommentOpen(true);
  };

  const handleViewSchedule = (studentId: string) => {
    router.push(`/coordinador/${studentId}`);
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
    <div className="w-full max-w-6xl mx-auto py-6">
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
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="text-center self-center font-medium">Matrícula de Alumno</TableHead>
              <TableHead className="text-center self-center font-medium">Nombre de Alumno</TableHead>
              <TableHead className="text-center self-center font-medium">Status de Inscripción</TableHead>
              <TableHead className="" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id} className="border-b border-gray-200">
                <TableCell className="font-medium text-gray-500">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(student.status)}`} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex items-center gap-1 text-via border-2 border-via"
                      onClick={() => handleViewComment(student.comentario)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver comentario</span>
                    </Button>
                    <Button
                      variant="default"
                      className="flex items-center gap-1  text-white"
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
