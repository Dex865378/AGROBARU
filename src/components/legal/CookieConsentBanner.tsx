import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookieConsentBannerProps {
  onOpenPolicy: () => void;
  onVisibilityChange?: (visible: boolean) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPolicy,
  onVisibilityChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('agrobaru_cookie_consent');
      if (!consent) {
        // Small delay so it animates in smoothly
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore in incognito or restricted storage
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('agrobaru_cookie_consent', JSON.stringify({
        status: 'accepted_all',
        date: new Date().toISOString(),
        version: '2026.1'
      }));
    } catch (e) {}
    setIsVisible(false);
  };

  const handleAcceptNecessaryOnly = () => {
    try {
      localStorage.setItem('agrobaru_cookie_consent', JSON.stringify({
        status: 'necessary_only',
        date: new Date().toISOString(),
        version: '2026.1'
      }));
    } catch (e) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:left-6 md:max-w-lg z-[45] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#111714]/95 backdrop-blur-md border border-[#1E2E26] rounded-xl p-4 sm:p-5 shadow-2xl font-mono text-xs text-[#E5E5E5]">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1E2E26]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FACC15] text-[#05100A] flex items-center justify-center font-bold">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-[#ECFDF5]">
                Consentimiento de Cookies & Datos (Ley 81)
              </span>
              <div className="text-[10px] text-[#15803D] font-bold">
                AGROBARÚ • PROTOCOLO SEGURO TLS 256-BIT
              </div>
            </div>
          </div>

          <button
            onClick={handleAcceptNecessaryOnly}
            className="text-[#9E9E9E] hover:text-[#E5E5E5] transition-colors p-1"
            title="Cerrar (solo necesarias)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="py-3 text-[11px] text-[#CCCCCC] font-sans leading-relaxed">
          Utilizamos cookies esenciales y almacenamiento local para autenticar tu cuenta, asegurar la custodia de fondos (Escrow) y permitir el funcionamiento sin conexión en fincas de Barú (PWA Offline) conforme a la legislación de Panamá.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E293B]">
          <button
            onClick={onOpenPolicy}
            className="text-[11px] text-[#9E9E9E] hover:text-[#FACC15] underline flex items-center gap-1 font-mono transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configurar / Ver Políticas
          </button>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              onClick={handleAcceptNecessaryOnly}
              variant="outline"
              size="sm"
              className="text-[11px] font-mono border-[#1E293B] text-[#CCCCCC] hover:text-white"
            >
              Solo Necesarias
            </Button>
            <Button
              onClick={handleAcceptAll}
              variant="default"
              size="sm"
              className="text-[11px] font-mono font-bold bg-[#15803D] hover:bg-[#166534] text-black"
            >
              Aceptar Todas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
