'use client';

import React from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
      <Header />
      <div className="mx-8">
        {children}
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
