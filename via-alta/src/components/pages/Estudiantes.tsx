'use client';

import React from 'react';
import StatusTable from '../StatusTable';
import SolicitudesBanner from '../SolicitudesBanner';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";

export default function Estudiantes() {
  const { result, loading }: ResponseType = useGetStudents();

  return (
    <div>
      <div>
        <p className="font-bold text-xl text-via">ESTUDIANTES</p>
        <div className="p-4 bg-white rounded-lg">
          <p>En esta sección, el coordinador puede gestionar los estudiantes, ver su horario, revisar quién solicitó cambios, buscar alumnos, entre otras funciones. Por favor, utiliza las herramientas disponibles para mantener la información actualizada y precisa. Si tienes alguna duda, contacta al soporte técnico.</p>
        </div>
      </div>
      {loading && <p>cargando...</p>}
      {result !== null &&
      <>
      <div>
        <SolicitudesBanner numberOfChanges={result.filter((student: any) => student.status === 'requiere-cambios').length} />
      </div>
      <div>
        <p className="font-bold text-xl text-via">ESTATUS DE ALUMNOS</p>
        <StatusTable students={result}/>
      </div>
      </>}
    </div>
  );
}
