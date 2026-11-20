import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  UserRound,
  X,
} from 'lucide-react';
import { RoleNavbar } from '@/components/layout/RoleNavbar';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { copyToClipboard } from '@/lib/utils';
import { optimizeAvatar, optimizeBanner } from '@/lib/imageOptimizer';
import { BARU_COMMUNITIES, type BaruCommunity, type UserRole } from '@/types/agrobaru';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return 'AB';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export const ProfilePage: React.FC = () => {
  const { user, profile, online, setRole, updateProfileData, logout } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoURL || '');
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerUrl || '');
  const [community, setCommunity] = useState<BaruCommunity>(profile?.community || 'Otro');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    setName(profile?.name || '');
    setCommunity(profile?.community || 'Otro');
    setPhotoUrl(profile?.photoURL || '');
    setBannerUrl(profile?.bannerUrl || '');
  }, [profile?.name, profile?.community, profile?.photoURL, profile?.bannerUrl]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const activeRole = profile?.role ?? null;

  const roleLabel = useMemo(() => {
    if (activeRole === 'productor') return 'Productor Agrícola';
    if (activeRole === 'consumidor') return 'Comprador / Consumidor';
    return 'Sin rol asignado';
  }, [activeRole]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError('Escribe un nombre válido (mínimo 2 caracteres).');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfileData({
        name: name.trim(),
        community,
        photoURL: photoUrl || null,
        bannerUrl: bannerUrl || null,
      });
      setEditMode(false);
      setToast('Datos de la cuenta actualizados.');
    } catch (saveError) {
      setError(translateAuthError(saveError));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);
    optimizeAvatar(file)
      .then(async (optimized) => {
        setPhotoUrl((current) => (current === preview ? optimized.dataUrl : current));
        await updateProfileData({ photoURL: optimized.dataUrl });
      })
      .catch(() => setError('No se pudo procesar la foto de perfil.'))
      .finally(() => URL.revokeObjectURL(preview));
    event.target.value = '';
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setBannerUrl(preview);
    optimizeBanner(file)
      .then(async (optimized) => {
        setBannerUrl((current) => (current === preview ? optimized.dataUrl : current));
        await updateProfileData({ bannerUrl: optimized.dataUrl });
      })
      .catch(() => setError('No se pudo procesar el banner. Usa una imagen más liviana.'))
      .finally(() => URL.revokeObjectURL(preview));
    event.target.value = '';
  };

  const handleConfirmRole = async () => {
    if (!pendingRole) return;
    setRoleBusy(true);
    setError(null);
    try {
      await setRole(pendingRole, community);
      navigate(pendingRole === 'productor' ? '/productor' : '/mercado', { replace: true });
    } catch (roleError) {
      setError(translateAuthError(roleError));
      setRoleBusy(false);
      setPendingRole(null);
    }
  };

  const handleLogout = async () => {
    setLogoutBusy(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(translateAuthError(logoutError));
      setLogoutBusy(false);
    }
  };

  const handleCopyUid = async () => {
    if (!profile?.uid) return;
    const ok = await copyToClipboard(profile.uid);
    setCopiedUid(ok);
    if (ok) setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5]">
      <RoleNavbar />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#ECFDF5]">
            Mi Perfil
          </h1>
          <p className="mt-1 text-xs text-[#9E9E9E]">
            Administra tu cuenta, tu comunidad y el modo de trabajo activo en AgroBarú.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[#EF4444]/60 bg-[#EF4444]/10 px-3.5 py-3 text-[11px] text-[#FCA5A5]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tarjeta de identidad compacta con banner largo */}
        <section className="overflow-hidden rounded-2xl border border-[#1E2E26] bg-[#111714]">
          <div className="relative h-28 sm:h-36 bg-[#0A0A0A]">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={`Portada de ${profile?.name || 'AgroBarú'}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,#15803D_0%,transparent_45%),radial-gradient(circle_at_80%_30%,#7C3AED_0%,transparent_40%),linear-gradient(135deg,#0A0A0A,#111714)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111714] via-black/15 to-transparent" />
            <label className="absolute right-2.5 top-2.5 flex cursor-pointer items-center gap-1 border border-white/25 bg-black/55 px-2 py-1 font-mono text-[9px] font-bold text-white hover:border-[#FACC15] hover:text-[#FACC15]">
              <ImageIcon className="w-3 h-3" />
              Cambiar banner
              <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
            </label>
          </div>

          <div className="px-4 sm:px-5 pb-5">
            <div className="-mt-10 sm:-mt-12 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('profile-avatar-input')?.click()}
                className="relative shrink-0 group self-start"
                title="Cambiar foto de perfil"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={profile?.name || 'Foto de perfil'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-[#111714] ring-2 ring-[#15803D]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#15803D] border-4 border-[#111714] ring-2 ring-[#15803D] flex items-center justify-center">
                    <span className="font-display font-black text-2xl text-[#05100A]">
                      {initials(profile?.name || 'Agro Barú')}
                    </span>
                  </div>
                )}
                <span className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Camera className="w-4 h-4" />
                </span>
              </button>
              <input
                id="profile-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

            <div className="flex-1 min-w-0">
              {!editMode ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-black text-xl text-[#ECFDF5] break-words">
                      {profile?.name || 'Usuario AgroBarú'}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded border border-[#15803D]/50 bg-[#15803D]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#10B981]">
                      <CheckCircle2 className="w-3 h-3" />
                      {user?.emailVerified ? 'Correo verificado' : 'Cuenta activa'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        online
                          ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]'
                          : 'border-[#F97316]/50 bg-[#F97316]/10 text-[#F97316]'
                      }`}
                    >
                      {online ? 'En línea' : 'Offline'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-[#9E9E9E]">
                    <p className="flex items-center gap-1.5 break-all">
                      <Mail className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      {profile?.email || user?.email || '—'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      {profile?.community || 'Barú, Chiriquí'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                      Rol activo: <span className="text-[#E5E5E5] font-bold">{roleLabel}</span>
                    </p>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="block font-mono text-[10px] uppercase tracking-wider text-[#9E9E9E] mb-1"
                    >
                      Nombre completo / Finca
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] text-sm text-[#E5E5E5] rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-community"
                      className="block font-mono text-[10px] uppercase tracking-wider text-[#9E9E9E] mb-1"
                    >
                      Comunidad en Barú
                    </label>
                    <select
                      id="profile-community"
                      value={community}
                      onChange={(event) => setCommunity(event.target.value as BaruCommunity)}
                      className="w-full appearance-none bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] text-sm text-[#E5E5E5] rounded-lg px-3 py-2 outline-none"
                    >
                      {BARU_COMMUNITIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="flex items-center gap-1.5 rounded-lg bg-[#15803D] hover:bg-[#16A34A] disabled:opacity-60 text-black text-[11px] font-bold px-3 py-2"
                    >
                      {savingProfile ? (
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setName(profile?.name || '');
                        setCommunity(profile?.community || 'Otro');
                        setError(null);
                      }}
                      className="rounded-lg border border-[#1E293B] text-[#CCCCCC] hover:bg-[#141414] text-[11px] font-bold px-3 py-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!editMode && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="self-start inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] text-[#CCCCCC] hover:text-[#E5E5E5] hover:bg-[#141414] text-[11px] font-bold px-3 py-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#1E2E26] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#666666]">
                Identificador de cuenta (UID)
              </p>
              <p className="font-mono text-[10px] text-[#9E9E9E] break-all">{profile?.uid}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyUid}
              className="self-start inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] text-[10px] font-bold px-2.5 py-1.5 shrink-0"
            >
              <Copy className="w-3 h-3" />
              {copiedUid ? 'Copiado' : 'Copiar UID'}
            </button>
          </div>
          </div>
        </section>

        {/* Cambio de rol */}
        <section className="rounded-2xl border border-[#1E2E26] bg-[#111714] p-5">
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4 text-[#10B981]" />
            <h2 className="font-display font-black text-lg text-[#ECFDF5]">
              Cambiar modo de trabajo
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#9E9E9E]">
            Tu rol define la interfaz y los permisos. Puedes alternar cuando lo necesites; tus
            cosechas publicadas se conservan.
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => activeRole !== 'productor' && setPendingRole('productor')}
              aria-pressed={activeRole === 'productor'}
              className={`text-left rounded-xl border-2 p-4 transition-colors ${
                activeRole === 'productor'
                  ? 'border-[#10B981] bg-[#10B981]/10'
                  : 'border-[#1E2E26] bg-[#0A0A0A] hover:border-[#15803D]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-lg bg-[#15803D]/15 border border-[#15803D]/50 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-[#10B981]" />
                </span>
                {activeRole === 'productor' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[#10B981] text-black px-2 py-0.5 font-mono text-[9px] font-bold">
                    <Check className="w-3 h-3" /> ACTIVO
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-[#666666]" />
                )}
              </div>
              <p className="mt-2 font-bold text-sm text-[#ECFDF5]">Modo Productor</p>
              <p className="text-[10px] text-[#9E9E9E] mt-0.5">
                Publicar, editar y retirar cosechas.
              </p>
            </button>

            <button
              type="button"
              onClick={() => activeRole !== 'consumidor' && setPendingRole('consumidor')}
              aria-pressed={activeRole === 'consumidor'}
              className={`text-left rounded-xl border-2 p-4 transition-colors ${
                activeRole === 'consumidor'
                  ? 'border-[#FACC15] bg-[#FACC15]/10'
                  : 'border-[#1E2E26] bg-[#0A0A0A] hover:border-[#FACC15]/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-lg bg-[#FACC15]/10 border border-[#FACC15]/40 flex items-center justify-center">
                  <ShoppingBasket className="w-5 h-5 text-[#FACC15]" />
                </span>
                {activeRole === 'consumidor' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[#FACC15] text-black px-2 py-0.5 font-mono text-[9px] font-bold">
                    <Check className="w-3 h-3" /> ACTIVO
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-[#666666]" />
                )}
              </div>
              <p className="mt-2 font-bold text-sm text-[#ECFDF5]">Modo Consumidor</p>
              <p className="text-[10px] text-[#9E9E9E] mt-0.5">
                Explorar el catálogo y contactar productores.
              </p>
            </button>
          </div>

          {pendingRole && (
            <div className="mt-4 rounded-xl border border-[#FACC15]/50 bg-[#FACC15]/10 p-3.5">
              <p className="text-xs text-[#FACC15] font-bold">
                ¿Confirmas el cambio a {pendingRole === 'productor' ? 'Modo Productor' : 'Modo Consumidor'}?
              </p>
              <p className="mt-1 text-[10px] text-[#9E9E9E]">
                Se actualizará tu perfil y serás redirigido a tu nuevo entorno.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmRole}
                  disabled={roleBusy}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] disabled:opacity-60 text-black text-[11px] font-bold px-3 py-2"
                >
                  {roleBusy ? (
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Confirmar cambio
                </button>
                <button
                  type="button"
                  onClick={() => setPendingRole(null)}
                  disabled={roleBusy}
                  className="rounded-lg border border-[#1E293B] text-[#CCCCCC] text-[11px] font-bold px-3 py-2 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Seguridad */}
        <section className="rounded-2xl border border-[#1E2E26] bg-[#111714] p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="font-display font-black text-lg text-[#ECFDF5]">Seguridad de la cuenta</h2>
          </div>
          <ul className="mt-3 space-y-1.5 font-mono text-[10px] text-[#9E9E9E]">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              Sesión persistente protegida por Firebase Auth
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              Perfil y cosechas con caché offline en este dispositivo
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              Solo tú puedes editar o eliminar tus productos
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#EF4444]/60 text-[#EF4444] hover:bg-[#EF4444] hover:text-black text-[11px] font-bold px-3 py-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </section>
      </main>

      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm rounded-2xl border border-[#EF4444]/50 bg-[#111714] p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="logout-title" className="font-display font-black text-lg text-[#ECFDF5]">
                ¿Cerrar sesión?
              </h2>
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="text-[#9E9E9E] hover:text-[#E5E5E5]"
                aria-label="Cancelar cierre de sesión"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#9E9E9E]">
              Tus cosechas y datos quedan guardados. Deberás iniciar sesión nuevamente para
              gestionarlos.
            </p>
            <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                disabled={logoutBusy}
                className="rounded-lg border border-[#1E293B] text-[#CCCCCC] text-[11px] font-bold px-3 py-2 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutBusy}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-black text-[11px] font-bold px-3 py-2 disabled:opacity-60"
              >
                {logoutBusy ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-lg border border-[#10B981]/60 bg-[#0E1A14] px-3.5 py-2.5 text-[11px] text-[#6EE7B7] shadow-xl">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
};
