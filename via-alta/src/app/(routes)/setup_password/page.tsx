'use client';

import React, { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import SetupPasswordForm from './SetupPasswordForm';

export default function SetupPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex bg-black/70 h-screen items-center justify-center">
          <Card className="flex flex-col items-center w-[400px] p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-center">Cargando...</p>
          </Card>
        </div>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}