import React, { useState } from 'react';
import { CultivationBlockchain } from '@/components/farmer/CultivationBlockchain';
import { FarmManagement } from '@/components/farmer/FarmManagement';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sprout, FileSpreadsheet } from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('farms');

  return (
    <div className="space-y-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap sm:inline-flex w-full sm:w-auto gap-1.5">
          <TabsTrigger value="farms" className="flex-1 sm:flex-initial flex items-center gap-2 min-w-[140px]">
            <Sprout className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Publicar y Mis Lotes</span>
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="flex-1 sm:flex-initial flex items-center gap-2 min-w-[140px]">
            <FileSpreadsheet className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Bitácora de Campo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="farms">
          <FarmManagement />
        </TabsContent>

        <TabsContent value="blockchain">
          <CultivationBlockchain />
        </TabsContent>
      </Tabs>
    </div>
  );
};
