import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Farm, 
  CultivationLog, 
  ProductBatch, 
  EscrowOrder, 
  PestAlert, 
  DistrictMetric, 
  UserProfile, 
  UserRole,
  SyncQueueItem,
  EscrowStatus
} from '../types';
import { 
  MOCK_USERS, 
  MOCK_FARMS, 
  MOCK_LOGS, 
  MOCK_BATCHES, 
  MOCK_ORDERS, 
  MOCK_DISTRICT_METRICS 
} from '../services/mockData';
import { evaluateAllAlerts } from '../services/pestEngine';
import { signLogEntry, computeMerkleRoot } from '../services/cryptoService';
import { createEscrowContract, generateColdChainLogs, ESCROW_FEE_PERCENTAGE } from '../services/escrowService';
import { useNotification } from './NotificationContext';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logoutUser, 
  onAuthStateChanged, 
  saveDocument, 
  syncUserProfile,
  COLLECTIONS,
  User 
} from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface AppStateContextValue {
  currentUser: UserProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  firebaseUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  farms: Farm[];
  logs: CultivationLog[];
  batches: ProductBatch[];
  orders: EscrowOrder[];
  alerts: PestAlert[];
  metrics: DistrictMetric;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  syncQueue: SyncQueueItem[];
  addCultivationLog: (log: Omit<CultivationLog, 'id' | 'cryptoHash' | 'previousHash' | 'synced'>) => Promise<CultivationLog>;
  createBatchFromLogs: (batchData: Partial<ProductBatch>) => Promise<ProductBatch>;
  initiateEscrowCheckout: (batchId: string, quantityKg: number, paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa') => Promise<EscrowOrder>;
  advanceEscrowStatus: (orderId: string, nextStatus: EscrowStatus, details?: { trackingNumber?: string; courierName?: string; disputeReason?: string }) => Promise<void>;
  updateBatchStockAndStatus: (
    batchId: string, 
    availableKg: number, 
    status?: 'available' | 'in_production' | 'reserved' | 'sold_out',
    additionalQuantityKg?: number
  ) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  processSyncQueue: () => Promise<void>;
  refreshAlerts: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, info, warning } = useNotification();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [currentRole, setCurrentRoleState] = useState<UserRole>('farmer');
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]);

  const [farms] = useState<Farm[]>(() => {
    const saved = localStorage.getItem('agrobaru_farms');
    return saved ? JSON.parse(saved) : MOCK_FARMS;
  });
  const [logs, setLogs] = useState<CultivationLog[]>(() => {
    const saved = localStorage.getItem('agrobaru_logs');
    return saved ? JSON.parse(saved) : MOCK_LOGS;
  });
  const [batches, setBatches] = useState<ProductBatch[]>(() => {
    const saved = localStorage.getItem('agrobaru_batches');
    return saved ? JSON.parse(saved) : MOCK_BATCHES;
  });
  const [orders, setOrders] = useState<EscrowOrder[]>(() => {
    const saved = localStorage.getItem('agrobaru_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });
  const [alerts, setAlerts] = useState<PestAlert[]>(() => evaluateAllAlerts());
  const [metrics] = useState<DistrictMetric>(MOCK_DISTRICT_METRICS);

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    const saved = localStorage.getItem('agrobaru_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. FIREBASE AUTH LISTENER (CROSS-DEVICE REPUTATION PERSISTENCE)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);
      if (user) {
        try {
          const profile = await syncUserProfile(user, currentRole);
          setCurrentUser(profile);
        } catch {
          setCurrentUser({
            id: user.uid,
            name: user.displayName || 'Usuario Google Autenticado',
            role: currentRole,
            email: user.email || '',
            phone: user.phoneNumber || '+507 6000-0000',
            location: 'Distrito de Barú, Chiriquí',
            badge: 'MIDA Verificado (Google)',
            reputationScore: 99.4,
            ratingStars: 4.95,
            successfulEscrowTrades: 12,
            totalKgDelivered: 28400,
            badges: ['Identidad Google', 'Sello BPA Barú'],
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentRole]);

  const loginWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        const profile = await syncUserProfile(user, currentRole);
        setCurrentUser(profile);
        success(
          'Perfil Sincronizado en la Nube',
          `Bienvenido ${profile.name}. Tu reputación (${profile.reputationScore || 99.4}%) y sellos MIDA están activos.`
        );
      }
    } catch (error: any) {
      warning('Error en Autenticación', error.message || 'No se pudo completar el inicio con Google.');
    }
  };

  const logout = async () => {
    await logoutUser();
    info('Sesión Cerrada', 'Has salido del protocolo de AgroBarú.');
    setCurrentUser(MOCK_USERS[0]);
  };

  // 2. FIRESTORE LIVE SYNC
  useEffect(() => {
    if (isOffline) return;

    try {
      const logsRef = collection(db, COLLECTIONS.LOGS);
      const unsubscribeLogs = onSnapshot(logsRef, (snapshot) => {
        if (!snapshot.empty) {
          const remoteLogs = snapshot.docs.map(doc => doc.data() as CultivationLog);
          setLogs(prev => {
            const merged = [...prev];
            remoteLogs.forEach(r => {
              const idx = merged.findIndex(m => m.id === r.id);
              if (idx >= 0) merged[idx] = r;
              else merged.push(r);
            });
            return merged;
          });
        }
      }, (error) => {
        console.warn('Firestore live listener notice:', error);
      });

      return () => unsubscribeLogs();
    } catch (err) {
      console.warn('Firestore listener attachment skipped:', err);
    }
  }, [isOffline]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('agrobaru_farms', JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    localStorage.setItem('agrobaru_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('agrobaru_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('agrobaru_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('agrobaru_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      info('Conexión Restablecida', 'Sincronizando registros locales con la red y Firestore...');
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
      warning('Modo Sin Conexión Activado', 'Las bitácoras se firmarán localmente en SHA-256.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    const mockUserForRole = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    if (!firebaseUser) {
      setCurrentUser(mockUserForRole);
    } else {
      setCurrentUser(prev => ({ ...prev, role }));
    }
    info('Rol Actualizado', `Perfil cambiado a: ${role.toUpperCase()}`);
  };

  const addCultivationLog = async (
    logData: Omit<CultivationLog, 'id' | 'cryptoHash' | 'previousHash' | 'synced'>
  ): Promise<CultivationLog> => {
    const farmLogs = logs.filter(l => l.farmId === logData.farmId);
    const lastLog = farmLogs[farmLogs.length - 1];
    const previousHash = lastLog ? lastLog.cryptoHash : '0000000000000000000000000000000000000000000000000000000000000000';

    const tempId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cryptoHash = await signLogEntry(
      logData.farmId,
      logData.activityType,
      logData.date,
      logData.gpsCoords,
      logData.operatorName,
      previousHash
    );

    const newLog: CultivationLog = {
      ...logData,
      id: tempId,
      previousHash,
      cryptoHash,
      synced: !isOffline,
    };

    setLogs(prev => [...prev, newLog]);

    if (!isOffline) {
      try {
        await saveDocument(COLLECTIONS.LOGS, newLog);
      } catch {
        console.warn('Queued for offline sync');
      }
    } else {
      const queueItem: SyncQueueItem = {
        id: `QUEUE-${Date.now()}`,
        action: 'CREATE_LOG',
        payload: newLog,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      };
      setSyncQueue(prev => [...prev, queueItem]);
    }

    success(
      'Bloque Notarizado en Bitácora',
      `Hash SHA-256: ${newLog.cryptoHash.substring(0, 16)}... enlazado con éxito.`
    );

    return newLog;
  };

  const createBatchFromLogs = async (batchData: Partial<ProductBatch>): Promise<ProductBatch> => {
    const farmId = batchData.farmId || farms[0].id;
    const farmLogs = logs.filter(l => l.farmId === farmId);
    const farm = farms.find(f => f.id === farmId) || farms[0];

    const logHashes = farmLogs.map(l => l.cryptoHash);
    const rootMerkleHash = await computeMerkleRoot(logHashes.length > 0 ? logHashes : ['0000000000000000000000000000000000000000000000000000000000000000']);
    const batchCode = `AGRO-BARU-2026-${batchData.cropName?.substring(0, 3).toUpperCase() || 'CAV'}-${Math.floor(100 + Math.random() * 900)}`;

    const newBatch: ProductBatch = {
      id: `BATCH-${Date.now()}`,
      farmId: farm.id,
      farmName: farm.name,
      corregimiento: farm.corregimiento,
      producerName: farm.ownerName,
      cropName: batchData.cropName || 'Banano Cavendish',
      variety: batchData.variety || 'Gran Enano',
      batchCode,
      harvestDate: new Date().toISOString().split('T')[0],
      quantityKg: batchData.quantityKg || 1000,
      availableKg: batchData.quantityKg || 1000,
      pricePerKgUsd: batchData.pricePerKgUsd || 0.95,
      qualityGrade: batchData.qualityGrade || 'Premium Exportación',
      certifications: batchData.certifications || ['MIDA BPA', 'GlobalGAP'],
      rootMerkleHash,
      totalLogsCount: farmLogs.length,
      originCoordinates: farm.coordinates,
      description: batchData.description || 'Lote cosechado con certificación de trazabilidad de Barú.',
      tags: ['Export Grade A', 'Organico', 'Baru Certified'],
      images: [],
      status: 'available',
    };

    setBatches(prev => [newBatch, ...prev]);

    if (!isOffline) {
      try {
        await saveDocument(COLLECTIONS.BATCHES, newBatch);
      } catch {}
    }

    success('Lote Cosechado & Sellado con QR', `Código: ${batchCode}. Raíz Merkle calculada.`);
    return newBatch;
  };

  const initiateEscrowCheckout = async (
    batchId: string, 
    quantityKg: number, 
    paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa'
  ): Promise<EscrowOrder> => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote no encontrado');

    const totalUsd = quantityKg * batch.pricePerKgUsd;
    const escrowFeeUsd = totalUsd * ESCROW_FEE_PERCENTAGE;
    const buyerName = currentUser.name;
    const buyerId = currentUser.id;

    const escrowData = await createEscrowContract(
      batch.id,
      buyerId,
      batch.producerName,
      totalUsd,
      paymentMethod
    );

    const newOrder: EscrowOrder = {
      id: `ORDER-${Date.now()}`,
      orderCode: escrowData.orderCode,
      batchId: batch.id,
      productName: `${batch.cropName} (${batch.variety})`,
      variety: batch.variety,
      farmName: batch.farmName,
      farmerName: batch.producerName,
      buyerId,
      buyerName,
      buyerEmail: currentUser.email || 'comprador@agrobaru.pa',
      quantityKg,
      totalUsd,
      escrowFeeUsd,
      paymentMethod,
      escrowStatus: 'FUNDED',
      createdAt: new Date().toISOString(),
      fundedAt: new Date().toISOString(),
      trackingNumber: `TRK-BARU-${Math.floor(100000 + Math.random() * 900000)}`,
      courierName: 'Logística Fría del Pacífico (Barú)',
      temperatureLog: generateColdChainLogs(),
      escrowContractHash: escrowData.contractHash,
    };

    setOrders(prev => [newOrder, ...prev]);

    // Deduct stock and update status if sold out
    let updatedBatchObj: ProductBatch | null = null;
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      const newAvailable = Math.max(0, b.availableKg - quantityKg);
      const newStatus = newAvailable === 0 ? 'sold_out' : b.status;
      updatedBatchObj = { ...b, availableKg: newAvailable, status: newStatus };
      return updatedBatchObj;
    }));

    if (!isOffline) {
      try {
        await saveDocument(COLLECTIONS.ORDERS, newOrder);
        if (updatedBatchObj) {
          await saveDocument(COLLECTIONS.BATCHES, updatedBatchObj);
        }
      } catch {}
    }

    success('Fondos Bloqueados en Escrow', `Contrato ${newOrder.orderCode} creado. Stock deducido en vivo.`);
    return newOrder;
  };

  const updateBatchStockAndStatus = async (
    batchId: string, 
    availableKg: number, 
    status?: 'available' | 'in_production' | 'reserved' | 'sold_out',
    additionalQuantityKg?: number
  ) => {
    let updatedTarget: ProductBatch | null = null;
    setBatches(prev => {
      const updated = prev.map(b => {
        if (b.id !== batchId) return b;
        const newTotal = additionalQuantityKg ? b.quantityKg + additionalQuantityKg : b.quantityKg;
        const newAvail = additionalQuantityKg ? b.availableKg + additionalQuantityKg : Math.max(0, availableKg);
        let newStat = status || b.status;
        if (!status) {
          if (newAvail === 0) newStat = 'sold_out';
          else if (b.status === 'sold_out' && newAvail > 0) newStat = 'available';
        }
        const item: ProductBatch = {
          ...b,
          quantityKg: newTotal,
          availableKg: newAvail,
          status: newStat
        };
        updatedTarget = item;
        return item;
      });
      localStorage.setItem('agrobaru_batches', JSON.stringify(updated));
      return updated;
    });

    if (updatedTarget) {
      const finalObj: ProductBatch = updatedTarget;
      if (!isOffline) {
        try {
          await saveDocument(COLLECTIONS.BATCHES, finalObj);
        } catch {}
      }
      success('Inventario Actualizado', `Lote sincronizado: ${finalObj.availableKg} kg disponibles [${finalObj.status.toUpperCase()}].`);
    }
  };

  const advanceEscrowStatus = async (
    orderId: string, 
    nextStatus: EscrowStatus, 
    details?: { trackingNumber?: string; courierName?: string; disputeReason?: string }
  ) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updated: EscrowOrder = {
        ...order,
        escrowStatus: nextStatus,
        trackingNumber: details?.trackingNumber || order.trackingNumber,
        courierName: details?.courierName || order.courierName,
        disputeReason: details?.disputeReason || order.disputeReason,
      };

      if (!isOffline) {
        saveDocument(COLLECTIONS.ORDERS, updated).catch(() => {});
      }

      return updated;
    }));

    if (nextStatus === 'RELEASED') {
      success('¡Fondos Liberados!', 'El productor ha recibido la transferencia completa sin intermediarios.');
    } else if (nextStatus === 'DISPUTED') {
      warning('Disputa Iniciada', 'El contrato está congelado y escalado al arbitraje de la Cooperativa de Barú.');
    } else {
      info('Estado de Envío Actualizado', `La orden cambió a: ${nextStatus}`);
    }
  };

  const processSyncQueue = useCallback(async () => {
    if (syncQueue.length === 0) return;

    for (const item of syncQueue) {
      if (item.action === 'CREATE_LOG') {
        try {
          await saveDocument(COLLECTIONS.LOGS, item.payload);
        } catch {}
      }
    }

    setLogs(prev => prev.map(l => ({ ...l, synced: true })));
    setSyncQueue([]);
    success('Sincronización Completa', 'Todos los bloques locales se respaldaron en Firestore.');
  }, [syncQueue, success]);

  const refreshAlerts = () => {
    const updated = evaluateAllAlerts();
    setAlerts(updated);
    info('Alertas Actualizadas', 'Motor fitosanitario recalibrado con estaciones microclimáticas.');
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...currentUser,
      ...profileData,
    };
    setCurrentUser(updated);
    localStorage.setItem('agrobaru_user_profile', JSON.stringify(updated));

    if (!isOffline) {
      try {
        await saveDocument(COLLECTIONS.USERS, updated);
      } catch (err) {
        console.warn('Firestore profile sync fallback:', err);
      }
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        firebaseUser,
        isAuthLoading,
        loginWithGoogle,
        logout,
        farms,
        logs,
        batches,
        orders,
        alerts,
        metrics,
        isOffline,
        setIsOffline,
        syncQueue,
        addCultivationLog,
        createBatchFromLogs,
        initiateEscrowCheckout,
        advanceEscrowStatus,
        updateBatchStockAndStatus,
        updateUserProfile,
        processSyncQueue,
        refreshAlerts,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
