/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, XCircle, AlertTriangle, User, Clock, ShieldCheck, Filter, AlertOctagon, Coins } from 'lucide-react';
import { DatabaseState, Rendez_Vous, Utilisateur, validateAppointment, timesOverlap, getRemainingSessions, getFilteredActesForRole, isSubscriptionCoveringActe } from '../dbStore';

interface SchedulerSectionProps {
  dbState: DatabaseState;
  currentUser: Utilisateur;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onAddRDV: (rdv: Omit<Rendez_Vous, 'ID_RDV'>) => void;
  onUpdateRDVStatus: (id: number, status: Rendez_Vous['Statut_RDV'], priceOverridden?: number) => void;
  onSave?: (db: DatabaseState) => void;
  triggerToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  forceServiceId?: number;
  forceZoneId?: number;
}

const isRdvCancelled = (rdv: Rendez_Vous): boolean => {
  if (rdv.Statut_RDV === 'Annulé' || rdv.Statut_RDV === 'Absent') {
    return true;
  }
  if (rdv.Statut_RDV === 'Planifié') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayReal = `${y}-${m}-${d}`;
    if (rdv.Date_RDV < todayReal) {
      return true;
    }
    if (rdv.Date_RDV === todayReal) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const limitMinutes = 23 * 60 + 59; // 23h59 (minuit)
      if (currentMinutes >= limitMinutes) {
        return true;
      }
    }
  }
  return false;
};

