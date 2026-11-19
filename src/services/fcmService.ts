import { db } from './firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export interface PushNotificationPayload {
  id: string;
  type: 'sigatoka_alert' | 'buyer_order' | 'system';
  title: string;
  body: string;
  timestamp: string;
  route?: string;
  data?: Record<string, any>;
  read?: boolean;
}

declare global {
  interface Window {
    AndroidNotificationBridge?: {
      getFcmToken: () => string;
      hasNotificationPermission: () => boolean;
      requestNotificationPermission: () => void;
      subscribeToTopic: (topic: string) => void;
      postNativeNotification: (type: string, title: string, body: string, route: string) => void;
      simulateBackgroundNotification: (type: string, title: string, body: string, delaySeconds: number, route: string) => void;
    };
    __onAgroBaruNotificationClicked?: (route: string, type: string) => void;
    __onAgroBaruFcmTokenReceived?: (token: string) => void;
  }
}

class FCMService {
  private fcmToken: string | null = null;
  private isAndroid: boolean = false;
  private listeners: ((payload: PushNotificationPayload) => void)[] = [];
  private navigationListeners: ((route: string) => void)[] = [];

  constructor() {
    this.isAndroid = typeof window !== 'undefined' && !!window.AndroidNotificationBridge;
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load saved token from localStorage
    this.fcmToken = localStorage.getItem('agrobaru_fcm_token');

    // Setup bridge callbacks
    window.__onAgroBaruFcmTokenReceived = (token: string) => {
      console.log('FCM Token received from Native Android Bridge:', token);
      this.setFcmToken(token);
    };

    window.__onAgroBaruNotificationClicked = (route: string, type: string) => {
      console.log('AgroBarú notification clicked:', route, type);
      this.navigationListeners.forEach((listener) => listener(route));
    };

    // If native bridge exists, fetch token and subscribe to topics
    if (window.AndroidNotificationBridge) {
      try {
        const token = window.AndroidNotificationBridge.getFcmToken();
        if (token && token.length > 5) {
          this.setFcmToken(token);
        }
        window.AndroidNotificationBridge.subscribeToTopic('sigatoka_alerts');
        window.AndroidNotificationBridge.subscribeToTopic('buyer_orders');
      } catch (e) {
        console.warn('Native FCM Bridge call error:', e);
      }
    }
  }

  public isNativeAndroid(): boolean {
    return typeof window !== 'undefined' && !!window.AndroidNotificationBridge;
  }

  public getFcmToken(): string {
    if (this.fcmToken) return this.fcmToken;
    if (window.AndroidNotificationBridge) {
      try {
        const token = window.AndroidNotificationBridge.getFcmToken();
        if (token) {
          this.setFcmToken(token);
          return token;
        }
      } catch (e) {}
    }
    // Fallback pseudo FCM token for display/web simulation
    const simulated = 'fcm_baru_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    this.setFcmToken(simulated);
    return simulated;
  }

  public setFcmToken(token: string) {
    this.fcmToken = token;
    try {
      localStorage.setItem('agrobaru_fcm_token', token);
    } catch {}
  }

