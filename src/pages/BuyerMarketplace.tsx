import React, { useState, useEffect } from 'react';
import { ProductCatalog } from '@/components/marketplace/ProductCatalog';
import { OrderTracker } from '@/components/marketplace/OrderTracker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShoppingBag, Lock } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';

export const BuyerMarketplace: React.FC<{ 
  onNavigateToTraceability?: (code: string) => void;
  onNavigateToChat?: (contact: any) => void;
  subTab?: 'catalog' | 'orders';
  onSubTabChange?: (tab: 'catalog' | 'orders') => void;
}> = ({
  onNavigateToTraceability,
  onNavigateToChat,
  subTab,
  onSubTabChange,
}) => {
  const { orders } = useAppState();
  const [internalTab, setInternalTab] = useState<'catalog' | 'orders'>(subTab || 'catalog');

  useEffect(() => {
    if (subTab) {
      setInternalTab(subTab);
    }
  }, [subTab]);

  const activeTab = subTab || internalTab;
  const handleTabChange = (val: string) => {
    const typed = (val === 'orders' ? 'orders' : 'catalog') as 'catalog' | 'orders';
    setInternalTab(typed);
    onSubTabChange?.(typed);
  };

  return (
    <div className="space-y-6 py-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap sm:inline-flex w-full sm:w-auto gap-1.5">
          <TabsTrigger value="catalog" className="flex-1 sm:flex-initial flex items-center gap-2 min-w-[140px]">
            <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Catálogo de Cosechas</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 sm:flex-initial flex items-center gap-2 min-w-[140px]">
            <Lock className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Mis Contratos ({orders.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <ProductCatalog 
            onNavigateToTraceability={onNavigateToTraceability} 
            onNavigateToChat={onNavigateToChat}
          />
        </TabsContent>

        <TabsContent value="orders">
          <OrderTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};
