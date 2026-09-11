/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Check, Play, CheckCircle2, AlertTriangle, Clock, X, Search, Trash2, 
  CreditCard, Receipt, Award, Heart, Edit, Activity, Sparkles, PlusCircle, AlertCircle,
  DollarSign, Plus, Pause, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Patient, Abonnement, Pack, FileAttenteIMC, getFilteredActesForRole } from '../dbStore';
import { QueueSection } from './QueueSection';
import { IMCPatientModal } from './IMCPatientModal';
import { DepenseManager } from './DepenseManager';

interface QueueIMCSectionProps {
  dbState: DatabaseState;
  currentUser: any;
  selectedDate: string;
  onSave: (state: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

// Helpers to calculate time
const getFormattedTime = (): string => {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
};

export const QueueIMCSection: React.FC<QueueIMCSectionProps> = ({
  dbState,
  currentUser,
  selectedDate,
  onSave,
  triggerToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [forceOpenMPRModal, setForceOpenMPRModal] = useState(false);
  const [showDepenses, setShowDepenses] = useState(false);

  const isAdminOrAssistant = currentUser?.Role === 'Admin' || currentUser?.Role === 'Assistante';
  const [activeFileTab, setActiveFileTab] = useState<'mpr' | 'imc'>('mpr');

  // Migration automatique des anciens statuts ("En attente d'abonnement" ou "En Attente" etc) vers le nouveau flux
  useEffect(() => {
    if (!dbState.fileAttenteIMC) return;
    const oldStatusList = ["En attente d'abonnement", "En Attente", "En Consultation", "Suspendu"];
    const itemsToMigrate = dbState.fileAttenteIMC.filter(q => oldStatusList.includes(q.Statut_Attente as string));
    if (itemsToMigrate.length > 0) {
      const fresh = cloneState(dbState);
      fresh.fileAttenteIMC = fresh.fileAttenteIMC.map(q => {
        if (oldStatusList.includes(q.Statut_Attente as string)) {
          const hasAbn = (dbState.abonnements || []).some(a => a.ID_Patient === q.ID_Patient && a.Etat === 'Actif');
          return {
            ...q,
            Statut_Attente: hasAbn ? 'Actif' : 'Nouveau'
          };
        }
        return q;
      });
      onSave(fresh);
    }
  }, [dbState.fileAttenteIMC, dbState.abonnements, onSave]);

  const countActiveMPR = useMemo(() => {
    return (dbState.fileAttente || [])
      .filter(q => q.Date_File === selectedDate && q.Statut_Attente !== 'Terminé').length;
  }, [dbState.fileAttente, selectedDate]);

  const countActiveIMC = useMemo(() => {
    return (dbState.fileAttenteIMC || [])
      .filter(q => q.Date_File === selectedDate && q.Statut_Attente !== 'Terminé').length;
  }, [dbState.fileAttenteIMC, selectedDate]);

  // Statistiques financières MPR pour l'Admin
  const statsMPR = useMemo(() => {
    const todayMPRList = (dbState.fileAttente || []).filter(q => q.Date_File === selectedDate);
    const revenueRegle = todayMPRList
      .filter(q => q.Regle === true && q.Statut_Attente === 'Terminé')
      .reduce((sum, q) => sum + (q.Prix_Consultation ?? 200), 0);
    const revenueNonRegle = todayMPRList
      .filter(q => !q.Regle)
      .reduce((sum, q) => sum + (q.Prix_Consultation ?? 200), 0);
    return {
      revenueRegle,
      revenueNonRegle
    };
  }, [dbState.fileAttente, selectedDate]);
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
    return copy as DatabaseState;
  };

  const filteredActes = useMemo(() => {
    return getFilteredActesForRole(dbState.actes || [], currentUser?.Role || '');
  }, [dbState.actes, currentUser?.Role]);

  const imcModalActes = useMemo(() => {
    return (dbState.actes || []).filter(a => {
      if (!a.Receptionniste_Autorises) return false;
      return a.Receptionniste_Autorises.some(aut => {
        const val = aut.toLowerCase().trim();
        return val === 'adm' || val === 'admin';
      });
    });
  }, [dbState.actes]);

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientForIMC, setSelectedPatientForIMC] = useState<Patient | null>(null);
  const [typeSoin, setTypeSoin] = useState<string>('Consultation Enfant IMC');
  const [prixSoin, setPrixSoin] = useState<number>(1500); // Default price in DA
  const [isRegle, setIsRegle] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  // Search inside add modal
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Track patient subscription status dynamically
  const patientSubStatus = useMemo(() => {
    if (!selectedPatientId) return { active: false, label: "Sélectionnez un patient" };
    
    // Find active subscriptions
    const activeSubs = (dbState.abonnements || []).filter(
      abn => abn.ID_Patient === selectedPatientId && abn.Etat === 'Actif'
    );
    
    if (activeSubs.length === 0) {
      return { active: false, label: "Hors Abonnement (Aucun abonnement actif)" };
    }
    
    for (const abn of activeSubs) {
      const pack = dbState.packs.find(p => p.ID_Pack === abn.ID_Pack);
      
      const ts = (typeSoin || '').toLowerCase().trim();
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
        // Consultation Enfant IMC is included in Forfait Multidisciplinaire Intensif
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
  }, [selectedPatientId, typeSoin, dbState.abonnements, dbState.packs]);

  const lastPatientIdRef = React.useRef<number | null>(null);
  const lastTypeSoinRef = React.useRef<string>('');

  // Synchroniser le type de soin et le prix lors des changements utilisateur uniquement (évite les réinitialisations lors du polling)
  useEffect(() => {
    if (selectedPatientId === null) {
      lastPatientIdRef.current = null;
      lastTypeSoinRef.current = '';
      return;
    }

    const patientChanged = lastPatientIdRef.current !== selectedPatientId;
    const careTypeChanged = lastTypeSoinRef.current !== typeSoin;

    if (patientChanged || careTypeChanged) {
      let currentTypeSoin = typeSoin;
      if (patientChanged && imcModalActes.length > 0 && !imcModalActes.some(a => a.Libelle_Acte === typeSoin)) {
        currentTypeSoin = imcModalActes[0].Libelle_Acte;
        setTypeSoin(currentTypeSoin);
      }

      const matched = imcModalActes.find(a => a.Libelle_Acte === currentTypeSoin);
      if (matched) {
        setPrixSoin(matched.Prix_Acte);
      } else if (currentTypeSoin === 'Consultation Enfant IMC') {
        setPrixSoin(2000);
      } else if (currentTypeSoin === 'Séance de Psychomotricité') {
        setPrixSoin(1800);
      } else if (currentTypeSoin === 'Orthophonie') {
        setPrixSoin(1700);
      } else if (currentTypeSoin === 'Ergothérapie') {
        setPrixSoin(1600);
      }

      lastPatientIdRef.current = selectedPatientId;
      lastTypeSoinRef.current = currentTypeSoin;
    }
  }, [selectedPatientId, typeSoin, imcModalActes]);

  // Migration : corriger les anciennes transactions IMC sans ID_Acte
  useEffect(() => {
    const txsToFix = (dbState.transactions_caisses || []).filter((t: any) =>
      t.Caisse === 'Caisse Abonnement / Autres Soins' &&
      !t.ID_Acte &&
      t.Libelle &&
      (t.Libelle.includes('Règlement IMC') || t.Libelle.includes('Ticket #'))
    );

    if (txsToFix.length > 0) {
      const fresh = cloneState(dbState);
      fresh.transactions_caisses = fresh.transactions_caisses.map((t: any) => {
        if (
          t.Caisse === 'Caisse Abonnement / Autres Soins' &&
          !t.ID_Acte &&
          t.Libelle &&
          (t.Libelle.includes('Règlement IMC') || t.Libelle.includes('Ticket #'))
        ) {
          // Extraire le type de soin de l'ancien format : "Règlement IMC - XXXX (Ticket #Y)"
          const match = t.Libelle.match(/Règlement IMC - (.+?) \(Ticket #/);
          const extractedType = match ? match[1].trim() : t.Libelle;
          const matchedActe = (dbState.actes || []).find((a: any) => a.Libelle_Acte === extractedType);

          return {
            ...t,
            Libelle: extractedType,           // ← Remplace par le vrai nom de l'acte
            ID_Acte: matchedActe?.ID_Acte     // ← Ajoute l'ID_Acte
          };
        }
        return t;
      });
      onSave(fresh);
    }
  }, [dbState.transactions_caisses?.length, dbState.actes]);

  // Get active queue items for selected date
  const activeQueue = useMemo(() => {
    const list = dbState.fileAttenteIMC || [];
    const baseList = list.filter(item => item.Date_File === selectedDate);
    
    if (currentUser?.Role === 'Receptionniste Intensif 2e') {
      return baseList.filter(item => {
        const p = dbState.patients.find(x => x.ID_Patient === item.ID_Patient);
        return p?.affectation === 'Intensif 2e';
      });
    }
    if (currentUser?.Role === 'Receptionniste Intensif 3e') {
      return baseList.filter(item => {
        const p = dbState.patients.find(x => x.ID_Patient === item.ID_Patient);
        return p?.affectation === 'Intensif 3e';
      });
    }
    if (currentUser?.Role === 'Receptionniste Intensif 4e') {
      return baseList.filter(item => {
        const p = dbState.patients.find(x => x.ID_Patient === item.ID_Patient);
        return p?.affectation === 'Intensif 4e';
      });
    }
    
    return baseList;
  }, [dbState.fileAttenteIMC, selectedDate, currentUser?.Role, dbState.patients]);

  // Filtered queue items based on search query
  const filteredQueue = useMemo(() => {
    return activeQueue.filter(item => {
      const patient = dbState.patients.find(p => p.ID_Patient === item.ID_Patient);
      if (!patient) return false;
      const query = searchQuery.toLowerCase();
      return (
        patient.Nom_Patient.toLowerCase().includes(query) ||
        patient.Prenom_Patient.toLowerCase().includes(query) ||
        (patient.N_Dossier_Patient && patient.N_Dossier_Patient.toLowerCase().includes(query)) ||
        item.Type_Soin.toLowerCase().includes(query)
      );
    });
  }, [activeQueue, searchQuery, dbState.patients]);

  // General statistics for today
  const stats = useMemo(() => {
    const total = activeQueue.length;
    const attente = activeQueue.filter(item => item.Statut_Attente === 'En Attente').length;
    const consultation = activeQueue.filter(item => item.Statut_Attente === 'En Consultation').length;
    const termines = activeQueue.filter(item => item.Statut_Attente === 'Terminé').length;
    const suspendus = activeQueue.filter(item => item.Statut_Attente === 'Suspendu').length;

    // Type of soin counts - robust substring search matching different acts variations
    const countConsult = activeQueue.filter(item => {
      const ts = (item.Type_Soin || '').toLowerCase();
      return ts.includes('consultation') || ts.includes('imc');
    }).length;
    const countPsychom = activeQueue.filter(item => {
      const ts = (item.Type_Soin || '').toLowerCase();
      return ts.includes('psychomot') || ts.includes('psycho');
    }).length;
    const countErgo = activeQueue.filter(item => {
      const ts = (item.Type_Soin || '').toLowerCase();
      return ts.includes('ergo');
    }).length;
    const countOrtho = activeQueue.filter(item => {
      const ts = (item.Type_Soin || '').toLowerCase();
      return ts.includes('ortho');
    }).length;

    // Financial calculations
    const revenueRegle = activeQueue
      .filter(item => item.Regle)
      .reduce((sum, item) => sum + item.Prix_Soin, 0);
    const revenueNonRegle = activeQueue
      .filter(item => !item.Regle)
      .reduce((sum, item) => sum + item.Prix_Soin, 0);

    return {
      total,
      attente,
      consultation,
      termines,
      suspendus,
      countConsult,
      countPsychom,
      countErgo,
      countOrtho,
      revenueRegle,
      revenueNonRegle
    };
  }, [activeQueue]);

  // Total encaissements de la file IMC (tickets réglés et terminés)
  const imcRegle = useMemo(() => {
    return activeQueue
      .filter(item => item.Regle === true && item.Statut_Attente === 'Terminé')
      .reduce((sum, item) => sum + (item.Prix_Soin ?? 0), 0);
  }, [activeQueue]);

  const imcNonRegle = useMemo(() => {
    return activeQueue
      .filter(item => !item.Regle)
      .reduce((sum, item) => sum + (item.Prix_Soin ?? 0), 0);
  }, [activeQueue]);

  // Calculs précis pour le badge CAISSE IMC / AUTRES SOINS demandés par Modification 1
  const imcCaisseRegle = useMemo(() => {
    return (dbState.fileAttenteIMC || [])
      .filter(q => q.Date_File === selectedDate && q.Regle === true && q.Statut_Attente === 'Terminé')
      .reduce((sum, q) => sum + (q.Prix_Soin ?? 0), 0);
  }, [dbState.fileAttenteIMC, selectedDate]);

  const imcCaisseNonRegle = useMemo(() => {
    return (dbState.fileAttenteIMC || [])
      .filter(q => q.Date_File === selectedDate && q.Regle === false && q.Statut_Attente === 'Terminé')
      .reduce((sum, q) => sum + (q.Prix_Soin ?? 0), 0);
  }, [dbState.fileAttenteIMC, selectedDate]);

  // Calcul des dépenses validées pour la caisse IMC / Autres Soins sur la période sélectionnée
  const totalDepensesIMC = (dbState.depenses || [])
    .filter((d: any) => d.id_service === 3 && d.statut === 'Validée' && d.date_depense === selectedDate)
    .reduce((sum: number, d: any) => sum + d.montant, 0);
  const soldeNetIMC = imcCaisseRegle - totalDepensesIMC;

  // Filter patients inside Add Modal
  const availablePatients = useMemo(() => {
    const query = modalSearchQuery.toLowerCase();
    const list = dbState.patients.filter(p => {
      const matchText = `${p.Nom_Patient} ${p.Prenom_Patient} ${p.N_Dossier_Patient || ''}`.toLowerCase();
      return matchText.includes(query);
    });

    if (currentUser?.Role === 'Receptionniste Intensif 2e') {
      return list.filter(p => p.affectation === 'Intensif 2e');
    }
    if (currentUser?.Role === 'Receptionniste Intensif 3e') {
      return list.filter(p => p.affectation === 'Intensif 3e');
    }
    if (currentUser?.Role === 'Receptionniste Intensif 4e') {
      return list.filter(p => p.affectation === 'Intensif 4e');
    }

    return list;
  }, [dbState.patients, modalSearchQuery, currentUser?.Role]);

  // Handle adding patient to the queue
  const handleAddToQueue = () => {
    if (!selectedPatientId) {
      triggerToast("Veuillez sélectionner un patient", "error");
      return;
    }

    if (prixSoin <= 0) {
      triggerToast("Le prix doit être supérieur à 0 DA. Les actes IMC ne sont jamais gratuits.", "error");
      return;
    }

    // Check if already in queue for today with the same care type
    const isAlreadyInQueue = activeQueue.some(
      item => item.ID_Patient === selectedPatientId && item.Type_Soin === typeSoin
    );
    if (isAlreadyInQueue) {
      triggerToast(`Ce patient est déjà enregistré dans la file d'attente d'aujourd'hui pour le soin "${typeSoin}".`, "error");
      return;
    }

    const nextId = (dbState.fileAttenteIMC || []).length > 0
      ? Math.max(...(dbState.fileAttenteIMC || []).map(i => i.ID_File)) + 1
      : 1;

    const newEntry: FileAttenteIMC = {
      ID_File: nextId,
      ID_Patient: selectedPatientId,
      Type_Soin: typeSoin,
      Heure_Arrivee: getFormattedTime(),
      Heure_Appel: null,
      Heure_Cloture: null,
      Statut_Attente: 'Nouveau',
      Date_File: selectedDate,
      Note: note.trim() || undefined,
      Prix_Soin: prixSoin,
      Regle: isRegle,
      updatedAt: Date.now()
    };

    const fresh = cloneState(dbState);
    fresh.fileAttenteIMC.push(newEntry);

    // Si marqué comme réglé, créer la transaction de caisse
    if (isRegle && prixSoin > 0) {
      if (!fresh.transactions_caisses) {
        fresh.transactions_caisses = [];
      }
      const nextTransId = fresh.transactions_caisses.length > 0 
        ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
        : 1;

      const patient = dbState.patients.find(p => p.ID_Patient === selectedPatientId);
      const patientName = patient
        ? `${patient.Nom_Patient || ''} ${patient.Prenom_Patient || ''}`.trim() || 'Patient Indéfini'
        : 'Patient Indéfini';
      const matchedActe = imcModalActes.find(a => a.Libelle_Acte === typeSoin);

      fresh.transactions_caisses.push({
        ID_Trans: nextTransId,
        Caisse: 'Caisse Abonnement / Autres Soins',
        Type: 'Recette',
        Montant: prixSoin,
        Libelle: typeSoin,
        ModePaiement: 'Espèces',
        Date_Trans: selectedDate,
        Patient_Nom: patientName,
        ID_Acte: matchedActe?.ID_Acte,
        ID_RDV: undefined,
        updatedAt: Date.now()
      });
    }

    onSave(fresh);
    triggerToast("Patient ajouté à la file d'attente IMC/Autre Soins avec succès !", "success");

    // Reset fields
    setSelectedPatientId(null);
    setNote('');
    setIsRegle(false);
    setModalSearchQuery('');
    setShowAddModal(false);
  };

  // Action handlers
  const handlePausePatient = (idFile: number) => {
    const fresh = cloneState(dbState);
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      fresh.fileAttenteIMC[index] = {
        ...fresh.fileAttenteIMC[index],
        Statut_Attente: 'En pause' as any,
        updatedAt: Date.now()
      };
      onSave(fresh);
      triggerToast("Patient mis en pause (dock).", "info");
    }
  };

  const handleResumePatient = (idFile: number) => {
    const fresh = cloneState(dbState);
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      fresh.fileAttenteIMC[index] = {
        ...fresh.fileAttenteIMC[index],
        Statut_Attente: 'Actif' as any,
        updatedAt: Date.now()
      };
      onSave(fresh);
      triggerToast("Patient réactivé et remis en attente active.", "success");
    }
  };

  const handleDeletePatient = (idFile: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce patient de la file d'attente ?")) {
      const fresh = cloneState(dbState);
      if (!fresh.fileAttenteIMC) return;
      fresh.fileAttenteIMC = fresh.fileAttenteIMC.filter(item => item.ID_File !== idFile);
      onSave(fresh);
      triggerToast("Entrée supprimée de la file d'attente.", "success");
    }
  };

  const handleCallPatient = (idFile: number) => {
    const fresh = cloneState(dbState);
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      const currentEntry = fresh.fileAttenteIMC[index];
      
      fresh.fileAttenteIMC[index] = {
        ...currentEntry,
        Statut_Attente: 'Actif' as any,
        Heure_Appel: getFormattedTime(),
        updatedAt: Date.now()
      };
      
      onSave(fresh);
      const patient = dbState.patients.find(p => p.ID_Patient === currentEntry.ID_Patient);
      triggerToast(`Appel lancé pour le patient ${patient?.Nom_Patient || ''}.`, 'success');
    }
  };

