import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Depense } from '../dbStore';

interface DepenseFormProps {
  dbState: any;
  currentUser: any;
  idService: number;
  nomService: string;
  onSave: (depense: Depense, nouvelleCategorie?: string) => void;
  onClose: () => void;
}

export function DepenseForm({ dbState, currentUser, idService, nomService, onSave, onClose }: DepenseFormProps) {
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('');
  const [description, setDescription] = useState('');
  const [justificatif, setJustificatif] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);

  const categories = dbState.categories_depenses || [];
  const categorieExiste = categories.includes(categorie.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || !categorie.trim() || !description.trim()) return;

    const newDepense: Depense = {
      id: Date.now(),
      date_depense: new Date().toISOString().split('T')[0],
      montant: Number(montant),
      categorie: categorie.trim(),
      description: description.trim(),
      id_utilisateur: currentUser?.ID_Utilisateur || 0,
      nom_utilisateur: currentUser?.Nom_Utilisateur || 'Inconnu',
      id_service: idService,
      nom_service: nomService,
      statut: 'En attente',
      mode_paiement: 'Espèces',
      justificatif: justificatif.trim() || undefined,
      createdAt: Date.now(),
    };

    onSave(newDepense, !categorieExiste ? categorie.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Nouvelle Dépense — {nomService}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DA)</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ex: 5000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input
              type="text"
              list="categories-list"
              value={categorie}
              onChange={(e) => {
                setCategorie(e.target.value);
                setShowNewCat(!categories.includes(e.target.value.trim()) && e.target.value.trim().length > 0);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Tapez ou sélectionnez..."
              required
            />
            <datalist id="categories-list">
              {categories.map((cat: string) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {showNewCat && categorie.trim() && !categorieExiste && (
              <button
                type="button"
                onClick={() => {
                  setShowNewCat(false);
                }}
                className="mt-1 text-sm text-teal-600 flex items-center gap-1 hover:text-teal-800"
              >
                <Plus size={14} /> Ajouter &quot;{categorie.trim()}&quot; à la liste
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={3}
              placeholder="Détail de la dépense..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justificatif (optionnel)</label>
            <input
              type="text"
              value={justificatif}
              onChange={(e) => setJustificatif(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ex: Facture N°123"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <span className="font-medium">Mode de paiement :</span> Espèces
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Cette dépense sera soumise à validation par l&apos;Admin.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
            >
              Soumettre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
