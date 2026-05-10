'use client';

import { useEffect } from 'react';
import { register } from '@/lib/register-sw';

/**
 * ClientInit — mounts in the client only.
 * Handles service worker registration (cannot be done in a Server Component).
 */
export default function ClientInit() {
  useEffect(() => {
    register();
  }, []);

  return null;
}
