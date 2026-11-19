// ============================================================================
// AgroBarú · Inicialización única de Firebase
// ----------------------------------------------------------------------------
// - Auth con persistencia local (sesión PWA entre recargas y cierres).
// - Firestore con caché persistente en IndexedDB y soporte multi-pestaña,
//   pensado para operar en campo con conectividad intermitente en Barú.
// - Las credenciales del proyecto existente se conservan intactas.
// ============================================================================

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: 'mapache-4ab0f',
  appId: '1:551726000016:web:6bf7df8a56cb08965df515',
  storageBucket: 'mapache-4ab0f.firebasestorage.app',
  apiKey: 'AIzaSyASKlcxIqCuIA2vafAGAYWBK6fF1pJOMRk',
  authDomain: 'mapache-4ab0f.firebaseapp.com',
  messagingSenderId: '551726000016',
  measurementId: 'G-FNGSHCSVQS',
} as const;

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    ignoreUndefinedProperties: true,
  });
} catch {
  // HMR o inicialización previa: se reutiliza la instancia existente.
  firestoreInstance = getFirestore(app);
}
export const db: Firestore = firestoreInstance;

// Se fuerza la persistencia local del Auth. Si el navegador no la soporta
// (modo privado estricto), Firebase conserva la sesión en memoria.
if (typeof window !== 'undefined') {
  void setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('[Firebase Auth] Persistencia local no disponible:', error);
  });
}

// Entorno local de pruebas end-to-end (Firebase Emulator Suite).
// Solo se activa con VITE_USE_FIREBASE_EMULATORS=true y nunca en producción.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  const globalFlags = globalThis as typeof globalThis & {
    __agrobaruEmulatorsConnected?: boolean;
  };
  if (!globalFlags.__agrobaruEmulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    globalFlags.__agrobaruEmulatorsConnected = true;
    console.info('[Firebase] Emuladores locales conectados (Auth 9099 · Firestore 8080).');
  }
}

export const USERS_COLLECTION = 'users';
export const PRODUCTS_COLLECTION = 'products';
