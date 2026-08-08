export function register() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};

  let refreshing = false;
  const handleControllerChange = () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  };

  const registerWorker = () => {
    void navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' })
      .then((registration) => {
        const activateUpdate = (worker: ServiceWorker | null) => {
          if (worker && navigator.serviceWorker.controller) worker.postMessage({ type: 'SKIP_WAITING' });
        };
        activateUpdate(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed') activateUpdate(worker);
          });
        });
        window.setTimeout(() => void registration.update(), 10_000);
      })
      .catch((registrationError) => console.warn('SW registration failed:', registrationError));
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

  if (document.readyState === 'complete') registerWorker();
  else window.addEventListener('load', registerWorker, { once: true });

  return () => {
    window.removeEventListener('load', registerWorker);
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  };
}

export function unregister() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
