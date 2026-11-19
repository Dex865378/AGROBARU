import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  UserRound,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return 'AB';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export const RoleNavbar: React.FC = () => {
  const { profile, online, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const role = profile?.role;
  const home = role === 'productor' ? '/productor' : '/mercado';

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      window.alert(translateAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111714]/95 backdrop-blur border-b border-[#1E2E26]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to={home} className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-[#05100A]" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block font-display font-black text-sm sm:text-base tracking-wider text-[#ECFDF5] leading-none">
              AGRO<span className="text-[#10B981]">BARÚ</span>
            </span>
            <span className="hidden sm:block font-mono text-[9px] text-[#666666] tracking-[0.18em] mt-1">
              {role === 'productor' ? 'MODO PRODUCTOR' : 'MODO CONSUMIDOR'}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {role === 'productor' ? (
            <NavLink
              to="/productor"
              aria-label="Mi panel de cosechas"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#15803D] text-black'
                    : 'text-[#CCCCCC] hover:text-[#E5E5E5] hover:bg-[#141414]'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mi Panel</span>
            </NavLink>
          ) : (
            <NavLink
              to="/mercado"
              aria-label="Mercado agrícola"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#15803D] text-black'
                    : 'text-[#CCCCCC] hover:text-[#E5E5E5] hover:bg-[#141414]'
                }`
              }
            >
              <ShoppingBasket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mercado</span>
            </NavLink>
          )}

          <NavLink
            to="/perfil"
            aria-label="Mi perfil"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-[#15803D] text-black'
                  : 'text-[#CCCCCC] hover:text-[#E5E5E5] hover:bg-[#141414]'
              }`
            }
          >
            <UserRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Perfil</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <span
            className={`hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded border font-mono text-[10px] font-bold ${
              online
                ? 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]'
                : 'bg-[#F97316]/10 border-[#F97316]/50 text-[#F97316]'
            }`}
            title={online ? 'Conexión activa' : 'Sin conexión: los cambios se guardan localmente'}
          >
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {online ? 'EN LÍNEA' : 'OFFLINE'}
          </span>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#1E2E26]">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-8 h-8 rounded-full object-cover border border-[#15803D]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-[#141414] border border-[#15803D] text-[#10B981] font-bold text-[11px] flex items-center justify-center">
                {initials(profile?.name || 'Agro Barú')}
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-[#E5E5E5] max-w-[150px] truncate">
                {profile?.name || 'Usuario'}
              </span>
              <span className="flex items-center gap-1 text-[9px] text-[#9E9E9E]">
                <MapPin className="w-2.5 h-2.5 text-[#15803D]" />
                {profile?.community || 'Barú'}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="p-2 rounded-lg border border-[#EF4444]/50 text-[#EF4444] hover:bg-[#EF4444] hover:text-black transition-colors disabled:opacity-50"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            {busy ? (
              <span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-[#1E2E26] bg-[#090D0B]/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center gap-2 font-mono text-[9px] text-[#666666]">
          <ShieldCheck className="w-3 h-3 text-[#7C3AED]" />
          <span>Sesión protegida por Firebase Auth</span>
          <span className="text-[#1E2E26]">•</span>
          <span>Datos con caché offline en tu dispositivo</span>
        </div>
      </div>
    </header>
  );
};
