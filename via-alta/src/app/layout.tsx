import React from 'react';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import SessionHeartbeat from '@/components/SessionHeartbeat';

const poppins = Poppins({
  variable: '--font-poppins',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Via Alta',
  description: 'Sistema de Inscripción y Gestión de Cursos para Instituto Via Diseño',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} antialiased`}>
        <AuthProvider>
          <SessionHeartbeat />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}