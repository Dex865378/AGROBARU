import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Leaf,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sprout,
  UserRound,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { BARU_COMMUNITIES, type BaruCommunity } from '@/types/agrobaru';

type Mode = 'login' | 'register' | 'forgot';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClass =
  'w-full bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]/40 text-[#E5E5E5] placeholder-[#666666] text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none transition-colors';
const labelClass = 'block text-[11px] font-mono uppercase tracking-wider text-[#9E9E9E] mb-1.5';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({
  initialMode = 'login',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const mode: Mode = location.pathname === '/registro' ? 'register' : initialMode;
  const [forgotMode, setForgotMode] = useState(false);
  const effectiveMode: Mode = forgotMode ? 'forgot' : mode;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [community, setCommunity] = useState<BaruCommunity>('Puerto Armuelles');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const title = useMemo(() => {
    if (effectiveMode === 'register') return 'Crea tu cuenta empresarial';
    if (effectiveMode === 'forgot') return 'Recupera tu contraseña';
    return 'Acceso empresarial';
  }, [effectiveMode]);

  const subtitle = useMemo(() => {
    if (effectiveMode === 'register') return 'Publica tu cosecha o compra directo al productor en Barú.';
    if (effectiveMode === 'forgot') return 'Te enviaremos un enlace seguro para restablecer tu acceso.';
    return 'Gestiona tu finca o compra directo, con trazabilidad verificable.';
  }, [effectiveMode]);

  const goToRoleSelection = () => navigate('/seleccionar-rol', { replace: true });

  const validate = (): string | null => {
    if (!EMAIL_PATTERN.test(email.trim())) return 'Escribe un correo electrónico válido.';
    if (effectiveMode === 'forgot') return null;
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (effectiveMode === 'register') {
      if (name.trim().length < 2) return 'Escribe tu nombre completo o el nombre de tu finca.';
      if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (effectiveMode === 'forgot') {
        await resetPassword(email);
        setSuccess('Enlace enviado. Revisa la bandeja de entrada y la carpeta de spam de tu correo.');
        return;
      }
      if (effectiveMode === 'register') {
        await register({ name, email, password, community });
      } else {
        await login(email, password);
      }
      goToRoleSelection();
    } catch (authError) {
      setError(translateAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSuccess(null);
    setGoogleBusy(true);
    try {
      await loginWithGoogle();
      goToRoleSelection();
    } catch (authError) {
      setError(translateAuthError(authError));
    } finally {
      setGoogleBusy(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setForgotMode(false);
    setError(null);
    setSuccess(null);
    navigate(next === 'register' ? '/registro' : '/login');
  };

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5] grid lg:grid-cols-2">
      {/* Panel de marca */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0A0A0A] border-r border-[#1E2E26] p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'linear-gradient(#1E2E26 1px, transparent 1px), linear-gradient(90deg, #1E2E26 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="relative">
          <Link to="/sitio" className="inline-flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center">
              <Sprout className="w-6 h-6 text-[#05100A]" strokeWidth={2} />
            </span>
            <span>
              <span className="block font-display font-black text-xl tracking-wider text-[#ECFDF5]">
                AGRO<span className="text-[#10B981]">BARÚ</span>
              </span>
              <span className="block font-mono text-[9px] text-[#666666] tracking-[0.22em]">
                BARÚ · CHIRIQUÍ · PANAMÁ
              </span>
            </span>
          </Link>

          <h1 className="mt-16 font-display font-black text-4xl xl:text-5xl leading-tight text-[#ECFDF5]">
            Del productor
            <br />
            <span className="text-[#10B981]">a tu empresa</span>,
            <br />
            sin intermediarios.
          </h1>
          <p className="mt-5 max-w-md text-sm text-[#9E9E9E] leading-relaxed">
            Identidad verificada, precios transparentes en USD y trazabilidad SHA-256 para cada
            cosecha del Distrito de Barú.
          </p>

          <ul className="mt-10 space-y-4 font-mono text-xs">
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
              <span>
                <strong className="text-[#E5E5E5]">Trazabilidad criptográfica</strong>
                <span className="block text-[#666666]">Hash SHA-256 y sello MIDA por lote.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Leaf className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
              <span>
                <strong className="text-[#E5E5E5]">Vistas aisladas por rol</strong>
                <span className="block text-[#666666]">El productor gestiona; el comprador explora.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <WifiOff className="w-4 h-4 text-[#FACC15] mt-0.5 shrink-0" />
              <span>
                <strong className="text-[#E5E5E5]">Diseñado para el campo</strong>
                <span className="block text-[#666666]">Sigue operando sin señal y sincroniza al volver.</span>
              </span>
            </li>
          </ul>
        </div>

        <p className="relative font-mono text-[10px] text-[#666666]">
          © {new Date().getFullYear()} AgroBarú · Protocolo Agro-Cripto de Panamá
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center">
              <Sprout className="w-5 h-5 text-[#05100A]" />
            </span>
            <span className="font-display font-black text-lg tracking-wider">
              AGRO<span className="text-[#10B981]">BARÚ</span>
            </span>
          </div>

          <div className="bg-[#111714] border border-[#1E2E26] rounded-2xl p-5 sm:p-7 shadow-2xl">
            <div className="mb-6">
              <h2 className="font-display font-black text-2xl text-[#ECFDF5] leading-tight">{title}</h2>
              <p className="mt-1.5 text-xs text-[#9E9E9E] leading-relaxed">{subtitle}</p>
            </div>

            {effectiveMode !== 'forgot' && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A0A0A] border border-[#1E293B] rounded-lg mb-5">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`py-2 rounded-md text-xs font-bold transition-colors ${
                    effectiveMode === 'login'
                      ? 'bg-[#15803D] text-black'
                      : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`py-2 rounded-md text-xs font-bold transition-colors ${
                    effectiveMode === 'register'
                      ? 'bg-[#15803D] text-black'
                      : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-[#EF4444]/60 bg-[#EF4444]/10 px-3 py-2.5 text-[11px] text-[#FCA5A5]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-4 flex items-start gap-2 rounded-lg border border-[#10B981]/60 bg-[#10B981]/10 px-3 py-2.5 text-[11px] text-[#6EE7B7]"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {effectiveMode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className={labelClass}>
                    Nombre completo / Finca
                  </label>
                  <div className="relative">
                    <UserRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ej. Don Dionisio Castillo"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className={labelClass}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="productor@agrobaru.pa"
                    className={inputClass}
                  />
                </div>
              </div>

              {effectiveMode === 'register' && (
                <div>
                  <label htmlFor="auth-community" className={labelClass}>
                    Comunidad en Barú
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <select
                      id="auth-community"
                      value={community}
                      onChange={(event) => setCommunity(event.target.value as BaruCommunity)}
                      className={`${inputClass} appearance-none pr-8`}
                    >
                      {BARU_COMMUNITIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {effectiveMode !== 'forgot' && (
                <div>
                  <label htmlFor="auth-password" className={labelClass}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={effectiveMode === 'register' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={effectiveMode === 'register' ? 'Nueva contraseña' : 'Tu contraseña'}
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#E5E5E5]"
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {effectiveMode === 'register' && (
                    <p className="mt-1 font-mono text-[10px] text-[#666666]">Mínimo 6 caracteres.</p>
                  )}
                </div>
              )}

              {effectiveMode === 'register' && (
                <div>
                  <label htmlFor="auth-confirm" className={labelClass}>
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repite tu contraseña"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {effectiveMode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[11px] text-[#38BDF8] hover:text-[#7DD3FC] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {effectiveMode === 'forgot' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[11px] text-[#9E9E9E] hover:text-[#E5E5E5]"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || googleBusy}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#15803D] hover:bg-[#16A34A] disabled:opacity-60 text-black font-bold text-sm py-2.5 transition-colors"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {effectiveMode === 'register'
                        ? 'Crear cuenta'
                        : effectiveMode === 'forgot'
                        ? 'Enviar enlace de recuperación'
                        : 'Entrar a AgroBarú'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {effectiveMode !== 'forgot' && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[#1E2E26]" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#666666]">
                    o continuar con
                  </span>
                  <span className="h-px flex-1 bg-[#1E2E26]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={submitting || googleBusy}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#1E293B] bg-[#0A0A0A] hover:bg-[#141414] disabled:opacity-60 text-[#E5E5E5] text-sm font-semibold py-2.5 transition-colors"
                >
                  {googleBusy ? (
                    <span className="w-4 h-4 border-2 border-[#E5E5E5] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] font-black text-[13px] flex items-center justify-center">
                      G
                    </span>
                  )}
                  <span>Continuar con Google</span>
                </button>
              </>
            )}

            <p className="mt-5 text-center text-[10px] text-[#666666] leading-relaxed">
              Al continuar aceptas los{' '}
              <Link to="/sitio?legal=terms" className="text-[#9E9E9E] underline hover:text-[#E5E5E5]">
                términos y la política de privacidad
              </Link>{' '}
              de AgroBarú (Ley 81 de Panamá).
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-[11px]">
            <Link to="/sitio" className="text-[#9E9E9E] hover:text-[#E5E5E5]">
              ← Volver al sitio público
            </Link>
            <span className="font-mono text-[9px] text-[#666666] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#10B981]" />
              TLS 1.3 · Firebase Auth
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
