import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LegacyAgroBaruApp from './AgroBaruWorkspace';
import {
  AuthLoadingScreen,
  ProtectedRoute,
  PublicOnlyRoute,
  RoleExclusiveGuard,
  RoleOnboardingGuard,
  RoleSelectionGuard,
} from '@/components/routing/RouteGuards';
import { AuthPage } from '@/pages/auth/AuthPage';
import { RoleSelectionPage } from '@/pages/onboarding/RoleSelectionPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { registerServiceWorker } from '@/lib/registerServiceWorker';

function RootGate() {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const legacyQuery = ['tab', 'batch', 'verify', 'legal', 'faq', 'google'].some((key) =>
    params.has(key),
  );

  // Enlaces antiguos (sitemap, campañas, QR) siguen abriendo el sitio público.
  if (legacyQuery || location.hash) {
    return <Navigate to={`/sitio${location.search}${location.hash}`} replace />;
  }

  if (loading) return <AuthLoadingScreen />;
  if (!user) return <AuthPage initialMode="login" />;
  if (profileLoading) return <AuthLoadingScreen message="Cargando tu perfil de AgroBarú..." />;
  if (!profile?.role) return <Navigate to="/seleccionar-rol" replace />;

  return <Navigate to={profile.role === 'productor' ? '/productor' : '/mercado'} replace />;
}

export function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Entrada: acceso empresarial, onboarding y redirección por rol */}
          <Route path="/" element={<RootGate />} />

          {/* Sitio público existente (incluye mercado, trazabilidad y herramientas) */}
          <Route path="/sitio" element={<LegacyAgroBaruApp />} />
          <Route path="/trace/*" element={<LegacyAgroBaruApp />} />
          <Route path="/inicio" element={<Navigate to="/sitio" replace />} />

          {/* Acceso empresarial */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="login" />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/registro"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="register" />
              </PublicOnlyRoute>
            }
          />

          {/* Onboarding obligatorio de rol */}
          <Route
            path="/seleccionar-rol"
            element={
              <RoleSelectionGuard>
                <RoleSelectionPage />
              </RoleSelectionGuard>
            }
          />

          {/* Vistas aisladas por rol */}
          <Route
            path="/productor"
            element={
              <ProtectedRoute>
                <RoleOnboardingGuard>
                  <RoleExclusiveGuard role="productor">
                    <LegacyAgroBaruApp initialRole="farmer" initialTab="farmer" roleLocked />
                  </RoleExclusiveGuard>
                </RoleOnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mercado"
            element={
              <ProtectedRoute>
                <RoleOnboardingGuard>
                  <RoleExclusiveGuard role="consumidor">
                    <LegacyAgroBaruApp initialRole="buyer" initialTab="marketplace" roleLocked />
                  </RoleExclusiveGuard>
                </RoleOnboardingGuard>
              </ProtectedRoute>
            }
          />

          {/* Perfil disponible para ambos roles */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <RoleOnboardingGuard>
                  <ProfilePage />
                </RoleOnboardingGuard>
              </ProtectedRoute>
            }
          />

          {/* Rutas heredadas con hash siguen resolviéndose dentro del sitio público */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
