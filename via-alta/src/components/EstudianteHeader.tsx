'use client';

import React from 'react';

import { User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export default function EstudianteHeader() {
  const studentName = 'Enrique Ayala Zapata';
  const studentId = '100127';
  const router = useRouter();
  return (
    <div className="bg-black text-white m-4 rounded-lg flex flex-row justify-between items-center p-4">
      <Image src="/logo.svg" alt="logo" width={50} height={50} className="cursor-pointer" onClick={() => router.push('/')} />
      <div className="text-xl hidden sm:block">
        <p>
          {studentName}
          {' '}
          -
          {' '}
          {studentId}
        </p>
      </div>
      <Button className="text-black" variant="outline" size="lg">
        <User size={24} />
      </Button>
    </div>
  );
}
