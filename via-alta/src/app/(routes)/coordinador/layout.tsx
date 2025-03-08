import React from 'react';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import '../../globals.css';

import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';

const poppins = Poppins({
  variable: '--font-poppins',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}> 
        <Header />
          {children}
        <Footer />
      </body>
    </html>
  );
}
