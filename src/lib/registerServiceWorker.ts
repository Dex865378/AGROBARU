// Registro central del Service Worker. Se ejecuta en todas las rutas de la
// aplicación (sitio público y entornos autenticados) para que la PWA pueda
// abrirse sin conexión desde /login, /productor o /mercado.

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('AgroBarú ServiceWorker registrado:', registration.scope);
        },
        (error) => {
          console.warn('AgroBarú ServiceWorker no disponible:', error);
        },
      );
    });
  } else {
    // En desarrollo se desregistra para no servir módulos cacheados.
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
  }
}