  const handleCloseConsultation = (idFile: number) => {
    const fresh = cloneState(dbState);
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      const currentEntry = fresh.fileAttenteIMC[index];
      
      fresh.fileAttenteIMC[index] = {
        ...currentEntry,
        Statut_Attente: 'Terminé' as any,
        Heure_Cloture: getFormattedTime(),
        updatedAt: Date.now()
      };
      
      onSave(fresh);
      const patient = dbState.patients.find(p => p.ID_Patient === currentEntry.ID_Patient);
      triggerToast(`Consultation clôturée pour le patient ${patient?.Nom_Patient || ''}.`, 'success');
    }
  };

  const handleUpdateTypeSoin = (idFile: number, newType: string) => {
    const fresh = cloneState(dbState);
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      const item = fresh.fileAttenteIMC[index];
      let newPrice = 0;
      const matched = imcModalActes.find(a => a.Libelle_Acte === newType);
      if (matched) {
        newPrice = matched.Prix_Acte;
      } else if (newType === 'Consultation Enfant IMC') {
        newPrice = 2000;
      } else if (newType === 'Séance de Psychomotricité') {
        newPrice = 1800;
      } else if (newType === 'Orthophonie') {
        newPrice = 1700;
      } else if (newType === 'Ergothérapie') {
        newPrice = 1600;
      }
      
      fresh.fileAttenteIMC[index] = {
        ...fresh.fileAttenteIMC[index],
        Type_Soin: newType,
        Prix_Soin: newPrice,
        updatedAt: Date.now()
      };
      
      onSave(fresh);
      triggerToast(`Soin/Acte mis à jour : ${newType} (${newPrice} DA).`, "info");
    }
  };

  const handleTogglePayment = (idFile: number) => {
    const fresh = cloneState(dbState);
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      const item = fresh.fileAttenteIMC[index];
      const newRegle = !item.Regle;

      fresh.fileAttenteIMC[index] = {
        ...item,
        Regle: newRegle,
        updatedAt: Date.now()
      };

      // Si on passe en "Réglé", créer la transaction de caisse
      if (newRegle) {
        if (!fresh.transactions_caisses) {
          fresh.transactions_caisses = [];
        }
        const nextTransId = fresh.transactions_caisses.length > 0 
          ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
          : 1;

        const patient = dbState.patients.find(p => p.ID_Patient === item.ID_Patient);
        const patientName = patient
          ? `${patient.Nom_Patient || ''} ${patient.Prenom_Patient || ''}`.trim() || 'Patient Indéfini'
          : 'Patient Indéfini';
        const matchedActe = imcModalActes.find(a => a.Libelle_Acte === item.Type_Soin);

        fresh.transactions_caisses.push({
          ID_Trans: nextTransId,
          Caisse: 'Caisse Abonnement / Autres Soins',
          Type: 'Recette',
          Montant: item.Prix_Soin,
          Libelle: item.Type_Soin,
          ModePaiement: 'Espèces',
          Date_Trans: selectedDate,
          Patient_Nom: patientName,
          ID_Acte: matchedActe?.ID_Acte,
          ID_RDV: undefined,
          updatedAt: Date.now()
        });
      }

      onSave(fresh);
      triggerToast("Statut de paiement mis à jour.", "success");
    }
  };

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
    if (!fresh.fileAttenteIMC) return;
    const index = fresh.fileAttenteIMC.findIndex(item => item.ID_File === idFile);
    if (index !== -1) {
      fresh.fileAttenteIMC[index] = {
        ...fresh.fileAttenteIMC[index],
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

  // Helper inside loop to check status
  const getPatientSubStatus = (patientId: number, typeSoin: string, currentState: DatabaseState) => {
    const activeSubs = (currentState.abonnements || []).filter(
      abn => abn.ID_Patient === patientId && abn.Etat === 'Actif'
    );
    if (activeSubs.length === 0) return { active: false };
    
    for (const abn of activeSubs) {
      const pack = currentState.packs.find(p => p.ID_Pack === abn.ID_Pack);
      const ts = (typeSoin || '').toLowerCase().trim();
      let targetActeId = 0;
      if (ts.includes('psychomot') || ts.includes('psycho')) targetActeId = 3;
      else if (ts.includes('ortho')) targetActeId = 4;
      else if (ts.includes('ergo')) targetActeId = 5;
      else if (ts.includes('consultation')) targetActeId = 0;
      
      const isAdditiveCovered = abn.ID_Acte_Add1 === targetActeId || abn.ID_Acte_Add2 === targetActeId;
      const isMultidisciplinaire = pack?.ID_Pack === 3 || pack?.Cat_Pack === 'I';
      
      if (targetActeId === 0) {
        if (isMultidisciplinaire) return { active: true, abn };
      } else {
        if (isAdditiveCovered || (isMultidisciplinaire && (targetActeId === 3 || targetActeId === 4 || targetActeId === 5))) {
          return { active: true, abn };
        }
      }
    }
    return { active: false };
  };

  if (!isAdminOrAssistant) {
    return (
      <QueueSection
        dbState={dbState}
        currentUser={currentUser}
        selectedDate={selectedDate}
        onSave={onSave}
        triggerToast={triggerToast}
      />
    );
  }

  return (
    <div className="space-y-6" id="queue-imc-main-wrapper">
      {/* 2. Premium Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-6 pb-px">
        <button
          onClick={() => setActiveFileTab('mpr')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 ${
            activeFileTab === 'mpr'
              ? 'border-[#306568] text-[#1b3d4f] font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>File d'Attente MPR (RDC)</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
            activeFileTab === 'mpr' ? 'bg-[#306568] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {countActiveMPR}
          </span>
        </button>
        
        <button
          onClick={() => setActiveFileTab('imc')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 ${
            activeFileTab === 'imc'
              ? 'border-[#306568] text-[#1b3d4f] font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>File d'Attente IMC / Autres Soins</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
            activeFileTab === 'imc' ? 'bg-[#306568] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {countActiveIMC}
          </span>
        </button>
      </div>

      {/* Conditional rendering of the waitlist views */}
      {activeFileTab === 'mpr' ? (
        <QueueSection
          dbState={dbState}
          currentUser={currentUser}
          selectedDate={selectedDate}
          onSave={onSave}
          triggerToast={triggerToast}
          forceOpenInsertionModal={forceOpenMPRModal}
          onCloseInsertionModal={() => setForceOpenMPRModal(false)}
        />
      ) : (
        <>
          {/* 3. Key Stats Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="queue-imc-stats-panel">
            {/* Caisse IMC / Autres Soins */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-200">
              <div className="space-y-2 z-10 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">CAISSE IMC / AUTRES SOINS</span>
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
                    <span className="text-lg font-black font-mono text-emerald-800">+{imcCaisseRegle.toLocaleString()} DA</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-rose-700 block uppercase">D: Dépenses</span>
                    <span className="text-lg font-black font-mono text-rose-700">-{totalDepensesIMC.toLocaleString()} DA</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-700 block uppercase">Solde</span>
                    <span className="text-lg font-black font-mono text-slate-800">{soldeNetIMC.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tickets Actifs</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">Aujourd'hui</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Tous soins spécialisés confondus</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">En Consultation</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-black text-emerald-600">{stats.consultation}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 animate-pulse">En cours</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Installés sur le plateau de soin</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-indigo-150 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">En Attente</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-black text-indigo-600">{stats.attente}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono">Tickets</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Patients en salle d'attente</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Soins Réalisés</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-black text-amber-600">{stats.termines}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-mono">Validés</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Séances validées ce jour</p>
            </div>
          </div>

      {/* 3. Breakdown by Act / Care */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-4" id="queue-imc-breakdown-sub">
        <div className="text-center p-2 rounded-xl bg-white border border-slate-200/50 shadow-3xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Consultations IMC</span>
          <span className="block text-lg font-black text-[#1b3d4f] mt-1">{stats.countConsult}</span>
        </div>
        <div className="text-center p-2 rounded-xl bg-white border border-slate-200/50 shadow-3xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Psychomotricité</span>
          <span className="block text-lg font-black text-[#1b3d4f] mt-1">{stats.countPsychom}</span>
        </div>
        <div className="text-center p-2 rounded-xl bg-white border border-slate-200/50 shadow-3xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Ergothérapie</span>
          <span className="block text-lg font-black text-[#1b3d4f] mt-1">{stats.countErgo}</span>
        </div>
        <div className="text-center p-2 rounded-xl bg-white border border-slate-200/50 shadow-3xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Orthophonie</span>
          <span className="block text-lg font-black text-[#1b3d4f] mt-1">{stats.countOrtho}</span>
        </div>
      </div>

      {/* Contrôle de File & Présence d'Arrivée for IMC */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Contrôle de File & Présence d'Arrivée</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Historique et ordonnancement chronologique de passage journalier de l'établissement.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-patient-imc-queue"
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-400 text-slate-900 hover:bg-yellow-500 text-[11px] px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition w-max shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Accueillir un Patient</span>
          </button>

          <button
            id="btn-clear-queue-imc"
            onClick={() => {
              const confirmMsg = "Êtes-vous sûr de vouloir vider l'intégralité de la file d'attente IMC / Autres Soins d'aujourd'hui ? Cette action videra les entrées et se synchronisera en temps réel sur tous les écrans.";
              if (window.confirm(confirmMsg)) {
                const fresh = cloneState(dbState);
                fresh.fileAttenteIMC = fresh.fileAttenteIMC.filter(q => q.Date_File !== selectedDate);
                onSave(fresh);
                triggerToast("La file d'attente IMC/Autres Soins d'aujourd'hui a été entièrement réinitialisée.", "success");
              }
            }}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition w-max shrink-0 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider la file</span>
          </button>
        </div>
      </div>

      {/* 4. Filter & Main Table */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="search-imc-queue"
              type="text"
              placeholder="Rechercher patient, dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#306568]"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium shrink-0">
            {filteredQueue.length} patient(s) affiché(s) • Date : <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">{selectedDate}</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs" id="table-queue-imc">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider font-sans">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">Patient / Dossier</th>
                <th className="p-3">Soin Spécialisé / Acte</th>
                <th className="p-3">Médecin Affecté</th>
                <th className="p-3">Prix Acte (Cash)</th>
                <th className="p-3">Horaires</th>
                <th className="p-3 text-center">Tarif &amp; Paiement</th>
                <th className="p-3 text-center">Notes / Alertes</th>
                <th className="p-3 text-center">Statut</th>
                <th className="p-3 text-right">Actions de Pilotage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    Aucun patient dans la file d'attente IMC / Autre Soins pour le moment.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item, idx) => {
                  const patient = dbState.patients.find(p => p.ID_Patient === item.ID_Patient);
                  const subStatus = getPatientSubStatus(item.ID_Patient, item.Type_Soin, dbState);

                  return (
                    <tr 
                      key={`queue-imc-row-${item.ID_File}`} 
                      className={`hover:bg-slate-50/50 transition ${
                        item.Statut_Attente === 'En Consultation' ? 'bg-emerald-50/20' : 
                        item.Statut_Attente === 'Terminé' ? 'bg-slate-50/30 opacity-70' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="p-3 text-center font-bold text-slate-700 font-mono">
                        {idx + 1}
                      </td>

                      {/* Patient Name / Dossier */}
                      <td className="p-3">
                        {patient ? (
                          <div className="space-y-0.5">
                            {(() => {
                              const hasDossierIMC = dbState.fiches_imc?.some(f => f.ID_Patient === patient.ID_Patient);
                              return (
                                <span 
                                  onClick={() => setSelectedPatientForIMC(patient)}
                                  className="font-bold text-[#306568] hover:text-[#1b3d4f] inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                                  title="Ouvrir la fiche d'évaluation pédiatrique et l'abonnement"
                                >
                                  {patient.Nom_Patient} {patient.Prenom_Patient}
                                  {hasDossierIMC && (
                                    <span className="text-amber-600 font-bold text-[10px] bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 flex items-center gap-1" title="Le patient dispose d'une fiche d'évaluation IMC">
                                      📋 Dossier IMC
                                    </span>
                                  )}
                                </span>
                              );
                            })()}
                            {item.debloquePar && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded px-1 py-0.5 mt-0.5 w-max">
                                🔄 Réinitialisé par {item.debloquePar}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span className="font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                                #{patient.N_Dossier_Patient || patient.ID_Patient}
                              </span>
                              <span>• {patient.Genre_Patient}</span>
                              <span>• {patient.Age_Pat || patient.Age_Patient || "N/A"} ans</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-semibold italic">Patient Inconnu (#{item.ID_Patient})</span>
                        )}
                      </td>

                      {/* Type of care */}
                      <td className="p-3">
                        {item.Statut_Attente === 'Terminé' ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight inline-block shadow-3xs ${
                            (() => {
                              const ts = (item.Type_Soin || '').toLowerCase();
                              if (ts.includes('consultation') || ts.includes('imc')) {
                                return 'bg-indigo-50 border border-indigo-200 text-indigo-700';
                              }
                              if (ts.includes('psychomot') || ts.includes('psycho')) {
                                return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
                              }
                              if (ts.includes('ergo')) {
                                return 'bg-pink-50 border border-pink-200 text-pink-700';
                              }
                              return 'bg-cyan-50 border border-cyan-200 text-cyan-700'; // Orthophonie
                            })()
                          }`}>
                            {item.Type_Soin}
                          </span>
                        ) : (
                          <select
                            value={item.Type_Soin}
                            onChange={(e) => handleUpdateTypeSoin(item.ID_File, e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[200px]"
                          >
                            {filteredActes.map(act => (
                              <option key={act.ID_Acte} value={act.Libelle_Acte}>
                                {act.Libelle_Acte} ({act.Prix_Acte} DA)
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Médecin Affecté */}
                      <td className="p-3">
                        {item.Statut_Attente === 'Terminé' || item.Statut_Attente === 'TERMINE' || item.Statut_Attente === 'Validé' || item.Statut_Attente === 'Clôturé' ? (
                          <span className="font-bold text-slate-800">
                            {(() => {
                              const userDoc = (dbState.utilisateurs || []).find(u => u.ID_Utilisateur === item.ID_Prat);
                              if (userDoc) return userDoc.Nom_Utilisateur.startsWith('Dr.') ? userDoc.Nom_Utilisateur : `Dr. ${userDoc.Nom_Utilisateur}`;
                              const prat = (dbState.praticiens || []).find(p => p.ID_Prat === item.ID_Prat);
                              if (prat) return `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}`;
                              return 'Médecin Indéfini';
                            })()}
                          </span>
                        ) : (
                          <select
                            value={item.ID_Prat ?? ''}
                            onChange={(e) => handleUpdateDoctor(item.ID_File, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-slate-200 rounded px-2 py-1 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
                          >
                            {doctorOptions.map(doc => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name}
                              </option>
                            ))}
                            {!doctorOptions.some(d => d.id === item.ID_Prat) && item.ID_Prat && (
                              <option value={item.ID_Prat}>
                                {(() => {
                                  const userDoc = (dbState.utilisateurs || []).find(u => u.ID_Utilisateur === item.ID_Prat);
                                  if (userDoc) return userDoc.Nom_Utilisateur.startsWith('Dr.') ? userDoc.Nom_Utilisateur : `Dr. ${userDoc.Nom_Utilisateur}`;
                                  const prat = (dbState.praticiens || []).find(p => p.ID_Prat === item.ID_Prat);
                                  if (prat) return `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}`;
                                  return `Médecin #${item.ID_Prat}`;
                                })()}
                              </option>
                            )}
                          </select>
                        )}
                      </td>

                      {/* Subscription details */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {item.Prix_Soin === 0 ? "—" : `${item.Prix_Soin.toLocaleString()} DA`}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="p-3 font-mono text-[10px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between gap-1">
                          <span className="font-semibold">Arrivée :</span>
                          <span className="font-bold text-slate-800">{item.Heure_Arrivee}</span>
                        </div>
                        {item.Heure_Appel && (
                          <div className="flex justify-between gap-1 text-emerald-600">
                            <span className="font-semibold">Appel :</span>
                            <span className="font-bold">{item.Heure_Appel}</span>
                          </div>
                        )}
                        {item.Heure_Cloture && (
                          <div className="flex justify-between gap-1 text-amber-600">
                            <span className="font-semibold">Fin :</span>
                            <span className="font-bold">{item.Heure_Cloture}</span>
                          </div>
                        )}
                      </td>

                      {/* Price / Payment */}
                      <td className="p-3 text-center">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-800 block">
                            {item.Prix_Soin === 0 ? "—" : `${item.Prix_Soin.toLocaleString()} DA`}
                          </span>
                          
                          <button
                            disabled={currentUser?.Role === 'SupperRec' || currentUser?.Role === 'Super Receptionniste' || currentUser?.Role === 'Super Réceptionniste'}
                            onClick={() => handleTogglePayment(item.ID_File)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition duration-150 inline-block ${
                              currentUser?.Role === 'SupperRec' || currentUser?.Role === 'Super Receptionniste' || currentUser?.Role === 'Super Réceptionniste'
                                ? 'opacity-70 cursor-default ' + (item.Regle ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-150 text-rose-700')
                                : 'cursor-pointer ' + (item.Regle ? 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200/70' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/70')
                            }`}
                            title={currentUser?.Role === 'SupperRec' || currentUser?.Role === 'Super Receptionniste' || currentUser?.Role === 'Super Réceptionniste' ? "Lecture seule" : "Cliquer pour changer le statut du règlement"}
                          >
                            {item.Regle ? '✓ Réglé' : '✗ Non Réglé'}
                          </button>
                        </div>
                      </td>

                      {/* Notes / Comments */}
                      <td className="p-3 text-center max-w-[150px] truncate">
                        {item.Note ? (
                          <span className="text-[10px] font-medium text-slate-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded block whitespace-normal break-words" title={item.Note}>
                            {item.Note}
                          </span>
                        ) : (
                          <span className="text-slate-350 italic">-</span>
                        )}
                      </td>

                      {/* Current Status badge */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-tight inline-block ${
                          item.Statut_Attente === 'Nouveau' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          item.Statut_Attente === 'Actif' ? 'bg-emerald-100 text-emerald-800 font-extrabold' :
                          item.Statut_Attente === 'En pause' ? 'bg-amber-100 text-amber-800 font-extrabold' :
                          'bg-slate-200 text-slate-700' // Terminé
                        }`}>
                          {item.Statut_Attente}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2.5 items-center">
                          {item.Regle === false && (
                            (currentUser?.Role === 'SupperRec' || currentUser?.Role === 'Super Receptionniste' || currentUser?.Role === 'Super Réceptionniste') ? (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">Planification uniquement</span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTogglePayment(item.ID_File); }}
                                className="px-2 py-1 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1 transition shadow-sm text-[10px] uppercase leading-none cursor-pointer"
                                title="Activer le Règlement (Fond Vert)"
                              >
                                <CreditCard className="w-3 h-3 text-white" />
                                <span>Règlement</span>
                              </button>
                            )
                          )}

                          {item.Statut_Attente === 'Nouveau' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCallPatient(item.ID_File); }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline cursor-pointer"
                              >
                                Appeler
                              </button>
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePatient(item.ID_File); }}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {item.Statut_Attente === 'Actif' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCloseConsultation(item.ID_File); }}
                                className="text-xs text-emerald-650 hover:underline font-extrabold cursor-pointer text-emerald-600"
                              >
                                Clôturer
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); handlePausePatient(item.ID_File); }}
                                className="text-xs text-amber-600 hover:underline font-bold cursor-pointer"
                                title="Suspendre"
                              >
                                Suspendre
                              </button>
                            </>
                          )}

                          {item.Statut_Attente === 'En pause' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResumePatient(item.ID_File); }}
                              className="text-xs text-amber-700 hover:underline font-bold cursor-pointer"
                            >
                              Réactiver
                            </button>
                          )}

                          {item.Statut_Attente === 'Terminé' && (
                            <span className="text-[10px] text-slate-400 font-bold italic flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600 font-black" /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add to Queue Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-imc-queue-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#306568]" />
                  <h3 className="font-bold text-[#1b3d4f] text-sm">Accueillir un Patient (File d'Attente Spécialisée)</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
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
                      placeholder="Tapez le nom, prénom ou n° de dossier du patient..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#306568]"
                    />
                  </div>

                  {/* List of filtered patients (limited list for performance/space) */}
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 mt-2 bg-white">
                    {availablePatients.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        Aucun patient trouvé.
                      </div>
                    ) : (
                      availablePatients.slice(0, 5).map(p => {
                        const isSelected = selectedPatientId === p.ID_Patient;
                        return (
                          <div
                            key={`queue-imc-patient-${p.ID_Patient}`}
                            onClick={() => setSelectedPatientId(p.ID_Patient)}
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
                              {p.type_patient === 'Enfant IMC' && (
                                <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 rounded-md">
                                  Enfant IMC
                                </span>
                              )}
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
                    {availablePatients.length > 5 && (
                      <div className="p-1 text-center text-[10px] text-slate-400 font-semibold bg-slate-50 border-t border-slate-100">
                        + {availablePatients.length - 5} autres patients trouvés (affinez votre recherche).
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Active Subscription Coverage Indicator */}
                {selectedPatientId && (
                  <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
                    <span className="text-xs font-bold block">Patient sélectionné :</span>
                    <span className="text-[11px] font-medium block mt-0.5">
                      {dbState.patients.find(p => p.ID_Patient === selectedPatientId)?.Nom_Patient} — Paiement cash obligatoire
                    </span>
                  </div>
                )}

                {/* Select Type of care */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Type d'Acte / Soin Spécialisé :</label>
                    <select
                      value={typeSoin}
                      onChange={(e) => setTypeSoin(e.target.value)}
                      className="w-full px-3 py-1.8 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#306568]"
                    >
                      {imcModalActes.map(acte => (
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
                        value={prixSoin}
                        onChange={(e) => setPrixSoin(Number(e.target.value))}
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
                      id="checkbox-is-regle"
                      type="checkbox"
                      checked={isRegle}
                      onChange={(e) => setIsRegle(e.target.checked)}
                      className="w-4 h-4 rounded text-[#306568] focus:ring-[#306568] border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="checkbox-is-regle" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      Marquer comme réglé (Paiement encaissé)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Note de consultation / Orientations :</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition duration-150"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddToQueue}
                  className="px-4 py-2 bg-[#306568] hover:bg-[#1b3d4f] text-white font-bold rounded-xl text-xs transition duration-150 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer l'Accueil</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PANNEAU DÉPENSES IMC */}
      {showDepenses && (
        <DepenseManager
          dbState={dbState}
          currentUser={currentUser}
          idService={3}
          nomService="IMC / Autres Soins"
          onDbChange={onSave}
          triggerToast={triggerToast}
        />
      )}

      {selectedPatientForIMC && (
        <IMCPatientModal
          patient={selectedPatientForIMC}
          dbState={dbState}
          onClose={() => setSelectedPatientForIMC(null)}
          onSave={onSave}
          triggerToast={triggerToast}
          readOnly={!isAdminOrAssistant}
          currentRole={currentUser?.Role}
        />
      )}
        </>
      )}
    </div>
  );
};

export default React.memo(QueueIMCSection);
