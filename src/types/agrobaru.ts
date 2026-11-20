// Tipos estrictos del dominio AgroBarú (autenticación, roles y productos).
// Se mantienen separados de los tipos del prototipo público para no acoplar
// la capa de Firestore con los datos de demostración existentes.

export type UserRole = 'productor' | 'consumidor';

export type BaruCommunity =
  | 'Puerto Armuelles'
  | 'Limones'
  | 'Progreso'
  | 'Rodolfo Aguilar'
  | 'Baco'
  | 'Otro';

export const BARU_COMMUNITIES: BaruCommunity[] = [
  'Puerto Armuelles',
  'Limones',
  'Progreso',
  'Rodolfo Aguilar',
  'Baco',
  'Otro',
];

export type CropCategory =
  | 'Banano'
  | 'Café'
  | 'Cacao'
  | 'Plátano'
  | 'Palma Aceitera'
  | 'Otros';

export const CROP_CATEGORIES: CropCategory[] = [
  'Banano',
  'Café',
  'Cacao',
  'Plátano',
  'Palma Aceitera',
  'Otros',
];

export type HarvestStatus = 'disponible' | 'en_cosecha';

export const HARVEST_STATUS_LABELS: Record<HarvestStatus, string> = {
  disponible: 'Disponible ahora',
  en_cosecha: 'Próxima cosecha',
};

export type ProductUnit = 'Quintales' | 'Cajas' | 'Racimos' | 'Kg' | 'Sacos';

export const PRODUCT_UNITS: ProductUnit[] = [
  'Quintales',
  'Cajas',
  'Racimos',
  'Kg',
  'Sacos',
];

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  community: BaruCommunity;
  role: UserRole | null;
  photoURL?: string | null;
  bannerUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeoPointLiteral {
  lat: number;
  lng: number;
}

export interface Product {
  id: string;
  producerId: string;
  producerName: string;
  producerEmail: string;
  producerCommunity: BaruCommunity;
  crop: CropCategory;
  variety: string;
  quantity: number;
  unit: ProductUnit;
  priceUsd: number;
  status: HarvestStatus;
  estimatedHarvestDate: string;
  community: BaruCommunity;
  gps: GeoPointLiteral | null;
  description: string;
  traceabilityHash: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductDraft = Omit<
  Product,
  'id' | 'producerId' | 'producerName' | 'producerEmail' | 'traceabilityHash' | 'createdAt' | 'updatedAt'
>;
