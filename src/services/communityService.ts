import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const COMMUNITY_MESSAGES_COLLECTION = 'communityMessages';

export interface CommunityReply {
  senderName: string;
  textSnippet: string;
}

export interface CommunityMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  roleBadge: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  createdAt?: string;
  replyTo?: CommunityReply;
  likes: number;
  likedBy?: string[];
  hasLiked?: boolean;
  sticker?: string;
  reactions?: Record<string, string[]>;
}

function groupMessagesRef(groupId: string) {
  return collection(db, COMMUNITY_MESSAGES_COLLECTION, groupId, 'messages');
}

function messageRef(groupId: string, messageId: string) {
  return doc(db, COMMUNITY_MESSAGES_COLLECTION, groupId, 'messages', messageId);
}

/** Escucha en tiempo real los mensajes de un grupo. */
export function subscribeGroupMessages(
  groupId: string,
  onMessages: (messages: CommunityMessage[]) => void,
): Unsubscribe {
  return onSnapshot(
    groupMessagesRef(groupId),
    (snapshot) => {
      const messages = snapshot.docs.map((item) => ({
        ...(item.data() as Omit<CommunityMessage, 'id'>),
        id: item.id,
      }));
      messages.sort((a, b) => {
        const left = a.createdAt || a.timestamp || '';
        const right = b.createdAt || b.timestamp || '';
        return left.localeCompare(right);
      });
      onMessages(messages);
    },
    (error) => {
      console.warn('[AgroBarú] No se pudo leer la comunidad en Firestore:', error);
    },
  );
}

/** Guarda un mensaje para que lo vean los demás usuarios y sobreviva al reload. */
export async function saveCommunityMessage(
  groupId: string,
  message: CommunityMessage,
): Promise<void> {
  const { hasLiked: _hasLiked, ...payload } = message;
  await setDoc(
    messageRef(groupId, message.id),
    {
      ...payload,
      createdAt: message.createdAt || new Date().toISOString(),
      likedBy: message.likedBy || [],
    },
    { merge: true },
  );
}

/** Actualiza likes, reacciones o cualquier campo de un mensaje existente. */
export async function updateCommunityMessage(
  groupId: string,
  messageId: string,
  patch: Partial<Pick<CommunityMessage, 'likes' | 'likedBy' | 'reactions'>>,
): Promise<void> {
  await setDoc(messageRef(groupId, messageId), patch, { merge: true });
}
