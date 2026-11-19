import React, { useState } from 'react';
import { BaruGeoMap } from '@/components/cooperative/BaruGeoMap';
import { DistrictAnalytics } from '@/components/cooperative/DistrictAnalytics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, BarChart3 } from 'lucide-react';
import { ChatContact } from '@/components/chat/DirectMessageModal';

interface CooperativePortalProps {
  onNavigate?: (tab: string) => void;
  onNavigateToChat?: (contact: ChatContact) => void;
}

export const CooperativePortal: React.FC<CooperativePortalProps> = ({
  onNavigate,
  onNavigateToChat,
}) => {
  const [activeTab, setActiveTab] = useState('gis');

  return (
    <div className="space-y-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap sm:inline-flex w-full sm:w-auto gap-1.5">
          <TabsTrigger value="gis" className="flex-1 sm:flex-initial flex items-center gap-2 min-w-[140px]">
            <MapPin className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Mapa Geoespacial GIS</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 sm:flex-initial flex items-center gap-2 min-w-[140px]">
            <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Estadísticas & MIDA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gis">
          <BaruGeoMap
            onNavigateToChat={onNavigateToChat}
            onNavigateToMarketplace={onNavigate ? () => onNavigate('marketplace') : undefined}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <DistrictAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
