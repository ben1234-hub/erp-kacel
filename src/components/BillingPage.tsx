import React, { useState, useMemo } from 'react';
import { Receipt, Calendar, Package, Clock, CheckCircle, X, Search } from 'lucide-react';
import { DatabaseState, Utilisateur } from '../dbStore';

interface BillingPageProps {
  dbState: DatabaseState;
  onUpdateDb: (fresh: DatabaseState) => void;
  currentUser: Utilisateur;
}

type PatientType = 'Adulte' | 'Enfant IMC' | 'Enfant';

export default function BillingPage({ dbState, onUpdateDb, currentUser }: BillingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Adulte' | 'Enfant IMC' | 'Enfant'>('all');
  const [filterService, setFilterService] = useState<'all' | 'abonnement' | 'seances' | 'both'>('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'choice' | 'seances' | 'abonnements'>('choice');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Seances modal states
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  // Arrays from dbState
  const patientsArray = (dbState.patients || []);
  const abonnementsArray = (dbState.abonnements || []);
  const packsArray = (dbState.packs || []);
  const seancesArray = (dbState.seances || []);
  const versementsArray = (dbState.versements || []);
  const caisseArray = (dbState.transactions_caisses || []);

  // Toast fallback
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    if (typeof window !== 'undefined' && (window as any).triggerToast) {
      (window as any).triggerToast(msg, type);
    } else {
      console.log(`[${type.toUpperCase()}]`, msg);
      if (type === 'error') alert(msg);
    }
  };

  // Build patient rows
  const patients = useMemo(() => {
    return patientsArray.map((p: any, idx: number) => {
      const patientId = Number(p.ID_Patient || p.id || 0);

      // Find abonnements for this patient + join with packs
      const abonnements = abonnementsArray
        .filter((a: any) => Number(a.ID_Patient || a.patient_id || 0) === patientId)
        .map((a: any) => {
          const pack = packsArray.find((pk: any) => Number(pk.ID_Pack || pk.id || 0) === Number(a.ID_Pack || a.pack_id || 0));
          return { ...a, pack };
        });

      // Find seances for this patient
      const seances = seancesArray.filter(
        (s: any) => Number(s.ID_Patient || s.patient_id || 0) === patientId
      );

      const hasAbonnements = abonnements.length > 0;
      const hasSeances = seances.length > 0;

      // Map type_patient
      let type: PatientType = 'Adulte';
      const rawType = String(p.Type_Patient || p.type_patient || '').toLowerCase();
      if (rawType.includes('enfant_imc') || rawType.includes('enfant imc')) {
        type = 'Enfant IMC';
      } else if (rawType.includes('enfant')) {
        type = 'Enfant';
      }

      // Split name into nom / prenom
      const fullName = String(p.Nom_Patient || p.name || p.nom || '').trim();
      const parts = fullName.split(/\s+/);
      const nom = parts.length > 1 ? parts.slice(0, -1).join(' ') : fullName;
      const prenom = parts.length > 1 ? parts[parts.length - 1] : '';

      return {
        id: patientId,
        name: fullName,
        nom,
        prenom,
        type,
        dateAdmission: p.Date_Premiere_Consultation || p.datePremiereConsultation || p.Date_Creation || p.date_creation || '',
        hasAbonnements,
        hasSeances,
        abonnements,
        seances,
        rowNum: idx + 1
      };
    });
  }, [patientsArray, abonnementsArray, packsArray, seancesArray]);

  // Check if an abonnement is already billed (has a versement)
  const isAbonnementFacture = (abnId: number) => {
    return versementsArray.some(
      (v: any) => Number(v.ID_Abn || v.abonnement_id || v.id_abonnement || 0) === Number(abnId)
    );
  };

  // Check if a seance is already billed (has a transaction)
  const isSeanceFacturee = (seanceId: number) => {
    return caisseArray.some(
      (t: any) => Number(t.ID_Seance || t.id_seance || t.seance_id || 0) === Number(seanceId)
    );
  };

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p: any) => {
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        p.nom.toLowerCase().includes(term) ||
        p.prenom.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        String(p.id).includes(term);

      const matchesType = filterType === 'all' || p.type === filterType;

      let matchesService = true;
      if (filterService === 'abonnement') matchesService = p.hasAbonnements && !p.hasSeances;
      if (filterService === 'seances') matchesService = p.hasSeances && !p.hasAbonnements;
      if (filterService === 'both') matchesService = p.hasAbonnements && p.hasSeances;

      return matchesSearch && matchesType && matchesService;
    });
  }, [patients, searchQuery, filterType, filterService]);

  const getServiceLabel = (p: any) => {
    if (p.hasAbonnements && p.hasSeances) return 'Abn / Seances';
    if (p.hasAbonnements) return 'Abonnement';
    if (p.hasSeances) return 'Seances';
    return '—';
  };

  const getServiceBadgeClass = (p: any) => {
    if (p.hasAbonnements && p.hasSeances) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (p.hasAbonnements) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (p.hasSeances) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-400 border-slate-200';
  };

  const handleServiceClick = (patient: any) => {
    setSelectedPatient(patient);
    if (patient.hasAbonnements && patient.hasSeances) {
      setModalMode('choice');
    } else if (patient.hasSeances) {
      setModalMode('seances');
      setDateDebut('');
      setDateFin('');
    } else if (patient.hasAbonnements) {
      setModalMode('abonnements');
    }
    setModalOpen(true);
  };

  const handleFacturerAbonnement = (abn: any) => {
    const abnId = Number(abn.ID_Abn || abn.id || 0);
    if (isAbonnementFacture(abnId)) {
      triggerToast('Cet abonnement est deja facture.', 'error');
      return;
    }

    const pack = abn.pack;
    const montant = Number(pack?.Prix_Pack || pack?.prix || pack?.amount || abn.prix || 0);

    const newVersement = {
      ID_Vers: Math.max(...versementsArray.map((v: any) => Number(v.ID_Vers || v.id || 0)), 0) + 1,
      ID_Abn: abnId,
      Mont_Vers: montant,
      Date_Vers: new Date().toISOString().split('T')[0],
      Mode_Paiement: 'Especes',
      Commentaire: `Facturation abonnement ${pack?.Libelle_Pack || 'Pack'}`,
    };

    const newTransaction = {
      ID_Transaction: Math.max(...caisseArray.map((t: any) => Number(t.ID_Transaction || t.id || 0)), 0) + 1,
      Date_Transaction: new Date().toISOString(),
      Type: 'recette',
      Montant: montant,
      Motif: `Facturation abonnement ${pack?.Libelle_Pack || 'Pack'} - ${selectedPatient?.name}`,
      ID_Utilisateur: currentUser?.ID_Utilisateur || currentUser?.id || '',
    };

    const fresh: any = {
      ...dbState,
      versements: [...versementsArray, newVersement],
      transactions_caisses: [...caisseArray, newTransaction],
    };

    onUpdateDb(fresh);
    triggerToast(`Abonnement « ${pack?.Libelle_Pack || 'Pack'} » facture avec succes.`, 'success');
  };

  const handleFacturerSeances = () => {
    if (!dateDebut || !dateFin) {
      triggerToast('Veuillez selectionner une periode.', 'error');
      return;
    }
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    const seancesAFacturer = selectedPatient?.seances.filter((s: any) => {
      const d = new Date(s.Date_Seanc_Realisee || s.Date_Seance || s.date || s.Date || '');
      return d >= debut && d <= fin && !isSeanceFacturee(Number(s.ID_Seanc || s.id || 0));
    });

    if (!seancesAFacturer || seancesAFacturer.length === 0) {
      triggerToast('Aucune seance non facturee dans cette periode.', 'info');
      return;
    }

    const baseId = Math.max(...caisseArray.map((t: any) => Number(t.ID_Transaction || t.id || 0)), 0);
    const newTransactions = seancesAFacturer.map((s: any, idx: number) => {
      const acte = (dbState.actes || []).find((a: any) => Number(a.ID_Acte || a.id || 0) === Number(s.ID_Acte || s.acte_id || 0));
      return {
        ID_Transaction: baseId + idx + 1,
        ID_Patient: selectedPatient?.id,
        ID_Seance: Number(s.ID_Seanc || s.id || 0),
        Montant: Number(acte?.Prix_Acte || (acte as any)?.prix || s.prix || 0),
        Date_Transaction: new Date().toISOString().split('T')[0],
        Type: 'Seance',
        Libelle: `Seance du ${s.Date_Seanc_Realisee || s.Date_Seance || s.date || s.Date}`,
      };
    });

    const fresh: any = {
      ...dbState,
      transactions_caisses: [...caisseArray, ...newTransactions],
    };

    onUpdateDb(fresh);
    triggerToast(`${seancesAFacturer.length} seance(s) facturee(s) avec succes.`, 'success');
    setModalOpen(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
    setDateDebut('');
    setDateFin('');
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-lg tracking-tight text-slate-900">Module de Facturation</h1>
            <p className="text-xs text-slate-500">Gestion centralisee des abonnements et seances a facturer</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par N°, Nom, Prenom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tous les types</option>
              <option value="Adulte">Adulte</option>
              <option value="Enfant">Enfant</option>
              <option value="Enfant IMC">Enfant IMC</option>
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tous les services</option>
              <option value="abonnement">Abonnement seul</option>
              <option value="seances">Seances seules</option>
              <option value="both">Abn + Seances</option>
            </select>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} trouve{filteredPatients.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <th className="py-3 px-4">N°</th>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4">Prenom</th>
                <th className="py-3 px-4">Type Patient</th>
                <th className="py-3 px-4">Date d&apos;admission</th>
                <th className="py-3 px-4">Services</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition duration-150">
                  <td className="py-3 px-4 font-mono text-slate-500">{p.rowNum}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{p.nom}</td>
                  <td className="py-3 px-4 text-slate-700">{p.prenom || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2 rounded-md ${
                      p.type === 'Enfant IMC'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : p.type === 'Enfant'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {p.dateAdmission ? new Date(p.dateAdmission).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleServiceClick(p)}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold py-1 px-3 rounded-lg border transition hover:shadow-sm cursor-pointer ${getServiceBadgeClass(p)}`}
                    >
                      {p.hasAbonnements && <Package className="w-3 h-3" />}
                      {p.hasSeances && <Clock className="w-3 h-3" />}
                      <span>{getServiceLabel(p)}</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-serif italic text-sm">
                    Aucun patient trouve pour ces criteres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-800">
                  {selectedPatient.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedPatient.type} • N° {selectedPatient.rowNum}
                </p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto">
              {/* CHOICE MODE */}
              {modalMode === 'choice' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-3">Ce patient dispose des deux services. Choisissez le type de facturation :</p>
                  <button
                    onClick={() => { setModalMode('seances'); setDateDebut(''); setDateFin(''); }}
                    className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition text-left group cursor-pointer"
                  >
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 group-hover:bg-blue-500/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-blue-900">Facturer des seances</div>
                      <div className="text-[10px] text-blue-600">Selectionner une periode par intervalle de dates</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setModalMode('abonnements')}
                    className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition text-left group cursor-pointer"
                  >
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 group-hover:bg-emerald-500/20">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-900">Facturer un abonnement</div>
                      <div className="text-[10px] text-emerald-600">Choisir un abonnement parmi la liste</div>
                    </div>
                  </button>
                </div>
              )}

              {/* SEANCES MODE */}
              {modalMode === 'seances' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => selectedPatient.hasAbonnements ? setModalMode('choice') : closeModal()} className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      ← Retour
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date debut</label>
                      <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date fin</label>
                      <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Preview of seances in range */}
                  {dateDebut && dateFin && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Seances dans la periode</p>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 rounded-lg p-2">
                        {selectedPatient.seances
                          .filter((s: any) => {
                            const d = new Date(s.Date_Seanc_Realisee || s.Date_Seance || s.date || s.Date || '');
                            return d >= new Date(dateDebut) && d <= new Date(dateFin);
                          })
                          .map((s: any) => {
                            const facturee = isSeanceFacturee(Number(s.ID_Seanc || s.id || 0));
                            return (
                              <div key={s.ID_Seanc || s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${facturee ? 'bg-emerald-50/50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                  {facturee && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                                  <span className={facturee ? 'text-emerald-700 line-through' : 'text-slate-700'}>
                                    {new Date(s.Date_Seanc_Realisee || s.Date_Seance || s.date || s.Date || '').toLocaleDateString('fr-FR')}
                                  </span>
                                  {s.act_name && <span className="text-[9px] text-slate-400">({s.act_name})</span>}
                                </div>
                                {facturee && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Facture</span>}
                              </div>
                            );
                          })}
                        {selectedPatient.seances.filter((s: any) => {
                          const d = new Date(s.Date_Seanc_Realisee || s.Date_Seance || s.date || s.Date || '');
                          return d >= new Date(dateDebut) && d <= new Date(dateFin);
                        }).length === 0 && (
                          <p className="text-xs text-slate-400 italic text-center py-2">Aucune seance dans cette periode.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleFacturerSeances}
                    disabled={!dateDebut || !dateFin}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Facturer les seances non facturees
                  </button>
                </div>
              )}

              {/* ABONNEMENTS MODE */}
              {modalMode === 'abonnements' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => selectedPatient.hasSeances ? setModalMode('choice') : closeModal()} className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      ← Retour
                    </button>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase">Abonnements du patient</p>

                  <div className="space-y-2">
                    {selectedPatient.abonnements.map((abn: any) => {
                      const abnId = Number(abn.ID_Abn || abn.id || 0);
                      const pack = abn.pack;
                      const facture = isAbonnementFacture(abnId);
                      const nbreSeances = Number(pack?.Nbre_Seance_Pack || pack?.nombre_seance || pack?.seances || 0);
                      const prix = Number(pack?.Prix_Pack || pack?.prix || pack?.amount || 0);
                      const libelle = String(pack?.Libelle_Pack || pack?.name || pack?.libelle || 'Abonnement');
                      const dateDebut = String(abn.Date_Debut_Abn || abn.date_debut || abn.DateDebut || '—');

                      return (
                        <div
                          key={abnId}
                          className={`flex items-center justify-between p-3 rounded-xl border transition ${
                            facture
                              ? 'bg-emerald-50/40 border-emerald-200/50'
                              : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className={`text-xs font-bold ${facture ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                              {libelle}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {nbreSeances} seance(s) • Debut : {dateDebut}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600">
                              {prix} DA
                            </div>
                          </div>

                          {facture ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-[10px] font-bold">Facture</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFacturerAbonnement(abn)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              <Receipt className="w-3 h-3" />
                              Facturer
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
