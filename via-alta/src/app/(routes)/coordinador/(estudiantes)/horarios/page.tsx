import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import React from 'react';

import Horarios from '@/components/pages/Horarios';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <Horarios />
      <Footer />
    </main>
  );
}
