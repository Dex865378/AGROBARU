import { PestAlert, BaruCorregimiento } from '../types';

export interface WeatherTelemetry {
  corregimiento: BaruCorregimiento;
  temperatureC: number;
  humidityPct: number;
  precipitationMm: number;
  leafWetnessHours: number;
  windSpeedKmh: number;
  timestamp: string;
}

export const BARU_MICROCLIMATES: Record<BaruCorregimiento, WeatherTelemetry> = {
  'Puerto Armuelles': {
    corregimiento: 'Puerto Armuelles',
    temperatureC: 29.4,
    humidityPct: 88,
    precipitationMm: 18.5,
    leafWetnessHours: 7.2,
    windSpeedKmh: 14.0,
    timestamp: new Date().toISOString(),
  },
  'Limones': {
    corregimiento: 'Limones',
    temperatureC: 28.1,
    humidityPct: 91,
    precipitationMm: 24.0,
    leafWetnessHours: 8.5,
    windSpeedKmh: 18.2,
    timestamp: new Date().toISOString(),
  },
  'Progreso': {
    corregimiento: 'Progreso',
    temperatureC: 30.5,
    humidityPct: 84,
    precipitationMm: 12.0,
    leafWetnessHours: 5.5,
    windSpeedKmh: 11.5,
    timestamp: new Date().toISOString(),
  },
  'Baco': {
    corregimiento: 'Baco',
    temperatureC: 31.0,
    humidityPct: 79,
    precipitationMm: 8.0,
    leafWetnessHours: 4.2,
    windSpeedKmh: 10.0,
    timestamp: new Date().toISOString(),
  },
  'Rodolfo Aguilar Delgado': {
    corregimiento: 'Rodolfo Aguilar Delgado',
    temperatureC: 29.8,
    humidityPct: 86,
    precipitationMm: 15.2,
    leafWetnessHours: 6.8,
    windSpeedKmh: 12.8,
    timestamp: new Date().toISOString(),
  },
};

/**
 * Calculates biological risk of Black Sigatoka (Mycosphaerella fijiensis) in Bananas
 * Critical conditions: Temp 26-30 °C, Humidity > 85%, Leaf wetness > 6 hours
 */
export function calculateSigatokaRisk(weather: WeatherTelemetry): {
  riskScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if (weather.temperatureC >= 25 && weather.temperatureC <= 31) {
    score += 35;
    reasons.push(`Temperatura óptima de esporulación (${weather.temperatureC} °C)`);
  }
  if (weather.humidityPct >= 85) {
    score += 35;
    reasons.push(`Humedad relativa crítica (${weather.humidityPct}%) que favorece germinación de ascosporas`);
  } else if (weather.humidityPct >= 75) {
    score += 15;
  }
  if (weather.leafWetnessHours >= 6) {
    score += 30;
    reasons.push(`Hojas con película de agua continua por ${weather.leafWetnessHours} horas`);
  }

  let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 80) severity = 'CRITICAL';
  else if (score >= 60) severity = 'HIGH';
  else if (score >= 35) severity = 'MEDIUM';

  return { riskScore: score, severity, reasons };
}

/**
 * Generates active phytosanitary and meteorological alerts for Barú
 */
export function evaluateAllAlerts(): PestAlert[] {
  const alerts: PestAlert[] = [
    {
      id: 'ALT-SIGATOKA-2026-01',
      title: 'Alerta Roja: Brote Inminente de Sigatoka Negra',
      pestType: 'Sigatoka Negra (Banano)',
      cropTarget: 'Banano Cavendish y Plátano Curaré',
      severity: 'CRITICAL',
      affectedZones: ['Limones', 'Puerto Armuelles', 'Rodolfo Aguilar Delgado'],
      riskProbabilityPercentage: 88,
      climaticTrigger: {
        avgTemp: 28.8,
        humidityPct: 90,
        precipitationMm: 22.5,
        consecutiveWetHours: 8.0,
      },
      description: 'El microclima costero de Barú presenta condiciones de saturación hídrica extrema y temperatura óptima para la liberación masiva de ascosporas de Mycosphaerella fijiensis.',
      agronomicProtocol: [
        'Realizar deshoje fitosanitario inmediato (cirugía de hojas con estrías tempranas)',
        'Evitar estancamiento de agua limpiando canales de drenaje terciarios',
        'Suspender fertilización nitrogenada de choque para evitar follaje tierno susceptible',
        'Registrar la intervención en la bitácora criptográfica con foto EXIF geolocalizada'
      ],
      recommendedBioTreatments: [
        'Biofungicida a base de Bacillus subtilis (cepa QST 713) a dosis de 1.5 L/ha',
        'Extracto de aceite de árbol de té (Melaleuca alternifolia) al 0.8%',
        'Caldo sulfocálcico en bordes perimetrales de la plantación'
      ],
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      id: 'ALT-MONILIA-2026-02',
      title: 'Riesgo Alto de Moniliasis en Mazorcas de Cacao',
      pestType: 'Moniliasis (Cacao)',
      cropTarget: 'Cacao Criollo Fino de Aroma',
      severity: 'HIGH',
      affectedZones: ['Progreso', 'Rodolfo Aguilar Delgado'],
      riskProbabilityPercentage: 74,
      climaticTrigger: {
        avgTemp: 29.5,
        humidityPct: 86,
        precipitationMm: 16.0,
        consecutiveWetHours: 6.5,
      },
      description: 'Las condiciones de humedad relativa y sombra excesiva en parcelas agroforestales elevan el riesgo de penetración del hongo Moniliophthora roreri en frutos jóvenes.',
      agronomicProtocol: [
        'Remoción manual y entierro con cal de todas las mazorcas con manchas chocolates o polvo blanco',
        'Poda de aclareo para permitir 50% de entrada de luz solar a la copa del cacao',
        'Aplicación preventiva en frutos menores de 8 cm'
      ],
      recommendedBioTreatments: [
        'Trichoderma harzianum (cepa nativa Barú) 2x10^9 esporas/ml',
        'Oxicloruro de cobre en dosis preventiva certificada para cultivo orgánico',
        'Biofertilizante foliar enriquecido con silicio para engrosar la corteza de la mazorca'
      ],
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      active: true,
    },
    {
      id: 'ALT-RIVER-2026-03',
      title: 'Monitoreo de Caudal: Río Chiriquí Viejo',
      pestType: 'Inundación Río Chiriquí Viejo',
      cropTarget: 'Plantaciones Bajas de Plátano y Palma',
      severity: 'MEDIUM',
      affectedZones: ['Baco', 'Progreso'],
      riskProbabilityPercentage: 58,
      climaticTrigger: {
        avgTemp: 30.2,
        humidityPct: 82,
        precipitationMm: 35.0,
        consecutiveWetHours: 5.0,
      },
      description: 'Precipitaciones en la cuenca alta de Chiriquí generan aumento del 40% en el caudal de la estación hidrológica de Paso Canoas - Progreso.',
      agronomicProtocol: [
        'Verificar compuertas de drenaje secundarias',
        'Asegurar bombas de achique y maquinaria agrícola en cotas elevadas',
        'Notificar a la cooperativa para activar comité de contingencia'
      ],
      recommendedBioTreatments: [
        'N/A - Protocolo de Manejo de Drenajes e Infraestructura'
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      active: true,
    }
  ];

  return alerts;
}
