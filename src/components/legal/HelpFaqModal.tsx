import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  ShoppingBag, 
  Clock, 
  Trash2, 
  WifiOff, 
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FAQItem {
  id: string;
  category: 'compra' | 'frescura' | 'eliminacion' | 'offline' | 'comisiones';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    category: 'frescura',
    question: '¿Cómo sé hace cuánto tiempo se publicó o actualizó un producto?',
    answer: 'Cada producto en el Marketplace y en la ficha técnica incluye una insignia de transparencia con la fecha exacta del corte de la fruta y la hora precisa de subida o modificación de las fotografías reales. Esto garantiza que no compres lotes viejos o con fotos desactualizadas.'
  },
  {
    id: '2',
    category: 'eliminacion',
    question: '¿Cómo elimino mi producto si ya se vendió todo el lote?',
    answer: 'Si eres el productor que subió el lote, ingresa al detalle del lote y ve a la pestaña "Gestión de Stock & Lote". Allí encontrarás la sección en rojo "Eliminar Lote del Mercado", la cual retira inmediatamente el producto para evitar llamadas o compras de un inventario que ya no tienes.'
  },
  {
    id: '3',
    category: 'eliminacion',
    question: '¿Qué pasa si se agotó el lote y el productor olvida eliminarlo?',
    answer: 'Para evitar saturar la plataforma y no ilusionar a otros compradores, AgroBarú cuenta con un sistema de auto-limpieza inteligente: cuando un lote llega a 0 kg disponibles (100% vendido) y transcurren 24 horas continuas sin eliminación manual, el sistema lo retira automáticamente del catálogo activo.'
  },
  {
    id: '4',
    category: 'compra',
    question: '¿Cómo funciona la compra protegida mediante Custodia Escrow?',
    answer: 'Cuando pagas mediante Yappy, Nequi o ACH bancario, tu dinero no va directo a la cuenta del productor; queda protegido en una cuenta de custodia neutral. Solo cuando recibes la fruta en tu bodega o puerto y confirmas la calidad, o tras 24-48 horas de inspección conforme, los fondos se liberan al productor.'
  },
  {
    id: '5',
    category: 'compra',
    question: '¿Qué sucede si la fruta llega dañada o no cumple con el calibre?',
    answer: 'Puedes activar un reclamo en menos de 24 horas subiendo fotos de la mercadería recibida desde tu panel. El comité técnico de la cooperativa evalúa la evidencia con la bitácora de empaque y autoriza el reembolso total o parcial del saldo en custodia.'
  },
  {
    id: '6',
    category: 'offline',
    question: '¿Cómo suben información los productores en fincas sin cobertura celular en Barú?',
    answer: 'AgroBarú está desarrollada como una Progressive Web App (PWA) con base de datos local IndexedDB. El agricultor registra el corte, las fotos y el pesaje sin señal; en cuanto su teléfono detecta internet en el pueblo o cooperativa, los datos se sincronizan automáticamente con la nube.'
  },
  {
    id: '7',
    category: 'comisiones',
    question: '¿Cuánto cobra AgroBarú de intermediación?',
    answer: 'Cero comisiones intermediarias especulativas. Mientras los intermediarios tradicionales se quedan con hasta el 40% del valor de la fruta, AgroBarú opera como protocolo cooperativo directo, transfiriendo el 98.5% del valor FOB al agricultor de Barú.'
  }
];

interface HelpFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegalTab?: (tab: any) => void;
}

export const HelpFaqModal: React.FC<HelpFaqModalProps> = ({
  isOpen,
  onClose,
  onOpenLegalTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col font-mono text-left bg-[#0E0E0E] text-[#E5E5E5] border-2 border-[#15803D] shadow-[8px_8px_0px_0px_#15803D]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E293B] bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#15803D] flex items-center justify-center font-bold text-black shadow-[2px_2px_0px_0px_#FACC15]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-[#E5E5E5] uppercase tracking-wider">
                Centro de Ayuda & Preguntas Frecuentes
              </h2>
              <p className="text-[11px] text-[#9E9E9E] font-sans">
                Todo lo que necesitas saber para comprar y vender con total seguridad en Barú
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar duda sobre frescura, pagos, eliminación de lotes..."
              className="pl-9 bg-[#141414] border-[#1E293B] text-xs font-mono"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 font-bold border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#15803D] text-black border-[#15803D]'
                  : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B]'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedCategory('frescura')}
              className={`px-2.5 py-1 font-bold border transition-colors ${
                selectedCategory === 'frescura'
                  ? 'bg-[#FACC15] text-black border-[#FACC15]'
                  : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B]'
              }`}
            >
              Frescura & Fotos
            </button>
            <button
              onClick={() => setSelectedCategory('eliminacion')}
              className={`px-2.5 py-1 font-bold border transition-colors ${
                selectedCategory === 'eliminacion'
                  ? 'bg-[#EF4444] text-white border-[#EF4444]'
                  : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B]'
              }`}
            >
              Eliminar Lotes / 24 h
            </button>
            <button
              onClick={() => setSelectedCategory('compra')}
              className={`px-2.5 py-1 font-bold border transition-colors ${
                selectedCategory === 'compra'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                  : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B]'
              }`}
            >
              Custodia Escrow
            </button>
            <button
              onClick={() => setSelectedCategory('offline')}
              className={`px-2.5 py-1 font-bold border transition-colors ${
                selectedCategory === 'offline'
                  ? 'bg-[#38BDF8] text-black border-[#38BDF8]'
                  : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B]'
              }`}
            >
              Sin Conexión
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9E9E9E]">
              No se encontraron respuestas para tu búsqueda. Puedes contactar a nuestro equipo por WhatsApp.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-[#1E293B] bg-[#141414] transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#E5E5E5] hover:text-[#15803D]"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#15803D] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#9E9E9E] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-[#CCCCCC] font-sans leading-relaxed border-t border-[#1E293B]/60 bg-[#0E0E0E]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-[11px] text-[#9E9E9E]">
            ¿Tienes otra pregunta? Comunícate al WhatsApp <strong>+507 6800-2278</strong>
          </div>
          <Button onClick={onClose} variant="default" size="sm" className="font-mono text-xs font-bold">
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
