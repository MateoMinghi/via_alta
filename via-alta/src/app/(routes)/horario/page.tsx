import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Schedule from '@/components/Schedule';
import React from 'react';


export default function Home() {
  return (
    <main className='mx-8'>
      <Header />
      <Schedule />
      <Footer />
    </main>
  );
}
