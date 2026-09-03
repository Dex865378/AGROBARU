import { UserProfile, ReputationTier, OrderReview } from '../types';
import { db, COLLECTIONS, saveDocument } from './firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * Computes the Reputation Tier and visual badge styling
 */
export function calculateReputationTier(
  score: number = 95, 
  successfulTrades: number = 10
): {
  tier: ReputationTier;
  label: string;
  badgeColor: string;
  nameGlowClass: string;
  avatarBorderClass: string;
  levelProgressPct: number;
} {
  if (score >= 98 && successfulTrades >= 8) {
    return {
      tier: 'DIAMOND_MIDA',
      label: 'DIAMANTE MIDA // AUDITOR SUPREMO',
      badgeColor: '#15803D',
      nameGlowClass: 'text-[#15803D] drop-shadow-[0_0_8px_#15803D] font-black',
      avatarBorderClass: 'border-2 border-[#15803D] shadow-[0_0_15px_#15803D] ring-2 ring-[#FACC15] ring-offset-2 ring-offset-black animate-pulse',
      levelProgressPct: 100,
    };
  }

  if (score >= 90 && successfulTrades >= 4) {
    return {
      tier: 'GOLD',
      label: 'RANGO ORO // PRODUCTOR VERIFICADO',
      badgeColor: '#FACC15',
      nameGlowClass: 'text-[#FACC15] drop-shadow-[0_0_8px_#FACC15] font-bold',
      avatarBorderClass: 'border-2 border-[#FACC15] shadow-[0_0_12px_#FACC15] ring-1 ring-[#FACC15]',
      levelProgressPct: 85,
    };
  }

  if (score >= 75) {
    return {
      tier: 'SILVER',
      label: 'RANGO PLATA // PRODUCTOR ACTIVO',
      badgeColor: '#9E9E9E',
      nameGlowClass: 'text-[#E5E5E5]',
      avatarBorderClass: 'border-2 border-[#9E9E9E] shadow-[2px_2px_0px_0px_#9E9E9E]',
      levelProgressPct: 60,
    };
  }

  return {
    tier: 'BRONZE',
    label: 'RANGO BRONCE // NUEVO INGRESO',
    badgeColor: '#F97316',
    nameGlowClass: 'text-[#F97316]',
    avatarBorderClass: 'border border-[#F97316]',
    levelProgressPct: 30,
  };
}

/**
 * Checks if a custom username is unique in Firestore to prevent malicious duplicates
 */
export async function checkUsernameAvailability(
  username: string, 
  currentUserId: string
): Promise<{ available: boolean; message: string }> {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (cleanUsername.length < 3) {
    return { available: false, message: 'El usuario debe tener al menos 3 caracteres.' };
  }

  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    let isTakenByOther = false;
    snapshot.forEach((docSnap) => {
      if (docSnap.id !== currentUserId) {
        isTakenByOther = true;
      }
    });

    if (isTakenByOther) {
      return { available: false, message: `El identificador @${cleanUsername} ya está en uso por otro productor.` };
    }

    return { available: true, message: `¡@${cleanUsername} está disponible para tu credencial!` };
  } catch (error) {
    console.warn('Username check offline fallback:', error);
    return { available: true, message: 'Identificador asignado localmente.' };
  }
}

/**
 * Converts an image file to optimized Base64 string for instant preview & avatar persistence
 */
export async function processAvatarUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado debe ser una imagen (PNG, JPG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Error al decodificar la imagen.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(file);
  });
}
