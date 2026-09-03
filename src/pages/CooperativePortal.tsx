import React, { useState } from 'react';
import { BaruGeoMap } from '@/components/cooperative/BaruGeoMap';
import { DistrictAnalytics } from '@/components/cooperative/DistrictAnalytics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, BarChart3 } from 'lucide-react';

export const CooperativePortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gis');

  return (
    <div className="space-y-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="gis" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" strokeWidth={1.5} />
            Mapa Geoespacial GIS
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            Estadísticas & MIDA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gis">
          <BaruGeoMap />
        </TabsContent>

        <TabsContent value="analytics">
          <DistrictAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
