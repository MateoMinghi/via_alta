// Importamos React (necesario para componentes funcionales)
import React from 'react';

// Importamos el componente Estatus desde la carpeta de componentes
import Estatus from '@/components/pages/Estatus';

// Componente principal de la página Home
export default function Home() {
  return (
    // Elemento principal de la página
    <main>
      {/* Renderizamos el componente Estatus */}
      <Estatus />
    </main>
  );
}
