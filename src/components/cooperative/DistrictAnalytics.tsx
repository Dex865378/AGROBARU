import React from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Download,
  FileCheck2
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

const CORREGIMIENTOS = [
  { name: 'Puerto Armuelles', crop: 'Banano Cavendish Exportación', farms: 18, ha: 48.5, status: 'CONTROLADO' },
  { name: 'Limones', crop: 'Cacao Criollo & Palma Aceitera', farms: 12, ha: 34.0, status: 'ÓPTIMO' },
  { name: 'Progreso', crop: 'Plátano Curaré & Granos', farms: 15, ha: 41.2, status: 'MONITOREO' },
  { name: 'Baco', crop: 'Palma Aceitera & Arroz', farms: 9, ha: 28.0, status: 'ALERTA RÍO' },
  { name: 'Rodolfo Aguilar Delgado', crop: 'Banano Cavendish & Café Robusta', farms: 14, ha: 37.8, status: 'CONTROLADO' },
];

const statusBadgeClass = (status: string) =>
  status === 'ÓPTIMO' || status === 'CONTROLADO'
    ? 'bg-[#15803D]/20 text-[#15803D] border border-[#15803D]'
    : status === 'MONITOREO'
    ? 'bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]'
    : 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]';


export const DistrictAnalytics: React.FC = () => {
  const { metrics, farms } = useAppState();

  const handleDownloadMidaReport = () => {
    const rows: string[][] = [
      ['INFORME CONSOLIDADO MIDA & COOPERATIVAS DE BARÚ'],
      ['Generado', new Date().toLocaleString('es-PA')],
      [],
      ['MÉTRICAS CONSOLIDADAS'],
      ['Volumen total en Escrow (USD)', metrics.totalEscrowVolumeUsd.toFixed(2)],
      ['Ahorro por intermediación (USD)', metrics.intermediaryFeeEliminatedUsd.toFixed(2)],
      ['Superficie auditada (ha)', metrics.totalHectares.toFixed(1)],
      ['Pérdidas evitadas (%)', metrics.lossPreventedByAlertsPct.toFixed(1)],
      [],
      ['DISTRIBUCIÓN PRODUCTIVA POR CORREGIMIENTO'],
      ['Corregimiento', 'Cultivo dominante', 'Fincas registradas', 'Superficie total (ha)', 'Estado fitosanitario'],
      ...CORREGIMIENTOS.map((r) => [r.name, r.crop, String(r.farms), r.ha.toFixed(1), r.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join(String.fromCharCode(13, 10));
    const blob = new Blob([String.fromCharCode(65279) + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agrobaru-informe-mida-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#E5E5E5] uppercase tracking-normal leading-snug">
            Panel de Control MIDA & Cooperativas de Barú
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Métricas consolidadas de impacto socioeconómico, volumen en Escrow y eliminación de intermediarios.
          </p>
        </div>

        <Button
          onClick={handleDownloadMidaReport}
          variant="default"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-black" strokeWidth={1.5} />
          Exportar Informe Consolidado MIDA
        </Button>
      </div>

      {/* Hero Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#15803D] min-w-0">
          <div className="text-[10px] font-mono text-[#666666] uppercase">VOLUMEN TOTAL ESCROW</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[#15803D] break-words">
            {formatCurrency(metrics.totalEscrowVolumeUsd)}
          </div>
          <div className="text-[11px] font-mono text-[#9E9E9E]">Transacciones 100% garantizadas</div>
        </div>

        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#FACC15] min-w-0">
          <div className="text-[10px] font-mono text-[#666666] uppercase">AHORRO INTERMEDIARIOS</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[#FACC15] break-words">
            {formatCurrency(metrics.intermediaryFeeEliminatedUsd)}
          </div>
          <div className="text-[11px] font-mono text-[#15803D] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} /> +31.8% margen al agricultor
          </div>
        </div>

        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#7C3AED] min-w-0">
          <div className="text-[10px] font-mono text-[#666666] uppercase">SUPERFICIE AUDITADA</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[#7C3AED] break-words">
            {metrics.totalHectares} Ha
          </div>
          <div className="text-[11px] font-mono text-[#9E9E9E]">Distribuida en 5 corregimientos</div>
        </div>

        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#F97316] min-w-0">
          <div className="text-[10px] font-mono text-[#666666] uppercase">PÉRDIDAS EVITADAS</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[#F97316] break-words">
            {metrics.lossPreventedByAlertsPct}%
          </div>
          <div className="text-[11px] font-mono text-[#CCCCCC]">Por alerta temprana Sigatoka</div>
        </div>
      </div>

      {/* Corregimiento Breakdown Table */}
      <div className="bg-[#121212] border-2 border-[#15803D] p-4 sm:p-6 space-y-4 shadow-[4px_4px_0px_0px_#15803D]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#15803D]/40 pb-3">
          <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
            Distribución Productiva por Corregimiento (Barú)
          </h3>
          <span className="text-[11px] font-mono text-[#15803D] font-bold shrink-0">ACTUALIZACIÓN CENSAL 2026</span>
        </div>

        {/* Vista móvil: tarjetas legibles sin desplazamiento horizontal */}
        <div className="space-y-2 md:hidden">
          {CORREGIMIENTOS.map((row) => (
            <div key={row.name} className="border border-[#1E293B] bg-[#0E0E0E] p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#E5E5E5]">
                  <MapPin className="w-3.5 h-3.5 text-[#15803D] shrink-0" strokeWidth={1.5} />
                  <span>{row.name}</span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold shrink-0 ${statusBadgeClass(row.status)}`}>{row.status}</span>
              </div>
              <div className="text-[11px] text-[#CCCCCC]">{row.crop}</div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-[#15803D] font-bold">{row.farms} fincas</span>
                <span className="text-[#E5E5E5]">{row.ha.toFixed(1)} ha</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-mono text-xs">
            <thead>
              <tr className="border-b-2 border-[#1E293B] text-[#666666]">
                <th className="pb-3 pr-4 uppercase">Corregimiento</th>
                <th className="pb-3 pr-4 uppercase">Cultivo Dominante</th>
                <th className="pb-3 pr-4 uppercase">Fincas Registradas</th>
                <th className="pb-3 pr-4 uppercase">Superficie Total</th>
                <th className="pb-3 uppercase">Estado Fitosanitario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {CORREGIMIENTOS.map((row) => (
                <tr key={row.name} className="hover:bg-[#141414] transition-colors">
                  <td className="py-3.5 pr-4 font-bold text-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#15803D] shrink-0" strokeWidth={1.5} />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[#CCCCCC]">{row.crop}</td>
                  <td className="py-3.5 pr-4 text-[#15803D] font-bold">{row.farms} Fincas</td>
                  <td className="py-3.5 pr-4 text-[#E5E5E5]">{row.ha} Ha</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold inline-block ${statusBadgeClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Economic Comparison Card */}
      <div className="bg-[#0E0E0E] border-2 border-[#7C3AED] p-6 space-y-4 shadow-[4px_4px_0px_0px_#7C3AED]">
        <div className="flex items-center gap-2 border-b border-[#7C3AED]/40 pb-3">
          <FileCheck2 className="w-5 h-5 text-[#7C3AED]" strokeWidth={1.5} />
          <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase">
            Impacto Socioeconómico: Cadena Tradicional vs. AgroBarú
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Traditional */}
          <div className="bg-[#121212] p-4 border border-[#1E293B] space-y-3">
            <div className="font-bold text-[#F97316] uppercase text-sm">
              Esquema Tradicional (Coyotes / Intermediarios)
            </div>
            <ul className="space-y-2 text-[#9E9E9E] text-[11px]">
              <li>• Pago al Productor: <strong>$0.40 - $0.55 / Kg</strong> (A 60-90 días)</li>
              <li>• Comisión del Intermediario: <strong>35% - 45%</strong> del valor final</li>
              <li>• Riesgo de Impago: Alto (Cheques sin fondos / acuerdos verbales)</li>
              <li>• Trazabilidad: Inexistente (Mezcla de calidades de origen desconocido)</li>
            </ul>
          </div>

          {/* AgroBarú */}
          <div className="bg-[#121212] p-4 border border-[#15803D] space-y-3">
            <div className="font-bold text-[#15803D] uppercase text-sm flex flex-wrap items-center justify-between gap-2">
              <span>Protocolo AgroBarú</span>
              <span className="text-[10px] bg-[#15803D] text-black px-2 py-0.5 font-bold shrink-0">RECOMENDADO</span>
            </div>
            <ul className="space-y-2 text-[#E5E5E5] text-[11px]">
              <li>• Pago al Productor: <strong className="text-[#15803D]">$0.85 - $1.25 / Kg</strong> (98.5% neto al productor)</li>
              <li>• Tarifa Operativa Escrow: <strong className="text-[#FACC15]">1.5%</strong> únicamente</li>
              <li>• Riesgo de Impago: <strong className="text-[#15803D]">0%</strong> (Fondos bloqueados en Escrow previo al despacho)</li>
              <li>• Trazabilidad: <strong className="text-[#7C3AED]">SHA-256 inmutable</strong> + Raíz Merkle en QR</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
