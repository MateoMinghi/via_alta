'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/');
        return;
      }

      // If roles are specified and user's role is not included, redirect
      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role.name)) {
        // Redirect based on role
        if (user.role.name === 'student') {
          router.push('/estudiante');
        } else if (['admin', 'coordinator'].includes(user.role.name)) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, isLoading, allowedRoles, user, router]);

  // Show nothing while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
}