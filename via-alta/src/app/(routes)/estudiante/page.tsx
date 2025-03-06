import Footer from '@/components/Footer';
import EstudianteHeader from '@/components/EstudianteHeader';
import Student from '@/components/pages/Student';
import React from 'react';

export default function Home() {
  return (
    <main className="mx-8">
      <EstudianteHeader />
      <Student />
      <Footer />
    </main>
  );
}
