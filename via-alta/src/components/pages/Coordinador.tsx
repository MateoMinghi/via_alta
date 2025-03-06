'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export default function Coordinador() {
  const router = useRouter();

  return (
    <div className="text-center">
      <p className="font-bold text-2xl">Estudiantes:</p>

      <Button className="w-full font-bold mt-8 mb-16" onClick={() => router.push('/coordinador/estudiantes')}>Ir a la pagina de estudiantes</Button>

      <p className="font-bold text-2xl">Profesores:</p>
      <Button className="w-full font-bold mt-8 mb-16" onClick={() => router.push('/coordinador/profesores')}>Ir a la pagina de profesores</Button>

      <p className="font-bold text-2xl">Salones:</p>
      <Button className="w-full font-bold mt-8 mb-16" onClick={() => router.push('/coordinador/salones')}>Ir a la pagina de salones</Button>

    </div>
  );
}
