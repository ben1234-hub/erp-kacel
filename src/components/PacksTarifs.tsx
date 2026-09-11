import React, { useState } from 'react';
import { 
  Layers, 
  DollarSign, 
  Activity, 
  MapPin, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Tag, 
  Trash2,
  BookOpen,
  FolderPlus
} from 'lucide-react';
import { Pack, Tarif, KinesitherapyAct, Affectation, TypeAbonnement, TypeConsultation } from '../types';
import { formatCurrency } from '../utils';

interface PacksTarifsProps {
  packs: Pack[];
  tarifs: Tarif[];
  acts: KinesitherapyAct[];
  affectations: Affectation[];
  typesAbonnement: TypeAbonnement[];
  typeConsultations: TypeConsultation[];
  onAddPack: (pack: Omit<Pack, 'id'>) => void;
  onUpdatePack: (pack: Pack) => void;
  onDeletePack: (id: string) => void;
  onAddTarif: (tarif: Omit<Tarif, 'id'>) => void;
  onUpdateTarif: (tarif: Tarif) => void;
  onDeleteTarif: (id: string) => void;
  onToggleTarif: (id: string) => void;
  onAddAct: (act: Omit<KinesitherapyAct, 'id'>) => void;
  onUpdateAct: (act: KinesitherapyAct) => void;
  onDeleteAct: (id: string) => void;
  onAddTypeConsultation: (tc: Omit<TypeConsultation, 'id'>) => void;
  onUpdateTypeConsultation: (tc: TypeConsultation) => void;
  onDeleteTypeConsultation: (id: string) => void;
}

type SubTab = 'packs' | 'tarifs' | 'acts' | 'consults' | 'positions';

