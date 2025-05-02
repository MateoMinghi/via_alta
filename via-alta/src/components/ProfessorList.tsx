'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit } from 'lucide-react';
import { Professor } from '@/api/getProfessors';

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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSelectProfessor(professor)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Disponibilidad</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditClasses(professor)}
                        className="flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Materias</span>
                      </Button>
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