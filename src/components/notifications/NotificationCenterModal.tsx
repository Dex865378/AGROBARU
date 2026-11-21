import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Clock, 
  Send, 
  Trash2, 
  Copy, 
  Smartphone, 
  Radio, 
  Check, 
  ExternalLink,
  MessageSquare,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fcmService, PushNotificationPayload } from '@/services/fcmService';
import { useNotification } from '@/context/NotificationContext';

interface NotificationCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (route: string) => void;
  chatUnreadCount?: number;
  onOpenChat?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  open,
  onOpenChange,
  onNavigate,
  chatUnreadCount = 0,
  onOpenChat,
}) => {
  const { success, info, warning } = useNotification();
  const [notifications, setNotifications] = useState<PushNotificationPayload[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isNative, setIsNative] = useState<boolean>(false);

  const loadData = () => {
    setNotifications(fcmService.getNotificationHistory());
    setHasPermission(fcmService.hasPermission());
    setFcmToken(fcmService.getFcmToken());
    setIsNative(fcmService.isNativeAndroid());
  };

  useEffect(() => {
    if (open) {
      loadData();
      fcmService.markAllAsRead();
    }
  }, [open]);

  useEffect(() => {
    const unsub = fcmService.onNotification(() => {
      setNotifications(fcmService.getNotificationHistory());
    });
    return () => unsub();
  }, []);

  const handleCopyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      success('Token FCM Copiado', 'Identificador de dispositivo registrado en la nube.');
    }
  };

  const handleRequestPermission = async () => {
    const granted = await fcmService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      success('Permisos Concedidos', 'Las notificaciones push de Sigatoka y Órdenes están autorizadas.');
    } else {
      warning('Permiso Requerido', 'Habilita las notificaciones en los ajustes de Android para recibir alertas.');
    }
  };

  const handleTestSigatokaPush = async () => {
    await fcmService.sendSigatokaAlertPush({
      corregimiento: 'Baco',
      riskScore: 92,
      severity: 'CRITICAL',
      actionRequired: 'Aspersión inmediata de Bacillus subtilis y deshoje sanitario.',
    });
    success('Notificación Push Enviada', 'Alerta fitosanitaria de Sigatoka Negra despachada vía FCM.');
    setNotifications(fcmService.getNotificationHistory());
  };

  const handleTestOrderPush = async () => {
    await fcmService.sendBuyerOrderPush({
      orderCode: `BARU-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      buyerName: 'Grupo Rey Panamá S.A.',
      productName: 'Banano Cavendish Exportación',
      quantity: 500,
      totalPrice: 4750,
    });
    success('Notificación Push Enviada', 'Nueva orden de compra con fondos en Escrow despachada vía FCM.');
    setNotifications(fcmService.getNotificationHistory());
  };

  const handleTestBackgroundPush = (type: 'sigatoka' | 'order') => {
    setCountdown(5);
    info(
      'Prueba en Segundo Plano Activada',
      '¡Minimiza la app o presiona el botón Home ahora! La notificación llegará a la barra de estado en 5 segundos.'
    );

    if (type === 'sigatoka') {
      fcmService.scheduleBackgroundNotification(
        {
          type: 'sigatoka_alert',
          title: 'ALERTA CRÍTICA EN SEGUNDO PLANO: Brote de Sigatoka',
          body: 'Se detectó saturación de humedad en Finca Las Palmas (Barú). Inicia aspersión biológica preventiva.',
          route: 'pest-radar',
          data: { corregimiento: 'Progreso', riskScore: 95 },
        },
        5
      );
    } else {
      fcmService.scheduleBackgroundNotification(
        {
          type: 'buyer_order',
          title: 'NUEVA ORDEN EN SEGUNDO PLANO ($12,400 USD)',
          body: 'Chiriquí AgroExport reservó 1,200 cajas de Plátano Curaré Enano con pago garantizado en Escrow.',
          route: 'orders',
          data: { orderCode: 'BARU-ORD-9930', totalPrice: 12400 },
        },
        5
      );
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClearHistory = () => {
    fcmService.clearNotificationHistory();
    setNotifications([]);
    info('Bandeja Limpia', 'Historial de notificaciones vaciado.');
  };

  const handleItemClick = (notif: PushNotificationPayload) => {
    onOpenChange(false);
    if (onNavigate && notif.route) {
      onNavigate(notif.route);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        {/* Header */}
        <div className="border-b-2 border-[#15803D] pb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 bg-[#141414] border border-[#15803D] text-[#15803D] shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-bold text-base sm:text-lg text-[#E5E5E5] uppercase tracking-normal leading-snug break-words">
                Centro de Notificaciones Push (FCM)
              </h2>
              <p className="text-[11px] text-[#9E9E9E] font-mono leading-relaxed">
                Firebase Cloud Messaging // Alertas Fitosanitarias y Órdenes Escrow en Segundo Plano
              </p>
            </div>
          </div>
        </div>

        {chatUnreadCount > 0 && onOpenChat && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onOpenChat();
            }}
            className="flex w-full items-center justify-between gap-2 border border-[#10B981]/50 bg-[#10B981]/10 px-3 py-2.5 text-left hover:bg-[#10B981]/15"
          >
            <span className="flex items-center gap-2 text-[11px] font-bold text-[#ECFDF5]">
              <MessageSquare className="w-4 h-4 text-[#10B981]" />
              {chatUnreadCount} {chatUnreadCount === 1 ? 'conversación con mensajes nuevos' : 'conversaciones con mensajes nuevos'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#10B981]" />
          </button>
        )}

        {/* Status Card */}
        <div className="bg-[#141414] border border-[#1E293B] p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-pulse" />
              <span className="text-xs font-bold text-[#E5E5E5] uppercase font-mono">
                Servicio FCM: Activo
              </span>
              <Badge variant="outline" className="text-[10px] text-[#15803D] border-[#15803D]">
                {isNative ? 'Android Nativo' : 'PWA / Web Ready'}
              </Badge>
            </div>

            {!hasPermission ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRequestPermission}
                className="text-[11px] h-7"
              >
                Habilitar Notificaciones
              </Button>
            ) : (
              <span className="text-[11px] font-mono text-[#15803D] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Permiso Concedido
              </span>
            )}
          </div>

          {/* Subscribed topics */}
          <div className="pt-2 border-t border-[#1E293B] flex flex-wrap gap-2 text-[10px] font-mono text-[#CCCCCC]">
            <span className="text-[#9E9E9E]">Canales suscritos:</span>
            <span className="bg-[#0E0E0E] px-2 py-0.5 border border-[#F97316] text-[#F97316]">
              • sigatoka_alerts (Humedad foliar & plagas)
            </span>
            <span className="bg-[#0E0E0E] px-2 py-0.5 border border-[#15803D] text-[#15803D]">
              • buyer_orders (Contratos & Escrow)
            </span>
          </div>

          {/* Device token display */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 bg-[#0E0E0E] p-2 border border-[#1E293B]">
            <div className="truncate min-w-0 flex-1 text-[10px] font-mono text-[#9E9E9E]">
              <span className="text-[#CCCCCC] font-bold">Device Token:</span> {fcmToken || 'Obteniendo token...'}
            </div>
            <button
              onClick={handleCopyToken}
              className="text-[#E5E5E5] hover:text-[#15803D] flex items-center gap-1 text-[10px] font-mono shrink-0 p-1"
              title="Copiar FCM Token"
            >
              {copiedToken ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
              {copiedToken ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Action Testing Buttons */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold text-[#CCCCCC] uppercase tracking-wider">
            Simulador de Envío de Push Notifications:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSigatokaPush}
              className="border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-black justify-start text-xs font-bold"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-2 shrink-0" />
              Disparar Alerta Sigatoka (En vivo)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestOrderPush}
              className="border-[#15803D] text-[#15803D] hover:bg-[#15803D] hover:text-black justify-start text-xs font-bold"
            >
              <Package className="w-3.5 h-3.5 mr-2 shrink-0" />
              Disparar Nueva Orden Compra (En vivo)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestBackgroundPush('sigatoka')}
              className="border-[#FACC15] text-[#FACC15] hover:bg-[#FACC15] hover:text-black justify-start text-xs font-bold"
            >
              <Clock className="w-3.5 h-3.5 mr-2 shrink-0" />
              {countdown !== null ? `Minimiza ahora: ${countdown}s...` : 'Probar alerta en segundo plano (5 s)'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestBackgroundPush('order')}
              className="border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white justify-start text-xs font-bold"
            >
              <Smartphone className="w-3.5 h-3.5 mr-2 shrink-0" />
              {countdown !== null ? `Minimiza ahora: ${countdown}s...` : 'Probar orden en segundo plano (5 s)'}
            </Button>
          </div>

          <p className="text-[10px] text-[#888888] font-mono italic">
            * Al pulsar "Probar en segundo plano", minimiza la aplicación o presiona Home en Android. La notificación llegará como heads-up push en la barra del sistema.
          </p>
        </div>

        {/* Notification History List */}
        <div className="space-y-2 pt-2 border-t border-[#1E293B]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold font-mono text-[#E5E5E5] uppercase">
              Bandeja de Entrada ({notifications.length})
            </span>
            {notifications.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-[#9E9E9E] hover:text-[#F97316] flex items-center gap-1 font-mono shrink-0"
              >
                <Trash2 className="w-3 h-3" /> Limpiar bandeja
              </button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="bg-[#141414] border border-[#1E293B] p-6 text-center text-xs text-[#9E9E9E] font-mono">
                No hay notificaciones push recibidas recientemente.
              </div>
            ) : (
              notifications.map((notif) => {
                const isSigatoka = notif.type === 'sigatoka_alert';
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3 border transition-all cursor-pointer ${
                      isSigatoka
                        ? 'border-[#F97316]/50 bg-[#141414] hover:border-[#F97316]'
                        : 'border-[#15803D]/50 bg-[#141414] hover:border-[#15803D]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        {isSigatoka ? (
                          <ShieldAlert className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                        ) : (
                          <Package className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs font-bold text-[#E5E5E5] leading-snug break-words">
                          {notif.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#666666] shrink-0">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#CCCCCC] font-sans mt-1.5 pl-6">
                      {notif.body}
                    </p>

                    <div className="mt-2 pl-6 flex items-center gap-2 text-[10px] font-mono text-[#FACC15]">
                      <span>Tocar para ver en la aplicación →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#1E293B] flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
