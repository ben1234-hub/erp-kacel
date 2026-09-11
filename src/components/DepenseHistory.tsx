import React, { useState, useMemo } from 'react';
import { Check, X, Filter } from 'lucide-react';
import type { Depense } from '../dbStore';
import { peutValiderDepense } from '../dbStore';

interface DepenseHistoryProps {
  dbState: any;
  currentUser: any;
  idService: number;
  onUpdateDepense: (depense: Depense) => void;
  triggerToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export function DepenseHistory({ dbState, currentUser, idService, onUpdateDepense, triggerToast }: DepenseHistoryProps) {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');

  const depenses = dbState.depenses || [];
  const categories = dbState.categories_depenses || [];
  const isAdmin = peutValiderDepense(currentUser?.Role || '');

  const filteredDepenses = useMemo(() => {
    return depenses
      .filter((d: Depense) => idService === 0 || d.id_service === idService)
      .filter((d: Depense) => {
        if (dateDebut && d.date_depense < dateDebut) return false;
        if (dateFin && d.date_depense > dateFin) return false;
        if (filtreCategorie && d.categorie !== filtreCategorie) return false;
        if (filtreStatut && d.statut !== filtreStatut) return false;
        return true;
      })
      .sort((a: Depense, b: Depense) => b.createdAt - a.createdAt);
  }, [depenses, idService, dateDebut, dateFin, filtreCategorie, filtreStatut]);

  const totalValide = filteredDepenses
    .filter((d: Depense) => d.statut === 'Validée')
    .reduce((sum: number, d: Depense) => sum + d.montant, 0);

  const enAttente = filteredDepenses.filter((d: Depense) => d.statut === 'En attente').length;

  const getBadgeColor = (statut: string) => {
    switch (statut) {
      case 'Validée': return 'bg-green-100 text-green-800 border-green-200';
      case 'Refusée': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const handleValider = (d: Depense) => {
    onUpdateDepense({ ...d, statut: 'Validée', updatedAt: Date.now() });
    triggerToast?.('Dépense validée', 'success');
  };

  const handleRefuser = (d: Depense) => {
    onUpdateDepense({ ...d, statut: 'Refusée', updatedAt: Date.now() });
    triggerToast?.('Dépense refusée', 'info');
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Filter size={16} /> Filtres
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">DU</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">AU</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Catégorie</label>
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Toutes</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Statut</label>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Tous</option>
              <option value="En attente">En attente</option>
              <option value="Validée">Validée</option>
              <option value="Refusée">Refusée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compteurs */}
      <div className="flex gap-4 text-sm">
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full font-medium">
          Total validé : {totalValide.toLocaleString()} DA
        </div>
        {enAttente > 0 && (
          <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-medium">
            En attente : {enAttente}
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-left">Catégorie</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2 text-left">Par</th>
              <th className="px-3 py-2 text-left">Statut</th>
              {isAdmin && <th className="px-3 py-2 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDepenses.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-3 py-8 text-center text-gray-400">
                  Aucune dépense trouvée
                </td>
              </tr>
            ) : (
              filteredDepenses.map((d: Depense) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{d.date_depense}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{d.nom_service}</td>
                  <td className="px-3 py-2">{d.categorie}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={d.description}>
                    {d.description}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {d.montant.toLocaleString()} DA
                  </td>
                  <td className="px-3 py-2 text-gray-500">{d.nom_utilisateur}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(d.statut)}`}>
                      {d.statut}
                    </span>
                  </td>
                  {isAdmin && d.statut === 'En attente' && (
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleValider(d)}
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Valider"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleRefuser(d)}
                          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Refuser"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                  {isAdmin && d.statut !== 'En attente' && <td className="px-3 py-2"></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
