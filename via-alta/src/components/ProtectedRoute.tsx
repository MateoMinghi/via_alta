'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

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

  // Show a better loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-700" />
          <p className="text-lg font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, return null (will redirect in the useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // If roles are specified and user's role is not included, return null (will redirect in the useEffect)
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role.name)) {
    return null;
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
}