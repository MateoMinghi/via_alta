import React from 'react';
import HorariosSlug from '@/components/pages/HorariosSlug';

interface PageProps {
  params: {
    slug: string;
  }
}

export default function Page({ params }: PageProps) {
  return (
    <main>
      <HorariosSlug />
    </main>
  );
}
