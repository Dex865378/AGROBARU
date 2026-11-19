import React, { useState } from 'react';
import { 
  Bug, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  MapPin, 
  CheckCircle2, 
  Send,
  Bell,
  Clock
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
import { fcmService } from '@/services/fcmService';

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

  const handleBroadcastAlert = async () => {
    await fcmService.sendSigatokaAlertPush({
      corregimiento: selectedCorregimiento,
      riskScore: riskAnalysis.riskScore,
      severity: riskAnalysis.severity,
      actionRequired: riskAnalysis.reasons[0] || 'Deshoje fitosanitario y drenaje preventivo',
    });
    warning(
      `Alerta FCM Push Enviada a Productores de ${selectedCorregimiento}`,
      `Se despachó push notification (topic: sigatoka_alerts). Score de riesgo: ${riskAnalysis.riskScore}/100.`
    );
  };

  const handleTestBackgroundAlert = () => {
    fcmService.scheduleBackgroundNotification(
      {
        type: 'sigatoka_alert',
        title: `ALERTA CRÍTICA EN 2DO PLANO: Sigatoka en ${selectedCorregimiento}`,
        body: `Riesgo de infección foliar (${riskAnalysis.riskScore}/100). Recomendación fitosanitaria MIDA activada.`,
        route: 'pest-radar',
        data: { corregimiento: selectedCorregimiento, riskScore: riskAnalysis.riskScore },
      },
      5
    );
    warning(
      'Simulación en Segundo Plano Programada',
      '¡Minimiza la app o presiona Home ahora! La alerta llegará en 5 segundos a la barra de estado de Android.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-2xl text-[#E5E5E5] uppercase tracking-normal leading-snug">
              Motor Predictivo Fitosanitario & Sigatoka Negra
            </h2>
            <Badge variant="outline" className="text-[10px] text-[#F97316] border-[#F97316] hidden sm:inline-flex">
              FCM Push Activo
            </Badge>
          </div>
          <p className="text-xs text-[#9E9E9E] font-sans mt-1 leading-relaxed">
            Algoritmo biológico que procesa horas de rocío, humedad foliar y calor para prevenir plagas con bio-insumos orgánicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleTestBackgroundAlert}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs font-mono border-[#FACC15] text-[#FACC15] hover:bg-[#FACC15] hover:text-black"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Probar en segundo plano (5 s)</span>
          </Button>

          <Button
            onClick={handleBroadcastAlert}
            variant="orange"
            size="sm"
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Send className="w-4 h-4 text-black shrink-0" strokeWidth={1.5} />
            <span>Difundir Alerta FCM Push a Fincas</span>
          </Button>
        </div>
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
              className={`p-3 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'border-[#10B981] bg-[#161E19]'
                  : 'border-[#1E2E26] bg-[#111714] text-[#9E9E9E] hover:border-[#10B981]/50 hover:text-[#E5E5E5]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="font-bold uppercase text-[11px] truncate min-w-0">{corr}</span>
                <span className={`w-2 h-2 shrink-0 rounded-full ${risk.severity === 'CRITICAL' ? 'bg-[#F97316]' : risk.severity === 'HIGH' ? 'bg-[#FACC15]' : 'bg-[#10B981]'}`} />
              </div>
              <div className="text-[10px] text-[#666666] mt-1">{st.temperatureC} °C • {st.humidityPct}% RH</div>
            </button>
          );
        })}
      </div>

      {/* Main Meteorological & Bio-Risk Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge Card */}
        <div className="bg-[#111714] border border-[#1E2E26] rounded-xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="w-10 h-10 shrink-0 bg-[#15803D]/15 border border-[#15803D] flex items-center justify-center text-[#15803D]">
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

          <div className="p-3 bg-[#0E0E0E] border border-[#1E293B] font-mono text-xs space-y-1.5">
            <div className="flex flex-wrap justify-between gap-1.5 text-[11px]">
              <span className="text-[#666666]">Tratamiento Orgánico:</span>
              <span className="text-[#7C3AED] font-bold break-words">Bacillus subtilis QST713</span>
            </div>
            <div className="flex flex-wrap justify-between gap-1.5 text-[11px]">
              <span className="text-[#666666]">Deshoje Quirúrgico:</span>
              <span className="text-[#15803D] font-bold">{riskAnalysis.riskScore > 60 ? 'OBLIGATORIO' : 'RUTINA'}</span>
            </div>
          </div>
        </div>

        {/* Telemetry Sensors Grid */}
        <div className="lg:col-span-2 bg-[#111714] border border-[#1E2E26] rounded-xl p-4 sm:p-6 space-y-5 shadow-sm min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#15803D]/40 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-5 h-5 text-[#15803D] shrink-0" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-sm sm:text-base text-[#E5E5E5] uppercase break-words">
                Estación Meteorológica: {selectedCorregimiento}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#15803D] font-bold shrink-0">
              SENSOR IoT TELEMETRY OK
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-3 sm:p-4 space-y-1 min-w-0">
              <div className="text-[#666666] flex items-center gap-1.5 text-[10px] sm:text-xs font-mono min-w-0">
                <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FACC15] shrink-0" strokeWidth={1.5} />
                <span className="truncate">TEMPERATURA</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#E5E5E5]">
                {currentWeather.temperatureC} °C
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E] leading-snug">Óptimo hongo: 26-28 °C</div>
            </div>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-3 sm:p-4 space-y-1 min-w-0">
              <div className="text-[#666666] flex items-center gap-1.5 text-[10px] sm:text-xs font-mono min-w-0">
                <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#15803D] shrink-0" strokeWidth={1.5} />
                <span className="truncate">HUMEDAD REL.</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#15803D]">
                {currentWeather.humidityPct}%
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E] leading-snug">Alta saturación</div>
            </div>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-3 sm:p-4 space-y-1 min-w-0">
              <div className="text-[#666666] flex items-center gap-1.5 text-[10px] sm:text-xs font-mono min-w-0">
                <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C3AED] shrink-0" strokeWidth={1.5} />
                <span className="truncate">LLUVIA 24H</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#E5E5E5]">
                {currentWeather.precipitationMm} mm
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E] leading-snug">Microcuenca Barú</div>
            </div>

            <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-3 sm:p-4 space-y-1 min-w-0">
              <div className="text-[#666666] flex items-center gap-1.5 text-[10px] sm:text-xs font-mono min-w-0">
                <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F97316] shrink-0" strokeWidth={1.5} />
                <span className="truncate">ROCÍO FOLIAR</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#FACC15]">
                {currentWeather.leafWetnessHours} h
              </div>
              <div className="text-[10px] font-mono text-[#9E9E9E] leading-snug">Crítico si {'>'} 6h</div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] border border-[#1E293B] p-4 font-mono text-xs text-[#9E9E9E] space-y-2">
            <div className="text-[#E5E5E5] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />
              Diagnóstico Agronómico Asistido:
            </div>
            <p className="text-[11px] leading-relaxed text-[#CCCCCC] font-sans">
              En {selectedCorregimiento}, la acumulación de {currentWeather.leafWetnessHours} horas continuas de agua libre en la superficie foliar combinada con una temperatura de {currentWeather.temperatureC} °C crea el ambiente propicio para la germinación de esporas. Se recomienda aplicar el protocolo biológico correspondiente.
            </p>
          </div>
        </div>
      </div>

      {/* Active Alerts Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#15803D] pb-3">
          <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
            Alertas y Protocolos Fitosanitarios Activos ({activeAlerts.length})
          </h3>
          <div className="flex gap-2 font-mono text-xs shrink-0">
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
              className="bg-[#111714] border border-[#1E2E26] rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between min-w-0"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
