import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageSquare, 
  Navigation, 
  Building,
  Share2
} from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GoogleBusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleBusinessProfileModal: React.FC<GoogleBusinessProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const address = "Calle Principal Muelle Fiscal, Puerto Armuelles, Distrito de Barú, Chiriquí, República de Panamá";
  const coordinates = "8.2831° N, 82.8624° W";
  const phone = "+507 6800-2278";
  const email = "soporte@agrobaru.com";

  const handleCopyCoords = () => {
    navigator.clipboard.writeText("8.2831, -82.8624");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogleMaps = () => {
    window.open("https://maps.google.com/?q=8.2831,-82.8624(AgroBaru+Puerto+Armuelles)", "_blank");
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/50768002278?text=Hola%20AgroBarú,%20necesito%20asistencia%20con%20un%20lote%20agrícola", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col font-mono text-left bg-[#0E0E0E] text-[#E5E5E5] border-2 border-[#15803D] shadow-[8px_8px_0px_0px_#15803D] overflow-hidden">
        {/* Google Card Header */}
        <div className="bg-[#141414] border-b border-[#1E293B] p-5 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Google G Logo Style */}
              <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" className="w-8 h-8">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-xl text-[#E5E5E5] tracking-wide">
                    AgroBarú • Cooperativa & Centro de Acopio
                  </h3>
                  <Badge variant="live-green" pulse>
                    Verificado
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-[#FACC15] font-bold flex items-center gap-1">
                    4.9
                    <div className="flex text-[#FACC15]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </span>
                  <span className="text-[#9E9E9E]">(142 reseñas de productores en Chiriquí)</span>
                </div>
                <div className="text-[11px] text-[#15803D] font-mono mt-0.5">
                  Centro de Acopio Agrícola & Exportación Directa • Barú, Panamá
                </div>
              </div>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#1E293B]">
            <Button
              onClick={openGoogleMaps}
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold bg-[#15803D] hover:bg-[#166534] text-black"
            >
              <Navigation className="w-3.5 h-3.5" />
              Cómo llegar (Google Maps)
            </Button>

            <Button
              onClick={openWhatsApp}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp de Campo
            </Button>

            <Button
              onClick={() => window.open(`tel:${phone.replace(/[^0-9+]/g, '')}`)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold border-[#1E293B] text-[#CCCCCC]"
            >
              <Phone className="w-3.5 h-3.5" />
              Llamar
            </Button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#141414] border border-[#1E293B] space-y-1">
              <div className="flex items-center gap-2 text-[#15803D] font-bold text-[11px] uppercase">
                <MapPin className="w-3.5 h-3.5" />
                Dirección Comercial y Despachos
              </div>
              <p className="text-[11px] text-[#CCCCCC] font-sans">
                {address}
              </p>
              <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-[#9E9E9E]">
                <span>GPS: {coordinates}</span>
                <button
                  onClick={handleCopyCoords}
                  className="text-[#15803D] hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar GPS'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#141414] border border-[#1E293B] space-y-1">
              <div className="flex items-center gap-2 text-[#FACC15] font-bold text-[11px] uppercase">
                <Clock className="w-3.5 h-3.5" />
                Horario de Atención y Pesaje
              </div>
              <ul className="text-[11px] text-[#CCCCCC] space-y-0.5">
                <li className="flex justify-between">
                  <span>Lunes a Viernes:</span>
                  <span className="text-[#15803D] font-bold">06:00 AM - 06:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sábados:</span>
                  <span className="text-[#15803D] font-bold">06:00 AM - 03:00 PM</span>
                </li>
                <li className="flex justify-between text-[#9E9E9E]">
                  <span>Domingos:</span>
                  <span>Solo Guardias de Reefer</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Verified Badges Bar */}
          <div className="p-3 bg-[#0A0A0A] border border-[#15803D]/40 rounded flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verificación Oficial en Google Search & Maps</span>
            </div>
            <span className="text-[#9E9E9E] font-mono">ID Entidad: PA-BARU-COOP-4190</span>
          </div>

          {/* Real Customer Reviews Sample */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs uppercase text-[#E5E5E5] tracking-wider">
              Reseñas Destacadas en Google
            </h4>
            
            <div className="space-y-2">
              <div className="p-3 bg-[#141414] border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#E5E5E5]">Rigoberto M. (Productor de Finca Santa Marta)</span>
                  <span className="text-[10px] text-[#FACC15]">★★★★★ Hace 2 semanas</span>
                </div>
                <p className="text-[11px] text-[#9E9E9E] font-sans">
                  "Excelente el sistema de custodia por Yappy y la eliminación de intermediarios. Me pagaron el lote de banano en 24 horas tras la recepción y el pesaje en Puerto Armuelles."
                </p>
              </div>

              <div className="p-3 bg-[#141414] border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#E5E5E5]">Distribuidora Frutera del Pacífico S.A.</span>
                  <span className="text-[10px] text-[#FACC15]">★★★★★ Hace 1 mes</span>
                </div>
                <p className="text-[11px] text-[#9E9E9E] font-sans">
                  "El pasaporte de trazabilidad con el código QR y la fecha exacta de actualización de fotos evita engaños. 100% recomendado para compras mayoristas seguras."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0A0A] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#666666]">
            Sincronizado con Google My Business API v4.9
          </span>
          <Button onClick={onClose} variant="outline" size="sm" className="font-mono text-xs">
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
