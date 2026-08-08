'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let reloading = false;
    const controllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    const register = () => {
      void navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) worker.postMessage({ type: 'SKIP_WAITING' });
          });
        });
      }).catch(() => undefined);
    };
    navigator.serviceWorker.addEventListener('controllerchange', controllerChange);
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChange);
      window.removeEventListener('load', register);
    };
  }, []);
  return null;
}
