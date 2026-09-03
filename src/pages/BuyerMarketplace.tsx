import React, { useState } from 'react';
import { ProductCatalog } from '@/components/marketplace/ProductCatalog';
import { OrderTracker } from '@/components/marketplace/OrderTracker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShoppingBag, Lock } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';

export const BuyerMarketplace: React.FC<{ 
  onNavigateToTraceability?: (code: string) => void;
  onNavigateToChat?: (contact: any) => void;
}> = ({
  onNavigateToTraceability,
  onNavigateToChat
}) => {
  const { orders } = useAppState();
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <div className="space-y-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            Catálogo de Cosechas
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Lock className="w-4 h-4" strokeWidth={1.5} />
            Contratos Escrow ({orders.length})
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
