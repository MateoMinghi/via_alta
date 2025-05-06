'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, User, Loader2, Menu, X, ChevronDown } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/context/AuthContext';
import useGetSchoolCycles, { SchoolCycle } from '@/api/useGetSchoolCycles';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [activeButton, setActiveButton] = useState('ESTUDIANTES');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
    router.push(path);
  };
  
  const formatSchoolCycle = (cycle: SchoolCycle) => {
    // Display the cycle code, if code is just "-", use a more descriptive text
    return cycle.code === "-" ? "Sin código" : cycle.code;
  };
  
  const navItems = [
    { name: 'ESTUDIANTES', path: '/dashboard/' },
    { name: 'PROFESORES', path: '/dashboard/profesores' },
    { name: 'HORARIOS', path: '/dashboard/horarios' },
    { name: 'SALONES', path: '/dashboard/salones' },
  ];

  return (
    <div className="bg-black text-white m-4 rounded-lg flex flex-row justify-between items-center p-4">
      {/* Logo */}
      <div className="flex items-center">
        <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/dashboard')} />
      </div>
      
      {/* Cycle Selector - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-2">
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
      
      {/* Desktop Navigation */}
      <div className="hidden lg:flex flex-row text-lg justify-around gap-4">
        {navItems.map((item) => (
          <Button 
            key={item.name}
            variant={activeButton === item.name ? "nav" : "ghost"} 
            className="cursor-pointer w-full h-full" 
            onClick={() => handleNavClick(item.name, item.path)} 
            isActive={activeButton === item.name}
          >
            {item.name}
          </Button>
        ))}
      </div>
      
      {/* User and Logout (Desktop) */}
      <div className="hidden md:flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">
              {user.name} {user.first_surname}
            </span>
          </div>
        )}
        <LogoutButton variant="ghost" />
      </div>
      
      {/* Mobile Menu Button */}
      <div className="flex lg:hidden ml-auto">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-black text-white border-gray-800 w-[250px] p-0">
            <div className="flex flex-col h-full">
              {/* Mobile Cycle Selector */}
              <div className="flex items-center gap-2 p-4 border-b border-gray-800">
                <Calendar className="h-5 w-5" />
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-full bg-dark">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Ciclo escolar" />
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
              
              {/* Mobile Navigation */}
              <div className="flex-1 py-4">
                <div className="flex flex-col space-y-1">
                  {navItems.map((item) => (
                    <Button 
                      key={item.name}
                      variant="ghost" 
                      className={`justify-start rounded-none px-4 py-2 text-lg ${
                        activeButton === item.name ? "bg-white/10 font-medium" : ""
                      }`} 
                      onClick={() => handleNavClick(item.name, item.path)}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* User Info and Logout (Mobile) */}
              <div className="p-4 border-t border-gray-800">
                {user && (
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {user.name} {user.first_surname}
                    </span>
                  </div>
                )}
                <LogoutButton variant="outline" className="w-full" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}