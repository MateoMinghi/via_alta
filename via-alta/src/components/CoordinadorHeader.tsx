'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, User, Loader2 } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import LogoutButton from './LogoutButton';
import { useAuth } from '@/context/AuthContext';
import useGetSchoolCycles, { SchoolCycle } from '@/api/useGetSchoolCycles';
import { toast } from 'sonner';

export default function Header() {
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [activeButton, setActiveButton] = useState('ESTUDIANTES');
  const router = useRouter();
  const { user } = useAuth();
  const { result: schoolCycles, loading, error } = useGetSchoolCycles();
  
  // Find active school cycle and set it as default when data loads
  useEffect(() => {
    if (schoolCycles && schoolCycles.length > 0) {
      // Find the active cycle
      const activeCycle = schoolCycles.find(cycle => cycle.active);
      if (activeCycle) {
        setSelectedCycle(activeCycle.id.toString());
      } else {
        // If no active cycle, select the most recent one (first in the sorted list)
        setSelectedCycle(schoolCycles[0].id.toString());
      }
    }
  }, [schoolCycles]);
  
  useEffect(() => {
    if (error) {
      toast.error("Error loading school cycles");
    }
  }, [error]);

  const handleNavClick = (buttonName: string, path: string) => {
    setActiveButton(buttonName);
    router.push(path);
  };
  
  const formatSchoolCycle = (cycle: SchoolCycle) => {
    // Display the cycle code, if code is just "-", use a more descriptive text
    return cycle.code === "-" ? "Sin código" : cycle.code;
  };
  
  return (
    <div className="bg-black text-white m-4 rounded-lg flex flex-row justify-between items-center p-4">
      <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/dashboard')} />
      
      <div className="flex items-center gap-2 mx-8">
        <Calendar className="h-5 w-5" />
        <Select value={selectedCycle} onValueChange={setSelectedCycle}>
          <SelectTrigger className="w-[180px] bg-dark">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando...</span>
              </div>
            ) : (
              <SelectValue placeholder="Seleccionar ciclo escolar" />
            )}
          </SelectTrigger>
          <SelectContent>
            {schoolCycles?.map((cycle) => (
              <SelectItem 
                key={cycle.id} 
                value={cycle.id.toString()}
              >
                {formatSchoolCycle(cycle)}
                {cycle.active && " (Activo)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-row text-lg justify-around gap-4">
        <Button variant="nav" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('ESTUDIANTES', '/dashboard/')} isActive={activeButton === 'ESTUDIANTES'}>ESTUDIANTES</Button>
        <Button variant="nav" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('PROFESORES', '/dashboard/profesores')} isActive={activeButton === 'PROFESORES'}>PROFESORES</Button>
        <Button variant="ghost" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('HORARIOS', '/dashboard/horarios')} isActive={activeButton === 'HORARIOS'}>HORARIOS</Button>
        <Button variant="ghost" className="cursor-pointer w-full h-full" onClick={() => handleNavClick('SALONES', '/dashboard/salones')} isActive={activeButton === 'SALONES'}>SALONES</Button>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="text-sm font-medium hidden md:inline">
              {user.name} {user.first_surname}
            </span>
          </div>
        )}
        <LogoutButton variant="ghost" />
      </div>
    </div>
  );
}