import React, { createContext, useContext, useState, useEffect } from 'react';
import { shouldSkipTranslation, translateInterfacePhrase } from '@/lib/autoTranslate';

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
    'nav.login': 'Iniciar sesión',
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
    'nav.login': 'Sign in',
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

interface TranslatedTextRecord {
  original: string;
  rendered: string;
}

const translatedTextNodes = new WeakMap<Text, TranslatedTextRecord>();
const translatedAttributes = new WeakMap<Element, Record<string, TranslatedTextRecord>>();
const TRANSLATED_ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

function translateTextNode(node: Text): void {
  if (shouldSkipTranslation(node)) return;
  const current = node.nodeValue || '';
  if (!current.trim()) return;

  const existing = translatedTextNodes.get(node);
  if (existing && existing.rendered === current) return;

  const translated = translateInterfacePhrase(current);
  if (translated === current) {
    // Si React ya cambió el nodo a otro idioma, neutraliza el registro viejo.
    if (existing) translatedTextNodes.set(node, { original: current, rendered: current });
    return;
  }

  translatedTextNodes.set(node, { original: current, rendered: translated });
  node.nodeValue = translated;
}

function restoreTextNode(node: Text): void {
  const record = translatedTextNodes.get(node);
  if (record && node.nodeValue === record.rendered) {
    node.nodeValue = record.original;
  }
}

function translateElementAttributes(element: Element): void {
  if (element.closest('[data-no-translate]')) return;
  const records = translatedAttributes.get(element) || {};

  TRANSLATED_ATTRIBUTES.forEach((name) => {
    const current = element.getAttribute(name);
    if (!current || !current.trim()) return;
    const existing = records[name];
    if (existing && existing.rendered === current) return;

    const translated = translateInterfacePhrase(current);
    if (translated === current) {
      if (existing) records[name] = { original: current, rendered: current };
      return;
    }
    records[name] = { original: current, rendered: translated };
    element.setAttribute(name, translated);
  });

  if (Object.keys(records).length > 0) translatedAttributes.set(element, records);
}

function restoreElementAttributes(element: Element): void {
  const records = translatedAttributes.get(element);
  if (!records) return;
  TRANSLATED_ATTRIBUTES.forEach((name) => {
    const record = records[name];
    if (record && element.getAttribute(name) === record.rendered) {
      element.setAttribute(name, record.original);
    }
  });
}

function translateTree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (!(root instanceof Element)) return;

  translateElementAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      translateTextNode(current as Text);
    } else {
      translateElementAttributes(current as Element);
    }
    current = walker.nextNode();
  }
}

function restoreTree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    restoreTextNode(root as Text);
    return;
  }
  if (!(root instanceof Element)) return;

  restoreElementAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      restoreTextNode(current as Text);
    } else {
      restoreElementAttributes(current as Element);
    }
    current = walker.nextNode();
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('agrobaru_lang');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrobaru_lang', lang);
    window.dispatchEvent(new CustomEvent('agrobaru:language-changed', { detail: lang }));
  };

  // Traduce toda la interfaz visible sin depender de internet. Los textos
  // dinámicos que no están en el diccionario se dejan intactos.
  useEffect(() => {
    document.documentElement.lang = language;

    if (language === 'es') {
      if (document.body) restoreTree(document.body);
      return;
    }

    let frame = 0;
    const run = () => {
      if (!document.body) return;
      translateTree(document.body);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    };

    const timeout = window.setTimeout(schedule, 0);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(mutation.target as Text);
          return;
        }
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          translateElementAttributes(mutation.target);
          return;
        }
        mutation.addedNodes.forEach((node) => translateTree(node));
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATED_ATTRIBUTES],
    });

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language]);

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
