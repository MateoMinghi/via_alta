import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import React from 'react';
import Salones from '@/components/pages/Salones';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <Salones />
      <Footer />
    </main>
  );
}
