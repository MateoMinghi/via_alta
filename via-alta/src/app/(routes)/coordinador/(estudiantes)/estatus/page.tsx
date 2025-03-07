import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import React from 'react';
import Estatus from '@/components/pages/Estatus';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <Estatus />
      <Footer />
    </main>
  );
}
