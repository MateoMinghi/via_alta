'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/LogoutButton';
import { Menu, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function EstudianteHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fullName = user ? `${user.name} ${user.first_surname} ${user.second_surname || ''}` : '';
  const studentId = user ? user.ivd_id : '';

  return (
    <div className="bg-black text-white my-4 rounded-lg flex flex-row justify-between items-center p-4">
      {/* Logo */}
      <div className="flex items-center">
        <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/estudiante')} />
      </div>
      
      {/* Desktop user info */}
      <div className="text-xl hidden md:block">
        <p>
          {fullName}
          {studentId && (
            <>
              {' '}-{' '}
              {studentId}
            </>
          )}
        </p>
      </div>
      
      {/* Desktop logout button */}
      <div className="hidden md:flex items-center gap-2">
        <LogoutButton 
          variant="outline" 
          className="bg-black text-white border-white hover:text-black" 
          onClick={() => router.push('/')} 
        />
      </div>
      
      {/* Mobile menu button */}
      <div className="flex md:hidden ml-auto">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-black text-white border-gray-800 w-[250px] p-0">
            <div className="flex flex-col h-full">
              {/* Mobile User Info */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5" />
                  <span className="text-lg font-medium">
                    {fullName}
                  </span>
                </div>
                {studentId && (
                  <div className="text-sm text-gray-300 pl-7">
                    ID: {studentId}
                  </div>
                )}
              </div>
              
              {/* Navigation Links (can be added here if needed) */}
              <div className="flex-1 py-4">
                {/* You can add navigation links here if needed */}
              </div>
              
              {/* Logout button */}
              <div className="p-4 border-t border-gray-800">
                <LogoutButton 
                  variant="outline" 
                  className="w-full bg-black text-white border-white hover:bg-white hover:text-black" 
                  onClick={() => router.push('/')} 
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
