'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Confirmacion from '@/components/pages/Confirmacion';

export default function Home() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <main>
        <Confirmacion />
      </main>
    </ProtectedRoute>
  );
}
