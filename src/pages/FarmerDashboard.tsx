import React, { useState } from 'react';
import { CultivationBlockchain } from '@/components/farmer/CultivationBlockchain';
import { FarmManagement } from '@/components/farmer/FarmManagement';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, FileSpreadsheet } from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('blockchain');

  return (
    <div className="space-y-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="blockchain" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" strokeWidth={1.5} />
            Cadena de Bloques (Bitácora)
          </TabsTrigger>
          <TabsTrigger value="farms" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" strokeWidth={1.5} />
            Parcelas & Lotes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blockchain">
          <CultivationBlockchain />
        </TabsContent>

        <TabsContent value="farms">
          <FarmManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
