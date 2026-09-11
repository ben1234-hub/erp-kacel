import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { CaisseDailyReport } from './CaisseDailyReport';

interface Props {
  dbState: any;
  currentUser: any;
}

export function CaisseReportWrapper({ dbState, currentUser }: Props) {
  const [open, setOpen] = useState(false);

  if (currentUser?.Role !== 'Admin' && currentUser?.Role !== 'Assistante') return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-700 transition font-bold text-sm"
      >
        <FileText size={18} /> Rapport Caisse
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Rapport Caisse Quotidien</h2>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <CaisseDailyReport dbState={dbState} currentUser={currentUser} />
          </div>
        </div>
      )}
    </>
  );
}
