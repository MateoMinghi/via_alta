'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface LogoutButtonProps extends ButtonProps {}

export default function LogoutButton({ 
  className, 
  variant = "default",
  ...props 
}: LogoutButtonProps) {
  const { logout } = useAuth();

  return (
    <Button
      onClick={logout}
      variant={variant}
      className={className}
      {...props}
    >
      <LogOut className="h-4 w-4 mr-2" /> 
      Cerrar sesión
    </Button>
  );
}