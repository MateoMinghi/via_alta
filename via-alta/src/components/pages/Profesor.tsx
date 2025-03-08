'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ProfessorGrid from '../ProfessorGrid';
import ProfessorSearch from '../ProfessorSearch';

interface Professor {
  id: number;
  name: string;
  department: string;
}

export default function Profesor() {
  const professors: Professor[] = [
    { id: 1, name: 'Dr. John Doe', department: 'Computer Science' },
    { id: 2, name: 'Dr. Jane Smith', department: 'Mathematics' },
    { id: 3, name: 'Dr. Emily Johnson', department: 'Physics' },
  ];

  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});
  const [allProfessors, setAllProfessors] = useState<Professor[]>(professors);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);

  const handleProfessorSelect = (professor: Professor) => {
    setSelectedProfessor(professor);
  };

  const removeSelectedProfessor = () => {
    setSelectedProfessor(null);
  };

  const handleSaveAvailability = () => {
    console.log('Guardando disponibilidad:', selectedSlots);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <p className="text-3xl font-bold">Registro de Disponibilidad</p>
      </div>

      <ProfessorSearch professors={allProfessors} onProfessorSelect={handleProfessorSelect} />

      <div className="w-full pl-8">
        <p className="text-2xl font-bold">Profesor seleccionado:</p>
        {selectedProfessor !== null ? (
          <div className="mt-4 mb-4">
          
         
              <Card className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedProfessor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfessor.id} • {selectedProfessor.department} dpmto
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeSelectedProfessor}
                  className="h-8 w-8 text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            </div>
        ) : (
          <div>
          <p className="text-gray-500">No hay profesor seleccionado</p>
          <p className='pt-4'>
            Selecciona un profesor para asignarle disponibilidad
          </p>
          </div>

        )}
      </div>

      {selectedProfessor !== null && (
        <>
          <div className="pt-4">
            <ProfessorGrid selectedSlots={selectedSlots} setSelectedSlots={setSelectedSlots} />
          </div>

          <div className="flex justify-between mt-8 gap-4">
            <Button variant="outline" onClick={() => setSelectedSlots({})} className="w-full bg-red-700 text-white">
              Limpiar
            </Button>
            <Button className="w-full" onClick={handleSaveAvailability}>
              <Save />
              Guardar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
