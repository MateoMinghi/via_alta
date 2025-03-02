import Footer from '@/components/Footer';
import Login from '@/components/Login';
import React from 'react';

export default function Home() {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start font-[family-name:var(--font-poppins)]">
      <Login />
      <Footer />
    </main>
  );
}
