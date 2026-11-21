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
import { AppStateProvider, useAppState } from '@/context/AppStateContext';
import type { UserRole } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
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
import { GoogleAccountChooserModal } from '@/components/auth/GoogleAccountChooserModal';
import { NotificationCenterModal } from '@/components/notifications/NotificationCenterModal';
import { fcmService } from '@/services/fcmService';
import { Badge } from '@/components/ui/badge';
import { LegalComplianceModal, LegalTabType } from '@/components/legal/LegalComplianceModal';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { GoogleBusinessProfileModal } from '@/components/legal/GoogleBusinessProfileModal';
import { HelpFaqModal } from '@/components/legal/HelpFaqModal';
import { QuickHelpWidget } from '@/components/legal/QuickHelpWidget';
import { CartDrawerModal } from '@/components/marketplace/CartDrawerModal';
import { NewUserAssistant } from '@/components/onboarding/NewUserAssistant';
import { useUnreadDirectChats } from '@/hooks/useUnreadDirectChats';

const CalculatorView: React.FC = () => {
  const { language } = useLanguage();
  const [calcTab, setCalcTab] = useState<'ROI' | 'REEFER'>('ROI');

  return (
    <div className="py-8 space-y-6 font-mono">
      {/* Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E26] pb-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#ECFDF5]">
            {language === 'en' ? 'AgroBarú Economic & Logistics Simulators' : 'Calculadoras de Rentabilidad y Logística'}
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans mt-0.5">
            {language === 'en' 
              ? 'Model your earnings, direct export margins, and container shipping loads.' 
              : 'Modela tus ingresos reales, márgenes de venta directa y capacidad de contenedores.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalcTab('ROI')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              calcTab === 'ROI'
                ? 'bg-[#10B981] text-[#05100A] border-[#10B981]'
                : 'bg-[#111714] text-[#9E9E9E] border-[#1E2E26] hover:text-[#E5E5E5]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Anti-Middleman ROI' : 'Ahorro vs. Intermediarios'}</span>
          </button>

          <button
            onClick={() => setCalcTab('REEFER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              calcTab === 'REEFER'
                ? 'bg-[#FACC15] text-[#05100A] border-[#FACC15]'
                : 'bg-[#111714] text-[#9E9E9E] border-[#1E2E26] hover:text-[#E5E5E5]'
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

const MainLayout: React.FC<{ roleLocked?: boolean; initialTab?: string }> = ({
  roleLocked,
  initialTab = 'home',
}) => {
  const { cart, currentUser, currentRole, firebaseUser } = useAppState();
  const chatUnreadCount = useUnreadDirectChats(firebaseUser?.uid);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [marketplaceSubTab, setMarketplaceSubTab] = useState<'catalog' | 'orders'>('catalog');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedBatchCodeForTrace, setSelectedBatchCodeForTrace] = useState<string>('AGRO-BARU-2026-CAV-089');
  const [activeChatContact, setActiveChatContact] = useState<ChatContact | null>(null);
  const [previousTab, setPreviousTab] = useState<string>('marketplace');

  // Legal, FAQ & Google Profile Modals
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType>('terms');
  const [isGoogleProfileOpen, setIsGoogleProfileOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [isCookieBannerVisible, setIsCookieBannerVisible] = useState<boolean>(false);

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenLegal = (tab: LegalTabType = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleNavigateToTraceability = (batchCode: string) => {
    setSelectedBatchCodeForTrace(batchCode);
    navigateToTab('traceability');
  };

  const handleOpenChat = (contact: ChatContact) => {
    setPreviousTab(activeTab);
    setActiveChatContact(contact);
    navigateToTab('chat');
  };

  // Listen for QR code scan URLs like ?batch=AGRO-BARU-2026-CAV-089 or #trace/... or ?legal=...
  useEffect(() => {
    const handleUrlRouting = () => {
      const params = new URLSearchParams(window.location.search);
      const batchFromQuery = params.get('batch') || params.get('verify');
      const legalFromQuery = params.get('legal');
      const faqFromQuery = params.get('faq');
      const googleFromQuery = params.get('google');
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const tabFromQuery = params.get('tab');

      if (legalFromQuery && ['terms', 'privacy', 'cookies', 'refunds', 'disclaimer'].includes(legalFromQuery)) {
        setLegalModalTab(legalFromQuery as LegalTabType);
        setIsLegalModalOpen(true);
      }

      if (faqFromQuery) {
        setIsFaqOpen(true);
      }

      if (googleFromQuery) {
        setIsGoogleProfileOpen(true);
      }

      if (batchFromQuery) {
        setSelectedBatchCodeForTrace(batchFromQuery);
        setActiveTab('traceability');
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else if (hash.startsWith('#trace/')) {
        const code = hash.replace('#trace/', '');
        if (code) {
          setSelectedBatchCodeForTrace(code);
          setActiveTab('traceability');
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      } else if (pathname.startsWith('/trace/')) {
        const code = pathname.replace('/trace/', '');
        if (code) {
          setSelectedBatchCodeForTrace(code);
          setActiveTab('traceability');
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      } else {
        // Deep links por hash para cada sección (compatibilidad con enlaces compartidos)
        const hashRoutes: Record<string, string> = {
          '#directorio': 'chat',
          '#directory': 'chat',
          '#chat': 'chat',
          '#productores': 'chat',
          '#mercado': 'marketplace',
          '#marketplace': 'marketplace',
          '#bitacora': 'farmer',
          '#farmer': 'farmer',
          '#trazabilidad': 'traceability',
          '#traceability': 'traceability',
          '#alertas': 'alerts',
          '#alerts': 'alerts',
          '#calculadora': 'calculator',
          '#calculator': 'calculator',
          '#cooperativa': 'cooperative',
          '#cooperative': 'cooperative',
          '#mapa': 'cooperative',
          '#map': 'cooperative',
          '#gis': 'cooperative',
          '#catastro': 'cooperative',
          '#perfil': 'profile',
          '#profile': 'profile',
          '#inicio': 'home',
          '#home': 'home',
        };
        // Enlaces heredados con ?tab=... (sitemap, campañas, WhatsApp)
        const queryTabs: Record<string, string> = {
          home: 'home',
          marketplace: 'marketplace',
          mercado: 'marketplace',
          traceability: 'traceability',
          trazabilidad: 'traceability',
          calculator: 'calculator',
          calculadora: 'calculator',
          cooperative: 'cooperative',
          cooperativa: 'cooperative',
          profile: 'profile',
          perfil: 'profile',
          alerts: 'alerts',
          alertas: 'alerts',
          chat: 'chat',
          directorio: 'chat',
        };
        const routeTab = hashRoutes[hash] || (tabFromQuery ? queryTabs[tabFromQuery] : undefined);
        if (routeTab) {
          setActiveTab(routeTab);
          window.scrollTo({ top: 0, behavior: 'auto' });
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

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  // Register PWA Service Worker on load & handle FCM notifications
  useEffect(() => {
    // Check unread count
    const updateUnread = () => {
      const history = fcmService.getNotificationHistory();
      const unread = history.filter((n) => !n.read).length;
      setUnreadNotifications(unread);
    };
    updateUnread();

    const unsubNotif = fcmService.onNotification(() => {
      updateUnread();
    });

    const unsubNav = fcmService.onNavigation((route) => {
      if (route === 'pest_engine' || route === 'pest-radar' || route === 'alerts') {
        setActiveTab('alerts');
      } else if (route === 'orders' || route === 'marketplace') {
        setActiveTab('marketplace');
      } else if (route) {
        setActiveTab(route);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    return () => {
      unsubNotif();
      unsubNav();
    };
  }, []);

  return (
    <BackgroundGrid>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={navigateToTab} 
        onNavigateToChat={handleOpenChat}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          setUnreadNotifications(0);
        }}
        unreadCount={unreadNotifications}
        chatUnreadCount={chatUnreadCount}
        onOpenChatInbox={() => {
          setActiveChatContact(null);
          navigateToTab('chat');
        }}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        roleLocked={roleLocked}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 flex-1 w-full min-w-0 pb-8 md:pb-12 overflow-x-hidden">
        <div key={activeTab} className="w-full min-w-0">
          {activeTab === 'home' && (
            <HomePage 
              onNavigate={navigateToTab} 
              onOpenLegalModal={handleOpenLegal}
              onOpenGoogleProfile={() => setIsGoogleProfileOpen(true)}
            />
          )}
          {activeTab === 'farmer' && (
            <FarmerDashboard />
          )}
          {activeTab === 'marketplace' && (
            <BuyerMarketplace 
              onNavigateToTraceability={handleNavigateToTraceability} 
              onNavigateToChat={handleOpenChat}
              subTab={marketplaceSubTab}
              onSubTabChange={setMarketplaceSubTab}
            />
          )}
          {activeTab === 'traceability' && (
            <TraceabilityPortal initialBatchCode={selectedBatchCodeForTrace} />
          )}
          {activeTab === 'calculator' && (
            <CalculatorView />
          )}
          {activeTab === 'profile' && (
            <ProfilePage onBack={() => navigateToTab('home')} />
          )}
          {activeTab === 'alerts' && (
            <PestMonitorPage />
          )}
          {activeTab === 'cooperative' && (
            <CooperativePortal onNavigate={navigateToTab} onNavigateToChat={handleOpenChat} />
          )}
          {activeTab === 'chat' && (
            <DirectChatPage
              contact={activeChatContact}
              onBack={() => navigateToTab(previousTab || 'marketplace')}
              onSelectContact={(c) => setActiveChatContact(c)}
            />
          )}
        </div>
      </main>

      {/* Floating Interactive Navigation Dock */}
      <div className="fixed bottom-3 left-0 right-0 z-30 flex justify-center pointer-events-none px-4 md:hidden">
        <div className="pointer-events-auto">
          <Dock direction="middle">
            <DockIcon
              active={activeTab === 'home'}
              onClick={() => navigateToTab('home')}
              title="Inicio"
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'farmer'}
              onClick={() => navigateToTab('farmer')}
              title="Bitácora Productor (PWA)"
            >
              <Sprout className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'marketplace'}
              onClick={() => navigateToTab('marketplace')}
              title="Marketplace & Escrow"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'traceability'}
              onClick={() => navigateToTab('traceability')}
              title="Auditoría QR & Hashes"
            >
              <QrCode className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'calculator'}
              onClick={() => navigateToTab('calculator')}
              title="Calculadoras Ahorro & Reefer"
            >
              <Calculator className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'profile'}
              onClick={() => navigateToTab('profile')}
              title="Mi Perfil y Credencial"
            >
              <UserIcon className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'alerts'}
              onClick={() => navigateToTab('alerts')}
              title="Alertas Sigatoka / Clima"
            >
              <Bug className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>

            <DockIcon
              active={activeTab === 'cooperative'}
              onClick={() => navigateToTab('cooperative')}
              title="MIDA / Mapa GIS Barú"
            >
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
            </DockIcon>
          </Dock>
        </div>
      </div>

      <NewUserAssistant
        enabled={Boolean(roleLocked)}
        userId={currentUser.id}
        role={currentRole}
        onNavigate={navigateToTab}
      />

      <Footer 
        onOpenLegalModal={handleOpenLegal}
        onOpenGoogleProfile={() => setIsGoogleProfileOpen(true)}
        onOpenFaqModal={() => setIsFaqOpen(true)}
      />
      <GoogleAccountChooserModal />
      <NotificationCenterModal
        open={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
        chatUnreadCount={chatUnreadCount}
        onOpenChat={() => {
          setActiveChatContact(null);
          navigateToTab('chat');
        }}
        onNavigate={(route) => {
          if (route === 'pest_engine' || route === 'pest-radar' || route === 'alerts') {
            setActiveTab('alerts');
          } else if (route === 'orders' || route === 'marketplace') {
            setActiveTab('marketplace');
          } else if (route) {
            setActiveTab(route);
          }
          window.scrollTo({ top: 0, behavior: 'auto' });
        }}
      />

      {/* Floating Trust & Support Widgets */}
      <CookieConsentBanner
        onOpenPolicy={() => handleOpenLegal('cookies')}
        onVisibilityChange={setIsCookieBannerVisible}
      />
      <QuickHelpWidget 
        onOpenFaq={() => setIsFaqOpen(true)}
        onOpenGoogleProfile={() => setIsGoogleProfileOpen(true)}
        onOpenLegal={(tab) => handleOpenLegal(tab)}
        hidden={isCookieBannerVisible}
      />

      {/* Legal & Compliance Modals */}
      <LegalComplianceModal 
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
      <GoogleBusinessProfileModal 
        isOpen={isGoogleProfileOpen}
        onClose={() => setIsGoogleProfileOpen(false)}
      />
      <HelpFaqModal 
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        onOpenLegalTab={(tab) => handleOpenLegal(tab)}
      />

      {/* Unified Multi-Batch Shopping Cart Drawer */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onExploreMarketplace={() => navigateToTab('marketplace')}
        onOrdersCreated={() => {
          setActiveTab('marketplace');
          setMarketplaceSubTab('orders');
          window.scrollTo({ top: 0, behavior: 'auto' });
        }}
      />
    </BackgroundGrid>
  );
};

export function App({
  initialRole,
  roleLocked = false,
  initialTab = 'home',
}: {
  initialRole?: UserRole;
  roleLocked?: boolean;
  initialTab?: string;
} = {}) {
  return (
    <NotificationProvider>
      <AppStateProvider initialRole={initialRole}>
        <MainLayout roleLocked={roleLocked} initialTab={initialTab} />
      </AppStateProvider>
    </NotificationProvider>
  );
}

export default App;
