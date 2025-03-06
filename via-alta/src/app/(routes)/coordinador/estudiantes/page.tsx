import CoordinadorEstudiantes from '@/components/pages/CoordinadorEstudiantes';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import React from 'react';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <CoordinadorEstudiantes />
      <Footer />
    </main>
  );
}
