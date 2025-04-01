'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export default function LogoutButton({ variant = 'ghost', className }: LogoutButtonProps) {
  const { logout } = useAuth();

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={() => logout()}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Cerrar sesión
    </Button>
  );
}