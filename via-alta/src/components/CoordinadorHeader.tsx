'use client';

import React, { useState } from 'react';

import { Calendar } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export default function Header() {
  const [semester, setSemester] = useState('2025-1');

  const router = useRouter();

  return (
    <div className="bg-black text-white m-4 rounded-lg flex flex-row justify-between items-center p-4">
      <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/')} />
      <div className="flex flex-row text-xl justify-around w-full gap-4 mx-8">

        <Button variant="ghost" className="cursor-pointer w-full font-bold" onClick={() => router.push('/coordinador/')}>Estudiantes</Button>
        <Button variant="ghost" className="cursor-pointer w-full font-bold" onClick={() => router.push('/coordinador/profesores')}>Profesores</Button>

      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-[180px] bg-dark">
            <SelectValue placeholder="Seleccionar semestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-2">Semestre 2024-2</SelectItem>
            <SelectItem value="2025-1">Semestre 2025-1</SelectItem>
            <SelectItem value="2025-2">Semestre 2025-2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
