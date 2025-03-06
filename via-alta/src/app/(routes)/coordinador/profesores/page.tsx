import Footer from '@/components/Footer';
import Header from '@/components/CoordinadorHeader';
import React from 'react';
import Profesor from '@/components/pages/Profesor';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <Profesor />
      <Footer />
    </main>
  );
}
