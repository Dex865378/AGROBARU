import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { auth, db, googleProvider, USERS_COLLECTION } from '@/lib/firebase';
import type { BaruCommunity, UserProfile, UserRole } from '@/types/agrobaru';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  community: BaruCommunity;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  online: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole, community?: BaruCommunity) => Promise<void>;
  updateProfileData: (patch: Partial<Pick<UserProfile, 'name' | 'community' | 'photoURL' | 'bannerUrl'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_TIMEOUT_MS = 4500;

function toProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    name: typeof data.name === 'string' && data.name.trim() ? data.name : 'Usuario AgroBarú',
    email: typeof data.email === 'string' ? data.email : '',
    community: (data.community as BaruCommunity) || 'Otro',
    role: data.role === 'productor' || data.role === 'consumidor' ? data.role : null,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    bannerUrl: typeof data.bannerUrl === 'string' ? data.bannerUrl : null,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  const unsubscribeProfileRef = useRef<(() => void) | null>(null);
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const legacyHydratedRef = useRef<Set<string>>(new Set());

  const clearProfileSubscription = useCallback(() => {
    unsubscribeProfileRef.current?.();
    unsubscribeProfileRef.current = null;
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
      profileTimeoutRef.current = null;
    }
  }, []);

  const ensureUserDocument = useCallback(async (currentUser: User): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
    try {
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) return;
      const now = new Date().toISOString();
      await setDoc(
        userRef,
        {
          uid: currentUser.uid,
          name: currentUser.displayName || 'Usuario AgroBarú',
          email: currentUser.email || '',
          community: 'Otro' as BaruCommunity,
          role: null,
          photoURL: currentUser.photoURL || null,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    } catch (error) {
      // Sin conexión y sin caché del documento: el guard de onboarding
      // mostrará la selección de rol en cuanto Firestore sincronice.
      console.warn('[AgroBarú Auth] No se pudo verificar users/{uid}:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      clearProfileSubscription();

      // Las sesiones anónimas del prototipo público no son identidades
      // empresariales: no habilitan las rutas protegidas.
      if (currentUser?.isAnonymous) {
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      void ensureUserDocument(currentUser);

      const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
      const unsubscribeSnapshot = onSnapshot(
        userRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          setProfile(snapshot.exists() ? toProfile(currentUser.uid, snapshot.data()) : null);
          setProfileLoading(false);
          if (profileTimeoutRef.current) {
            clearTimeout(profileTimeoutRef.current);
            profileTimeoutRef.current = null;
          }
        },
        (error) => {
          console.warn('[AgroBarú Auth] Error al leer el perfil:', error);
          setProfileLoading(false);
        },
      );
      unsubscribeProfileRef.current = unsubscribeSnapshot;

      // La caché de Firestore responde de inmediato; este límite evita un
      // spinner infinito si el documento aún no existe en este dispositivo.
      profileTimeoutRef.current = setTimeout(() => {
        setProfileLoading(false);
      }, PROFILE_TIMEOUT_MS);
    });

    return () => {
      clearProfileSubscription();
      unsubscribeAuth();
    };
  }, [clearProfileSubscription, ensureUserDocument]);

  // El entorno completo guarda la configuración principal en agrobaru_users
  // (foto, portada, nombre de finca). /perfil usa users, así que al abrir la
  // cuenta se completa con esos datos en vez de mostrar el perfil desde cero.
  useEffect(() => {
    if (!user || !profile?.uid || legacyHydratedRef.current.has(user.uid)) return;
    legacyHydratedRef.current.add(user.uid);
    let cancelled = false;

    const hydrateFromLegacyProfile = async () => {
      let legacy: DocumentData | null = null;
      try {
        const legacySnapshot = await getDoc(doc(db, 'agrobaru_users', user.uid));
        if (legacySnapshot.exists()) legacy = legacySnapshot.data();
      } catch (error) {
        console.warn('[AgroBarú Auth] No se pudo leer el perfil heredado:', error);
      }

      if (!legacy) {
        try {
          const saved = JSON.parse(
            localStorage.getItem('agrobaru_user_profile') || 'null',
          ) as Record<string, unknown> | null;
          if (saved && saved.id === user.uid) legacy = saved;
        } catch {}
      }
      if (!legacy || cancelled) return;

      const patch: Partial<Pick<UserProfile, 'name' | 'photoURL' | 'bannerUrl'>> = {};
      const legacyName = typeof legacy.name === 'string' ? legacy.name.trim() : '';
      const legacyPhoto =
        typeof legacy.photoURL === 'string' && legacy.photoURL ? legacy.photoURL : null;
      const legacyBanner =
        typeof legacy.bannerURL === 'string' && legacy.bannerURL ? legacy.bannerURL : null;

      if (legacyName && legacyName !== profile.name) patch.name = legacyName;
      if (!profile.photoURL && legacyPhoto) patch.photoURL = legacyPhoto;
      if (!profile.bannerUrl && legacyBanner) patch.bannerUrl = legacyBanner;

      if (Object.keys(patch).length === 0) return;
      setProfile((current) =>
        current && current.uid === user.uid ? { ...current, ...patch } : current,
      );
      try {
        await setDoc(doc(db, USERS_COLLECTION, user.uid), patch, { merge: true });
      } catch (error) {
        console.warn('[AgroBarú Auth] No se pudo completar users/{uid}:', error);
      }
    };

    void hydrateFromLegacyProfile();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.uid, profile?.name, profile?.photoURL, profile?.bannerUrl]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await ensureUserDocument(credential.user);
    },
    [ensureUserDocument],
  );

  const register = useCallback(
    async ({ name, email, password, community }: RegisterInput) => {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(credential.user, { displayName: cleanName });
      }
      const now = new Date().toISOString();
      await setDoc(
        doc(db, USERS_COLLECTION, credential.user.uid),
        {
          uid: credential.user.uid,
          name: cleanName || 'Usuario AgroBarú',
          email: credential.user.email || email.trim(),
          community,
          role: null,
          photoURL: credential.user.photoURL || null,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await ensureUserDocument(credential.user);
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
      // En móviles/PWA el popup suele bloquearse: se reintenta con redirect.
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/web-storage-unsupported'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw error;
    }
  }, [ensureUserDocument]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const setRole = useCallback(
    async (role: UserRole, community?: BaruCommunity) => {
      if (!user) throw new Error('No hay una sesión activa.');
      const now = new Date().toISOString();
      const previousProfile = profile;
      // Actualización optimista: permite navegar al entorno del rol sin esperar
      // la confirmación del servidor (clave cuando se opera sin señal).
      setProfile((current) =>
        current
          ? { ...current, role, community: community ?? current.community, updatedAt: now }
          : {
              uid: user.uid,
              name: user.displayName || 'Usuario AgroBarú',
              email: user.email || '',
              community: community ?? 'Otro',
              role,
              photoURL: user.photoURL || null,
              createdAt: now,
              updatedAt: now,
            },
      );
      try {
        const payload: Record<string, unknown> = { role, updatedAt: now };
        if (community) payload.community = community;
        await setDoc(doc(db, USERS_COLLECTION, user.uid), payload, { merge: true });
      } catch (error) {
        setProfile(previousProfile);
        throw error;
      }
    },
    [profile, user],
  );

  const updateProfileData = useCallback(
    async (patch: Partial<Pick<UserProfile, 'name' | 'community' | 'photoURL' | 'bannerUrl'>>) => {
      if (!user) throw new Error('No hay una sesión activa.');
      const now = new Date().toISOString();
      const previousProfile = profile;
      setProfile((current) => (current ? { ...current, ...patch, updatedAt: now } : current));
      try {
        await setDoc(
          doc(db, USERS_COLLECTION, user.uid),
          { ...patch, updatedAt: now },
          { merge: true },
        );
        // Mantener sincronizado el perfil del entorno completo (foto, portada
        // y nombre) para que no se pierda al abrir Mi Cuenta.
        const legacyRef = doc(db, 'agrobaru_users', user.uid);
        const legacySnapshot = await getDoc(legacyRef);
        if (legacySnapshot.exists()) {
          const legacyPatch: Record<string, unknown> = {};
          if (patch.name) legacyPatch.name = patch.name;
          if ('photoURL' in patch) legacyPatch.photoURL = patch.photoURL;
          if ('bannerUrl' in patch) legacyPatch.bannerURL = patch.bannerUrl;
          if (Object.keys(legacyPatch).length > 0) {
            await setDoc(legacyRef, legacyPatch, { merge: true });
          }
        }
      } catch (error) {
        setProfile(previousProfile);
        throw error;
      }
    },
    [profile, user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      online,
      login,
      register,
      loginWithGoogle,
      resetPassword,
      logout,
      setRole,
      updateProfileData,
    }),
    [
      user,
      profile,
      loading,
      profileLoading,
      online,
      login,
      register,
      loginWithGoogle,
      resetPassword,
      logout,
      setRole,
      updateProfileData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
