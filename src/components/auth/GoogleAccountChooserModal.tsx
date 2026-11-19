import React, { useState, useEffect } from 'react';
import { useAppState, GoogleAccountItem } from '@/context/AppStateContext';
import { UserRole } from '@/types';
import { 
  UserPlus, 
  Trash2, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  X,
  Smartphone,
  Globe,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';

export const GoogleAccountChooserModal: React.FC = () => {
  const { 
    isAccountChooserOpen, 
    setIsAccountChooserOpen, 
    savedGoogleAccounts, 
    selectGoogleAccount, 
    removeGoogleAccount,
    currentUser,
    firebaseUser
  } = useAppState();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('farmer');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check availability of native bridge and web GIS
  const isNativeBridge = typeof window !== 'undefined' && 
    (!!(window as any).AndroidNotificationBridge || !!(window as any).AgroBaruBridge);
  
  const isGisAvailable = typeof window !== 'undefined' && 
    !!(window as any).google?.accounts;

  // Listen for native Android account selection callbacks
  useEffect(() => {
    (window as any).__onNativeGoogleAccountPicked = async (
      email: string,
      name: string,
      idToken: string,
      photoUrl?: string
    ) => {
      if (!email) {
        setIsProcessing(false);
        setStatusMessage('');
        return;
      }
      setIsProcessing(true);
      setStatusMessage(`Verificando cuenta Google: ${email}...`);
      try {
        const cleanName = name?.trim() || email.split('@')[0];
        await selectGoogleAccount({
          name: cleanName,
          email: email.trim().toLowerCase(),
          photoURL: photoUrl || undefined,
          role: 'farmer'
        });
        setIsAccountChooserOpen(false);
      } catch (err: any) {
        setErrorMsg('Error al conectar con la cuenta: ' + (err?.message || 'Intente nuevamente'));
      } finally {
        setIsProcessing(false);
        setStatusMessage('');
      }
    };

    (window as any).__onNativeGoogleAccountCanceled = () => {
      setIsProcessing(false);
      setStatusMessage('');
    };

    return () => {
      delete (window as any).__onNativeGoogleAccountPicked;
      delete (window as any).__onNativeGoogleAccountCanceled;
    };
  }, [selectGoogleAccount, setIsAccountChooserOpen]);

  if (!isAccountChooserOpen) return null;

  const handleSelect = async (account: GoogleAccountItem) => {
    setIsProcessing(true);
    setStatusMessage(`Cambiando a ${account.name}...`);
    try {
      await selectGoogleAccount({
        name: account.name,
        email: account.email,
        photoURL: account.photoURL,
        role: account.role
      });
      setIsAccountChooserOpen(false);
      setIsAddingNew(false);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  /**
   * Triggers the OS / Google Identity Services Account Picker
   * Forces prompt: 'select_account' so user can choose between accounts.
   */
  const handleLaunchNativePicker = () => {
    setErrorMsg('');
    setIsProcessing(true);
    setStatusMessage('Invocando selector de cuentas de Google...');

    const bridge = (window as any).AndroidNotificationBridge || (window as any).AgroBaruBridge;

    // 1. Android Native Credential Manager / AccountManager
    if (bridge && typeof bridge.launchGoogleAccountPicker === 'function') {
      try {
        bridge.launchGoogleAccountPicker('551726000016-web.apps.googleusercontent.com');
        return;
      } catch (e: any) {
        console.warn('Native launchGoogleAccountPicker failed:', e);
      }
    }

    // 2. Web Google Identity Services (GIS)
    const google = (window as any).google;
    if (google?.accounts?.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: '551726000016-web.apps.googleusercontent.com',
          scope: 'email profile openid',
          prompt: 'select_account', // FORCES account selection modal
          callback: async (resp: any) => {
            if (resp?.access_token) {
              try {
                setStatusMessage('Obteniendo perfil de Google...');
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${resp.access_token}` }
                });
                const info = await res.json();
                if (info?.email) {
                  await selectGoogleAccount({
                    name: info.name || info.email.split('@')[0],
                    email: info.email,
                    photoURL: info.picture,
                    role: 'farmer'
                  });
                  setIsAccountChooserOpen(false);
                  return;
                }
              } catch (fetchErr) {
                console.warn('Google userinfo fetch error:', fetchErr);
              }
            }
            setIsProcessing(false);
            setStatusMessage('');
          },
          error_callback: (err: any) => {
            console.warn('GIS error callback:', err);
            setIsProcessing(false);
            setStatusMessage('');
            setErrorMsg('No se completó la selección en Google Identity Services.');
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (gisErr) {
        console.warn('GIS init error:', gisErr);
      }
    }

    // 3. Fallback: Quick Add form
    setIsProcessing(false);
    setStatusMessage('');
    setIsAddingNew(true);
  };

  const handleAddNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo de Google válido (ejemplo@gmail.com).');
      return;
    }
    const cleanName = newName.trim() || newEmail.split('@')[0];

    setIsProcessing(true);
    setStatusMessage(`Conectando cuenta ${newEmail}...`);
    try {
      await selectGoogleAccount({
        name: cleanName,
        email: newEmail.trim().toLowerCase(),
        role: newRole
      });
      setIsAccountChooserOpen(false);
      setIsAddingNew(false);
      setNewEmail('');
      setNewName('');
      setErrorMsg('');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'farmer': return 'Productor Barú';
      case 'buyer': return 'Comprador / Exportador';
      case 'cooperative': return 'MIDA / Cooperativa';
      case 'auditor': return 'Auditor Fitosanitario';
      default: return 'Usuario AgroBarú';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="fixed inset-0"
        onClick={() => !isProcessing && setIsAccountChooserOpen(false)}
      />

      <div className="relative z-50 w-full max-w-md bg-[#121212] border-2 border-[#15803D] shadow-[8px_8px_0px_0px_#15803D] rounded-none overflow-hidden my-4">
        {/* Close Button */}
        <button
          onClick={() => setIsAccountChooserOpen(false)}
          className="absolute right-3 top-3 p-1 text-[#9E9E9E] hover:text-white hover:bg-[#1E293B] transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-[#1E293B] text-center bg-[#0F0F0F]">
          <div className="flex justify-center mb-3">
            <div className="p-2 bg-white rounded-full shadow-md">
              <svg viewBox="0 0 24 24" className="w-7 h-7">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-display font-bold text-[#E5E5E5] tracking-normal leading-snug">
            Elegir una cuenta de Google
          </h2>
          <p className="text-xs text-[#9E9E9E] mt-1 font-sans">
            para continuar en <span className="font-bold text-[#15803D]">AGROBARU</span>
          </p>

          {/* Technology Badge */}
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-[#1E293B] text-[#93C5FD] border border-[#3B82F6]/30">
              {isNativeBridge ? (
                <>
                  <Smartphone className="w-3 h-3 text-[#10B981]" />
                  <span>Credential Manager Android</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3 text-[#3B82F6]" />
                  <span>Google Identity Services (GIS)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Status / Error Notifications */}
        {statusMessage && (
          <div className="p-3 bg-[#1E293B] border-b border-[#3B82F6] text-xs text-[#93C5FD] flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-[#EF4444]/15 border-b border-[#EF4444] text-xs text-[#EF4444] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 max-h-[55vh] overflow-y-auto divide-y divide-[#1E293B]">
          {!isAddingNew ? (
            <>
              {/* PRIMARY ACTION: FORCE NATIVE / GIS GOOGLE ACCOUNT PICKER */}
              <div className="mb-4">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleLaunchNativePicker}
                  className="w-full flex items-center justify-between p-3 bg-[#1A1A1A] hover:bg-[#222222] border-2 border-[#4285F4] hover:border-[#60A5FA] text-left transition-all shadow-[3px_3px_0px_0px_#4285F4] active:translate-x-0.5 active:translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow">
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Selector Oficial de Google</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                      </div>
                      <span className="text-[11px] text-[#9E9E9E] font-sans">
                        Forzar selección entre cuentas de Google
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4285F4] shrink-0" />
                </button>
              </div>

              {/* SAVED & DETECTED ACCOUNTS LIST */}
              <div className="pt-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#9E9E9E] mb-2 px-1">
                  Cuentas guardadas y registradas:
                </div>

                <div className="space-y-1.5 mb-3">
                  {savedGoogleAccounts.map((account) => {
                    const isCurrent = firebaseUser && (
                      firebaseUser.email?.toLowerCase() === account.email.toLowerCase() ||
                      currentUser.email?.toLowerCase() === account.email.toLowerCase()
                    );

                    return (
                      <div
                        key={account.email}
                        className={`group flex items-center justify-between p-2.5 rounded-sm transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-[#15803D]/15 border-2 border-[#15803D]' 
                            : 'hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#3E3E3E]'
                        }`}
                        onClick={() => !isProcessing && handleSelect(account)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-[#1E293B] border border-[#15803D] flex items-center justify-center text-xs font-bold text-[#FACC15] shrink-0 overflow-hidden">
                            <SafeImage
                              src={account.photoURL}
                              alt={account.name}
                              fallbackType="avatar"
                              nameHint={account.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#E5E5E5] truncate block">
                                {account.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] bg-[#15803D] text-white px-1.5 py-0.2 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> En uso
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#9E9E9E] truncate block font-sans">
                              {account.email}
                            </span>
                            <span className="text-[10px] text-[#FACC15] font-mono">
                              {getRoleLabel(account.role)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {savedGoogleAccounts.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeGoogleAccount(account.email);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-[#9E9E9E] hover:text-[#EF4444] hover:bg-[#262626] transition-all"
                              title="Quitar cuenta de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#9E9E9E] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Connect custom or another Google account */}
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="w-full flex items-center gap-3 p-2.5 text-left text-xs font-bold text-[#A78BFA] hover:text-white hover:bg-[#1A1A1A] transition-colors border border-dashed border-[#7C3AED]/40 hover:border-[#7C3AED]"
                >
                  <div className="w-8 h-8 rounded-full border border-dashed border-[#7C3AED] flex items-center justify-center text-[#7C3AED] shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span>Agregar o vincular otra cuenta de Google</span>
                </button>
              </div>
            </>
          ) : (
            /* Add Another Account Form */
            <form onSubmit={handleAddNewAccount} className="space-y-3 py-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-[#E5E5E5] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Conectar cuenta de Google
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-[11px] text-[#9E9E9E] hover:text-white underline"
                >
                  Volver a la lista
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-[#9E9E9E] uppercase font-mono mb-1">
                  Correo Electrónico (Google / Gmail)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  required
                  className="w-full bg-[#181818] border border-[#262626] focus:border-[#7C3AED] text-[#E5E5E5] text-xs px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#9E9E9E] uppercase font-mono mb-1">
                  Nombre Completo / Titular
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Elvira Miranda C."
                  className="w-full bg-[#181818] border border-[#262626] focus:border-[#7C3AED] text-[#E5E5E5] text-xs px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#9E9E9E] uppercase font-mono mb-1">
                  Rol en la Plataforma Agrícola
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-[#7C3AED] text-[#E5E5E5] text-xs px-2.5 py-2 focus:outline-none"
                >
                  <option value="farmer">Productor Agrícola (Barú)</option>
                  <option value="buyer">Comprador / Exportador Internacional</option>
                  <option value="cooperative">Coordinador MIDA / Cooperativa</option>
                  <option value="auditor">Auditor Fitosanitario</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 px-3 py-2 bg-[#1E293B] hover:bg-[#262626] text-[#E5E5E5] text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-3 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold transition-colors shadow-[2px_2px_0px_0px_#FACC15]"
                >
                  {isProcessing ? 'Conectando...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Notice */}
        <div className="p-4 bg-[#0A0A0A] border-t border-[#1E293B] text-[10px] text-[#9E9E9E] font-sans leading-relaxed">
          <div className="flex items-center gap-1.5 text-[#15803D] font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autenticación y Trazabilidad Segura Barú</span>
          </div>
          <p>
            Al iniciar sesión, Google compartirá tu identidad con AgroBarú para autenticar tus operaciones agrícolas y contratos de exportación de forma protegida.
          </p>
        </div>
      </div>
    </div>
  );
};
