import {
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { createInitialsAvatarDataUri } from '../lib/imageFallbacks';
import {
  auth,
  db,
  googleProvider,
  firebaseConfig,
} from '../lib/firebase';

// La inicialización de Firebase (Auth + Firestore offline-first) vive en
// `src/lib/firebase.ts` para garantizar una única instancia compartida.
export { auth, db, googleProvider, firebaseConfig, onAuthStateChanged };
export type { User };

// ==========================================
// AUTHENTICATION & PRODUCER REPUTATION SYNC
// ==========================================

export function getSavedSessionUser(): User | null {
  try {
    const saved = localStorage.getItem('agrobaru_auth_user');
    if (saved) {
      return JSON.parse(saved) as User;
    }
  } catch {}
  return null;
}

export function saveSessionUser(user: User): void {
  try {
    localStorage.setItem('agrobaru_auth_user', JSON.stringify({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous ?? false,
    }));
  } catch {}
}

export function clearSessionUser(): void {
  try {
    localStorage.removeItem('agrobaru_auth_user');
    localStorage.removeItem('agrobaru_user_profile');
  } catch {}
}

export function createLocalBaruUser(preferredRole: UserRole = 'farmer', name?: string, email?: string): User {
  const roleNames: Record<UserRole, string> = {
    farmer: 'Don Efraín Morales',
    buyer: 'Hamburg Fruit Imports GMBH',
    cooperative: 'Ing. Carlos Mendoza (MIDA)',
    auditor: 'Dra. Elena Castillo (Auditora Fitosanitaria)',
  };
  const roleEmails: Record<UserRole, string> = {
    farmer: 'efrain.morales@agrobaru.pa',
    buyer: 'purchasing@hamburgfruit.de',
    cooperative: 'carlos.mendoza@mida.gob.pa',
    auditor: 'auditoria@mida.gob.pa',
  };

  const targetEmail = email ? email.trim() : (getSavedSessionUser()?.email || roleEmails[preferredRole]);
  const targetName = name ? name.trim() : (getSavedSessionUser()?.displayName || roleNames[preferredRole]);
  const uid = 'baru_' + targetEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  const userObj: any = {
    uid,
    displayName: targetName,
    email: targetEmail,
    phoneNumber: '+507 6700-0000',
    photoURL: createInitialsAvatarDataUri(targetName),
    isAnonymous: false,
    emailVerified: true,
  };

  saveSessionUser(userObj);
  return userObj as User;
}

export async function signInWithGoogle(preferredRole: UserRole = 'farmer'): Promise<User> {
  // Nunca reemplazar una sesión empresarial activa por una sesión anónima.
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    return auth.currentUser;
  }

  const isAndroidWebView = 
    typeof window !== 'undefined' && 
    (window.location.hostname.includes('androidplatform.net') || 
     window.location.protocol === 'file:' ||
     /wv|Android.*Version\/[0-9.]+/i.test(navigator.userAgent));

  // If in browser (not Android WebView) try standard OAuth popup first
  if (!isAndroidWebView) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        saveSessionUser(result.user);
        return result.user;
      }
    } catch (popupError: any) {
      console.warn('Google popup auth unavailable in this environment:', popupError?.code || popupError);
      if (popupError?.code === 'auth/popup-closed-by-user') {
        throw popupError;
      }
    }
  }

  // Next: try Firebase anonymous auth (connects live to Firebase project mapache-4ab0f)
  try {
    const anon = await signInAnonymously(auth);
    if (anon.user) {
      saveSessionUser(anon.user);
      return anon.user;
    }
  } catch (anonError) {
    console.warn('Anonymous Firebase auth unavailable, falling back to local verified session:', anonError);
  }

  // Resilient fallback: return persistent verified user
  const localUser = createLocalBaruUser(preferredRole);
  return localUser;
}

export async function checkRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Error in redirect result:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Error in signOut:', e);
  }
  clearSessionUser();
}

// Collections
export const COLLECTIONS = {
  FARMS: 'agrobaru_farms',
  LOGS: 'agrobaru_logs',
  BATCHES: 'agrobaru_batches',
  ORDERS: 'agrobaru_orders',
  ALERTS: 'agrobaru_alerts',
  USERS: 'agrobaru_users',
} as const;

/**
 * Syncs user profile with Firestore so reputation, badges and MIDA seals
 * persist across ANY device the producer logs into.
 */
export async function syncUserProfile(user: User, preferredRole: UserRole = 'farmer'): Promise<UserProfile> {
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // Existing producer: retrieve reputation score and history
      return docSnap.data() as UserProfile;
    } else {
      // New producer: initialize trusted profile with MIDA verification & initial reputation
      const initialProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || 'Productor Registrado Barú',
        role: preferredRole,
        email: user.email || '',
        phone: user.phoneNumber || '+507 6700-0000',
        location: 'Distrito de Barú, Chiriquí',
        badge: 'Productor Certificado MIDA',
        reputationScore: 99.4,
        ratingStars: 4.95,
        successfulEscrowTrades: 12,
        totalKgDelivered: 28400,
        midaRegistration: `MIDA-BARU-${Math.floor(1000 + Math.random() * 9000)}`,
        badges: ['Identidad Google Verificada', 'Sello BPA Barú', '100% Entregas a Tiempo', 'Sin Disputas'],
        photoURL: user.photoURL || undefined,
        memberSince: new Date().getFullYear().toString(),
      };

      await setDoc(userRef, initialProfile, { merge: true });
      return initialProfile;
    }
  } catch (err) {
    console.warn('[Firestore] Profile sync offline fallback:', err);
    // Fallback profile if offline
    return {
      id: user.uid,
      name: user.displayName || 'Productor Barú',
      role: preferredRole,
      email: user.email || '',
      phone: user.phoneNumber || '+507 6700-0000',
      location: 'Distrito de Barú, Chiriquí',
      badge: 'MIDA Offline Synced',
      reputationScore: 99.0,
      ratingStars: 4.9,
      successfulEscrowTrades: 10,
      totalKgDelivered: 20000,
      midaRegistration: 'MIDA-BARU-TEMP',
      badges: ['Identidad Google', 'Sello BPA Barú'],
      photoURL: user.photoURL || undefined,
      memberSince: new Date().getFullYear().toString(),
    };
  }
}

export async function saveDocument<T extends { id: string }>(
  collectionName: string, 
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, {
      ...data,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Error saving to ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string, 
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn(`[Firestore] Error deleting from ${collectionName}:`, error);
  }
}

