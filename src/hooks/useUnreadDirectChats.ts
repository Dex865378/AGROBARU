import { useEffect, useState } from 'react';
import {
  countUnreadDirectChats,
  subscribeUnreadDirectChats,
} from '@/services/chatService';

/** Cantidad de conversaciones con mensajes nuevos para la cuenta activa. */
export function useUnreadDirectChats(uid?: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      return;
    }

    return subscribeUnreadDirectChats(
      uid,
      (conversations) => setCount(countUnreadDirectChats(conversations, uid)),
      () => setCount(0),
    );
  }, [uid]);

  return count;
}
