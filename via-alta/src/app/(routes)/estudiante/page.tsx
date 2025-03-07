import Footer from '@/components/Footer';
import EstudianteHeader from '@/components/EstudianteHeader';
import Estudiante from '@/components/pages/Estudiante';
import React from 'react';

export default function Home() {
  return (
    <main className="mx-8">
      <EstudianteHeader />
      <Estudiante />
      <Footer />
    </main>
  );
}
