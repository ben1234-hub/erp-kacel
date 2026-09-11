import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Bookmark, 
  RefreshCw,
  Award,
  Wallet,
  CheckCircle,
  X,
  CreditCard,
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Patient, Pack, GestionAbonnement, Versement } from '../types';
import { computeSubscriptionDetails, computeSubscriptionCode, formatCurrency } from '../utils';

interface AbonnementsProps {
  patients: Patient[];
  packs: Pack[];
  abonnements: GestionAbonnement[];
  versements: Versement[];
  onAddAbonnement: (abo: Omit<GestionAbonnement, 'id' | 'name'>) => void;
  onAddVersement: (versement: Omit<Versement, 'id'>) => void;
  onDeleteAbonnement: (id: string) => void;
}

export default function Abonnements({
  patients,
  packs,
  abonnements,
  versements,
  onAddAbonnement,
  onAddVersement,
  onDeleteAbonnement
}: AbonnementsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAboForPayment, setSelectedAboForPayment] = useState<GestionAbonnement | null>(null);

  // Search & Pagination & Filter state for compacting data and displaying 15 rows
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_debt' | 'without_debt' | 'abonnement_end'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Add Subscription state
  const [aboForm, setAboForm] = useState({
    patient_id: patients[0]?.id || '',
    pack_id: packs[0]?.id || '',
    remise_globale: 0,
    date_debut: new Date().toISOString().split('T')[0]
  });

  // Pay installments state
  const [paymentAmount, setPaymentAmount] = useState(100);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle subscriber selection pack calculations
  const activePackForForm = packs.find(p => p.id === aboForm.pack_id);
  const initialPackPrice = activePackForForm ? activePackForForm.amount : 0;
  const priceWithDiscount = Number((initialPackPrice * (1.0 - (aboForm.remise_globale || 0) / 100)).toFixed(2));

  // Filter and Paginate logic
  const filteredAbonnements = abonnements.filter(abo => {
    const patient = patients.find(p => p.id === abo.patient_id);
    const details = computeSubscriptionDetails(abo, packs, versements);
    
    // Status filter matching
    if (statusFilter !== 'all' && details.state !== statusFilter) {
      return false;
    }

    // Search term matching
    if (searchTerm) {
      const matchSearch = (patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (patient?.phone || '').includes(searchTerm) || 
                          (abo.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (details.pack?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredAbonnements.length / itemsPerPage) || 1;
  const paginatedAbonnements = filteredAbonnements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: typeof statusFilter) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleCreateAbo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aboForm.patient_id || !aboForm.pack_id) return;
    
    onAddAbonnement({
      patient_id: aboForm.patient_id,
      pack_id: aboForm.pack_id,
      used_sessions: 0,
      remise_globale: Number(aboForm.remise_globale),
      date_debut: aboForm.date_debut,
      date: new Date().toISOString().split('T')[0]
    });

    setShowAddModal(false);
    setAboForm({
      patient_id: patients[0]?.id || '',
      pack_id: packs[0]?.id || '',
      remise_globale: 0,
      date_debut: new Date().toISOString().split('T')[0]
    });
  };

  const handleRequestPay = (abo: GestionAbonnement) => {
    const details = computeSubscriptionDetails(abo, packs, versements);
    setSelectedAboForPayment(abo);
    setPaymentAmount(details.amount_remaining);
    setShowPaymentModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAboForPayment || paymentAmount <= 0) return;

    onAddVersement({
      gestion_abonnement_id: selectedAboForPayment.id,
      amount: Number(paymentAmount),
      date: paymentDate
    });

    setShowPaymentModal(false);
    setSelectedAboForPayment(null);
  };

  return (
    <div className="space-y-4" id="contracts-management-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 text-white p-2 rounded-xl shadow-md shadow-teal-100 shrink-0">
             <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Gestion des Abonnements</h2>
            <p className="text-[10px] text-slate-400 font-medium">Suivi des contrats patients, dettes administratives et règlements de séances</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          id="btn-open-add-abo-modal"
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-extrabold uppercase text-[10px] shadow-sm shadow-teal-500/15 py-2 px-4 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Award className="w-3.5 h-3.5" />
          Souscrire un Abonnement
        </button>
      </div>

      {/* Advanced Filter, Search, and Compaction Options */}
      <div className="bg-white rounded-xl p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher patient, code, forfait..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-[11px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-teal-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-teal-600'
            }`}
          >
            Tous ({filteredAbonnements.length})
          </button>
          <button
            onClick={() => handleStatusFilterChange('with_debt')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'with_debt'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-amber-600'
            }`}
          >
            Dettes ({abonnements.filter(a => computeSubscriptionDetails(a, packs, versements).state === 'with_debt').length})
          </button>
          <button
            onClick={() => handleStatusFilterChange('without_debt')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'without_debt'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-teal-800'
            }`}
          >
            Soldés ({abonnements.filter(a => computeSubscriptionDetails(a, packs, versements).state === 'without_debt').length})
          </button>
        </div>
      </div>

      {/* Main Table Listing Contracts */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50" id="abonnements-list-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] text-slate-600 min-w-[950px] table-fixed">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-center">
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[50px] text-center">Code</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[140px] text-left">Patient</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[130px] text-left">Forfait / Pack</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[80px] text-center">Activités</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[90px] text-center">Validité</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[50px] text-center">Remise</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[70px] text-center">Prix Net</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[75px] text-center">Versements</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[70px] text-center">Solde dû</th>
                <th className="py-2 px-2 border-r border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[90px] text-center">Statut</th>
                <th className="py-2 px-2 text-[9px] font-black text-slate-500 uppercase tracking-wider w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium font-sans animate-in fade-in duration-300">
              {paginatedAbonnements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-400 font-medium text-[10px]">
                    Aucun abonnement trouvé avec les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                paginatedAbonnements.map((abo) => {
                  const details = computeSubscriptionDetails(abo, packs, versements);
                  const patient = patients.find(p => p.id === abo.patient_id);
                  if (!patient) return null;

                  // Calculate Odoo date_fin (date_debut + 30 days)
                  const endTimestamp = new Date(abo.date_debut);
                  endTimestamp.setDate(endTimestamp.getDate() + 30);
                  const dateFinStr = endTimestamp.toISOString().split('T')[0];

                  return (
                    <tr 
                      key={abo.id} 
                      id={`row-abo-${abo.id}`} 
                      className={`transition-colors border-b border-slate-100 text-[10px] text-slate-700 ${
                        abo.etat === 'Fermé' || details.state === 'abonnement_end'
                          ? 'bg-slate-100/60 opacity-60 text-slate-400 grayscale-xs' 
                          : 'hover:bg-slate-50/55'
                      }`}
                    >
                      <td className="py-1.5 px-2 font-mono font-bold text-slate-500 text-center border-r border-slate-100 whitespace-nowrap">{abo.name}</td>
                      <td className="py-1.5 px-2 border-r border-slate-100 whitespace-nowrap overflow-hidden">
                        <div className="space-y-0.5">
                          <span className={`font-extrabold block truncate max-w-[120px] ${abo.etat === 'Fermé' || details.state === 'abonnement_end' ? 'text-slate-400' : 'text-slate-900'}`} title={patient.name}>
                            {patient.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-mono">{patient.phone}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-100 whitespace-nowrap overflow-hidden">
                        <div className="space-y-0.5">
                          <span className={`font-extrabold block truncate max-w-[110px] ${abo.etat === 'Fermé' || details.state === 'abonnement_end' ? 'text-slate-400' : 'text-slate-800'}`} title={details.pack?.name || "—"}>
                            {details.pack?.name || "—"}
                          </span>
                          <span className="text-[9px] text-teal-600 font-bold block">{details.number_of_sessions} séanc. init.</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-black text-slate-800">{details.remaining_sessions} rest.</span>
                          <span className="text-slate-400 text-[9px]">({abo.used_sessions} util.)</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 whitespace-nowrap font-mono text-[9px]">
                        <div className="space-y-0.5 leading-tight">
                          <div>Du {abo.date_debut}</div>
                          <div className="text-teal-600/85 font-bold">Au {dateFinStr}</div>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 font-mono whitespace-nowrap">
                        {abo.remise_globale > 0 ? (
                          <span className="bg-rose-50 text-rose-700 px-1 py-0.5 rounded-md border border-rose-100 font-bold text-[9px]">
                            -{abo.remise_globale}%
                          </span>
                        ) : "Aucune"}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 font-bold font-mono text-slate-800 whitespace-nowrap">{formatCurrency(details.total_avec_remise)}</td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {formatCurrency(details.total_versement)}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                        {details.amount_remaining > 0 ? (
                          <span className="text-rose-600 font-mono font-extrabold block">
                            {formatCurrency(details.amount_remaining)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold font-mono bg-emerald-50/50 border border-emerald-100/60 px-1 py-0.5 rounded-md text-[9px]">Soldé</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                        {abo.etat === 'Fermé' || details.state === 'abonnement_end' ? (
                          <span className="bg-slate-50 text-slate-400 border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-tighter shadow-3xs">
                            🚫 Fermé
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5 items-center justify-center">
                            {details.state === 'with_debt' && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-1.5 py-0.5 rounded-lg shadow-3xs">
                                Avec dette
                              </span>
                            )}
                            {details.is_consumption_warning && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-tighter shadow-3xs" title="Le montant versé est équivalent aux séances consommées">
                                ⚠️ Consom.
                              </span>
                            )}
                            {details.state === 'without_debt' && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded-lg shadow-3xs">
                                Soldé
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {details.amount_remaining > 0 && abo.etat !== 'Fermé' && (
                            <button
                              onClick={() => handleRequestPay(abo)}
                              id={`btn-pay-${abo.id}`}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 rounded-lg font-extrabold uppercase text-[9px] tracking-wider py-1 px-2 border border-teal-100/50 shadow-2xs transition cursor-pointer"
                            >
                              Payer
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteAbonnement(abo.id)}
                            id={`btn-del-abo-${abo.id}`}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg border border-rose-100/60 hover:border-rose-200 transition-all shadow-xs cursor-pointer"
                            title="Annuler l'abonnement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar with 15-item layout as requested */}
        {filteredAbonnements.length > 0 && (
          <div className="bg-white border-t border-slate-100 px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] select-none">
            <span className="text-slate-500 font-medium">
              Affichage de <span className="font-extrabold text-slate-800">{Math.min(filteredAbonnements.length, (currentPage - 1) * itemsPerPage + 1)}</span> à <span className="font-extrabold text-slate-800">{Math.min(filteredAbonnements.length, currentPage * itemsPerPage)}</span> sur <span className="font-extrabold text-slate-800">{filteredAbonnements.length}</span> abonnements ({itemsPerPage}/page)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-bold shadow-2xs"
              >
                <ChevronLeft className="w-3 h-3" />
                Précédent
              </button>
              
              <span className="bg-slate-50 border border-slate-150 text-slate-700 font-extrabold px-2 py-1 rounded-lg font-mono text-[10px]">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-bold shadow-2xs"
              >
                Suivant
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-xl max-w-md w-full shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 tracking-tight text-base">
                Nouveau Contrat d'Abonnement
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAbo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Patient bénéficiaire</label>
                <select 
                  value={aboForm.patient_id}
                  onChange={(e) => setAboForm({ ...aboForm, patient_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Forfait Pack choisi</label>
                <select 
                  value={aboForm.pack_id}
                  onChange={(e) => setAboForm({ ...aboForm, pack_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500"
                >
                  {packs.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.nombre_seance} Séances ({formatCurrency(p.amount)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Remise globale (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={aboForm.remise_globale}
                    onChange={(e) => setAboForm({ ...aboForm, remise_globale: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Date début soins</label>
                  <input 
                    type="date" 
                    value={aboForm.date_debut}
                    onChange={(e) => setAboForm({ ...aboForm, date_debut: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Live Preview block mimicking Odoo compute field before saving */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-150 text-xs space-y-1.5 font-medium text-slate-600">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Simulation calculée (Odoo Compute)</span>
                <div className="flex justify-between">
                  <span>Prix d'origine :</span>
                  <span className="text-slate-800 font-mono font-bold">{formatCurrency(initialPackPrice)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Déduction remise ({aboForm.remise_globale}%) :</span>
                  <span className="font-mono font-bold">- {formatCurrency(initialPackPrice - priceWithDiscount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold border-t border-dashed border-slate-200 pt-1.5 text-sm">
                  <span>Solde Net Restant :</span>
                  <span className="font-mono">{formatCurrency(priceWithDiscount)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Confirmer l'Abonnement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic payment Modal */}
      {showPaymentModal && selectedAboForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-xl max-w-sm w-full shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 tracking-tight text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-500" />
                Enregistrer un Versement
              </h3>
              <button 
                onClick={() => { setShowPaymentModal(false); setSelectedAboForPayment(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="text-xs text-slate-500">
                Vous enregistrez un versement pour le dossier <span className="font-bold font-mono text-slate-850">{selectedAboForPayment.name}</span>.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Montant versé (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 outline-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Date du versement</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-800 outline-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Valider l'Écrit de Règlement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
