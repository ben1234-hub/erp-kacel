/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, User, Users, CheckSquare, Square, Plus, Trash2, 
  History, CheckCircle, AlertCircle, BookOpen, Activity, ChevronRight, 
  ChevronLeft, Search, Check, X, UserCheck, UserMinus, ShieldAlert, Shield,
  HelpCircle, Sparkles, RefreshCw, DollarSign, Lock, Unlock, FileText, ShieldCheck,
  Layers, Maximize2, AlertTriangle, Building, Sun
} from 'lucide-react';
import { 
  DatabaseState, Praticien, Patient, Abonnement, Seance,
  getRemainingSessions, saveDatabase, timesOverlap 
} from '../dbStore';

interface OrthoPsychoSchedulerProps {
  dbState: DatabaseState;
  selectedDate: string;
  onSave: (nextState: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  currentUser: any;
}

export const OrthoPsychoScheduler: React.FC<OrthoPsychoSchedulerProps> = ({
  dbState,
  selectedDate,
  onSave,
  triggerToast,
  currentUser
}) => {
  // Périodes configurées par défaut (créneaux d'une heure)
  const COLUMNS_MATIN = ['08:00', '09:00', '10:00', '11:00'];
  const COLUMNS_APRES_MIDI = ['13:00', '14:00', '15:00', '16:00'];

  // Déterminer le rôle de l'utilisateur
  const isUserAdmin = currentUser?.Role === 'Admin' || currentUser?.Role === 'Administrateur';
  const isUserAssistante = currentUser?.Role === 'Assistante';

  // Mapper le rôle de la réceptionniste à son étage d'intervention
  const getReceptionistFloorLabel = (role: string): string | null => {
    if (!role) return null;
    const r = role.toLowerCase();
    if (r.includes('2e') || r.includes('etage 2') || r.includes('étage 2') || r.includes('intensif 2')) return '2e Étage';
    if (r.includes('3e') || r.includes('etage 3') || r.includes('étage 3') || r.includes('intensif 3')) return '3e Étage';
    if (r.includes('4e') || r.includes('etage 4') || r.includes('étage 4') || r.includes('intensif 4')) return '4e Étage';
    return null;
  };

  const userFloorLabel = getReceptionistFloorLabel(currentUser?.Role || '');

  // Déterminer l'étage d'un patient à partir de ses affectations
  const getPatientFloorLabel = (patient: Patient): string => {
    const aff = (patient.Affect_Pat_IMC || patient.affectation || '').toLowerCase();
    if (aff.includes('2e') || aff.includes('étage 2') || aff.includes('etage 2') || aff.includes('intensif 2')) return '2e Étage';
    if (aff.includes('3e') || aff.includes('étage 3') || aff.includes('etage 3') || aff.includes('intensif 3')) return '3e Étage';
    if (aff.includes('4e') || aff.includes('étage 4') || aff.includes('etage 4') || aff.includes('intensif 4')) return '4e Étage';
    return 'Autre / Non défini';
  };

  // Droits globaux d'accès
  const canModifyAtLeastSomething = isUserAdmin || isUserAssistante || !!userFloorLabel;

  // Liste des praticiens Orthophonistes (O) et Psychomotriciens/Psychologues (P)
  const availablePrats = useMemo(() => {
    const seen = new Set<number>();
    return dbState.praticiens.filter(p => {
      if (seen.has(p.ID_Prat)) return false;
      seen.add(p.ID_Prat);
      const rep = (p.Repere || '').trim().toUpperCase();
      return rep === 'O' || rep === 'P';
    });
  }, [dbState.praticiens]);

  // Présences pour la date sélectionnée (persistant dans dbState et synchronisé en temps réel)
  const presentPratIds = useMemo(() => {
    const presenceMap = dbState.orthoPsychoPresence || {};
    if (presenceMap[selectedDate]) {
      return presenceMap[selectedDate];
    }
    // Fallback de migration vers localStorage
    const saved = localStorage.getItem(`ortho_psycho_present_${selectedDate}`);
    return saved ? JSON.parse(saved) : [];
  }, [dbState.orthoPsychoPresence, selectedDate]);

  // Si aucun praticien n'est enregistré présent aujourd'hui, on ouvre d'office le panneau de configuration des présences (uniquement pour l'Admin ou l'Assistante)
  const [showPresenceModal, setShowPresenceModal] = useState<boolean>(false);
  
  useEffect(() => {
    if (!isUserAdmin && !isUserAssistante) {
      setShowPresenceModal(false);
      return;
    }
    const presenceMap = dbState.orthoPsychoPresence || {};
    const presentList = presenceMap[selectedDate];
    if (presentList) {
      if (presentList.length === 0) {
        setShowPresenceModal(true);
      } else {
        setShowPresenceModal(false);
      }
    } else {
      const saved = localStorage.getItem(`ortho_psycho_present_${selectedDate}`);
      if (!saved || JSON.parse(saved).length === 0) {
        setShowPresenceModal(true);
      } else {
        setShowPresenceModal(false);
      }
    }
  }, [selectedDate, currentUser, dbState.orthoPsychoPresence]);

  // État temporaire de sélection des présences dans la fenêtre d'ouverture
  const [tempPresenceIds, setTempPresenceIds] = useState<number[]>([]);

  // Synchroniser l'état temporaire à l'ouverture du modal
  useEffect(() => {
    if (showPresenceModal) {
      setTempPresenceIds([...presentPratIds]);
    }
  }, [showPresenceModal, presentPratIds]);

  // Grille des séances (persistant dans dbState et synchronisé en temps réel)
  const gridAssignments = useMemo(() => {
    if (dbState.orthoPsychoAssignments) {
      return dbState.orthoPsychoAssignments;
    }
    // Fallback/Migration pour les données existantes de localStorage
    const saved = localStorage.getItem(`ortho_psycho_assignments`);
    return saved ? JSON.parse(saved) : {};
  }, [dbState.orthoPsychoAssignments]);

  const saveAssignments = (newAssignments: Record<string, any>) => {
    localStorage.setItem(`ortho_psycho_assignments`, JSON.stringify(newAssignments));
    const nextDb = {
      ...dbState,
      orthoPsychoAssignments: newAssignments
    };
    onSave(nextDb);
  };

  // Liste locale des logs d'audit de sécurité et traçabilité (persistant)
  const [securityLogs, setSecurityLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('ortho_psycho_security_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Enregistrer un log d'action de sécurité
  const logSecurityAction = (action: string, detail: string) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      utilisateur: currentUser?.Nom_Utilisateur || "Inconnu",
      role: currentUser?.Role || "Néant",
      action,
      detail,
      dateCible: selectedDate
    };
    const updatedLogs = [newLog, ...securityLogs].slice(0, 200); // Garder les 200 derniers logs
    setSecurityLogs(updatedLogs);
    localStorage.setItem('ortho_psycho_security_logs', JSON.stringify(updatedLogs));
  };

  // Vérifier si un patient a un abonnement actif avec des séances restantes
  const getPatientActiveAbonnement = (patientId: number): Abonnement | null => {
    const activeAbns = dbState.abonnements.filter(abn => 
      abn.ID_Patient === patientId && 
      (abn.Etat !== 'Fermé') && 
      getRemainingSessions(abn, dbState) > 0
    );
    return activeAbns.length > 0 ? activeAbns[0] : null;
  };

  // Vérifier si un patient a un abonnement actif avec option Psycho / Ortho / Ergo et séances restantes
  const getPatientActiveAbonnementWithOption = (patientId: number): Abonnement | null => {
    const activeAbns = dbState.abonnements.filter(abn => 
      abn.ID_Patient === patientId && 
      (abn.Etat !== 'Fermé') && 
      getRemainingSessions(abn, dbState) > 0 &&
      (
        abn.ID_Acte_Add1 === 3 || abn.ID_Acte_Add1 === 4 || abn.ID_Acte_Add1 === 5 ||
        abn.ID_Acte_Add2 === 3 || abn.ID_Acte_Add2 === 4 || abn.ID_Acte_Add2 === 5
      )
    );
    return activeAbns.length > 0 ? activeAbns[0] : null;
  };

  // Déterminer si l'utilisateur connecté est un réceptionniste
  const isUserReceptionist = useMemo(() => {
    const role = (currentUser?.Role || '').toLowerCase();
    return role.includes('receptionniste') || role.includes('réceptionniste') || role.includes('supperrec');
  }, [currentUser]);

  // Liste des patients éligibles au planning Psycho / Ortho
  // RÈGLE MÉTIER 3 : Tous les types de patients (avec ou sans abonnement actif) sont éligibles, 
  // SAUF le type "Enfant IMC" qui requiert un abonnement actif avec option Psycho / Ortho / Ergo.
  const eligiblePatients = useMemo(() => {
    const seen = new Set<number>();
    return dbState.patients.filter(p => {
      if (seen.has(p.ID_Patient)) return false;
      seen.add(p.ID_Patient);

      const type = (p.type_patient || '').trim().toLowerCase();
      
      if (type === 'enfant imc' || type === 'enfant_imc') {
        // Enfant IMC: doit obligatoirement avoir un abonnement actif avec option Psycho / Ortho / Ergo
        return !!getPatientActiveAbonnementWithOption(p.ID_Patient);
      }
      
      // Tous les autres types (Adulte, etc.) : éligibles sans condition d'abonnement
      return true;
    });
  }, [dbState.patients, dbState.abonnements]);

  // États pour assigner un patient
  const [activeCellAssign, setActiveCellAssign] = useState<{
    pratId: number;
    hour: string;
    period: 'matin' | 'apres_midi';
  } | null>(null);

  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // États d'historique et d'application
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Vérifier si un programme de période est appliqué
  const isPeriodApplied = (period: 'matin' | 'apr_midi') => {
    return localStorage.getItem(`ortho_psycho_applied_${selectedDate}_${period}`) === 'true';
  };

  // Lecture de l'historique général d'application
  const appliedHistory = useMemo(() => {
    const saved = localStorage.getItem(`ortho_psycho_applied_history`);
    return saved ? JSON.parse(saved) : [];
  }, [showHistoryModal]);

  // Praticiens classés par spécialité pour la liste de gestion des présences
  const orthophonistesList = useMemo(() => availablePrats.filter(p => (p.Repere || '').trim().toUpperCase() === 'O'), [availablePrats]);
  const psychomotList = useMemo(() => availablePrats.filter(p => (p.Repere || '').trim().toUpperCase() === 'P'), [availablePrats]);

  // Praticiens présents triés : Orthophonistes (O) d'abord, puis Psychomotriciens/Psychologues (P)
  const sortedPresentPratIds = useMemo(() => {
    const uniqueIds = Array.from(new Set(presentPratIds));
    return uniqueIds.sort((a, b) => {
      const pratA = dbState.praticiens.find(p => p.ID_Prat === a);
      const pratB = dbState.praticiens.find(p => p.ID_Prat === b);
      if (!pratA || !pratB) return 0;
      
      const repA = (pratA.Repere || '').trim().toUpperCase();
      const repB = (pratB.Repere || '').trim().toUpperCase();

      // Les 'O' d'abord, puis les 'P'
      if (repA === 'O' && repB === 'P') return -1;
      if (repA === 'P' && repB === 'O') return 1;
      // Si même repère, trier par Nom
      return `${pratA.Prenom_Prat} ${pratA.Nom_Prat}`.localeCompare(`${pratB.Prenom_Prat} ${pratB.Nom_Prat}`);
    });
  }, [presentPratIds, dbState.praticiens]);

  // Double fonction : "Tout sélectionner" / "Tout désélectionner"
  const allPratsCheckedInModal = useMemo(() => {
    if (availablePrats.length === 0) return false;
    return availablePrats.every(p => tempPresenceIds.includes(p.ID_Prat));
  }, [availablePrats, tempPresenceIds]);

  const handleToggleSelectAllPresence = () => {
    if (allPratsCheckedInModal) {
      setTempPresenceIds([]);
      triggerToast("Tous les spécialistes ont été désélectionnés.", "info");
    } else {
      setTempPresenceIds(availablePrats.map(p => p.ID_Prat));
      triggerToast("Tous les spécialistes ont été sélectionnés.", "success");
    }
  };

  // Enregistrer la présence quotidienne (Assistante de Direction ou Admin)
  const handleSavePresence = () => {
    if (!isUserAdmin && !isUserAssistante) {
      triggerToast("Accès refusé : la gestion des présences est réservée à l'Admin ou son assistante.", "error");
      return;
    }
    localStorage.setItem(`ortho_psycho_present_${selectedDate}`, JSON.stringify(tempPresenceIds));
    
    const nextPresenceMap = {
      ...(dbState.orthoPsychoPresence || {}),
      [selectedDate]: tempPresenceIds
    };

    const nextDb = {
      ...dbState,
      orthoPsychoPresence: nextPresenceMap
    };

    onSave(nextDb);
    setShowPresenceModal(false);
    
    // Loguer la préparation du planning
    const listNames = tempPresenceIds.map(id => {
      const pr = dbState.praticiens.find(p => p.ID_Prat === id);
      return pr ? `${pr.Prenom_Prat} ${pr.Nom_Prat}` : '';
    }).filter(Boolean).join(', ');
    logSecurityAction("Préparation du planning", `Praticiens déclarés présents : [${listNames || 'aucun'}]`);
    
    triggerToast("Présences enregistrées avec succès et appliquées à la grille quotidienne !", "success");
  };

  // Assigner un patient à un créneau horaire
  const handleAssignPatient = (patientId: number) => {
    if (!activeCellAssign) return;
    const { pratId, hour } = activeCellAssign;

    const patient = dbState.patients.find(p => p.ID_Patient === patientId);
    if (!patient) return;

    // RÈGLE MÉTIER 3 : Restriction par étage pour les réceptionnistes
    if (!isUserAdmin && !isUserAssistante) {
      if (userFloorLabel) {
        // Réceptionniste d'un étage intensif (2e, 3e, 4e) : restreint aux patients de son propre étage
        const patFloor = getPatientFloorLabel(patient);
        if (userFloorLabel !== patFloor) {
          triggerToast(`Droit d'ajout restreint : vous pouvez uniquement programmer les patients de votre étage (${userFloorLabel}). Ce patient appartient au ${patFloor}.`, "error");
          return;
        }
      } else if (!isUserReceptionist) {
        // Si l'utilisateur n'est pas Admin, ni Assistante, ni Réceptionniste : modification refusée
        triggerToast("Votre rôle ne vous autorise pas à modifier la grille de programmation.", "error");
        return;
      }
    }

    // Détecter les conflits : le patient est-il déjà assigné sur le même créneau horaire avec quelqu'un d'autre dans Ortho/Psycho ?
    const cellKeySameHour = Object.keys(gridAssignments).find(key => {
      const parts = key.split('_'); // date_pratId_hour
      const assign = gridAssignments[key];
      const pid = assign && typeof assign === 'object' ? assign.patientId : assign;
      return parts[0] === selectedDate && parts[2] === hour && Number(pid) === patientId;
    });

    if (cellKeySameHour) {
      const conflictParts = cellKeySameHour.split('_');
      const conflictPratId = Number(conflictParts[1]);
      const conflictPratName = dbState.praticiens.find(p => p.ID_Prat === conflictPratId);
      triggerToast(
        `Ce patient est déjà assigné à ce créneau avec un autre praticien (${conflictPratName ? conflictPratName.Nom_Prat : 'Spécialiste'}).`,
        "error"
      );
      return;
    }

    // RÈGLE D'INTÉGRITÉ TEMPORO-SPATIALE (NON-CHEVAUCHEMENT - RÈGLE MÉTIER 6)
    const startOrtho = hour; // e.g. "08:00"
    const endOrtho = `${String(parseInt(hour.split(':')[0], 10) + 1).padStart(2, '0')}:00`; // e.g. "09:00"

    const rdvConflict = dbState.rendezVous.find(r => {
      if (r.ID_Patient !== patientId) return false;
      if (r.Date_RDV !== selectedDate) return false;
      if (r.Statut_RDV === 'Annulé' || r.Statut_RDV === 'Absent') return false;

      // Détecter un chevauchement horaire entre l'Ortho/Psycho (startOrtho-endOrtho) et le RDV de rééducation / intensif
      return timesOverlap(startOrtho, endOrtho, r.H_Debut_RDV, r.H_Fin_RDV);
    });

    if (rdvConflict) {
      const conflictPrat = dbState.praticiens.find(p => p.ID_Prat === rdvConflict.ID_Prat);
      const startT = rdvConflict.H_Debut_RDV;
      const endT = rdvConflict.H_Fin_RDV;
      const zoneName = dbState.zones.find(z => z.ID_Zone === rdvConflict.ID_Zone)?.Nom_Zone || 'Rééducation';
      
      triggerToast(
        `[CONFLIT DE PROGRAMMATION] Double réservation interdite : ce patient a déjà une séance de rééducation/intensif planifiée sur ce créneau horaire (${startT} - ${endT}) avec Dr. ${conflictPrat ? conflictPrat.Nom_Prat : 'un praticien'} (Zone : ${zoneName}).`,
        "error"
      );
      return;
    }

    const key = `${selectedDate}_${pratId}_${hour}`;
    const prat = dbState.praticiens.find(p => p.ID_Prat === pratId);

    const nextAssignments = { 
      ...gridAssignments, 
      [key]: { 
        patientId, 
        insertedBy: currentUser?.Nom_Utilisateur || "Réceptionniste",
        insertedByRole: currentUser?.Role || "Néant",
        timestamp: Date.now()
      } 
    };
    saveAssignments(nextAssignments);
    setActiveCellAssign(null);
    setPatientSearchQuery('');

    // Loguer la traçabilité de l'action
    logSecurityAction(
      "Planification patient", 
      `Patient: ${patient.Nom_Patient} (ID ${patientId}), Praticien: Dr. ${prat ? prat.Nom_Prat : 'Inconnu'}, Heure: ${hour}, Étage: ${getPatientFloorLabel(patient)}`
    );

    triggerToast("Patient planifié sur ce créneau avec succès !", "success");
  };

  // Retirer un patient d'un créneau (Droit de retrait - Règle métier 3)
  const handleRemoveAssignment = (pratId: number, hour: string) => {
    const key = `${selectedDate}_${pratId}_${hour}`;
    const assignmentData = gridAssignments[key];
    if (!assignmentData) return;

    const patientId = typeof assignmentData === 'object' ? assignmentData.patientId : assignmentData;
    const insertedBy = typeof assignmentData === 'object' ? assignmentData.insertedBy : 'Réceptionniste';

    // RÈGLE MÉTIER 3 : Seul l'Admin ou l'auteur de l'insertion peut retirer le patient
    const canRemove = isUserAdmin || (currentUser?.Nom_Utilisateur && insertedBy === currentUser?.Nom_Utilisateur);
    if (!canRemove) {
      triggerToast(`Droit de retrait refusé : seul l'Admin ou la réceptionniste ayant inséré ce patient (${insertedBy}) peut le retirer de la grille.`, "error");
      return;
    }

    const patient = dbState.patients.find(p => p.ID_Patient === patientId);
    const prat = dbState.praticiens.find(p => p.ID_Prat === pratId);
    const nextDb = JSON.parse(JSON.stringify(dbState)) as DatabaseState;

    if (patientId) {
      // Trouver s'il y a déjà une séance enregistrée pour cette heure, ce praticien, ce patient et cette date
      const seanceIdx = nextDb.seances.findIndex(s => 
        s.Date_Seanc_Realisee === selectedDate &&
        s.H_Debut_Seanc === hour &&
        s.ID_Prat === pratId &&
        s.ID_Patient === patientId
      );

      if (seanceIdx !== -1) {
        // La séance existait déjà, on la retire et on restitue la séance consommée (si abonnement) ou on rembourse
        const seanceObj = nextDb.seances[seanceIdx];
        if (seanceObj.ID_Abn) {
          const abnIdx = nextDb.abonnements.findIndex(a => a.ID_Abn === seanceObj.ID_Abn);
          if (abnIdx !== -1) {
            nextDb.abonnements[abnIdx].Nbre_Sean_Consom_Abn = Math.max(
              0,
              nextDb.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1
            );
          }
        } else {
          // Si paiement espèces sans abonnement -> on supprime aussi l'encaissement associé en caisse
          if (nextDb.transactions_caisses) {
            const isOrtho = (prat?.Repere || '').trim().toUpperCase() === 'O';
            const searchLib = `Encaissement Séance ${isOrtho ? 'Orthophonie' : 'Psychomotricité'} (Sans Abn) - ${patient?.Nom_Patient}`;
            nextDb.transactions_caisses = nextDb.transactions_caisses.filter(t => 
              !(t.Libelle.includes(searchLib) && t.Date_Trans === selectedDate)
            );
          }
        }
        // Supprimer la séance
        nextDb.seances.splice(seanceIdx, 1);
      }
    }

    const nextAssignments = { ...gridAssignments };
    delete nextAssignments[key];
    saveAssignments(nextAssignments);

    // Persister les modifications
    onSave(nextDb);

    // Loguer la traçabilité de l'action
    logSecurityAction(
      "Retrait patient", 
      `Patient: ${patient ? patient.Nom_Patient : 'Inconnu'}, Praticien: Dr. ${prat ? prat.Nom_Prat : 'Inconnu'}, Heure: ${hour} (inséré initialement par : ${insertedBy})`
    );

    triggerToast("Créneau libéré et séance restituée / transaction annulée.", "info");
  };

  // "Valider & Déduire" le programme (Strictement réservé à l'Admin - Règle métier 1 & 4 & 5)
  const handleApplyProgramme = (period: 'matin' | 'apr_midi') => {
    if (!isUserAdmin) {
      triggerToast("Validation refusée : Seul l'administrateur (Admin) a le droit de valider définitivement le programme de la journée.", "error");
      return;
    }

    const columns = period === 'matin' ? COLUMNS_MATIN : COLUMNS_APRES_MIDI;
    
    // Récupérer toutes les planifications valides pour cette date, ces praticiens présents, et ces heures
    const scheduledAssignments: { pratId: number; hour: string; patientId: number }[] = [];
    
    presentPratIds.forEach(pratId => {
      columns.forEach(hour => {
        const key = `${selectedDate}_${pratId}_${hour}`;
        const assignmentData = gridAssignments[key];
        const patientId = assignmentData
          ? (typeof assignmentData === 'object' ? assignmentData.patientId : assignmentData)
          : null;
        if (patientId) {
          scheduledAssignments.push({ pratId, hour, patientId });
        }
      });
    });

    if (scheduledAssignments.length === 0) {
      triggerToast("Aucun patient n'est planifié pour cette période de soins.", "error");
      return;
    }

    const nextDb = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
    let debitedCount = 0;
    let cashSalesCount = 0;
    let alreadyDeductedCount = 0;
    let errorsRecorded: string[] = [];
    const treatedList: { patientName: string; pratName: string; hour: string; packLabel: string; natureActe?: string; payMethod: 'Abonnement' | 'Espèces' }[] = [];

    scheduledAssignments.forEach(({ pratId, hour, patientId }) => {
      const patient = nextDb.patients.find(p => p.ID_Patient === patientId);
      const prat = nextDb.praticiens.find(p => p.ID_Prat === pratId);
      if (!patient || !prat) return;

      // S'assurer que la déduction ne se fait qu'une seule fois par séance unique
      const alreadyExists = nextDb.seances.some(s => 
        s.Date_Seanc_Realisee === selectedDate &&
        s.H_Debut_Seanc === hour &&
        s.ID_Prat === pratId &&
        s.ID_Patient === patientId
      );

      if (alreadyExists) {
        alreadyDeductedCount++;
        return; // Passer, déjà validée
      }

      const isOrtho = (prat.Repere || '').trim().toUpperCase() === 'O';
      const actId = isOrtho ? 4 : 3;
      const associatedAct = nextDb.actes.find(a => a.ID_Acte === actId);
      const prixSeance = associatedAct ? associatedAct.Prix_Acte : 170;
      const natureActe = isOrtho ? "Séance orthophonie" : "Séance psychomotricité";

      // 1. Recherche de l'abonnement actif (Règle métier 4 & 5)
      const abn = getPatientActiveAbonnement(patientId);

      let abnId: number | null = null;
      let paymentMethod: 'Abonnement' | 'Espèces' = 'Espèces';
      let packLabel = 'Sans abonnement (Règlement espèce)';

      if (abn) {
        // Patient AVEC abonnement actif -> Déduction automatique sur l'abonnement
        const abnIdx = nextDb.abonnements.findIndex(a => a.ID_Abn === abn.ID_Abn);
        nextDb.abonnements[abnIdx].Nbre_Sean_Consom_Abn += 1;
        abnId = abn.ID_Abn;
        paymentMethod = 'Abonnement';
        packLabel = nextDb.packs.find(pk => pk.ID_Pack === abn.ID_Pack)?.Libelle_Pack || 'Forfait de soins';
        debitedCount++;
      } else {
        // Patient SANS abonnement actif (Règle métier 5) -> Règlement espèce encaissé sur caisse Abonnement / Autres Soins
        if (!nextDb.transactions_caisses) {
          nextDb.transactions_caisses = [];
        }
        const nextTransId = nextDb.transactions_caisses.length > 0 
          ? Math.max(...nextDb.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
          : 1;

        const newCaisseTrans = {
          ID_Trans: nextTransId,
          Caisse: "Caisse Abonnement / Autres Soins",
          Type: "Recette",
          Montant: prixSeance,
          Libelle: `Encaissement Séance ${isOrtho ? 'Orthophonie' : 'Psychomotricité'} (Sans Abn) - ${patient.Nom_Patient}`,
          ModePaiement: "Espèces",
          Date_Trans: selectedDate,
          Patient_Nom: patient.Nom_Patient,
          ID_Acte: actId
        };
        nextDb.transactions_caisses.push(newCaisseTrans);
        paymentMethod = 'Espèces';
        cashSalesCount++;
      }

      // 2. Créer l'enregistrement de la Séance dans le journal clinique persistant (avec nature de l'acte correspondante)
      const maxSeanceId = nextDb.seances.length > 0 
        ? Math.max(...nextDb.seances.map(s => s.ID_Seanc)) 
        : 0;

      const newSeance: Seance = {
        ID_Seanc: maxSeanceId + 1,
        ID_Patient: patientId,
        ID_Prat: pratId,
        ID_Acte: actId,
        ID_Abn: abnId,
        ID_RDV: null,
        H_Debut_Seanc: hour,
        H_Fin_Seanc: `${String(Number(hour.split(':')[0]) + 1).padStart(2, '0')}:00`,
        Prix_Seanc: prixSeance,
        Date_Seanc_Realisee: selectedDate
      };

      nextDb.seances.push(newSeance);

      treatedList.push({
        patientName: patient.Nom_Patient,
        pratName: `${prat.Prenom_Prat} ${prat.Nom_Prat}`,
        hour,
        packLabel,
        natureActe,
        payMethod: paymentMethod
      });
    });

    const totalProcessed = debitedCount + cashSalesCount;

    if (totalProcessed > 0) {
      onSave(nextDb);
    }

    // Marquer la période comme validée/appliquée
    localStorage.setItem(`ortho_psycho_applied_${selectedDate}_${period}`, 'true');

    // Sauvegarder dans l'historique général persistant de localStorage
    if (totalProcessed > 0) {
      const savedHist = localStorage.getItem(`ortho_psycho_applied_history`);
      const historyList = savedHist ? JSON.parse(savedHist) : [];
      
      const newHistoryEntry = {
        id: Date.now(),
        date: selectedDate,
        period: period === 'matin' ? 'Période Matinale' : 'Période Après-midi',
        appliedAt: new Date().toLocaleString('fr-FR'),
        appliedBy: currentUser.Nom_Utilisateur || "Administrateur",
        details: treatedList,
        totalCount: totalProcessed,
        debitedCount,
        cashSalesCount
      };

      historyList.unshift(newHistoryEntry);
      localStorage.setItem(`ortho_psycho_applied_history`, JSON.stringify(historyList));

      // Loguer l'audit de sécurité de cette validation Admin
      logSecurityAction(
        "Validation définitive", 
        `Validation finale du planning [${period === 'matin' ? 'Matin' : 'Après-midi'}] : ${debitedCount} déductions d'abonnements, ${cashSalesCount} encaissements espèces (Caisse Abonnement / Autres Soins)`
      );
    }

    if (totalProcessed > 0) {
      triggerToast(
        `Planning validé avec succès par l'Admin ! ${debitedCount} séances déduites sur abonnements, ${cashSalesCount} encaissements enregistrés en Caisse Abonnement (Espèces).`, 
        "success"
      );
    } else {
      triggerToast("Toutes les séances planifiées sur cette période ont déjà été validées et facturées.", "info");
    }
  };

  // Filtrer les patients autorisés en fonction du rôle de la réceptionniste
  const allowedPatientsForUser = useMemo(() => {
    // Admin, Assistante, et réceptionnistes non-Intensif (RDC, Balnéo, Réeducation) voient tous les patients éligibles
    if (isUserAdmin || isUserAssistante || !userFloorLabel) {
      return eligiblePatients;
    }
    // Réceptionnistes Intensif (2e, 3e, 4e) voient uniquement les patients affectés à leur propre étage
    return eligiblePatients.filter(p => getPatientFloorLabel(p) === userFloorLabel);
  }, [eligiblePatients, userFloorLabel, isUserAdmin, isUserAssistante]);

  // Filtrer la recherche dans le modal
  const eligiblePatientsFiltered = useMemo(() => {
    const cleanSearch = patientSearchQuery.trim().toLowerCase();
    if (!cleanSearch) return allowedPatientsForUser;
    return allowedPatientsForUser.filter(p => 
      p.Nom_Patient.toLowerCase().includes(cleanSearch) || 
      (p.phone && p.phone.includes(cleanSearch))
    );
  }, [allowedPatientsForUser, patientSearchQuery]);

  // Vérifier si une affectation est validée
  const isAssignmentApplied = (pratId: number, hour: string, patientId: number) => {
    return dbState.seances.some(s => 
      s.Date_Seanc_Realisee === selectedDate &&
      s.H_Debut_Seanc === hour &&
      s.ID_Prat === pratId &&
      s.ID_Patient === patientId
    );
  };

  return (
    <div className="space-y-3 animate-fade-in font-sans pb-4" id="orthophonie-psychomotor-container">
      
      {/* HEADER — Style KACEL Sante */}
      <div className="bg-white border-b border-slate-100 p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-indigo-100">
                Plateau Spécialisé
              </span>
              <span className="text-indigo-500 text-[9px] font-bold">Orthophonie &amp; Psychomotricité</span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Orthophonie &amp; Psychomotricité
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Planification des séances pour enfants IMC. Prise en charge par l'Admin/Assistante, alertes par réception et étapes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-rose-500" />
              Date Active : {selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
            </span>
            <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
              <Maximize2 className="w-3 h-3" />
              Plein Écran
            </button>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Serveur HP
            </span>
          </div>
        </div>
      </div>

      {/* BANDEAU D'ALERTE — Compacter */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 flex items-center gap-2.5 mx-1">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-amber-700 leading-tight">
            Alertes programmées pour enfants IMC. Prise en charge par l'Admin/Assistante, alertes par réception et étapes.
          </p>
          <p className="text-[9px] text-amber-500 mt-0.5">
            Suivi de validation par l'Admin/Assistante, déclarations automatiques et encaissement express.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-500 uppercase">{currentUser?.Nom_Utilisateur || 'BENKARI Mhand'}</div>
            <div className="text-[8px] text-slate-400 uppercase">{currentUser?.Role || 'ADMINISTRATEUR'}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 border border-slate-300">
            {currentUser?.Nom_Utilisateur?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* SECTION "Salle de Présence des Spécialistes" — Compacter */}
      <div className="mt-2 mx-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Salle de Présence des Spécialistes</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isUserAdmin || isUserAssistante ? (
              <button 
                onClick={() => {
                  setTempPresenceIds([...presentPratIds]);
                  setShowPresenceModal(true);
                }}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-3 h-3 text-indigo-500" />
                Gérer les Présences du Jour ({presentPratIds.length})
              </button>
            ) : (
              <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                Lecture seule (Régulé par l'Admin)
              </span>
            )}
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3 h-3 text-slate-500" />
              Historique de Validation
            </button>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 leading-tight">La programmation des séances s'effectue à chaque créneau horaire selon les disponibilités réelles publiées par l'administration.</p>
      </div>

      {/* BADGES DE STATISTIQUES — Compacter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mx-1 my-2" id="ortho-stats-cards">
        <div className="bg-white border border-slate-100 rounded-xl p-2 flex items-center gap-2 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Présents ce jour</div>
            <div className="text-xs font-black text-slate-900 mt-0.5">{presentPratIds.length} <span className="text-[9px] font-bold text-slate-500">Spécialistes</span></div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-2 flex items-center gap-2 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Programmation Active</div>
            <div className="text-xs font-black text-slate-900 mt-0.5">
              {Object.keys(gridAssignments).filter(key => key.startsWith(selectedDate)).length} <span className="text-[9px] font-bold text-slate-500">Séance(s)</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-2 flex items-center gap-2 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Building className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Votre Propriété d'Étage</div>
            <div className="text-xs font-black text-slate-900 mt-0.5">
              {isUserAdmin || isUserAssistante || !userFloorLabel ? `Tous les étages` : userFloorLabel} <span className="text-[9px] font-bold text-slate-500">({allowedPatientsForUser.length} Patients)</span>
            </div>
          </div>
        </div>
      </div>

      {/* DOUBLE GRILLE DES PÉRIODES (MATIN / APRÈS-MIDI) */}
      <div className="space-y-3" id="ortho-double-period-view">
        
        {/* ================= PÉRIODE MATINALE ================= */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition duration-200 mx-1">
          
          {/* Header de la Période */}
          <div className="bg-slate-50/60 px-3 py-1.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Période Matinale</span>
              <span className="text-[9px] text-slate-400">08:00 — 12:00</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isPeriodApplied('matin') && (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Validé par l'Admin</span>
                </span>
              )}
              
              {isUserAdmin ? (
                <button
                  type="button"
                  onClick={() => handleApplyProgramme('matin')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm uppercase tracking-wider"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Valider &amp; Débiter (Matin)</span>
                </button>
              ) : (
                <span className="bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[8px] px-2 py-1 rounded-lg flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Attente validation Admin</span>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-left border-collapse text-[10px] min-w-[800px]">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[8px] font-black">
                <tr>
                  <th className="px-3 py-1 font-sans whitespace-nowrap w-[180px]">Praticien présent</th>
                  {COLUMNS_MATIN.map(hour => (
                    <th key={hour} className="px-1 py-1 text-center font-mono whitespace-nowrap border-l border-slate-150/60">
                      {hour} — {String(Number(hour.split(':')[0]) + 1).padStart(2, '0')}:00
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {presentPratIds.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS_MATIN.length + 1} className="p-6 text-center text-slate-400 font-medium">
                      <div className="max-w-md mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-[10px] font-bold text-slate-600">Aucun spécialiste n'est déclaré présent aujourd'hui.</p>
                        {isUserAdmin || isUserAssistante ? (
                          <>
                            <p className="text-[9px] text-slate-500">Inscrivez les praticiens présents ce jour pour éditer la grille et procéder aux affectations.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setTempPresenceIds([...presentPratIds]);
                                setShowPresenceModal(true);
                              }}
                              className="mt-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[9px] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Choisir la liste des présents
                            </button>
                          </>
                        ) : (
                          <p className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-150 p-2 rounded-lg mt-1 leading-relaxed">
                            ⚠️ Seul l'administrateur ou son assistante a le droit de configurer les praticiens présents.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedPresentPratIds.map((pratId, idx) => {
                    const prat = dbState.praticiens.find(p => p.ID_Prat === pratId);
                    if (!prat) return null;
                    const isPratOrtho = (prat.Repere || '').trim().toUpperCase() === 'O';
                    const specialtyLabel = isPratOrtho ? '🎙️ Ortho' : '🧠 Psycho';
                    const specColor = isPratOrtho ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-purple-50 text-purple-700 border-purple-100';

                    const prevPrat = dbState.praticiens.find(p => p.ID_Prat === sortedPresentPratIds[idx - 1]);
                    const showSeparator = idx > 0 && 
                      (prat.Repere || '').trim().toUpperCase() === 'P' && 
                      (prevPrat?.Repere || '').trim().toUpperCase() === 'O';

                    return (
                      <React.Fragment key={`morning-row-${pratId}-${idx}`}>
                        {showSeparator && (
                          <tr key={`sep-matin-${pratId}`} className="border-y border-slate-100 bg-slate-50/60">
                            <td colSpan={COLUMNS_MATIN.length + 1} className="py-1 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex-1 h-px bg-slate-200/60" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Séparation : Orthophonie 🎙️ — Psychomotricité 🧠</span>
                                <div className="flex-1 h-px bg-slate-200/60" />
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-slate-50/20 transition duration-150">
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 text-[#0F2D37] flex items-center justify-center font-black text-[10px] border border-slate-200 shrink-0">
                                {prat.Prenom_Prat[0]}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-800 block text-[10px] leading-tight truncate">
                                  Dr. {prat.Prenom_Prat} {prat.Nom_Prat}
                                </span>
                                <span className={`inline-block text-[7.5px] font-black uppercase tracking-wide px-1.5 py-0.2 rounded border ${specColor} mt-0.5`}>
                                  {specialtyLabel}
                                </span>
                              </div>
                            </div>
                          </td>

                          {COLUMNS_MATIN.map(hour => {
                            const key = `${selectedDate}_${pratId}_${hour}`;
                            const assignmentData = gridAssignments[key];
                            const patientId = assignmentData
                              ? (typeof assignmentData === 'object' ? assignmentData.patientId : assignmentData)
                              : null;
                            const insertedBy = assignmentData && typeof assignmentData === 'object'
                              ? assignmentData.insertedBy
                              : 'Réceptionniste';
                            const patient = dbState.patients.find(p => p.ID_Patient === patientId);

                            let hasAbn = false;
                            let isApplied = false;
                            let patFloor = '';
                            if (patient) {
                              hasAbn = !!getPatientActiveAbonnement(patient.ID_Patient);
                              isApplied = isAssignmentApplied(pratId, hour, patient.ID_Patient);
                              patFloor = getPatientFloorLabel(patient);
                            }

                            // Droit de retrait
                            const canRemove = isUserAdmin || (currentUser?.Nom_Utilisateur && insertedBy === currentUser?.Nom_Utilisateur);

                            return (
                              <td key={`morning-cell-${pratId}-${hour}`} className="px-1.5 py-1 border-l border-slate-100 text-center min-w-[140px] max-w-[170px]">
                                {patient ? (
                                  (() => {
                                    const isSubscriptionActive = patient.hasSubscription === true || patient.abonnementActif === true || hasAbn;
                                    const cellClassName = isSubscriptionActive ? 'cellule-avec-abonnement' : 'cellule-sans-abonnement';
                                    const labelTitle = `${patient.Nom_Patient} • ${isSubscriptionActive ? "Abonnement actif" : "Sans abonnement"} • Inséré par : ${insertedBy}`;
                                    return (
                                      <div 
                                        className={`${cellClassName} flex items-center justify-between w-full h-[32px] max-h-[34px] p-1.5 select-none text-white cursor-pointer relative group rounded-lg`}
                                        title={labelTitle}
                                        aria-label={labelTitle}
                                      >
                                        <div className="flex-1 min-w-0 text-left">
                                          <div className="text-[10px] font-extrabold text-white truncate uppercase tracking-tight leading-tight">
                                            {patient.Nom_Patient}
                                          </div>
                                          <div className="text-[8px] font-medium text-white/75 truncate mt-0.5 leading-none">
                                            Par : {insertedBy}
                                          </div>
                                        </div>
                                        
                                        {canRemove ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveAssignment(pratId, hour);
                                            }}
                                            className="text-white/85 hover:text-white p-0.5 rounded hover:bg-white/10 transition cursor-pointer active:scale-90 flex-shrink-0 ml-1"
                                            title="Retirer ce patient de la grille"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        ) : (
                                          <div className="text-white/40 p-0.5 flex-shrink-0 ml-1" title={`Retrait restreint à l'Admin ou à ${insertedBy}`}>
                                            <Lock className="w-3 h-3" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!canModifyAtLeastSomething) {
                                        triggerToast("Lecture seule : vous ne pouvez pas planifier de séances.", "info");
                                        return;
                                      }
                                      setActiveCellAssign({ pratId, hour, period: 'matin' });
                                    }}
                                    disabled={!canModifyAtLeastSomething}
                                    className="border border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-bold transition duration-150 cursor-pointer text-center w-full max-w-[110px] mx-auto active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                  >
                                    <Plus className="w-3 h-3 stroke-[2.5]" />
                                    <span>+ Planifier</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= PÉRIODE APRÈS-MIDI ================= */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition duration-200 mx-1">
          
          {/* Header de la Période */}
          <div className="bg-slate-50/60 px-3 py-1.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Période Après-midi</span>
              <span className="text-[9px] text-slate-400">13:00 — 17:00</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isPeriodApplied('apr_midi') && (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Validé par l'Admin</span>
                </span>
              )}
              
              {isUserAdmin ? (
                <button
                  type="button"
                  onClick={() => handleApplyProgramme('apr_midi')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm uppercase tracking-wider"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Valider &amp; Débiter (Après-midi)</span>
                </button>
              ) : (
                <span className="bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[8px] px-2 py-1 rounded-lg flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Attente validation Admin</span>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-left border-collapse text-[10px] min-w-[800px]">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[8px] font-black">
                <tr>
                  <th className="px-3 py-1 font-sans whitespace-nowrap w-[180px]">Praticien présent</th>
                  {COLUMNS_APRES_MIDI.map(hour => (
                    <th key={hour} className="px-1 py-1 text-center font-mono whitespace-nowrap border-l border-slate-150/60">
                      {hour} — {String(Number(hour.split(':')[0]) + 1).padStart(2, '0')}:00
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {presentPratIds.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS_APRES_MIDI.length + 1} className="p-6 text-center text-slate-400 font-medium">
                      <div className="max-w-md mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-[10px] font-bold text-slate-600">Aucun spécialiste n'est déclaré présent aujourd'hui.</p>
                        {isUserAdmin || isUserAssistante ? (
                          <>
                            <p className="text-[9px] text-slate-500">Inscrivez les praticiens présents ce jour pour éditer la grille et procéder aux affectations.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setTempPresenceIds([...presentPratIds]);
                                setShowPresenceModal(true);
                              }}
                              className="mt-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[9px] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Choisir la liste des présents
                            </button>
                          </>
                        ) : (
                          <p className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-150 p-2 rounded-lg mt-1 leading-relaxed">
                            ⚠️ Seul l'administrateur ou son assistante a le droit de configurer les praticiens présents.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedPresentPratIds.map((pratId, idx) => {
                    const prat = dbState.praticiens.find(p => p.ID_Prat === pratId);
                    if (!prat) return null;
                    const isPratOrtho = (prat.Repere || '').trim().toUpperCase() === 'O';
                    const specialtyLabel = isPratOrtho ? '🎙️ Ortho' : '🧠 Psycho';
                    const specColor = isPratOrtho ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-purple-50 text-purple-700 border-purple-100';

                    const prevPrat = dbState.praticiens.find(p => p.ID_Prat === sortedPresentPratIds[idx - 1]);
                    const showSeparator = idx > 0 && 
                      (prat.Repere || '').trim().toUpperCase() === 'P' && 
                      (prevPrat?.Repere || '').trim().toUpperCase() === 'O';

                    return (
                      <React.Fragment key={`afternoon-row-${pratId}-${idx}`}>
                        {showSeparator && (
                          <tr key={`sep-apres-midi-${pratId}`} className="border-y border-slate-100 bg-slate-50/60">
                            <td colSpan={COLUMNS_APRES_MIDI.length + 1} className="py-1 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex-1 h-px bg-slate-200/60" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Séparation : Orthophonie 🎙️ — Psychomotricité 🧠</span>
                                <div className="flex-1 h-px bg-slate-200/60" />
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-slate-50/20 transition duration-150">
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 text-[#0F2D37] flex items-center justify-center font-black text-[10px] border border-slate-200 shrink-0">
                                {prat.Prenom_Prat[0]}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-800 block text-[10px] leading-tight truncate">
                                  Dr. {prat.Prenom_Prat} {prat.Nom_Prat}
                                </span>
                                <span className={`inline-block text-[7.5px] font-black uppercase tracking-wide px-1.5 py-0.2 rounded border ${specColor} mt-0.5`}>
                                  {specialtyLabel}
                                </span>
                              </div>
                            </div>
                          </td>

                          {COLUMNS_APRES_MIDI.map(hour => {
                            const key = `${selectedDate}_${pratId}_${hour}`;
                            const assignmentData = gridAssignments[key];
                            const patientId = assignmentData
                              ? (typeof assignmentData === 'object' ? assignmentData.patientId : assignmentData)
                              : null;
                            const insertedBy = assignmentData && typeof assignmentData === 'object'
                              ? assignmentData.insertedBy
                              : 'Réceptionniste';
                            const patient = dbState.patients.find(p => p.ID_Patient === patientId);

                            let hasAbn = false;
                            let isApplied = false;
                            let patFloor = '';
                            if (patient) {
                              hasAbn = !!getPatientActiveAbonnement(patient.ID_Patient);
                              isApplied = isAssignmentApplied(pratId, hour, patient.ID_Patient);
                              patFloor = getPatientFloorLabel(patient);
                            }

                            // Droit de retrait
                            const canRemove = isUserAdmin || (currentUser?.Nom_Utilisateur && insertedBy === currentUser?.Nom_Utilisateur);

                            return (
                              <td key={`afternoon-cell-${pratId}-${hour}`} className="px-1.5 py-1 border-l border-slate-100 text-center min-w-[140px] max-w-[170px]">
                                {patient ? (
                                  (() => {
                                    const isSubscriptionActive = patient.hasSubscription === true || patient.abonnementActif === true || hasAbn;
                                    const cellClassName = isSubscriptionActive ? 'cellule-avec-abonnement' : 'cellule-sans-abonnement';
                                    const labelTitle = `${patient.Nom_Patient} • ${isSubscriptionActive ? "Abonnement actif" : "Sans abonnement"} • Inséré par : ${insertedBy}`;
                                    return (
                                      <div 
                                        className={`${cellClassName} flex items-center justify-between w-full h-[32px] max-h-[34px] p-1.5 select-none text-white cursor-pointer relative group rounded-lg`}
                                        title={labelTitle}
                                        aria-label={labelTitle}
                                      >
                                        <div className="flex-1 min-w-0 text-left">
                                          <div className="text-[10px] font-extrabold text-white truncate uppercase tracking-tight leading-tight">
                                            {patient.Nom_Patient}
                                          </div>
                                          <div className="text-[8px] font-medium text-white/75 truncate mt-0.5 leading-none">
                                            Par : {insertedBy}
                                          </div>
                                        </div>
                                        
                                        {canRemove ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveAssignment(pratId, hour);
                                            }}
                                            className="text-white/85 hover:text-white p-0.5 rounded hover:bg-white/10 transition cursor-pointer active:scale-90 flex-shrink-0 ml-1"
                                            title="Retirer ce patient de la grille"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        ) : (
                                          <div className="text-white/40 p-0.5 flex-shrink-0 ml-1" title={`Retrait restreint à l'Admin ou à ${insertedBy}`}>
                                            <Lock className="w-3 h-3" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!canModifyAtLeastSomething) {
                                        triggerToast("Lecture seule : vous ne pouvez pas planifier de séances.", "info");
                                        return;
                                      }
                                      setActiveCellAssign({ pratId, hour, period: 'apres_midi' });
                                    }}
                                    disabled={!canModifyAtLeastSomething}
                                    className="border border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-bold transition duration-150 cursor-pointer text-center w-full max-w-[110px] mx-auto active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                  >
                                    <Plus className="w-3 h-3 stroke-[2.5]" />
                                    <span>+ Planifier</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================= MODAL 1 : SÉLECTION DU PATIENT ================= */}
      {activeCellAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            
            <div className="bg-[#0F2D37] text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm font-sans flex items-center gap-1.5">
                  <UserCheck className="w-4.5 h-4.5 text-teal-400" />
                  <span>Planifier un Patient (Ortho / Psycho)</span>
                </h3>
                <p className="text-[10px] text-[#a2cbcd] font-mono mt-0.5">
                  Créneau : {activeCellAssign.hour} • Thérapeute : {
                    (() => {
                      const pr = dbState.praticiens.find(p => p.ID_Prat === activeCellAssign.pratId);
                      return pr ? `Dr. ${pr.Prenom_Prat} ${pr.Nom_Prat}` : 'Inconnu';
                    })()
                  }
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setActiveCellAssign(null);
                  setPatientSearchQuery('');
                }}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Règles métier & Instructions dynamiques */}
            <div className="bg-slate-50 border-b border-slate-150 p-3.5 space-y-2">
              <div className="flex gap-2 items-start text-[11px] text-indigo-900 bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-xl">
                <ShieldAlert className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-extrabold">Restriction de Rôle :</span> Vous visualisez et pouvez planifier uniquement les patients autorisés selon votre rôle (<span className="font-black text-indigo-700">{userFloorLabel ? `Patients de l'étage ${userFloorLabel}` : 'Tous les étages'}</span>).
                </div>
              </div>
              
              <div className="flex gap-2 items-start text-[11px] text-amber-900 bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl">
                <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-extrabold">Règlement sans abonnement :</span> Les patients sans abonnement actif sont éligibles (sauf type Enfant IMC). Le règlement se fait <span className="font-black text-amber-700">en espèces</span> et sera versé en caisse <span className="font-black">Abonnement / Autres Soins</span> dès validation par l'Admin.
                </div>
              </div>
            </div>

            {/* Champ de recherche */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou téléphone..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F2D37] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Liste de sélection des patients */}
            <div className="p-4 overflow-y-auto max-h-[380px] custom-scrollbar flex-1 bg-white">
              {eligiblePatientsFiltered.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-extrabold text-slate-600">Aucun patient éligible trouvé.</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Vérifiez que le patient correspond aux critères d'éligibilité pour votre rôle ou étage affecté.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase tracking-widest text-[9px] font-black">
                      <tr>
                        <th className="p-2.5 pl-3.5">Nom &amp; Prénom</th>
                        <th className="p-2.5 text-center">Étage</th>
                        <th className="p-2.5 text-center">Type Abonnement</th>
                        <th className="p-2.5 text-right pr-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eligiblePatientsFiltered.map(p => {
                        const patFloor = getPatientFloorLabel(p);
                        const hasAbn = !!getPatientActiveAbonnement(p.ID_Patient);

                        return (
                          <tr 
                            key={`modal-patient-${p.ID_Patient}`}
                            onDoubleClick={() => handleAssignPatient(p.ID_Patient)}
                            className="hover:bg-slate-50 border-b border-slate-100 transition duration-150 cursor-pointer select-none group"
                            title="Double-cliquez pour sélectionner directement !"
                          >
                            <td className="p-3 pl-3.5">
                              <span className="font-extrabold text-slate-800 block text-xs">{p.Nom_Patient}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.phone || 'Pas de téléphone'}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-blue-50 text-blue-800 border border-blue-100 text-[9px] font-black rounded px-2 py-0.5">
                                {patFloor}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {hasAbn ? (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-black rounded px-2 py-0.5 inline-flex items-center gap-0.5">
                                  ✓ Forfait Actif
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-800 border border-amber-100 text-[9px] font-black rounded px-2 py-0.5 inline-flex items-center gap-0.5">
                                  💵 Espèces (Sans Abn)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-3.5">
                              <button
                                type="button"
                                onClick={() => handleAssignPatient(p.ID_Patient)}
                                className="bg-[#0F2D37] hover:bg-[#1D4452] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer active:scale-95 shadow-sm group-hover:bg-[#1D4452]"
                              >
                                Sélectionner
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveCellAssign(null);
                  setPatientSearchQuery('');
                }}
                className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-3xs"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2 : GESTION DES PRÉSENCES DES PRATICIENS ================= */}
      {showPresenceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            
            <div className="bg-[#0F2D37] text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm font-sans flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-teal-400" />
                  <span>Présences des Thérapeutes du Jour</span>
                </h3>
                <p className="text-[10.5px] text-[#a2cbcd] font-mono mt-0.5">Configuration exclusive Admin/Assistante • Date : {selectedDate}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPresenceModal(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consigne */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3.5">
              <div className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed">
                <ShieldAlert className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0" />
                <div>
                  Cochez les praticiens présents ce jour. Leur planning horaire par créneaux d'une heure apparaîtra immédiatement en lecture pour l'ensemble des réceptionnistes.
                </div>
              </div>

              {/* Tout Sélectionner / Désélectionner */}
              <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[9.5px] text-slate-500 font-extrabold uppercase font-mono">
                  {tempPresenceIds.length} sélectionné(s) / {availablePrats.length} enregistrés
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAllPresence}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer select-none active:scale-95 shadow-3xs ${
                    allPratsCheckedInModal
                      ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  {allPratsCheckedInModal ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Tout désélectionner</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Tout sélectionner</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[350px] space-y-4 custom-scrollbar flex-1 bg-white">
              
              {/* SECTION ORTHOPHONISTES */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  🎙️ Orthophonistes ({orthophonistesList.length})
                </h4>
                {orthophonistesList.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic pl-1">Aucun orthophoniste enregistré dans la base.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {orthophonistesList.map(p => {
                      const isChecked = tempPresenceIds.includes(p.ID_Prat);
                      return (
                        <div 
                          key={`modal-ortho-${p.ID_Prat}`}
                          onClick={() => {
                            if (isChecked) {
                              setTempPresenceIds(tempPresenceIds.filter(id => id !== p.ID_Prat));
                            } else {
                              setTempPresenceIds([...tempPresenceIds, p.ID_Prat]);
                            }
                          }}
                          className={`p-3 rounded-xl border transition duration-150 flex items-center justify-between cursor-pointer ${
                            isChecked 
                              ? 'bg-amber-50/50 border-amber-300 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🗣️</span>
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">
                                Dr. {p.Prenom_Prat} {p.Nom_Prat}
                              </p>
                              <p className="text-[9px] text-slate-400 uppercase font-mono">ID Thérapeute : {p.ID_Prat}</p>
                            </div>
                          </div>

                          <div className="text-indigo-600">
                            {isChecked ? (
                              <CheckSquare className="w-4.5 h-4.5 text-amber-600 fill-amber-50" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION PSYCHOMOTRICIENNES */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  🧠 Psychomotriciennes / Psychologues ({psychomotList.length})
                </h4>
                {psychomotList.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic pl-1">Aucun psychomotricien enregistré.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {psychomotList.map(p => {
                      const isChecked = tempPresenceIds.includes(p.ID_Prat);
                      return (
                        <div 
                          key={`modal-psychomot-${p.ID_Prat}`}
                          onClick={() => {
                            if (isChecked) {
                              setTempPresenceIds(tempPresenceIds.filter(id => id !== p.ID_Prat));
                            } else {
                              setTempPresenceIds([...tempPresenceIds, p.ID_Prat]);
                            }
                          }}
                          className={`p-3 rounded-xl border transition duration-150 flex items-center justify-between cursor-pointer ${
                            isChecked 
                              ? 'bg-purple-50/50 border-purple-300 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🧠</span>
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">
                                Dr. {p.Prenom_Prat} {p.Nom_Prat}
                              </p>
                              <p className="text-[9px] text-slate-400 uppercase font-mono">ID Thérapeute : {p.ID_Prat}</p>
                            </div>
                          </div>

                          <div className="text-indigo-600">
                            {isChecked ? (
                              <CheckSquare className="w-4.5 h-4.5 text-purple-600 fill-purple-50" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-extrabold italic font-sans">
                Renseignez au plus juste les présences réelles.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresenceModal(false)}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-3xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSavePresence}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-md"
                >
                  Valider &amp; Publier la Grille
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 3 : HISTORIQUE DES PROGRAMMES APPLIQUÉS ================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            
            <div className="bg-[#0F2D37] text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-extrabold text-sm font-sans">Registre de Validation Finale</h3>
                  <p className="text-[10.5px] text-[#a2cbcd] font-mono mt-0.5">Historique des séances validées et consommées / encaissées</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[450px] space-y-4 custom-scrollbar flex-1 bg-slate-50">
              
              {appliedHistory.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">Aucune validation n'a été enregistrée pour le moment.</p>
                  <p className="text-[10.5px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Dès que l'Admin valide une période quotidienne, les détails des séances décomptées et des encaissements apparaîtront ici.
                  </p>
                </div>
              ) : (
                appliedHistory.map((hist: any, histIdx: number) => (
                  <div key={`${hist.id || histIdx}-${histIdx}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2.5 gap-2">
                      <div>
                        <span className="bg-slate-100 text-slate-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-slate-200">
                          📅 {hist.date}
                        </span>
                        <span className="ml-2 bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-indigo-200">
                          {hist.period}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10.5px] text-slate-500 font-medium">Validé par : <span className="font-extrabold text-slate-700">{hist.appliedBy}</span></p>
                        <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">{hist.appliedAt}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-extrabold">
                        <span>Séances Validées ({hist.totalCount}) :</span>
                        <div className="flex gap-2 text-[9.5px]">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Abonnement : {hist.debitedCount || 0}</span>
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Espèces : {hist.cashSalesCount || 0}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {hist.details?.map((detail: any, dIdx: number) => (
                          <div key={`detail-${dIdx}`} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between space-y-1">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-800 text-[11px]">{detail.patientName}</span>
                                <span className="text-[9.5px] text-slate-500 font-mono font-bold">{detail.hour}</span>
                              </div>
                              <p className="text-[9.5px] text-[#2c7a7b] font-bold mt-0.5">Thérapeute : {detail.pratName}</p>
                              
                              <div className="mt-1 flex flex-wrap gap-1">
                                <span className="inline-flex items-center text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded border bg-white text-slate-700 border-slate-200">
                                  {detail.natureActe}
                                </span>
                                {detail.payMethod === 'Abonnement' ? (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[7.5px] font-black rounded px-1.5 py-0.5 uppercase tracking-wider">
                                    Forfait
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-100 text-[7.5px] font-black rounded px-1.5 py-0.5 uppercase tracking-wider">
                                    Espèces
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="border-t border-slate-250/50 mt-1.5 pt-1 flex items-center justify-between text-[8.5px] text-slate-400">
                              <span>Débit / Caisse :</span>
                              <span className="font-extrabold text-slate-600 truncate max-w-[130px]" title={detail.packLabel}>
                                {detail.packLabel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-3xs"
              >
                Fermer l'Historique
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= TIMELINE DE SÉCURITÉ ET TRAÇABILITÉ (Visible par Admin) ================= */}
      {isUserAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2 gap-2">
            <div>
              <h2 className="text-[#0F2D37] font-black text-xs font-sans flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Registre d'Audit &amp; Traçabilité (Admin)</span>
              </h2>
              <p className="text-slate-400 text-[9px] mt-0.5">
                Historique des planifications et validations quotidiennes avec horodatage et identifiant opérateur.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (confirm("Voulez-vous vraiment effacer le journal d'audit local ?")) {
                  setSecurityLogs([]);
                  localStorage.removeItem('ortho_psycho_security_logs');
                  triggerToast("Journal d'audit réinitialisé.", "info");
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer active:scale-95 flex items-center gap-1 self-start sm:self-auto shadow-3xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          </div>

          {securityLogs.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-[10px] italic">
              Aucun événement n'est encore enregistré dans le registre d'audit pour cette session.
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="max-h-[180px] overflow-y-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[8px] font-black sticky top-0 z-10">
                    <tr>
                      <th className="p-1.5 pl-2.5">Horodatage (Paris)</th>
                      <th className="p-1.5">Opérateur</th>
                      <th className="p-1.5">Rôle</th>
                      <th className="p-1.5">Événement / Action</th>
                      <th className="p-1.5 pr-2.5">Détail des opérations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {securityLogs.map((log, idx) => (
                      <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/50 transition">
                        <td className="p-1.5 pl-2.5 font-mono text-slate-500 text-[9px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="p-1.5 font-bold text-slate-700 whitespace-nowrap">
                          {log.utilisateur}
                        </td>
                        <td className="p-1.5 whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                            log.role === 'Admin' || log.role === 'Administrateur'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : log.role === 'Assistante'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-teal-50 text-teal-700 border border-teal-100'
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="p-1.5 font-extrabold text-indigo-950 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="p-1.5 pr-2.5 text-slate-600 font-medium text-[9px] leading-snug break-words">
                          {log.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
