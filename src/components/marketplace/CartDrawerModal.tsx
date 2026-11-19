import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  MapPin,
  Lock,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Download,
  Building2,
  Smartphone,
  CreditCard,
  X,
  Package,
  Globe2,
  FileText
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { DeliveryMode, EscrowOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DELIVERY_MODE_LABELS,
  calculateFreightUsd,
  downloadOrderReceipt
} from '@/services/receiptService';
import { ESCROW_FEE_PERCENTAGE } from '@/services/escrowService';
import { QRCodeSVG } from 'qrcode.react';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrdersCreated?: () => void;
  onExploreMarketplace?: () => void;
}

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY';

const exchangeRates: Record<Currency, { rate: number; symbol: string }> = {
  USD: { rate: 1.0, symbol: '$' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.79, symbol: '£' },
  JPY: { rate: 154.5, symbol: '¥' },
};

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  onOrdersCreated,
  onExploreMarketplace,
}) => {
  const {
    cart,
    batches,
    currentUser,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    initiateMultiBatchEscrowCheckout,
  } = useAppState();

  const [step, setStep] = useState<'CART' | 'CHECKOUT' | 'SUCCESS'>('CART');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup_armuelles');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>(currentUser.name || '');
  const [buyerTaxId, setBuyerTaxId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa'>('Yappy Comercial');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<EscrowOrder[]>([]);

  const resolvedItems = useMemo(() => {
    return cart
      .map(item => ({
        item,
        batch: batches.find(b => b.id === item.batchId),
      }))
      .filter((pair): pair is { item: typeof cart[number]; batch: NonNullable<typeof pair.batch> } => Boolean(pair.batch));
  }, [cart, batches]);

  const totalKg = resolvedItems.reduce((sum, { item }) => sum + item.quantityKg, 0);
  const subtotalUsd = resolvedItems.reduce((sum, { item, batch }) => sum + item.quantityKg * batch.pricePerKgUsd, 0);
  const escrowFeeUsd = resolvedItems.reduce(
    (sum, { item, batch }) => sum + (item.isSampleBox ? 15.0 : item.quantityKg * batch.pricePerKgUsd * ESCROW_FEE_PERCENTAGE),
    0
  );
  const hasSampleBox = resolvedItems.some(({ item }) => item.isSampleBox);
  const freightUsd = calculateFreightUsd(deliveryMode, totalKg);
  const grandTotalUsd = subtotalUsd + escrowFeeUsd + freightUsd;

  const currentRate = exchangeRates[currency];
  const convertedTotal = (grandTotalUsd * currentRate.rate).toFixed(currency === 'JPY' ? 0 : 2);
  const yappyPayload = `yappy://pay?merchant=AGROBARU_PANAMA&amount=${grandTotalUsd.toFixed(2)}&ref=MULTI-${resolvedItems.length}`;

  if (!isOpen) return null;

  const handleConfirmUnifiedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedItems.length === 0) return;

    setIsProcessing(true);
    try {
      const orders = await initiateMultiBatchEscrowCheckout(paymentMethod, {
        deliveryMode,
        deliveryAddress:
          deliveryMode === 'pickup_armuelles'
            ? 'Centro de Acopio Cooperativa Barú, Puerto Armuelles'
            : deliveryAddress.trim() || 'Por confirmar con logística',
        freightUsd,
        companyName: companyName.trim() || currentUser.name,
        buyerTaxId: buyerTaxId.trim() || undefined,
      });
      setCreatedOrders(orders);
      setStep('SUCCESS');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseDrawer = () => {
    if (step === 'SUCCESS') {
      setStep('CART');
      setCreatedOrders([]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm font-sans">
      <div className="fixed inset-0" onClick={handleCloseDrawer} />

      <div className="relative z-50 w-full max-w-lg bg-[#0E1411] border-l border-emerald-500/25 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/15 bg-[#0B100D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-100">
                {step === 'CART'
                  ? 'Resumen de Compra Multi-Lote'
                  : step === 'CHECKOUT'
                  ? 'Entrega y Pago Protegido'
                  : 'Orden Confirmada en Custodia'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'SUCCESS'
                  ? `${createdOrders.length} ${createdOrders.length === 1 ? 'contrato generado' : 'contratos generados'} con respaldo Escrow`
                  : `${resolvedItems.length} ${resolvedItems.length === 1 ? 'lote seleccionado' : 'lotes seleccionados'} • ${totalKg.toLocaleString()} kg totales`}
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseDrawer}
            className="p-1.5 rounded-lg bg-[#161F1A] border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Cerrar carrito"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Indicator */}
        {step !== 'SUCCESS' && (
          <div className="px-5 py-2.5 bg-[#111714] border-b border-slate-800/80 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setStep('CART')}
              className={`font-semibold px-2.5 py-1 rounded-md transition-colors ${
                step === 'CART'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Lotes ({resolvedItems.length})
            </button>
            <span className="text-slate-600">/</span>
            <button
              type="button"
              disabled={resolvedItems.length === 0}
              onClick={() => setStep('CHECKOUT')}
              className={`font-semibold px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 ${
                step === 'CHECKOUT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Logística y Pago
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {step === 'CART' && (
            <>
              {resolvedItems.length === 0 ? (
                <div className="py-14 text-center space-y-3 border border-dashed border-slate-800 rounded-xl bg-[#111714]/60 p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-200">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Agrega uno o varios lotes del mercado para unificar el transporte, revisar el costo total y pagar en una sola transacción protegida.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      handleCloseDrawer();
                      onExploreMarketplace?.();
                    }}
                  >
                    Explorar Cosechas Disponibles
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resolvedItems.map(({ item, batch }) => {
                    const lineTotal = item.quantityKg * batch.pricePerKgUsd;
                    const boxesCount = (item.quantityKg / 18.14).toFixed(1);
                    return (
                      <div
                        key={item.id}
                        className="bg-[#131A16] border border-emerald-500/20 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                                {batch.batchCode}
                              </span>
                              {item.isSampleBox && (
                                <Badge variant="yellow">Caja Muestra</Badge>
                              )}
                            </div>
                            <h4 className="font-display font-bold text-sm text-slate-100 break-words">
                              {batch.cropName} — {batch.variety}
                            </h4>
                            <p className="text-xs text-slate-400 break-words">
                              {batch.farmName} • {batch.producerName}
                            </p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            title="Quitar del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={item.isSampleBox || item.quantityKg <= 18}
                              onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantityKg - 50))}
                              title="Reducir 50 kg"
                              aria-label="Reducir 50 kg"
                              className="w-7 h-7 rounded-md bg-[#0B100D] border border-slate-700 flex items-center justify-center text-slate-300 hover:border-emerald-500 disabled:opacity-40"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-24">
                              <Input
                                type="number"
                                min={1}
                                max={batch.availableKg}
                                disabled={item.isSampleBox}
                                value={item.quantityKg}
                                onChange={(e) => updateCartQuantity(item.id, parseFloat(e.target.value) || 1)}
                                className="h-8 text-center font-mono text-xs font-semibold"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={item.isSampleBox || item.quantityKg >= batch.availableKg}
                              onClick={() => updateCartQuantity(item.id, Math.min(batch.availableKg, item.quantityKg + 50))}
                              title="Aumentar 50 kg"
                              aria-label="Aumentar 50 kg"
                              className="w-7 h-7 rounded-md bg-[#0B100D] border border-slate-700 flex items-center justify-center text-slate-300 hover:border-emerald-500 disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono">
                              kg (~{boxesCount} cajas)
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-emerald-400">
                              ${lineTotal.toFixed(2)} USD
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ${batch.pricePerKgUsd.toFixed(2)}/kg • Disp: {batch.availableKg.toLocaleString()} kg
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                    >
                      Vaciar carrito
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'CHECKOUT' && (
            <form id="unified-checkout-form" onSubmit={handleConfirmUnifiedOrder} className="space-y-4">
              {/* Currency Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#131A16] p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                  <span>Moneda de Visualización</span>
                </div>
                <div className="flex items-center gap-1">
                  {(['USD', 'EUR', 'GBP', 'JPY'] as Currency[]).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setCurrency(cur)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-all ${
                        currency === cur
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#0B100D] text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Modalidad de Entrega y Logística
                </label>
                <div className="space-y-2">
                  {(Object.keys(DELIVERY_MODE_LABELS) as DeliveryMode[]).map((mode) => {
                    const info = DELIVERY_MODE_LABELS[mode];
                    const modeFreight = calculateFreightUsd(mode, totalKg);
                    const isSelected = deliveryMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDeliveryMode(mode)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100'
                            : 'bg-[#131A16] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Truck className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <div>
                            <div className="text-xs font-semibold">{info.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{info.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                          {modeFreight === 0 ? 'Gratis' : `$${modeFreight.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {deliveryMode !== 'pickup_armuelles' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Dirección de Bodega o Terminal Portuaria *
                  </label>
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={
                      deliveryMode === 'port_fob'
                        ? 'Ej. Puerto de Balboa, Muelle 14, Contenedor Reefer'
                        : 'Ej. Merca Panamá, Nave B, Puesto 22, Ciudad de Panamá'
                    }
                    required
                  />
                </div>
              )}

              {/* Billing Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre o Razón Social
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Empresa o Comprador"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    RUC / Cédula (Para Comprobante)
                  </label>
                  <Input
                    value={buyerTaxId}
                    onChange={(e) => setBuyerTaxId(e.target.value)}
                    placeholder="Ej. 1556982-1-642123 DV 44"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Canal de Pago Protegido
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Yappy Comercial', label: 'Yappy Comercial', Icon: Smartphone },
                    { id: 'ACH Transfer Directa', label: 'ACH Banco General', Icon: Building2 },
                    { id: 'Nequi Panamá', label: 'Nequi Panamá', Icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.Icon;
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          active
                            ? 'bg-emerald-500/15 border-emerald-500 text-slate-100'
                            : 'bg-[#131A16] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="text-[11px] font-semibold leading-snug">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'Yappy Comercial' && (
                <div className="bg-[#0B100D] border border-emerald-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>Escanea con Banco General / Yappy</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Comercio verificado: <strong>@agrobaru_panama</strong>
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      Monto protegido en custodia Escrow
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg shrink-0">
                    <QRCodeSVG value={yappyPayload} size={60} />
                  </div>
                </div>
              )}
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="py-4 space-y-5">
              <div className="bg-[#131A16] border border-emerald-500/35 rounded-xl p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-100">
                    Fondos Asegurados en Custodia
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono font-semibold mt-1 break-all">
                    Referencia Unificada: {createdOrders[0]?.cartGroupId || createdOrders[0]?.orderCode}
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Los productores han sido notificados para preparar el despacho. El dinero permanecerá resguardado hasta que confirmes la recepción conforme.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Contratos Generados ({createdOrders.length})
                </div>
                {createdOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#131A16] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-bold text-emerald-400">{ord.orderCode}</div>
                      <div className="text-slate-300 font-medium break-words">{ord.productName}</div>
                      <div className="text-[11px] text-slate-500 break-words">{ord.farmName}</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="font-bold text-slate-100">${ord.totalUsd.toFixed(2)}</div>
                      <div className="text-[11px] text-slate-400">{ord.quantityKg.toLocaleString()} kg</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => downloadOrderReceipt(createdOrders)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Descargar Comprobante / Proforma</span>
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    handleCloseDrawer();
                    onOrdersCreated?.();
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ir a Mis Contratos y Seguimiento</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Summary */}
        {step !== 'SUCCESS' && resolvedItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-emerald-500/20 bg-[#0B100D] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Productos ({totalKg.toLocaleString()} kg)</span>
                <span className="font-mono text-slate-200">${subtotalUsd.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{hasSampleBox ? 'Envío de muestra + Custodia Escrow' : 'Protección Escrow y Verificación MIDA'}</span>
                <span className="font-mono text-emerald-400">${escrowFeeUsd.toFixed(2)} USD</span>
              </div>
              {step === 'CHECKOUT' && (
                <div className="flex justify-between text-slate-400">
                  <span>Flete Logístico Estimado</span>
                  <span className="font-mono text-slate-200">
                    {freightUsd === 0 ? 'Sin costo' : `$${freightUsd.toFixed(2)} USD`}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-slate-100">
                <span>Total en Custodia ({currency})</span>
                <span className="font-mono text-amber-300">
                  {currentRate.symbol}{convertedTotal} {currency}
                </span>
              </div>
            </div>

            {step === 'CART' ? (
              <Button
                type="button"
                variant="default"
                onClick={() => setStep('CHECKOUT')}
                className="w-full flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Continuar a Entrega y Pago</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('CART')}
                  className="shrink-0"
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  form="unified-checkout-form"
                  variant="default"
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Procesando...' : 'Confirmar Orden Protegida'}</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
