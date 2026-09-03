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

export const DistrictAnalytics: React.FC = () => {
  const { metrics, farms } = useAppState();

  const handleDownloadMidaReport = () => {
    alert('Generando Reporte Oficial Cuarentenario y de Trazabilidad MIDA (Formato PDF/CSV)...');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight">
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
        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#15803D]">
          <div className="text-[10px] font-mono text-[#666666] uppercase">VOLUMEN TOTAL ESCROW</div>
          <div className="text-3xl font-display font-black text-[#15803D]">
            {formatCurrency(metrics.totalEscrowVolumeUsd)}
          </div>
          <div className="text-[11px] font-mono text-[#9E9E9E]">Transacciones 100% garantizadas</div>
        </div>

        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#FACC15]">
          <div className="text-[10px] font-mono text-[#666666] uppercase">AHORRO INTERMEDIARIOS</div>
          <div className="text-3xl font-display font-black text-[#FACC15]">
            {formatCurrency(metrics.intermediaryFeeEliminatedUsd)}
          </div>
          <div className="text-[11px] font-mono text-[#15803D] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} /> +31.4% margen al agricultor
          </div>
        </div>

        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#7C3AED]">
          <div className="text-[10px] font-mono text-[#666666] uppercase">SUPERFICIE AUDITADA</div>
          <div className="text-3xl font-display font-black text-[#7C3AED]">
            {metrics.totalHectares} Ha
          </div>
          <div className="text-[11px] font-mono text-[#9E9E9E]">Distribuida en 5 corregimientos</div>
        </div>

        <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-2 shadow-[4px_4px_0px_0px_#F97316]">
          <div className="text-[10px] font-mono text-[#666666] uppercase">PÉRDIDAS EVITADAS</div>
          <div className="text-3xl font-display font-black text-[#F97316]">
            {metrics.lossPreventedByAlertsPct}%
          </div>
          <div className="text-[11px] font-mono text-[#CCCCCC]">Por alerta temprana Sigatoka</div>
        </div>
      </div>

      {/* Corregimiento Breakdown Table */}
      <div className="bg-[#121212] border-2 border-[#15803D] p-6 space-y-4 shadow-[4px_4px_0px_0px_#15803D]">
        <div className="flex items-center justify-between border-b border-[#15803D]/40 pb-3">
          <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
            Distribución Productiva por Corregimiento (Barú)
          </h3>
          <span className="text-[11px] font-mono text-[#15803D] font-bold">ACTUALIZACIÓN CENSAL 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b-2 border-[#1E293B] text-[#666666]">
                <th className="pb-3 uppercase">Corregimiento</th>
                <th className="pb-3 uppercase">Cultivo Dominante</th>
                <th className="pb-3 uppercase">Fincas Registradas</th>
                <th className="pb-3 uppercase">Superficie Total</th>
                <th className="pb-3 uppercase">Estado Fitosanitario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {[
                { name: 'Puerto Armuelles', crop: 'Banano Cavendish Exportación', farms: 18, ha: 48.5, status: 'CONTROLADO' },
                { name: 'Limones', crop: 'Cacao Criollo & Palma Aceitera', farms: 12, ha: 34.0, status: 'ÓPTIMO' },
                { name: 'Progreso', crop: 'Plátano Curaré & Granos', farms: 15, ha: 41.2, status: 'MONITOREO' },
                { name: 'Baco', crop: 'Palma Aceitera & Arroz', farms: 9, ha: 28.0, status: 'ALERTA RÍO' },
                { name: 'Rodolfo Aguilar Delgado', crop: 'Banano Cavendish & Café Robusta', farms: 14, ha: 37.8, status: 'CONTROLADO' },
              ].map((row) => (
                <tr key={row.name} className="hover:bg-[#141414] transition-colors">
                  <td className="py-3.5 font-bold text-[#E5E5E5] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                    {row.name}
                  </td>
                  <td className="py-3.5 text-[#CCCCCC]">{row.crop}</td>
                  <td className="py-3.5 text-[#15803D] font-bold">{row.farms} Fincas</td>
                  <td className="py-3.5 text-[#E5E5E5]">{row.ha} Ha</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold ${
                      row.status === 'ÓPTIMO' || row.status === 'CONTROLADO'
                        ? 'bg-[#15803D]/20 text-[#15803D] border border-[#15803D]'
                        : row.status === 'MONITOREO'
                        ? 'bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]'
                        : 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]'
                    }`}>
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
            Impacto Socioeconómico: Cadena Tradicional vs AgroBarú
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
            <div className="font-bold text-[#15803D] uppercase text-sm flex items-center justify-between">
              <span>Protocolo AgroBarú</span>
              <span className="text-[10px] bg-[#15803D] text-black px-2 py-0.5 font-bold">RECOMENDADO</span>
            </div>
            <ul className="space-y-2 text-[#E5E5E5] text-[11px]">
              <li>• Pago al Productor: <strong className="text-[#15803D]">$0.85 - $1.25 / Kg</strong> (100% de la venta)</li>
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
