import React from 'react';
import HorariosSlug from '@/components/pages/HorariosSlug';

// Using a more flexible type definition to accommodate Promise params
interface AsyncPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Make the page component async to handle the Promise params
export default async function Page({ params }: AsyncPageProps) {
  // Await the params to extract the slug
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  return (
    <main>
      {/* If HorariosSlug doesn't accept a slug prop, don't pass it */}
      <HorariosSlug />
    </main>
  );
}