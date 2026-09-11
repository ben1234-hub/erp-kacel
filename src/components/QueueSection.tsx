/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Check, AlertOctagon, UserPlus, Play, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, Monitor, Sparkles, TrendingUp, DollarSign, RefreshCw, X, Search, Zap, Scissors, Award, Heart,
  Trash2, Printer, CreditCard, Receipt, Calendar, Activity, Plus, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DatabaseState, FileAttente, Facture, Patient, Praticien, Rendez_Vous, Acte, getFilteredActesForRole
} from '../dbStore';
import { hasPermission, getPermissions } from '../utils/permissions';
import { DepenseManager } from './DepenseManager';

interface QueueSectionProps {
  dbState: DatabaseState;
  currentUser: any;
  selectedDate: string;
  onSave: (state: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onSelectPatientInQueue?: (patientId: number) => void;
  forceOpenInsertionModal?: boolean;
  onCloseInsertionModal?: () => void;
}

// Helpers to calculate time differences in minutes
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// 🔧 CORRECTION CRITIQUE : clone profond pour forcer React à détecter le changement immédiatement
const cloneState = (source: DatabaseState): DatabaseState => {
  const copy = { ...source } as any;
  const arrayKeys = [
    'fileAttente', 'fileAttenteIMC', 'patients', 'praticiens', 'rendezVous',
    'abonnements', 'factures', 'actes', 'packs', 'plages_horaires',
    'versements', 'seances', 'consultations', 'utilisateurs', 'transactions_caisses', 'caisses'
  ];
  arrayKeys.forEach((key) => {
    if (Array.isArray((source as any)[key])) {
      copy[key] = [...(source as any)[key]];
    }
  });
  copy.transactions_caisses = source.transactions_caisses ? [...source.transactions_caisses] : [];
  return copy as DatabaseState;
};

export const QueueSection: React.FC<QueueSectionProps> = ({
  dbState,
  currentUser,
  selectedDate,
  onSave,
  triggerToast,
  onSelectPatientInQueue,
  forceOpenInsertionModal,
  onCloseInsertionModal
}) => {
  // Simulator clock
  const [simClock, setSimClock] = useState<string>(() => {
    const d = new Date();
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  });

  // Date range picker states
  const [dateDebut, setDateDebut] = useState<string>(selectedDate);
  const [dateFin, setDateFin] = useState<string>(selectedDate);

  // Sync with outer selectedDate when it changes from main workspace
  useEffect(() => {
    setDateDebut(selectedDate);
    setDateFin(selectedDate);
  }, [selectedDate]);

  // Subsections inside waitlist dashboard
  const [activeSubView, setActiveSubView] = useState<'queue_table' | 'doctor_calls' | 'stats_dashboard'>('queue_table');

  // Selected doctor in doctor panel
  const [selectedDrId, setSelectedDrId] = useState<number>(() => {
    const mprDoc = dbState.praticiens.find(p => p.Repere === 'MPR');
    return mprDoc ? mprDoc.ID_Prat : (dbState.praticiens[0]?.ID_Prat ?? 1);
  });

  // States for block alarms and invoice payment dialog
  const [blockedPatient, setBlockedPatient] = useState<{ patient: Patient; invoice: Facture; rdvId: number | null } | null>(null);

  // Audio/Visual simulation call announcement state
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = useState<{ ticket: string; doctorName: string } | null>(null);

  // --- NOUVELLE INSERTION Form modal states ---
  const [showInsertionModal, setShowInsertionModal] = useState(false);
  const [showDepenses, setShowDepenses] = useState(false);

  useEffect(() => {
    if (forceOpenInsertionModal) {
      setShowInsertionModal(true);
    }
  }, [forceOpenInsertionModal]);

  const handleCloseInsertionModal = () => {
    setShowInsertionModal(false);
    setInsertSearch('');
    setInsertSelectedPatientId(null);
    setInsertNote('');
    setInsertIsRegle(false);
    onCloseInsertionModal?.();
  };

  const [insertSearch, setInsertSearch] = useState('');
  const [insertSelectedPatientId, setInsertSelectedPatientId] = useState<number | null>(null);
  const [activeInsertRowIndex, setActiveInsertRowIndex] = useState(-1);
  const [insertNote, setInsertNote] = useState('');
  const [insertIsRegle, setInsertIsRegle] = useState(false);
  
  const rdcActes = useMemo(() => {
    return getFilteredActesForRole(dbState.actes, 'Receptionniste RDC');
  }, [dbState.actes]);

  const [insertTypeConsultation, setInsertTypeConsultation] = useState<string>('Consultation Adulte');
  const [insertPrixConsultation, setInsertPrixConsultation] = useState<number>(200);

  // Track patient subscription status dynamically
  const patientSubStatus = useMemo(() => {
    if (!insertSelectedPatientId) return { active: false, label: "Sélectionnez un patient" };
    
    // Find active subscriptions
    const activeSubs = (dbState.abonnements || []).filter(
      abn => abn.ID_Patient === insertSelectedPatientId && abn.Etat === 'Actif'
    );
    
    if (activeSubs.length === 0) {
      return { active: false, label: "Hors Abonnement (Aucun abonnement actif)" };
    }
    
    for (const abn of activeSubs) {
      const pack = dbState.packs.find(p => p.ID_Pack === abn.ID_Pack);
      
      const ts = (insertTypeConsultation || '').toLowerCase().trim();
      let targetActeId = 0;
      if (ts.includes('psychomot') || ts.includes('psycho')) targetActeId = 3;
      else if (ts.includes('ortho')) targetActeId = 4;
      else if (ts.includes('ergo')) targetActeId = 5;
      else if (ts.includes('consultation')) targetActeId = 0;
      
      const isAdditiveCovered = abn.ID_Acte_Add1 === targetActeId || abn.ID_Acte_Add2 === targetActeId;
      const isMultidisciplinaire = pack?.ID_Pack === 3 || pack?.Cat_Pack === 'I'; // Multidisciplinaire Intensif
      
      const totalSessions = pack?.Nbre_Seance_Pack || 0;
      const consumed = abn.Nbre_Sean_Consom_Abn || 0;
      const remaining = totalSessions - consumed;
      
      if (targetActeId === 0) {
        if (isMultidisciplinaire) {
          return { 
            active: true, 
            label: `Inclus dans Forfait Multidisciplinaire (Séances: ${consumed}/${totalSessions})`, 
            remaining, 
            abn 
          };
        }
      } else {
        if (isAdditiveCovered || (isMultidisciplinaire && (targetActeId === 3 || targetActeId === 4 || targetActeId === 5))) {
          return { 
            active: true, 
            label: `Couvert par ${pack?.Libelle_Pack || 'Forfait'} (Séances: ${consumed}/${totalSessions})`, 
            remaining, 
            abn 
          };
        }
      }
    }
    
    return { active: false, label: "Hors Abonnement (Non couvert par le forfait actif)" };
  }, [insertSelectedPatientId, insertTypeConsultation, dbState.abonnements, dbState.packs]);

  const lastPatientIdRef = React.useRef<number | null>(null);
  const lastTypeSoinRef = React.useRef<string>('');

  // Synchronize care type and price upon selection changes
  useEffect(() => {
    if (insertSelectedPatientId === null) {
      lastPatientIdRef.current = null;
      lastTypeSoinRef.current = '';
      return;
    }

    const patientChanged = lastPatientIdRef.current !== insertSelectedPatientId;
    const careTypeChanged = lastTypeSoinRef.current !== insertTypeConsultation;

    if (patientChanged || careTypeChanged) {
      let currentType = insertTypeConsultation;
      if (patientChanged && rdcActes.length > 0 && !rdcActes.some(a => a.Libelle_Acte === insertTypeConsultation)) {
        currentType = rdcActes[0].Libelle_Acte;
        setInsertTypeConsultation(currentType);
      }

      const matched = rdcActes.find(a => a.Libelle_Acte === currentType);
      if (matched) {
        setInsertPrixConsultation(matched.Prix_Acte);
      }

      lastPatientIdRef.current = insertSelectedPatientId;
      lastTypeSoinRef.current = currentType;
    }
  }, [insertSelectedPatientId, insertTypeConsultation, rdcActes]);

  const [insertDrId, setInsertDrId] = useState<number>(() => {
    const mprDoc = dbState.praticiens.find(p => p.Repere === 'MPR');
    return mprDoc ? mprDoc.ID_Prat : (dbState.praticiens[0]?.ID_Prat ?? 1);
  });

  const [printingTicketData, setPrintingTicketData] = useState<{
    ticketNum: string;
    patientName: string;
    date: string;
    hour: string;
    type: string;
    price: number;
    drName: string;
  } | null>(null);

  // Re-enable automatic print trigger
  useEffect(() => {
    if (printingTicketData) {
      const timer = setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (err) {
          console.error("Auto-print failed:", err);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [printingTicketData]);

  // Queue row selection state
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);

  const handleDeleteQueueEntry = (id: number) => {
    if (currentUser?.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'est pas autorisé à modifier la file d'attente.", "error");
      return;
    }
    const fresh = cloneState(dbState);
    fresh.fileAttente = fresh.fileAttente.filter(q => q.ID_File !== id);
    onSave(fresh);
    setSelectedQueueIds(prev => prev.filter(x => x !== id));
    triggerToast("Patient retiré de la file d'attente avec succès.", "success");
  };

  const handleDeleteQueueEntries = (ids: number[]) => {
    if (currentUser?.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'est pas autorisé à modifier la file d'attente.", "error");
      return;
    }
    const fresh = cloneState(dbState);
    fresh.fileAttente = fresh.fileAttente.filter(q => !ids.includes(q.ID_File));
    onSave(fresh);
    setSelectedQueueIds(prev => prev.filter(x => !ids.includes(x)));
    triggerToast("Les patients sélectionnés ont été retirés de la file d'attente.", "success");
  };

  // Map of patients for O(1) lookups
  const patientsMap = React.useMemo(() => {
    const map = new Map<number, any>();
    if (dbState.patients) {
      dbState.patients.forEach(p => {
        map.set(Number(p.ID_Patient), p);
      });
    }
    return map;
  }, [dbState.patients]);

  // Map of acts for color/icon selection
  const actColorsAndIcons = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('consultation')) {
      return {
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        iconBg: 'bg-indigo-200 text-indigo-800',
        icon: <Heart className="w-4 h-4" />
      };
    } else if (n.includes('bilan')) {
      return {
        bg: 'bg-purple-50 border-purple-200 text-purple-700',
        iconBg: 'bg-purple-200 text-purple-800',
        icon: <Award className="w-4 h-4" />
      };
    } else if (n.includes('rééducation') || n.includes('reeducation')) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        iconBg: 'bg-emerald-200 text-emerald-800',
        icon: <Sparkles className="w-4 h-4" />
      };
    } else {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        iconBg: 'bg-amber-200 text-amber-800',
        icon: <Activity className="w-4 h-4" />
      };
    }
  };

  // Filter queue entries based on active date range and RDC receptionist rules
  const todayQueue = React.useMemo(() => {
    return dbState.fileAttente.filter(q => {
      // Filter by period [dateDebut, dateFin]
      if (q.Date_File < dateDebut || q.Date_File > dateFin) return false;

      // Receptionniste RDC can only manage Adulte and Enfant patients in the MPR queue
      if (currentUser?.Role === 'Receptionniste RDC' || currentUser?.Role === 'SupperRec' || currentUser?.Role === 'Super Receptionniste' || currentUser?.Role === 'Super Réceptionniste') {
        const p = patientsMap.get(Number(q.ID_Patient));
        if (!p) return false;
        return p.type_patient === 'Adulte' || p.type_patient === 'Enfant';
      }
      return true;
    });
  }, [dbState.fileAttente, dateDebut, dateFin, currentUser?.Role, patientsMap]);

  // List of medical acts having Receptionniste_Autorises === 'RDC' or 'receptionniste rdc'
  const mprActes = useMemo(() => {
    return (dbState.actes || []).filter(a => {
      if (!a.Receptionniste_Autorises) return false;
      return a.Receptionniste_Autorises.some(aut => {
        const autLower = aut.toLowerCase().trim();
        return autLower === 'rdc' || autLower === 'receptionniste rdc';
      });
    });
  }, [dbState.actes]);

  // 1. Average wait time (Time between arrival & call) on the selected date interval
  const calledOrDone = todayQueue.filter(q => q.Heure_Appel !== null);
  const totalWaitMinutes = calledOrDone.reduce((acc, current) => {
    const arrival = timeToMinutes(current.Heure_Arrivee);
    const call = timeToMinutes(current.Heure_Appel!);
    return acc + Math.max(0, call - arrival);
  }, 0);
  const avgWaitTime = calledOrDone.length > 0 ? Math.round(totalWaitMinutes / calledOrDone.length) : 0;

  // 2. Average consult duration (Time between call & cloture) on the selected date interval
  const finishedConsults = todayQueue.filter(q => q.Heure_Cloture !== null && q.Heure_Appel !== null);
  const totalConsultMinutes = finishedConsults.reduce((acc, current) => {
    const call = timeToMinutes(current.Heure_Appel!);
    const end = timeToMinutes(current.Heure_Cloture!);
    return acc + Math.max(0, end - call);
  }, 0);
  const avgConsultDuration = finishedConsults.length > 0 ? Math.round(totalConsultMinutes / finishedConsults.length) : 0;

  // 3. Peak distribution
  const peakDistribution = {
    'Matin (08h - 12h)': todayQueue.filter(q => timeToMinutes(q.Heure_Arrivee) < 720).length,
    'Après-midi (12h - 18h)': todayQueue.filter(q => timeToMinutes(q.Heure_Arrivee) >= 720).length
  };

  // Banners totals
  const mprRegle = todayQueue
    .filter(q => q.Regle === true && q.Statut_Attente === 'Terminé')
    .reduce((sum, q) => sum + (q.Prix_Consultation ?? 200), 0);

  // Calcul des dépenses validées pour la caisse RDC sur la période sélectionnée
  const totalDepensesRDC = (dbState.depenses || [])
    .filter((d: any) => d.id_service === 6 && d.statut === 'Validée' && d.date_depense >= dateDebut && d.date_depense <= dateFin)
    .reduce((sum: number, d: any) => sum + d.montant, 0);
  const soldeNetRDC = mprRegle - totalDepensesRDC;
  const mprNonRegle = todayQueue
    .filter(q => !q.Regle)
    .reduce((sum, q) => sum + (q.Prix_Consultation ?? 200), 0);
  const countAttente = todayQueue.filter(q => q.Statut_Attente === 'En Attente').length;
  const countConsultation = todayQueue.filter(q => q.Statut_Attente === 'En Consultation').length;
  const countRealisees = todayQueue.filter(q => q.Statut_Attente === 'Terminé').length;

  // --- Actions ---
  const handleValidateArrival = (
    patientId: number, 
    rdvId: number | null, 
    doctorId: number,
    typeConsultation?: string,
    prixConsultation?: number,
    regle?: boolean,
    note?: string
  ) => {
    if (currentUser?.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'est pas autorisé à modifier la file d'attente.", "error");
      return;
    }

    if (prixConsultation !== undefined && prixConsultation <= 0) {
      triggerToast("Le prix doit être supérieur à 0 DA. Les actes MPR ne sont jamais gratuits.", "error");
      return;
    }

    const patientObj = patientsMap.get(Number(patientId));
    if (!patientObj) return;

    // Check outstanding unpaid invoices (Validée)
    const unpaidInvoice = dbState.factures.find(f => f.ID_Patient === patientId && f.Statut === 'Validée');
    if (unpaidInvoice) {
      setBlockedPatient({
        patient: patientObj,
        invoice: unpaidInvoice,
        rdvId: rdvId
      });
      triggerToast(`BLOCAGE : Le patient ${patientObj.Nom_Patient} possède une facture impayée de ${unpaidInvoice.Montant} DA.`, 'error');
      return;
    }

    processQueueAddition(patientId, rdvId, doctorId, typeConsultation, prixConsultation, regle, note);
  };

  const processQueueAddition = (
    patientId: number, 
    rdvId: number | null, 
    doctorId: number,
    typeConsultation?: string,
    prixConsultation?: number,
    regle?: boolean,
    note?: string
  ) => {
    if (prixConsultation !== undefined && prixConsultation <= 0) {
      triggerToast("Le prix doit être supérieur à 0 DA. Les actes MPR ne sont jamais gratuits.", "error");
      return;
    }

    const fresh = cloneState(dbState);
    const targetType = typeConsultation || 'Consultation Adulte';
    
    // Anti-doublon check: un patient ne peut pas être ajouté deux fois pour le même acte durant la même journée (selectedDate)
    const alreadyProcessed = fresh.fileAttente.some(
      q => q.Date_File === selectedDate && q.ID_Patient === patientId && q.Type_Consultation === targetType
    );

    if (alreadyProcessed) {
      const patientName = patientsMap.get(Number(patientId))?.Nom_Patient || '';
      triggerToast(`Le patient ${patientName} est déjà présent dans la file d'attente pour l'acte "${targetType}" aujourd'hui.`, 'error');
      return;
    }

    const nextId = fresh.fileAttente.length > 0 ? Math.max(...fresh.fileAttente.map(q => q.ID_File)) + 1 : 1;
    
    // Generate chronological ticket number
    const todayCount = fresh.fileAttente.filter(q => q.Date_File === selectedDate).length + 1;
    const ticketNum = `F-MPR-${todayCount.toString().padStart(3, '0')}`;

    const newQueueEntry: FileAttente = {
      ID_File: nextId,
      ID_Patient: patientId,
      ID_RDV: rdvId,
      ID_Prat: doctorId,
      Num_Ticket: ticketNum,
      Heure_Arrivee: simClock,
      Heure_Appel: null,
      Heure_Cloture: null,
      Statut_Attente: 'En Attente',
      Date_File: selectedDate, // Always today's date for new insertions
      Regle: regle ?? false,
      Type_Consultation: targetType,
      Prix_Consultation: prixConsultation ?? 200,
      Note: note?.trim() || undefined,
      updatedAt: Date.now()
    };

    fresh.fileAttente.push(newQueueEntry);

    // If marked as paid, record in central transactions_caisses
    if (regle) {
      if (!fresh.transactions_caisses) {
        fresh.transactions_caisses = [];
      }
      const nextTransId = fresh.transactions_caisses.length > 0 
        ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
        : 1;

      const patientName = patientsMap.get(Number(patientId))?.Nom_Patient || 'Patient Indéfini';

      fresh.transactions_caisses.push({
        ID_Trans: nextTransId,
        Caisse: 'Caisse RDC',
        Type: 'Recette',
        Montant: prixConsultation ?? 200,
        Libelle: `Règlement Ticket ${ticketNum} (${targetType})`,
        ModePaiement: 'Espèces',
        Date_Trans: selectedDate,
        Patient_Nom: patientName,
        ID_Acte: undefined,
        ID_RDV: rdvId || undefined,
        updatedAt: Date.now()
      });
    }

    // Mark original appointment to 'Honoré'
    if (rdvId !== null) {
      const idx = fresh.rendezVous.findIndex(r => r.ID_RDV === rdvId);
      if (idx !== -1) {
        fresh.rendezVous[idx] = { ...fresh.rendezVous[idx], Statut_RDV: 'Honoré', updatedAt: Date.now() };
      }
    }

    onSave(fresh);
    triggerToast(`Ticket ${ticketNum} attribué avec succès à ${patientsMap.get(Number(patientId))?.Nom_Patient}!`, 'success');
  };

  const handlePayImpaye = () => {
    if (!blockedPatient) return;
    const fresh = cloneState(dbState);

    const invoiceIdx = fresh.factures.findIndex(f => f.ID_Facture === blockedPatient.invoice.ID_Facture);
    if (invoiceIdx !== -1) {
      fresh.factures[invoiceIdx] = {
        ...fresh.factures[invoiceIdx],
        Statut: 'Payée',
        updatedAt: Date.now()
      };
    }

    onSave(fresh);
    const patId = blockedPatient.patient.ID_Patient;
    const rId = blockedPatient.rdvId;

    let docId = dbState.praticiens.find(p => p.Repere === 'MPR')?.ID_Prat ?? (dbState.praticiens[0]?.ID_Prat ?? 1);
    if (rId !== null) {
      const targetRDV = dbState.rendezVous.find(r => r.ID_RDV === rId);
      if (targetRDV) docId = targetRDV.ID_Prat;
    }

    setBlockedPatient(null);
    triggerToast(`Paiement de la facture validé avec succès.`, 'success');

    // Add to queue
    processQueueAddition(patId, rId, docId);
  };

  // Submit "+ Nouvelle Insertion" process modal form
  const handleAddNewInsertion = (isReceipt: boolean) => {
    if (!insertSelectedPatientId) {
      triggerToast('Veuillez sélectionner un patient dans la grille.', 'error');
      return;
    }

    const patientObj = patientsMap.get(Number(insertSelectedPatientId));
    if (!patientObj) return;

    const doctorObj = dbState.praticiens.find(p => p.ID_Prat === insertDrId);
    const drName = doctorObj ? `Dr. ${doctorObj.Nom_Prat}` : 'Médecin Indéfini';

    // Generate chronological ticket number
    const todayCount = dbState.fileAttente.filter(q => q.Date_File === selectedDate).length + 1;
    const ticketNum = `F-MPR-${todayCount.toString().padStart(3, '0')}`;

    // Attempt to add
    handleValidateArrival(
      insertSelectedPatientId, 
      null, 
      insertDrId,
      insertTypeConsultation,
      insertPrixConsultation,
      insertIsRegle,
      insertNote
    );

    // If print receipt was selected
    if (isReceipt) {
      setPrintingTicketData({
        ticketNum,
        patientName: patientObj.Nom_Patient,
        date: selectedDate, // always today's date
        hour: simClock,
        type: insertTypeConsultation,
        price: insertPrixConsultation,
        drName
      });
      triggerToast(`Reçu préparé pour Ticket ${ticketNum}. Lancement de l'impression...`, "success");
    }

    handleCloseInsertionModal();
  };

  const handleValidatePayment = (idFile: number) => {
    const fresh = cloneState(dbState);
    const idx = fresh.fileAttente.findIndex(q => q.ID_File === idFile);
    if (idx !== -1) {
      const q = fresh.fileAttente[idx];
      fresh.fileAttente[idx] = {
        ...q,
        Regle: true,
        updatedAt: Date.now()
      };

      // Extract all needed data to show a gorgeous on-screen print preview
      const patient = patientsMap.get(Number(q.ID_Patient));
      const prat = dbState.praticiens.find(p => p.ID_Prat === q.ID_Prat);
      const drName = prat ? `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}` : 'Médecin Indéfini';
      const patientName = patient ? patient.Nom_Patient : 'Patient Indéfini';

      // Log transaction under Caisse RDC (MPR)
      if (!fresh.transactions_caisses) {
        fresh.transactions_caisses = [];
      }
      const nextTransId = fresh.transactions_caisses.length > 0 
        ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
        : 1;

      fresh.transactions_caisses.push({
        ID_Trans: nextTransId,
        Caisse: 'Caisse RDC',
        Type: 'Recette',
        Montant: q.Prix_Consultation ?? 200,
        Libelle: `Règlement Ticket ${q.Num_Ticket} (${q.Type_Consultation || 'Consultation'})`,
        ModePaiement: 'Espèces',
        Date_Trans: q.Date_File,
        Patient_Nom: patientName,
        ID_Acte: undefined,
        ID_RDV: q.ID_RDV || undefined,
        updatedAt: Date.now()
      });

      onSave(fresh);

      setPrintingTicketData({
        ticketNum: q.Num_Ticket,
        patientName: patientName,
        date: q.Date_File,
        hour: q.Heure_Arrivee || simClock,
        type: q.Type_Consultation || (patient?.type_patient === 'Enfant' ? 'Consultation Enfant' : 'Consultation Adulte'),
        price: q.Prix_Consultation ?? 200,
        drName: drName
      });

      triggerToast("Règlement validé avec succès. Aperçu avant impression du ticket généré !", "success");
    }
  };

  const handleUpdateTypeConsultation = (idFile: number, newType: string) => {
    const fresh = cloneState(dbState);
    const idx = fresh.fileAttente.findIndex(q => q.ID_File === idFile);
    if (idx !== -1) {
      // Direct price synchronization using db actes where available
      const matchingAct = fresh.actes.find(a => a.Libelle_Acte === newType);
      let newPrice = matchingAct ? matchingAct.Prix_Acte : 150;
      if (!matchingAct) {
        if (newType === 'Consultation Adulte' || newType === 'Consultation Enfant') {
          newPrice = 200;
        } else if (newType === 'Consultation MPR Adulte' || newType === 'Consultation MPR Enfant') {
          newPrice = 2500;
        }
      }
      fresh.fileAttente[idx] = {
        ...fresh.fileAttente[idx],
        Type_Consultation: newType,
        Prix_Consultation: newPrice,
        updatedAt: Date.now()
      };
      onSave(fresh);
      triggerToast(`Type de consultation mis à jour : ${newType} (${newPrice} DA).`, "info");
    }
  };

  // Doctor list from dbState.utilisateurs filtered by Role containing 'Medecin' / 'Médecin' + dbState.praticiens
  const doctorOptions = useMemo(() => {
    const list: { id: number; name: string }[] = [];

    (dbState.utilisateurs || []).forEach(u => {
      const roleLower = (u.Role || '').toLowerCase();
      if (roleLower.includes('medecin') || roleLower.includes('médecin')) {
        const name = u.Nom_Utilisateur.startsWith('Dr.') ? u.Nom_Utilisateur : `Dr. ${u.Nom_Utilisateur}`;
        list.push({ id: u.ID_Utilisateur, name });
      }
    });

    (dbState.praticiens || []).forEach(p => {
      if (!list.some(d => d.id === p.ID_Prat)) {
        list.push({ id: p.ID_Prat, name: `Dr. ${p.Prenom_Prat} ${p.Nom_Prat}` });
      }
    });

    return list;
  }, [dbState.utilisateurs, dbState.praticiens]);

  const handleUpdateDoctor = (idFile: number, newDoctorId: number) => {
    const fresh = cloneState(dbState);
    const idx = fresh.fileAttente.findIndex(q => q.ID_File === idFile);
    if (idx !== -1) {
      fresh.fileAttente[idx] = {
        ...fresh.fileAttente[idx],
        ID_Prat: newDoctorId,
        updatedAt: Date.now()
      };
      onSave(fresh);
      const docObj = (fresh.utilisateurs || []).find((u: any) => u.ID_Utilisateur === newDoctorId)
        || (fresh.praticiens || []).find((p: any) => p.ID_Prat === newDoctorId);
      const docName = docObj
        ? ('Nom_Utilisateur' in docObj ? docObj.Nom_Utilisateur : `Dr. ${docObj.Prenom_Prat} ${docObj.Nom_Prat}`)
        : `Médecin #${newDoctorId}`;
      triggerToast(`Médecin affecté mis à jour : ${docName}.`, "info");
    }
  };

  // Doctor calling next patient
  const handleCallPatient = (queueEntryId: number) => {
    const fresh = cloneState(dbState);
    const qIdx = fresh.fileAttente.findIndex(q => q.ID_File === queueEntryId);
    if (qIdx === -1) return;

    const currentEntry = fresh.fileAttente[qIdx];
    const targetPrat = dbState.praticiens.find(p => p.ID_Prat === currentEntry.ID_Prat);

    // Permission check: 'Médecin MPR' role can call their own patients only
    if (currentUser?.Role === 'Médecin MPR') {
      if (!targetPrat || targetPrat.Repere !== 'MPR') {
        triggerToast("Le médecin MPR n'est autorisé qu'à appeler ses propres patients (praticien MPR).", "error");
        return;
      }
    }

    const activeConsult = todayQueue.find(q => q.Statut_Attente === 'En Consultation');
    if (activeConsult) {
      const p = patientsMap.get(Number(activeConsult.ID_Patient));
      triggerToast(`Impossible de lancer cette consultation. Le ticket ${activeConsult.Num_Ticket} (${p?.Nom_Patient || ''}) est déjà en cours.`, 'error');
      return;
    }

    fresh.fileAttente[qIdx] = {
      ...currentEntry,
      Statut_Attente: 'En Consultation',
      Heure_Appel: simClock,
      updatedAt: Date.now()
    };

    onSave(fresh);

    const pat = patientsMap.get(Number(currentEntry.ID_Patient));
    const dr = dbState.praticiens.find(d => d.ID_Prat === currentEntry.ID_Prat);
    
    setLastAnnouncedTicket({
      ticket: currentEntry.Num_Ticket,
      doctorName: dr ? `Dr. ${dr.Prenom_Prat} ${dr.Nom_Prat}` : 'Médecin'
    });

    triggerToast(`Appel lancé pour le Ticket ${currentEntry.Num_Ticket} (${pat?.Nom_Patient}).`, 'success');
  };

  // Doctor completing/closing the treatment
  const handleCloseConsultation = (queueEntryId: number) => {
    const fresh = cloneState(dbState);
    const qIdx = fresh.fileAttente.findIndex(q => q.ID_File === queueEntryId);
    if (qIdx === -1) return;

    const currentEntry = fresh.fileAttente[qIdx];
    const targetPrat = dbState.praticiens.find(p => p.ID_Prat === currentEntry.ID_Prat);

    // Permission check: 'Médecin MPR' role can close their own patients only
    if (currentUser?.Role === 'Médecin MPR') {
      if (!targetPrat || targetPrat.Repere !== 'MPR') {
        triggerToast("Le médecin MPR n'est autorisé qu'à clôturer ses propres patients (praticien MPR).", "error");
        return;
      }
    }

    // Close in queue
    fresh.fileAttente[qIdx] = {
      ...currentEntry,
      Statut_Attente: 'Terminé',
      Heure_Cloture: simClock,
      updatedAt: Date.now()
    };

    // --- ENREGISTRER LA CONSULTATION DANS L'HISTORIQUE CLINIQUE ---
    if (!fresh.consultations) {
      fresh.consultations = [];
    }
    const nextConsultId = fresh.consultations.length > 0 
      ? Math.max(...fresh.consultations.map(c => c.id)) + 1 
      : 1;

    const drObj = fresh.praticiens.find(p => p.ID_Prat === currentEntry.ID_Prat);
    const drName = drObj ? `${drObj.Nom_Prat} ${drObj.Prenom_Prat}` : "Médecin MPR";

    fresh.consultations.push({
      id: nextConsultId,
      patient_id: currentEntry.ID_Patient,
      date_consultation: currentEntry.Date_File,
      medecin_mpr_nom: drName,
      marche_sans_aide_technique: true,
      anteversion_bassin: false,
      commentaires: `Consultation de type ${currentEntry.Type_Consultation || 'Soin clinique'} terminée depuis la file d'attente.`,
      updatedAt: Date.now()
    });

    // --- DECREMENT SESSIONS FROM VALID SUBSCRIPTION (DEPRECATED: cash only) ---
    // Rule: valid subscriptions are no longer decremented; all acts are cash-only.

    onSave(fresh);
    triggerToast(`Consultation clôturée avec succès. Enregistrée dans l'historique de soins.`, 'success');
  };

  const handleSuspendPatient = (queueEntryId: number) => {
    if (currentUser?.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'est pas autorisé à suspendre de consultations.", "error");
      return;
    }
    const fresh = cloneState(dbState);
    const qIdx = fresh.fileAttente.findIndex(q => q.ID_File === queueEntryId);
    if (qIdx === -1) return;

    fresh.fileAttente[qIdx] = {
      ...fresh.fileAttente[qIdx],
      Statut_Attente: 'Suspendu',
      updatedAt: Date.now()
    };

    onSave(fresh);
    triggerToast(`Ticket marqué comme suspendu.`, 'info');
  };

  const handlePutBackInQueue = (queueEntryId: number) => {
    if (currentUser?.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'est pas autorisé à réactiver de consultations.", "error");
      return;
    }
    const fresh = cloneState(dbState);
    const qIdx = fresh.fileAttente.findIndex(q => q.ID_File === queueEntryId);
    if (qIdx === -1) return;

    fresh.fileAttente[qIdx] = {
      ...fresh.fileAttente[qIdx],
      Statut_Attente: 'En Attente',
      updatedAt: Date.now()
    };

    onSave(fresh);
    triggerToast(`Patient réintégré dans la file d'attente active.`, 'info');
  };

  const selectedPatient = patientsMap.get(Number(insertSelectedPatientId));
  const patientType = selectedPatient?.type_patient;

  // Sync pricing inside Nouvelle Insertion modal automatically
  useEffect(() => {
    if (patientType === 'Adulte') {
      setInsertTypeConsultation('Consultation Adulte');
      const act = dbState.actes.find(a => a.Libelle_Acte === 'Consultation Adulte');
      setInsertPrixConsultation(act ? act.Prix_Acte : 200);
    } else if (patientType === 'Enfant') {
      setInsertTypeConsultation('Consultation Enfant');
      const act = dbState.actes.find(a => a.Libelle_Acte === 'Consultation Enfant');
      setInsertPrixConsultation(act ? act.Prix_Acte : 200);
    } else {
      const act = dbState.actes.find(a => a.Libelle_Acte === 'Contrôle' || a.Libelle_Acte === 'Controle');
      setInsertTypeConsultation(act ? act.Libelle_Acte : 'Contrôle');
      setInsertPrixConsultation(act ? act.Prix_Acte : 150);
    }
  }, [insertSelectedPatientId, patientType, dbState.actes]);

  // Match patients for the "Nouvelle Insertion" patient search (Filtered for Adulte & Enfant only)
  const insertFilteredPatients = useMemo(() => {
    const isSearchEmpty = !insertSearch.trim();
    const searchLower = insertSearch.toLowerCase();
    
    const baseList = dbState.patients.filter(p => p.type_patient === 'Adulte' || p.type_patient === 'Enfant');
    
    if (isSearchEmpty) {
      return baseList.slice(0, 15);
    }
    
    return baseList.filter(p => {
      const nom = (p.Nom_Patient || '').toLowerCase();
      const type = (p.type_patient || '').toLowerCase();
      return nom.includes(searchLower) || type.includes(searchLower);
    }).slice(0, 30);
  }, [dbState.patients, insertSearch]);

  useEffect(() => {
    if (insertSearch) {
      setActiveInsertRowIndex(insertFilteredPatients.length > 0 ? 0 : -1);
    } else {
      setActiveInsertRowIndex(-1);
    }
  }, [insertSearch, insertFilteredPatients]);

  return (
    <div className="space-y-6" id="queue-complete-workspace">
      
      {/* Simulation Clock & Date Period Header Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 px-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600 animate-spin-slow" />
          <div>
            <h2 className="font-bold text-sm text-slate-900">Horloge de Caisse & Consultation MPR (File d'Attente)</h2>
            <p className="text-slate-500 text-xs mt-0.5">Suivi en temps réel des passages et historique des consultations.</p>
          </div>
        </div>
        
        {/* Date Range Selector & Simulator */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
          {/* Date interval inputs */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs text-slate-500 font-semibold mr-1">Période :</span>
            <input 
              type="date" 
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 p-0 focus:outline-none focus:ring-0 w-28 cursor-pointer"
              title="Date de début"
            />
            <span className="text-slate-300 px-1">au</span>
            <input 
              type="date" 
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 p-0 focus:outline-none focus:ring-0 w-28 cursor-pointer"
              title="Date de fin"
            />
          </div>

          <span className="text-slate-300 hidden sm:block border-l h-5" />

          {/* Clock input */}
          <div className="flex items-center gap-2">
            <label htmlFor="sim-clock-input" className="text-xs text-slate-650 font-bold">Heure d'admission :</label>
            <input 
              id="sim-clock-input"
              type="time" 
              value={simClock}
              onChange={(e) => setSimClock(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs font-black"
            />
          </div>
        </div>
      </div>

      {/* BANNER INFOS / INDICATORS */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser?.Role === 'Médecin MPR' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`} id="queue-banner-indicators">
        {/* Caisse Consultation et Controle Médical - Nouveau Style Pastel - Masqué pour le Médecin MPR */}
        {currentUser?.Role !== 'Médecin MPR' && (
          <div className="bg-emerald-100/90 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-200">
            <div className="space-y-2 z-10 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">CAISSE MPR (RDC)</span>
                </div>
                <button
                  onClick={() => setShowDepenses(!showDepenses)}
                  className="flex items-center gap-1 px-2 py-1 bg-white/80 hover:bg-white text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 transition"
                >
                  <Wallet size={14} /> Dépenses
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-emerald-200/60">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 block uppercase">R: Réglés</span>
                  <span className="text-lg font-black font-mono text-emerald-800">+{mprRegle.toLocaleString()} DA</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-rose-700 block uppercase">D: Dépenses</span>
                  <span className="text-lg font-black font-mono text-rose-700">-{totalDepensesRDC.toLocaleString()} DA</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-700 block uppercase">Solde</span>
                  <span className="text-lg font-black font-mono text-slate-800">{soldeNetRDC.toLocaleString()} DA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* En Salle Attente */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">En Salle Attente</span>
            <span className="text-2xl font-black font-mono text-indigo-600 block">{countAttente}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* En Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">En Consultations</span>
            <span className="text-2xl font-black font-mono text-amber-600 block">{countConsultation}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shadow-inner animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Consultation Réalisées */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Consultations Réalisées</span>
            <span className="text-2xl font-black font-mono text-slate-800 block">{countRealisees}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ACT BADGES / CARDS GRID (RDC authorized acts) */}
      <div className="space-y-2.5" id="rdc-act-badges-section">
        <h3 className="text-slate-900 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Activity className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tableau Clinique des Actes Clôturés (Période Sélectionnée)</span>
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {mprActes.map(act => {
            const colorConfig = actColorsAndIcons(act.Libelle_Acte);
            
            // Count realized instances in todayQueue
            const realizedCount = todayQueue.filter(
              q => q.Type_Consultation === act.Libelle_Acte && q.Statut_Attente === 'Terminé'
            ).length;

            // Total sum of those transactions
            const totalSum = todayQueue
              .filter(q => q.Type_Consultation === act.Libelle_Acte && q.Statut_Attente === 'Terminé')
              .reduce((sum, q) => sum + (q.Prix_Consultation ?? act.Prix_Acte), 0);

            return (
              <div 
                key={`act-badge-${act.ID_Acte}`}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border shadow-3xs hover:shadow-2xs transition-all duration-150 ${colorConfig.bg}`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${colorConfig.iconBg}`}>
                  {colorConfig.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black truncate uppercase tracking-tight" title={act.Libelle_Acte}>
                    {act.Libelle_Acte}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-black font-mono leading-none text-slate-900">
                      {realizedCount}
                    </span>
                    <span className="text-[8.5px] font-bold opacity-75">
                      Fait{realizedCount > 1 ? 's' : ''}
                    </span>
                    <span className="text-[9.5px] font-mono font-bold ml-auto leading-none text-slate-900">
                      {totalSum.toLocaleString()} DA
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOCK ALERT POPUP */}
      {blockedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="queue-blocker-modal">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-full">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-md text-slate-900">Blocage Admission (Caisse)</h3>
                <p className="text-xs text-rose-500 font-bold">Réglement ou Forfait requis</p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
              <p>
                Le patient <strong className="text-slate-900">{blockedPatient.patient.Nom_Patient}</strong> ne peut être admis. Facture en suspens constatée.
              </p>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-200 shadow-xs mt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-black block">FACTURE EN SOUFFRANCE #00{blockedPatient.invoice.ID_Facture}</span>
                  <span className="font-bold text-rose-700 font-mono">{blockedPatient.invoice.Montant} DA</span>
                </div>
                <span className="bg-rose-100 text-rose-800 font-black text-[9px] px-2 py-0.5 rounded-full">
                  VALIDÉE
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                id="btn-confirm-pay"
                onClick={handlePayImpaye}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Accorder l'encaissement (Débloquer)
              </button>
              <button
                onClick={() => setBlockedPatient(null)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}


      {/* SUB PANELS OPTIONS */}
      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap" id="queue-subview-panel">
        <button
          onClick={() => setActiveSubView('queue_table')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
            activeSubView === 'queue_table'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Users className="w-4 h-4" />
          File d'Attente Interactive
        </button>

        <button
          onClick={() => setActiveSubView('doctor_calls')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
            activeSubView === 'doctor_calls'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Monitor className="w-4 h-4" />
          Appel Praticien MPR
        </button>

        <button
          onClick={() => setActiveSubView('stats_dashboard')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
            activeSubView === 'stats_dashboard'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Statistiques de Caisse
        </button>
      </div>

      {/* PANEL 1: INTERACTIVE COMPACT TABLE DISPLAY */}
      {activeSubView === 'queue_table' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Contrôle de File & Présence d'Arrivée</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historique et ordonnancement chronologique de passage journalier de l'établissement.</p>
            </div>

            {currentUser?.Role !== 'Médecin MPR' && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedQueueIds.length > 0 && hasPermission(currentUser?.Role, 'queue_mpr', 'canDelete') && (
                  <button
                    onClick={() => handleDeleteQueueEntries(selectedQueueIds)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition w-max shrink-0 shadow-sm animate-fade-in cursor-pointer"
                    id="btn-delete-selected"
                  >
                    <Scissors className="w-3.5 h-3.5 text-white" />
                    <span>Supprimer Sélection ({selectedQueueIds.length})</span>
                  </button>
                )}

                {(currentUser?.Role === 'Admin' || currentUser?.Role === 'Assistante') ? (
                  <button
                    id="btn-trigger-insert"
                    onClick={() => setShowInsertionModal(true)}
                    className="bg-yellow-400 text-slate-900 hover:bg-yellow-500 text-[11px] px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition w-max shrink-0 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Accueillir un Patient</span>
                  </button>
                ) : (
                  currentUser?.Role !== 'Médecin MPR' && (
                    <button
                      id="btn-trigger-insert"
                      onClick={() => setShowInsertionModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition w-max shrink-0 cursor-pointer shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Accueillir un Patient MPR</span>
                    </button>
                  )
                )}

                {hasPermission(currentUser?.Role, 'queue_mpr', 'canDelete') && (
                  <button
                    id="btn-clear-queue"
                    onClick={() => {
                      const confirmMsg = "Êtes-vous sûr de vouloir vider l'intégralité de la file d'attente d'aujourd'hui ? Cette action videra les entrées et se synchronisera en temps réel sur tous les écrans.";
                      if (window.confirm(confirmMsg)) {
                        const fresh = cloneState(dbState);
                        fresh.fileAttente = fresh.fileAttente.filter(q => q.Date_File !== selectedDate);
                        onSave(fresh);
                        triggerToast("La file d'attente d'aujourd'hui a été entièrement réinitialisée et synchronisée.", "success");
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition w-max shrink-0 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Vider la file</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {currentUser?.Role === 'Médecin MPR' && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-2.5 mb-4 animate-fade-in shadow-3xs">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Monitor className="w-4 h-4" />
              </span>
              <span className="text-[10.5px] font-extrabold text-blue-700 uppercase tracking-wider">
                Mode Consultation — Cliquez sur le nom d'un patient pour voir sa fiche
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold font-mono">
                    {currentUser?.Role !== 'Médecin MPR' && (
                      <th className="py-2 px-2 pl-4 w-10 text-center"></th>
                    )}
                    <th className="py-2 px-2 w-20">N° Ticket</th>
                    <th className="py-2 px-2">Patient</th>
                    <th className="py-2 px-2">Type Consultation</th>
                    <th className="py-2 px-2 w-16">Tarif</th>
                    <th className="py-2 px-2 w-20">Type Patient</th>
                    <th className="py-2 px-2 w-14">Arrivée</th>
                    <th className="py-2 px-2 w-16">Heure Appel</th>
                    <th className="py-2 px-2 w-16">Heure Clôture</th>
                    <th className="py-2 px-2 w-24">Statut</th>
                    <th className="py-2 px-2">Médecin Affecté</th>
                    {currentUser?.Role !== 'Médecin MPR' && (
                      <th className="py-2 px-2 text-right pr-4 w-52">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {todayQueue.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-10 text-slate-400 italic">
                          La file d'attente est vide pour cette période. Cliquez sur "+ Accueillir un Patient MPR" ci-dessus pour y ajouter un patient.
                        </td>
                      </tr>
                    ) : (
                      todayQueue.map((q, idx) => {
                        const patient = patientsMap.get(Number(q.ID_Patient));
                        const prat = dbState.praticiens.find(p => p.ID_Prat === q.ID_Prat);
                        const isChecked = selectedQueueIds.includes(q.ID_File);
                        
                        // Dynamic Row Background Setup based on payment rules
                        let rowBgClass = "hover:bg-slate-50/55 transition-colors";
                        if (q.Regle === true) {
                          rowBgClass = "bg-[#10B981]/15 hover:bg-[#10B981]/25 border-l-4 border-[#10B981] transition-colors";
                        } else if (q.Regle === false) {
                          rowBgClass = "bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 border-l-4 border-[#F59E0B] transition-colors";
                        }
                        if (isChecked) {
                          rowBgClass += " bg-indigo-50/30";
                        }

                        return (
                          <motion.tr
                            key={`queue-row-${q.ID_File}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.16, delay: Math.min(idx * 0.03, 0.2) }}
                            onClick={() => {
                              if (currentUser?.Role === 'Médecin MPR' && onSelectPatientInQueue) {
                                onSelectPatientInQueue(q.ID_Patient);
                              }
                            }}
                            className={`${rowBgClass} ${currentUser?.Role === 'Médecin MPR' ? 'cursor-pointer hover:bg-teal-50/40' : ''}`}
                          >
                            {currentUser?.Role !== 'Médecin MPR' && (
                              <td className="py-1.5 px-2 pl-4 text-center">
                                {q.Statut_Attente === 'En Attente' ? (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedQueueIds(prev => [...prev, q.ID_File]);
                                      } else {
                                        setSelectedQueueIds(prev => prev.filter(id => id !== q.ID_File));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={() => {}}
                                    disabled
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-slate-200 border-slate-200 cursor-not-allowed opacity-30"
                                    title="Uniquement modifiable pour les patients en attente"
                                  />
                                )}
                              </td>
                            )}
                            <td className="py-1.5 px-2">
                              <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                                {q.Num_Ticket}
                              </span>
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="flex flex-col">
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectPatientInQueue) {
                                      onSelectPatientInQueue(q.ID_Patient);
                                    }
                                  }}
                                  className="font-bold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer transition select-none"
                                >
                                  {patient?.Nom_Patient || 'Non déterminé'}
                                </div>
                                {q.debloquePar && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded px-1 py-0.5 mt-0.5 w-max">
                                    🔄 Réinitialisé par {q.debloquePar}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-2">
                              {q.Statut_Attente === 'Terminé' || currentUser?.Role === 'Médecin MPR' ? (
                                <span className="font-semibold text-slate-700">
                                  {q.Type_Consultation || (patient?.type_patient === 'Enfant' ? 'Consultation Enfant' : 'Consultation Adulte')}
                                </span>
                              ) : (
                                <select
                                  value={q.Type_Consultation || (patient?.type_patient === 'Enfant' ? 'Consultation Enfant' : 'Consultation Adulte')}
                                  onChange={(e) => handleUpdateTypeConsultation(q.ID_File, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
                                >
                                  {getFilteredActesForRole(dbState.actes, currentUser?.Role || '').map(act => (
                                    <option key={act.ID_Acte} value={act.Libelle_Acte}>
                                      {act.Libelle_Acte} ({act.Prix_Acte} DA)
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="py-1.5 px-2 font-mono font-black text-slate-700">
                              {q.Prix_Consultation ?? 200} DA
                            </td>
                            <td className="py-1.5 px-2">
                              <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                                {patient?.type_patient || 'Adulte'}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 font-mono text-slate-600 font-semibold">{q.Heure_Arrivee}</td>
                            <td className="py-1.5 px-2 font-mono text-indigo-600 font-bold">{q.Heure_Appel || '...'}</td>
                            <td className="py-1.5 px-2 font-mono text-slate-500 font-bold">{q.Heure_Cloture || '...'}</td>
                            <td className="py-1.5 px-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase ${
                                q.Statut_Attente === 'Terminé' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                q.Statut_Attente === 'En Consultation' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 border' :
                                q.Statut_Attente === 'Suspendu' ? 'bg-amber-50 text-amber-800 border-amber-100 border' :
                                'bg-indigo-50 text-indigo-800 border border-indigo-100'
                              }`}>
                                {q.Statut_Attente}
                              </span>
                            </td>
                            <td className="py-1.5 px-2">
                              {q.Statut_Attente === 'Terminé' || q.Statut_Attente === 'TERMINE' || q.Statut_Attente === 'Validé' || q.Statut_Attente === 'Clôturé' ? (
                                <span className="font-bold text-slate-800">
                                  {(() => {
                                    const userDoc = dbState.utilisateurs.find(u => u.ID_Utilisateur === q.ID_Prat);
                                    if (userDoc) return userDoc.Nom_Utilisateur.startsWith('Dr.') ? userDoc.Nom_Utilisateur : `Dr. ${userDoc.Nom_Utilisateur}`;
                                    if (prat) return `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}`;
                                    return 'Médecin Indéfini';
                                  })()}
                                </span>
                              ) : (
                                <select
                                  value={q.ID_Prat ?? ''}
                                  onChange={(e) => handleUpdateDoctor(q.ID_File, Number(e.target.value))}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
                                >
                                  {doctorOptions.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                      {doc.name}
                                    </option>
                                  ))}
                                  {!doctorOptions.some(d => d.id === q.ID_Prat) && q.ID_Prat && (
                                    <option value={q.ID_Prat}>
                                      {(() => {
                                        const userDoc = dbState.utilisateurs.find(u => u.ID_Utilisateur === q.ID_Prat);
                                        if (userDoc) return userDoc.Nom_Utilisateur.startsWith('Dr.') ? userDoc.Nom_Utilisateur : `Dr. ${userDoc.Nom_Utilisateur}`;
                                        if (prat) return `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}`;
                                        return `Médecin #${q.ID_Prat}`;
                                      })()}
                                    </option>
                                  )}
                                </select>
                              )}
                            </td>
                            {currentUser?.Role !== 'Médecin MPR' && (
                              <td className="py-1.5 px-2 text-right pr-4">
                                <div className="flex items-center justify-end gap-2.5">
                                  {q.Regle === false && currentUser?.Role !== 'Médecin MPR' && (
                                    currentUser?.Role === 'Super Receptionniste' || currentUser?.Role === 'Super Réceptionniste' ? (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">Planification uniquement</span>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleValidatePayment(q.ID_File); }}
                                        className="px-2 py-1 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1 transition shadow-sm text-[10px] uppercase leading-none cursor-pointer"
                                        title="Activer le Règlement (Fond Vert)"
                                      >
                                        <CreditCard className="w-3 h-3 text-white" />
                                        <span>Règlement</span>
                                      </button>
                                    )
                                  )}

                                  {/* ROW ACTION BUTTONS BY STATUS AND ROLE */}
                                  {q.Statut_Attente === 'En Attente' && (
                                    <>
                                      {(currentUser?.Role !== 'Médecin MPR' || (currentUser?.Role === 'Médecin MPR' && prat?.Repere === 'MPR')) ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleCallPatient(q.ID_File); }}
                                          className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline cursor-pointer"
                                        >
                                          Appeler
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic font-medium">Lecture seule</span>
                                      )}
                                      
                                      {currentUser?.Role !== 'Médecin MPR' && hasPermission(currentUser?.Role, 'queue_mpr', 'canDelete') && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteQueueEntry(q.ID_File); }}
                                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                          title="Supprimer s'il est En Attente"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {q.Statut_Attente === 'En Consultation' && (
                                    <>
                                      {(currentUser?.Role !== 'Médecin MPR' || (currentUser?.Role === 'Médecin MPR' && prat?.Repere === 'MPR')) ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleCloseConsultation(q.ID_File); }}
                                          className="text-xs text-emerald-650 hover:underline font-extrabold cursor-pointer"
                                        >
                                          Clôturer
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic font-medium">Lecture seule</span>
                                      )}

                                      {currentUser?.Role !== 'Médecin MPR' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleSuspendPatient(q.ID_File); }}
                                          className="text-xs text-amber-600 hover:underline font-bold cursor-pointer"
                                          title="Suspendre la consultation en cours"
                                        >
                                          Suspendre
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {q.Statut_Attente === 'Suspendu' && (
                                    <>
                                      {currentUser?.Role !== 'Médecin MPR' ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handlePutBackInQueue(q.ID_File); }}
                                          className="text-xs text-amber-700 hover:underline font-bold cursor-pointer"
                                        >
                                          Réactiver
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic font-medium">Lecture seule</span>
                                      )}
                                    </>
                                  )}

                                  {q.Statut_Attente === 'Terminé' && (
                                    <span className="text-[10px] text-slate-400 font-bold italic flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600 font-black" /> Done
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: DOCTOR CALL WORKSPACE */}
      {activeSubView === 'doctor_calls' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Sélecteur de Profil Praticien</h3>
              <p className="text-xs text-slate-500 font-medium">Pour voir les patients enregistrés à son cabinet.</p>
            </div>

            <select
              id="dr-select"
              className="text-xs font-bold border border-slate-300 rounded-lg p-2.5 bg-slate-50 cursor-pointer"
              value={selectedDrId ?? ""}
              onChange={(e) => setSelectedDrId(Number(e.target.value))}
            >
              {dbState.praticiens.filter(p => p.Repere === 'MPR').map(p => (
                <option key={p.ID_Prat} value={p.ID_Prat}>
                  Dr. {p.Prenom_Prat} {p.Nom_Prat} (Médecin Réadaptateur MPR)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="font-black text-xs text-slate-500 block uppercase tracking-widest bg-slate-50 p-3 rounded-lg border border-slate-200">Patients attribués en attente</span>
              {(() => {
                const docWait = todayQueue.filter(q => q.ID_Prat === selectedDrId && ['En Attente', 'Suspendu'].includes(q.Statut_Attente));
                if (docWait.length === 0) {
                  return <p className="text-xs text-slate-400 italic py-6 text-center">Aucun patient affecté en attente chez vous sur cette période.</p>;
                }
                return docWait.map(q => {
                  const patient = patientsMap.get(Number(q.ID_Patient));
                  return (
                    <div key={`mpr-wait-${q.ID_File}`} className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-2 flex items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black rounded text-[10px]">
                          {q.Num_Ticket}
                        </span>
                        <h4 className="font-bold text-slate-850 text-sm mt-1">{patient?.Nom_Patient} ({patient?.type_patient})</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Heure d'arrivée : {q.Heure_Arrivee}</span>
                      </div>
                      <button
                        onClick={() => handleCallPatient(q.ID_File)}
                        disabled={currentUser?.Role === 'Médecin MPR' && q.ID_Prat !== selectedDrId}
                        className={`px-3.5 py-1.5 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          currentUser?.Role === 'Médecin MPR' && q.ID_Prat !== selectedDrId
                            ? 'bg-slate-350 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-white text-white" />
                        Appeler
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="space-y-4">
              <span className="font-black text-xs text-slate-550 block uppercase tracking-widest bg-slate-900 p-3 rounded-lg text-slate-400">Consultation active du Cabinet</span>
              {(() => {
                const activeConsults = todayQueue.filter(q => q.ID_Prat === selectedDrId && q.Statut_Attente === 'En Consultation');
                if (activeConsults.length === 0) {
                  return <p className="text-xs text-slate-400 italic py-6 text-center">Aucun patient n'est actuellement assis en salle d'examen.</p>;
                }
                return activeConsults.map(q => {
                  const patient = patientsMap.get(Number(q.ID_Patient));
                  return (
                    <div key={`mpr-consult-${q.ID_File}`} className="bg-indigo-50/50 border border-indigo-200 p-6 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-indigo-800 text-md bg-white border border-indigo-200 px-3 py-1 rounded">TICKET {q.Num_Ticket}</span>
                        <span className="text-slate-450 font-bold font-mono">Appel lancé à : {q.Heure_Appel}</span>
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">{patient?.Nom_Patient}</h4>
                      <div className="text-xs text-slate-500">Profil patient : {patient?.type_patient}</div>

                      <button
                        onClick={() => handleCloseConsultation(q.ID_File)}
                        disabled={currentUser?.Role === 'Médecin MPR' && q.ID_Prat !== selectedDrId}
                        className={`w-full py-2.5 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-sm ${
                          currentUser?.Role === 'Médecin MPR' && q.ID_Prat !== selectedDrId
                            ? 'bg-slate-350 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-emerald-650 hover:bg-emerald-750 bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        ✔ Valider la Fin de Séance
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 4: STATS CONSOLE */}
      {activeSubView === 'stats_dashboard' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2">Suivi de Fluidité & Présence (Période Sélectionnée)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1.5">
              <span className="text-xs text-slate-500 font-bold block">Temps moyen d'attente estimé</span>
              <span className="text-3xl font-black font-mono text-indigo-600 block">{avgWaitTime} min</span>
              <p className="text-[10px] text-slate-400">Intervalle moyen de passage validé (Caisse à Prise en charge)</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1.5">
              <span className="text-xs text-slate-500 font-bold block">Durée moyenne de rééducation</span>
              <span className="text-3xl font-black font-mono text-indigo-600 block">{avgConsultDuration} min</span>
              <p className="text-[10px] text-slate-400">Temps théorique moyen passé assis en cabinet</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1.5">
              <span className="text-xs text-slate-500 font-bold block">Nombre total d'engagements</span>
              <span className="text-3xl font-black font-mono text-indigo-600 block">{todayQueue.length} tickets</span>
              <p className="text-[10px] text-slate-400">Fréquentation de soins constatée</p>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: NOUVELLE INSERTION COMPLETE WORKFLOW MODAL */}
      <AnimatePresence>
        {showInsertionModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-mpr-queue-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#306568]" />
                  <h3 className="font-bold text-[#1b3d4f] text-sm">Accueillir un Patient (File d'Attente MPR)</h3>
                </div>
                <button
                  onClick={handleCloseInsertionModal}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Search & Select Patient */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Rechercher et Sélectionner le Patient :</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tapez le nom, prénom ou type de patient..."
                      value={insertSearch}
                      onChange={(e) => setInsertSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#306568]"
                    />
                  </div>

                  {/* List of filtered patients */}
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 mt-2 bg-white">
                    {insertFilteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        Aucun patient trouvé.
                      </div>
                    ) : (
                      insertFilteredPatients.slice(0, 5).map(p => {
                        const isSelected = insertSelectedPatientId === p.ID_Patient;
                        return (
                          <div
                            key={`queue-mpr-patient-${p.ID_Patient}`}
                            onClick={() => setInsertSelectedPatientId(p.ID_Patient)}
                            className={`p-2 text-xs flex justify-between items-center cursor-pointer transition ${
                              isSelected ? 'bg-indigo-550/10 hover:bg-indigo-550/15' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-slate-800">{p.Nom_Patient} {p.Prenom_Patient}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded ml-2">
                                #{p.N_Dossier_Patient || p.ID_Patient}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200 text-slate-600">
                                {p.type_patient}
                              </span>
                              {isSelected ? (
                                <span className="text-indigo-600 font-black text-xs">Sélectionné ✓</span>
                              ) : (
                                <span className="text-slate-400 font-semibold text-[10px]">Choisir</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {insertFilteredPatients.length > 5 && (
                      <div className="p-1 text-center text-[10px] text-slate-400 font-semibold bg-slate-50 border-t border-slate-100">
                        + {insertFilteredPatients.length - 5} autres patients trouvés (affinez votre recherche).
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Active Subscription Coverage Indicator */}
                {insertSelectedPatientId && (
                  <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
                    <span className="text-xs font-bold block">Patient sélectionné :</span>
                    <span className="text-[11px] font-medium block mt-0.5">
                      {dbState.patients.find(p => p.ID_Patient === insertSelectedPatientId)?.Nom_Patient} — Paiement cash obligatoire
                    </span>
                  </div>
                )}

                {/* Select Type of care */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Type d'Acte / Soin Spécialisé :</label>
                    <select
                      value={insertTypeConsultation}
                      onChange={(e) => setInsertTypeConsultation(e.target.value)}
                      className="w-full px-3 py-1.8 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#306568] cursor-pointer font-bold"
                    >
                      {rdcActes.map(acte => (
                        <option key={acte.ID_Acte} value={acte.Libelle_Acte}>
                          {acte.Libelle_Acte} ({acte.Prix_Acte} DA)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Tarification (DA) :</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={insertPrixConsultation}
                        onChange={(e) => setInsertPrixConsultation(Number(e.target.value))}
                        className="w-full px-3 py-1.8 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#306568]"
                      />
                      <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400 uppercase">DA</span>
                    </div>
                  </div>
                </div>

                {/* Paid switch & Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <input
                      id="checkbox-is-regle-mpr"
                      type="checkbox"
                      checked={insertIsRegle}
                      onChange={(e) => setInsertIsRegle(e.target.checked)}
                      className="w-4 h-4 rounded text-[#306568] focus:ring-[#306568] border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="checkbox-is-regle-mpr" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      Marquer comme réglé (Paiement encaissé)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Note de consultation / Orientations :</label>
                    <textarea
                      value={insertNote}
                      onChange={(e) => setInsertNote(e.target.value)}
                      placeholder="Commentaire de l'accueil, prescription ou motif particulier..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#306568]"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-5 border-t border-slate-150 bg-slate-50 rounded-b-2xl flex justify-end gap-2.5">
                <button
                  onClick={handleCloseInsertionModal}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition duration-150 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAddNewInsertion(false)}
                  className="px-4 py-2 bg-[#306568] hover:bg-[#1b3d4f] text-white font-bold rounded-xl text-xs transition duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer l'Accueil</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: PRINT TICKET / REÇU D'INSERTION EN FILE D'ATTENTE */}
      <AnimatePresence>
        {printingTicketData && (
          <div id="print-ticket-active-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 max-w-sm w-full font-mono text-xs text-slate-800 space-y-4 relative"
              id="print-ticket"
            >
              <div className="text-center space-y-1">
                <span className="text-2xl">🏥</span>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">KACEL Santé Ouled-Moussa</h3>
                <p className="text-[10px] text-slate-500">Service Réadaptation Clinique &amp; Kiné</p>
                <p className="text-[9px] text-slate-400">Tél : +213 (0) 23 45 67 89</p>
                <div className="border-t border-dashed border-slate-350 my-1 pt-1" />
              </div>

              <div>
                <p className="font-black text-center text-[11px] bg-slate-100 py-1 uppercase rounded tracking-wide text-slate-800">
                  🎟️ TICKET D'ADMISSION ATTEINTE
                </p>
                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 my-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">N° d'Attente</span>
                  <span className="text-3xl font-black text-slate-900 tracking-wider font-mono block mt-0.5">{printingTicketData.ticketNum}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 text-[10.5px] pt-1">
                  <span className="text-slate-500 font-semibold">Patient :</span>
                  <span className="font-bold text-right text-slate-900 truncate">{printingTicketData.patientName}</span>

                  <span className="text-slate-500 font-semibold">Date d'admission :</span>
                  <span className="font-bold text-right text-slate-900">{printingTicketData.date}</span>

                  <span className="text-slate-500 font-semibold">Heure d'arrivée :</span>
                  <span className="font-bold text-right text-slate-900">{printingTicketData.hour}</span>

                  <span className="text-slate-500 font-semibold">Type :</span>
                  <span className="font-bold text-right text-slate-900">{printingTicketData.type}</span>

                  <span className="text-slate-500 font-semibold">Médecin :</span>
                  <span className="font-bold text-right text-slate-900 truncate">{printingTicketData.drName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-350 my-2 pt-2 text-center">
                <p className="text-[11px] text-slate-500 font-bold uppercase font-sans">Fonds Encaissés / Prix :</p>
                <p className="text-xl font-black text-slate-900 font-mono mt-1">
                  {printingTicketData.price.toLocaleString()} DA
                </p>
                <p className="text-[9px] text-emerald-600 italic font-mono mt-0.5 font-bold">● Payé net (Ticket Règlé)</p>
              </div>

              <div className="border-t border-dashed border-slate-350 my-2 pt-2 text-[10px]">
                <p className="text-right italic">Signature Réception :</p>
                <div className="h-8" />
                <p className="text-center text-[8.5px] text-stone-400 font-mono">Conservez ce ticket. Merci de votre confiance.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 no-print">
                <button
                  type="button"
                  onClick={() => setPrintingTicketData(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      window.focus();
                      window.print();
                    } catch (err) {
                      console.error("Print request failed", err);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  Imprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PANNEAU DÉPENSES RDC */}
      {showDepenses && (
        <DepenseManager
          dbState={dbState}
          currentUser={currentUser}
          idService={6}
          nomService="RDC (MPR)"
          onDbChange={onSave}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
};

export default React.memo(QueueSection);