export default function PacksTarifs({
  packs,
  tarifs,
  acts,
  affectations,
  typesAbonnement,
  typeConsultations,
  onAddPack,
  onUpdatePack,
  onDeletePack,
  onAddTarif,
  onUpdateTarif,
  onDeleteTarif,
  onToggleTarif,
  onAddAct,
  onUpdateAct,
  onDeleteAct,
  onAddTypeConsultation,
  onUpdateTypeConsultation,
  onDeleteTypeConsultation
}: PacksTarifsProps) {
  const [activeSub, setActiveSub] = useState<SubTab>('packs');

  // Multi-selection states
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);
  const [selectedActId, setSelectedActId] = useState<string | null>(null);
  const [selectedConsultId, setSelectedConsultId] = useState<string | null>(null);

  // Input states for Add/Edit Forms
  const [packForm, setPackForm] = useState({
    name: '',
    nombre_seance: 10,
    amount: 300,
    type_abonnement_id: typesAbonnement[0]?.id || '',
    act_id: acts[0]?.id || '',
    note: ''
  });

  const [tarifForm, setTarifForm] = useState({
    name: '',
    montant: 35,
    description: ''
  });

  const [actForm, setActForm] = useState({
    name: ''
  });

  const [consultForm, setConsultForm] = useState({
    code: '',
    designation: '',
    prix: 2500
  });

  // Errors checking
  const [formErr, setFormErr] = useState('');

  // Handle selections
  const selectPack = (p: Pack) => {
    setSelectedPackId(p.id);
    setPackForm({
      name: p.name,
      nombre_seance: p.nombre_seance,
      amount: p.amount,
      type_abonnement_id: p.type_abonnement_id,
      act_id: p.act_id || '',
      note: p.note || ''
    });
    setFormErr('');
  };

  const selectTarif = (t: Tarif) => {
    setSelectedTarifId(t.id);
    setTarifForm({
      name: t.name,
      montant: t.montant,
      description: t.description || ''
    });
    setFormErr('');
  };

  const selectAct = (a: KinesitherapyAct) => {
    setSelectedActId(a.id);
    setActForm({ name: a.name });
    setFormErr('');
  };

  const selectConsult = (tc: TypeConsultation) => {
    setSelectedConsultId(tc.id);
    setConsultForm({
      code: tc.code,
      designation: tc.designation,
      prix: tc.prix
    });
    setFormErr('');
  };

  const resetPacks = () => {
    setSelectedPackId(null);
    setPackForm({
      name: '',
      nombre_seance: 10,
      amount: 300,
      type_abonnement_id: typesAbonnement[0]?.id || '',
      act_id: acts[0]?.id || '',
      note: ''
    });
  };

  const resetTarifs = () => {
    setSelectedTarifId(null);
    setTarifForm({ name: '', montant: 35, description: '' });
  };

  const resetActs = () => {
    setSelectedActId(null);
    setActForm({ name: '' });
  };

  const resetConsults = () => {
    setSelectedConsultId(null);
    setConsultForm({ code: '', designation: '', prix: 2500 });
  };

  const submitPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packForm.name.trim()) return setFormErr('Nom du pack obligatoire');
    
    if (selectedPackId) {
      onUpdatePack({
        id: selectedPackId,
        ...packForm,
        nombre_seance: Number(packForm.nombre_seance),
        amount: Number(packForm.amount),
        active: true
      });
      resetPacks();
    } else {
      onAddPack({
        ...packForm,
        nombre_seance: Number(packForm.nombre_seance),
        amount: Number(packForm.amount),
        active: true
      });
      resetPacks();
    }
    setFormErr('');
  };

  const submitTarif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarifForm.name.trim()) return setFormErr('Nom de la référence tarifaire obligatoire');
    
    if (selectedTarifId) {
      const existing = tarifs.find(t => t.id === selectedTarifId);
      onUpdateTarif({
        id: selectedTarifId,
        ...tarifForm,
        montant: Number(tarifForm.montant),
        active: existing ? existing.active : true
      });
      resetTarifs();
    } else {
      onAddTarif({
        ...tarifForm,
        montant: Number(tarifForm.montant),
        active: true
      });
      resetTarifs();
    }
    setFormErr('');
  };

  const submitAct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actForm.name.trim()) return setFormErr('Titre de l\'acte indispensable');
    
    if (selectedActId) {
      onUpdateAct({ id: selectedActId, name: actForm.name });
      resetActs();
    } else {
      onAddAct({ ...actForm });
      resetActs();
    }
    setFormErr('');
  };

  const submitConsult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultForm.code.trim()) return setFormErr('Code type consultation obligatoire');
    if (!consultForm.designation.trim()) return setFormErr('Désignation obligatoire');
    
    if (selectedConsultId) {
      onUpdateTypeConsultation({
        id: selectedConsultId,
        ...consultForm,
        prix: Number(consultForm.prix)
      });
      resetConsults();
    } else {
      onAddTypeConsultation({
        ...consultForm,
        prix: Number(consultForm.prix)
      });
      resetConsults();
    }
    setFormErr('');
  };

  return (
    <div className="space-y-6" id="packs-config-section">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Nomenclature & Tarification Odoo
        </h2>
        <p className="text-xs text-slate-500">
          Gérez les catalogues de packs, tarifs unitaires préférentiels, types de soins, ainsi que la configuration des salles d'affectation.
        </p>
      </div>

      {/* Sub menu tabs slider */}
      <div className="flex border-b border-slate-100 gap-1 overflow-x-auto" id="nomenclature-tabs">
        <button
          onClick={() => { setActiveSub('packs'); setFormErr(''); }}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all ${
            activeSub === 'packs' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Packs d'Abonnement
        </button>
        <button
          onClick={() => { setActiveSub('tarifs'); setFormErr(''); }}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all ${
            activeSub === 'tarifs' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tarifs Unitaires
        </button>
        <button
          onClick={() => { setActiveSub('acts'); setFormErr(''); }}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all ${
            activeSub === 'acts' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Actes associés
        </button>
        <button
          onClick={() => { setActiveSub('consults'); setFormErr(''); }}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all ${
            activeSub === 'consults' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Type Consultation
        </button>
        <button
          onClick={() => { setActiveSub('positions'); setFormErr(''); }}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all ${
            activeSub === 'positions' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Salles / Affectations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="nomenclature-tab-panels">
        
        {/* Main interactive Listing Column/Section (occupies 2/3 space) */}
        <div className="lg:col-span-2 space-y-4" id="nomenclature-main-list">
          
          {/* ActiveSub Packs */}
          {activeSub === 'packs' && (
            <div className="space-y-4" id="panel-packs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Catalogue des Packs disponibles</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                  {packs.length} packs référencés
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packs.map(p => {
                  const typeName = typesAbonnement.find(t => t.id === p.type_abonnement_id)?.name || "Type Inconnu";
                  const actName = acts.find(a => a.id === p.act_id)?.name || "—";
                  const isSelected = selectedPackId === p.id;
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => selectPack(p)}
                      className={`border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                        isSelected ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-100'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-indigo-600 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                            {typeName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-indigo-700">{p.nombre_seance} Séances</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeletePack(p.id); }}
                              className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm tracking-tight">{p.name}</h4>
                        {p.note && <p className="text-xs text-slate-400 line-clamp-2 italic">"{p.note}"</p>}
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Acte associé :</span>
                          <span className="text-xs font-semibold text-slate-600 truncate max-w-[150px] block">{actName}</span>
                        </div>
                        <span className="text-base font-extrabold text-slate-900">{formatCurrency(p.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ActiveSub Tarifs */}
          {activeSub === 'tarifs' && (
            <div className="space-y-4" id="panel-tarifs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 tracking-tight text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Grilles des Tarifs unitaires réguliers (Odoo)
                </h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded-lg font-bold">
                  {tarifs.length} tarifs
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-sm text-left border-collapse text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Désignation</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3">Diagnostic / Rôle</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {tarifs.map(t => (
                      <tr 
                        key={t.id} 
                        onClick={() => selectTarif(t)}
                        className={`cursor-pointer transition-all ${selectedTarifId === t.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50/40'}`}
                      >
                        <td className="p-3 font-semibold text-slate-800">{t.name}</td>
                        <td className="p-3 text-emerald-600 font-bold">{formatCurrency(t.montant)}</td>
                        <td className="p-3 text-xs text-slate-400 max-w-[150px] truncate">{t.description || "Aucune description"}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                            {t.active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleTarif(t.id); }}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Changer le statut actif/inactif"
                            >
                              {t.active ? (
                                <ToggleRight className="w-6 h-6 text-indigo-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6" />
                              )}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteTarif(t.id); }}
                              className="p-1 text-slate-200 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ActiveSub Acts */}
          {activeSub === 'acts' && (
            <div className="space-y-4" id="panel-acts">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Actes médicaux de kinésithérapie</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded-lg font-bold">{acts.length} actes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="acts-display-list">
                {acts.map(a => (
                  <div 
                    key={a.id} 
                    onClick={() => selectAct(a)}
                    className={`border rounded-xl px-4 py-3.5 flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                      selectedActId === a.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${selectedActId === a.id ? 'bg-indigo-600 animate-pulse' : 'bg-indigo-300'}`} />
                      <span className="text-xs font-bold text-slate-800">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono text-slate-400">ID: {a.id}</span>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteAct(a.id); }} className="text-slate-300 hover:text-rose-500">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ActiveSub Type Consultation */}
          {activeSub === 'consults' && (
            <div className="space-y-4" id="panel-type-consults">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Paramètres Types Consultation</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded-lg font-bold">
                  {typeConsultations.length} types
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-sm text-left border-collapse text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Désignation</th>
                      <th className="p-3">Prix (DA)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {typeConsultations.map(tc => (
                      <tr 
                        key={tc.id} 
                        onClick={() => selectConsult(tc)}
                        className={`cursor-pointer transition-all ${selectedConsultId === tc.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50/40'}`}
                      >
                        <td className="p-3 font-mono font-bold text-indigo-600">{tc.code}</td>
                        <td className="p-3 font-semibold text-slate-800">{tc.designation}</td>
                        <td className="p-3 text-slate-900 font-extrabold">{tc.prix} DA</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteTypeConsultation(tc.id); }}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ActiveSub Positions (Salles et affectations) */}
          {activeSub === 'positions' && (
            <div className="space-y-4" id="panel-positions">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 tracking-tight text-sm">Cartographie des Salles et Affectations</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded-lg font-bold">{affectations.length} zones</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="positions-display-list">
                {affectations.map(aff => (
                  <div key={aff.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest">{aff.etage}</span>
                        <h4 className="font-bold text-slate-800 text-xs tracking-tight">{aff.name}</h4>
                      </div>
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 italic">"{aff.description}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Creation Form block (occupies 1/3 right space) */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs self-start" id="nomenclature-creator-sidebar">
          {activeSub === 'packs' && (
            <form onSubmit={submitPack} className="space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-1.5 ">
                  <FolderPlus className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    {selectedPackId ? 'Modifier le Pack' : 'Créer un nouveau Pack'}
                  </h4>
                </div>
                {selectedPackId && (
                  <button type="button" onClick={resetPacks} className="text-[10px] font-bold text-rose-500 hover:underline">Annuler</button>
                )}
              </div>

              {formErr && <p className="text-xs text-red-600 font-semibold italic bg-red-50 p-2 rounded">{formErr}</p>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nom du Pack</label>
                <input 
                  type="text" 
                  placeholder="ex: Pack Drainage 10 Seances"
                  value={packForm.name}
                  onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nombre séances</label>
                  <input 
                    type="number" 
                    value={packForm.nombre_seance}
                    onChange={(e) => setPackForm({ ...packForm, nombre_seance: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tarif Pack (€)</label>
                  <input 
                    type="number" 
                    value={packForm.amount}
                    onChange={(e) => setPackForm({ ...packForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Type d'abonnement</label>
                <select 
                  value={packForm.type_abonnement_id}
                  onChange={(e) => setPackForm({ ...packForm, type_abonnement_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-bold"
                >
                  {typesAbonnement.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Acte médical associé</label>
                <select 
                  value={packForm.act_id}
                  onChange={(e) => setPackForm({ ...packForm, act_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-bold"
                >
                  <option value="">Aucun acte spécifique</option>
                  {acts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Note / Description</label>
                <textarea 
                  rows={2}
                  placeholder="Note clinique ou précisions de ciblage..."
                  value={packForm.note}
                  onChange={(e) => setPackForm({ ...packForm, note: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-800 focus:outline-indigo-500 font-medium"
                />
              </div>

              <button
                type="submit"
                className={`w-full text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  selectedPackId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <Plus className="w-4 h-4" />
                {selectedPackId ? 'Mettre à jour le Pack' : 'Créer et Publier le Pack'}
              </button>
            </form>
          )}

          {activeSub === 'tarifs' && (
            <form onSubmit={submitTarif} className="space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    {selectedTarifId ? 'Modifier le Tarif' : 'Créer un Tarif Unitaire'}
                  </h4>
                </div>
                {selectedTarifId && (
                  <button type="button" onClick={resetTarifs} className="text-[10px] font-bold text-rose-500 hover:underline">Annuler</button>
                )}
              </div>

              {formErr && <p className="text-xs text-red-600 font-semibold italic bg-red-50 p-2 rounded">{formErr}</p>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Type d'acte ciblé / Désignation</label>
                <input 
                  type="text" 
                  placeholder="ex: Séance Ondes de Choc"
                  value={tarifForm.name}
                  onChange={(e) => setTarifForm({ ...tarifForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Montant (€)</label>
                <input 
                  type="number" 
                  value={tarifForm.montant}
                  onChange={(e) => setTarifForm({ ...tarifForm, montant: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Explication / Description</label>
                <textarea 
                  rows={2}
                  placeholder="ex: Acte physiothérapie adjuvante..."
                  value={tarifForm.description}
                  onChange={(e) => setTarifForm({ ...tarifForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-800 focus:outline-indigo-500 font-medium"
                />
              </div>

              <button
                type="submit"
                className={`w-full text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  selectedTarifId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <Plus className="w-4 h-4" />
                {selectedTarifId ? 'Mettre à jour le Tarif' : 'Ajouter à la Grille Odoo'}
              </button>
            </form>
          )}

          {activeSub === 'acts' && (
            <form onSubmit={submitAct} className="space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    {selectedActId ? 'Modifier l\'acte' : 'Créer un acte médical'}
                  </h4>
                </div>
                {selectedActId && (
                  <button type="button" onClick={resetActs} className="text-[10px] font-bold text-rose-500 hover:underline">Annuler</button>
                )}
              </div>

              {formErr && <p className="text-xs text-red-600 font-semibold italic bg-red-50 p-2 rounded">{formErr}</p>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Intitulé de l'acte</label>
                <input 
                  type="text" 
                  placeholder="ex: Rééducation Rachis Cervical"
                  value={actForm.name}
                  onChange={(e) => setActForm({ ...actForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-bold"
                />
              </div>

              <button
                type="submit"
                className={`w-full text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  selectedActId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <Plus className="w-4 h-4" />
                {selectedActId ? 'Mettre à jour l\'acte' : 'Enregistrer l\'acte'}
              </button>
            </form>
          )}

          {activeSub === 'consults' && (
            <form onSubmit={submitConsult} className="space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    {selectedConsultId ? 'Modifier Type Consultation' : 'Nouveau Type Consultation'}
                  </h4>
                </div>
                {selectedConsultId && (
                  <button type="button" onClick={resetConsults} className="text-[10px] font-bold text-rose-500 hover:underline">Annuler</button>
                )}
              </div>

              {formErr && <p className="text-xs text-red-600 font-semibold italic bg-red-50 p-2 rounded">{formErr}</p>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Code Type</label>
                <input 
                  type="text" 
                  placeholder="ex: ADU"
                  value={consultForm.code}
                  onChange={(e) => setConsultForm({ ...consultForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm font-mono font-bold text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Désignation</label>
                <input 
                  type="text" 
                  placeholder="ex: Consultation Adulte"
                  value={consultForm.designation}
                  onChange={(e) => setConsultForm({ ...consultForm, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Prix (DA)</label>
                <input 
                  type="number" 
                  value={consultForm.prix}
                  onChange={(e) => setConsultForm({ ...consultForm, prix: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm font-mono font-bold text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  selectedConsultId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <Plus className="w-4 h-4" />
                {selectedConsultId ? 'Sauvegarder les modifications' : 'Enregistrer la configuration'}
              </button>
            </form>
          )}

          {activeSub === 'positions' && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-xs text-slate-500 space-y-2.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h5 className="font-bold text-slate-700 uppercase tracking-wide">Configuration géographique</h5>
              <p>Les services et d'égards sont paramétrés par défaut selon la structure physique du cabinet principal.</p>
              <p className="font-medium">Pour ré-indexer les salles ou éditer les configurations, contactez l'ingénieur système Odoo du cabinet médical.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
