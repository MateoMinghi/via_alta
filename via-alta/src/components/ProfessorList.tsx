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
  // Helper function to format professor name using appropriate name fields
  const formatProfessorName = (professor: Professor): string => {
    if (professor.first_surname || professor.second_surname) {
      // If we have surname data, prioritize using name + surnames format
      const nameParts = [];
      if (professor.name) nameParts.push(professor.name);
      if (professor.first_surname) nameParts.push(professor.first_surname);
      if (professor.second_surname) nameParts.push(professor.second_surname);
      return nameParts.join(' ');
    } 
    else if (professor.first_name || professor.last_name) {
      // Fall back to first_name and last_name fields
      return `${professor.first_name || ''} ${professor.last_name || ''}`.trim();
    }
    // Fallback to just the name field
    return professor.name || 'Unknown';
  };

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
                  <TableHead>IVD ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Materias</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professors.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell>{professor.ivd_id || professor.id}</TableCell>
                    <TableCell className="font-medium">{formatProfessorName(professor)}</TableCell>
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