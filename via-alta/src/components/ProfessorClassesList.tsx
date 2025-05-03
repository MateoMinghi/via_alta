import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfessorClassesListProps {
  classes: string;
  professor?: {
    name: string;
    id: number;
    ivd_id?: string;
    department?: string;
  };
}

export default function ProfessorClassesList({ classes, professor }: ProfessorClassesListProps) {
  const classesList = classes ? classes.split(',').map(className => className.trim()) : [];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Materias Asignadas</CardTitle>
          {professor && (
            <div className="text-sm text-gray-500 mt-1">
              {professor.name} • ID: {professor.id} {professor.ivd_id && `• IVD ID: ${professor.ivd_id}`}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {classesList.length > 0 ? (
          <ul className="space-y-2">
            {classesList.map((className, index) => (
              <li 
                key={index}
                className="p-2 bg-slate-50 rounded-md border border-slate-200"
              >
                {className}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No hay materias asignadas</p>
        )}
      </CardContent>
    </Card>
  );
}
