import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  ShoppingBag, 
  QrCode, 
  Building2, 
  Bug, 
  Home,
  Calculator,
  User as UserIcon,
  Truck
} from 'lucide-react';
import { NotificationProvider } from '@/context/NotificationContext';
import { AppStateProvider } from '@/context/AppStateContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BackgroundGrid } from '@/components/aceternity/BackgroundGrid';
import { Dock, DockIcon } from '@/components/magicui/Dock';

// Pages & Tools
import { HomePage } from '@/pages/HomePage';
import { FarmerDashboard } from '@/pages/FarmerDashboard';
import { BuyerMarketplace } from '@/pages/BuyerMarketplace';
import { TraceabilityPortal } from '@/pages/TraceabilityPortal';
import { PestMonitorPage } from '@/pages/PestMonitorPage';
import { CooperativePortal } from '@/pages/CooperativePortal';
import { AntiIntermediaryCalculator } from '@/components/tools/AntiIntermediaryCalculator';
import { ReeferLogisticsCalculator } from '@/components/tools/ReeferLogisticsCalculator';
import { ProfilePage } from '@/pages/ProfilePage';
import { DirectChatPage } from '@/pages/DirectChatPage';
import { ChatContact } from '@/components/chat/DirectMessageModal';
import { Badge } from '@/components/ui/badge';

const CalculatorView: React.FC = () => {
  const { language } = useLanguage();
  const [calcTab, setCalcTab] = useState<'ROI' | 'REEFER'>('ROI');

  return (
    <div className="py-8 space-y-6 font-mono">
      {/* Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="text-2xl font-display font-black text-[#E5E5E5] uppercase">
            {language === 'en' ? 'AgroBarú Economic & Logistics Simulators' : 'Herramientas de Simulación Económica & Logística'}
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            {language === 'en' 
              ? 'Model your earnings, direct export margins, and container shipping loads.' 
              : 'Modela tus ingresos reales, márgenes de exportación directa y capacidad de contenedores.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalcTab('ROI')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border transition-all ${
              calcTab === 'ROI'
                ? 'bg-[#15803D] text-black border-[#15803D] shadow-[2px_2px_0px_0px_#FACC15]'
                : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B] hover:text-[#E5E5E5]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Anti-Middleman ROI' : 'Ahorro vs Intermediarios'}</span>
          </button>

          <button
            onClick={() => setCalcTab('REEFER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border transition-all ${
              calcTab === 'REEFER'
                ? 'bg-[#FACC15] text-black border-[#FACC15] shadow-[2px_2px_0px_0px_#15803D]'
                : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B] hover:text-[#E5E5E5]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Reefer Container (40ft)' : 'Carga Contenedor Reefer'}</span>
          </button>
        </div>
      </div>

      {calcTab === 'ROI' ? (
        <AntiIntermediaryCalculator />
      ) : (
        <ReeferLogisticsCalculator />
      )}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedBatchCodeForTrace, setSelectedBatchCodeForTrace] = useState<string>('AGRO-BARU-2026-CAV-089');
  const [activeChatContact, setActiveChatContact] = useState<ChatContact | null>(null);
  const [previousTab, setPreviousTab] = useState<string>('marketplace');

  const handleNavigateToTraceability = (batchCode: string) => {
    setSelectedBatchCodeForTrace(batchCode);
    setActiveTab('traceability');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChat = (contact: ChatContact) => {
    setPreviousTab(activeTab);
    setActiveChatContact(contact);
    setActiveTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for QR code scan URLs like ?batch=AGRO-BARU-2026-CAV-089 or #trace/...
  useEffect(() => {
    const handleUrlRouting = () => {
      const params = new URLSearchParams(window.location.search);
      const batchFromQuery = params.get('batch') || params.get('verify');
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (batchFromQuery) {
        setSelectedBatchCodeForTrace(batchFromQuery);
        setActiveTab('traceability');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash.startsWith('#trace/')) {
        const code = hash.replace('#trace/', '');
        if (code) {
          setSelectedBatchCodeForTrace(code);
          setActiveTab('traceability');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (pathname.startsWith('/trace/')) {
        const code = pathname.replace('/trace/', '');
        if (code) {
          setSelectedBatchCodeForTrace(code);
          setActiveTab('traceability');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, []);

  // Register PWA Service Worker on load
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('AgroBarú ServiceWorker registrado:', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker error:', err);
          }
        );
      });
    }
  }, []);

  return (
    <BackgroundGrid>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onNavigateToChat={handleOpenChat}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 flex-1 w-full pb-24">
        {activeTab === 'home' && (
          <HomePage onNavigate={setActiveTab} />
        )}
        {activeTab === 'farmer' && (
          <FarmerDashboard />
        )}
        {activeTab === 'marketplace' && (
          <BuyerMarketplace 
            onNavigateToTraceability={handleNavigateToTraceability} 
            onNavigateToChat={handleOpenChat}
          />
        )}
        {activeTab === 'traceability' && (
          <TraceabilityPortal initialBatchCode={selectedBatchCodeForTrace} />
        )}
        {activeTab === 'calculator' && (
          <CalculatorView />
        )}
        {activeTab === 'profile' && (
          <ProfilePage onBack={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        )}
        {activeTab === 'alerts' && (
          <PestMonitorPage />
        )}
        {activeTab === 'cooperative' && (
          <CooperativePortal />
        )}
        {activeTab === 'chat' && (
          <DirectChatPage
            contact={activeChatContact}
            onBack={() => {
              setActiveTab(previousTab || 'marketplace');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectContact={(c) => setActiveChatContact(c)}
          />
        )}
      </main>

      {/* Floating MagicUI Interactive Navigation Dock */}
      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto">
          <Dock direction="middle" className="rounded-none">
            <DockIcon
              active={activeTab === 'home'}
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Inicio"
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'farmer'}
              onClick={() => {
                setActiveTab('farmer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Bitácora Productor (PWA)"
            >
              <Sprout className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'marketplace'}
              onClick={() => {
                setActiveTab('marketplace');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Marketplace & Escrow"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'traceability'}
              onClick={() => {
                setActiveTab('traceability');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Auditoría QR & Hashes"
            >
              <QrCode className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'calculator'}
              onClick={() => {
                setActiveTab('calculator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Calculadoras Ahorro & Reefer"
            >
              <Calculator className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'profile'}
              onClick={() => {
                setActiveTab('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Mi Perfil y Credencial"
            >
              <UserIcon className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'alerts'}
              onClick={() => {
                setActiveTab('alerts');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Alertas Sigatoka / Clima"
            >
              <Bug className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'cooperative'}
              onClick={() => {
                setActiveTab('cooperative');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="MIDA / Mapa GIS Barú"
            >
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>
          </Dock>
        </div>
      </div>

      <Footer />
    </BackgroundGrid>
  );
};

export function App() {
  return (
    <NotificationProvider>
      <LanguageProvider>
        <AppStateProvider>
          <MainLayout />
        </AppStateProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}

export default App;
