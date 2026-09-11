import React, { useState } from 'react';
import { Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { DepenseForm } from './DepenseForm';
import { DepenseHistory } from './DepenseHistory';
import type { Depense } from '../dbStore';

interface DepenseManagerProps {
  dbState: any;
  currentUser: any;
  idService: number;
  nomService: string;
  onDbChange: (newDb: any) => void;
  triggerToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export function DepenseManager({ dbState, currentUser, idService, nomService, onDbChange, triggerToast }: DepenseManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const handleSaveDepense = (depense: Depense, nouvelleCategorie?: string) => {
    const newDepenses = [...(dbState.depenses || []), depense];
    const newCategories = nouvelleCategorie
      ? [...new Set([...(dbState.categories_depenses || []), nouvelleCategorie])].sort()
      : (dbState.categories_depenses || []);

    onDbChange({
      ...dbState,
      depenses: newDepenses,
      categories_depenses: newCategories,
    });

    triggerToast?.('Dépense soumise pour validation', 'info');
  };

  const handleUpdateDepense = (updatedDepense: Depense) => {
    const newDepenses = (dbState.depenses || []).map((d: Depense) =>
      d.id === updatedDepense.id ? updatedDepense : d
    );
    onDbChange({
      ...dbState,
      depenses: newDepenses,
    });
  };

  return (
    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div>
            <h3 className="text-base font-bold text-gray-800">Gestion des Dépenses — {nomService}</h3>
            <p className="text-xs text-gray-500">Sorties de caisse en espèces</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
        >
          <Wallet size={16} /> Nouvelle Dépense
        </button>
      </div>

      {showHistory && (
        <div className="p-4">
          <DepenseHistory
            dbState={dbState}
            currentUser={currentUser}
            idService={idService}
            onUpdateDepense={handleUpdateDepense}
            triggerToast={triggerToast}
          />
        </div>
      )}

      {showForm && (
        <DepenseForm
          dbState={dbState}
          currentUser={currentUser}
          idService={idService}
          nomService={nomService}
          onSave={handleSaveDepense}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
