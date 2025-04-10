import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfessorClassesListProps {
  classes: string;
}

export default function ProfessorClassesList({ classes }: ProfessorClassesListProps) {
  const classesList = classes ? classes.split(',').map(className => className.trim()) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materias Asignadas</CardTitle>
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
