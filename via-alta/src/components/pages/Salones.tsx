'use client';

import React from 'react';
import SalonList from '../SalonList';

export default function Salones() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <p className="font-bold text-2xl">Salones</p>
      <SalonList />
    </div>
  );
}
