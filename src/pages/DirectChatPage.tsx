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

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  imageUrl?: string;
  status: 'sent' | 'delivered' | 'read';
}

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
  const { currentUser } = useAppState();
  const { language } = useLanguage();
  const { success } = useNotification();

  // Active contact fallback
  const defaultContact: ChatContact = {
    id: 'USR-FARMER-01',
    name: 'Don Dionisio Castillo',
    corregimiento: 'Puerto Armuelles',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    reputation: 99.4,
    phone: '+507 6789-1234'
  };

  const activeContact = contact || defaultContact;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchContactFilter, setSearchContactFilter] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // All available contacts for the sidebar
  const allContacts: ChatContact[] = [
    ...FARMER_DIRECTORY.map(f => ({
      id: f.id,
      name: f.name,
      corregimiento: f.corregimiento,
      avatar: f.avatar,
      reputation: f.reputation,
      phone: f.phone,
      badge: 'Productor Titular'
    })),
    ...ENTERPRISE_DIRECTORY.map(e => ({
      id: e.id,
      name: e.brandName,
      corregimiento: e.corregimiento,
      avatar: e.avatar,
      reputation: e.rating * 20,
      phone: e.phone,
      badge: e.category
    }))
  ];

  const filteredContacts = allContacts.filter(c => 
    c.name.toLowerCase().includes(searchContactFilter.toLowerCase()) ||
    (c.corregimiento && c.corregimiento.toLowerCase().includes(searchContactFilter.toLowerCase()))
  );

  // Load chat history for active contact
  useEffect(() => {
    const storedKey = `agrobaru_chat_${activeContact.id}`;
    const saved = localStorage.getItem(storedKey);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const welcome: ChatMessage = {
        id: `INIT-${Date.now()}`,
        senderId: activeContact.id,
        senderName: activeContact.name,
        text: `¡Hola! Soy ${activeContact.name} desde ${activeContact.corregimiento || 'Barú, Chiriquí'}. ¿En qué podemos apoyarle con las órdenes de cosecha, muestras de fruta o contratos Escrow?`,
        timestamp: '10:00 AM',
        isSelf: false,
        status: 'read'
      };
      setMessages([welcome]);
    }
  }, [activeContact.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputText.trim(),
      imageUrl: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      status: 'sent'
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');
    setAttachedImage(null);

    const storedKey = `agrobaru_chat_${activeContact.id}`;
    localStorage.setItem(storedKey, JSON.stringify(updated));

    // Simulated quick reply from producer
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `REPLY-${Date.now()}`,
        senderId: activeContact.id,
        senderName: activeContact.name,
        text: `Comprendido perfectamente. Tenemos la documentación fitosanitaria MIDA al día y el lote listo para inspección. ¿Le gustaría proceder con un pedido de muestra courier o coordinar depósito en custodia?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false,
        status: 'read'
      };
      setMessages(prev => {
        const full = [...prev, reply];
        localStorage.setItem(storedKey, JSON.stringify(full));
        return full;
      });
    }, 1200);
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#15803D] bg-[#0A0A0A] shadow-[8px_8px_0px_0px_#15803D] min-h-[680px]">
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
            {filteredContacts.map((c) => {
              const isSelected = c.id === activeContact.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectContact?.(c)}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[#15803D]/15 border-l-4 border-[#15803D]' 
                      : 'hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={c.avatar} 
                      alt={c.name} 
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
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-[#FACC15] font-bold flex items-center justify-end gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-[#FACC15]" />
                      {c.reputation || 99}%
                    </span>
                    <span className="text-[8px] text-[#666666]">En línea</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Active Chat Feed & Input */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#0A0A0A]/95">
          {/* Active Contact Header */}
          <div className="bg-[#121212] border-b border-[#1E293B] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={activeContact.avatar} 
                alt={activeContact.name} 
                className="w-10 h-10 object-cover border-2 border-[#15803D] shrink-0" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-sm text-[#E5E5E5] truncate">
                    {activeContact.name}
                  </h3>
                  <Badge variant="live-green" className="text-[8px] py-0">Activo</Badge>
                </div>
                <p className="text-[10px] text-[#9E9E9E] truncate">
                  {activeContact.corregimiento} • Reputación MIDA: <strong className="text-[#FACC15]">{activeContact.reputation || 99.4}%</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="yellow" className="text-[9px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#141414]" />
                <span>Transacción Segura</span>
              </Badge>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] min-h-[420px] bg-[#0A0A0A] text-xs">
            <div className="text-center my-1">
              <span className="bg-[#141414] text-[#9E9E9E] px-3 py-1 text-[10px] border border-[#1E293B] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#15803D]" />
                <span>Canal de Comunicación Directa • Barú, Chiriquí</span>
              </span>
            </div>

            {messages.map((msg) => (
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

                  <p className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {msg.imageUrl && (
                    <div className="mt-2 border border-[#1E293B] overflow-hidden max-w-xs">
                      <img src={msg.imageUrl} alt="Adjunto" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#666666]">
                    <span>{msg.timestamp}</span>
                    {msg.isSelf && (
                      <CheckCheck className="w-3 h-3 text-[#15803D]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Pre-filled Questions for Buyers */}
          <div className="px-4 py-1.5 bg-[#0E0E0E] border-t border-[#1E293B] flex items-center gap-2 overflow-x-auto text-[10px]">
            <span className="text-[#666666] shrink-0">Consultas Rápidas:</span>
            <button
              onClick={() => setInputText(`Hola ${activeContact.name.split(' ')[0]}, ¿tiene disponibilidad de 500 cajas para la próxima semana?`)}
              className="px-2.5 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] shrink-0"
            >
              Consultar 500 cajas
            </button>
            <button
              onClick={() => setInputText(`Buenas tardes, me gustaría solicitar una muestra courier de 18 kg para inspección.`)}
              className="px-2.5 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] shrink-0"
            >
              Pedir Muestra (18 kg)
            </button>
            <button
              onClick={() => setInputText(`¿Qué certificaciones fitosanitarias MIDA tiene vigentes este lote?`)}
              className="px-2.5 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5] shrink-0"
            >
              Certificados MIDA
            </button>
          </div>

          {/* Image Attachment Preview */}
          {attachedImage && (
            <div className="bg-[#141414] border-t border-[#15803D] p-2 flex items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <img src={attachedImage} alt="Preview" className="w-8 h-8 object-cover border border-[#15803D]" />
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
              title="Adjuntar imagen"
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
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Escribe a ${activeContact.name}...`}
              className="font-mono text-xs border-[#1E293B] focus-visible:border-[#15803D] bg-[#0A0A0A]"
            />

            <Button 
              type="submit" 
              variant="default"
              size="sm"
              className="px-5 font-bold flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
