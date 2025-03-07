import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import React from 'react';
import CoordinadorHorario from '@/components/pages/CoordinadorHorario';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <CoordinadorHorario />
      <Footer />
    </main>
  );
}
