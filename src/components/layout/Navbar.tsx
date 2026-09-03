import React from 'react';
import { 
  Sprout, 
  ShoppingBag, 
  QrCode, 
  Building2, 
  Bug, 
  Wifi, 
  WifiOff, 
  Radio, 
  ShieldCheck, 
  Package, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Star, 
  Award, 
  Calculator,
  Languages,
  Users
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types';
import { calculateReputationTier } from '@/services/reputationService';
import { GlobalSearchBar } from './GlobalSearchBar';
import { ChatContact } from '@/components/chat/DirectMessageModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigateToChat?: (contact: ChatContact) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  onNavigateToChat 
}) => {
  const { 
    isOffline, 
    syncQueue, 
    currentRole, 
    setCurrentRole,
    currentUser,
    firebaseUser,
    isAuthLoading,
    loginWithGoogle,
    logout
  } = useAppState();

  const { language, setLanguage, t } = useLanguage();

  const tierInfo = calculateReputationTier(
    currentUser.reputationScore || 99.4, 
    currentUser.successfulEscrowTrades || 12
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#15803D] bg-[#0A0A0A]/95 backdrop-blur-md">
      {/* Top Territorial & Network Status Ticker */}
      <div className="bg-[#0E0E0E] border-b border-[#1E293B] px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
        <div className="flex items-center gap-4 text-[#9E9E9E]">
          <span className="flex items-center gap-1.5 text-[#15803D] font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#15803D]" strokeWidth={1.5} />
            ● Red AgroBarú Oficial | Puerto Armuelles, Chiriquí
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector ES / EN */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#FACC15] px-2 py-0.5 text-[10px] font-bold text-[#E5E5E5] shadow-[2px_2px_0px_0px_#FACC15] transition-all"
            title="Cambiar Idioma / Switch Language"
          >
            <Languages className="w-3 h-3 text-[#FACC15]" />
            <span>{language === 'es' ? 'ES 🇵🇦' : 'EN 🌐'}</span>
          </button>

          {/* Connection Status Indicator */}
          {!isOffline ? (
            <span className="hidden sm:flex items-center gap-1 text-[#15803D] font-bold">
              <Wifi className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t('nav.online', 'Conectado en Vivo')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#F97316] font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t('nav.offline', 'Modo Offline (Guardado Local)')}
            </span>
          )}

          {syncQueue.length > 0 && (
            <Badge variant="yellow" className="text-[10px] animate-bounce">
              <Package className="w-3 h-3 mr-1" />
              {syncQueue.length} Por Sincronizar
            </Badge>
          )}

          {/* Google Auth Status / Glowing Reputation Button */}
          {firebaseUser ? (
            <div className="flex items-center gap-1.5 bg-[#141414] border border-[#15803D] px-2 py-0.5 shadow-[2px_2px_0px_0px_#15803D]">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 transition-all px-1.5 py-0.5 ${
                  activeTab === 'profile' ? 'bg-[#15803D]/20 border border-[#15803D]' : 'hover:opacity-90'
                }`}
                title="Abrir Mi Perfil y Credencial Completa"
              >
                <div className={`w-4 h-4 overflow-hidden flex items-center justify-center ${tierInfo.avatarBorderClass}`}>
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <UserIcon className="w-3 h-3 text-[#15803D]" />
                  )}
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[100px] ${tierInfo.nameGlowClass}`}>
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[#FACC15] font-black text-[10px] flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-[#FACC15]" />
                  {currentUser.reputationScore || 99.4}%
                </span>
              </button>
              <button
                onClick={() => logout()}
                className="text-[#F97316] hover:text-white p-0.5 ml-1"
                title="Cerrar sesión de Google"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              disabled={isAuthLoading}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#7C3AED] text-[#E5E5E5] text-[10px] font-bold transition-all shadow-[2px_2px_0px_0px_#7C3AED]"
            >
              <LogIn className="w-3 h-3 text-[#7C3AED]" />
              {isAuthLoading ? 'Cargando...' : t('nav.login', 'Iniciar con Google')}
            </button>
          )}

          {/* Role switcher */}
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-[#141414] border border-[#15803D] text-[#E5E5E5] text-[10px] px-2 py-0.5 font-mono focus:border-[#FACC15] focus:outline-none"
          >
            <option value="farmer">Rol: Productor (Barú)</option>
            <option value="buyer">Rol: Comprador / Exportador</option>
            <option value="cooperative">Rol: MIDA / Cooperativa</option>
          </select>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 bg-[#15803D] border-2 border-[#15803D] flex items-center justify-center font-display font-black text-black text-xl shadow-[3px_3px_0px_0px_#FACC15] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
            AB
          </div>
          <div>
            <div className="font-display font-black text-xl tracking-wider text-[#E5E5E5] flex items-center gap-1.5">
              AGRO<span className="text-[#15803D]">BARÚ</span>
            </div>
            <div className="text-[9px] font-mono text-[#9E9E9E] uppercase tracking-widest -mt-1">
              Barú • Chiriquí • Panamá
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs font-bold">
          {[
            { id: 'home', label: t('nav.home', 'Inicio') },
            { id: 'farmer', label: t('nav.farmer', 'Bitácora'), icon: Sprout },
            { id: 'marketplace', label: t('nav.marketplace', 'Mercado'), icon: ShoppingBag },
            { id: 'traceability', label: t('nav.traceability', 'Verificador QR'), icon: QrCode },
            { id: 'alerts', label: t('nav.alerts', 'Comunidad & Alertas'), icon: Users },
            { id: 'calculator', label: t('nav.calculator', 'Calculadora'), icon: Calculator },
            { id: 'cooperative', label: t('nav.cooperative', 'MIDA / GIS'), icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-all uppercase text-[11px] ${
                  isActive
                    ? 'bg-[#15803D] text-black border-2 border-[#15803D] shadow-[2px_2px_0px_0px_#FACC15]'
                    : 'text-[#9E9E9E] hover:text-[#E5E5E5] hover:bg-[#141414] border-2 border-transparent'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Search Strip (Header Integrated) */}
      <div className="bg-[#0E0E0E] border-t border-[#1E293B] px-4 py-2 flex items-center justify-center">
        <GlobalSearchBar onNavigateToTab={setActiveTab} onNavigateToChat={onNavigateToChat} />
      </div>
    </header>
  );
};
