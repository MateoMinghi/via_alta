import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Student from '@/components/pages/Student';
import React from 'react';

export default function Home() {
  return (
    <main className="mx-8">
      <Header />
      <Student />
      <Footer />
    </main>
  );
}
