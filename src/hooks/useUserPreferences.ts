import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import {
  applyPreferencesToDocument,
  DEFAULT_PREFERENCES,
  loadLocalPreferences,
  loadRemotePreferences,
  saveLocalPreferences,
  saveRemotePreferences,
  UserPreferences,
} from '@/services/preferencesService';

interface UseUserPreferencesResult {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  loading: boolean;
}

export function useUserPreferences(userId?: string): UseUserPreferencesResult {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const initial = loadLocalPreferences(userId);

  const [preferences, setPreferences] = useState<UserPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...(initial || {}),
    language: initial?.language || language,
    theme: initial?.theme || theme,
  }));
  const [loading, setLoading] = useState(true);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const local = loadLocalPreferences(userId);
    const base: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(local || {}),
      language: local?.language || language,
      theme: local?.theme || theme,
    };

    preferencesRef.current = base;
    setPreferences(base);
    applyPreferencesToDocument(base);
    if (local) {
      setLanguage(local.language);
      setTheme(local.theme);
    }
    // La copia local está lista: no bloqueamos la UI esperando la nube.
    setLoading(false);

    loadRemotePreferences(userId).then((remote) => {
      if (cancelled || !remote) {
        return;
      }
      const merged = { ...base, ...remote };
      preferencesRef.current = merged;
      setPreferences(merged);
      applyPreferencesToDocument(merged);
      setLanguage(merged.language);
      setTheme(merged.theme);
      saveLocalPreferences(userId, merged);
    });

    return () => {
      cancelled = true;
    };
    // Solo se recarga al cambiar de cuenta; idioma y tema actuales son el punto
    // de partida, no dependencias que deban reiniciar las preferencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const persist = useCallback(
    (next: UserPreferences) => {
      preferencesRef.current = next;
      setPreferences(next);
      applyPreferencesToDocument(next);
      saveLocalPreferences(userId, next);
      void saveRemotePreferences(userId, next);
    },
    [userId],
  );

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      const next = { ...preferencesRef.current, [key]: value };
      if (key === 'language') setLanguage(value as UserPreferences['language']);
      if (key === 'theme') setTheme(value as UserPreferences['theme']);
      persist(next);
    },
    [persist, setLanguage, setTheme],
  );

  const resetPreferences = useCallback(() => {
    persist({ ...DEFAULT_PREFERENCES });
    setLanguage(DEFAULT_PREFERENCES.language);
    setTheme(DEFAULT_PREFERENCES.theme);
  }, [persist, setLanguage, setTheme]);

  return { preferences, updatePreference, resetPreferences, loading };
}
