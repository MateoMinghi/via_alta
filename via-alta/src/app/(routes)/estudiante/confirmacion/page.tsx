import EstudianteHeader from '@/components/EstudianteHeader';
import Footer from '@/components/Footer';

import React from 'react';

export default function Confirm() {
  return (
    <main className="mx-8">
      <EstudianteHeader/>
      <p className="text-green-600 text-5xl font-bold text-center my-4">
        Horario Confirmado
      </p>
      <p className="text-green-600 text-5xl font-bold text-center my-4">
        Inscripción Finalizada
      </p>
        <Footer/>
    </main>
  );
}
