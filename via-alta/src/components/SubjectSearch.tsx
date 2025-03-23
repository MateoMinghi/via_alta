'use client';

import React, { useState, useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Subject {
    id: number;
    title: string;
    salon: string;
    professor: string;
    credits: number;
    semester: number; // Added semester property
    hours: { day: string; time: string }[];
}
  interface SubjectsSearchProps {
  subjects: Subject[]
  onSubjectSelect?: (subject: Subject) => void
  }

export default function SubjectSearch({ subjects, onSubjectSelect }: SubjectsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof subjects>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = subjects.filter((subject) => subject.id.toString().includes(query)
            || subject.professor.toLowerCase().includes(query)
            || subject.title.toLowerCase().includes(query));

    setSearchResults(results);
  }, [searchQuery]);

  const handleSubjectClick = (subject: Subject) => {
    if (onSubjectSelect) {
      onSubjectSelect(subject);
    }
    setSearchQuery('');
  };

  return (
    <div className="mx-auto py-8 mb-8 w-full">
      <div className="mx-auto relative">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar Materias Id, profesor o nombre..."
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
                searchResults.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-2 hover:bg-muted cursor-pointer rounded-sm flex items-center flex-row"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <div className="flex flex-row justify-between w-full">
                      <div>
                        <p className="font-medium">{subject.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ID:
                          {' '}
                          {subject.id}
                          {' '}
                          •
                          {' '}
                          {subject.professor}
                          {' '}
                          • Semestre: {subject.semester}
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
