'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit } from 'lucide-react';
import { Professor } from '@/api/getProfessors';
import { cn } from '@/lib/utils';

interface ProfessorListProps {
  professors: Professor[];
  onSelectProfessor: (professor: Professor) => void;
  onEditClasses: (professor: Professor) => void;
}

export default function ProfessorList({ professors, onSelectProfessor, onEditClasses }: ProfessorListProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lista de Profesores</CardTitle>
      </CardHeader>
      <CardContent>
        {professors.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Materias</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professors.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell>{professor.id}</TableCell>
                    <TableCell className="font-medium">{professor.name}</TableCell>
                    <TableCell>{professor.department}</TableCell>
                    <TableCell>
                      {professor.classes 
                        ? professor.classes.split(',').length 
                        : 0} materias asignadas
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {/* Availability button with direct styling */}
                      <button 
                        onClick={() => onSelectProfessor(professor)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 text-xs font-medium"
                        style={{ minHeight: '28px' }}
                      >
                        <Edit className="h-3 w-3" />
                        <span>Disponibilidad</span>
                      </button>
                      
                      {/* Classes button with direct styling */}
                      <button 
                        onClick={() => onEditClasses(professor)}
                        className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-md flex items-center gap-1 text-xs font-medium"
                        style={{ minHeight: '28px' }}
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Materias</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No hay profesores registrados</p>
        )}
      </CardContent>
    </Card>
  );
}