import React from 'react';
import { ShieldCheck, MapPin, Terminal, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t-2 border-[#15803D] bg-[#0E0E0E] text-[#9E9E9E] mt-auto font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#15803D] flex items-center justify-center font-display font-bold text-black text-sm">
                AB
              </div>
              <span className="font-display font-black text-lg text-[#E5E5E5] tracking-wider">
                AGRO<span className="text-[#15803D]">BARÚ</span>
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#9E9E9E] font-sans">
              Protocolo descentralizado de trazabilidad criptográfica y comercio justo para los productores del Distrito de Barú, Chiriquí, República de Panamá.
            </p>
            <div className="text-[10px] text-[#15803D] font-bold">
              ESTÁNDAR MIDA // CÓDIGO ABIERTO
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs text-[#E5E5E5] uppercase tracking-wider border-b border-[#15803D]/40 pb-1">
              Corregimientos Cobertura
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Puerto Armuelles (Cabecera)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Limones (Península Burica)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Progreso (Frontera Paso Canoas)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Baco (Cuenca Río Chiriquí Viejo)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Rodolfo Aguilar Delgado
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs text-[#E5E5E5] uppercase tracking-wider border-b border-[#15803D]/40 pb-1">
              Seguridad & Protocolos
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" strokeWidth={1.5} />
                <span>SHA-256 Hash Chain Inmutable</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={1.5} />
                <span>Escrow Multifirma Yappy / Nequi</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                <span>Árboles Merkle en Códigos QR</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F97316]" strokeWidth={1.5} />
                <span>Sensor Térmico Cadena de Frío</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs text-[#E5E5E5] uppercase tracking-wider border-b border-[#15803D]/40 pb-1">
              MIDA / Cooperativas
            </h4>
            <p className="text-[11px] leading-relaxed font-sans text-[#9E9E9E]">
              Desarrollado en alianza con las asociaciones de productores de plátano, banano, cacao y palma aceitera de Chiriquí.
            </p>
            <div className="p-2.5 bg-[#0A0A0A] border border-[#15803D]/60 text-[10px] text-[#15803D] font-mono">
              GPS LAT 8.2831° N • LNG 82.8624° W
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#666666]">
          <div>
            © {new Date().getFullYear()} AGROBARÚ • PROTOCOLO AGRO-CRIPTO DE PANAMÁ • TODOS LOS DERECHOS RESERVADOS
          </div>
          <div className="flex gap-4">
            <span className="hover:text-[#E5E5E5] cursor-pointer">Términos de Escrow</span>
            <span className="hover:text-[#E5E5E5] cursor-pointer">Privacidad de Fincas</span>
            <span className="hover:text-[#E5E5E5] cursor-pointer">Verificación SHA-256</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
