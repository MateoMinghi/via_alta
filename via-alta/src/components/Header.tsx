import React from 'react';

import { User } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';

function Header() {
  const studentName = 'Enrique Ayala Zapata';
  const studentId = '100127';

  return (
    <div className="bg-black text-white m-4 rounded-lg flex flex-row justify-between items-center p-4">
      <Image src="/logo.svg" alt="logo" width={50} height={50} />
      <div className="text-xl hidden sm:block">
        <p>
          {studentName}
          {' '}
          -
          {' '}
          {studentId}
        </p>
      </div>
      <Button className="text-black" variant="outline" size="lg">
        <User size={24} />
      </Button>
    </div>
  );
}

export default Header;
