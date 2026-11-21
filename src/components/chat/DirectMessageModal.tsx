import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  MessageSquare, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCheck, 
  Phone, 
  Sparkles,
  Paperclip,
  Check,
  Lock
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { SafeImage } from '@/components/ui/SafeImage';
import { useDirectChat } from '@/hooks/useDirectChat';

export interface ChatContact {
  id: string;
  name: string;
  roleDescription?: string;
  corregimiento?: string;
  avatar?: string;
  phone?: string;
  reputation?: number;
  badge?: string;
  /** true cuando el id es un UID real de Firebase Auth. */
  isReal?: boolean;
}

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: ChatContact | null;
  initialMessage?: string;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  contact,
  initialMessage
}) => {
  const { language } = useLanguage();
  const { messages, loading, error, isRemote, sendMessage } = useDirectChat(
    isOpen ? contact : null,
    isOpen,
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contact && isOpen && initialMessage) {
      setInputText(initialMessage);
    }
  }, [contact, isOpen, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !contact || isSending) return;
    setIsSending(true);
    const sent = await sendMessage(inputText);
    if (sent) setInputText('');
    setIsSending(false);
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      
      {/* Contact Header */}
      <DialogHeader className="border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 border-2 border-[#15803D] bg-[#141414] overflow-hidden shrink-0">
            <SafeImage
              src={contact.avatar}
              alt={contact.name}
              fallbackType="avatar"
              nameHint={contact.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#15803D] border border-black" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-base leading-snug font-display font-bold text-[#E5E5E5]">
                {contact.name}
              </DialogTitle>
              <Badge variant={isRemote ? 'live-green' : 'outline'} className="text-[9px] py-0.5">
                {isRemote ? 'En vivo' : 'Perfil de ejemplo'}
              </Badge>
            </div>
            
            <div className="text-xs text-[#9E9E9E] font-mono flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#15803D]" />
                {contact.corregimiento || 'Barú, Chiriquí'}
              </span>
              <span>•</span>
              <span className="text-[#FACC15] font-bold">
                ★ {contact.reputation ? `${Number(contact.reputation).toFixed(1)}% Reputación` : '99.4% Verificado'}
              </span>
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Message Chat Feed */}
      <div className="p-4 space-y-3 max-h-[50vh] min-h-[300px] overflow-y-auto font-mono text-xs bg-[#090D0B]/90">
        <div className="text-center my-2">
          <span className="bg-[#111714] text-[#9E9E9E] px-3 py-1 rounded-full text-[10px] border border-[#1E2E26] inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#10B981]" />
            <span>Canal Directo Seguro • Barú Escrow Protected</span>
          </span>
        </div>

        {loading && (
          <div className="space-y-2 animate-pulse" aria-label="Cargando conversación">
            <div className="h-12 w-2/3 rounded-xl bg-[#141414] border border-[#1E2E26]" />
            <div className="h-12 w-1/2 rounded-xl bg-[#141414] border border-[#1E2E26] ml-auto" />
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="py-10 text-center border border-dashed border-[#1E2E26] bg-[#0E0E0E] px-4">
            <MessageSquare className="w-7 h-7 mx-auto text-[#15803D] mb-2" />
            <p className="font-bold text-[#E5E5E5]">Inicia la conversación</p>
            <p className="text-[10px] text-[#9E9E9E] mt-1 font-sans">
              Los mensajes quedan guardados y la otra persona los verá al entrar.
            </p>
          </div>
        )}

        {error && (
          <div className="border border-[#F97316]/50 bg-[#F97316]/10 p-3 text-[10px] text-[#FED7AA] font-sans" role="alert">
            {error}
          </div>
        )}

        {!loading && messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed border ${
                msg.isSelf
                  ? 'bg-[#10B981]/15 border-[#10B981]/60 text-[#ECFDF5]'
                  : 'bg-[#111714] border-[#1E2E26] text-[#CCCCCC]'
              }`}
            >
              {!msg.isSelf && (
                <div className="text-[10px] font-bold text-[#FACC15] mb-1">
                  {msg.senderName}
                </div>
              )}
              {msg.imageUrl && (
                <div className="mb-2 overflow-hidden border border-[#1E2E26]">
                  <SafeImage src={msg.imageUrl} alt="Adjunto" fallbackType="product" className="max-h-44 w-full object-cover" />
                </div>
              )}
              <p className="font-sans text-xs">{msg.text}</p>
              
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

      {/* Input Footer */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1E293B] bg-[#0E0E0E] flex items-center gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Escribe a ${contact.name.split(' ')[0]}...`}
          className="font-mono text-xs border-[#1E293B] focus-visible:border-[#15803D]"
        />
        <Button 
          type="submit" 
          variant="default"
          size="sm"
          className="px-4 font-bold flex items-center gap-1.5 shrink-0"
          disabled={isSending || !inputText.trim()}
          aria-label="Enviar mensaje"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Enviar</span>
        </Button>
      </form>
    </Dialog>
  );
};
