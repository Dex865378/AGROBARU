import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

/**
 * Chat directo entre cuentas reales de AgroBarú.
 *
 * Cada conversación se guarda en `directConversations/{uidA}__{uidB}` y sus
 * mensajes en la subcolección `messages`. El id es determinista para que ambas
 * cuentas abran exactamente la misma conversación sin necesidad de crear salas.
 */
export const DIRECT_CHAT_COLLECTION = 'directConversations';

export interface DirectChatRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface DirectConversationMeta {
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  lastRead?: Record<string, string>;
  typing?: Record<string, boolean>;
  lastSeen?: Record<string, string>;
  updatedAt?: string;
}

export interface DirectoryContact {
  id: string;
  name: string;
  role?: string;
  location?: string;
  avatar?: string;
  phone?: string;
  reputation?: number;
  badge?: string;
  bio?: string;
}

/** Los UID de Firebase no llevan guiones; los ids de ejemplo sí. */
export function isFirebaseUid(value?: string | null): boolean {
  return Boolean(value && /^[A-Za-z0-9]{20,}$/.test(value));
}

export function directConversationId(firstUid: string, secondUid: string): string {
  return [firstUid, secondUid].sort().join('__');
}

export async function ensureDirectConversation(
  conversationId: string,
  participants: [string, string],
): Promise<void> {
  await setDoc(
    doc(db, DIRECT_CHAT_COLLECTION, conversationId),
    {
      participants: [...participants].sort(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function sendDirectChatMessage(input: {
  conversationId: string;
  participants: [string, string];
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
}): Promise<DirectChatRecord> {
  const createdAt = new Date().toISOString();
  await ensureDirectConversation(input.conversationId, input.participants);

  const payload = {
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderAvatar: input.senderAvatar || '',
    text: input.text,
    imageUrl: input.imageUrl || '',
    createdAt,
  };

  const created = await addDoc(
    collection(db, DIRECT_CHAT_COLLECTION, input.conversationId, 'messages'),
    payload,
  );

  await setDoc(
    doc(db, DIRECT_CHAT_COLLECTION, input.conversationId),
    {
      participants: [...input.participants].sort(),
      lastMessage: input.imageUrl ? 'Foto adjunta' : input.text.slice(0, 160),
      lastMessageAt: createdAt,
      lastSenderId: input.senderId,
      updatedAt: createdAt,
    },
    { merge: true },
  );

  return { id: created.id, ...payload };
}

export function subscribeDirectMessages(
  conversationId: string,
  callback: (messages: DirectChatRecord[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const messagesRef = collection(db, DIRECT_CHAT_COLLECTION, conversationId, 'messages');
  return onSnapshot(
    query(messagesRef, orderBy('createdAt', 'asc')),
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<DirectChatRecord, 'id'>),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export function subscribeDirectConversation(
  conversationId: string,
  callback: (meta: DirectConversationMeta) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, DIRECT_CHAT_COLLECTION, conversationId),
    (snapshot) => callback((snapshot.data() || {}) as DirectConversationMeta),
    (error) => onError?.(error),
  );
}

export async function markDirectConversationRead(
  conversationId: string,
  uid: string,
): Promise<void> {
  try {
    // updateDoc (no setDoc) evita crear conversaciones vacías sin participantes.
    await updateDoc(doc(db, DIRECT_CHAT_COLLECTION, conversationId), {
      [`lastRead.${uid}`]: new Date().toISOString(),
    });
  } catch {
    // La conversación aún no existe o el usuario está offline: no es un error
    // visible para la persona que está escribiendo.
  }
}

/**
 * Directorio de cuentas reales. `agrobaru_users` es de lectura pública y el id
 * del documento coincide con el UID de Firebase Auth.
 */
export function subscribeRealDirectory(
  callback: (contacts: DirectoryContact[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, 'agrobaru_users'), limit(80)),
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => {
          const data = item.data() as Record<string, unknown>;
          return {
            id: item.id,
            name: String(data.name || data.displayName || 'Usuario AgroBarú'),
            role: typeof data.role === 'string' ? data.role : undefined,
            location: typeof data.location === 'string' ? data.location : undefined,
            avatar:
              typeof data.photoURL === 'string'
                ? data.photoURL
                : typeof data.avatar === 'string'
                  ? data.avatar
                  : undefined,
            phone: typeof data.phone === 'string' ? data.phone : undefined,
            reputation:
              typeof data.reputationScore === 'number'
                ? data.reputationScore
                : typeof data.ratingStars === 'number'
                  ? data.ratingStars * 20
                  : undefined,
            badge: typeof data.badge === 'string' ? data.badge : undefined,
            bio: typeof data.bio === 'string' ? data.bio : undefined,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export function roleDescription(role?: string): string {
  if (role === 'farmer' || role === 'productor') return 'Productor Agrícola';
  if (role === 'buyer' || role === 'consumidor') return 'Comprador / Consumidor';
  if (role === 'cooperative') return 'Cooperativa / MIDA';
  if (role === 'auditor') return 'Auditor Certificado';
  return 'Miembro de la comunidad';
}


/** Estado “escribiendo…” compartido entre las dos cuentas. */
export async function setDirectTyping(
  conversationId: string,
  uid: string,
  typing: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, DIRECT_CHAT_COLLECTION, conversationId), {
      [`typing.${uid}`]: typing,
      [`lastSeen.${uid}`]: new Date().toISOString(),
    });
  } catch {
    // La conversación puede no existir todavía o el usuario estar offline.
  }
}

/** Latido de presencia para mostrar actividad sin exponer la ubicación. */
export async function setDirectPresence(
  conversationId: string,
  uid: string,
  online: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, DIRECT_CHAT_COLLECTION, conversationId), {
      [`lastSeen.${uid}`]: new Date().toISOString(),
      [`typing.${uid}`]: false,
    });
    if (!online) {
      await updateDoc(doc(db, DIRECT_CHAT_COLLECTION, conversationId), {
        [`lastSeen.${uid}`]: new Date().toISOString(),
      });
    }
  } catch {
    // Sin conexión se reintenta al abrir el chat.
  }
}

export interface UnreadConversation {
  id: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  lastRead?: Record<string, string>;
}

export function subscribeUnreadDirectChats(
  uid: string,
  callback: (conversations: UnreadConversation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, DIRECT_CHAT_COLLECTION),
      where('participants', 'array-contains', uid),
    ),
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => {
          const data = item.data() as DirectConversationMeta;
          return {
            id: item.id,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt,
            lastSenderId: data.lastSenderId,
            lastRead: data.lastRead,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export function countUnreadDirectChats(
  conversations: UnreadConversation[],
  uid: string,
): number {
  return conversations.filter((conversation) => {
    if (!conversation.lastSenderId || conversation.lastSenderId === uid) return false;
    if (!conversation.lastMessageAt) return false;
    const readAt = conversation.lastRead?.[uid];
    return !readAt || readAt < conversation.lastMessageAt;
  }).length;
}
