'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  name: string;
  semestre: string;
  regular: boolean;
}

interface StudentSearchProps {
  students: Student[];
}

export default function StudentSearch({ students }: StudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = students.filter((student) => student.id.toLowerCase().includes(query)
            || student.name.toLowerCase().includes(query));

    setSearchResults(results);
  }, [searchQuery, students]);

  const handleStudentClick = (studentId: string) => {
    router.push(`horarios/${studentId}`);
  };

  return (
    <div className="mx-auto py-8 mb-8 w-full">
      <div className="mx-auto relative">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar Horario de Alumno por Matricula o Nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => setSearchQuery('')}
            className="bg-red-700 text-white"
          >
            Limpiar
          </Button>
        </div>

        {searchQuery && (
        <div className="absolute z-10 w-full bg-background border rounded-md">
          <div className="p-2">
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No se han encontrado estudiantes con el nombre: &quot;
                  {searchQuery}
                  &quot;
                </div>
              ) : (
                searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="p-2 hover:bg-muted cursor-pointer rounded-sm flex items-center flex-row"
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <div className="flex flex-row justify-between w-full">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID:
                          {' '}
                          {student.id}
                          {' '}
                          •
                          {' '}
                          {student.semestre}
                          {' '}
                          Semestre
                        </p>
                      </div>
                      <div className={student.regular ? 'text-green-500' : 'text-red-500'}>
                        {student.regular ? 'Regular' : 'Irregular'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
