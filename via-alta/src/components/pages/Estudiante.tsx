'use client';

import React from 'react';
import { Button } from '../ui/button';
import StudentSchedule from '../EstudianteSchedule';
import { useGetSubjects } from '@/api/getSubjects';
import { ResponseType } from "@/types/response";
import Link from 'next/link';

export default function Estudiante() {
  const { result, loading }: ResponseType = useGetSubjects();
 
  return (
    <div className="p-4">
        {loading && <p>cargando...</p>}
        {result !== null && (<>      <StudentSchedule subjects={result} />
      <div className="flex flex-col sm:flex-row justify-between gap-8 py-8">
        <Link href = "/estudiante/confirmacion">
        <Button className="w-full font-bold">Confirmar Horario</Button>
        </Link>
        <Link href =''>
        <Button className="w-full border-2 border-via text-via font-bold" variant="outline">Solicitar Cambios</Button>
        </Link>
      </div></>)}

    </div>
  );
}
