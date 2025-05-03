'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit, Search, X } from 'lucide-react';
import { Professor } from '@/api/getProfessors';

interface ProfessorListWithSearchProps {
  professors: Professor[];
  onSelectProfessor: (professor: Professor) => void;
  onEditClasses: (professor: Professor) => void;
}

export default function ProfessorListWithSearch({ 
  professors, 
  onSelectProfessor, 
  onEditClasses 
}: ProfessorListWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedProfessors, setDisplayedProfessors] = useState<Professor[]>(professors);

  // Update displayed professors when search query changes or professors list changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDisplayedProfessors(professors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = professors.filter((professor) => 
      professor.id.toString().includes(query) ||
      (professor.ivd_id && String(professor.ivd_id).toLowerCase().includes(query)) ||
      (professor.name && professor.name.toLowerCase().includes(query)) ||
      (professor.department && professor.department.toLowerCase().includes(query)) ||
      (professor.first_name && professor.first_name.toLowerCase().includes(query)) ||
      (professor.last_name && professor.last_name.toLowerCase().includes(query)) ||
      (professor.first_surname && professor.first_surname.toLowerCase().includes(query)) ||
      (professor.second_surname && professor.second_surname.toLowerCase().includes(query))
    );

    setDisplayedProfessors(filtered);
  }, [searchQuery, professors]);

  // Helper function to format professor name using appropriate name fields
  const formatProfessorName = (professor: Professor): string => {
    if (professor.first_surname || professor.second_surname) {
      // If we have surname data, prioritize using name + surnames format
      const nameParts = [];
      if (professor.first_name) nameParts.push(professor.first_name);
      if (professor.first_surname) nameParts.push(professor.first_surname);
      if (professor.second_surname) nameParts.push(professor.second_surname);
      return nameParts.length > 0 ? nameParts.join(' ') : professor.name || 'Unknown';
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
      <CardHeader className="pb-3">
        <CardTitle>Profesores</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Id, IVD ID, nombre o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Professors table */}
        {displayedProfessors.length > 0 ? (
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
                {displayedProfessors.map((professor) => (
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
                      {/* Availability button */}
                      <button 
                        onClick={() => onSelectProfessor(professor)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 text-xs font-medium"
                        style={{ minHeight: '28px' }}
                      >
                        <Edit className="h-3 w-3" />
                        <span>Disponibilidad</span>
                      </button>
                      
                      {/* Classes button */}
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
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No se encontraron profesores con: "${searchQuery}"` 
                : "No hay profesores registrados"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