  public hasPermission(): boolean {
    if (window.AndroidNotificationBridge) {
      try {
        return window.AndroidNotificationBridge.hasNotificationPermission();
      } catch {
        return true;
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return true;
  }

  public async requestPermission(): Promise<boolean> {
    if (window.AndroidNotificationBridge) {
      try {
        window.AndroidNotificationBridge.requestNotificationPermission();
        return true;
      } catch (e) {
        console.warn('Failed to call requestNotificationPermission:', e);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch {}
    }
    return true;
  }

  public onNavigation(callback: (route: string) => void) {
    this.navigationListeners.push(callback);
    return () => {
      this.navigationListeners = this.navigationListeners.filter((cb) => cb !== callback);
    };
  }

  public onNotification(callback: (payload: PushNotificationPayload) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Dispatches a push notification via Android Notification Bridge or Web Notification API
   */
  public async dispatchNotification(payload: Omit<PushNotificationPayload, 'id' | 'timestamp'>): Promise<PushNotificationPayload> {
    const fullPayload: PushNotificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...payload,
    };

    // 1. Save to local history
    this.saveNotificationToHistory(fullPayload);

    // 2. Dispatch to Native Android System Tray (Heads-up notification)
    if (window.AndroidNotificationBridge) {
      try {
        window.AndroidNotificationBridge.postNativeNotification(
          fullPayload.type,
          fullPayload.title,
          fullPayload.body,
          fullPayload.route || (fullPayload.type === 'sigatoka_alert' ? 'pest_engine' : 'orders')
        );
      } catch (e) {
        console.warn('Error in AndroidNotificationBridge.postNativeNotification:', e);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(fullPayload.title, {
          body: fullPayload.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: fullPayload.id,
        });
      } catch (e) {
        console.warn('Web Notification error:', e);
      }
    }

    // 3. Notify in-app listeners
    this.listeners.forEach((listener) => listener(fullPayload));

    return fullPayload;
  }

  /**
   * Schedule a background push notification simulation.
   * Gives the user time to press Home or minimize the app,
   * then Android system tray displays the notification!
   */
  public scheduleBackgroundNotification(
    payload: Omit<PushNotificationPayload, 'id' | 'timestamp'>,
    delaySeconds: number = 4
  ): void {
    if (window.AndroidNotificationBridge) {
      try {
        window.AndroidNotificationBridge.simulateBackgroundNotification(
          payload.type,
          payload.title,
          payload.body,
          delaySeconds,
          payload.route || (payload.type === 'sigatoka_alert' ? 'pest_engine' : 'orders')
        );
      } catch (e) {
        console.warn('Error in AndroidNotificationBridge.simulateBackgroundNotification:', e);
      }
    }

    // Also fallback timer for in-app history
    setTimeout(() => {
      const fullPayload: PushNotificationPayload = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...payload,
      };
      this.saveNotificationToHistory(fullPayload);
      this.listeners.forEach((listener) => listener(fullPayload));
    }, delaySeconds * 1000);
  }

  /**
   * Trigger real-time Sigatoka Pest Alert push notification
   */
  public async sendSigatokaAlertPush(options: {
    corregimiento: string;
    riskScore: number;
    severity?: string;
    actionRequired?: string;
  }): Promise<PushNotificationPayload> {
    const isCritical = options.riskScore >= 70;
    const title = isCritical
      ? `ALERTA CRÍTICA: Sigatoka Negra en ${options.corregimiento}`
      : `ALERTA FITOSANITARIA: Sigatoka en ${options.corregimiento}`;

    const body = `Riesgo biológico de ${options.riskScore}/100 por humedad foliar crítica. Protocolo MIDA: ${
      options.actionRequired || 'Aspersión preventiva inmediata con Bacillus subtilis y deshoje sanitario.'
    }`;

    return this.dispatchNotification({
      type: 'sigatoka_alert',
      title,
      body,
      route: 'pest-radar',
      data: {
        corregimiento: options.corregimiento,
        riskScore: options.riskScore,
        severity: options.severity || 'CRITICAL',
      },
    });
  }

  /**
   * Trigger real-time Buyer Purchase Order push notification
   */
  public async sendBuyerOrderPush(options: {
    orderCode: string;
    buyerName: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    currency?: string;
  }): Promise<PushNotificationPayload> {
    const title = `Nueva Orden de Compra: ${options.orderCode}`;
    const body = `${options.buyerName} depositó $${options.totalPrice.toLocaleString()} en custodia Escrow por ${options.quantity} kg de ${options.productName}. Toca para preparar el embarque.`;

    return this.dispatchNotification({
      type: 'buyer_order',
      title,
      body,
      route: 'orders',
      data: {
        orderCode: options.orderCode,
        buyerName: options.buyerName,
        productName: options.productName,
        quantity: options.quantity,
        totalPrice: options.totalPrice,
      },
    });
  }

  /**
   * Local notification storage
   */
  public getNotificationHistory(): PushNotificationPayload[] {
    try {
      const raw = localStorage.getItem('agrobaru_notification_history');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'init_sigatoka_1',
        type: 'sigatoka_alert',
        title: 'Alerta Sigatoka Negra: Puerto Armuelles',
        body: 'Humedad relativa sostenida 94%. Se recomienda aplicar bio-fungicida botánico preventivo antes de 24h.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        route: 'pest-radar',
        read: true,
      },
      {
        id: 'init_order_1',
        type: 'buyer_order',
        title: 'Fondos en Custodia Escrow: Contrato BARU-ORD-8821',
        body: 'Hamburg Fruit Imports GMBH reservó 450 cajas de Banano Gros Michel Orgánico ($8,550.00 USD).',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        route: 'orders',
        read: true,
      },
    ];
  }

  private saveNotificationToHistory(item: PushNotificationPayload) {
    try {
      const history = this.getNotificationHistory();
      const updated = [item, ...history.slice(0, 49)];
      localStorage.setItem('agrobaru_notification_history', JSON.stringify(updated));
    } catch {}
  }

  public markAllAsRead() {
    try {
      const history = this.getNotificationHistory();
      const updated = history.map((n) => ({ ...n, read: true }));
      localStorage.setItem('agrobaru_notification_history', JSON.stringify(updated));
    } catch {}
  }

  public clearNotificationHistory() {
    try {
      localStorage.removeItem('agrobaru_notification_history');
    } catch {}
  }
}

export const fcmService = new FCMService();
