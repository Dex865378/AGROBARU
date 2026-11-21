import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/context/AppStateContext';
import {
  DirectChatRecord,
  DirectConversationMeta,
  directConversationId,
  ensureDirectConversation,
  isFirebaseUid,
  markDirectConversationRead,
  sendDirectChatMessage,
  subscribeDirectConversation,
  subscribeDirectMessages,
} from '@/services/chatService';
import type { ChatContact } from '@/components/chat/DirectMessageModal';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  imageUrl?: string;
  status: 'sent' | 'delivered' | 'read';
}

interface UseDirectChatResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  isRemote: boolean;
  sendMessage: (text: string, imageUrl?: string) => Promise<boolean>;
}

function formatTime(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeStoredMessage(
  value: Partial<ChatMessage> & { createdAt?: string },
  index: number,
): DirectChatRecord | null {
  if (!value || typeof value.text !== 'string') return null;
  return {
    id: value.id || `LEGACY-${index}`,
    conversationId: 'local',
    senderId: value.senderId || 'unknown',
    senderName: value.senderName || 'Usuario AgroBarú',
    text: value.text,
    imageUrl: value.imageUrl,
    createdAt: value.createdAt || new Date(index === 0 ? 1 : Date.now() + index).toISOString(),
  };
}

/**
 * Hook compartido por el modal y la página de chat.
 * - Cuentas reales: mensajes persistentes en Firestore y estado de lectura.
 * - Perfiles de ejemplo: historial local, sin respuestas automáticas falsas.
 */
export function useDirectChat(contact: ChatContact | null, active = true): UseDirectChatResult {
  const { currentUser, firebaseUser } = useAppState();
  const myId = firebaseUser?.uid || currentUser.id;
  const contactId = contact?.id || '';
  const isRemote = Boolean(
    active &&
      contact &&
      firebaseUser &&
      contactId &&
      contactId !== myId &&
      isFirebaseUid(contactId),
  );
  const conversationId = isRemote ? directConversationId(myId, contactId) : '';
  const localKey = contactId ? `agrobaru_direct_chat_v2_${myId}_${contactId}` : '';

  const [rawMessages, setRawMessages] = useState<DirectChatRecord[]>([]);
  const [meta, setMeta] = useState<DirectConversationMeta>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversaciones de ejemplo: se mantienen en el dispositivo y nunca simulan
  // respuestas de otra persona.
  useEffect(() => {
    if (!active || !contact) {
      setRawMessages([]);
      setMeta({});
      setLoading(false);
      setError(null);
      return;
    }

    if (isRemote) return;

    setLoading(false);
    setError(null);
    setMeta({});
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item, index) => normalizeStoredMessage(item, index))
            .filter((item): item is DirectChatRecord => Boolean(item));
          if (normalized.length > 0) {
            setRawMessages(normalized);
            return;
          }
        }
      }
    } catch {
      // Si el almacenamiento está corrupto se muestra una conversación nueva.
    }

    setRawMessages([
      {
        id: `WELCOME-${contactId}`,
        conversationId: 'local',
        senderId: contactId,
        senderName: contact.name,
        text: `¡Saludos! Soy ${contact.name} desde ${contact.corregimiento || 'Barú, Chiriquí'}. ¿En qué podemos servirle sobre nuestras cosechas y pedidos?`,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ]);
  }, [active, contact, contactId, isRemote, localKey]);

  // Conversaciones reales: crear la sala y suscribirse a mensajes + metadatos.
  useEffect(() => {
    if (!active || !isRemote || !contact || !conversationId) return;

    let cancelled = false;
    let unsubscribeMessages: (() => void) | undefined;
    let unsubscribeConversation: (() => void) | undefined;

    setLoading(true);
    setError(null);
    setRawMessages([]);
    setMeta({});

    ensureDirectConversation(conversationId, [myId, contact.id])
      .then(() => {
        if (cancelled) return;
        unsubscribeMessages = subscribeDirectMessages(
          conversationId,
          (items) => {
            setRawMessages(items);
            setLoading(false);
          },
          () => {
            setError('No se pudo cargar la conversación. Revisa tu conexión e inténtalo de nuevo.');
            setLoading(false);
          },
        );
        unsubscribeConversation = subscribeDirectConversation(
          conversationId,
          (nextMeta) => setMeta(nextMeta),
          () => {
            // El canal de metadatos solo controla el estado de lectura.
          },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo abrir el chat. Verifica tu conexión e inténtalo de nuevo.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribeMessages?.();
      unsubscribeConversation?.();
    };
  }, [active, contact, conversationId, isRemote, myId]);

  const messages = useMemo<ChatMessage[]>(() => {
    const otherReadAt = contact ? meta.lastRead?.[contact.id] : undefined;
    return rawMessages.map((message) => {
      const isSelf = message.senderId === myId;
      const isRead = Boolean(otherReadAt && otherReadAt >= message.createdAt);
      return {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        text: message.text,
        imageUrl: message.imageUrl || undefined,
        timestamp: formatTime(message.createdAt),
        isSelf,
        status: isSelf ? (isRead ? 'read' : 'delivered') : 'read',
      };
    });
  }, [contact, meta.lastRead, messagesKey(rawMessages), myId]);

  const lastMessageId = rawMessages[rawMessages.length - 1]?.id;
  const lastMessageSender = rawMessages[rawMessages.length - 1]?.senderId;
  useEffect(() => {
    if (!isRemote || !conversationId || !lastMessageId || lastMessageSender === myId) return;
    const alreadyRead = meta.lastRead?.[myId];
    const lastMessage = rawMessages[rawMessages.length - 1];
    if (alreadyRead && lastMessage && alreadyRead >= lastMessage.createdAt) return;
    void markDirectConversationRead(conversationId, myId);
  }, [conversationId, isRemote, lastMessageId, lastMessageSender, meta.lastRead, myId, rawMessages]);

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string): Promise<boolean> => {
      const cleanText = text.trim();
      if (!cleanText && !imageUrl) return false;
      if (!contact) return false;

      if (isRemote) {
        try {
          const created = await sendDirectChatMessage({
            conversationId,
            participants: [myId, contact.id],
            senderId: myId,
            senderName: currentUser.name,
            senderAvatar: currentUser.photoURL,
            text: cleanText,
            imageUrl,
          });
          setRawMessages((current) =>
            current.some((item) => item.id === created.id) ? current : [...current, created],
          );
          return true;
        } catch {
          setError('El mensaje no se pudo enviar. Revisa tu conexión e inténtalo otra vez.');
          return false;
        }
      }

      const created: DirectChatRecord = {
        id: `LOCAL-${Date.now()}`,
        conversationId: 'local',
        senderId: myId,
        senderName: currentUser.name,
        text: cleanText,
        imageUrl,
        createdAt: new Date().toISOString(),
      };
      setRawMessages((current) => {
        const next = [...current, created];
        try {
          localStorage.setItem(localKey, JSON.stringify(next));
        } catch {
          // El mensaje sigue visible en memoria.
        }
        return next;
      });
      return true;
    },
    [contact, conversationId, currentUser.name, currentUser.photoURL, isRemote, localKey, myId],
  );

  return { messages, loading, error, isRemote, sendMessage };
}

/** Evita recrear el array de mensajes en cada render cuando no cambió. */
function messagesKey(messages: DirectChatRecord[]): string {
  return messages.length === 0
    ? '0'
    : `${messages.length}:${messages[messages.length - 1]?.id}:${messages[messages.length - 1]?.createdAt}`;
}
