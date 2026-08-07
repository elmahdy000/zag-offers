export function register() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};

  const registerWorker = () => {
    void navigator.serviceWorker.register('/service-worker.js').catch((registrationError) => {
      console.warn('SW registration failed:', registrationError);
    });
  };

  if (document.readyState === 'complete') registerWorker();
  else window.addEventListener('load', registerWorker, { once: true });

  return () => window.removeEventListener('load', registerWorker);
}

export function unregister() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
