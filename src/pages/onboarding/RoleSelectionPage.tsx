import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  LogOut,
  MapPin,
  ShoppingBasket,
  Sprout,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { BARU_COMMUNITIES, type BaruCommunity, type UserRole } from '@/types/agrobaru';

export const RoleSelectionPage: React.FC = () => {
  const { user, profile, online, setRole, logout } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState<BaruCommunity>(profile?.community || 'Puerto Armuelles');
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chooseRole = async (role: UserRole) => {
    if (selected) return;
    setSelected(role);
    setError(null);
    try {
      await setRole(role, community);
      navigate(role === 'productor' ? '/productor' : '/mercado', { replace: true });
    } catch (roleError) {
      setError(translateAuthError(roleError));
      setSelected(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(translateAuthError(logoutError));
    }
  };

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5]">
      <header className="border-b border-[#1E2E26] bg-[#111714]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/sitio" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center">
              <Sprout className="w-5 h-5 text-[#05100A]" />
            </span>
            <span className="font-display font-black text-base tracking-wider">
              AGRO<span className="text-[#10B981]">BARÚ</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-[#9E9E9E] hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#15803D]/50 bg-[#15803D]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#10B981]">
            <Check className="w-3 h-3" />
            Cuenta activa
          </span>
          <h1 className="mt-4 font-display font-black text-3xl sm:text-4xl text-[#ECFDF5] leading-tight">
            ¿Cómo vas a usar AgroBarú?
          </h1>
          <p className="mt-3 text-sm text-[#9E9E9E] leading-relaxed">
            Elige tu modo de trabajo. Podrás cambiarlo cuando quieras desde tu perfil.
          </p>
          <p className="mt-2 font-mono text-[11px] text-[#666666] break-all">
            {user?.email || profile?.email}
          </p>
        </div>

        <div className="mt-7 max-w-md mx-auto">
          <label
            htmlFor="role-community"
            className="block text-[11px] font-mono uppercase tracking-wider text-[#9E9E9E] mb-1.5"
          >
            Comunidad en Barú
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#15803D]" />
            <select
              id="role-community"
              value={community}
              onChange={(event) => setCommunity(event.target.value as BaruCommunity)}
              className="w-full appearance-none bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] text-sm text-[#E5E5E5] rounded-lg pl-10 pr-8 py-2.5 outline-none"
            >
              {BARU_COMMUNITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 max-w-2xl mx-auto flex items-start gap-2 rounded-lg border border-[#EF4444]/60 bg-[#EF4444]/10 px-3 py-2.5 text-[11px] text-[#FCA5A5]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Productor */}
          <button
            type="button"
            onClick={() => chooseRole('productor')}
            disabled={selected !== null}
            className={`group relative text-left rounded-2xl border-2 bg-[#111714] p-6 transition-all disabled:cursor-wait ${
              selected === 'productor'
                ? 'border-[#10B981] shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                : 'border-[#1E2E26] hover:border-[#15803D] hover:shadow-[0_0_0_4px_rgba(21,128,61,0.12)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="w-12 h-12 rounded-xl bg-[#15803D]/15 border border-[#15803D]/50 flex items-center justify-center">
                <Sprout className="w-6 h-6 text-[#10B981]" strokeWidth={1.8} />
              </span>
              {selected === 'productor' ? (
                <span className="w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-[#666666] group-hover:text-[#10B981] transition-colors" />
              )}
            </div>
            <h2 className="mt-4 font-display font-black text-xl text-[#ECFDF5]">
              Soy Productor Agrícola
            </h2>
            <p className="mt-2 text-xs text-[#9E9E9E] leading-relaxed">
              Gestiona tu finca, publica tus cosechas y controla precios e inventario con
              trazabilidad verificable.
            </p>
            <ul className="mt-4 space-y-1.5 font-mono text-[11px] text-[#CCCCCC]">
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#10B981]" /> Publicar y editar cosechas
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#10B981]" /> Precios en USD y stock en tiempo real
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#10B981]" /> Hash SHA-256 por producto
              </li>
            </ul>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#10B981]">
              Entrar como productor
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* Consumidor */}
          <button
            type="button"
            onClick={() => chooseRole('consumidor')}
            disabled={selected !== null}
            className={`group relative text-left rounded-2xl border-2 bg-[#111714] p-6 transition-all disabled:cursor-wait ${
              selected === 'consumidor'
                ? 'border-[#FACC15] shadow-[0_0_0_4px_rgba(250,204,21,0.12)]'
                : 'border-[#1E2E26] hover:border-[#FACC15]/70 hover:shadow-[0_0_0_4px_rgba(250,204,21,0.08)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="w-12 h-12 rounded-xl bg-[#FACC15]/10 border border-[#FACC15]/40 flex items-center justify-center">
                <ShoppingBasket className="w-6 h-6 text-[#FACC15]" strokeWidth={1.8} />
              </span>
              {selected === 'consumidor' ? (
                <span className="w-6 h-6 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-[#666666] group-hover:text-[#FACC15] transition-colors" />
              )}
            </div>
            <h2 className="mt-4 font-display font-black text-xl text-[#ECFDF5]">
              Soy Comprador / Consumidor
            </h2>
            <p className="mt-2 text-xs text-[#9E9E9E] leading-relaxed">
              Explora el catálogo directo del productor, consulta disponibilidad actual o próxima
              cosecha y compara precios transparentes.
            </p>
            <ul className="mt-4 space-y-1.5 font-mono text-[11px] text-[#CCCCCC]">
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#FACC15]" /> Catálogo con precios en USD
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#FACC15]" /> Filtros por disponibilidad y comunidad
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#FACC15]" /> Contacto directo con el productor
              </li>
            </ul>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FACC15]">
              Entrar como comprador
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          {!online && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[#F97316]/50 bg-[#F97316]/10 px-2.5 py-1 font-mono text-[10px] text-[#F97316]">
              <WifiOff className="w-3 h-3" />
              Sin conexión: tu elección se sincronizará al recuperar señal
            </span>
          )}
          <span className="font-mono text-[10px] text-[#666666]">
            Tu rol queda guardado en tu perfil de Firestore.
          </span>
        </div>
      </main>
    </div>
  );
};
