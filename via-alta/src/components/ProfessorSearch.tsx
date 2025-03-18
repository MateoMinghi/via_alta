'use client';

import React, { useState, useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Professor {
    id: number;
    name: string;
    department: string;
}
interface ProfessorsSearchProps {
  professors: Professor[]
  onProfessorSelect?: (professor: Professor) => void
}

export default function ProfessorSearch({ professors, onProfessorSelect }: ProfessorsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Professor[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = professors.filter((professor) => professor.id.toString().includes(query)
            || professor.name.toLowerCase().includes(query)
            || professor.department.toLowerCase().includes(query));

    setSearchResults(results);
  }, [searchQuery, professors]);

  const handleProfessorClick = (professor: Professor) => {
    if (onProfessorSelect) {
      onProfessorSelect(professor);
    }
    setSearchQuery('');
  };

  return (
    <div className="mx-auto py-8 mb-8 w-full">
      <div className="mx-auto relative">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por Id, nombre o departamento..."
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
                  No se han encontrado profesores con el nombre: &quot;
                  {searchQuery}
                  &quot;
                </div>
              ) : (
                searchResults.map((professor) => (
                  <div
                    key={professor.id}
                    className="p-2 hover:bg-muted cursor-pointer rounded-sm flex items-center flex-row"
                    onClick={() => handleProfessorClick(professor)}
                  >
                    <div className="flex flex-row justify-between w-full">
                      <div>
                        <p className="font-medium">{professor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID:
                          {' '}
                          {professor.id}
                          {' '}
                          •
                          {' '}
                          {professor.department}
                        </p>
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
