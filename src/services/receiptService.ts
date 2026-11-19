import { DeliveryMode, EscrowOrder } from '@/types';

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, { title: string; subtitle: string; ratePerKg: number; minFee: number }> = {
  pickup_armuelles: {
    title: 'Retiro en Centro de Acopio (Puerto Armuelles)',
    subtitle: 'Sin cargo de flete. Pesaje certificado en báscula calibrada.',
    ratePerKg: 0,
    minFee: 0,
  },
  national_reefer: {
    title: 'Envío Nacional Refrigerado (Panamá / David / Colón)',
    subtitle: 'Transporte refrigerado a 13.5 °C puerta a puerta.',
    ratePerKg: 0.06,
    minFee: 25,
  },
  port_fob: {
    title: 'Entrega Puerto FOB (Balboa / Cristóbal)',
    subtitle: 'Logística refrigerada directa a terminal de exportación.',
    ratePerKg: 0.04,
    minFee: 35,
  },
};

export function calculateFreightUsd(mode: DeliveryMode, totalKg: number): number {
  const cfg = DELIVERY_MODE_LABELS[mode];
  if (!cfg || cfg.ratePerKg === 0 || totalKg <= 0) return 0;
  return Math.max(cfg.minFee, Number((totalKg * cfg.ratePerKg).toFixed(2)));
}

export function generateReceiptHtml(orders: EscrowOrder[]): string {
  const primary = orders[0];
  if (!primary) return '';

  const subtotalUsd = orders.reduce((acc, o) => acc + o.totalUsd, 0);
  const escrowFeeUsd = orders.reduce((acc, o) => acc + o.escrowFeeUsd, 0);
  const freightUsd = orders.reduce((acc, o) => acc + (o.freightUsd || 0), 0);
  const grandTotal = subtotalUsd + escrowFeeUsd + freightUsd;

  const deliveryLabel = primary.deliveryMode
    ? DELIVERY_MODE_LABELS[primary.deliveryMode]?.title
    : 'Acopio Puerto Armuelles / Logística Barú';

  const rowsHtml = orders
    .map(
      (o) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${o.orderCode}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
          <div>${o.productName}</div>
          <div style="font-size:11px;color:#64748b;">Finca: ${o.farmName} (${o.farmerName})</div>
        </td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${o.quantityKg.toLocaleString()} kg</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">$${o.totalUsd.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante Escrow ${primary.cartGroupId || primary.orderCode} - AgroBarú</title>
</head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:32px;">
  <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
    <div style="background:#0b130e;color:#f8fafc;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #16a34a;">
      <div>
        <div style="font-size:20px;font-weight:800;letter-spacing:0.04em;">AGRO<span style="color:#22c55e;">BARÚ</span></div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Comprobante Oficial de Compra y Custodia Escrow • Barú, Chiriquí, Panamá</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#94a3b8;">REFERENCIA</div>
        <div style="font-size:14px;font-weight:700;font-family:monospace;">${primary.cartGroupId || primary.orderCode}</div>
        <div style="font-size:11px;color:#22c55e;">Fecha: ${new Date(primary.createdAt).toLocaleString('es-PA')}</div>
      </div>
    </div>

    <div style="padding:24px 28px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;font-size:12px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
          <div style="font-weight:700;color:#475569;text-transform:uppercase;font-size:10px;margin-bottom:6px;">Datos del Comprador / Facturación</div>
          <div><strong>Razón Social:</strong> ${primary.companyName || primary.buyerName}</div>
          <div><strong>Correo:</strong> ${primary.buyerEmail}</div>
          ${primary.buyerTaxId ? `<div><strong>RUC / Cédula:</strong> ${primary.buyerTaxId}</div>` : ''}
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
          <div style="font-weight:700;color:#475569;text-transform:uppercase;font-size:10px;margin-bottom:6px;">Logística y Pago Protegido</div>
          <div><strong>Entrega:</strong> ${deliveryLabel}</div>
          ${primary.deliveryAddress ? `<div><strong>Destino:</strong> ${primary.deliveryAddress}</div>` : ''}
          <div><strong>Método de Pago:</strong> ${primary.paymentMethod}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:#f1f5f9;color:#334155;text-align:left;font-size:11px;text-transform:uppercase;">
            <th style="padding:10px;">Contrato</th>
            <th style="padding:10px;">Lote y Productor</th>
            <th style="padding:10px;text-align:right;">Cantidad</th>
            <th style="padding:10px;text-align:right;">Subtotal USD</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-left:auto;max-width:300px;font-size:13px;space-y:6px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#475569;">
          <span>Subtotal Productos:</span>
          <span>$${subtotalUsd.toFixed(2)} USD</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#475569;">
          <span>Custodia Escrow y Verificación MIDA:</span>
          <span>$${escrowFeeUsd.toFixed(2)} USD</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#475569;">
          <span>Logística / Flete Estimado:</span>
          <span>$${freightUsd.toFixed(2)} USD</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0 0 0;margin-top:6px;border-top:2px solid #0f172a;font-size:16px;font-weight:800;color:#15803d;">
          <span>Total en Custodia:</span>
          <span>$${grandTotal.toFixed(2)} USD</span>
        </div>
      </div>

      <div style="margin-top:24px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:11px;color:#166534;">
        <strong>Garantía de Custodia AgroBarú:</strong> Los fondos permanecen resguardados hasta confirmar la recepción física y el pesaje conforme en destino. Sello criptográfico de contrato: <span style="font-family:monospace;">${primary.escrowContractHash}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadOrderReceipt(orders: EscrowOrder[]) {
  if (!orders.length) return;
  const html = generateReceiptHtml(orders);
  const ref = orders[0].cartGroupId || orders[0].orderCode;

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comprobante-AgroBaru-${ref}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }
}
