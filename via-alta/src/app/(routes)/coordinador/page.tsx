import Coordinador from '@/components/pages/Coordinador';
import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import React from 'react';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <Coordinador />
      <Footer />
    </main>
  );
}
