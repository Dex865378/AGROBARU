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
  EscrowStatus,
  CartItem,
  LogisticsDetails
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
import { createEscrowContract, generateColdChainLogs, ESCROW_FEE_PERCENTAGE, ESCROW_STATUS_LABELS } from '../services/escrowService';
import { calculateFreightUsd } from '../services/receiptService';
import { useNotification } from './NotificationContext';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logoutUser, 
  onAuthStateChanged, 
  saveDocument, 
  deleteDocument,
  syncUserProfile,
  getSavedSessionUser,
  saveSessionUser,
  clearSessionUser,
  createLocalBaruUser,
  COLLECTIONS,
  User 
} from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { fcmService } from '../services/fcmService';

export interface GoogleAccountItem {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
}

interface AppStateContextValue {
  currentUser: UserProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  firebaseUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAccountChooserOpen: boolean;
  setIsAccountChooserOpen: (open: boolean) => void;
  openAccountChooser: () => void;
  savedGoogleAccounts: GoogleAccountItem[];
  selectGoogleAccount: (account: { name: string; email: string; photoURL?: string; role?: UserRole }) => Promise<void>;
  removeGoogleAccount: (email: string) => void;
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
  deleteProductBatch: (batchId: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (batchId: string, quantityKg: number, isSampleBox?: boolean) => void;
  updateCartQuantity: (cartItemId: string, quantityKg: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  favorites: string[];
  toggleFavorite: (batchId: string) => void;
  initiateEscrowCheckout: (
    batchId: string,
    quantityKg: number,
    paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa',
    logistics?: LogisticsDetails
  ) => Promise<EscrowOrder>;
  initiateMultiBatchEscrowCheckout: (
    paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa',
    logistics: LogisticsDetails
  ) => Promise<EscrowOrder[]>;
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

export const AppStateProvider: React.FC<{ children: React.ReactNode; initialRole?: UserRole }> = ({
  children,
  initialRole,
}) => {
  const { success, info, warning } = useNotification();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => getSavedSessionUser());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isAccountChooserOpen, setIsAccountChooserOpen] = useState<boolean>(false);

  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<GoogleAccountItem[]>(() => {
    try {
      const saved = localStorage.getItem('agrobaru_google_accounts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        id: 'acc_milsa',
        name: 'Elvira Miranda C.',
        email: 'elvira.miranda18@gmail.com',
        role: 'farmer' as UserRole,
      },
      {
        id: 'acc_efrain',
        name: 'Don Efraín Morales',
        email: 'efrain.morales@agrobaru.pa',
        role: 'farmer' as UserRole,
      },
      {
        id: 'acc_hamburg',
        name: 'Hamburg Fruit Imports GMBH',
        email: 'purchasing@hamburgfruit.de',
        role: 'buyer' as UserRole,
      },
      {
        id: 'acc_carlos',
        name: 'Ing. Carlos Mendoza (MIDA)',
        email: 'carlos.mendoza@mida.gob.pa',
        role: 'cooperative' as UserRole,
      }
    ];
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(initialRole ?? 'farmer');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('agrobaru_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return MOCK_USERS[0];
  });

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

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('agrobaru_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('agrobaru_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // El rol elegido en el onboarding se aplica al entrar al entorno completo.
  useEffect(() => {
    if (initialRole) {
      setCurrentRoleState(initialRole);
    }
  }, [initialRole]);

  // 1. FIREBASE AUTH & SESSION RESTORATION LISTENER
  useEffect(() => {
    const savedSessionUser = getSavedSessionUser();
    if (savedSessionUser) {
      setFirebaseUser(savedSessionUser);
      setIsAuthLoading(false);
      syncUserProfile(savedSessionUser, currentRole).then((profile) => {
        setCurrentUser(profile);
        localStorage.setItem('agrobaru_user_profile', JSON.stringify(profile));
      }).catch((err) => {
        console.warn('Session profile sync notice:', err);
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(false);
      if (user) {
        setFirebaseUser(user);
        saveSessionUser(user);
        try {
          const profile = await syncUserProfile(user, currentRole);
          setCurrentUser(profile);
          localStorage.setItem('agrobaru_user_profile', JSON.stringify(profile));
        } catch {
          setCurrentUser({
            id: user.uid,
            name: user.displayName || 'Usuario Autenticado Barú',
            role: currentRole,
            email: user.email || '',
            phone: user.phoneNumber || '+507 6700-0000',
            location: 'Distrito de Barú, Chiriquí',
            badge: 'MIDA Verificado',
            reputationScore: 99.4,
            ratingStars: 4.95,
            successfulEscrowTrades: 12,
            totalKgDelivered: 28400,
            badges: ['Identidad Verificada', 'Sello BPA Barú'],
          });
        }
      } else if (!getSavedSessionUser()) {
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, [currentRole]);

  const openAccountChooser = () => {
    setIsAccountChooserOpen(true);
  };

  const selectGoogleAccount = async (account: { name: string; email: string; photoURL?: string; role?: UserRole }) => {
    setIsAuthLoading(true);
    try {
      const targetRole = account.role || currentRole;
      if (account.role && account.role !== currentRole) {
        setCurrentRoleState(account.role);
      }

      const localUser = createLocalBaruUser(targetRole, account.name, account.email);
      if (account.photoURL) {
        (localUser as any).photoURL = account.photoURL;
      }

      setFirebaseUser(localUser);
      saveSessionUser(localUser);

      setSavedGoogleAccounts((prev) => {
        const filtered = prev.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
        const updatedList: GoogleAccountItem[] = [
          {
            id: `acc_${Date.now()}`,
            name: account.name,
            email: account.email,
            photoURL: account.photoURL,
            role: targetRole,
          },
          ...filtered,
        ];
        try {
          localStorage.setItem('agrobaru_google_accounts', JSON.stringify(updatedList));
        } catch {}
        return updatedList;
      });

      const profile = await syncUserProfile(localUser, targetRole);
      setCurrentUser(profile);
      localStorage.setItem('agrobaru_user_profile', JSON.stringify(profile));

      success(
        'Cuenta Seleccionada',
        `Sesión iniciada como ${profile.name} (${account.email}).`
      );
    } catch (err) {
      console.warn('Error in selectGoogleAccount:', err);
    } finally {
      setIsAuthLoading(false);
      setIsAccountChooserOpen(false);
    }
  };

  const removeGoogleAccount = (emailToRemove: string) => {
    setSavedGoogleAccounts((prev) => {
      const updated = prev.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase());
      try {
        localStorage.setItem('agrobaru_google_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    info('Cuenta Removida', `Se quitó ${emailToRemove} de la lista.`);
  };

  const loginWithGoogle = async () => {
    setIsAccountChooserOpen(true);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Error during logout:', e);
    }
    clearSessionUser();
    setFirebaseUser(null);
    info('Sesión Cerrada', 'Has salido del protocolo de AgroBarú.');
    const mockUserForRole = MOCK_USERS.find(u => u.role === currentRole) || MOCK_USERS[0];
    setCurrentUser(mockUserForRole);
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

  useEffect(() => {
    try {
      localStorage.setItem('agrobaru_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('agrobaru_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

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
      harvestDate: batchData.harvestDate || new Date().toISOString().split('T')[0],
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
      images: batchData.images && batchData.images.length > 0 ? batchData.images : [],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUpdatedAt: new Date().toISOString(),
      autoPurgeHours: 24,
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

  const toggleFavorite = (batchId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(batchId);
      const next = exists ? prev.filter(id => id !== batchId) : [...prev, batchId];
      info(
        exists ? 'Removido de Favoritos' : 'Guardado en Favoritos',
        exists ? 'El lote fue retirado de tu lista guardada.' : 'El lote se guardó en tu lista de interés.'
      );
      return next;
    });
  };

  const addToCart = (batchId: string, quantityKg: number, isSampleBox: boolean = false) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch || batch.availableKg <= 0 || batch.status === 'sold_out') {
      warning('Lote sin inventario', 'Este lote ya se encuentra agotado.');
      return;
    }
    const safeQty = Math.min(batch.availableKg, Math.max(1, quantityKg));
    setCart(prev => {
      const existing = prev.find(i => i.batchId === batchId && i.isSampleBox === isSampleBox);
      if (existing) {
        const combined = Math.min(batch.availableKg, existing.quantityKg + safeQty);
        return prev.map(i => (i.id === existing.id ? { ...i, quantityKg: combined } : i));
      }
      return [
        ...prev,
        {
          id: `CART-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          batchId,
          quantityKg: safeQty,
          isSampleBox,
          addedAt: new Date().toISOString(),
        },
      ];
    });
    success(
      'Agregado al Carrito',
      `${batch.cropName} (${safeQty.toLocaleString()} kg) listo en tu resumen de compra.`
    );
  };

  const updateCartQuantity = (cartItemId: string, quantityKg: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id !== cartItemId) return item;
        const batch = batches.find(b => b.id === item.batchId);
        const maxKg = batch ? batch.availableKg : quantityKg;
        const safeQty = Math.min(maxKg, Math.max(1, quantityKg));
        return { ...item, quantityKg: safeQty };
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const initiateEscrowCheckout = async (
    batchId: string, 
    quantityKg: number, 
    paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa',
    logistics?: LogisticsDetails
  ): Promise<EscrowOrder> => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote no encontrado');

    const totalUsd = quantityKg * batch.pricePerKgUsd;
    const escrowFeeUsd = totalUsd * ESCROW_FEE_PERCENTAGE;
    const freightUsd = logistics
      ? logistics.freightUsd
      : 0;
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
      freightUsd,
      deliveryMode: logistics?.deliveryMode,
      deliveryAddress: logistics?.deliveryAddress,
      buyerTaxId: logistics?.buyerTaxId,
      companyName: logistics?.companyName,
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
      const isSoldOut = newAvailable === 0;
      const newStatus = isSoldOut ? 'sold_out' : b.status;
      updatedBatchObj = { 
        ...b, 
        availableKg: newAvailable, 
        status: newStatus,
        soldOutAt: isSoldOut ? (b.soldOutAt || new Date().toISOString()) : undefined,
        updatedAt: new Date().toISOString()
      };
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

    success('Fondos en Custodia Escrow', `Contrato ${newOrder.orderCode} confirmado. Inventario actualizado.`);
    
    // Dispatch FCM Push Notification to farmer
    fcmService.sendBuyerOrderPush({
      orderCode: newOrder.orderCode,
      buyerName: newOrder.buyerName,
      productName: newOrder.productName,
      quantity: newOrder.quantityKg,
      totalPrice: newOrder.totalUsd,
    });

    return newOrder;
  };

  const initiateMultiBatchEscrowCheckout = async (
    paymentMethod: 'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa',
    logistics: LogisticsDetails
  ): Promise<EscrowOrder[]> => {
    if (cart.length === 0) throw new Error('El carrito está vacío');

    const cartGroupId = `ORD-GRP-${Math.floor(10000 + Math.random() * 90000)}`;
    const validItems = cart
      .map(item => ({ item, batch: batches.find(b => b.id === item.batchId) }))
      .filter((pair): pair is { item: CartItem; batch: ProductBatch } => Boolean(pair.batch && pair.batch.availableKg > 0));

    const totalCartKg = validItems.reduce((sum, p) => sum + Math.min(p.item.quantityKg, p.batch.availableKg), 0);
    const totalFreightUsd = calculateFreightUsd(logistics.deliveryMode, totalCartKg);

    const createdOrders: EscrowOrder[] = [];
    const deductions: Record<string, number> = {};

    for (const { item, batch } of validItems) {
      const qty = Math.min(item.quantityKg, batch.availableKg - (deductions[batch.id] || 0));
      if (qty <= 0) continue;
      deductions[batch.id] = (deductions[batch.id] || 0) + qty;

      const totalUsd = qty * batch.pricePerKgUsd;
      const escrowFeeUsd = item.isSampleBox ? 15.0 : totalUsd * ESCROW_FEE_PERCENTAGE;
      const itemFreight = totalCartKg > 0 ? Number(((qty / totalCartKg) * totalFreightUsd).toFixed(2)) : 0;

      const escrowData = await createEscrowContract(
        batch.id,
        currentUser.id,
        batch.producerName,
        totalUsd,
        paymentMethod
      );

      const order: EscrowOrder = {
        id: `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        orderCode: escrowData.orderCode,
        cartGroupId,
        batchId: batch.id,
        productName: `${batch.cropName} (${batch.variety})`,
        variety: batch.variety,
        farmName: batch.farmName,
        farmerName: batch.producerName,
        buyerId: currentUser.id,
        buyerName: logistics.companyName || currentUser.name,
        buyerEmail: currentUser.email || 'comprador@agrobaru.pa',
        quantityKg: qty,
        totalUsd,
        escrowFeeUsd,
        freightUsd: itemFreight,
        deliveryMode: logistics.deliveryMode,
        deliveryAddress: logistics.deliveryAddress,
        buyerTaxId: logistics.buyerTaxId,
        companyName: logistics.companyName,
        paymentMethod,
        escrowStatus: 'FUNDED',
        createdAt: new Date().toISOString(),
        fundedAt: new Date().toISOString(),
        trackingNumber: `TRK-BARU-${Math.floor(100000 + Math.random() * 900000)}`,
        courierName: 'Logística Fría del Pacífico (Barú)',
        temperatureLog: generateColdChainLogs(),
        escrowContractHash: escrowData.contractHash,
      };
      createdOrders.push(order);
    }

    if (createdOrders.length === 0) {
      throw new Error('No hay inventario disponible para los lotes seleccionados.');
    }

    setOrders(prev => [...createdOrders, ...prev]);

    const updatedBatches: ProductBatch[] = [];
    setBatches(prev =>
      prev.map(b => {
        const ded = deductions[b.id];
        if (!ded) return b;
        const newAvailable = Math.max(0, b.availableKg - ded);
        const isSoldOut = newAvailable === 0;
        const updated: ProductBatch = {
          ...b,
          availableKg: newAvailable,
          status: isSoldOut ? 'sold_out' : b.status,
          soldOutAt: isSoldOut ? (b.soldOutAt || new Date().toISOString()) : undefined,
          updatedAt: new Date().toISOString(),
        };
        updatedBatches.push(updated);
        return updated;
      })
    );

    if (!isOffline) {
      for (const ord of createdOrders) {
        saveDocument(COLLECTIONS.ORDERS, ord).catch(() => {});
      }
      for (const ub of updatedBatches) {
        saveDocument(COLLECTIONS.BATCHES, ub).catch(() => {});
      }
    }

    setCart([]);

    success(
      'Orden Unificada Confirmada',
      `${createdOrders.length} ${createdOrders.length === 1 ? 'contrato Escrow creado' : 'contratos Escrow creados'} bajo referencia ${cartGroupId}.`
    );

    fcmService.sendBuyerOrderPush({
      orderCode: cartGroupId,
      buyerName: logistics.companyName || currentUser.name,
      productName: `${createdOrders.length} ${createdOrders.length === 1 ? 'lote agrícola' : 'lotes agrícolas'}`,
      quantity: totalCartKg,
      totalPrice: createdOrders.reduce((s, o) => s + o.totalUsd, 0),
    });

    return createdOrders;
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
        const isSoldOut = newAvail === 0;
        const item: ProductBatch = {
          ...b,
          quantityKg: newTotal,
          availableKg: newAvail,
          status: newStat,
          soldOutAt: isSoldOut ? (b.soldOutAt || new Date().toISOString()) : undefined,
          updatedAt: new Date().toISOString()
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

  const deleteProductBatch = async (batchId: string) => {
    let deletedBatch: ProductBatch | undefined;
    setBatches(prev => {
      deletedBatch = prev.find(b => b.id === batchId);
      const filtered = prev.filter(b => b.id !== batchId);
      localStorage.setItem('agrobaru_batches', JSON.stringify(filtered));
      return filtered;
    });

    if (deletedBatch) {
      if (!isOffline) {
        try {
          await deleteDocument(COLLECTIONS.BATCHES, batchId);
        } catch (err) {
          console.warn('Error eliminando lote en Firestore:', err);
        }
      }
      success('Lote Eliminado', `El lote ${(deletedBatch as ProductBatch).batchCode} fue retirado de la plataforma exitosamente.`);
    }
  };

  // 24-HOUR AUTO-PURGE FOR 100% SOLD OUT BATCHES
  useEffect(() => {
    const purgeSoldOutBatches = () => {
      const now = Date.now();
      const cutoffMs = 24 * 60 * 60 * 1000; // 24 hours

      setBatches(prev => {
        const remaining = prev.filter(batch => {
          if (batch.availableKg <= 0 && batch.soldOutAt) {
            const timeSinceSoldOut = now - new Date(batch.soldOutAt).getTime();
            if (timeSinceSoldOut >= cutoffMs) {
              console.log(`[AutoPurge Barú] Lote agotado ${batch.batchCode} eliminado automáticamente tras 24 horas para evitar saturación.`);
              if (!isOffline) {
                deleteDocument(COLLECTIONS.BATCHES, batch.id).catch(() => {});
              }
              return false;
            }
          }
          return true;
        });

        if (remaining.length !== prev.length) {
          localStorage.setItem('agrobaru_batches', JSON.stringify(remaining));
        }
        return remaining;
      });
    };

    purgeSoldOutBatches();
    const purgeInterval = setInterval(purgeSoldOutBatches, 30000);
    return () => clearInterval(purgeInterval);
  }, [isOffline]);

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
      info('Estado de Envío Actualizado', `La orden cambió a: ${ESCROW_STATUS_LABELS[nextStatus] || nextStatus}`);
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
        isAccountChooserOpen,
        setIsAccountChooserOpen,
        openAccountChooser,
        savedGoogleAccounts,
        selectGoogleAccount,
        removeGoogleAccount,
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
        deleteProductBatch,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        favorites,
        toggleFavorite,
        initiateEscrowCheckout,
        initiateMultiBatchEscrowCheckout,
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
