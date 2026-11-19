import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  UserCheck, 
  MapPin, 
  X, 
  MessageSquare, 
  ArrowRight, 
  Sprout, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  ENTERPRISE_DIRECTORY, 
  FARMER_DIRECTORY, 
  EnterpriseProfile, 
  FarmerDirectoryProfile 
} from '@/services/directoryData';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { DirectMessageModal, ChatContact } from '@/components/chat/DirectMessageModal';
import { SafeImage } from '@/components/ui/SafeImage';

interface GlobalSearchBarProps {
  onNavigateToTab?: (tab: string) => void;
  onNavigateToChat?: (contact: ChatContact) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ 
  onNavigateToTab,
  onNavigateToChat 
}) => {
  const { batches } = useAppState();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatContact, setSelectedChatContact] = useState<ChatContact | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = query.trim().toLowerCase();

  // Filter enterprises / brands
  const matchedEnterprises = ENTERPRISE_DIRECTORY.filter(e => 
    e.name.toLowerCase().includes(trimmed) ||
    e.brandName.toLowerCase().includes(trimmed) ||
    e.corregimiento.toLowerCase().includes(trimmed) ||
    e.category.toLowerCase().includes(trimmed)
  );

  // Filter farmers / farms
  const matchedFarmers = FARMER_DIRECTORY.filter(f => 
    f.name.toLowerCase().includes(trimmed) ||
    f.farmName.toLowerCase().includes(trimmed) ||
    f.username.toLowerCase().includes(trimmed) ||
    f.corregimiento.toLowerCase().includes(trimmed) ||
    f.primaryCrops.some(c => c.toLowerCase().includes(trimmed))
  );

  const hasResults = trimmed.length > 0 && (matchedEnterprises.length > 0 || matchedFarmers.length > 0);

  const handleOpenChat = (contact: ChatContact) => {
    if (onNavigateToChat) {
      onNavigateToChat(contact);
    } else {
      setSelectedChatContact(contact);
    }
    setIsOpen(false);
  };

  const handleSelectProducer = (farmer: FarmerDirectoryProfile) => {
    onNavigateToTab?.('marketplace');
    setIsOpen(false);
  };

  const { language } = useLanguage();

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-[#15803D] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={language === 'en' ? 'Search companies, brands (e.g. La Chiricana) or Barú producers...' : 'Buscar empresas, marcas (ej. La Chiricana) o productores en Barú...'}
          className="w-full bg-[#121212] border-2 border-[#1E293B] hover:border-[#15803D]/60 focus:border-[#15803D] text-[#E5E5E5] placeholder-[#666666] text-xs font-mono pl-9 pr-8 py-2 rounded-none transition-all outline-none shadow-inner"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-[#666666] hover:text-[#E5E5E5]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Categorized Dropdown Suggestions (Always Wide & Centered) */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[95vw] sm:w-[560px] max-w-2xl bg-[#0E0E0E] border-2 border-[#15803D] shadow-[8px_8px_0px_0px_#15803D] z-50 max-h-[70vh] overflow-y-auto font-mono text-xs divide-y divide-[#1E293B]">
          {/* Header Summary */}
          <div className="p-2.5 bg-[#141414] text-[10px] text-[#9E9E9E] flex items-center justify-between">
            <span>Resultados para "{query}"</span>
            <span className="text-[#15803D] font-bold">
              {matchedEnterprises.length + matchedFarmers.length} encontrados
            </span>
          </div>

          {/* CATEGORY 1: EMPRESAS Y MARCAS */}
          {matchedEnterprises.length > 0 && (
            <div className="p-2 space-y-1.5">
              <div className="text-[10px] font-bold text-[#FACC15] uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#FACC15]" />
                <span>Empresas & Marcas Registradas en Barú ({matchedEnterprises.length})</span>
              </div>

              {matchedEnterprises.map((ent) => (
                <div 
                  key={ent.id}
                  className="p-2 hover:bg-[#161616] border border-transparent hover:border-[#1E293B] flex flex-wrap items-center justify-between gap-2.5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <SafeImage
                      src={ent.avatar}
                      alt={ent.brandName}
                      fallbackType="avatar"
                      nameHint={ent.brandName}
                      className="w-8 h-8 rounded-none object-cover border border-[#15803D] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[#E5E5E5] flex flex-wrap items-center gap-1.5">
                        <span className="truncate">{ent.brandName}</span>
                        <Badge variant="outline" className="text-[8px] py-0 px-1 shrink-0">{ent.category}</Badge>
                      </div>
                      <div className="text-[10px] text-[#9E9E9E] truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-[#15803D]" />
                        <span>{ent.corregimiento}, Barú</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenChat({
                        id: ent.id,
                        name: ent.brandName,
                        corregimiento: ent.corregimiento,
                        avatar: ent.avatar,
                        phone: ent.phone,
                        reputation: Math.round(ent.rating * 20 * 10) / 10
                      })}
                      className="px-2 py-1 bg-[#141414] hover:bg-[#15803D] hover:text-black border border-[#15803D] text-[10px] text-[#15803D] flex items-center gap-1 transition-all"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORY 2: PRODUCTORES Y FINCAS */}
          {matchedFarmers.length > 0 && (
            <div className="p-2 space-y-1.5">
              <div className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-[#15803D]" />
                <span>Productores Certificados & Fincas ({matchedFarmers.length})</span>
              </div>

              {matchedFarmers.map((farmer) => (
                <div 
                  key={farmer.id}
                  className="p-2 hover:bg-[#161616] border border-transparent hover:border-[#1E293B] flex flex-wrap items-center justify-between gap-2.5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <SafeImage
                      src={farmer.avatar}
                      alt={farmer.name}
                      fallbackType="avatar"
                      nameHint={farmer.name}
                      className="w-8 h-8 rounded-none object-cover border border-[#FACC15] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[#E5E5E5] flex flex-wrap items-center gap-1.5">
                        <span className="truncate">{farmer.name}</span>
                        <span className="text-[9px] text-[#FACC15] font-mono shrink-0">{farmer.username}</span>
                      </div>
                      <div className="text-[10px] text-[#9E9E9E] truncate flex items-center gap-1 font-sans">
                        <Sprout className="w-2.5 h-2.5 text-[#15803D]" />
                        <span>{farmer.farmName} • {farmer.corregimiento}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSelectProducer(farmer)}
                      className="px-2 py-1 bg-[#141414] hover:bg-[#FACC15] hover:text-black border border-[#FACC15] text-[10px] text-[#FACC15] flex items-center gap-1 transition-all"
                    >
                      <span>Lotes</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>

                    <button
                      onClick={() => handleOpenChat({
                        id: farmer.id,
                        name: farmer.name,
                        corregimiento: farmer.corregimiento,
                        avatar: farmer.avatar,
                        phone: farmer.phone,
                        reputation: farmer.reputation
                      })}
                      className="px-2 py-1 bg-[#141414] hover:bg-[#15803D] hover:text-black border border-[#15803D] text-[10px] text-[#15803D] flex items-center gap-1 transition-all"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results state */}
          {!hasResults && (
            <div className="p-6 text-center text-[#666666] space-y-1">
              <p>No se encontraron empresas o productores con "{query}"</p>
              <p className="text-[10px] text-[#9E9E9E]">Prueba buscando "La Chiricana", "COOPASBA", "Dionisio" o "Puerto Armuelles".</p>
            </div>
          )}
        </div>
      )}

      {/* Direct Chat Modal */}
      <DirectMessageModal
        isOpen={!!selectedChatContact}
        onClose={() => setSelectedChatContact(null)}
        contact={selectedChatContact}
      />
    </div>
  );
};
