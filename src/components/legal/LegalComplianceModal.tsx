import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Scale, 
  ExternalLink,
  CheckCircle,
  Building,
  HelpCircle
} from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type LegalTabType = 'terms' | 'privacy' | 'cookies' | 'refunds' | 'disclaimer';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  // Sync initial tab when changed
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col font-mono text-left bg-[#0E0E0E] text-[#E5E5E5] border-2 border-[#15803D] shadow-[8px_8px_0px_0px_#15803D]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#1E293B] bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#15803D] flex items-center justify-center font-bold text-black text-base shadow-[2px_2px_0px_0px_#FACC15]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-[#E5E5E5] uppercase tracking-wider">
                Centro Legal & Cumplimiento Normativo
              </h2>
              <p className="text-[11px] text-[#9E9E9E] font-sans">
                República de Panamá • Ley 81 de Protección de Datos • Código de Comercio & Normas MIDA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#15803D]/20 text-[#15803D] border border-[#15803D]/40 px-2.5 py-1 font-bold">
              ESTADO: VIGENTE 2026
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-[#1E293B] bg-[#141414] px-2 py-1 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#15803D] text-[#15803D] bg-[#0E0E0E]'
                : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Términos y Condiciones</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#7C3AED] text-[#7C3AED] bg-[#0E0E0E]'
                : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacidad (Ley 81)</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cookies'
                ? 'border-[#FACC15] text-[#FACC15] bg-[#0E0E0E]'
                : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Cookies</span>
          </button>

          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'refunds'
                ? 'border-[#38BDF8] text-[#38BDF8] bg-[#0E0E0E]'
                : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Garantías & Reclamaciones</span>
          </button>

          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'disclaimer'
                ? 'border-[#F97316] text-[#F97316] bg-[#0E0E0E]'
                : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Aviso Legal MIDA</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-[#CCCCCC] font-sans leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="border border-[#15803D]/40 bg-[#15803D]/5 p-3 rounded text-[11px] text-[#15803D] font-mono">
                ✓ Documento vinculante para Productores del Distrito de Barú y Compradores Comerciales Nacionales e Internacionales.
              </div>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                1. Naturaleza del Protocolo y Servicios de Plataforma
              </h3>
              <p>
                <strong>AgroBarú</strong> es una plataforma tecnológica que facilita la trazabilidad criptográfica inmutable, la verificación de calidad bajo estándares del Ministerio de Desarrollo Agropecuario (MIDA) y el servicio de custodia de pagos condicionales (<em>Escrow Inteligente</em>). AgroBarú no es intermediario especulador ni acaparador de cosechas; actúa como canal neutral de contratación directa.
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                2. Contratos de Compraventa y Custodia de Fondos (Escrow)
              </h3>
              <p>
                Al formalizar una orden de compra, los fondos del comprador quedan asegurados en una cuenta de custodia designada (vía Yappy Comercial, Nequi Panamá, ACH Xpress o canal bancario autorizado). Los fondos <strong>no son entregados al productor</strong> hasta que se cumplan las condiciones del contrato:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>Verificación del lote y pesaje con balanza calibrada en centro de acopio o finca de Barú.</li>
                <li>Firma digital del acta de entrega o recepción conforme por parte del transportista o comprador.</li>
                <li>Liberación automática tras el vencimiento del plazo de inspección (24 a 48 horas tras recepción).</li>
              </ul>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                3. Compromisos del Productor y Calidad de Lotes
              </h3>
              <p>
                El productor garantiza que las fotografías, datos de cosecha, grados Brix, longitud de dedos y peso especificados en la ficha técnica reflejan fielmente el estado del producto al momento del corte. La plataforma cuenta con controles de frescura visible y marcas temporales de actualización para proteger la transparencia del mercado.
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                4. Regla de Limpieza y Eliminación de Lotes Agotados (24 Horas)
              </h3>
              <p>
                Para evitar la saturación del catálogo y prevenir expectativas falsas en los clientes, todo lote cuyo inventario disponible llegue a 0 kg (100% vendido o liquidado) podrá ser eliminado inmediatamente por el productor mediante el botón de eliminación en su panel. Si el productor no lo elimina manualmente, el sistema ejecutará un proceso de auto-limpieza transcurridas 24 horas exactas desde la liquidación total.
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                5. Jurisdicción y Ley Aplicable
              </h3>
              <p>
                Los presentes términos se rigen por las leyes comerciales de la República de Panamá. Cualquier controversia técnica será sometida prioritariamente a mediación ante la Cámara de Comercio de Chiriquí o el tribunal arbitral competente en David o Barú.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border border-[#7C3AED]/40 bg-[#7C3AED]/5 p-3 rounded text-[11px] text-[#A78BFA] font-mono">
                ✓ En cumplimiento estricto con la <strong>Ley No. 81 del 26 de marzo de 2019</strong> de Protección de Datos Personales de la República de Panamá y regulaciones internacionales.
              </div>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                1. Responsable del Tratamiento
              </h3>
              <p>
                El responsable del tratamiento de los datos es la Asociación de Productores y Cooperativas Agrícolas del Distrito de Barú, con domicilio legal en Puerto Armuelles, Provincia de Chiriquí, República de Panamá (Correo de contacto: <em>privacidad@agrobaru.com</em>).
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                2. Datos Recopilados y Finalidad
              </h3>
              <p>
                Recopilamos únicamente los datos necesarios para la trazabilidad agrícola y la liquidación de cobros:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li><strong>Productores:</strong> Nombre completo, número de cédula o RUC, ubicación geográfica de la finca (coordenadas GPS para mapas MIDA), variedades cultivadas y número de teléfono/WhatsApp para coordinación logística.</li>
                <li><strong>Compradores:</strong> Nombre o razón social, correo electrónico, dirección de entrega o puerto de embarque, y teléfono de contacto.</li>
                <li><strong>Trazabilidad Pública:</strong> El código hash SHA-256 generado para cada lote es público para verificación del consumidor final, pero no expone datos bancarios ni datos sensibles privados del agricultor.</li>
              </ul>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                3. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
              </h3>
              <p>
                Todo titular de datos personales en Panamá tiene derecho a consultar qué información suya reposa en la base de datos, solicitar su actualización o exigir su eliminación total cuando ya no exista relación contractual activa. Para ejercer sus derechos ARCO, envíe un correo a <em>privacidad@agrobaru.com</em> adjuntando copia de su documento de identidad.
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                4. Cifrado y Medidas de Seguridad
              </h3>
              <p>
                Toda la comunicación entre su dispositivo y nuestros servidores viaja cifrada mediante protocolo HTTPS (TLS 1.3 con certificados de 256 bits). Las credenciales de acceso y tokens de sesión se gestionan mediante Firebase Authentication y Google Identity Services bajo estándares de máxima seguridad.
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <div className="border border-[#FACC15]/40 bg-[#FACC15]/5 p-3 rounded text-[11px] text-[#FACC15] font-mono">
                ✓ Transparencia total: Política de almacenamiento local, cookies y funcionamiento Offline PWA.
              </div>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                1. ¿Qué son las Cookies y Almacenamiento Local?
              </h3>
              <p>
                Una cookie es un pequeño archivo de texto almacenado en su navegador. Además, AgroBarú utiliza <code>localStorage</code> e <code>IndexedDB</code> para permitir que los productores registren cosechas en fincas remotas de Barú sin necesidad de conexión a internet (modo Offline PWA).
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                2. Categorías de Cookies Empleadas
              </h3>
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-[#141414] border border-[#1E293B]">
                  <strong className="text-[#15803D]">● Cookies Estrictamente Necesarias (Obligatorias):</strong> Permiten autenticar la sesión del productor/comprador, mantener el estado del carrito/escrow y sincronizar la cola de operaciones sin conexión. No pueden desactivarse.
                </div>
                <div className="p-2.5 bg-[#141414] border border-[#1E293B]">
                  <strong className="text-[#7C3AED]">● Cookies de Preferencias y Funcionalidad:</strong> Recuerdan su idioma preferido (Español / Inglés), el filtro de corregimiento activo (Puerto Armuelles, Limones, Progreso, Baco) y la preferencia de visualización de precios.
                </div>
                <div className="p-2.5 bg-[#141414] border border-[#1E293B]">
                  <strong className="text-[#38BDF8]">● Cookies de Rendimiento y Telemetría:</strong> Miden la velocidad de carga de las imágenes de cosechas y alertan sobre errores técnicos sin recopilar información personal identificable.
                </div>
              </div>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                3. ¿Cómo configurar o eliminar sus Cookies?
              </h3>
              <p>
                Puede cambiar sus preferencias en cualquier momento desde el botón "Preferencias de Cookies" en el pie de página o configurando su navegador para rechazar cookies de terceros.
              </p>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-4">
              <div className="border border-[#38BDF8]/40 bg-[#38BDF8]/5 p-3 rounded text-[11px] text-[#38BDF8] font-mono">
                ✓ Protocolo de Garantía Agrícola para Frutas y Productos Perecederos de Exportación.
              </div>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                1. Plazo de Inspección en Destino (Ventana de 24 a 48 Horas)
              </h3>
              <p>
                Debido a la naturaleza perecedera de las frutas tropicales (plátano curaré, banano Cavendish, papaya maradol), el comprador dispone de un plazo improrrogable de <strong>24 horas (envíos nacionales)</strong> o <strong>48 horas (contenedores refrigerados en puerto)</strong> tras la descarga física para inspeccionar la mercadería.
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                2. Causales Válidas de Reclamación
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>Discrepancia en peso mayor al 5% respecto al certificado de embarque.</li>
                <li>Presencia de plagas cuarentenarias o daño fúngico no reportado en la bitácora MIDA.</li>
                <li>Ruptura de la cadena de frío comprobable mediante los datos del sensor térmico exportable.</li>
                <li>Maduración prematura atribuible a mal manejo fitosanitario pre-embarque.</li>
              </ul>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                3. Procedimiento de Evidencia y Arbitraje
              </h3>
              <p>
                Para activar un reclamo, el comprador debe subir fotografías con fecha y hora del daño y el número de lote visible desde el módulo de resolución de disputas. El comité técnico de AgroBarú revisará la evidencia y, de ser procedente, devolverá el porcentaje correspondiente del fondo retenido en Escrow en un lapso no mayor a 72 horas hábiles.
              </p>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="border border-[#F97316]/40 bg-[#F97316]/5 p-3 rounded text-[11px] text-[#F97316] font-mono">
                ✓ Descargo de Responsabilidad Fitosanitaria, Meteorológica y de Mercado.
              </div>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                1. Factores Meteorológicos y de Fuerza Mayor
              </h3>
              <p>
                La agricultura de la Península de Burica y el Valle de Barú está sujeta a eventos climáticos imprevisibles (crecidas del Río Chiriquí Viejo, vendavales o períodos atípicos de lluvia). En tales casos, los productores podrán declarar causa de fuerza mayor debidamente refrendada por el MIDA regional para reprogramar fechas de corte sin penalidad económica.
              </p>

              <h3 className="text-base font-display font-bold text-[#E5E5E5] uppercase">
                2. Enlace con Sistemas Oficiales MIDA
              </h3>
              <p>
                AgroBarú trabaja en cooperación técnica con las directrices fitosanitarias de Sanidad Vegetal del MIDA; no obstante, las resoluciones finales de cuarentena o inspección en frontera son atribución exclusiva de las autoridades gubernamentales de la República de Panamá.
              </p>

              <div className="p-3 bg-[#141414] border border-[#1E293B] flex items-center justify-between text-[11px]">
                <span>Oficina Regional MIDA Barú: Paso Canoas / Progreso</span>
                <span className="text-[#15803D] font-mono font-bold">Tel: (507) 770-5231</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[11px] text-[#9E9E9E] flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Asociación de Productores de Barú • RUC: 8-NT-2-4190 • Puerto Armuelles</span>
          </div>
          <Button
            onClick={onClose}
            variant="default"
            size="sm"
            className="font-bold uppercase text-xs"
          >
            Entendido & Aceptar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
