import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ArrowLeft, 
  MessageSquare, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCheck, 
  Phone, 
  Image as ImageIcon,
  Paperclip,
  Search,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { ChatContact } from '@/components/chat/DirectMessageModal';
import { ENTERPRISE_DIRECTORY, FARMER_DIRECTORY } from '@/services/directoryData';
import { SafeImage } from '@/components/ui/SafeImage';
import { createInitialsAvatarDataUri } from '@/lib/imageFallbacks';
import { PublicProfileModal } from '@/components/profile/PublicProfileModal';
import { optimizeChatImage } from '@/lib/imageOptimizer';
import { useDirectChat } from '@/hooks/useDirectChat';
import { roleDescription, subscribeRealDirectory, DirectoryContact } from '@/services/chatService';

interface DirectChatPageProps {
  contact: ChatContact | null;
  onBack: () => void;
  onSelectContact?: (contact: ChatContact) => void;
}

export const DirectChatPage: React.FC<DirectChatPageProps> = ({
  contact,
  onBack,
  onSelectContact
}) => {
  const { currentUser, firebaseUser } = useAppState();
  const { language } = useLanguage();
  const myUid = firebaseUser?.uid || currentUser.id;

  // Active contact fallback (solo se usa si aún no hay cuentas reales).
  const defaultContact: ChatContact = {
    id: 'USR-FARMER-01',
    name: 'Don Dionisio Castillo',
    corregimiento: 'Puerto Armuelles',
    avatar: createInitialsAvatarDataUri('Don Dionisio Castillo'),
    reputation: 99.4,
    phone: '+507 6789-1234',
    isReal: false,
  };

  const activeContact = contact || defaultContact;

  const [inputText, setInputText] = useState('');
  const [searchContactFilter, setSearchContactFilter] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [realContacts, setRealContacts] = useState<ChatContact[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const autoSelectedContactRef = useRef(false);

  const { messages, loading: chatLoading, error: chatError, isRemote, otherTyping, sendMessage, notifyTyping } = useDirectChat(
    activeContact,
    true,
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    return subscribeRealDirectory(
      (contacts: DirectoryContact[]) => {
        setRealContacts(
          contacts
            .filter((item) => item.id !== myUid)
            .map((item) => ({
            id: item.id,
            name: item.name,
            roleDescription: roleDescription(item.role),
            corregimiento: item.location || 'Barú, Chiriquí',
            avatar: item.avatar,
            phone: item.phone,
            reputation: item.reputation,
            badge: item.badge || roleDescription(item.role),
            isReal: true,
            })),
        );
        setDirectoryLoading(false);
        setDirectoryError(null);
      },
      () => {
        setDirectoryLoading(false);
        setDirectoryError('No se pudo cargar el directorio de cuentas.');
      },
    );
  }, [myUid]);

  // Si hay cuentas reales, abre la primera conversación real al entrar al chat.
  useEffect(() => {
    if (contact || autoSelectedContactRef.current || realContacts.length === 0) return;
    autoSelectedContactRef.current = true;
    onSelectContact?.(realContacts[0]);
  }, [contact, onSelectContact, realContacts]);

  // Contactos reales primero; después el directorio demostrativo.
  const allContacts: ChatContact[] = [
    ...realContacts,
    ...FARMER_DIRECTORY.map(f => ({
      id: f.id,
      name: f.name,
      roleDescription: 'Productor Titular',
      corregimiento: f.corregimiento,
      avatar: f.avatar,
      reputation: f.reputation,
      phone: f.phone,
      badge: 'Productor Titular',
      isReal: false,
    })),
    ...ENTERPRISE_DIRECTORY.map(e => ({
      id: e.id,
      name: e.brandName,
      roleDescription: e.category,
      corregimiento: e.corregimiento,
      avatar: e.avatar,
      reputation: Math.round(e.rating * 20 * 10) / 10,
      phone: e.phone,
      badge: e.category,
      isReal: false,
    }))
  ];

  const filteredContacts = allContacts.filter(c => 
    c.name.toLowerCase().includes(searchContactFilter.toLowerCase()) ||
    (c.corregimiento && c.corregimiento.toLowerCase().includes(searchContactFilter.toLowerCase()))
  );

  useEffect(() => {
    // Desplaza solo el contenedor de mensajes, nunca la página completa.
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isSending) return;

    setIsSending(true);
    const sent = await sendMessage(inputText, attachedImage || undefined);
    if (sent) {
      setInputText('');
      setAttachedImage(null);
    }
    setIsSending(false);
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAttachedImage(preview);
    optimizeChatImage(file)
      .then((optimized) => setAttachedImage((current) => (current === preview ? optimized.dataUrl : current)))
      .catch(() => {})
      .finally(() => URL.revokeObjectURL(preview));
    e.target.value = '';
  };

  return (
    <div className="py-4 space-y-4 font-mono">
      {/* Top Header & Return Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E0E0E] p-3 border-2 border-[#15803D] shadow-[4px_4px_0px_0px_#15803D]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#15803D] hover:text-black border-2 border-[#15803D] text-[#E5E5E5] text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_0px_#15803D]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="live-green" className="flex items-center gap-1.5 text-xs font-bold px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>Chat</span>
          </Badge>
        </div>
      </div>

      {/* Main WhatsApp-Style Messaging Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#15803D] bg-[#0A0A0A] shadow-[8px_8px_0px_0px_#15803D] min-h-[540px]">
        {/* Left Column (4 cols): Contacts & Active Chats Directory */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#0E0E0E] flex flex-col">
          {/* Search Contacts Bar */}
          <div className="p-3 border-b border-[#1E293B]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#666666]" />
              <input
                type="text"
                value={searchContactFilter}
                onChange={(e) => setSearchContactFilter(e.target.value)}
                placeholder="Buscar productor o empresa..."
                className="w-full bg-[#141414] border border-[#1E293B] focus:border-[#15803D] text-xs text-[#E5E5E5] pl-8 pr-2 py-1.5 outline-none rounded-none"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B] max-h-[220px] lg:max-h-[620px]">
            {directoryLoading && (
              <div className="p-3 space-y-2 animate-pulse" aria-label="Cargando directorio">
                <div className="h-9 bg-[#141414] border border-[#1E293B]" />
                <div className="h-9 bg-[#141414] border border-[#1E293B]" />
              </div>
            )}
            {directoryError && (
              <div className="p-3 text-[10px] text-[#FED7AA] border-b border-[#F97316]/40 bg-[#F97316]/10 font-sans" role="alert">
                {directoryError}
              </div>
            )}
            {filteredContacts.map((c) => {
              const isSelected = c.id === activeContact.id;
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectContact?.(c)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectContact?.(c);
                    }
                  }}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors focus-visible:bg-[#141414] ${
                    isSelected 
                      ? 'bg-[#15803D]/15 border-l-4 border-[#15803D]' 
                      : 'hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeImage
                      src={c.avatar}
                      alt={c.name}
                      fallbackType="avatar"
                      nameHint={c.name}
                      className="w-9 h-9 object-cover border border-[#15803D] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#E5E5E5] truncate flex items-center gap-1">
                        <span>{c.name}</span>
                      </div>
                      <div className="text-[10px] text-[#9E9E9E] truncate flex items-center gap-1 font-sans">
                        <MapPin className="w-2.5 h-2.5 text-[#15803D]" />
                        <span>{c.corregimiento}</span>
                      </div>
                      <div className={`text-[8px] font-bold uppercase mt-0.5 ${c.isReal ? 'text-[#10B981]' : 'text-[#666666]'}`}>
                        {c.isReal ? 'Cuenta real' : 'Perfil de ejemplo'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-[#FACC15] font-bold flex items-center justify-end gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-[#FACC15]" />
                      {Number(c.reputation || 99).toFixed(1)}%
                    </span>
                    <span className="text-[8px] text-[#666666]">{c.isReal ? 'En línea' : 'Ejemplo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Active Chat Feed & Input */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#0A0A0A]/95 border-t lg:border-t-0 border-[#1E293B]">
          {/* Active Contact Header */}
          <div className="bg-[#121212] border-b border-[#1E293B] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <SafeImage
                src={activeContact.avatar}
                alt={activeContact.name}
                fallbackType="avatar"
                nameHint={activeContact.name}
                className="w-10 h-10 object-cover border-2 border-[#15803D] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-black text-sm text-[#E5E5E5] truncate">
                    {activeContact.name}
                  </h3>
                  <Badge variant={isRemote ? 'live-green' : 'outline'} className="text-[8px] py-0 shrink-0">
                    {otherTyping ? 'Escribiendo…' : isRemote ? 'En vivo' : 'Ejemplo'}
                  </Badge>
                </div>
                <p className="text-[10px] text-[#9E9E9E] truncate">
                  {activeContact.corregimiento} • Reputación MIDA: <strong className="text-[#FACC15]">{Number(activeContact.reputation || 99.4).toFixed(1)}%</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="px-2.5 py-1 border border-[#15803D] text-[#10B981] text-[10px] font-bold hover:bg-[#15803D] hover:text-black transition-colors"
              >
                Ver perfil
              </button>
              <Badge variant="yellow" className="text-[9px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#141414]" />
                <span>Transacción Segura</span>
              </Badge>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={messagesContainerRef} className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] min-h-[300px] bg-[#0A0A0A] text-xs">
            <div className="text-center my-1">
              <span className="bg-[#141414] text-[#9E9E9E] px-3 py-1 text-[10px] border border-[#1E293B] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#15803D]" />
                <span>Canal de Comunicación Directa • Barú, Chiriquí</span>
              </span>
            </div>

            {chatLoading && (
              <div className="space-y-2 animate-pulse py-3" aria-label="Cargando mensajes">
                <div className="h-12 w-2/3 border border-[#1E293B] bg-[#141414]" />
                <div className="h-12 w-1/2 border border-[#1E293B] bg-[#141414] ml-auto" />
              </div>
            )}

            {chatError && (
              <div className="border border-[#F97316]/50 bg-[#F97316]/10 p-3 text-[10px] text-[#FED7AA] font-sans" role="alert">
                {chatError}
              </div>
            )}

            {!chatLoading && !chatError && messages.length === 0 && (
              <div className="my-6 border border-dashed border-[#1E293B] bg-[#0E0E0E] p-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto text-[#15803D] mb-2" />
                <p className="font-bold text-[#E5E5E5]">Inicia la conversación</p>
                <p className="text-[10px] text-[#9E9E9E] mt-1 font-sans">
                  {isRemote
                    ? 'Los mensajes se guardan en la nube y la otra cuenta los verá al entrar.'
                    : 'Este es un perfil de ejemplo. Elige una cuenta real del directorio para conversar entre usuarios.'}
                </p>
              </div>
            )}

            {!chatLoading && messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[75%] p-3.5 border ${
                    msg.isSelf
                      ? 'bg-[#15803D]/20 border-[#15803D] text-[#E5E5E5] shadow-[3px_3px_0px_0px_#15803D]'
                      : 'bg-[#141414] border-[#1E293B] text-[#CCCCCC] shadow-[3px_3px_0px_0px_#262626]'
                  }`}
                >
                  {!msg.isSelf && (
                    <div className="text-[10px] font-bold text-[#FACC15] mb-1">
                      {msg.senderName}
                    </div>
                  )}

                  <p data-no-translate className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {msg.imageUrl && (
                    <div className="mt-2 border border-[#1E293B] overflow-hidden max-w-xs">
                      <SafeImage src={msg.imageUrl} alt="Adjunto" fallbackType="product" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#666666]">
                    <span>{msg.timestamp}</span>
                    {msg.isSelf && (
                      <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-[#10B981]' : 'text-[#666666]'}`} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Pre-filled Questions for Buyers */}
          <div className="px-4 py-1.5 bg-[#0E0E0E] border-t border-[#1E293B] flex flex-wrap items-center gap-2 text-[10px]">
            <span className="text-[#666666] shrink-0">Consultas Rápidas:</span>
            <button
              onClick={() => setInputText(`Hola ${activeContact.name.split(' ')[0]}, ¿tiene disponibilidad de 500 cajas para la próxima semana?`)}
              className="px-2.5 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] whitespace-nowrap"
            >
              Consultar 500 cajas
            </button>
            <button
              onClick={() => setInputText(`Buenas tardes, me gustaría solicitar una muestra courier de 18 kg para inspección.`)}
              className="px-2.5 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] whitespace-nowrap"
            >
              Pedir Muestra (18 kg)
            </button>
            <button
              onClick={() => setInputText(`¿Qué certificaciones fitosanitarias MIDA tiene vigentes este lote?`)}
              className="px-2.5 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] whitespace-nowrap"
            >
              Certificados MIDA
            </button>
          </div>

          {/* Image Attachment Preview */}
          {attachedImage && (
            <div className="bg-[#141414] border-t border-[#15803D] p-2 flex items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <SafeImage src={attachedImage} alt="Preview" fallbackType="product" className="w-8 h-8 object-cover border border-[#15803D]" />
                <span className="text-[10px] text-[#15803D]">Foto adjunta lista para enviar</span>
              </div>
              <button onClick={() => setAttachedImage(null)} className="text-[#F97316] hover:text-white text-xs">
                ✕ Quitar
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1E293B] bg-[#121212] flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 border border-[#1E293B] bg-[#141414] text-[#666666] hover:text-[#FACC15] shrink-0"
              title="Adjuntar imagen" aria-label="Adjuntar imagen"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAttachImage} 
              accept="image/*" 
              className="hidden" 
            />

            <Input
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                notifyTyping(e.target.value);
              }}
              placeholder={`Escribe a ${activeContact.name}...`}
              className="font-mono text-xs border-[#1E293B] focus-visible:border-[#15803D] bg-[#0A0A0A]"
            />

            <Button 
              type="submit" 
              variant="default"
              size="sm"
              className="px-5 font-bold flex items-center gap-1.5 shrink-0"
              disabled={isSending || (!inputText.trim() && !attachedImage)}
              aria-label="Enviar mensaje"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Enviando…' : 'Enviar'}</span>
            </Button>
          </form>
        </div>
      </div>
      <PublicProfileModal
        open={profileOpen}
        target={{
          id: activeContact.id,
          name: activeContact.name,
          role: activeContact.badge || 'productor',
          avatar: activeContact.avatar,
          location: activeContact.corregimiento,
          reputation: activeContact.reputation,
          phone: activeContact.phone,
        }}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
};
