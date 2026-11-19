export type UserRole = 'farmer' | 'buyer' | 'cooperative' | 'auditor';

export type BaruCorregimiento = 
  | 'Puerto Armuelles' 
  | 'Limones' 
  | 'Progreso' 
  | 'Baco' 
  | 'Rodolfo Aguilar Delgado';

export type ReputationTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND_MIDA';

export interface OrderReview {
  id: string;
  orderId: string;
  batchId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorPhotoURL?: string;
  authorTier?: ReputationTier;
  rating: number; // 1 to 5
  comment: string;
  qualityCompliant: boolean;
  onTimeDelivery: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username?: string; // Unique verified handle e.g. @finca_baru_01
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  location: string;
  bio?: string;
  badge?: string;
  reputationScore?: number; // 0 to 100
  reputationTier?: ReputationTier;
  ratingStars?: number;
  successfulEscrowTrades?: number;
  totalKgDelivered?: number;
  midaRegistration?: string;
  badges?: string[];
  photoURL?: string;
  memberSince?: string;
  reviews?: OrderReview[];
}

export interface Farm {
  id: string;
  name: string;
  ownerName: string;
  ownerId: string;
  corregimiento: BaruCorregimiento;
  coordinates: {
    lat: number;
    lng: number;
  };
  areaHectares: number;
  primaryCrops: string[];
  certificaciones: string[];
  verifiedByMida: boolean;
  registrationNumber: string;
  registeredDate: string;
}

export type ActivityType = 
  | 'siembra'
  | 'riego'
  | 'fertilizacion'
  | 'control_plagas'
  | 'poda'
  | 'cosecha'
  | 'inspeccion_mida';

export interface CultivationLog {
  id: string;
  farmId: string;
  farmName: string;
  cropName: string;
  activityType: ActivityType;
  date: string;
  operatorName: string;
  gpsCoords: {
    lat: number;
    lng: number;
  };
  details: string | {
    productApplied?: string;
    dosage?: string;
    waterVolumeLiters?: number;
    laborHours?: number;
    notes?: string;
  };
  quantity?: string | number;
  organicProductUsed?: string;
  evidencePhotos?: string[] | EvidenceProof[];
  cryptoHash: string;
  previousHash: string;
  synced: boolean;
}

export interface EvidenceProof {
  id: string;
  logId: string;
  farmId: string;
  photoUrl: string;
  activityName: string;
  timestamp: string;
  gpsCoords: {
    lat: number;
    lng: number;
  };
  deviceMetadata: {
    deviceModel: string;
    altitudeMeters: number;
    accuracyMeters: number;
    exifDate: string;
  };
  sha256Hash: string;
  previousHash: string;
  verifiedStatus: 'verified' | 'tampered' | 'pending';
}

export interface ProductBatch {
  id: string;
  batchCode: string;
  farmId: string;
  farmName: string;
  producerName: string;
  producerUsername?: string;
  producerReputation?: number;
  producerTier?: ReputationTier;
  corregimiento: BaruCorregimiento;
  cropName: string;
  variety: string;
  harvestDate: string;
  quantityKg: number;
  availableKg: number;
  pricePerKgUsd: number;
  certifications: string[];
  qualityGrade: 'Premium Exportación' | 'Grado A' | 'Grado B Orgánico';
  description: string;
  tags: string[];
  images: string[];
  status: 'available' | 'in_production' | 'reserved' | 'sold_out';
  originCoordinates: {
    lat: number;
    lng: number;
  };
  rootMerkleHash: string;
  totalLogsCount: number;
  reviews?: OrderReview[];
  createdAt?: string; // ISO date of when the batch was listed on the platform
  updatedAt?: string; // ISO date of last modification
  imageUpdatedAt?: string; // ISO date of when images were taken/updated
  soldOutAt?: string; // ISO date of when the batch was completely sold out (0 kg remaining)
  autoPurgeHours?: number; // Hours before auto-deletion when 100% sold out (default 24h)
}

export type EscrowStatus = 
  | 'CREATED'
  | 'FUNDED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED_PENDING_INSPECTION'
  | 'RELEASED'
  | 'DISPUTED';

export type DeliveryMode = 'pickup_armuelles' | 'national_reefer' | 'port_fob';

export interface LogisticsDetails {
  deliveryMode: DeliveryMode;
  deliveryAddress: string;
  freightUsd: number;
  buyerTaxId?: string;
  companyName?: string;
}

export interface CartItem {
  id: string;
  batchId: string;
  quantityKg: number;
  isSampleBox: boolean;
  addedAt: string;
}

export interface EscrowOrder {
  id: string;
  orderCode: string;
  cartGroupId?: string;
  batchId: string;
  productName: string;
  variety: string;
  farmName: string;
  farmerName: string;
  farmerId?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  quantityKg: number;
  totalUsd: number;
  escrowFeeUsd: number;
  freightUsd?: number;
  deliveryMode?: DeliveryMode;
  deliveryAddress?: string;
  buyerTaxId?: string;
  companyName?: string;
  paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa';
  escrowStatus: EscrowStatus;
  createdAt: string;
  fundedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  trackingNumber: string;
  courierName: string;
  temperatureLog: { time: string; tempC: number }[];
  escrowContractHash: string;
  disputeReason?: string;
  disputeEvidence?: string;
  review?: OrderReview;
}

export interface PestAlert {
  id: string;
  title: string;
  pestType: 'Sigatoka Negra (Banano)' | 'Moniliasis (Cacao)' | 'Roya del Café' | 'Inundación Río Chiriquí Viejo' | 'Ácaro Rojo';
  cropTarget: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedZones: BaruCorregimiento[];
  riskProbabilityPercentage: number;
  climaticTrigger: {
    avgTemp: number;
    humidityPct: number;
    precipitationMm: number;
    consecutiveWetHours: number;
  };
  description: string;
  agronomicProtocol: string[];
  recommendedBioTreatments: string[];
  createdAt: string;
  active: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE_LOG' | 'UPLOAD_EVIDENCE' | 'UPDATE_BATCH' | 'DISPATCH_BATCH';
  payload: any;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface DistrictMetric {
  totalProducers: number;
  totalHectares: number;
  activeBatchesCount: number;
  totalEscrowVolumeUsd: number;
  totalDirectEarningsUsd: number;
  intermediaryFeeEliminatedUsd: number;
  lossPreventedByAlertsPct: number;
  averageDeliveryDays: number;
}
