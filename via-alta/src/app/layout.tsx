import React from 'react';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Via Alta',
  description: 'Sistema de programación académica',
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
