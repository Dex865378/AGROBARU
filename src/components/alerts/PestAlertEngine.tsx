import React, { useState } from 'react';
import { 
  Bug, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  MapPin, 
  CheckCircle2, 
  Send
} from 'lucide-react';
import { 
  BARU_MICROCLIMATES, 
  calculateSigatokaRisk,
  evaluateAllAlerts 
} from '@/services/pestEngine';
import { BaruCorregimiento } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/context/NotificationContext';

export const PestAlertEngine: React.FC = () => {
  const { warning } = useNotification();
  const [selectedCorregimiento, setSelectedCorregimiento] = useState<BaruCorregimiento>('Puerto Armuelles');
  const [activeTab, setActiveTab] = useState<'WEATHER' | 'PROTOCOLS'>('WEATHER');

  const currentWeather = BARU_MICROCLIMATES[selectedCorregimiento];
  const riskAnalysis = calculateSigatokaRisk(currentWeather);
  const activeAlerts = evaluateAllAlerts();

  const getRiskBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="animate-pulse">RIESGO CRÍTICO (ACCIÓN INMEDIATA)</Badge>;
      case 'HIGH':
        return <Badge variant="orange">RIESGO ALTO</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">RIESGO MODERADO</Badge>;
      default:
        return <Badge variant="success">RIESGO BAJO (MONITOREO)</Badge>;
    }
  };

  const handleBroadcastAlert = () => {
    warning(
      `Alerta Fitosanitaria Enviada a Productores de ${selectedCorregimiento}`,
      `Se despachó protocolo de bio-control preventivo. Score de riesgo: ${riskAnalysis.riskScore}/100.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight">
            Motor Predictivo Fitosanitario & Sigatoka Negra
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Algoritmo biológico que procesa horas de rocío, humedad foliar y calor para prevenir plagas con bio-insumos orgánicos.
          </p>
        </div>

        <Button
          onClick={handleBroadcastAlert}
          variant="orange"
          size="sm"
          className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-xs font-bold"
        >
          <Send className="w-4 h-4 text-black" strokeWidth={1.5} />
          Difundir Alerta SMS/PWA a Fincas
        </Button>
      </div>

      {/* Corregimiento Station Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
        {(Object.keys(BARU_MICROCLIMATES) as BaruCorregimiento[]).map((corr) => {
          const isSelected = selectedCorregimiento === corr;
          const st = BARU_MICROCLIMATES[corr];
          const risk = calculateSigatokaRisk(st);
          return (
            <button
              key={corr}
              onClick={() => setSelectedCorregimiento(corr)}
              className={`p-3 text-left border-2 transition-all ${
                isSelected
                  ? 'border-[#15803D] bg-[#141414] shadow-[4px_4px_0px_0px_#15803D]'
                  : 'border-[#1E293B] bg-[#0E0E0E] text-[#9E9E9E] hover:border-[#15803D]/60 hover:text-[#E5E5E5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-[11px] truncate">{corr}</span>
                <span className={`w-2 h-2 rounded-none ${risk.severity === 'CRITICAL' ? 'bg-[#F97316]' : risk.severity === 'HIGH' ? 'bg-[#FACC15]' : 'bg-[#15803D]'}`} />
              </div>
              <div className="text-[10px] text-[#666666] mt-1">{st.temperatureC}°C • {st.humidityPct}% RH</div>
            </button>
          );
        })}
      </div>

      {/* Main Meteorological & Bio-Risk Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge Card */}
        <div className="bg-[#121212] border-2 border-[#15803D] p-6 space-y-5 shadow-[4px_4px_0px_0px_#15803D] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-[#15803D]/15 border border-[#15803D] flex items-center justify-center text-[#15803D]">
                <Bug className="w-5 h-5" strokeWidth={1.5} />
              </div>
              {getRiskBadge(riskAnalysis.severity)}
            </div>

            <h3 className="font-display font-black text-xl text-[#E5E5E5] uppercase">
              Índice Biológico Sigatoka
            </h3>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-4 text-center space-y-1">
              <div className="text-[10px] font-mono text-[#666666] uppercase">SCORE DE RIESGO ESPORULACIÓN</div>
              <div className="font-display font-black text-4xl text-[#FACC15]">
                {riskAnalysis.riskScore}/100
              </div>
              <div className="text-[10px] font-mono text-[#15803D]">
                Ventana de Infección: 48 - 72 Horas
              </div>
            </div>

            <div className="space-y-1 text-xs text-[#9E9E9E]">
              {riskAnalysis.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-[#FACC15]">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#0E0E0E] border border-[#1E293B] font-mono text-xs space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#666666]">Tratamiento Orgánico:</span>
              <span className="text-[#7C3AED] font-bold">Bacillus subtilis QST713</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#666666]">Deshoje Quirúrgico:</span>
              <span className="text-[#15803D] font-bold">{riskAnalysis.riskScore > 60 ? 'OBLIGATORIO' : 'RUTINA'}</span>
            </div>
          </div>
        </div>

        {/* Telemetry Sensors Grid */}
        <div className="lg:col-span-2 bg-[#121212] border-2 border-[#15803D] p-6 space-y-5 shadow-[4px_4px_0px_0px_#15803D]">
          <div className="flex items-center justify-between border-b border-[#15803D]/40 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#15803D]" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase">
                Estación Meteorológica: {selectedCorregimiento}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#15803D] font-bold">
              SENSOR IoT TELEMETRY OK
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-4 space-y-1">
              <div className="text-[#666666] flex items-center gap-1.5 text-xs font-mono">
                <Thermometer className="w-4 h-4 text-[#FACC15]" strokeWidth={1.5} />
                TEMPERATURA
              </div>
              <div className="text-2xl font-display font-bold text-[#E5E5E5]">
                {currentWeather.temperatureC}°C
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E]">Óptimo hongo: 26-28°C</div>
            </div>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-4 space-y-1">
              <div className="text-[#666666] flex items-center gap-1.5 text-xs font-mono">
                <Droplets className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />
                HUMEDAD REL.
              </div>
              <div className="text-2xl font-display font-bold text-[#15803D]">
                {currentWeather.humidityPct}%
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E]">Alta saturación</div>
            </div>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-4 space-y-1">
              <div className="text-[#666666] flex items-center gap-1.5 text-xs font-mono">
                <CloudRain className="w-4 h-4 text-[#7C3AED]" strokeWidth={1.5} />
                LLUVIA 24H
              </div>
              <div className="text-2xl font-display font-bold text-[#E5E5E5]">
                {currentWeather.precipitationMm} mm
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E]">Microcuenca Barú</div>
            </div>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-4 space-y-1">
              <div className="text-[#666666] flex items-center gap-1.5 text-xs font-mono">
                <Wind className="w-4 h-4 text-[#F97316]" strokeWidth={1.5} />
                ROCÍO FOLIAR
              </div>
              <div className="text-2xl font-display font-bold text-[#FACC15]">
                {currentWeather.leafWetnessHours} h
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E]">Crítico si {'>'} 6h</div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] border border-[#1E293B] p-4 font-mono text-xs text-[#9E9E9E] space-y-2">
            <div className="text-[#E5E5E5] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />
              Diagnóstico Agronómico Asistido:
            </div>
            <p className="text-[11px] leading-relaxed text-[#CCCCCC] font-sans">
              En {selectedCorregimiento}, la acumulación de {currentWeather.leafWetnessHours} horas continuas de agua libre en la superficie foliar combinada con una temperatura de {currentWeather.temperatureC}°C crea el ambiente propicio para la germinación de esporas. Se recomienda aplicar el protocolo biológico correspondiente.
            </p>
          </div>
        </div>
      </div>

      {/* Active Alerts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#15803D] pb-3">
          <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
            Alertas y Protocolos Fitosanitarios Activos ({activeAlerts.length})
          </h3>
          <div className="flex gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('WEATHER')}
              className={`px-3 py-1 border ${activeTab === 'WEATHER' ? 'border-[#15803D] bg-[#15803D] text-black font-bold' : 'border-[#1E293B] text-[#9E9E9E]'}`}
            >
              Fichas de Cultivo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-4 shadow-[4px_4px_0px_0px_#15803D] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'yellow'}>{alert.cropTarget}</Badge>
                  <span className="text-[10px] font-mono text-[#F97316] font-bold uppercase">{alert.pestType}</span>
                </div>

                <h4 className="font-display font-bold text-base text-[#E5E5E5]">
                  {alert.title}
                </h4>

                <p className="text-xs text-[#9E9E9E] font-sans leading-relaxed">
                  {alert.description}
                </p>

                <div className="bg-[#0E0E0E] p-3 border border-[#1E293B] space-y-2 text-xs font-mono">
                  <div className="text-[#15803D] font-bold text-[11px]">Tratamiento Orgánico Recomendado:</div>
                  <ul className="text-[#CCCCCC] text-[11px] font-sans space-y-1">
                    {alert.recommendedBioTreatments.map((t, idx) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-[10px] font-mono text-[#666666] pt-2 border-t border-[#1E293B]">
                Zonas Afectadas: {alert.affectedZones.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
