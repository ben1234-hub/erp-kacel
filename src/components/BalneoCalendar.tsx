/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, User, 
  Search, Check, MousePointer2, Waves, CreditCard,
  Plus, X, Info, AlertTriangle, UserPlus, Trash2,
  CheckCircle2, Layers, Sparkles, Sliders, History, BookOpen,
  DollarSign, Wallet, Gift
} from 'lucide-react';
import { 
  DatabaseState, Rendez_Vous, Patient, Abonnement, 
  getRemainingSessions, isAbonnementGele, timesOverlap, 
  isSubscriptionCoveringActe, getFilteredActesForRole, saveDatabase 
} from '../dbStore';
import { hasPermission } from '../utils/permissions';
import { PatientAutocomplete } from './PatientAutocomplete';
import { DepenseManager } from './DepenseManager';

interface BalneoCalendarProps {
  dbState: DatabaseState;
  currentUser: any;
  onUpdateRDVStatus: (rdvId: number, status: Rendez_Vous['Statut_RDV'], priceOverridden?: number) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onAddRDV: (newRDVData: Omit<Rendez_Vous, 'ID_RDV'>) => void;
  onSave: (nextState: DatabaseState) => void;
  breakStart?: string;
  breakEnd?: string;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const timeToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getLocalISODate = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isRdvCancelled = (rdv: Rendez_Vous): boolean => {
  if (rdv.Statut_RDV === 'Annulé' || rdv.Statut_RDV === 'Absent') {
    return true;
  }
  if (rdv.Statut_RDV === 'Planifié') {
    const todayStr = getLocalISODate(new Date());
    if (rdv.Date_RDV < todayStr) {
      return true;
    }
  }
  return false;
};

const cloneState = (source: DatabaseState): DatabaseState => {
  const copy = { ...source } as any;
  const arrayKeys = [
    'fileAttente', 'fileAttenteIMC', 'patients', 'praticiens', 'rendezVous',
    'abonnements', 'factures', 'actes', 'packs', 'plages_horaires',
    'versements', 'seances', 'consultations', 'utilisateurs', 'transactions_caisses', 'caisses',
    'reglesBalneo', 'depenses'
  ];
  arrayKeys.forEach((key) => {
    if (Array.isArray((source as any)[key])) {
      copy[key] = [...(source as any)[key]];
    }
  });
  return copy as DatabaseState;
};

const getPatientAge = (p?: Patient | null): number => {
  if (!p) return 30;
  if (p.Age_Patient) return p.Age_Patient;
  if ((p as any).Age_Pat) return (p as any).Age_Pat;
  if ((p as any).Date_Nais_Pat) {
    const y = parseInt(String((p as any).Date_Nais_Pat).split('-')[0], 10);
    if (!isNaN(y)) return new Date().getFullYear() - y;
  }
  if (p.type_patient === 'Enfant' || p.type_patient === 'Enfant IMC') {
    return 6 + (Number(p.ID_Patient) % 10);
  }
  return 24 + ((Number(p.ID_Patient) * 7) % 45);
};

export const BalneoCalendar: React.FC<BalneoCalendarProps> = ({
  dbState,
  currentUser,
  onUpdateRDVStatus,
  triggerToast,
  onAddRDV,
  onSave,
  breakStart = '12:00',
  breakEnd = '13:00'
}) => {
  const [startDate, setStartDate] = useState<string>(getLocalISODate());
  const [bookingCell, setBookingCell] = useState<{ dateStr: string; slotTime: string } | null>(null);
  const [balneoSearchTerm, setBalneoSearchTerm] = useState<string>('');
  const [deleteConfirmRdvId, setDeleteConfirmRdvId] = useState<number | null>(null);

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showDepenses, setShowDepenses] = useState<boolean>(false);
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  const canEncaisserBalneo = [
    'Admin', 
    'Receptionniste Balneo', 
    'Receptionniste Balnéo', 
    'Receptionniste Balnéothérapie', 
    'Receptionniste Balneotherapie'
  ].includes(currentUser?.Role);

  // Historique des séances réalisées pour la balnéothérapie
  const getBalneoRealizedHistory = () => {
    return (dbState.seances || []).filter(s => {
      const rdv = dbState.rendezVous.find(r => r.ID_RDV === s.ID_RDV);
      const isBalneo = rdv?.ID_Sce === 2 || s.ID_Acte === 2 || rdv?.ID_Zone === 3;
      if (!isBalneo) return false;

      if (historyStartDate && s.Date_Seanc_Realisee < historyStartDate) return false;
      if (historyEndDate && s.Date_Seanc_Realisee > historyEndDate) return false;

      return true;
    }).sort((a, b) => b.Date_Seanc_Realisee.localeCompare(a.Date_Seanc_Realisee));
  };

  const historyList = getBalneoRealizedHistory();

