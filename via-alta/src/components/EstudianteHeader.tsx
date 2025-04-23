'use client';

import React from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from './LogoutButton';

export default function EstudianteHeader() {
  const router = useRouter();
  const { user } = useAuth();

  const fullName = user ? `${user.name} ${user.first_surname} ${user.second_surname || ''}` : '';
  const studentId = user ? user.ivd_id : '';

  return (
    <div className="bg-black text-white my-4 rounded-lg flex flex-row justify-between items-center p-4">
      <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/estudiante')} />
      
      <div className="text-xl hidden sm:block">
        <p>
          {fullName}
          {' '}
          -
          {' '}
          {studentId}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <LogoutButton variant="outline" className="bg-black text-white border-white hover:text-black" onClick={() => router.push('/')}  />
      </div>
    </div>
  );
}
