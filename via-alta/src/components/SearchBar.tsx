'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const students = [
  {
    id: '1001', name: 'Alex Johnson', semestre: '1', regular: true,
  },
  {
    id: '1002', name: 'Samantha Lee', semestre: '2', regular: true,
  },
  {
    id: '1003', name: 'Michael Brown', semestre: '3', regular: false,
  },
  {
    id: '1004', name: 'Jessica Taylor', semestre: '4', regular: true,
  },
  {
    id: '1005', name: 'David Wilson', semestre: '5', regular: false,
  },
  {
    id: '1006', name: 'Emily Davis', semestre: '6', regular: true,
  },
  {
    id: '1007', name: 'James Miller', semestre: '7', regular: true,
  },
  {
    id: '1008', name: 'Olivia Garcia', semestre: '8', regular: false,
  },
  {
    id: '1009', name: 'Daniel Martinez', semestre: '9', regular: true,
  },
  {
    id: '1010', name: 'Sophia Rodriguez', semestre: '1', regular: true,
  },
];

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof students>([]);
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
  }, [searchQuery]);

  const handleStudentClick = (studentId: string) => {
    router.push(`/coordinador/${studentId}`);
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
            className='bg-red-700 text-white'
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
