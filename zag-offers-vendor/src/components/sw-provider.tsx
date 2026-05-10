'use client';

import { useEffect } from 'react';
import { register } from '@/lib/register-sw';

export default function SWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      register();
    }
  }, []);

  return <>{children}</>;
}
