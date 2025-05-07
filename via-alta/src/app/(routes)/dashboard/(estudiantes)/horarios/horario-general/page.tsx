// Importamos React (necesario para componentes funcionales)
import React from 'react';

// Importamos el componente Estatus desde la carpeta de componentes
import HorarioGeneral from '@/components/pages/HorarioGeneral';

// Componente principal de la página Home
export default function Home() {
  return (
    // Elemento principal de la página
    <main>
      {/* Renderizamos el componente Estatus */}
      <HorarioGeneral />
    </main>
  );
}
