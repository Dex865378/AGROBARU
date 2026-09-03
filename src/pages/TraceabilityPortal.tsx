import React from 'react';
import { QRScannerViewer } from '@/components/traceability/QRScannerViewer';

export const TraceabilityPortal: React.FC<{ initialBatchCode?: string }> = ({ initialBatchCode }) => {
  return (
    <div className="py-6">
      <QRScannerViewer initialBatchCode={initialBatchCode} />
    </div>
  );
};
