import React from 'react';
import HorariosSlug from '@/components/pages/HorariosSlug';

// Usando una definición de tipo más flexible para acomodar parámetros como Promesas
interface AsyncPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Haz que el componente de la página sea asíncrono para manejar los parámetros como Promesas
export default async function Page({ params }: AsyncPageProps) {
  // Espera los parámetros para extraer el slug
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  return (
    <main>
      {/* Si HorariosSlug no acepta una prop slug, no la pases */}
      <HorariosSlug />
    </main>
  );
}