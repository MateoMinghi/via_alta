import Coordinador from '@/components/Coordinador';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
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
