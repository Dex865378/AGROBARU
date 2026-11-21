import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Language } from '@/context/LanguageContext';
import type { ThemeId } from '@/context/ThemeContext';

export interface UserPreferences {
  messages: boolean;
  orders: boolean;
  community: boolean;
  emailDigest: boolean;
  sounds: boolean;
  showOnlineStatus: boolean;
  readReceipts: boolean;
  showLocation: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
  language: Language;
  theme: ThemeId;
  updatedAt?: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  messages: true,
  orders: true,
  community: true,
  emailDigest: false,
  sounds: true,
  showOnlineStatus: true,
  readReceipts: true,
  showLocation: true,
  compactMode: false,
  reducedMotion: false,
  language: 'es',
  theme: 'esmeralda',
};

const storageKey = (userId?: string) => `agrobaru_preferences_${userId || 'guest'}`;

function normalizePreferences(value: Partial<UserPreferences> | null | undefined): UserPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...(value || {}),
    language: value?.language === 'en' ? 'en' : 'es',
    theme: value?.theme || DEFAULT_PREFERENCES.theme,
  };
}

export function loadLocalPreferences(userId?: string): UserPreferences | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLocalPreferences(userId: string | undefined, preferences: UserPreferences): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(preferences));
  } catch {
    // Las preferencias siguen activas en memoria.
  }
}

export async function loadRemotePreferences(userId?: string): Promise<UserPreferences | null> {
  if (!userId) return null;
  try {
    const snapshot = await getDoc(doc(db, 'userPreferences', userId));
    if (!snapshot.exists()) return null;
    return normalizePreferences(snapshot.data() as Partial<UserPreferences>);
  } catch {
    return null;
  }
}

export async function saveRemotePreferences(
  userId: string | undefined,
  preferences: UserPreferences,
): Promise<void> {
  if (!userId) return;
  try {
    await setDoc(
      doc(db, 'userPreferences', userId),
      {
        ...preferences,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch {
    // Si no hay sesión o conexión, la copia local sigue funcionando.
  }
}

export function applyPreferencesToDocument(preferences: UserPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.compact = String(preferences.compactMode);
  root.dataset.reducedMotion = String(preferences.reducedMotion);
}