  // Initialisation par défaut des règles demi-journées Samedi / Dimanche si manquantes
  useEffect(() => {
    let hasChanges = false;
    const freshState = cloneState(dbState);
    if (!freshState.reglesBalneo) {
      freshState.reglesBalneo = [];
    }

    const defaultRules = [
      { Jour_Semaine: 6, Demi_Journee: 'Matin' as const, Genre_Autorise: 'H' as const },
      { Jour_Semaine: 6, Demi_Journee: 'Apres-midi' as const, Genre_Autorise: 'F' as const },
      { Jour_Semaine: 7, Demi_Journee: 'Matin' as const, Genre_Autorise: 'F' as const },
      { Jour_Semaine: 7, Demi_Journee: 'Apres-midi' as const, Genre_Autorise: 'H' as const },
    ];

    defaultRules.forEach(rule => {
      const exists = freshState.reglesBalneo.some(
        r => r.Jour_Semaine === rule.Jour_Semaine && r.Demi_Journee === rule.Demi_Journee
      );
      if (!exists) {
        const nextId = freshState.reglesBalneo.length > 0 
          ? Math.max(...freshState.reglesBalneo.map(r => r.ID_Regle)) + 1 
          : 1;
        freshState.reglesBalneo.push({
          ID_Regle: nextId,
          Jour_Semaine: rule.Jour_Semaine,
          Demi_Journee: rule.Demi_Journee,
          Genre_Autorise: rule.Genre_Autorise
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onSave(freshState);
    }
  }, [dbState, onSave]);

  // Jours affichés (6 jours hors Vendredi)
  const getBalneoDays = (start: string) => {
    let days: { dateStr: string; dayName: string; label: string }[] = [];
    let current = parseLocalDate(start);

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    while (days.length < 6) {
      const dName = dayNames[current.getDay()];
      if (dName !== 'Vendredi') {
        const dStr = getLocalISODate(current);
        days.push({
          dateStr: dStr,
          dayName: dName,
          label: `${current.getDate()}/${current.getMonth() + 1}`
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const activeDays = getBalneoDays(startDate);

  // Synchronisation dynamique de la caisse balnéothérapie
  const balneoTransactions = useMemo(() => {
    const manualTrans = ((dbState as any).transactions_caisses || [])
      .filter((t: any) => t.Caisse === 'Caisse Sce Balnéothérapie');

    const computedFactures = (dbState.factures || [])
      .filter(fac => (fac.Montant === 200 || fac.Montant === 2400) && fac.Statut === 'Payée')
      .map((fac): any => {
        const pat = dbState.patients.find(p => p.ID_Patient === fac.ID_Patient);
        const patName = pat ? `${pat.Nom_Patient} ${(pat as any).Prenom_Patient || ''}`.trim() : `Patient #${fac.ID_Patient}`;
        return {
          ID_Trans: fac.ID_Facture * 1000,
          Caisse: 'Caisse Sce Balnéothérapie',
          Type: 'Recette',
          Montant: fac.Montant,
          Libelle: 'Encaissement Facture Balnéo',
          ModePaiement: 'Espèces',
          Date_Trans: fac.Date_Facture,
          Patient_Nom: patName
        };
      });

    const computedVersements = (dbState.versements || [])
      .filter(v => {
        const hasManual = ((dbState as any).transactions_caisses || []).some((t: any) => 
          t.Libelle && (
            t.Libelle.includes(`ABN_#${v.ID_Abn}`) || 
            t.Libelle.includes(`ABN_#0${v.ID_Abn}`)
          )
        );
        if (hasManual) return false;

        const abn = dbState.abonnements.find(a => a.ID_Abn === v.ID_Abn);
        if (!abn) return false;
        const pack = dbState.packs.find(p => p.ID_Pack === abn.ID_Pack);
        return pack?.Libelle_Pack?.toLowerCase().includes('balnéo') || abn.ID_Pack === 2 || pack?.Cat_Pack === 'B';
      })
      .map((v): any => {
        const abn = dbState.abonnements.find(a => a.ID_Abn === v.ID_Abn);
        const pat = abn ? dbState.patients.find(p => p.ID_Patient === abn.ID_Patient) : null;
        const patName = pat ? `${pat.Nom_Patient} ${(pat as any).Prenom_Patient || ''}`.trim() : 'Patient Balnéo';
        return {
          ID_Trans: v.ID_Vers * 50000 + 500000,
          Caisse: 'Caisse Sce Balnéothérapie',
          Type: 'Recette',
          Montant: v.Mont_Vers,
          Libelle: `Versement direct Balnéo ABN_#${v.ID_Abn}`,
          ModePaiement: (v as any).paymentMode || 'Espèces',
          Date_Trans: v.Date_Vers || '',
          Patient_Nom: patName
        };
      });

    return [...manualTrans, ...computedFactures, ...computedVersements].sort((a, b) => (b.Date_Trans || '').localeCompare(a.Date_Trans || ''));
  }, [dbState]);

  const caisseBalneoStats = useMemo(() => {
    const recettes = balneoTransactions
      .filter(t => t.Type === 'Recette')
      .reduce((sum, t) => sum + t.Montant, 0);
    const depenses = (dbState.depenses || [])
      .filter(d => d.id_service === 2 && d.statut === 'Validée')
      .reduce((sum, d) => sum + d.montant, 0);
    return {
      recettes,
      depenses,
      solde: recettes - depenses
    };
  }, [balneoTransactions, dbState.depenses]);

  const getCellPatients = (date: string, time: string) => {
    const rdvs = dbState.rendezVous.filter(r => 
      r.Date_RDV === date && 
      r.H_Debut_RDV === time && 
      (r.ID_Sce === 2 || r.ID_Zone === 3 || r.ID_Acte === 2 || r.Service === 'Balnéothérapie')
    );
    return rdvs.map(r => {
      const p = dbState.patients.find(pat => pat.ID_Patient === r.ID_Patient);
      return { ...r, patient: p };
    });
  };

  const isBreak = (time: string) => {
    const t = timeToMin(time);
    return t >= timeToMin(breakStart) && t < timeToMin(breakEnd);
  };

  // =========================================================================
  // VALIDATION ATOMIQUE : DÉDUCTION FORFAIT OU ENCAISSEMENT + CRÉATION SÉANCE
  // =========================================================================
  const handleValidateSingleRDV = (rdv: Rendez_Vous) => {
    const rdvPatientId = Number(rdv.ID_Patient);
    const rdvActeId = Number(rdv.ID_Acte) || 2;
    const patientAbns = dbState.abonnements.filter(a => Number(a.ID_Patient) === rdvPatientId);

    // Vérification blocage gelé
    const frozenAbn = patientAbns.find(a => a.Etat === 'Gelé' || (a as any).Est_Gele);
    if (frozenAbn) {
      triggerToast(`Abonnement actuellement gelé/suspendu. Débloquer pour valider.`, 'error');
      return;
    }

    const fresh = cloneState(dbState);

    // 1. Passer le RDV en Honoré
    const rdvIdx = fresh.rendezVous.findIndex(r => r.ID_RDV === rdv.ID_RDV);
    if (rdvIdx !== -1) {
      fresh.rendezVous[rdvIdx] = {
        ...fresh.rendezVous[rdvIdx],
        Statut_RDV: 'Honoré',
        updatedAt: Date.now()
      };
    }

    // 2. Recherche d'abonnement actif couvrant l'acte
    let pAbnIdx = patientAbns.findIndex(a => 
      a.Etat === 'Actif' && 
      !isAbonnementGele(a, fresh) && 
      !(a as any).Est_Gele && 
      isSubscriptionCoveringActe(a, rdvActeId, fresh) && 
      getRemainingSessions(a, fresh) > 0
    );
    if (pAbnIdx === -1) {
      pAbnIdx = patientAbns.findIndex(a => 
        a.Etat !== 'Fermé' && 
        !isAbonnementGele(a, fresh) && 
        !(a as any).Est_Gele && 
        isSubscriptionCoveringActe(a, rdvActeId, fresh)
      );
    }
    if (pAbnIdx === -1) {
      pAbnIdx = patientAbns.findIndex(a => isSubscriptionCoveringActe(a, rdvActeId, fresh));
    }

    const matchedAbn = pAbnIdx !== -1 ? patientAbns[pAbnIdx] : null;
    const globalAbnIdx = matchedAbn ? fresh.abonnements.findIndex(a => a.ID_Abn === matchedAbn.ID_Abn) : -1;
    const remaining = matchedAbn ? getRemainingSessions(matchedAbn, fresh) : 0;

    const pat = fresh.patients.find(p => Number(p.ID_Patient) === rdvPatientId);

    if (matchedAbn && globalAbnIdx !== -1 && remaining > 0) {
      // ✅ DÉDUCTION FORFAIT
      fresh.abonnements[globalAbnIdx] = {
        ...fresh.abonnements[globalAbnIdx],
        Nbre_Sean_Consom_Abn: fresh.abonnements[globalAbnIdx].Nbre_Sean_Consom_Abn + 1,
        updatedAt: Date.now()
      };

      if (!fresh.seances) fresh.seances = [];
      const nextSeanceId = fresh.seances.length > 0
        ? Math.max(...fresh.seances.map(s => s.ID_Seanc)) + 1
        : 1;

      fresh.seances.push({
        ID_Seanc: nextSeanceId,
        ID_Patient: rdv.ID_Patient,
        ID_Prat: rdv.ID_Prat || 2,
        ID_Acte: rdv.ID_Acte || 2,
        ID_Abn: matchedAbn.ID_Abn,
        ID_RDV: rdv.ID_RDV,
        H_Debut_Seanc: rdv.H_Debut_RDV,
        H_Fin_Seanc: rdv.H_Fin_RDV,
        Prix_Seanc: 0,
        Date_Seanc_Realisee: rdv.Date_RDV,
        updatedAt: Date.now()
      });

      onSave(fresh);
      triggerToast(`Séance déduite du forfait (${pat?.Nom_Patient || 'Patient'}) !`, 'success');
    } else {
      // 💵 HORS-FORFAIT : ENCAISSEMENT DIRECT
      const act = fresh.actes.find(a => Number(a.ID_Acte) === Number(rdv.ID_Acte));
      const price = act?.Prix_Acte || 2400;

      if (!(fresh as any).transactions_caisses) (fresh as any).transactions_caisses = [];
      const nextTransId = (fresh as any).transactions_caisses.length > 0
        ? Math.max(...(fresh as any).transactions_caisses.map((t: any) => t.ID_Trans || (t as any).ID_Transaction || 0)) + 1
        : 1;

      const patientNom = pat ? `${pat.Nom_Patient} ${(pat as any).Prenom_Patient || ''}`.trim() : 'Patient Balnéo';

      (fresh as any).transactions_caisses.push({
        ID_Trans: nextTransId,
        Caisse: 'Caisse Sce Balnéothérapie',
        Type: 'Recette',
        Montant: price,
        Libelle: `RDV_#${rdv.ID_RDV} - ${act?.Libelle_Acte || 'Balnéothérapie'} (Hors-forfait)`,
        ModePaiement: 'Espèces',
        Date_Trans: rdv.Date_RDV,
        Patient_Nom: patientNom,
        ID_Acte: rdv.ID_Acte,
        ID_RDV: rdv.ID_RDV,
        updatedAt: Date.now()
      });

      if (!fresh.seances) fresh.seances = [];
      const nextSeanceId = fresh.seances.length > 0
        ? Math.max(...fresh.seances.map(s => s.ID_Seanc)) + 1
        : 1;

      fresh.seances.push({
        ID_Seanc: nextSeanceId,
        ID_Patient: rdv.ID_Patient,
        ID_Prat: rdv.ID_Prat || 2,
        ID_Acte: rdv.ID_Acte || 2,
        ID_Abn: null,
        ID_RDV: rdv.ID_RDV,
        H_Debut_Seanc: rdv.H_Debut_RDV,
        H_Fin_Seanc: rdv.H_Fin_RDV,
        Prix_Seanc: price,
        Date_Seanc_Realisee: rdv.Date_RDV,
        updatedAt: Date.now()
      });

      onSave(fresh);
      triggerToast(`Règlement enregistré (${price} DA) et séance validée.`, 'success');
    }
  };

  // Suppression d'un rendez-vous avec rollback si honoré
  const handleDeleteRDV = (rdvId: number) => {
    const targetRdv = dbState.rendezVous.find(r => r.ID_RDV === rdvId);
    if (!targetRdv) return;

    const fresh = cloneState(dbState);

    if (targetRdv.Statut_RDV === 'Honoré') {
      const seanceIdx = fresh.seances.findIndex(s => s.ID_RDV === targetRdv.ID_RDV);
      if (seanceIdx !== -1) {
        const seance = fresh.seances[seanceIdx];
        if (seance.ID_Abn) {
          const abnIdx = fresh.abonnements.findIndex(abn => Number(abn.ID_Abn) === Number(seance.ID_Abn));
          if (abnIdx !== -1) {
            fresh.abonnements[abnIdx] = {
              ...fresh.abonnements[abnIdx],
              Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1),
              updatedAt: Date.now()
            };
          }
        }
        fresh.seances = fresh.seances.filter(s => s.ID_RDV !== targetRdv.ID_RDV);
      }

      if ((fresh as any).transactions_caisses) {
        (fresh as any).transactions_caisses = (fresh as any).transactions_caisses.filter((t: any) => {
          return !String(t.Libelle || '').includes(`RDV_#${targetRdv.ID_RDV}`);
        });
      }
    }

    fresh.rendezVous = fresh.rendezVous.filter(r => r.ID_RDV !== targetRdv.ID_RDV);
    onSave(fresh);
    setDeleteConfirmRdvId(null);
    triggerToast('Rendez-vous supprimé avec succès.', 'info');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6" id="balneo-calendar-workspace">
      
      {/* HEADER CONTROL AREA */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-grow">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Waves className="w-5 h-5" />
              </span>
              <h3 className="font-sans font-bold text-md text-slate-900">
                Système de Plannings Balnéothérapie
              </h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              Gestion collective des créneaux en bassin et règlements des séances.
            </p>
          </div>

          {/* CONTENEUR CAISSE BALNÉOTHÉRAPIE */}
          {canEncaisserBalneo && (
            <div 
              onClick={() => setShowHistory(!showHistory)}
              className="bg-emerald-500 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between border border-emerald-600 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-200 min-w-[260px] shrink-0 cursor-pointer"
            >
              <div className="space-y-1 z-10">
                <span className="text-[10px] uppercase font-black tracking-wider opacity-90 block">Caisse Balnéothérapie</span>
                <span className="text-2xl font-black font-mono block">{caisseBalneoStats.solde.toLocaleString()} DA</span>
                <div className="flex gap-2 text-[8.5px] font-bold text-emerald-100/90 font-mono">
                  <span>R: +{caisseBalneoStats.recettes.toLocaleString()}</span>
                  <span>D: -{caisseBalneoStats.depenses.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl text-white z-10 shadow-sm">
                <Waves className="w-6 h-6 animate-pulse" />
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>
          )}
        </div>

        {/* CONTROLLER SWITCHES */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setShowDepenses(!showDepenses)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-3xs cursor-pointer ${
              showDepenses 
                ? 'bg-rose-600 text-white border-rose-700' 
                : 'bg-white hover:bg-slate-50 text-slate-750 border-slate-200'
            }`}
          >
            <Wallet className={`w-4 h-4 ${showDepenses ? 'text-white' : 'text-rose-600'}`} />
            <span>Dépenses</span>
          </button>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-3xs cursor-pointer ${
              showHistory 
                ? 'bg-indigo-600 text-white border-indigo-700' 
                : 'bg-white hover:bg-slate-50 text-slate-750 border-slate-200'
            }`}
          >
            <History className={`w-4 h-4 ${showHistory ? 'text-white' : 'text-emerald-600'}`} />
            <span>Historique</span>
          </button>
        </div>
      </div>

      {/* DEPENSE MANAGER DRAWER */}
      {showDepenses && (
        <DepenseManager
          idService={2}
          nomService="Balnéothérapie"
          dbState={dbState}
          currentUser={currentUser}
          onDbChange={(newState) => onSave ? onSave(newState) : saveDatabase(newState)}
          triggerToast={triggerToast}
        />
      )}

      {/* HISTORIQUE ACCORDION DRAWER */}
      {showHistory && (
        <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-4 text-xs animate-fade-in shadow-inner" id="balneo-history-view-panel">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-3 gap-4">
            <div className="flex items-center gap-2 font-extrabold text-sm text-slate-800">
              <History className="w-5 h-5 text-emerald-600" />
              <div>
                <span>Explorateur Temporel & Historique Balnéothérapie</span>
                <p className="text-[10px] text-slate-400 font-medium normal-case">Visualisez l'historique de n'importe quelle séance passée.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-550 uppercase">Du :</span>
                <input 
                  type="date"
                  value={historyStartDate}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-550 uppercase">Au :</span>
                <input 
                  type="date"
                  value={historyEndDate}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                />
              </div>
              {(historyStartDate || historyEndDate) && (
                <button 
                  onClick={() => {
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                  }}
                  className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <button onClick={() => setShowHistory(false)} className="bg-white p-2 px-4 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 text-xs font-bold transition shadow-3xs">
              Fermer cet explorateur
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche : liste historique */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2 px-1">
                <BookOpen className="w-3.5 h-3.5" />
                Dernières séances réalisées
              </h4>
              {historyList.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 italic">
                  Aucune séance historique répertoriée pour la balnéothérapie.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {historyList.map((sc) => {
                    const patient = dbState.patients.find(p => p.ID_Patient === sc.ID_Patient);
                    const act = dbState.actes.find(a => a.ID_Acte === sc.ID_Acte);
                    return (
                      <div key={sc.ID_Seanc} className="bg-white p-3 border border-slate-200 rounded-xl flex items-center justify-between shadow-xxs hover:border-indigo-200 transition group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 p-0.5 px-1.5 rounded font-mono text-[9px] font-bold text-slate-500">#{sc.ID_Seanc}</span>
                            <span className="text-slate-400 font-bold">{sc.Date_Seanc_Realisee} • {sc.H_Debut_Seanc}-{sc.H_Fin_Seanc}</span>
                          </div>
                          <p className="font-bold text-slate-800 mt-1">{patient?.Nom_Patient} <span className="text-slate-400 font-medium">({patient?.type_patient || patient?.Type_Pat})</span></p>
                          <p className="text-slate-500 text-[10px] mt-0.5">Acte : <span className="text-indigo-600">{act?.Libelle_Acte || 'Balnéothérapie'}</span></p>
                        </div>
                        <div className="text-right ml-4">
                          <span className="block font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-extrabold text-[10px] border border-emerald-100">
                            {sc.Prix_Seanc === 0 ? 'Couvert' : `${sc.Prix_Seanc} DA`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Colonne droite : stats rapides */}
            <div className="bg-white border border-slate-200 rounded-2.5xl p-5 shadow-3xs space-y-4">
               <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
                 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                 Résumé d'activité Balnéothérapie
               </h4>
               <div className="grid grid-cols-1 gap-3">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400">Séances ce mois-ci</span>
                    <p className="text-lg font-black text-slate-800 tabular-nums">
                      {historyList.filter(s => s.Date_Seanc_Realisee.startsWith('2026-06')).length}
                    </p>
                 </div>
                 <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="text-[9px] font-bold text-indigo-400">Total recettes (Balnéo)</span>
                    <p className="text-lg font-black text-indigo-900 tabular-nums">
                      {historyList.reduce((acc, s) => acc + (s.Prix_Seanc || 0), 0).toLocaleString()} DA
                    </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* AGENDA ET NAVIGATION SEMAINE */}
      <div className="space-y-6">

        {/* BARRE DE CONTRÔLE SEMAINE */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-2xl p-3 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = parseLocalDate(startDate);
                d.setDate(d.getDate() - 7);
                setStartDate(getLocalISODate(d));
              }}
              className="p-1 px-2.5 bg-white text-slate-700 font-bold border border-slate-200 rounded-lg hover:bg-slate-100 text-xs transition flex items-center gap-1 shadow-3xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Semaine Préc.</span>
            </button>
            <button
              onClick={() => {
                const d = parseLocalDate(startDate);
                d.setDate(d.getDate() + 7);
                setStartDate(getLocalISODate(d));
              }}
              className="p-1 px-2.5 bg-white text-slate-700 font-bold border border-slate-200 rounded-lg hover:bg-slate-100 text-xs transition flex items-center gap-1 shadow-3xs cursor-pointer"
            >
              <span>Semaine Suiv.</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs font-bold text-indigo-850">
            📍 Période : du <span className="underline font-black">{activeDays[0]?.dateStr}</span> au <span className="underline font-black">{activeDays[activeDays.length - 1]?.dateStr}</span>
          </div>

          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher patient..."
              className="bg-white border border-slate-300 focus:border-indigo-600 rounded-lg pl-8 pr-6 py-1 text-[10.5px] focus:outline-none transition w-[160px] font-semibold h-[26px] shadow-3xs"
              value={balneoSearchTerm}
              onChange={(e) => setBalneoSearchTerm(e.target.value)}
            />
            {balneoSearchTerm && (
              <button
                onClick={() => setBalneoSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TABLEAU GRILLE SEMAINE */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto custom-scrollbar-horizontal pb-2 w-full">
            <table className="w-full text-left border-collapse table-fixed select-none text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-1.5 font-semibold text-slate-600 w-[70px] min-w-[70px] max-w-[70px] border-r border-slate-100 text-center font-mono">Horaires</th>
                  {activeDays.map((day, index) => (
                    <th key={index} className="p-1 border-r border-slate-100 font-sans last:border-0 align-top w-[14%] flex-1 min-w-0 text-center">
                      <span className="block font-black text-slate-800 text-[10px] leading-tight uppercase tracking-wider">{day.dayName}</span>
                      <span className="block font-bold text-slate-400 mt-0.5 text-[9px]">{day.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, sIdx) => {
                  const isBreakTime = isBreak(time);

                  return (
                    <tr 
                      key={sIdx} 
                      className={`border-b last:border-0 border-slate-100 transition duration-100 hover:bg-slate-50/35 ${
                        isBreakTime ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Colonne Horaires */}
                      <td className="p-1 border-r border-slate-150 align-middle text-center font-bold text-slate-500 font-mono bg-slate-50/60 text-[9px] w-[70px] min-w-[70px] max-w-[70px]">
                        {time}
                      </td>

                      {activeDays.map((day, dIdx) => {
                        if (isBreakTime) {
                          return dIdx === 0 ? (
                            <td 
                              key={dIdx} 
                              colSpan={activeDays.length} 
                              className="p-1 bg-amber-50/60 border-r border-slate-100 text-center text-amber-700/80 font-bold text-[9px] uppercase tracking-wider py-1.5"
                            >
                              PAUSE DÉJEUNER (FERMETURE CLINIQUE) ✨
                            </td>
                          ) : null;
                        }

                        const cellPatients = getCellPatients(day.dateStr, time);
                        const filteredPatients = balneoSearchTerm
                          ? cellPatients.filter(p => 
                              p.patient?.Nom_Patient?.toLowerCase().includes(balneoSearchTerm.toLowerCase()) ||
                              p.patient?.Prenom_Patient?.toLowerCase().includes(balneoSearchTerm.toLowerCase())
                            )
                          : cellPatients;

                        const hasSearchMatchInCell = balneoSearchTerm && filteredPatients.length > 0;

                        return (
                          <td 
                            key={dIdx} 
                            onClick={() => setBookingCell({ dateStr: day.dateStr, slotTime: time })}
                            className={`p-1 border-r border-slate-100 last:border-0 align-top min-h-[60px] cursor-pointer hover:bg-slate-100/50 transition-colors ${
                              hasSearchMatchInCell ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''
                            }`}
                          >
                            {filteredPatients.length === 0 ? (
                              <div className="h-full min-h-[50px] flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition">
                                <Plus className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="flex gap-1.5 items-stretch min-h-[50px]">
                                {/* À gauche : Mini-badge vertical bleu clair indiquant Nb et total */}
                                <div 
                                  className="w-4.5 bg-sky-100 border border-sky-200 text-sky-800 rounded flex flex-col items-center justify-center shrink-0 shadow-3xs py-1 select-none pointer-events-none"
                                  title={`Total : ${filteredPatients.length} patient(s)`}
                                >
                                  <span className="block text-[6.5px] font-bold text-sky-600 font-sans leading-none">Nb</span>
                                  <span className="block text-[9.5px] font-black leading-none mt-0.5">{filteredPatients.length}</span>
                                </div>

                                {/* À droite : Une pile de cartes pour chaque patient */}
                                <div className="flex-1 flex flex-col gap-1 min-w-0">
                                  {filteredPatients.map((entry) => {
                                    const actObj = dbState.actes.find(a => Number(a.ID_Acte) === Number(entry.ID_Acte)) 
                                      || dbState.actes.find(a => Number(a.ID_Acte) === 2);
                                    const actLabel = actObj?.Libelle_Acte || 'Séances Balnéothérapies';
                                    const patientName = entry.patient 
                                      ? `${entry.patient.Nom_Patient} ${(entry.patient as any).Prenom_Patient || ''}`.trim().toUpperCase()
                                      : `PATIENT #${entry.ID_Patient}`;

                                    return (
                                      <div 
                                        key={entry.ID_RDV} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBookingCell({ dateStr: day.dateStr, slotTime: time });
                                        }}
                                        className="p-1 px-1.5 rounded-md border bg-emerald-50 border-emerald-200 text-emerald-900 transition hover:bg-emerald-100/70 hover:shadow-2xs cursor-pointer shadow-3xs"
                                        title={`Cliquer pour ouvrir la planification (RDV #${entry.ID_RDV})`}
                                      >
                                        {/* Première ligne : Nom du patient en majuscules grasses + #ID aligné à droite */}
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-emerald-900 uppercase truncate text-[9px] block">
                                            {patientName}
                                          </span>
                                          <span className="text-[7.5px] font-mono text-slate-400 font-bold shrink-0">
                                            #{entry.ID_RDV}
                                          </span>
                                        </div>

                                        {/* Deuxième ligne : Libellé de l'acte en petit texte grisé */}
                                        <div className="text-[9px] text-slate-500 truncate mt-0.5 font-medium">
                                          {actLabel}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODALE DE PLANIFICATION DES CRÉNEAUX BALNÉO */}
      {bookingCell && (
        <BalneoBookingModal
          dateStr={bookingCell.dateStr}
          slotTime={bookingCell.slotTime}
          dbState={dbState}
          currentUser={currentUser}
          onClose={() => setBookingCell(null)}
          onAddRDV={onAddRDV}
          onUpdateRDVStatus={onUpdateRDVStatus}
          handleValidateSingleRDV={handleValidateSingleRDV}
          handleDeleteRDV={handleDeleteRDV}
          triggerToast={triggerToast}
        />
      )}

    </div>
  );
};

// =========================================================================
// COMPOSANT MODALE : FENÊTRE DE PLANIFICATION RESTAURÉE
// =========================================================================
interface BalneoBookingModalProps {
  dateStr: string;
  slotTime: string;
  dbState: DatabaseState;
  currentUser: any;
  onClose: () => void;
  onAddRDV: (newRDVData: Omit<Rendez_Vous, 'ID_RDV'>) => void;
  onUpdateRDVStatus: (rdvId: number, status: Rendez_Vous['Statut_RDV'], priceOverridden?: number) => void;
  handleValidateSingleRDV: (rdv: Rendez_Vous) => void;
  handleDeleteRDV: (rdvId: number) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error' | 'warning') => void;
}

export const BalneoBookingModal: React.FC<BalneoBookingModalProps> = ({
  dateStr,
  slotTime,
  dbState,
  currentUser,
  onClose,
  onAddRDV,
  handleValidateSingleRDV,
  handleDeleteRDV,
  triggerToast
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedActeId, setSelectedActeId] = useState<number>(2);

  const existingRdvs = useMemo(() => {
    return dbState.rendezVous.filter(r => 
      r.Date_RDV === dateStr && 
      r.H_Debut_RDV === slotTime && 
      (r.ID_Sce === 2 || r.ID_Zone === 3 || r.ID_Acte === 2 || r.Service === 'Balnéothérapie')
    );
  }, [dbState, dateStr, slotTime]);

  const actList = useMemo(() => {
    return getFilteredActesForRole(dbState, currentUser?.Role).filter(a => (a as any).ID_Sce === 2 || a.ID_Acte === 2);
  }, [dbState, currentUser]);

  const handleSelectAndAddPatient = (patientId: number) => {
    if (!patientId) return;

    const alreadyBooked = existingRdvs.some(r => Number(r.ID_Patient) === Number(patientId));
    if (alreadyBooked) {
      triggerToast('Ce patient est déjà inscrit sur ce créneau horaire.', 'error');
      return;
    }

    const patientObj = dbState.patients.find(p => Number(p.ID_Patient) === Number(patientId));
    const endHour = String(parseInt(slotTime.split(':')[0], 10) + 1).padStart(2, '0') + ':00';

    onAddRDV({
      ID_Patient: patientId,
      ID_Prat: 2,
      ID_Acte: selectedActeId,
      ID_Sce: 2,
      ID_Zone: 3,
      Service: 'Balnéothérapie',
      Date_RDV: dateStr,
      H_Debut_RDV: slotTime,
      H_Fin_RDV: endHour,
      Statut_RDV: 'Planifié',
      Priorite: 'Normale',
      Nom_Patient: patientObj ? `${patientObj.Nom_Patient} ${(patientObj as any).Prenom_Patient || ''}`.trim() : '',
      Nom_Praticien: 'Équipe Balnéo',
      Nom_Acte: actList.find(a => a.ID_Acte === selectedActeId)?.Libelle_Acte || 'Balnéothérapie'
    });

    setSelectedPatientId(null);
    triggerToast('Patient programmé (Statut: Planifié)', 'success');
  };

  const handleActeChange = (rdvId: number, acteId: number) => {
    const fresh = { ...dbState, rendezVous: dbState.rendezVous.map(r => r.ID_RDV === rdvId ? { ...r, ID_Acte: acteId } : r) };
    saveDatabase(fresh);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* EN-TÊTE */}
        <div className="p-4 px-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700">
              <Calendar className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Planification Multiple : Plateau Homme
              </h3>
              <p className="text-slate-500 text-xs font-medium">
                Date : <span className="font-bold text-slate-800">{dateStr}</span> • Horaire : <span className="font-bold text-slate-800">{slotTime}</span> • <span className="font-bold text-slate-800">{existingRdvs.length} patient(s) programmé(s)</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* SAISIE PATIENT */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-slate-500"/>
                Ajouter un patient (Plateau Homme)
              </span>
              <span className="text-[11px] italic text-slate-400">
                Tapez les premières lettres du nom
              </span>
            </div>

            <div className="w-full">
              <PatientAutocomplete
                patients={dbState.patients}
                onSelect={(patient) => {
                  if (patient && patient.ID_Patient) {
                    handleSelectAndAddPatient(patient.ID_Patient);
                  }
                }}
                placeholder="Ex: 'Ben...', 'Amed...', 'Kac...'"
              />
            </div>
          </div>

          {/* TABLEAU PATIENTS */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[11px] uppercase font-black tracking-wider text-slate-600">
                PATIENTS PROGRAMMÉS À {slotTime} ({existingRdvs.length})
              </span>
              <span className="text-[11px] italic text-slate-400 font-medium">
                Plateau
              </span>
            </div>

            {existingRdvs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                Aucun patient programmé pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-3 pl-4">NOM ET PRÉNOM</th>
                      <th className="p-3 text-center">ÂGE</th>
                      <th className="p-3">TYPE ACTE</th>
                      <th className="p-3 text-center">MONTANT ACTE</th>
                      <th className="p-3 text-center">ABONNEMENT</th>
                      <th className="p-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {existingRdvs.map((rdv) => {
                      const patient = dbState.patients.find(p => p.ID_Patient === rdv.ID_Patient);
                      const pName = patient ? `${patient.Nom_Patient} ${(patient as any).Prenom_Patient || ''}`.trim() : `Patient #${rdv.ID_Patient}`;
                      
                      let age = patient?.Age_Patient || (patient as any)?.Age_Pat || 30;
                      const act = dbState.actes.find(a => Number(a.ID_Acte) === Number(rdv.ID_Acte));
                      const isHonored = rdv.Statut_RDV === 'Honoré';

                      const pAbns = dbState.abonnements.filter(a => Number(a.ID_Patient) === Number(rdv.ID_Patient));
                      const activeAbn = pAbns.find(a => 
                        a.Etat === 'Actif' && 
                        !isAbonnementGele(a, dbState) && 
                        isSubscriptionCoveringActe(a, rdv.ID_Acte || 2, dbState) && 
                        getRemainingSessions(a, dbState) > 0
                      );

                      const remaining = activeAbn ? getRemainingSessions(activeAbn, dbState) : 0;
                      // Si abonnement actif, le montant facturé en caisse pour cette séance est 0 DA
                      const effectivePrice = activeAbn ? 0 : (act?.Prix_Acte || 200);

                      return (
                        <tr key={rdv.ID_RDV} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 pl-4 font-black text-slate-900 uppercase">
                            {pName}
                          </td>

                          <td className="p-3 text-center text-slate-500 font-medium">
                            {age} ans
                          </td>

                          <td className="p-3">
                            <select
                              value={rdv.ID_Acte || 2}
                              onChange={(e) => handleActeChange(rdv.ID_RDV, Number(e.target.value))}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                            >
                              {actList.map(a => (
                                <option key={a.ID_Acte} value={a.ID_Acte}>{a.Libelle_Acte}</option>
                              ))}
                            </select>
                          </td>

                          {/* MONTANT ACTE (0 DA SI ABONNEMENT ACTIF) */}
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {effectivePrice} DA
                            {activeAbn && (
                              <span className="block text-[9px] text-emerald-600 font-sans font-normal">
                                (Inclus dans forfait)
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {activeAbn ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                                  <Gift className="w-3 h-3 text-emerald-600"/>
                                  ABONNEMENT
                                </span>
                                <span className="text-[9px] font-mono italic text-slate-500 mt-0.5">
                                  {remaining} séans. reliquat
                                </span>
                              </div>
                            ) : (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                Hors forfait / 0 séance
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isHonored ? (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1">
                                  <Check className="w-3 h-3"/> Validé
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleValidateSingleRDV(rdv)}
                                  className={`px-3 py-1 rounded-full font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border ${
                                    activeAbn
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                  }`}
                                >
                                  <Check className="w-3 h-3"/>
                                  {activeAbn ? 'Déduire' : 'Régler'}
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteRDV(rdv.ID_RDV)}
                                className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PIED DE PAGE */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#0e6296] hover:bg-[#0b4d77] text-white font-extrabold rounded-xl text-sm transition cursor-pointer shadow-md"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};

export default React.memo(BalneoCalendar);
