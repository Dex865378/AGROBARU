import React from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  Languages,
  Monitor,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import type { UserPreferences } from '@/services/preferencesService';
import { Badge } from '@/components/ui/badge';

interface UserSettingsPanelProps {
  userId?: string;
  className?: string;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-[#1E293B] bg-[#0A0A0A] px-3 py-2.5">
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-[#E5E5E5] leading-snug">{label}</p>
      <p className="mt-0.5 text-[9px] text-[#9E9E9E] leading-relaxed font-sans">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors ${
        checked
          ? 'border-[#10B981]/70 bg-[#15803D]'
          : 'border-[#1E293B] bg-[#141414]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 text-[#10B981]">{icon}</span>
    <div>
      <h3 className="font-display text-sm font-black text-[#ECFDF5] uppercase tracking-wide">
        {title}
      </h3>
      {subtitle && <p className="text-[9px] text-[#9E9E9E] font-sans">{subtitle}</p>}
    </div>
  </div>
);

export const UserSettingsPanel: React.FC<UserSettingsPanelProps> = ({ userId, className = '' }) => {
  const { language } = useLanguage();
  const { theme, setTheme, themes } = useTheme();
  const { preferences, updatePreference, resetPreferences, loading } = useUserPreferences(userId);
  const isEn = language === 'en';

  const text = (es: string, en: string) => (isEn ? en : es);
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    updatePreference(key, value);

  if (loading) {
    return (
      <div className={`space-y-3 animate-pulse ${className}`} aria-label={text('Cargando configuración', 'Loading settings')}>
        <div className="h-20 rounded-xl border border-[#1E2E26] bg-[#111714]" />
        <div className="h-28 rounded-xl border border-[#1E2E26] bg-[#111714]" />
        <div className="h-40 rounded-xl border border-[#1E2E26] bg-[#111714]" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#15803D]/40 bg-[#0E1A13] px-3.5 py-3">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#10B981]">
            <Sparkles className="w-3.5 h-3.5" />
            {text('Preferencias de la cuenta', 'Account preferences')}
          </div>
          <p className="mt-1 text-[10px] text-[#CCCCCC] font-sans">
            {text(
              'Se guardan automáticamente en este dispositivo y en tu cuenta.',
              'Saved automatically on this device and in your account.',
            )}
          </p>
        </div>
        <Badge variant="live-green" className="text-[8px]">
          <Check className="w-2.5 h-2.5" /> {text('Guardado', 'Saved')}
        </Badge>
      </div>

      <section className="space-y-2.5 rounded-xl border border-[#1E293B] bg-[#0A0A0A] p-3">
        <SectionTitle
          icon={<Palette className="w-4 h-4" />}
          title={text('Tema de la aplicación', 'App theme')}
          subtitle={text(
            'Mantiene la identidad oscura de AgroBarú con distintos ambientes.',
            'Keeps AgroBarú’s dark identity with different ambiences.',
          )}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {themes.map((item) => {
            const selected = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTheme(item.id);
                  update('theme', item.id);
                }}
                aria-pressed={selected}
                className={`relative overflow-hidden rounded-lg border p-2 text-left transition-colors ${
                  selected
                    ? 'border-[#10B981] bg-[#102018]'
                    : 'border-[#1E293B] bg-[#111714] hover:border-[#15803D]'
                }`}
              >
                <div className="flex h-9 overflow-hidden rounded border border-white/10">
                  {item.swatches.map((swatch) => (
                    <span key={swatch} className="flex-1" style={{ backgroundColor: swatch }} />
                  ))}
                </div>
                <p className="mt-1.5 truncate text-[10px] font-bold text-[#E5E5E5]">
                  {isEn ? item.labelEn : item.label}
                </p>
                <p className="truncate text-[8px] text-[#9E9E9E] font-sans">
                  {isEn ? item.descriptionEn : item.description}
                </p>
                {selected && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] text-black">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2.5 rounded-xl border border-[#1E293B] bg-[#0A0A0A] p-3">
        <SectionTitle
          icon={<Languages className="w-4 h-4" />}
          title={text('Idioma de la interfaz', 'Interface language')}
          subtitle={text('Cambia toda la interfaz entre español e inglés.', 'Switch the whole interface between Spanish and English.')}
        />
        <div className="grid grid-cols-2 gap-2">
          {(['es', 'en'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => update('language', lang)}
              aria-pressed={language === lang}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                language === lang
                  ? 'border-[#10B981] bg-[#10B981]/10 text-[#ECFDF5]'
                  : 'border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5]'
              }`}
            >
              <span>{lang === 'es' ? 'Español (ES)' : 'English (EN)'}</span>
              {language === lang && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5 rounded-xl border border-[#1E293B] bg-[#0A0A0A] p-3">
        <SectionTitle
          icon={<Bell className="w-4 h-4" />}
          title={text('Notificaciones y avisos', 'Notifications & alerts')}
          subtitle={text('Elige qué avisos quieres recibir.', 'Choose which alerts you want to receive.')}
        />
        <div className="space-y-1.5">
          <ToggleRow
            label={text('Mensajes de chat', 'Chat messages')}
            description={text('Nuevos mensajes de compradores o productores.', 'New messages from buyers or producers.')}
            checked={preferences.messages}
            onChange={(value) => update('messages', value)}
          />
          <ToggleRow
            label={text('Nuevos pedidos y pagos', 'New orders & payments')}
            description={text('Órdenes, Escrow y cambios de estado.', 'Orders, Escrow and status changes.')}
            checked={preferences.orders}
            onChange={(value) => update('orders', value)}
          />
          <ToggleRow
            label={text('Comunidad y alertas fitosanitarias', 'Community & pest alerts')}
            description={text('Avisos de la red y alertas de cultivos.', 'Network updates and crop alerts.')}
            checked={preferences.community}
            onChange={(value) => update('community', value)}
          />
          <ToggleRow
            label={text('Resumen por correo', 'Email summary')}
            description={text('Recibe un resumen periódico de tu actividad.', 'Receive a periodic summary of your activity.')}
            checked={preferences.emailDigest}
            onChange={(value) => update('emailDigest', value)}
          />
          <ToggleRow
            label={text('Sonidos de la aplicación', 'App sounds')}
            description={text('Sonido al recibir mensajes o alertas.', 'Sound when receiving messages or alerts.')}
            checked={preferences.sounds}
            onChange={(value) => update('sounds', value)}
          />
        </div>
      </section>

      <section className="space-y-2.5 rounded-xl border border-[#1E293B] bg-[#0A0A0A] p-3">
        <SectionTitle
          icon={<Eye className="w-4 h-4" />}
          title={text('Privacidad y presencia', 'Privacy & presence')}
          subtitle={text('Controla qué información ven las demás cuentas.', 'Control what other accounts can see.')}
        />
        <div className="space-y-1.5">
          <ToggleRow
            label={text('Mostrar estado en línea', 'Show online status')}
            description={text('Indica si estás conectado en el chat.', 'Show whether you are online in chat.')}
            checked={preferences.showOnlineStatus}
            onChange={(value) => update('showOnlineStatus', value)}
          />
          <ToggleRow
            label={text('Confirmaciones de lectura', 'Read receipts')}
            description={text('Muestra cuándo leíste un mensaje.', 'Show when you have read a message.')}
            checked={preferences.readReceipts}
            onChange={(value) => update('readReceipts', value)}
          />
          <ToggleRow
            label={text('Mostrar ubicación aproximada', 'Show approximate location')}
            description={text('Muestra tu comunidad, nunca la finca exacta.', 'Show your community, never the exact farm.')}
            checked={preferences.showLocation}
            onChange={(value) => update('showLocation', value)}
          />
        </div>
      </section>

      <section className="space-y-2.5 rounded-xl border border-[#1E293B] bg-[#0A0A0A] p-3">
        <SectionTitle
          icon={<Monitor className="w-4 h-4" />}
          title={text('Experiencia', 'Experience')}
          subtitle={text('Ajusta la interfaz a tu forma de trabajo.', 'Adjust the interface to the way you work.')}
        />
        <div className="space-y-1.5">
          <ToggleRow
            label={text('Modo compacto', 'Compact mode')}
            description={text('Reduce espacios para ver más información.', 'Reduce spacing to fit more information.')}
            checked={preferences.compactMode}
            onChange={(value) => update('compactMode', value)}
          />
          <ToggleRow
            label={text('Reducir movimiento', 'Reduce motion')}
            description={text('Desactiva animaciones y transiciones.', 'Disable animations and transitions.')}
            checked={preferences.reducedMotion}
            onChange={(value) => update('reducedMotion', value)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E293B] pt-3">
        <span className="flex items-center gap-1.5 font-mono text-[9px] text-[#666666]">
          <ShieldCheck className="w-3 h-3 text-[#7C3AED]" />
          {text('Preferencias privadas de tu cuenta', 'Private account preferences')}
        </span>
        <button
          type="button"
          onClick={resetPreferences}
          className="flex items-center gap-1.5 rounded-lg border border-[#1E293B] px-2.5 py-1.5 text-[9px] font-bold text-[#9E9E9E] hover:border-[#F97316]/50 hover:text-[#F97316]"
        >
          <RotateCcw className="w-3 h-3" /> {text('Restablecer', 'Reset')}
        </button>
      </div>
    </div>
  );
};
