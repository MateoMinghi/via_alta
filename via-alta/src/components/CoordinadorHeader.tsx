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
  const [activeButton, setActiveButton] = useState('ESTUDIANTES');

  const router = useRouter();

  const handleNavClick = (buttonName: string, path: string) => {
    setActiveButton(buttonName);
    router.push(path);
  };

  return (
    <div className="bg-black text-white m-4 rounded-lg flex flex-row justify-between items-center p-4">
      <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/')} />

      <div className="flex items-center gap-2 mx-8">
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
      
      <div className="flex flex-row text-lg justify-around gap-4">
        <Button variant="nav" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('ESTUDIANTES', '/dashboard/')} isActive={activeButton === 'ESTUDIANTES'}>ESTUDIANTES</Button>
        <Button variant="nav" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('PROFESORES', '/dashboard/profesores')} isActive={activeButton === 'PROFESORES'}>PROFESORES</Button>
        <Button variant="ghost" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('HORARIOS', '/dashboard/horarios')} isActive={activeButton === 'HORARIOS'}>HORARIOS</Button>
        <Button variant="ghost" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('SALONES', '/dashboard/salones')} isActive={activeButton === 'SALONES'}>SALONES</Button>
      </div>
     
      <div>
        <Button variant="nav" className="cursor-pointer h-full mx-8" onClick={() => router.push('/')} isActive={false}>CERRAR SESIÓN</Button>
      </div>
    </div>
  );
}