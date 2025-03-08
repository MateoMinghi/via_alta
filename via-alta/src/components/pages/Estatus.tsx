'use client';

import React from 'react';
import RequestTable from '../RequestTable';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";

export default function Estatus() {
  const { result, loading }: ResponseType = useGetStudents();
  return (
    <div className="text-center">
      <p className="text-2xl font-bold mb-6">Solicitudes de Cambios</p>
      {loading && <p>cargando...</p>}
      {result !== null &&
      <RequestTable students={result}/>}
    </div>
  );
}