export const SchedulerSection: React.FC<SchedulerSectionProps> = ({
  dbState,
  currentUser,
  selectedDate,
  setSelectedDate,
  onAddRDV,
  onUpdateRDVStatus,
  onSave,
  triggerToast,
  forceServiceId,
  forceZoneId,
}) => {
  // Filters
  const [filterByMyService, setFilterByMyService] = useState<boolean>(true);

  // État et handler pour éviter les doublons lors de la sauvegarde/mise à jour d'actes par date de rendez-vous (onAddKineApp)
  const [kineApps, setKineApps] = useState<any[]>([]);
  const onAddKineApp = (newApp: any) => {
    setKineApps((prev) => {
      const exists = prev.some((app) => app.appointment_date === newApp.appointment_date);
      if (exists) {
        return prev.map((app) =>
          app.appointment_date === newApp.appointment_date ? { ...app, ...newApp } : app
        );
      }
      return [...prev, { ...newApp, id: `kine-${Date.now()}` }];
    });
  };

  // Calculate Caisse Sce Adulte Balance
  const getCaisseSceAdulteBalance = () => {
    const manualTransList = (dbState as any).transactions_caisses || [];
    // Ensure we only include manual transactions for Caisse Sce Adulte, and filter out any orphaned transactions from deleted or cancelled RDVs
    const manualSceAdulte = manualTransList.filter((t: any) => {
      if (t.Caisse !== 'Caisse Sce Adulte') return false;
      const rdvMatch = String(t.Libelle || '').match(/RDV_#(\d+)/);
      if (rdvMatch) {
        const rdvId = Number(rdvMatch[1]);
        const rdv = dbState.rendezVous.find(r => r.ID_RDV === rdvId);
        // If the RDV is deleted or no longer 'Honoré', ignore this transaction record
        if (!rdv || rdv.Statut_RDV !== 'Honoré') return false;
      }
      
      return true;
    });

    const computedFactures = (dbState.factures || [])
      .filter((fac: any) => fac.Statut === 'Payée')
      .map((fac: any) => {
        const pat = dbState.patients.find((p: any) => p.ID_Patient === fac.ID_Patient);
        let caisseDest = 'Caisse Abonnement / Autres Soins';
        if (fac.Montant === 1500 || fac.Montant === 1000) {
          caisseDest = 'Caisse Consultation RDC';
        } else if ((pat?.type_patient === 'Adulte' || pat?.Type_Pat === 'Adulte') && fac.Montant < 4000) {
          caisseDest = 'Caisse Sce Adulte';
        } else if (fac.Montant === 200 || fac.Montant === 2400) {
          caisseDest = 'Caisse Sce Balnéothérapie';
        } else {
          caisseDest = 'Caisse Abonnement / Autres Soins';
        }
        return {
          Caisse: caisseDest,
          Type: 'Recette',
          Montant: fac.Montant
        };
      });
    const facturesSceAdulte = computedFactures.filter((t: any) => t.Caisse === 'Caisse Sce Adulte');

    // 3. Versements sur les abonnements Adulte (Cat_Pack === 'R')
    const computedVersements = (dbState.versements || [])
      .filter((v: any) => {
        // Prevent double counting if there is already a manual transaction representing this subscription versement
        const hasManual = ((dbState as any).transactions_caisses || []).some((t: any) => 
          t.Libelle && (
            t.Libelle.includes(`ABN_#${v.ID_Abn}`) || 
            t.Libelle.includes(`ABN_#0${v.ID_Abn}`)
          )
        );
        return !hasManual;
      })
      .map((v): any => {
        const abn = dbState.abonnements.find(a => a.ID_Abn === v.ID_Abn);
        const pack = (abn && dbState.packs) ? dbState.packs.find(p => p.ID_Pack === abn.ID_Pack) : null;
        
        let caisseDest = 'Caisse Abonnement / Autres Soins';
        if (pack) {
          if (pack.Cat_Pack === 'B') {
            caisseDest = 'Caisse Sce Balnéothérapie';
          } else if (pack.Cat_Pack === 'R') {
            caisseDest = 'Caisse Sce Adulte';
          } else {
            caisseDest = 'Caisse Abonnement / Autres Soins';
          }
        }
        return {
          Caisse: caisseDest,
          Type: 'Recette',
          Montant: v.Mont_Vers
        };
      })
      .filter(Boolean);
    const versementsSceAdulte = computedVersements.filter((t: any) => t.Caisse === 'Caisse Sce Adulte');

    const allSceAdulteTrans = [...manualSceAdulte, ...facturesSceAdulte, ...versementsSceAdulte];
    
    const totalRecettes = allSceAdulteTrans
      .filter((t: any) => t.Type === 'Recette')
      .reduce((acc: number, curr: any) => acc + (curr.Montant || 0), 0);
      
    const totalDepenses = allSceAdulteTrans
      .filter((t: any) => t.Type === 'Dépense')
      .reduce((acc: number, curr: any) => acc + (curr.Montant || 0), 0);

    return totalRecettes - totalDepenses;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' })
      .format(val)
      .replace('DZD', 'DA');
  };
  
  // New appointment form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newPatient, setNewPatient] = useState<string>(() => {
    const firstNonImc = dbState.patients.find(p => !p.type_patient?.toLowerCase().includes('imc'));
    return firstNonImc ? String(firstNonImc.ID_Patient) : '1';
  });
  const [newPrat, setNewPrat] = useState<string>('1');
  const [newActe, setNewActe] = useState<string>('1');
  const [newPlanType, setNewPlanType] = useState<string>('1');
  const [newZone, setNewZone] = useState<string>('1');
  const [newTimeStart, setNewTimeStart] = useState<string>('10:00');
  const [newTimeEnd, setNewTimeEnd] = useState<string>('11:00');
  const [newBesoin, setNewBesoin] = useState<string>('Table');

  const formInitializedRef = React.useRef<boolean>(false);

  // Sync inputs with chosen service / zone when showAddForm is triggered
  useEffect(() => {
    if (!showAddForm) {
      formInitializedRef.current = false;
      return;
    }
    if (formInitializedRef.current) {
      return;
    }

    if (forceServiceId !== undefined) {
      const matchingPrat = dbState.praticiens.find(p => p.ID_Sce === forceServiceId);
      if (matchingPrat) {
        setNewPrat(String(matchingPrat.ID_Prat));
        if (forceServiceId === 2) { // Balneo
          setNewPlanType('2');
          setNewZone('3');
          setNewActe('2');
        } else if (forceServiceId === 3) { // Intensifs
          setNewPlanType('3');
          setNewZone(forceZoneId !== undefined ? String(forceZoneId) : '4');
          setNewActe('3');
        } else { // RF
          setNewPlanType('1');
          setNewZone('1');
          setNewActe('1');
        }
      }
    }
    if (forceZoneId !== undefined) {
      setNewZone(String(forceZoneId));
    }
    formInitializedRef.current = true;
  }, [showAddForm, forceServiceId, forceZoneId, dbState]);
  
  // Completing session billing states
  const [billingRDVId, setBillingRDVId] = useState<number | null>(null);
  const [billingPrice, setBillingPrice] = useState<number>(150);

  // Live validator state
  const [validationMessages, setValidationMessages] = useState<{
    errors: string[];
    warnings: string[];
    info: string[];
  }>({ errors: [], warnings: [], info: [] });

  // Gather current draft values for checking
  const currentDraftRDV = {
    ID_Patient: Number(newPatient),
    ID_Prat: Number(newPrat),
    ID_Acte: Number(newActe),
    ID_Type_Plan: Number(newPlanType),
    ID_Zone: Number(newZone),
    ID_Utilisateur: currentUser.ID_Utilisateur,
    Date_RDV: selectedDate,
    H_Debut_RDV: newTimeStart,
    H_Fin_RDV: newTimeEnd,
    Statut_RDV: 'Planifié' as const,
    Besoin: newBesoin,
  };

  // Re-run the validation engine on any changes we make to the new appointment draft
  useEffect(() => {
    const res = validateAppointment(currentDraftRDV, dbState);
    setValidationMessages(res);
  }, [newPatient, newPrat, newActe, newPlanType, newZone, newTimeStart, newTimeEnd, selectedDate, dbState, newBesoin]);

  // Auto-adjust end time based on patient type (Adulte gets 1 hour, others 30 min)
  useEffect(() => {
    if (newTimeStart) {
      const selectedPat = dbState.patients.find(p => p.ID_Patient === Number(newPatient));
      const isAdult = selectedPat ? selectedPat.type_patient === 'Adulte' : true;
      const duration = isAdult ? 60 : 30;
      
      const [h, m] = newTimeStart.split(':').map(Number);
      if (!isNaN(h)) {
        const totalMins = h * 60 + (m || 0) + duration;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        setNewTimeEnd(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
      }
    }
  }, [newTimeStart, newPatient, dbState.patients]);

  // Handle auto preset changes when specific dropdowns are updated (e.g. choosing Balneo should auto select Balneo Zone / Acte)
  const handlePratChange = (pratIdStr: string) => {
    setNewPrat(pratIdStr);
    const selectedPrat = dbState.praticiens.find(p => p.ID_Prat === Number(pratIdStr));
    if (selectedPrat) {
      // Auto-configure appropriate Service Planning & Zone if regular
      if (selectedPrat.ID_Sce === 2) { // Balneo
        setNewPlanType('2'); // Balneo Planning
        setNewZone('3');     // Balneo Bassin
        setNewActe('2');     // Bain Thérapeutique
      } else if (selectedPrat.ID_Sce === 3 || selectedPrat.ID_Sce === 4 || selectedPrat.ID_Sce === 5) { // Intensifs
        setNewPlanType('3'); // Intensif 1-on-1
        if (selectedPrat.ID_Sce === 3) {
          setNewZone('4');     // Étage 2
        } else if (selectedPrat.ID_Sce === 4) {
          setNewZone('5');     // Étage 3
        } else if (selectedPrat.ID_Sce === 5) {
          setNewZone('6');     // Étage 4
        }
        setNewActe('3');     // Psychomotor default
      } else {
        setNewPlanType('1'); // Standard
        setNewZone('1');     // Plateau Homme default
        setNewActe('1');     // Kiné Standard
      }
    }
  };

  const handlePatientChange = (patientIdStr: string) => {
    setNewPatient(patientIdStr);
    const selectedPat = dbState.patients.find(p => p.ID_Patient === Number(patientIdStr));
    if (selectedPat) {
      if (newPlanType === '1') {
        // Auto select plateau based on gender
        if (selectedPat.Genre_Patient === 'H' || selectedPat.Genre_Patient === 'Homme') {
          setNewZone('1'); // Plateau Homme
        } else {
          setNewZone('2'); // Plateau Femme
        }
      }

      // Find active first, otherwise most recent created subscription (even if inactive/gelé/exhausted)
      const patientAbns = dbState.abonnements.filter(a => a.ID_Patient === selectedPat.ID_Patient);
      const activeAbn = patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && getRemainingSessions(a, dbState) > 0)
        || patientAbns.find(a => a.Etat !== 'Fermé' && !(a as any).Est_Gele)
        || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

      if (activeAbn && triggerToast) {
        triggerToast(`Abonnement ABN_#${activeAbn.ID_Abn} identifié pour ${selectedPat.Nom_Patient} (${getRemainingSessions(activeAbn, dbState)} seances restantes)`, 'info');
      }
    }
  };

  // List of filtered appointments for the selected date
  const baseDayRDVs = dbState.rendezVous.filter(r => r.Date_RDV === selectedDate);
  const displayedRDVs = baseDayRDVs.filter(r => {
    if (forceServiceId !== undefined) {
      const practitioner = dbState.praticiens.find(p => p.ID_Prat === r.ID_Prat);
      if (practitioner?.ID_Sce !== forceServiceId) return false;
      if (forceZoneId !== undefined && r.ID_Zone !== forceZoneId) return false;
      return true;
    }
    
    if (!filterByMyService) return true; // Show all to admin or when toggled off
    if (currentUser.Role === 'Admin') return true; // Admin gets everything
    
    // Filter to show only appointments matching practitioners belonging to the receptionist's assigned service
    const practitioner = dbState.praticiens.find(p => p.ID_Prat === r.ID_Prat);
    return practitioner?.ID_Sce === currentUser.ID_Sce;
  });

  // Start checkout procedure forCompleted Honoré
  const startBillingProcedure = (rdv: Rendez_Vous) => {
    const act = dbState.actes.find(a => a.ID_Acte === rdv.ID_Acte);
    setBillingRDVId(rdv.ID_RDV);
    
    // Find active first that covers the act, otherwise active, otherwise general covering
    const patientAbns = dbState.abonnements.filter(a => a.ID_Patient === rdv.ID_Patient);
    const abn = patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && isSubscriptionCoveringActe(a, rdv.ID_Acte, dbState) && getRemainingSessions(a, dbState) > 0)
      || patientAbns.find(a => a.Etat !== 'Fermé' && !(a as any).Est_Gele && isSubscriptionCoveringActe(a, rdv.ID_Acte, dbState))
      || patientAbns.find(a => isSubscriptionCoveringActe(a, rdv.ID_Acte, dbState))
      || patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && getRemainingSessions(a, dbState) > 0)
      || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

    const isCovered = (abn && act && isSubscriptionCoveringActe(abn, act.ID_Acte, dbState)) || false;

    const sessionsRemaining = abn ? getRemainingSessions(abn, dbState) : 0;
    const hasRemaining = abn ? sessionsRemaining > 0 : false;
    const isFrozen = abn ? (abn as any).Est_Gele : false;

    // Financial versement payment check
    const abnVersements = abn ? dbState.versements.filter((v: any) => v.ID_Abn === abn.ID_Abn) : [];
    const totalVerses = abnVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);

    const pack = abn ? dbState.packs.find(p => p.ID_Pack === abn.ID_Pack) : null;
    const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
    const consumedValue = abn ? (abn.Nbre_Sean_Consom_Abn * prixSeance) : 0;
    const isInsolvent = abn ? (totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses) : false;

    const isSolvent = abn && abn.Etat === 'Actif' && !isFrozen && hasRemaining && !isInsolvent;
    const isForfait = isCovered && isSolvent;

    setBillingPrice(isForfait ? 0 : (act?.Prix_Acte ?? 150));
  };

  const submitBillingProcedure = () => {
    if (billingRDVId !== null) {
      onUpdateRDVStatus(billingRDVId, 'Honoré', billingPrice);
      setBillingRDVId(null);
    }
  };

  const toggleBalneoRule = (idRegle: number) => {
    if (!onSave) return;
    const fresh = { ...dbState };
    const ruleIdx = fresh.reglesBalneo.findIndex(r => r.ID_Regle === idRegle);
    if (ruleIdx !== -1) {
      const currentGenre = fresh.reglesBalneo[ruleIdx].Genre_Autorise;
      fresh.reglesBalneo[ruleIdx] = {
        ...fresh.reglesBalneo[ruleIdx],
        Genre_Autorise: currentGenre === 'H' ? 'F' : 'H'
      };
      onSave(fresh);
      if (triggerToast) {
        triggerToast("Règle de genre mise à jour avec succès !", "success");
      }
    }
  };

  const handleSubmitNewRDV = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationMessages.errors.length > 0) return; // Prevent if blocked
    
    if (newBesoin === 'Table') {
      const tableCount = dbState.rendezVous.filter(r => 
        r.Date_RDV === selectedDate && 
        r.Besoin === 'Table'
      ).length;
      
      if (tableCount >= 8) {
        if (triggerToast) {
          triggerToast(`⚠️ Attention : Le nombre maximum de patients nécessitant une Table (8) pour cette journée est dépassé ! (Actuel: ${tableCount + 1})`, 'error');
        }
      }
    }

    onAddRDV(currentDraftRDV);
    setShowAddForm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="scheduler-section">
      {/* 1. Daily Scheduler Agenda List (Columns 1 & 2) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="font-bold text-lg text-slate-900">Agenda Quotidien du Centre</h2>
                <p className="text-slate-500 text-xs">Ajustez la date ci-dessous pour filtrer les plannings</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 p-1 px-2.5 rounded-lg text-emerald-800 text-[10px] font-black shadow-3xs mr-1">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>ÉTAT CAISSE ADULTE :</span>
                <span className="font-mono text-xs text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-100 font-extrabold">{formatCurrency(getCaisseSceAdulteBalance())}</span>
              </div>

              <label htmlFor="schedule-datepicker" className="sr-only">Choisir la date d'affichage</label>
              <input
                id="schedule-datepicker"
                type="date"
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <button
                id="btn-trigger-add-rdv"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 hover:bg-indigo-705 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition"
              >
                <Plus className="w-4.5 h-4.5" />
                Planifier
              </button>
            </div>
          </div>

          {/* Configuration des créneaux de balnéothérapie pour l'Admin / l'Assistante */}
          {forceServiceId === 2 && (currentUser.Role === 'Admin' || currentUser.Role === 'Assistante') && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4.5 space-y-3.5 mb-6" id="balneo-admin-rules-config">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2">
                <div>
                  <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5 uppercase font-sans">
                    ⚙️ Répartition des créneaux Balnéothérapie (Responsabilité Admin)
                  </h4>
                  <p className="text-slate-600 text-[10px] font-semibold">
                    Définissez la répartition en alternant le genre autorisé par demi-journée. Le validateur bloquera d'office toute mixité non conforme dans le bassin.
                  </p>
                </div>
                <span className="text-[9px] font-mono text-amber-800 bg-amber-150 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase shrink-0 w-max">Configure Admin</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }, (_, dIdx) => {
                  const dayId = dIdx + 1;
                  const dayName = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'][dIdx];
                  const matRule = dbState.reglesBalneo.find(r => r.Jour_Semaine === dayId && r.Demi_Journee === 'Matin');
                  const pmRule = dbState.reglesBalneo.find(r => r.Jour_Semaine === dayId && r.Demi_Journee === 'Apres-midi');

                  return (
                    <div key={dayId} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                      <span className="font-extrabold text-slate-800 text-[10px] font-mono block border-b pb-1 text-center bg-slate-50 rounded">
                        {dayName}
                      </span>
                      <div className="space-y-2 text-[10px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-bold font-mono">MATIN :</span>
                          {matRule ? (
                            <button
                              type="button"
                              onClick={() => toggleBalneoRule(matRule.ID_Regle)}
                              className={`px-2 py-0.5 rounded text-[9px] font-black transition cursor-pointer shrink-0 ${
                                matRule.Genre_Autorise === 'H' 
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                              title="Modifier la mixité"
                            >
                              {matRule.Genre_Autorise === 'H' ? '♂ Hommes' : '♀ Femmes'}
                            </button>
                          ) : <span className="text-slate-300">-</span>}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-bold font-mono">APREM :</span>
                          {pmRule ? (
                            <button
                              type="button"
                              onClick={() => toggleBalneoRule(pmRule.ID_Regle)}
                              className={`px-2 py-0.5 rounded text-[9px] font-black transition cursor-pointer shrink-0 ${
                                pmRule.Genre_Autorise === 'H' 
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                              title="Modifier la mixité"
                            >
                              {pmRule.Genre_Autorise === 'H' ? '♂ Hommes' : '♀ Femmes'}
                            </button>
                          ) : <span className="text-slate-300">-</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtering options based on Receptionist assigned service */}
          {currentUser.Role !== 'Admin' && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 mb-6" id="scheduler-filter-banner">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Régulateur d'accés physique actif :</span>
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
                  Filtre Service Réception
                </span>
              </div>
              <button
                id="btn-toggle-service-filter"
                onClick={() => setFilterByMyService(!filterByMyService)}
                className={`text-xs px-3 py-1 rounded-md font-bold transition ${
                  filterByMyService
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {filterByMyService ? 'Filtré sur mon service (Actif)' : 'Tout afficher'}
              </button>
            </div>
          )}

          {/* Appointments list */}
          {displayedRDVs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6" id="empty-scheduler-state">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Aucun rendez-vous sur cette date ({selectedDate})</p>
              <p className="text-slate-400 text-xs mt-1">
                {filterByMyService && currentUser.Role !== 'Admin'
                  ? 'Essayez de désactiver le filtre de service ou de planifier un nouveau patient.'
                  : 'Commencez à programmer l\'activité en cliquant sur le bouton de planification.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4" id="appointments-list-container">
              {displayedRDVs.map((rdv) => {
                const patient = dbState.patients.find(p => p.ID_Patient === rdv.ID_Patient);
                const prat = dbState.praticiens.find(p => p.ID_Prat === rdv.ID_Prat);
                const act = dbState.actes.find(a => a.ID_Acte === rdv.ID_Acte);
                const zone = dbState.zones.find(z => z.ID_Zone === rdv.ID_Zone);
                const userWhoBooked = dbState.utilisateurs.find(u => u.ID_Utilisateur === rdv.ID_Utilisateur);

                // Safe status styles definition
                let statusBadge = 'bg-sky-50 text-sky-700 border-sky-100';
                if (rdv.Statut_RDV === 'Honoré') statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-150';
                else if (rdv.Statut_RDV === 'Annulé') statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';
                else if (rdv.Statut_RDV === 'Absent') statusBadge = 'bg-rose-50 text-rose-600 border-rose-100';

                const patientAbns = dbState.abonnements.filter(a => a.ID_Patient === rdv.ID_Patient);
                const activeAbnOfRdv = patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && getRemainingSessions(a, dbState) > 0)
                  || patientAbns.find(a => a.Etat !== 'Fermé' && !(a as any).Est_Gele)
                  || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

                const getRdvAbnState = () => {
                  if (!activeAbnOfRdv) {
                    return {
                      label: "Sans Forfait",
                      badgeClass: "bg-slate-50 text-slate-500 border border-slate-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                      isWarning: false,
                      buttonLabel: "Enregistrer Séance"
                    };
                  }
                  const remaining = getRemainingSessions(activeAbnOfRdv, dbState);
                  const abnVersements = dbState.versements.filter(v => v.ID_Abn === activeAbnOfRdv.ID_Abn);
                  const totalVerses = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
                  const isClosed = activeAbnOfRdv.Etat === 'Fermé' || (activeAbnOfRdv as any).Est_Gele === true;
                  const pack = dbState.packs ? dbState.packs.find(p => p.ID_Pack === activeAbnOfRdv.ID_Pack) : null;
                  const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
                  const consumedValue = activeAbnOfRdv.Nbre_Sean_Consom_Abn * prixSeance;
                  
                  const isInsolvent = totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses;

                  if (isClosed) {
                    return {
                      label: "❄️ Forfait Gelé",
                      badgeClass: "bg-sky-50 text-sky-750 border border-sky-200 text-[10.5px] px-2 py-0.5 rounded font-black uppercase",
                      isWarning: true,
                      buttonLabel: "Réglé en Espec"
                    };
                  }
                  if (remaining <= 0) {
                    return {
                      label: "🛑 Forfait Épuisé",
                      badgeClass: "bg-rose-50 text-rose-755 border border-rose-200 text-[10.5px] px-2 py-0.5 rounded font-black uppercase",
                      isWarning: true,
                      buttonLabel: "Réglé en Espec"
                    };
                  }
                  if (isInsolvent) {
                    return {
                      label: "⚠️ Insolvable (Pas de versement)",
                      badgeClass: "bg-amber-100 text-amber-955 border border-amber-300 text-[10.5px] px-2 py-0.5 rounded font-black uppercase",
                      isWarning: true,
                      buttonLabel: "Réglé en Espec"
                    };
                  }
                  return {
                    label: "🎁 Abonnement Actif",
                    badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10.5px] px-2 py-0.5 rounded font-black uppercase",
                    isWarning: false,
                    buttonLabel: "Enregistrer Séance"
                  };
                };

                const rdvAbnState = getRdvAbnState();

                return (
                  <div
                    key={rdv.ID_RDV}
                    id={`rdv-item-${rdv.ID_RDV}`}
                    className={`group border rounded-xl p-4 hover:shadow-md transition ${
                      isRdvCancelled(rdv)
                        ? 'border-red-300 bg-red-50/25 text-red-900 opacity-60'
                        : rdvAbnState && rdvAbnState.isWarning && rdv.Statut_RDV === 'Planifié'
                          ? 'border-amber-300 bg-amber-50/10'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isRdvCancelled(rdv) 
                              ? 'bg-red-100 text-red-800 border-red-350' 
                              : statusBadge
                          }`}>
                            {isRdvCancelled(rdv) ? 'Annulé' : rdv.Statut_RDV}
                          </span>
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {rdv.H_Debut_RDV} - {rdv.H_Fin_RDV}
                          </span>
                          <span className="text-xs bg-slate-105 px-2 py-0.5 rounded text-slate-600 font-medium">
                            Zone: {zone?.Nom_Zone}
                          </span>
                          {rdv.Besoin && (
                            <span className="text-xs bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-indigo-700 font-bold">
                              Installation: {rdv.Besoin}
                            </span>
                          )}
                          {rdvAbnState && (
                            <span className={rdvAbnState.badgeClass}>
                              {rdvAbnState.label}
                            </span>
                          )}
                        </div>

                        <h3 className="text-slate-800 font-bold text-[16px] mt-2 flex items-center gap-1.5">
                          {patient?.Nom_Patient}
                          <span className="text-xs text-slate-400 font-normal">
                            ({patient?.Genre_Patient})
                          </span>
                        </h3>

                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <span className="font-semibold text-slate-800">Praticien:</span>
                          Dr. {prat?.Prenom_Prat} {prat?.Nom_Prat} 
                          <span className="text-slate-400">({prat?.Repere === 'K' ? 'Aide-Kiné' : prat?.Repere === 'P' ? 'Psychomot.' : 'Orthophoniste'})</span>
                        </p>

                        <p className="text-xs text-slate-650 mt-1">
                          <span className="font-semibold text-slate-850">Soin à dispenser :</span> {act?.Libelle_Acte} —{' '}
                          <span className="text-slate-800 font-medium font-semibold">{act?.Prix_Acte} DH</span>
                        </p>

                        {rdvAbnState && rdvAbnState.isWarning && rdv.Statut_RDV === 'Planifié' && (
                          <div className="text-rose-700 bg-rose-50 border border-rose-200 text-[11px] rounded-lg p-2.5 mt-2 font-medium">
                            ⚠️ Alerte Solvabilité : Cet abonnement présente un défaut financier ou est inactif. L'encaissement unitaire immédiat en espèces ({act?.Prix_Acte || 150} DH) est requis.
                          </div>
                        )}
                        
                        <p className="text-[10px] text-slate-400 mt-2">
                          Saisie par : {userWhoBooked?.Nom_Utilisateur || 'Inconnu'}
                        </p>
                      </div>

                      {/* Immediate Operations Action Panel */}
                      {rdv.Statut_RDV === 'Planifié' && (
                        <div className="flex items-center gap-1.5 self-end sm:self-start flex-wrap mt-2 sm:mt-0">
                          <button
                            id={`btn-complete-rdv-${rdv.ID_RDV}`}
                            onClick={() => startBillingProcedure(rdv)}
                            className={`text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition ${rdvAbnState?.isWarning ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-705 shadow-indigo-100'}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {rdvAbnState?.buttonLabel || "Enregistrer Séance"}
                          </button>
                          <button
                            id={`btn-absent-rdv-${rdv.ID_RDV}`}
                            onClick={() => onUpdateRDVStatus(rdv.ID_RDV, 'Absent')}
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                          >
                            Absent
                          </button>
                          <button
                            id={`btn-cancel-rdv-${rdv.ID_RDV}`}
                            onClick={() => onUpdateRDVStatus(rdv.ID_RDV, 'Annulé')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-1.5 rounded-lg transition"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Billing Confirmation Drawer / Dialog in-line */}
        {billingRDVId !== null && (
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl" id="billing-drawer">
            <h3 className="font-bold text-md text-slate-100 flex items-center gap-2 font-sans">
              <CheckCircle2 className="text-indigo-400 w-5 h-5" />
              Validation Réelle de Séance & Consommation d'Abonnement
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cette action enregistre définitivement la séance dans l'historique réalisé. Si un abonnement actif est trouvé, le système déduira automatiquement un crédit. Vous pouvez modifier le montant ci-dessous si des frais exceptionnels s'appliquent.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="billing-price-input" className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Prix de Séance Facturé actualisé (DH)
                </label>
                <input
                  id="billing-price-input"
                  type="number"
                  className="bg-slate-950 border border-slate-750 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white w-full"
                  value={billingPrice}
                  onChange={(e) => setBillingPrice(Number(e.target.value))}
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  id="btn-confirm-billing"
                  onClick={submitBillingProcedure}
                  className="bg-indigo-600 hover:bg-indigo-705 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex-1 transition shadow-sm shadow-indigo-200"
                >
                  Valider et Retirer du Forfait
                </button>
                <button
                  id="btn-cancel-billing"
                  onClick={() => setBillingRDVId(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold px-3 py-2.5 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Integrated New Appointment Form & Rules Monitor (Column 3) */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-[16px] text-slate-900">Nouveau Rendez-Vous</h2>
          </div>

          <form onSubmit={handleSubmitNewRDV} className="space-y-4">
            {/* 1. Patient */}
            <div>
              <label htmlFor="form-patient-select" className="block text-xs font-bold text-slate-700 mb-1">
                Patient & Genre
              </label>
              <select
                id="form-patient-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={newPatient}
                onChange={(e) => handlePatientChange(e.target.value)}
              >
                {dbState.patients
                  .filter(p => !p.type_patient?.toLowerCase().includes('imc'))
                  .map((p) => {
                    const patientAbns = dbState.abonnements.filter(a => a.ID_Patient === p.ID_Patient);
                    const sub = patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && getRemainingSessions(a, dbState) > 0)
                      || patientAbns.find(a => a.Etat !== 'Fermé' && !(a as any).Est_Gele)
                      || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

                    const subInfo = (() => {
                      if (!sub) return ' (Sans Forfait)';
                      const remaining = getRemainingSessions(sub, dbState);
                      const subVersements = dbState.versements.filter((v: any) => v.ID_Abn === sub.ID_Abn);
                      const totalVerses = subVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);
                      const isClosed = sub.Etat === 'Fermé' || (sub as any).Est_Gele === true;
                      
                      const pack = dbState.packs ? dbState.packs.find(pk => pk.ID_Pack === sub.ID_Pack) : null;
                      const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
                      const consumedValue = sub.Nbre_Sean_Consom_Abn * prixSeance;
                      const isInsolvent = totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses;

                      if (isClosed) return ' (❄️ Gelé)';
                      if (remaining <= 0) return ' (🛑 Épuisé / 0 séance)';
                      if (isInsolvent) return ' (⚠️ Insolvable - Pas de versement)';
                      return ` (🎁 Abonnement : ${remaining} rest.)`;
                    })();
                    return (
                      <option key={p.ID_Patient} value={p.ID_Patient}>
                        {p.Nom_Patient} [{p.Genre_Patient}]{subInfo}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Live Abonnement Status display card */}
            {(() => {
              const selectedPatId = Number(newPatient);
              const patientAbns = dbState.abonnements.filter(a => a.ID_Patient === selectedPatId);
              const activeAbn = patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && getRemainingSessions(a, dbState) > 0)
                || patientAbns.find(a => a.Etat !== 'Fermé' && !(a as any).Est_Gele)
                || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

              if (!activeAbn) return null;

              const pack = dbState.packs ? dbState.packs.find(pk => pk.ID_Pack === activeAbn.ID_Pack) : null;
              const remaining = getRemainingSessions(activeAbn, dbState);
              const abnVersements = dbState.versements.filter((v: any) => v.ID_Abn === activeAbn.ID_Abn);
              const totalVerses = abnVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);
              
              const isClosed = activeAbn.Etat === 'Fermé' || (activeAbn as any).Est_Gele === true;
              const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
              const consumedValue = activeAbn.Nbre_Sean_Consom_Abn * prixSeance;
              const isInsolvent = totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses;

              const displayState = (() => {
                if (isClosed) {
                  return {
                    title: '❄️ Abonnement Suspendu / Gelé',
                    colorClass: 'bg-sky-50 border-sky-200 text-sky-950',
                    desc: 'Cet abonnement a été gelé ou fermé par l\'administration.'
                  };
                }
                if (remaining <= 0) {
                  return {
                    title: '🛑 Crédit Épuisé (0 Séance)',
                    colorClass: 'bg-rose-50 border-rose-200 text-rose-950',
                    desc: 'Plus aucune séance disponible sur ce forfait.'
                  };
                }
                if (isInsolvent) {
                  return {
                    title: '⚠️ Abonnement Insolvable',
                    colorClass: 'bg-amber-50 border-amber-200 text-amber-950 animate-pulse',
                    desc: 'Solde insuffisant ou aucun versement enregistré.'
                  };
                }
                return {
                  title: '🎁 Forfait Actif & Solvable',
                  colorClass: 'bg-emerald-50 border-emerald-250 text-emerald-950',
                  desc: 'Abonnement valide avec crédit de séances disponible.'
                };
              })();

              return (
                <div className={`p-3 rounded-xl border text-[10.5px] font-sans ${displayState.colorClass}`}>
                  <div className="flex items-center gap-1.5 font-extrabold text-[11px] mb-1">
                    <span>{displayState.title}</span>
                  </div>
                  <p className="font-semibold">{pack?.Libelle_Pack || 'Abonnement de rééducation'}</p>
                  <p className="mt-0.5 text-slate-600">
                    ID : <strong className="font-mono">ABN_#0{activeAbn.ID_Abn}</strong> • Séances restantes : <strong className={`font-mono ${remaining === 0 ? 'text-red-700 font-black' : ''}`}>{remaining} / {pack?.Nbre_Seance_Pack ?? 10}</strong>
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    Règlement total : <strong className="font-mono text-indigo-700">{totalVerses} DA</strong> (Valeur conso : {consumedValue} DA)
                  </p>
                  <p className="text-[9px] text-stone-500 mt-1 italic">
                    {displayState.desc}
                  </p>
                </div>
              );
            })()}

            {/* 2. Praticien */}
            <div>
              <label htmlFor="form-prat-select" className="block text-xs font-bold text-slate-700 mb-1">
                Praticien dispensateur
              </label>
              <select
                id="form-prat-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={newPrat}
                onChange={(e) => handlePratChange(e.target.value)}
              >
                {dbState.praticiens
                  .filter(p => forceServiceId === undefined || p.ID_Sce === forceServiceId)
                  .map((p) => {
                    const service = dbState.services.find(s => s.ID_Sce === p.ID_Sce);
                    const specialty = p.Repere === 'K' ? 'Kinésithérapeute' : p.Repere === 'P' ? 'Psychomotricien/Psy' : 'Orthophoniste';
                    return (
                      <option key={p.ID_Prat} value={p.ID_Prat}>
                        Dr. {p.Prenom_Prat} {p.Nom_Prat} ({specialty} - {service?.Libelle_Sce})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* 3. Acte */}
            <div>
              <label htmlFor="form-acte-select" className="block text-xs font-bold text-slate-700 mb-1">
                Acte / Soin médical (Anti-typo)
              </label>
              <select
                id="form-acte-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={newActe}
                onChange={(e) => setNewActe(e.target.value)}
              >
                {(() => {
                  const filteredList = getFilteredActesForRole(dbState.actes, currentUser?.Role || 'Admin');
                  
                  // If current selected acte is not in the filtered list, ensure we still prepend or append it to avoid empty value
                  const isCurrentInList = filteredList.some(a => a.ID_Acte === Number(newActe));
                  const finalDisplayList = [...filteredList];
                  if (!isCurrentInList) {
                    const foundSelectedInDbObj = dbState.actes.find(a => a.ID_Acte === Number(newActe));
                    if (foundSelectedInDbObj) {
                      finalDisplayList.unshift(foundSelectedInDbObj);
                    }
                  }
                  
                  return finalDisplayList.map((a) => (
                    <option key={a.ID_Acte} value={a.ID_Acte}>
                      {a.Libelle_Acte} ({a.Prix_Acte} DA)
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Besoin d'installation (Table / Chaise) */}
            <div>
              <label htmlFor="form-besoin-select" className="block text-xs font-bold text-slate-700 mb-1">
                Besoin d'installation (Table / Chaise)
              </label>
              <select
                id="form-besoin-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                value={newBesoin}
                onChange={(e) => setNewBesoin(e.target.value)}
              >
                <option value="Table">Table</option>
                <option value="Chaise">Chaise</option>
              </select>
            </div>

            {/* 4. Type de planning */}
            <div>
              <label htmlFor="form-plan-select" className="block text-xs font-bold text-slate-700 mb-1">
                Famille de Planning (Surcharge rule trigger)
              </label>
              <select
                id="form-plan-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={newPlanType}
                onChange={(e) => setNewPlanType(e.target.value)}
              >
                {dbState.typesPlanning.map((t) => (
                  <option key={t.ID_Type_Plan} value={t.ID_Type_Plan}>
                    {t.Libelle_Type} (Max: {t.Max_Patients_Simultanes} patient(s))
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Zone physique */}
            <div>
              <label htmlFor="form-zone-select" className="block text-xs font-bold text-slate-700 mb-1">
                Zone / Salle d'affectation
              </label>
              <select
                id="form-zone-select"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
              >
                {dbState.zones.map((z) => (
                  <option key={z.ID_Zone} value={z.ID_Zone}>
                    {z.Nom_Zone}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Horaires */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label id="label-time-start" htmlFor="form-time-start" className="block text-xs font-bold text-slate-700 mb-1">
                  Début (hh:mm)
                </label>
                <input
                  id="form-time-start"
                  aria-labelledby="label-time-start"
                  type="time"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  value={newTimeStart}
                  onChange={(e) => setNewTimeStart(e.target.value)}
                />
              </div>
              <div>
                <label id="label-time-end" htmlFor="form-time-end" className="block text-xs font-bold text-slate-700 mb-1">
                  Fin (hh:mm)
                </label>
                <input
                  id="form-time-end"
                  aria-labelledby="label-time-end"
                  type="time"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  value={newTimeEnd}
                  onChange={(e) => setNewTimeEnd(e.target.value)}
                />
              </div>
            </div>

            {/* LIVE SAFETY FEEDBACK REGULATION PANEL */}
            <div className="bg-slate-55 border border-slate-200 rounded-xl p-3 space-y-2 text-xs" id="scheduler-live-rules-checker">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                Vérificateur anti-bug en temps réel :
              </span>
              
              {/* Blocks/Errors */}
              {validationMessages.errors.map((err, idx) => (
                <div key={idx} className="flex gap-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-100 p-2 rounded-lg">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
                  <p>{err}</p>
                </div>
              ))}

              {/* Warnings */}
              {validationMessages.warnings.map((warn, idx) => (
                <div key={idx} className="flex gap-1.5 text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-55" />
                  <p>{warn}</p>
                </div>
              ))}

              {/* Informational positive validations */}
              {validationMessages.info.map((inf, idx) => (
                <div key={idx} className="flex gap-1.5 text-indigo-800 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" />
                  <p>{inf}</p>
                </div>
              ))}

              {validationMessages.errors.length === 0 &&
               validationMessages.warnings.length === 0 &&
               validationMessages.info.length === 0 && (
                <p className="text-slate-400 italic">Renseignez les champs pour lancer les contrôles automatiques.</p>
              )}
            </div>

            <button
              id="btn-confirm-planning-submit"
              type="submit"
              disabled={validationMessages.errors.length > 0}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
                validationMessages.errors.length > 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-755 text-white shadow-sm shadow-indigo-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Confirmer la Planification
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
