import React from 'react';
import CashReport from './CashReport';

interface CaisseDailyReportProps {
  dbState: any;
  currentUser?: any;
  onSave?: (state: any, modifiedKeys?: string[]) => void;
  setDbState?: React.Dispatch<React.SetStateAction<any>>;
  triggerToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function CaisseDailyReport({ dbState, currentUser, onSave, setDbState, triggerToast }: CaisseDailyReportProps) {
  return (
    <CashReport
      dbState={dbState}
      currentUser={currentUser}
      onSave={onSave}
      setDbState={setDbState}
      triggerToast={triggerToast}
    />
  );
}

export default CaisseDailyReport;

