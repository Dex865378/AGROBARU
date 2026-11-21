import { addDoc, collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AdminAuditEntry {
  id: string;
  action: string;
  targetType: 'product' | 'community' | 'user' | 'settings';
  targetId: string;
  detail: string;
  adminEmail: string;
  adminUid: string;
  createdAt: string;
}

export const ADMIN_AUDIT_COLLECTION = 'adminAuditLogs';

export async function logAdminAction(
  entry: Omit<AdminAuditEntry, 'id' | 'createdAt'>,
): Promise<void> {
  try {
    await addDoc(collection(db, ADMIN_AUDIT_COLLECTION), {
      ...entry,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // La acción principal ya se ejecutó; el registro es best-effort.
  }
}

export function subscribeAdminAudit(
  callback: (entries: AdminAuditEntry[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, ADMIN_AUDIT_COLLECTION), orderBy('createdAt', 'desc'), limit(80)),
    (snapshot) =>
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AdminAuditEntry, 'id'>),
        })),
      ),
    (error) => onError?.(error),
  );
}
