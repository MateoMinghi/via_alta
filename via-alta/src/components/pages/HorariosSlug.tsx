'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '../ui/button';
import CoordinadorSchedule from '../CoordinadorSchedule';
import { useGetSubjects } from '@/api/useGetSubjects';
import { ResponseType } from "@/types/response";

export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetSubjects();
  const params = useParams();
  const { slug } = params;

  return (
    <div className="p-4">
      <p className="text-3xl font-bold mb-4">
        Horario propuesto a {slug}
      </p>
      {loading && <p>cargando...</p>}
      {result !== null &&
   (   <CoordinadorSchedule subjects={result} />)}
      <div className="flex justify-between mt-8 gap-4 text-white">
        <Button variant="outline" className="w-full bg-red-700 text-white">
          Limpiar
        </Button>
      </div>
        <Button className="w-full">
          <Save />
          Guardar
        </Button>
    </div>
  );
}
