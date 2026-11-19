import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/agrobaru';

const ROLE_HOME: Record<UserRole, string> = {
  productor: '/productor',
  consumidor: '/mercado',
};

export const AuthLoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Verificando tu sesión segura…',
}) => (
  <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5] flex flex-col items-center justify-center gap-4 px-6">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center">
      <Sprout className="w-6 h-6 text-[#05100A]" strokeWidth={2} />
    </div>
    <div className="w-10 h-10 border-2 border-[#15803D] border-t-transparent rounded-full animate-spin" />
    <p className="font-mono text-xs text-[#9E9E9E] text-center">{message}</p>
  </div>
);

/** Exige una sesión de Firebase activa. */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

/** Exige que el usuario ya haya elegido Productor o Consumidor. */
export const RoleOnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, profileLoading, loading } = useAuth();

  if (loading || profileLoading) return <AuthLoadingScreen />;
  if (!profile || !profile.role) return <Navigate to="/seleccionar-rol" replace />;
  return <>{children}</>;
};

/** Aísla por completo una vista según el rol activo. */
export const RoleExclusiveGuard: React.FC<{
  role: UserRole;
  children: React.ReactNode;
}> = ({ role, children }) => {
  const { profile } = useAuth();
  if (!profile?.role) return <Navigate to="/seleccionar-rol" replace />;
  if (profile.role !== role) return <Navigate to={ROLE_HOME[profile.role]} replace />;
  return <>{children}</>;
};

/** Login y registro: si ya hay sesión, se envía al entorno correspondiente. */
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading) return <AuthLoadingScreen message="Cargando acceso empresarial…" />;
  if (user) {
    if (profileLoading) return <AuthLoadingScreen message="Recuperando tu perfil…" />;
    if (profile?.role) return <Navigate to={ROLE_HOME[profile.role]} replace />;
    return <Navigate to="/seleccionar-rol" replace />;
  }
  return <>{children}</>;
};

/** Selección de rol: requiere sesión, pero no un rol previo. */
export const RoleSelectionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profileLoading) return <AuthLoadingScreen message="Preparando tu cuenta…" />;
  if (profile?.role) return <Navigate to={ROLE_HOME[profile.role]} replace />;
  return <>{children}</>;
};
