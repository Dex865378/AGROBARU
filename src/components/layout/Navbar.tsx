import React from 'react';
import { 
  Sprout, 
  ShoppingBag, 
  ShoppingCart,
  QrCode, 
  Building2, 
  Wifi, 
  WifiOff, 
  Radio, 
  Package, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Star, 
  Calculator,
  Languages,
  Users,
  Bell,
  MessageSquare
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { isAdminEmail } from '@/lib/admin';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types';
import { calculateReputationTier } from '@/services/reputationService';
import { GlobalSearchBar } from './GlobalSearchBar';
import { ChatContact } from '@/components/chat/DirectMessageModal';
import { SafeImage } from '@/components/ui/SafeImage';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigateToChat?: (contact: ChatContact) => void;
  onOpenNotifications?: () => void;
  onOpenChatInbox?: () => void;
  chatUnreadCount?: number;
  unreadCount?: number;
  cartCount?: number;
  onOpenCart?: () => void;
  roleLocked?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  onNavigateToChat,
  onOpenNotifications,
  onOpenChatInbox,
  chatUnreadCount = 0,
  unreadCount = 0,
  cartCount = 0,
  onOpenCart,
  roleLocked = false,
}) => {
  const { 
    isOffline, 
    syncQueue, 
    currentRole, 
    setCurrentRole,
    currentUser,
    firebaseUser,
    openAccountChooser,
    logout
  } = useAppState();

  const { language, setLanguage, t } = useLanguage();

  const tierInfo = calculateReputationTier(
    currentUser.reputationScore || 99.4, 
    currentUser.successfulEscrowTrades || 12
  );

  return (
    <header className="relative md:sticky md:top-0 z-40 w-full border-b border-[#1E2E26] bg-[#090D0B]/95 backdrop-blur-md">
      {/* Top Territorial & Network Status Ticker */}
      <div className="bg-[#0C120E] border-b border-[#1E2E26] px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
        <div className="flex items-center gap-2 text-[#9E9E9E] min-w-0">
          <span className="flex items-center gap-1.5 text-[#10B981] font-semibold truncate">
            <Radio className="w-3.5 h-3.5 text-[#10B981] shrink-0" strokeWidth={1.75} />
            <span className="hidden truncate sm:inline">
              {language === 'en' ? 'Official AgroBarú Network | Puerto Armuelles' : 'Red AgroBarú Oficial | Puerto Armuelles'}
            </span>
            <span className="truncate sm:hidden">
              {language === 'en' ? 'AgroBarú · Barú' : 'AgroBarú · Barú'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap max-w-full">
          {/* Language Selector ES / EN */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 bg-[#111714] hover:bg-[#161E19] border border-[#1E2E26] hover:border-[#FACC15]/50 rounded-lg px-2.5 py-1 text-[10px] font-bold text-[#E5E5E5] transition-all"
            title="Cambiar Idioma / Switch Language"
          >
            <Languages className="w-3 h-3 text-[#FACC15]" />
            <span>{language === 'es' ? 'ES' : 'EN'}</span>
          </button>

          {/* Connection Status Indicator */}
          {!isOffline ? (
            <span className="hidden sm:flex items-center gap-1 text-[#10B981] font-semibold">
              <Wifi className="w-3.5 h-3.5" strokeWidth={1.75} />
              {t('nav.online', 'Conectado')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#F97316] font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" strokeWidth={1.75} />
              {t('nav.offline', 'Modo Offline')}
            </span>
          )}

          {syncQueue.length > 0 && (
            <Badge variant="yellow" className="text-[10px]">
              <Package className="w-3 h-3 mr-1" />
              {syncQueue.length} Por Sincronizar
            </Badge>
          )}

          {/* Shopping Cart Trigger */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111714] hover:bg-[#161E19] border border-[#10B981]/40 hover:border-[#10B981] text-[#ECFDF5] transition-all text-[11px] font-bold"
              title="Abrir Carrito Multi-Lote"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#10B981] text-[#05100A] text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Chat inbox unread badge */}
          {onOpenChatInbox && (
            <button
              onClick={onOpenChatInbox}
              className="relative p-1.5 rounded-lg bg-[#111714] hover:bg-[#161E19] border border-[#1E2E26] hover:border-[#10B981]/50 text-[#E5E5E5] transition-all"
              title="Abrir mensajes"
              aria-label="Abrir mensajes"
            >
              <MessageSquare className="w-4 h-4 text-[#10B981]" />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#10B981] text-black text-[9px] font-black flex items-center justify-center">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </button>
          )}

          {/* FCM Push Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg bg-[#111714] hover:bg-[#161E19] border border-[#1E2E26] hover:border-[#10B981]/50 text-[#E5E5E5] transition-all"
            title="Centro de Notificaciones"
          >
            <Bell className="w-4 h-4 text-[#FACC15]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#F97316] text-black text-[9px] font-black flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Acceso empresarial real (correo / Google): solo para visitantes */}
          {!firebaseUser && (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111714] hover:bg-[#161E19] border border-[#1E2E26] hover:border-[#10B981]/50 text-[#9E9E9E] hover:text-[#E5E5E5] text-[10px] font-bold transition-all"
              title="Acceso empresarial con correo electrónico o Google"
            >
              <Building2 className="w-3 h-3 text-[#10B981]" />
              <span className="hidden lg:inline">Acceso Empresarial</span>
            </Link>
          )}

          {/* Google Auth Status / Reputation Button */}
          {firebaseUser ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#111714] border border-[#10B981]/40 rounded-lg px-2 py-0.5">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
                className={`flex items-center gap-1.5 transition-all px-1.5 py-0.5 rounded-md ${
                  activeTab === 'profile' ? 'bg-[#10B981]/20' : 'hover:opacity-90'
                }`}
                title="Abrir Mi Perfil y Credencial"
              >
                <div className={`w-4 h-4 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${tierInfo.avatarBorderClass}`}>
                  <SafeImage
                    fallbackType="avatar"
                    nameHint={currentUser.name}
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[100px] ${tierInfo.nameGlowClass}`}>
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[#FACC15] font-black text-[10px] flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-[#FACC15]" />
                  {currentUser.reputationScore || 99.4}%
                </span>
              </button>

              {roleLocked && isAdminEmail(currentUser.email) && (
                <Link
                  to="/admin"
                  className="text-[#FACC15] hover:text-white px-1.5 py-0.5 text-[9px] font-bold border border-[#FACC15]/30 hover:border-[#FACC15] rounded transition-colors"
                  title="Panel de administración"
                >
                  Admin
                </Link>
              )}

              {roleLocked ? (
                <Link
                  to="/perfil"
                  className="text-[#FACC15] hover:text-white px-1.5 py-0.5 text-[9px] font-bold border border-[#FACC15]/30 hover:border-[#FACC15] rounded transition-colors"
                  title="Mi cuenta, rol y seguridad"
                >
                  Mi cuenta
                </Link>
              ) : (
                <button
                  onClick={() => openAccountChooser()}
                  className="text-[#FACC15] hover:text-white px-1.5 py-0.5 text-[9px] font-bold border border-[#FACC15]/30 hover:border-[#FACC15] rounded transition-colors"
                  title="Cambiar cuenta de Google"
                >
                  Cambiar cuenta
                </button>
              )}

              <button
                onClick={() => logout()}
                className="text-[#F97316] hover:text-white p-0.5 ml-0.5"
                title="Cerrar sesión de Google"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              title="Iniciar sesión con correo electrónico o Google"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111714] hover:bg-[#161E19] border border-[#7C3AED]/60 text-[#E5E5E5] text-[10px] font-bold transition-all"
            >
              <LogIn className="w-3 h-3 text-[#A78BFA]" />
              {t('nav.login', 'Iniciar sesión')}
            </Link>
          )}

          {/* Role switcher: oculto cuando el rol viene del acceso empresarial */}
          {!roleLocked && (
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-[#111714] border border-[#1E2E26] rounded-lg text-[#E5E5E5] text-[10px] px-2 py-1 font-mono focus:border-[#10B981] focus:outline-none max-w-full"
            >
              <option value="farmer">{language === 'en' ? 'Role: Producer (Barú)' : 'Rol: Productor (Barú)'}</option>
              <option value="buyer">{language === 'en' ? 'Role: Buyer / Exporter' : 'Rol: Comprador / Exportador'}</option>
              <option value="cooperative">{language === 'en' ? 'Role: MIDA / Cooperative' : 'Rol: MIDA / Cooperativa'}</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between min-h-16 h-auto py-2.5 gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center font-display font-bold text-[#05100A] text-lg shadow-sm group-hover:scale-105 transition-transform">
            AB
          </div>
          <div>
            <div className="font-display font-bold text-xl tracking-wider leading-snug text-[#ECFDF5] flex items-center gap-1.5">
              AGRO<span className="text-[#10B981]">BARÚ</span>
            </div>
            <div className="text-[9px] font-mono text-[#9E9E9E] uppercase tracking-widest mt-0.5 leading-normal">
              Barú • Chiriquí • Panamá
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 font-sans text-xs font-semibold">
          {[
            { id: 'home', label: t('nav.home', 'Inicio') },
            { id: 'farmer', label: t('nav.farmer', 'Bitácora'), icon: Sprout },
            { id: 'marketplace', label: t('nav.marketplace', 'Mercado'), icon: ShoppingBag },
            { id: 'traceability', label: t('nav.traceability', 'Trazabilidad'), icon: QrCode },
            { id: 'alerts', label: t('nav.alerts', 'Comunidad'), icon: Users },
            { id: 'calculator', label: t('nav.calculator', 'Calculadoras'), icon: Calculator },
            { id: 'cooperative', label: t('nav.cooperative', 'Cooperativa'), icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs ${
                  isActive
                    ? 'bg-[#10B981] text-[#05100A] font-bold shadow-sm'
                    : 'text-[#9E9E9E] hover:text-[#ECFDF5] hover:bg-[#111714]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Search Strip (Header Integrated) */}
      <div className="bg-[#0C120E] border-t border-[#1E2E26] px-4 py-2 flex items-center justify-center">
        <GlobalSearchBar onNavigateToTab={setActiveTab} onNavigateToChat={onNavigateToChat} />
      </div>
    </header>
  );
};
