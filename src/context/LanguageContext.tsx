import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  translateDynamic: (text: string) => string;
  translateText: (text: string) => Promise<string>;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Nav & Telemetry
    'nav.home': 'Inicio',
    'nav.farmer': 'Bitácora PWA',
    'nav.marketplace': 'Marketplace & Escrow',
    'nav.traceability': 'Verificador QR',
    'nav.alerts': 'Comunidad & Alertas',
    'nav.cooperative': 'Panel MIDA / GIS',
    'nav.calculator': 'Calculadora Ahorro',
    'nav.login': 'Iniciar con Google',
    'nav.logout': 'Cerrar Sesión',
    'nav.reputation': 'Reputación',
    'nav.offline': 'Modo Offline',
    'nav.online': 'En Línea',

    // Hero & General
    'hero.badge': 'PROTOCOLO DE EXPORTACIÓN DIRECTA // BARÚ, CHIRIQUÍ',
    'hero.title': 'Trazabilidad Criptográfica & Escrow para Productores de Barú',
    'hero.desc': 'Conectamos a pequeños agricultores de banano y cultivos tropicales con compradores internacionales. Cero coyotes, contratos de pago protegidos con Yappy/ACH y pasaportes de exportación auditados en SHA-256.',
    'hero.cta_market': 'Explorar Lotes Disponibles',
    'hero.cta_farmer': 'Bitácora de Campo PWA',
    'hero.manifesto_btn': 'Leer Manifiesto de Barú',

    // Features
    'feat.passport': 'Pasaporte Digital de Exportación (PDF)',
    'feat.sticker': 'Etiquetas Físicas para Cajas (Sticker QR)',
    'feat.calculator': 'Calculadora Anti-Intermediarios',
    'feat.reviews': 'Reseñas & Reputación de Productor',

    // Marketplace
    'market.title': 'Catálogo de Lotes Auditados en Finca',
    'market.subtitle': 'Contratos Escrow con retención y liberación condicionada a inspección portuaria.',
    'market.buy_btn': 'Comprar con Escrow Seguro',
    'market.verify_qr': 'Ver Trazabilidad & Hashes',
    'market.filter_all': 'Todos los Cultivos',

    // Traceability
    'trace.title': 'Auditoría Criptográfica de Lote & Cadena de Custodia',
    'trace.subtitle': 'Validación inmutable de firmas SHA-256 generadas en campo.',
    'trace.passport_btn': 'Generar Pasaporte Fitosanitario',

    // Calculator
    'calc.title': 'Calculadora de Ahorro Anti-Intermediarios',
    'calc.subtitle': 'Compara tus ingresos vendiendo a coyotes vs. exportando directamente con AgroBarú.',
  },
  en: {
    // Nav & Telemetry
    'nav.home': 'Home',
    'nav.farmer': 'Field Log PWA',
    'nav.marketplace': 'Marketplace & Escrow',
    'nav.traceability': 'QR Verifier',
    'nav.alerts': 'Community & Alerts',
    'nav.cooperative': 'MIDA / GIS Board',
    'nav.calculator': 'Savings Calculator',
    'nav.login': 'Sign in with Google',
    'nav.logout': 'Sign Out',
    'nav.reputation': 'Reputation',
    'nav.offline': 'Offline Mode',
    'nav.online': 'Online Live',

    // Hero & General
    'hero.badge': 'DIRECT EXPORT PROTOCOL // BARÚ, CHIRIQUÍ, PANAMA',
    'hero.title': 'Cryptographic Traceability & Escrow for Barú Producers',
    'hero.desc': 'Connecting small banana & tropical fruit growers with global buyers. Zero middleman fees, secure Escrow payments with Yappy/ACH, and SHA-256 audited export passports.',
    'hero.cta_market': 'Explore Available Batches',
    'hero.cta_farmer': 'Field Log PWA',
    'hero.manifesto_btn': 'Read Barú Manifesto',

    // Features
    'feat.passport': 'Export Digital Passport (PDF)',
    'feat.sticker': 'Box Thermal Labels (QR Sticker)',
    'feat.calculator': 'Anti-Middleman Calculator',
    'feat.reviews': 'Producer Reviews & Reputation',

    // Marketplace
    'market.title': 'Farm-Audited Crop Batch Catalog',
    'market.subtitle': 'Escrow contracts with payment hold and release conditioned on port inspection.',
    'market.buy_btn': 'Buy with Secure Escrow',
    'market.verify_qr': 'Verify Traceability & Hashes',
    'market.filter_all': 'All Crops',

    // Traceability
    'trace.title': 'Batch Cryptographic Audit & Chain of Custody',
    'trace.subtitle': 'Immutable validation of SHA-256 cryptographic signatures generated on-field.',
    'trace.passport_btn': 'Generate Phytosanitary Passport',

    // Calculator
    'calc.title': 'Anti-Middleman Savings Calculator',
    'calc.subtitle': 'Compare your revenue selling to coyotes vs. exporting directly with AgroBarú.',
  }
};

const agriculturalGlossary: Record<string, string> = {
  'Banano Cavendish': 'Cavendish Banana',
  'Plátano Curarre': 'Curarre Plantain',
  'Palma Aceitera': 'Oil Palm',
  'Gran Enano': 'Grand Nain',
  'Valery': 'Valery',
  'Premium Exportación': 'Premium Export Grade',
  'Grado A': 'Grade A',
  'Grado B Orgánico': 'Grade B Organic',
  'Puerto Armuelles': 'Puerto Armuelles',
  'Limones': 'Limones',
  'Progreso': 'Progreso',
  'Baco': 'Baco',
  'Rodolfo Aguilar Delgado': 'Rodolfo Aguilar Delgado',
  'Finca': 'Farm',
  'Productor': 'Producer / Farmer',
  'Comprador': 'Buyer / Importer',
  'Cosecha': 'Harvest',
  'Inspección': 'Inspection',
  'Fitosanitario': 'Phytosanitary',
  'Empaque': 'Packing',
  'Despacho': 'Dispatch',
  'Fondeo': 'Funding / Payout',
  'Excelente calidad y entrega puntual': 'Excellent quality and on-time delivery',
  'Fruta recibida en temperatura óptima': 'Fruit received in optimal temperature',
  'Cajas selladas con código QR verificado': 'Boxes sealed with verified QR code',
  'Sin mermas en corona': 'Zero crown rot or shrinkage',
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('agrobaru_lang');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrobaru_lang', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || defaultText || key;
  };

  // Instant agricultural dictionary translator for dynamic props & text
  const translateDynamic = (text: string): string => {
    if (!text || language === 'es') return text;

    let result = text;
    Object.entries(agriculturalGlossary).forEach(([es, en]) => {
      const regex = new RegExp(`\\b${es}\\b`, 'gi');
      result = result.replace(regex, en);
    });
    return result;
  };

  const translateText = async (text: string): Promise<string> => {
    return translateDynamic(text);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamic, translateText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
