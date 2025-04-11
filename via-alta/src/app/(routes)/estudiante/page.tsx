'use client';

import React from 'react';
import Estudiante from '@/components/pages/Estudiante';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <main>
        <Estudiante />
      </main>
    </ProtectedRoute>
  );
}
