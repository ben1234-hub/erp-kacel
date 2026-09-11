import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Patient, Rendez_Vous, Abonnement, timesOverlap, isSubscriptionCoveringActe, getRemainingSessions, PatientEnPause } from '../dbStore';
import { 
  Calendar, Users, UserCheck, Clock, CheckCircle2, XCircle, 
  Trash2, Plus, Info, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, UserMinus, ShieldAlert, Award,
  History, Check, Lock, Eye, CheckCircle, RefreshCw, Maximize2, Minimize2, Search, Layers, Sparkles,
  GripVertical, Upload, Copy, ArrowDown, Pause, Coffee, AlertTriangle, X, User
} from 'lucide-react';

interface IntensifSchedulerProps {
  dbState: DatabaseState;
  onSave: (state: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currentUser: any;
  /**
   * 'Intensif 2e' | 'Intensif 3e' | 'Intensif 4e'
   */
  serviceName: string;
  floorZoneId: number; // 4 for Etage 2, 5 for Etage 3, 6 for Etage 4
  break1Start: string; // e.g., '12:00'
  break1End: string;   // e.g., '13:00'
  onUpdateBreaks?: (zoneId: number, start: string, end: string) => void;
  selectedDate?: string;
  setSelectedDate?: (d: string) => void;
  sidebarWidth?: number;
  isMenuVisible?: boolean;
}

const isSameDay = (d1: string, d2: string) => {
  if (!d1 || !d2) return false;
  const clean = (s: string) => {
    const parts = s.trim().split('-').map(Number);
    if (parts.length !== 3) return null;
    let y = 0, m = 0, d = 0;
    if (parts[0] > 100) {
      y = parts[0];
      m = parts[1];
      d = parts[2];
    } else if (parts[2] > 100) {
      d = parts[0];
      m = parts[1];
      y = parts[2];
    } else {
      return s.trim();
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const c1 = clean(d1);
  const c2 = clean(d2);
  if (!c1 || !c2) return d1.trim() === d2.trim();
  return c1 === c2;
};

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
  copy.patientsEnPause = source.patientsEnPause ? [...source.patientsEnPause] : [];
  return copy as DatabaseState;
};

export const IntensifScheduler: React.FC<IntensifSchedulerProps> = ({
  dbState,
  onSave,
  triggerToast,
  currentUser,
  serviceName,
  floorZoneId,
  break1Start = '12:00',
  break1End = '13:00',
  onUpdateBreaks,
  selectedDate: propSelectedDate,
  setSelectedDate: propSetSelectedDate,
  sidebarWidth = 320,
  isMenuVisible = true
}) => {
  const [localSelectedDate, setLocalSelectedDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : localSelectedDate;
  const setSelectedDate = propSetSelectedDate !== undefined ? propSetSelectedDate : setLocalSelectedDate;
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showEssaisModal, setShowEssaisModal] = useState<boolean>(false);
  const [essasQuery, setEssasQuery] = useState<string>('');
  const [selectedEssaisPatientId, setSelectedEssaisPatientId] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [fullScreenPeriod, setFullScreenPeriod] = useState<'matin' | 'soir'>('matin');

  // États pour le module de glisser-déposer (Drag & Drop)
  const [isDragPanelOpen, setIsDragPanelOpen] = useState<boolean>(false);
  const [isDockOpen, setIsDockOpen] = useState<boolean>(false); // fermé par défaut pour tous les services
  const [dragSearchQuery, setDragSearchQuery] = useState<string>('');
  const [draggingPatientId, setDraggingPatientId] = useState<number | null>(null);
  const [filterActiveAbnOnly, setFilterActiveAbnOnly] = useState<boolean>(true);
  const [dragOverCell, setDragOverCell] = useState<{ pratId: number; slotStart: string; period: 'matin' | 'soir' } | null>(null);

  // États pour le séparateur ajustable
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const isResizing = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Patients en pause pour le service courant, synchronisés via dbState
  const patientsEnPause = useMemo(() => {
    return (dbState.patientsEnPause || []).filter(
      p => p.service === serviceName
    );
  }, [dbState.patientsEnPause, serviceName]);

  const handleDropToPause = (patient: any, sourceRdvId: number, isDuplicate?: boolean) => {
    if (currentUser.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'a pas les droits pour modifier la planification.", "error");
      return;
    }

    const fresh = cloneState(dbState);
    const oldRdv = fresh.rendezVous.find(r => r.ID_RDV === sourceRdvId);
    if (!oldRdv) {
      triggerToast("Rendez-vous introuvable.", "error");
      return;
    }

    // Trouver le praticien d'origine
    const practitioner = fresh.praticiens.find(p => p.ID_Prat === oldRdv.ID_Prat);
    const pratName = practitioner ? (practitioner.Pseudo || practitioner.Prenom_Prat || "Kiné") : "Kiné";

    // Créer l'objet PatientEnPause avec un id_seance unique
    const uniqueIdSeance = `pause-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const patientPause: PatientEnPause = {
      idPatient: patient.ID_Patient,
      nom: patient.Nom_Patient,
      prenom: patient.Prenom_Patient || '',
      service: serviceName, // 'Intensif 2e', 'Intensif 3e', 'Intensif 4e'
      praticienOrigine: pratName,
      creneauOrigine: oldRdv.H_Debut_RDV,
      datePause: selectedDate || new Date().toISOString().split('T')[0],
      periode: oldRdv.H_Debut_RDV >= break1End ? 'soir' : 'matin',
      heurePause: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      id_seance: uniqueIdSeance,
      updatedAt: Date.now()
    };

    if (isDuplicate) {
      // === DUPLIQUER ===
      // Dans le cas d'une duplication, l'original reste intact dans son créneau d'origine.
      // On ne supprime pas le rendez-vous d'origine (oldRdv) et on ne décrémente pas les abonnements.
    } else {
      // === DÉPLACER (comportement normal) ===
      // 1. Ajuster les séances de l'abonnement et supprimer l'ancien rendez-vous
      const seanceIdx = fresh.seances.findIndex(s => s.ID_RDV === sourceRdvId);
      if (seanceIdx !== -1) {
        const seanceObj = fresh.seances[seanceIdx];
        const abnIdx = fresh.abonnements.findIndex(a => a.ID_Abn === seanceObj.ID_Abn);
        if (abnIdx !== -1) {
          fresh.abonnements[abnIdx] = {
            ...fresh.abonnements[abnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1),
            updatedAt: Date.now()
          };
        }
        fresh.seances = fresh.seances.filter(s => s.ID_RDV !== sourceRdvId);
      } else if (oldRdv.Statut_RDV === 'Honoré') {
        let activeAbnIdx = fresh.abonnements.findIndex(abn => 
          Number(abn.ID_Patient) === Number(oldRdv.ID_Patient) && 
          abn.Etat !== 'Fermé' &&
          isSubscriptionCoveringActe(abn, Number(oldRdv.ID_Acte), fresh)
        );
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(oldRdv.ID_Patient) && 
            isSubscriptionCoveringActe(abn, Number(oldRdv.ID_Acte), fresh)
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(oldRdv.ID_Patient) && 
            abn.Etat !== 'Fermé'
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(oldRdv.ID_Patient)
          );
        }
        if (activeAbnIdx !== -1) {
          fresh.abonnements[activeAbnIdx] = {
            ...fresh.abonnements[activeAbnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[activeAbnIdx].Nbre_Sean_Consom_Abn - 1),
            updatedAt: Date.now()
          };
        }
      }
      fresh.rendezVous = fresh.rendezVous.filter(r => r.ID_RDV !== sourceRdvId);
    }

    // 2. Ajouter au dock des patients en pause dans le dbState central
    if (!fresh.patientsEnPause) {
      fresh.patientsEnPause = [];
    }
    fresh.patientsEnPause = [...fresh.patientsEnPause, patientPause];

    // 3. Sauvegarder dbState
    onSave(fresh);

    if (isDuplicate) {
      triggerToast(`Copie de ${patient.Nom_Patient} ajoutée en pause (l'original reste planifié).`, 'success');
    } else {
      triggerToast(`${patient.Nom_Patient} a été mis en pause.`, 'success');
    }
  };;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // Garder les deux colonnes raisonnablement visibles (entre 35% et 65%)
      const clampedRatio = Math.max(35, Math.min(65, newRatio));
      setSplitRatio(clampedRatio);

      // Calculer dynamiquement les heures de pause déjeuner en fonction de la position du séparateur
      let start = '12:00';
      let end = '13:00';
      if (clampedRatio < 40) {
        start = '11:00';
        end = '12:00';
      } else if (clampedRatio < 48) {
        start = '11:30';
        end = '12:30';
      } else if (clampedRatio < 55) {
        start = '12:00';
        end = '13:00';
      } else if (clampedRatio < 61) {
        start = '12:30';
        end = '13:30';
      } else {
        start = '13:00';
        end = '14:00';
      }

      if (onUpdateBreaks) {
        onUpdateBreaks(floorZoneId, start, end);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [floorZoneId, onUpdateBreaks]);

  // Fonction de vérification stricte de l'abonnement du patient
  const verifierAbonnementPatient = (patient: Patient): boolean => {
    const abos = dbState.abonnements.filter(a => Number(a.ID_Patient) === Number(patient.ID_Patient));
    if (abos.length === 0) return false;

    // Trouver au moins un abonnement actif et non expiré
    const active = abos.find(a => {
      // Si l'Etat est explicitement défini, il doit être 'Actif'
      if (a.Etat && a.Etat !== 'Actif') return false;

      // Si le nombre de séances restantes est renseigné et vaut <= 0, l'abonnement est épuisé
      if (a.Seances_Restantes !== undefined && a.Seances_Restantes <= 0) return false;
      if (a.Seance_Restante !== undefined && a.Seance_Restante <= 0) return false;

      // Vérifier si la date d'expiration de l'abonnement est dépassée par rapport à selectedDate
      if (a.Date_Fin_Abonnement) {
        const expirationDate = new Date(a.Date_Fin_Abonnement);
        const currentDate = new Date(selectedDate);
        if (expirationDate < currentDate) return false;
      }

      return true;
    });

    return !!active;
  };

  const handleQuickRemoveAssignment = (rdvId: number) => {
    if (currentUser.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'a pas les droits pour modifier la planification.", "error");
      return;
    }

    const fresh = { ...dbState };
    const rdvObj = fresh.rendezVous.find(r => r.ID_RDV === rdvId);
    if (rdvObj) {
      let isCredited = false;

      // 1. Check if there is an associated active session
      const foundSeance = fresh.seances.find(s => s.ID_RDV === rdvId);
      if (foundSeance) {
        const abnIdx = fresh.abonnements.findIndex(a => a.ID_Abn === foundSeance.ID_Abn);
        if (abnIdx !== -1) {
          fresh.abonnements[abnIdx] = {
            ...fresh.abonnements[abnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1)
          };
          isCredited = true;
        }
        fresh.seances = fresh.seances.filter(s => s.ID_RDV !== rdvId);
      }

      // 2. Backup check
      if (!isCredited && rdvObj.Statut_RDV === 'Honoré') {
        let activeAbnIdx = fresh.abonnements.findIndex(abn => 
          Number(abn.ID_Patient) === Number(rdvObj.ID_Patient) && 
          abn.Etat !== 'Fermé' &&
          isSubscriptionCoveringActe(abn, Number(rdvObj.ID_Acte), fresh)
        );
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(rdvObj.ID_Patient) && 
            isSubscriptionCoveringActe(abn, Number(rdvObj.ID_Acte), fresh)
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(rdvObj.ID_Patient) && 
            abn.Etat !== 'Fermé'
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(rdvObj.ID_Patient)
          );
        }
        if (activeAbnIdx !== -1) {
          fresh.abonnements[activeAbnIdx] = {
            ...fresh.abonnements[activeAbnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[activeAbnIdx].Nbre_Sean_Consom_Abn - 1)
          };
          isCredited = true;
        }
      }

      // 3. Remove appointment
      fresh.rendezVous = fresh.rendezVous.filter(r => r.ID_RDV !== rdvId);

      onSave(fresh);
      triggerToast(
        "Patient libéré et renvoyé dans le dock inférieur !",
        "success"
      );
    }
  };

  // Liste des patients IMC affectés spécifiquement à cet étage
  const floorImcPatients = useMemo(() => {
    return dbState.patients.filter(p => {
      const isImc = p.type_patient === 'Enfant IMC';
      const targetServiceShort = serviceName; // ex: 'Intensif 2e'
      const matchAff = p.affectation === targetServiceShort || p.Affect_Pat_IMC === targetServiceShort;
      return isImc && matchAff;
    });
  }, [dbState.patients, serviceName]);

  // Patients IMC filtrés par recherche et état de l'abonnement
  const filteredFloorImcPatients = useMemo(() => {
    return floorImcPatients.filter(p => {
      if (filterActiveAbnOnly) {
        const hasActiveAbn = dbState.abonnements.some(a => Number(a.ID_Patient) === Number(p.ID_Patient) && (a.Etat === undefined || a.Etat === 'Actif'));
        if (!hasActiveAbn) return false;
      }
      
      const q = dragSearchQuery.trim().toLowerCase();
      if (!q) return true;
      const name = (p.Nom_Patient || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || city.includes(q);
    });
  }, [floorImcPatients, dbState.abonnements, dragSearchQuery, filterActiveAbnOnly]);

  const dockPatients = useMemo(() => {
    // 1. Filtrer les patients IMC de l'étage qui ont un abonnement valide
    const validAboPatients = floorImcPatients.filter(p => verifierAbonnementPatient(p));
    
    // 2. Filtrer ceux qui ne sont pas encore planifiés ce jour sur l'étage
    return validAboPatients.filter(p => {
      const isAlreadyPlanned = dbState.rendezVous.some(r => 
        isSameDay(r.Date_RDV, selectedDate) &&
        Number(r.ID_Patient) === Number(p.ID_Patient) &&
        r.Statut_RDV !== 'Annulé' &&
        r.Statut_RDV !== 'Absent'
      );
      return !isAlreadyPlanned;
    });
  }, [floorImcPatients, dbState.rendezVous, selectedDate, floorZoneId]);

  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFullScreenPeriod('soir');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFullScreenPeriod('matin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  const toggleFullScreen = () => {
    const element = document.getElementById('intensif-workspace');
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch((err) => {
        console.warn("L'API Plein Écran n'a pas pu être activée nativement (restriction d'iframe ou de droits). Mode simulation actif.", err);
        setIsFullScreen(!isFullScreen);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
        }).catch(() => {
          setIsFullScreen(!isFullScreen);
        });
      } else {
        setIsFullScreen(!isFullScreen);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);
  
  // Practitioners filters & checkboxes (Masseurs-Kinésithérapeutes / Aide-Kiné)
  const sortedKines = useMemo(() => {
    // Extract the floor number out of the service name (e.g., 'Intensif 3e' -> '3')
    const floorMatch = serviceName.match(/\d+/);
    const floorNum = floorMatch ? floorMatch[0] : null;

    // Match the floorZoneId to the exact Service ID:
    // - Zone 4 (Étage 2) -> Service ID 3
    // - Zone 5 (Étage 3) -> Service ID 4
    // - Zone 6 (Étage 4) -> Service ID 5
    const expectedSceId = floorZoneId === 4 ? 3 : floorZoneId === 5 ? 4 : floorZoneId === 6 ? 5 : null;

    return dbState.praticiens
      .filter(p => {
        // Must be a Masseur-Kinésithérapeute/Aide-Kiné (K)
        if (p.Repere !== 'K') return false;

        // 1. Check if practitioner matches the expected Service ID directly
        if (expectedSceId !== null && p.ID_Sce === expectedSceId) {
          return true;
        }

        // 2. Retrieve the service associated with this practitioner to check fallback names
        const service = dbState.services.find(s => s.ID_Sce === p.ID_Sce);
        if (!service) return false;

        const libelle = service.Libelle_Sce.toLowerCase();

        // 3. Check if service name matches exactly the floor service name
        if (service.Libelle_Sce.toLowerCase() === serviceName.toLowerCase()) {
          return true;
        }

        // 4. Check if service relates to intensif on this specific floor number (e.g. '3' for Floor 3)
        if (floorNum && libelle.includes('intensif') && (libelle.includes(floorNum) || libelle.includes(`${floorNum}e`))) {
          return true;
        }

        return false;
      })
      .sort((a, b) => {
        // Sort by Genre ('F' first, then 'H')
        if (a.Genre_Prat !== b.Genre_Prat) {
          return a.Genre_Prat === 'F' ? -1 : 1;
        }
        // Sort by order of name alphabetically
        const nameA = `${a.Nom_Prat} ${a.Prenom_Prat}`.toLowerCase();
        const nameB = `${b.Nom_Prat} ${b.Prenom_Prat}`.toLowerCase();
        return nameA.localeCompare(nameB, 'fr');
      });
  }, [dbState.praticiens, dbState.services, serviceName]);

  const isAuthorizedReceptionniste = useMemo(() => {
    if (!currentUser) return false;
    if (floorZoneId === 4 && currentUser.Role === 'Receptionniste Intensif 2e') return true;
    if (floorZoneId === 5 && currentUser.Role === 'Receptionniste Intensif 3e') return true;
    if (floorZoneId === 6 && currentUser.Role === 'Receptionniste Intensif 4e') return true;
    return false;
  }, [currentUser, floorZoneId]);

  // Synchronized present practitioners and exclusions from dbState with fallback to localStorage
  const presentPratIds = useMemo(() => {
    const key = `${selectedDate}_zone_${floorZoneId}`;
    if (dbState.intensifPresence?.[key]) {
      return dbState.intensifPresence[key];
    }
    const saved = localStorage.getItem(`intensif_present_kines_${selectedDate}_zone_${floorZoneId}`);
    return saved ? JSON.parse(saved) : [];
  }, [dbState.intensifPresence, selectedDate, floorZoneId]);

  const hasPresence = useMemo(() => {
    return presentPratIds.length > 0;
  }, [presentPratIds]);

  const [tempSelectedPratIds, setTempSelectedPratIds] = useState<number[]>([]);

  const excludedMatinPratIds = useMemo(() => {
    const key = `${selectedDate}_zone_${floorZoneId}`;
    if (dbState.intensifExcludedMatin?.[key]) {
      return dbState.intensifExcludedMatin[key];
    }
    const saved = localStorage.getItem(`intensif_excluded_matin_${selectedDate}_zone_${floorZoneId}`);
    return saved ? JSON.parse(saved) : [];
  }, [dbState.intensifExcludedMatin, selectedDate, floorZoneId]);

  const excludedSoirPratIds = useMemo(() => {
    const key = `${selectedDate}_zone_${floorZoneId}`;
    if (dbState.intensifExcludedSoir?.[key]) {
      return dbState.intensifExcludedSoir[key];
    }
    const saved = localStorage.getItem(`intensif_excluded_soir_${selectedDate}_zone_${floorZoneId}`);
    return saved ? JSON.parse(saved) : [];
  }, [dbState.intensifExcludedSoir, selectedDate, floorZoneId]);

  const hasPraticienEnPause = useMemo(() => {
    const anyPratStatusPause = dbState.praticiens.some((p: any) => 
      p.statut === 'pause' || p.Statut === 'pause' || 
      p.statut === 'Pause' || p.Statut === 'Pause'
    );
    const hasExclusion = excludedMatinPratIds.length > 0 || excludedSoirPratIds.length > 0;
    return anyPratStatusPause || hasExclusion;
  }, [dbState.praticiens, excludedMatinPratIds, excludedSoirPratIds]);

  // Selected checkbox states for deleting/removing practitioners on the table
  const [checkedMatinPratIds, setCheckedMatinPratIds] = useState<number[]>([]);
  const [checkedSoirPratIds, setCheckedSoirPratIds] = useState<number[]>([]);

  // Cell overlay/Modal selection state
  const [activeCell, setActiveCell] = useState<{ pratId: number; start: string; end: string } | null>(null);
  const [intensifSearchQuery, setIntensifSearchQuery] = useState('');
  const [optionsPatient, setOptionsPatient] = useState<Patient | null>(null);

  // Synchronize present practitioners and exclusions when date or zone changes
  useEffect(() => {
    const key = `${selectedDate}_zone_${floorZoneId}`;
    const presenceMap = dbState.intensifPresence || {};
    const hasPresence = presenceMap[key] !== undefined ? presenceMap[key].length > 0 : localStorage.getItem(`intensif_present_kines_${selectedDate}_zone_${floorZoneId}`) !== null;
    
    if (!hasPresence) {
      if (isAuthorizedReceptionniste) {
        setShowSessionModal(true);
      } else {
        setShowSessionModal(false);
      }
      setTempSelectedPratIds([]);
    } else {
      setShowSessionModal(false);
    }

    setCheckedMatinPratIds([]);
    setCheckedSoirPratIds([]);
  }, [selectedDate, floorZoneId, dbState.intensifPresence, isAuthorizedReceptionniste]);

  // Dynamic time slots generation based on admin lunch break
  const morningSlots = useMemo(() => {
    const startHour = 8;
    const endHour = parseInt(break1Start.split(':')[0]) || 12;
    const slots: { start: string; end: string }[] = [];
    
    for (let h = startHour; h < endHour; h++) {
      const s = `${String(h).padStart(2, '0')}:00`;
      const e = `${String(h + 1).padStart(2, '0')}:00`;
      slots.push({ start: s, end: e });
    }
    return slots;
  }, [break1Start]);

  const eveningSlots = useMemo(() => {
    const startHour = parseInt(break1End.split(':')[0]) || 13;
    const endHour = 17;
    const slots: { start: string; end: string }[] = [];
    
    for (let h = startHour; h < endHour; h++) {
      const s = `${String(h).padStart(2, '0')}:00`;
      const e = `${String(h + 1).padStart(2, '0')}:00`;
      slots.push({ start: s, end: e });
    }
    return slots;
  }, [break1End]);

  // Filter patients with Enfant IMC + this specific floor affectation + active abonnement
  const eligiblePatients = useMemo(() => {
    return dbState.patients.filter(p => {
      const isImc = p.type_patient === 'Enfant IMC';
      // Match affectation (e.g. 'Intensif 2e')
      const targetServiceShort = serviceName; // 'Intensif 2e', 'Intensif 3e', etc.
      const matchAff = p.affectation === targetServiceShort || p.Affect_Pat_IMC === targetServiceShort;
      
      // Check active subscription
      const hasActiveAbn = dbState.abonnements.some(a => a.ID_Patient === p.ID_Patient && (a.Etat === undefined || a.Etat === 'Actif'));
      return isImc && matchAff && hasActiveAbn;
    });
  }, [dbState.patients, dbState.abonnements, serviceName]);

  const filteredEligiblePatients = useMemo(() => {
    const q = intensifSearchQuery.trim().toLowerCase();
    if (!q) return eligiblePatients;
    return eligiblePatients.filter(pat => {
      const full = `${pat.Nom_Patient || ''} ${pat.Prenom_Patient || ''}`.toLowerCase();
      const phone = (pat.phone || '').toLowerCase();
      return full.includes(q) || phone.includes(q);
    });
  }, [eligiblePatients, intensifSearchQuery]);

  // Read all patients affected/assigned to this current floor (Intensif 2e, 3e, etc.)
  const allFloorPatients = useMemo(() => {
    return dbState.patients.filter(p => {
      const aff = (p.affectation || '').toLowerCase().trim();
      const affIMC = (p.Affect_Pat_IMC || '').toLowerCase().trim();
      const target = serviceName.toLowerCase().trim();
      return aff === target || affIMC === target || aff.includes(target) || affIMC.includes(target);
    });
  }, [dbState.patients, serviceName]);

  // Filter these floor assigned patients by search term
  const filteredFloorPatients = useMemo(() => {
    const q = essasQuery.trim().toLowerCase();
    if (!q) return allFloorPatients;
    return allFloorPatients.filter(pat => {
      const full = `${pat.Nom_Patient || ''}`.toLowerCase();
      const phone = (pat.phone || '').toLowerCase();
      const doc = (pat.dossier_medical || '').toLowerCase();
      const city = (pat.city || '').toLowerCase();
      return full.includes(q) || phone.includes(q) || doc.includes(q) || city.includes(q);
    });
  }, [allFloorPatients, essasQuery]);

  // Check existing appointments on this date, this zone
  const activeAppointments = useMemo(() => {
    return dbState.rendezVous.filter(r => 
      isSameDay(r.Date_RDV, selectedDate) && 
      Number(r.ID_Zone) === Number(floorZoneId) &&
      r.Statut_RDV !== 'Annulé'
    );
  }, [dbState.rendezVous, selectedDate, floorZoneId]);

  // Combined present and programmed practitioners
  const getPratIdsToRender = (period: 'matin' | 'soir') => {
    const slots = period === 'matin' ? morningSlots : eveningSlots;
    const practitionersWithApps = activeAppointments
      .filter(a => slots.some(slot => slot.start === a.H_Debut_RDV))
      .map(a => a.ID_Prat);

    const baseList = Array.from(new Set([...presentPratIds, ...practitionersWithApps]));
    const exclusions = period === 'matin' ? excludedMatinPratIds : excludedSoirPratIds;
    return baseList.filter(id => !exclusions.includes(id));
  };

  // Exclude practitioner from a specific period (retirer si n'a pas travaillé)
  const handleExcludePrat = (pratId: number, period: 'matin' | 'soir') => {
    const slots = period === 'matin' ? morningSlots : eveningSlots;
    const hasWorked = activeAppointments.some(a => 
      a.ID_Prat === pratId && 
      slots.some(slot => slot.start === a.H_Debut_RDV)
    );

    if (hasWorked) {
      triggerToast("Impossible de retirer cet aide-kiné car il a déjà travaillé (séances planifiées ou honorées) durant cette période.", "error");
      return;
    }

    const key = `${selectedDate}_zone_${floorZoneId}`;

    if (period === 'matin') {
      const updated = [...excludedMatinPratIds, pratId];
      localStorage.setItem(`intensif_excluded_matin_${selectedDate}_zone_${floorZoneId}`, JSON.stringify(updated));
      setCheckedMatinPratIds(checkedMatinPratIds.filter(id => id !== pratId));
      
      const nextDb = {
        ...dbState,
        intensifExcludedMatin: {
          ...(dbState.intensifExcludedMatin || {}),
          [key]: updated
        }
      };
      onSave(nextDb);
    } else {
      const updated = [...excludedSoirPratIds, pratId];
      localStorage.setItem(`intensif_excluded_soir_${selectedDate}_zone_${floorZoneId}`, JSON.stringify(updated));
      setCheckedSoirPratIds(checkedSoirPratIds.filter(id => id !== pratId));
      
      const nextDb = {
        ...dbState,
        intensifExcludedSoir: {
          ...(dbState.intensifExcludedSoir || {}),
          [key]: updated
        }
      };
      onSave(nextDb);
    }
    triggerToast("L'aide-kiné a été retiré de cette période avec succès.", "success");
  };

  // Helper inside component to check if a period has any scheduled updates
  const hasPendingUpdates = (period: 'matin' | 'soir') => {
    const slots = period === 'matin' ? morningSlots : eveningSlots;
    return activeAppointments.some(a => 
      slots.some(slot => slot.start === a.H_Debut_RDV) && 
      a.Statut_RDV === 'Planifié'
    );
  };

  // Remove patient assignment
  const handleRemoveAssignment = (rdvId: number) => {
    if (currentUser.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'a pas les droits pour modifier la planification.", "error");
      return;
    }

    if (!window.confirm("Voulez-vous vraiment retirer ce patient de la planification ?")) {
      return;
    }

    const fresh = { ...dbState };
    const rdvObj = fresh.rendezVous.find(r => r.ID_RDV === rdvId);
    if (rdvObj) {
      let isCredited = false;

      // 1. Check if there is an associated active session in fresh.seances
      const foundSeance = fresh.seances.find(s => s.ID_RDV === rdvId);
      if (foundSeance) {
        // Decrement using the stored subscription ID
        const abnIdx = fresh.abonnements.findIndex(a => a.ID_Abn === foundSeance.ID_Abn);
        if (abnIdx !== -1) {
          fresh.abonnements[abnIdx] = {
            ...fresh.abonnements[abnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1),
            updatedAt: Date.now()
          };
          isCredited = true;
        }
        // Remove from the seances log
        fresh.seances = fresh.seances.filter(s => s.ID_RDV !== rdvId);
      }

      // 2. If no seance record was stored but the status is "Honoré", do a backup lookup
      if (!isCredited && rdvObj.Statut_RDV === 'Honoré') {
        let activeAbnIdx = fresh.abonnements.findIndex(abn => 
          Number(abn.ID_Patient) === Number(rdvObj.ID_Patient) && 
          abn.Etat !== 'Fermé' &&
          isSubscriptionCoveringActe(abn, Number(rdvObj.ID_Acte), fresh)
        );
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(rdvObj.ID_Patient) && 
            isSubscriptionCoveringActe(abn, Number(rdvObj.ID_Acte), fresh)
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(rdvObj.ID_Patient) && 
            abn.Etat !== 'Fermé'
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(rdvObj.ID_Patient)
          );
        }
        if (activeAbnIdx !== -1) {
          fresh.abonnements[activeAbnIdx] = {
            ...fresh.abonnements[activeAbnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[activeAbnIdx].Nbre_Sean_Consom_Abn - 1),
            updatedAt: Date.now()
          };
          isCredited = true;
        }
      }

      // 3. Remove the appointment entirely from rendezVous list to free the slot
      fresh.rendezVous = fresh.rendezVous.filter(r => r.ID_RDV !== rdvId);

      onSave(fresh);
      triggerToast(
        isCredited 
          ? "Le patient a été retiré de la planification et son crédit d'abonnement a été restitué avec succès !"
          : "Le patient a été retiré de la planification avec succès !", 
        "success"
      );
    }
    setActiveCell(null);
  };

  // Assign candidate patient to cell
  const handleAssignPatient = (patient: Patient, overrideActeId?: number) => {
    if (!activeCell) return;
    if (currentUser.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'a pas les droits pour modifier la planification.", "error");
      return;
    }

    const { pratId, start, end } = activeCell;

    // Check Rule: "Un patient ne doit pas figurer 2 fois sur la même heure"
    const patientOverlap = dbState.rendezVous.some(r => 
      isSameDay(r.Date_RDV, selectedDate) &&
      r.H_Debut_RDV === start &&
      r.ID_Patient === patient.ID_Patient &&
      r.Statut_RDV !== 'Annulé' &&
      r.Statut_RDV !== 'Absent'
    );

    if (patientOverlap) {
      triggerToast(`Erreur d'enclenchement : ${patient.Nom_Patient} figure déjà sur ce créneau horaire (${start}) de ce jour.`, 'error');
      return;
    }

    // Récupérer les planifications ortho/psycho pour le contrôle de double réservation
    const savedOrtho = localStorage.getItem('ortho_psycho_assignments');
    if (savedOrtho) {
      try {
        const orthoGrid = JSON.parse(savedOrtho);
        const orthoConflictKey = Object.keys(orthoGrid).find(key => {
          const parts = key.split('_');
          if (parts.length < 3) return false;
          const [date, , orthoHour] = parts;
          if (!isSameDay(date, selectedDate)) return false;
          
          const assign = orthoGrid[key];
          const pId = assign && typeof assign === 'object' ? assign.patientId : assign;
          if (Number(pId) !== patient.ID_Patient) return false;

          // Chaque créneau Ortho/Psycho dure 1 heure (par ex. orthoHour -> orthoHour + 1)
          const orthoStart = orthoHour;
          const orthoEnd = `${String(parseInt(orthoHour.split(':')[0], 10) + 1).padStart(2, '0')}:00`;
          return timesOverlap(start, end, orthoStart, orthoEnd);
        });

        if (orthoConflictKey) {
          const parts = orthoConflictKey.split('_');
          const orthoHour = parts[2];
          const orthoPratId = Number(parts[1]);
          const orthoPrat = dbState.praticiens.find(p => p.ID_Prat === orthoPratId);
          const name = orthoPrat ? `${orthoPrat.Prenom_Prat} ${orthoPrat.Nom_Prat}` : 'un spécialiste';
          triggerToast(`Double réservation interdite : ${patient.Nom_Patient} a déjà une séance planifiée aujourd'hui à ${orthoHour} avec ${name} (Ortho/Psycho).`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Checking if an Aide-Kiné works with only 1 patient per session in the same zone/service
    const kinéOverlap = dbState.rendezVous.some(r =>
      isSameDay(r.Date_RDV, selectedDate) &&
      r.H_Debut_RDV === start &&
      r.ID_Prat === pratId &&
      Number(r.ID_Zone) === Number(floorZoneId) &&
      r.Statut_RDV !== 'Annulé' &&
      r.Statut_RDV !== 'Absent'
    );

    if (kinéOverlap) {
      triggerToast("Ce kinésithérapeute est déjà affecté à un autre patient sur ce créneau horaire.", "error");
      return;
    }

    // Active subscription verification
    const activeAbn = dbState.abonnements.find(a => a.ID_Patient === patient.ID_Patient && (a.Etat === undefined || a.Etat === 'Actif'));
    if (!activeAbn) {
      triggerToast("Ce patient n'a aucun abonnement actif.", "error");
      return;
    }

    const fresh = cloneState(dbState);
    
    // Add Appointment entry
    const nextRdvId = fresh.rendezVous.length > 0 
      ? Math.max(...fresh.rendezVous.map(r => r.ID_RDV)) + 1 
      : 1;

    const chosenActeId = overrideActeId || 10;

    const newRdv: Rendez_Vous = {
      ID_RDV: nextRdvId,
      ID_Patient: patient.ID_Patient,
      ID_Prat: pratId,
      ID_Acte: chosenActeId, // Dynamic Acte ID (Intensif 10 by default or chosen option)
      ID_Type_Plan: 3, // Service Intensif Group Category
      ID_Zone: floorZoneId,
      ID_Utilisateur: currentUser.ID_Utilisateur || 1,
      Date_RDV: selectedDate,
      H_Debut_RDV: start,
      H_Fin_RDV: end,
      Statut_RDV: 'Planifié',
      updatedAt: Date.now()
    };

    fresh.rendezVous = [...fresh.rendezVous, newRdv];

    // Retirer le patient de la pause dans le dbState central
    if (fresh.patientsEnPause) {
      fresh.patientsEnPause = fresh.patientsEnPause.filter(
        p => !(String(p.idPatient) === String(patient.ID_Patient) && p.service === serviceName)
      );
    }

    onSave(fresh);

    triggerToast(`Patient ${patient.Nom_Patient} rattaché avec succès au programme de ${start} !`, 'success');
    setActiveCell(null);
  };

  // Assignation directe via Glisser-Déposer (Drag & Drop)
  const handleDragDropAssign = (patient: Patient, pratId: number, start: string, end: string, sourceRdvId?: number | null, isDuplicate?: boolean, id_seance?: string | number) => {
    if (currentUser.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'a pas les droits pour modifier la planification.", "error");
      return;
    }

    const sourceRdvObj = sourceRdvId ? dbState.rendezVous.find(r => r.ID_RDV === sourceRdvId) : null;
    if (sourceRdvObj && sourceRdvObj.ID_Prat === pratId && sourceRdvObj.H_Debut_RDV === start) {
      // Déposé sur la même cellule, aucun changement nécessaire
      return;
    }

    // Règle 1 : Un patient ne doit pas figurer 2 fois sur la même heure
    const patientOverlap = dbState.rendezVous.some(r => 
      isSameDay(r.Date_RDV, selectedDate) &&
      r.H_Debut_RDV === start &&
      Number(r.ID_Patient) === Number(patient.ID_Patient) &&
      r.Statut_RDV !== 'Annulé' &&
      r.Statut_RDV !== 'Absent' &&
      (!sourceRdvId || isDuplicate || r.ID_RDV !== sourceRdvId)
    );

    if (patientOverlap) {
      triggerToast(`Erreur d'enclenchement : ${patient.Nom_Patient} figure déjà sur ce créneau horaire (${start}) de ce jour.`, 'error');
      return;
    }

    // Règle 2 : Double réservation Ortho/Psycho
    const savedOrtho = localStorage.getItem('ortho_psycho_assignments');
    if (savedOrtho) {
      try {
        const orthoGrid = JSON.parse(savedOrtho);
        const orthoConflictKey = Object.keys(orthoGrid).find(key => {
          const parts = key.split('_');
          if (parts.length < 3) return false;
          const [date, , orthoHour] = parts;
          if (!isSameDay(date, selectedDate)) return false;
          
          const assign = orthoGrid[key];
          const pId = assign && typeof assign === 'object' ? assign.patientId : assign;
          if (Number(pId) !== patient.ID_Patient) return false;

          const orthoStart = orthoHour;
          const orthoEnd = `${String(parseInt(orthoHour.split(':')[0], 10) + 1).padStart(2, '0')}:00`;
          return timesOverlap(start, end, orthoStart, orthoEnd);
        });

        if (orthoConflictKey) {
          const parts = orthoConflictKey.split('_');
          const orthoHour = parts[2];
          const orthoPratId = Number(parts[1]);
          const orthoPrat = dbState.praticiens.find(p => p.ID_Prat === orthoPratId);
          const name = orthoPrat ? `${orthoPrat.Prenom_Prat} ${orthoPrat.Nom_Prat}` : 'un spécialiste';
          triggerToast(`Double réservation interdite : ${patient.Nom_Patient} a déjà une séance planifiée aujourd'hui à ${orthoHour} avec ${name} (Ortho/Psycho).`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Règle 3 : Kinésithérapeute libre sur ce créneau dans cette zone/service
    const kinéOverlap = dbState.rendezVous.some(r =>
      isSameDay(r.Date_RDV, selectedDate) &&
      r.H_Debut_RDV === start &&
      r.ID_Prat === pratId &&
      Number(r.ID_Zone) === Number(floorZoneId) &&
      r.Statut_RDV !== 'Annulé' &&
      r.Statut_RDV !== 'Absent'
    );

    if (kinéOverlap) {
      triggerToast("Ce kinésithérapeute est déjà affecté à un autre patient sur ce créneau horaire.", "error");
      return;
    }

    // Règle 4 : Forfait actif obligatoire
    const activeAbn = dbState.abonnements.find(a => Number(a.ID_Patient) === Number(patient.ID_Patient) && (a.Etat === undefined || a.Etat === 'Actif'));
    if (!activeAbn) {
      triggerToast(`Ce patient (${patient.Nom_Patient}) n'a aucun abonnement de rééducation actif.`, "error");
      return;
    }

    const fresh = cloneState(dbState);

    // Si on déplace le patient (pas de duplication), on supprime l'ancien rendez-vous
    if (sourceRdvId && !isDuplicate) {
      const oldRdv = fresh.rendezVous.find(r => r.ID_RDV === sourceRdvId);
      if (oldRdv) {
        const seanceIdx = fresh.seances.findIndex(s => s.ID_RDV === sourceRdvId);
        if (seanceIdx !== -1) {
          const seanceObj = fresh.seances[seanceIdx];
          const abnIdx = fresh.abonnements.findIndex(a => a.ID_Abn === seanceObj.ID_Abn);
          if (abnIdx !== -1) {
            fresh.abonnements[abnIdx] = {
              ...fresh.abonnements[abnIdx],
              Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1),
              updatedAt: Date.now()
            };
          }
          fresh.seances = fresh.seances.filter(s => s.ID_RDV !== sourceRdvId);
        } else if (oldRdv.Statut_RDV === 'Honoré') {
          let activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(oldRdv.ID_Patient) && 
            abn.Etat !== 'Fermé' &&
            isSubscriptionCoveringActe(abn, Number(oldRdv.ID_Acte), fresh)
          );
          if (activeAbnIdx === -1) {
            activeAbnIdx = fresh.abonnements.findIndex(abn => 
              Number(abn.ID_Patient) === Number(oldRdv.ID_Patient) && 
              isSubscriptionCoveringActe(abn, Number(oldRdv.ID_Acte), fresh)
            );
          }
          if (activeAbnIdx === -1) {
            activeAbnIdx = fresh.abonnements.findIndex(abn => 
              Number(abn.ID_Patient) === Number(oldRdv.ID_Patient) && 
              abn.Etat !== 'Fermé'
            );
          }
          if (activeAbnIdx === -1) {
            activeAbnIdx = fresh.abonnements.findIndex(abn => 
              Number(abn.ID_Patient) === Number(oldRdv.ID_Patient)
            );
          }
          if (activeAbnIdx !== -1) {
            fresh.abonnements[activeAbnIdx] = {
              ...fresh.abonnements[activeAbnIdx],
              Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[activeAbnIdx].Nbre_Sean_Consom_Abn - 1),
              updatedAt: Date.now()
            };
          }
        }
        fresh.rendezVous = fresh.rendezVous.filter(r => r.ID_RDV !== sourceRdvId);
      }
    }

    const nextRdvId = fresh.rendezVous.length > 0 
      ? Math.max(...fresh.rendezVous.map(r => r.ID_RDV)) + 1 
      : 1;

    const newRdv: Rendez_Vous = {
      ID_RDV: nextRdvId,
      ID_Patient: patient.ID_Patient,
      ID_Prat: pratId,
      ID_Acte: sourceRdvObj ? sourceRdvObj.ID_Acte : 10,
      ID_Type_Plan: 3,
      ID_Zone: floorZoneId,
      ID_Utilisateur: currentUser.ID_Utilisateur || 1,
      Date_RDV: selectedDate,
      H_Debut_RDV: start,
      H_Fin_RDV: end,
      Statut_RDV: 'Planifié',
      updatedAt: Date.now()
    };

    fresh.rendezVous = [...fresh.rendezVous, newRdv];

    // Retirer le patient de la pause dans le dbState central
    if (fresh.patientsEnPause) {
      if (id_seance) {
        fresh.patientsEnPause = fresh.patientsEnPause.filter(
          p => !(p.id_seance === id_seance)
        );
      } else {
        fresh.patientsEnPause = fresh.patientsEnPause.filter(
          p => !(String(p.idPatient) === String(patient.ID_Patient) && p.service === serviceName)
        );
      }
    }

    onSave(fresh);

    if (sourceRdvId && !isDuplicate) {
      triggerToast(`Séance de ${patient.Nom_Patient} déplacée avec succès de ${sourceRdvObj?.H_Debut_RDV} vers ${start} !`, 'success');
    } else if (sourceRdvId && isDuplicate) {
      triggerToast(`Séance de ${patient.Nom_Patient} à ${sourceRdvObj?.H_Debut_RDV} dupliquée avec succès vers ${start} !`, 'success');
    } else {
      triggerToast(`Patient ${patient.Nom_Patient} déposé et planifié avec succès à ${start} !`, 'success');
    }
  };

  // Dedulct sessions on active subscriptions when applying program
  const handleApplyProgram = (period: 'matin' | 'soir') => {
  if (currentUser.Role === 'Médecin MPR') {
    triggerToast("Le médecin MPR n'a pas les droits pour appliquer le programme.", "error");
    return;
  }

  const slots = period === 'matin' ? morningSlots : eveningSlots;
  const fresh = cloneState(dbState);
  
  const targetApps = activeAppointments.filter(a => {
    const isSlot = slots.some(slot => slot.start === a.H_Debut_RDV);
    return isSlot && a.Statut_RDV === 'Planifié';
  });

  console.log('=== DEBUG handleApplyProgram ===');
  console.log('Période:', period);
  console.log('Date:', selectedDate);
  console.log('Zone:', floorZoneId);
  console.log('Rendez-vous ciblés (Planifié):', targetApps.length);
  console.log('IDs RDV:', targetApps.map(r => r.ID_RDV));

  let debitedCount = 0;
  let horsForfaitCount = 0;

  targetApps.forEach(rdv => {
    console.log('--- Traitement RDV #', rdv.ID_RDV, 'Patient:', rdv.ID_Patient, 'Acte:', rdv.ID_Acte);

    // 1. Passage en Honoré
    const rdvIdx = fresh.rendezVous.findIndex(r => r.ID_RDV === rdv.ID_RDV);
    if (rdvIdx !== -1) {
      fresh.rendezVous[rdvIdx] = {
        ...fresh.rendezVous[rdvIdx],
        Statut_RDV: 'Honoré',
        updatedAt: Date.now()
      };
    }

    // 2. Anti-double déduction
    const alreadyHasSeance = fresh.seances.some(s => s.ID_RDV === rdv.ID_RDV);
    console.log('Déjà une séance pour ce RDV ?', alreadyHasSeance);
    if (alreadyHasSeance) {
      console.log('-> SKIP : séance déjà existante');
      return;
    }

    // 3. Recherche abonnement (étape par étape)
    let activeAbnIdx = fresh.abonnements.findIndex(abn => 
      Number(abn.ID_Patient) === Number(rdv.ID_Patient) && 
      abn.Etat !== 'Fermé' &&
      isSubscriptionCoveringActe(abn, Number(rdv.ID_Acte), fresh) &&
      getRemainingSessions(abn, fresh) > 0
    );
    console.log('Recherche 1 (Etat!=Fermé + acte couvert + solde>0):', activeAbnIdx);

    if (activeAbnIdx === -1) {
      activeAbnIdx = fresh.abonnements.findIndex(abn => 
        Number(abn.ID_Patient) === Number(rdv.ID_Patient) && 
        abn.Etat !== 'Fermé' &&
        isSubscriptionCoveringActe(abn, Number(rdv.ID_Acte), fresh)
      );
      console.log('Recherche 2 (Etat!=Fermé + acte couvert):', activeAbnIdx);
    }

    if (activeAbnIdx === -1) {
      activeAbnIdx = fresh.abonnements.findIndex(abn => 
        Number(abn.ID_Patient) === Number(rdv.ID_Patient) && 
        isSubscriptionCoveringActe(abn, Number(rdv.ID_Acte), fresh)
      );
      console.log('Recherche 3 (acte couvert seul):', activeAbnIdx);
    }

    if (activeAbnIdx === -1) {
      activeAbnIdx = fresh.abonnements.findIndex(abn => 
        Number(abn.ID_Patient) === Number(rdv.ID_Patient) && 
        abn.Etat !== 'Fermé'
      );
      console.log('Recherche 4 (Etat!=Fermé seul):', activeAbnIdx);
    }

    if (activeAbnIdx === -1) {
      activeAbnIdx = fresh.abonnements.findIndex(abn => 
        Number(abn.ID_Patient) === Number(rdv.ID_Patient)
      );
      console.log('Recherche 5 (n\'importe quel abo du patient):', activeAbnIdx);
    }

    if (activeAbnIdx === -1) {
      console.log('-> AUCUN abonnement trouvé pour ce patient !');
      horsForfaitCount++;
      return;
    }

    const abn = fresh.abonnements[activeAbnIdx];
    const remaining = getRemainingSessions(abn, fresh);
    console.log('Abonnement trouvé:', abn.ID_Abn, 'Pack:', abn.ID_Pack, 'Consommé:', abn.Nbre_Sean_Consom_Abn, 'Restant:', remaining);

    if (remaining > 0) {
      fresh.abonnements[activeAbnIdx] = {
        ...abn,
        Nbre_Sean_Consom_Abn: abn.Nbre_Sean_Consom_Abn + 1,
        updatedAt: Date.now()
      };
      debitedCount++;

      const nextSeanceId = fresh.seances.length > 0
        ? Math.max(...fresh.seances.map(s => s.ID_Seanc)) + 1
        : 1;

      fresh.seances = [...fresh.seances, {
        ID_Seanc: nextSeanceId,
        ID_Patient: rdv.ID_Patient,
        ID_Prat: rdv.ID_Prat,
        ID_Acte: rdv.ID_Acte,
        ID_Abn: abn.ID_Abn,
        ID_RDV: rdv.ID_RDV,
        H_Debut_Seanc: rdv.H_Debut_RDV,
        H_Fin_Seanc: rdv.H_Fin_RDV,
        Prix_Seanc: 0,
        Date_Seanc_Realisee: selectedDate,
        updatedAt: Date.now()
      }];
      console.log('-> DÉDUCTION OK, nouvelle séance #', nextSeanceId);
    } else {
      console.log('-> SOLDE ÉPUISÉ (remaining = 0)');
      horsForfaitCount++;
    }
  });

  console.log('RÉSULTAT FINAL — Débitées:', debitedCount, 'Hors-forfait:', horsForfaitCount);
  console.log('Abonnements modifiés:', fresh.abonnements.map(a => ({id: a.ID_Abn, consomme: a.Nbre_Sean_Consom_Abn})));
  console.log('Nouvelles séances:', fresh.seances.filter(s => targetApps.some(t => t.ID_RDV === s.ID_RDV)));

  onSave(fresh);

  triggerToast(
    `Programme appliqué ! ${debitedCount} séance(s) débitée(s).${horsForfaitCount > 0 ? ` (${horsForfaitCount} hors-forfait)` : ''}`,
    'success'
  );
};

  // Clear program for Intensif 2e, 3e, and 4e (slots 4, 5, 6)
  const handleClearProgram = (scope: 'selected_date' | 'all_dates') => {
    if (currentUser.Role === 'Médecin MPR') {
      triggerToast("Le médecin MPR n'a pas les droits pour modifier la planification.", "error");
      return;
    }

    if (!window.confirm(scope === 'selected_date' ? "Voulez-vous vraiment effacer TOUTES les séances de planification intensive pour la date sélectionnée ?" : "Voulez-vous vraiment effacer TOUTES les séances de planification intensive pour absolument toutes les dates ? Cette opération est irréversible !")) {
      return;
    }

    const fresh = { ...dbState };
    const targetZones = [4, 5, 6]; // Zones corresponding to Intensif 2e, 3e, and 4e

    const rdvToClear = fresh.rendezVous.filter(r => {
      // Convert ID_Zone to Number to guarantee safe match regardless of stored types (string/number)
      const matchZone = targetZones.includes(Number(r.ID_Zone));
      const matchDate = scope === 'selected_date' ? isSameDay(r.Date_RDV, selectedDate) : true;
      return matchZone && matchDate;
    });

    if (rdvToClear.length === 0) {
      triggerToast(`Aucune séance enregistrée à effacer pour ${scope === 'selected_date' ? 'cette date' : 'toutes les dates'}.`, 'info');
      return;
    }

    let restoredCount = 0;

    // Restores subscription credits for honored or registered sessions
    rdvToClear.forEach(r => {
      // 1. Check if there is an associated active session in fresh.seances
      const foundSeance = fresh.seances.find(s => s.ID_RDV === r.ID_RDV);
      if (foundSeance) {
        // Decrement using the stored subscription ID
        const abnIdx = fresh.abonnements.findIndex(a => a.ID_Abn === foundSeance.ID_Abn);
        if (abnIdx !== -1) {
          fresh.abonnements[abnIdx] = {
            ...fresh.abonnements[abnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1),
            updatedAt: Date.now()
          };
          restoredCount++;
        }
        // Remove from realized seances table
        fresh.seances = fresh.seances.filter(s => s.ID_RDV !== r.ID_RDV);
      } else if (r.Statut_RDV === 'Honoré') {
        // 2. Fallback check if the appointment status is "Honoré" but no seance record was stored
        let activeAbnIdx = fresh.abonnements.findIndex(abn => 
          Number(abn.ID_Patient) === Number(r.ID_Patient) && 
          abn.Etat !== 'Fermé' &&
          isSubscriptionCoveringActe(abn, Number(r.ID_Acte), fresh)
        );
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(r.ID_Patient) && 
            isSubscriptionCoveringActe(abn, Number(r.ID_Acte), fresh)
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(r.ID_Patient) && 
            abn.Etat !== 'Fermé'
          );
        }
        if (activeAbnIdx === -1) {
          activeAbnIdx = fresh.abonnements.findIndex(abn => 
            Number(abn.ID_Patient) === Number(r.ID_Patient)
          );
        }
        if (activeAbnIdx !== -1) {
          fresh.abonnements[activeAbnIdx] = {
            ...fresh.abonnements[activeAbnIdx],
            Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[activeAbnIdx].Nbre_Sean_Consom_Abn - 1),
            updatedAt: Date.now()
          };
          restoredCount++;
        }
      }
    });

    // Remove the appointments completely to leave the schedule grid clean & empty
    const idsToClear = rdvToClear.map(toClear => toClear.ID_RDV);
    fresh.rendezVous = fresh.rendezVous.filter(r => !idsToClear.includes(r.ID_RDV));

    // Clear the localStorage marks matching applied state
    if (scope === 'selected_date') {
      targetZones.forEach(zoneId => {
        localStorage.removeItem(`intensif_applied_${selectedDate}_zone_${zoneId}_matin`);
        localStorage.removeItem(`intensif_applied_${selectedDate}_zone_${zoneId}_soir`);
      });
      // Clean up specific history events matching selected date for our zones
      const historySaved = localStorage.getItem(`intensif_program_history`);
      if (historySaved) {
        const historyList = JSON.parse(historySaved);
        const filteredHistory = historyList.filter((h: any) => !(isSameDay(h.date, selectedDate) && targetZones.includes(h.zoneId)));
        localStorage.setItem(`intensif_program_history`, JSON.stringify(filteredHistory));
      }
    } else {
      // Clean all matching records from localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key) {
          const isAppliedMark = targetZones.some(zoneId => key.startsWith(`intensif_applied_`) && key.includes(`_zone_${zoneId}_`));
          if (isAppliedMark) {
            localStorage.removeItem(key);
          }
        }
      }
      localStorage.removeItem(`intensif_program_history`);
    }

    onSave(fresh);
    setShowClearModal(false);
    triggerToast(
      `Le programme des services Intensif 2e, 3e et 4e a été effacé avec succès ! ${rdvToClear.length} séance(s) effacée(s). ${restoredCount > 0 ? `${restoredCount} crédit(s) d'abonnement restitué(s).` : ''}`,
      'success'
    );
  };

  // Helper selectors for tracking applied program state
  const isPeriodApplied = (period: 'matin' | 'soir') => {
    return localStorage.getItem(`intensif_applied_${selectedDate}_zone_${floorZoneId}_${period}`) === 'true';
  };

  // Read current history index
  const availableHistory = useMemo(() => {
    const saved = localStorage.getItem(`intensif_program_history`);
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.filter((h: any) => h.zoneId === floorZoneId);
  }, [showHistoryModal, floorZoneId]);

  if (!hasPresence && !isAuthorizedReceptionniste) {
    return (
      <div 
        className={isFullScreen ? "fixed inset-0 z-50 bg-slate-100 overflow-y-auto p-6 md:p-10 custom-scrollbar flex items-center justify-center select-none" : "py-12 flex items-center justify-center min-h-[450px]"} 
        id="intensif-workspace"
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
          .font-arabic-elegant {
            font-family: 'Amiri', 'Noto Sans Arabic', 'Segoe UI', sans-serif !important;
          }
        `}</style>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-lg text-center shadow-md space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center relative">
            <Clock className="w-10 h-10 text-indigo-600 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-sm">
              <Lock className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans">
              En attente de la configuration des praticiens par la réceptionniste
            </h3>
            <p className="text-xs/relaxed text-slate-500 font-semibold max-w-sm mx-auto">
              La planification pour ce service ({serviceName}) à la date du <strong className="text-indigo-600 font-mono">{selectedDate}</strong> n'a pas encore été initialisée.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-left flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px]/relaxed text-slate-600 font-medium">
              Seule la réceptionniste habilitée pour ce service (<strong>AYA, HANANE, ou KHADIDJA</strong>) est autorisée à configurer et valider la liste des praticiens présents pour cette journée. Dès que la configuration sera soumise, le planning s'affichera instantanément ici en temps réel.
            </p>
          </div>

          <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100">
            📡 Synchronisation SSE active
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className={isFullScreen ? "fixed inset-0 z-50 bg-slate-150 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-6 select-none" : "space-y-6"} 
      id="intensif-workspace"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
        .font-arabic-elegant {
          font-family: 'Amiri', 'Noto Sans Arabic', 'Segoe UI', sans-serif !important;
        }
      `}</style>
      
      {/* 🖥️ FULLSCREEN PRESENTATION NAVIGATION BAR */}
      {isFullScreen && (
        <div className="flex flex-col space-y-4 text-slate-800">
          {/* TOP PRESENTATION BAR */}
          <div className="flex flex-col lg:flex-row items-center justify-between bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-lg border border-slate-800 gap-4">
            <div className="text-left">
              <span className="text-[10px] text-[#1dd2e2] font-black uppercase tracking-wider block font-mono">
                🖥️ Écran de Présentation Actif — Étage : {floorZoneId - 2} ({serviceName})
              </span>
              <h2 className="text-lg font-serif font-black tracking-tight text-white/95 flex items-center gap-2 mt-1">
                <span>Date de Planification :</span>
                <span className="bg-slate-800 text-cyan-300 font-mono px-3 py-1 rounded-lg text-xs font-bold border border-slate-700">
                  {selectedDate}
                </span>
              </h2>
            </div>

            {/* TOGGLE NAVIGATION HEADER (MOUSE TAB CLICKING) */}
            <div className="flex items-center bg-slate-850 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
              <button
                type="button"
                onClick={() => setFullScreenPeriod('matin')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  fullScreenPeriod === 'matin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>☀️ Période Matinale</span>
              </button>
              <button
                type="button"
                onClick={() => setFullScreenPeriod('soir')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  fullScreenPeriod === 'soir'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌙 Période Après-midi</span>
              </button>
            </div>

            {/* EXIT FULLSCREEN PRESENTATION BUTTON */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className="bg-rose-600 hover:bg-rose-750 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer hover:scale-102"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Quitter la Vue</span>
            </button>
          </div>

          {/* Navigational helpers */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 bg-white/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200/60 gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="bg-white border border-slate-300 px-2 py-1 rounded font-mono text-xs text-slate-705 shadow-3xs">←</span>
              <span>ou</span>
              <span className="bg-white border border-slate-300 px-2 py-1 rounded font-mono text-xs text-slate-705 shadow-3xs">→</span>
              <span className="ml-1 text-[11px] text-slate-500 font-medium">Touches de direction de votre clavier pour naviguer</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFullScreenPeriod('matin')}
                disabled={fullScreenPeriod === 'matin'}
                className="px-3.5 py-1.5 rounded-xl border bg-white enabled:hover:bg-slate-50 enabled:text-indigo-650 text-slate-300 disabled:opacity-40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Précédent
              </button>
              <button
                type="button"
                onClick={() => setFullScreenPeriod('soir')}
                disabled={fullScreenPeriod === 'soir'}
                className="px-3.5 py-1.5 rounded-xl border bg-white enabled:hover:bg-slate-50 enabled:text-indigo-650 text-slate-300 disabled:opacity-40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs"
              >
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Header compact */}
      {!isFullScreen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-teal-50 text-teal-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-teal-100 font-sans">
                Hospitalisation
              </span>
              <span className="text-teal-500 text-[9px] font-bold font-sans">
                {serviceName === 'Intensif 2e' ? 'Intensif Étage 2' : serviceName === 'Intensif 3e' ? 'Intensif Étage 3' : 'Intensif Étage 4'}
              </span>
            </div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight font-sans">
              Soins Intensifs – {serviceName === 'Intensif 2e' ? 'Étage 2' : serviceName === 'Intensif 3e' ? 'Étage 3' : 'Étage 4'}
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 text-left font-sans">
            Planifiez et organisez les protocoles de soins intensifs...
          </p>
        </div>
      )}

      {/* Barre d'outils compacte */}
      {!isFullScreen && (
        <div className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (!isAuthorizedReceptionniste) {
                  triggerToast("Seule la réceptionniste du Service a le droit de configurer les praticiens.", "error");
                  return;
                }
                setTempSelectedPratIds(presentPratIds);
                setShowSessionModal(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <Users className="w-3 h-3" />
              Thérapeutes
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded-lg">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-bold text-[10px] text-slate-800 bg-transparent focus:outline-none font-mono"
              />
            </div>
            <button 
              onClick={toggleFullScreen}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <Maximize2 className="w-3 h-3" />
              Plein Écran
            </button>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Serveur HP
            </span>
          </div>
        </div>
      )}

      {/* Hidden delegation triggers for App.tsx integration */}
      <button
        id="btn-projection-programme-hidden"
        className="hidden"
        type="button"
        onClick={toggleFullScreen}
      />
      <button
        id="btn-gerer-presences-hidden"
        className="hidden"
        type="button"
        onClick={() => {
          if (!isAuthorizedReceptionniste) {
            triggerToast("Seule la réceptionniste du Service a le droit de configurer les praticiens.", "error");
            return;
          }
          setTempSelectedPratIds(presentPratIds);
          setShowSessionModal(true);
        }}
      />

      {/* CORE TIME SLOTS GRIDS (STACKED MORNING AND EVENING VISUALS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* VOLET DE GLISSER-DÉPOSER DES PATIENTS IMC SUR PLANNING */}
        {isDragPanelOpen && !(floorZoneId === 4 || floorZoneId === 5 || floorZoneId === 6) && (
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4 text-left animate-fade-in shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="p-1 bg-[#0F2D37]/5 text-[#0F2D37] rounded-lg shrink-0">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="font-sans font-bold text-xs text-slate-800 uppercase tracking-tight truncate">IMC : {serviceName}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-550 bg-slate-100 font-extrabold rounded-full px-2 py-0.5">
                {filteredFloorImcPatients.length}
              </span>
            </div>

            {/* Rechercher un patient */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3 h-3" />
              </span>
              <input
                type="text"
                placeholder="Rechercher patient..."
                value={dragSearchQuery}
                onChange={(e) => setDragSearchQuery(e.target.value)}
                className="w-full text-[11px] pl-7.5 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:bg-white text-slate-800 font-medium"
              />
              {dragSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDragSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtre forfait actif */}
            <label className="flex items-center gap-2 text-[10px] text-slate-500 font-bold select-none cursor-pointer">
              <input
                type="checkbox"
                checked={filterActiveAbnOnly}
                onChange={(e) => setFilterActiveAbnOnly(e.target.checked)}
                className="rounded text-indigo-605 focus:ring-indigo-550 h-3.5 w-3.5 cursor-pointer accent-indigo-600"
              />
              <span>Uniquement forfaits actifs</span>
            </label>

            {/* Guide d'utilisation du Drag & Drop */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 text-[9.5px] text-slate-600 space-y-1 select-none">
              <p className="font-extrabold text-[#0f2d37] flex items-center gap-1 font-sans">
                <span>💡 Astuce Planning :</span>
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Glisser-déposer pour <span className="font-semibold text-indigo-750">déplacer</span> une séance.</li>
                <li>Maintenez la touche <span className="font-extrabold text-rose-700 bg-rose-50/80 px-1 py-0.5 rounded border border-rose-150">Ctrl</span> pour la <span className="font-semibold text-emerald-750">dupliquer</span>.</li>
              </ul>
            </div>

            {/* Liste des patients Draggable */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredFloorImcPatients.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-[10.5px] italic bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-3 font-medium">
                  {floorImcPatients.length === 0 
                    ? `Aucun patient IMC enregistré au ${serviceName.replace('Intensif ', '')}` 
                    : "Aucun patient ne correspond à la recherche."}
                </div>
              ) : (
                filteredFloorImcPatients.map(pat => {
                  const hasActiveAbn = dbState.abonnements.some(a => Number(a.ID_Patient) === Number(pat.ID_Patient) && (a.Etat === undefined || a.Etat === 'Actif'));
                  const isCurrentDrag = draggingPatientId === pat.ID_Patient;
                  return (
                    <div
                      key={`intensif-sidebar-patient-${pat.ID_Patient}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(pat));
                        e.dataTransfer.effectAllowed = 'copy';
                        setDraggingPatientId(pat.ID_Patient);
                      }}
                      onDragEnd={() => {
                        setDraggingPatientId(null);
                      }}
                      className={`group border rounded-2xl p-2.5 bg-white transition-all duration-300 cursor-grab active:cursor-grabbing select-none relative ${
                        isCurrentDrag
                          ? 'opacity-30 scale-90 border-dashed border-indigo-400 bg-indigo-50/20 shadow-none ring-2 ring-indigo-300 ring-offset-2'
                          : !hasActiveAbn 
                            ? 'opacity-65 hover:opacity-100 bg-amber-50/10 border-slate-150 hover:border-indigo-300 hover:bg-slate-50/50' 
                            : 'border-slate-150 hover:shadow-sm hover:border-indigo-300 hover:bg-slate-50/50'
                      }`}
                      title="Glissez et déposez directement ce patient sur une case vide du planning"
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-slate-100 border border-slate-200 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 rounded cursor-grab shrink-0">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="min-w-0 flex-1 space-y-0.5 text-left">
                          <span className="font-extrabold text-[11px] text-slate-900 group-hover:text-indigo-950 truncate block">
                            👤 {pat.Pseudo?.trim() || pat.Pren_Pat_Arb?.trim() || pat.Nom_Patient}
                          </span>
                          
                          <div className="flex items-center gap-1.5 text-[9.5px]">
                            <span className="text-slate-500 font-semibold font-mono">{pat.Age_Patient} ans</span>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-400 mt-1 border-t border-dashed pt-1">
                            <span className="truncate font-mono">{pat.phone || 'Aucun numéro'}</span>
                            {hasActiveAbn ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 font-black px-1 rounded text-[8px] uppercase tracking-wide">
                                Actif
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 border border-rose-150 font-black px-1 rounded text-[8px] uppercase tracking-wide">
                                Forfait Échu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Guide rapide */}
            <div className="bg-[#0F2D37]/5 border border-[#0F2D37]/10 p-2 rounded-xl text-[9.5px] text-[#0F2D37] leading-relaxed">
              <span className="font-black block uppercase tracking-wider text-[8px] text-indigo-705 mb-0.5">💡 Glisser-Déposer</span>
              Attrapez le patient par sa poignée gauche et glissez-le sur un créneau disponible (indiqué par <strong>Affecter</strong>) pour créer le rendez-vous.
            </div>
          </div>
        )}

        {/* CONTENEUR DES TABLES DE PLANIFICATION */}
        <div className={`space-y-6 ${(isDragPanelOpen && !(floorZoneId === 4 || floorZoneId === 5 || floorZoneId === 6)) ? 'lg:col-span-9' : 'lg:col-span-12'} w-full min-w-0`}>
        
        <div ref={containerRef} className="flex flex-col xl:flex-row gap-3 p-3 bg-[#f4f7f9] rounded-2xl border border-[#e8eef2] shadow-[0_4px_24px_rgba(0,0,0,0.02)] items-stretch justify-start relative min-h-[400px] w-full pb-4 overflow-x-auto">
          {/* ==============================================
              ☀️ TABLE 1 : MORNING PERIOD
              ============================================== */}
          <div 
            className="transition-all duration-75 flex flex-col shrink-0 min-w-0 w-full xl:w-[calc(50%-8px)]"
            style={isFullScreen ? { width: '100%' } : undefined}
          >
            <div className={`relative bg-white/90 backdrop-blur-md rounded-2xl border border-[#e8eef2] shadow-[0_8px_32px_rgba(31,38,135,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.08)] space-y-4 h-full ${
              isFullScreen && fullScreenPeriod !== 'matin' ? 'hidden' : ''
            }`}>
              {/* Accents fine bar at top */}
              <div className="h-1.5 bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#0d9488] w-full"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f4f8] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0d9488] to-[#14b8a6] flex items-center justify-center shadow-[0_4px_12px_rgba(13,148,136,0.3)] shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white animate-spin-slow">
                      <circle cx="12" cy="12" r="4"></circle>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <h3 className="text-xs font-bold text-[#0f2d37] tracking-tight font-arabic-elegant">
                        الفترة الصباحية <span className="text-[9px] text-[#5a7a8a] font-sans ml-1">(Période Matinale)</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleApplyProgram('matin')}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                        title="Appliquer le programme (MAJ)"
                      >
                        {hasPendingUpdates('matin') ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#5a7a8a] mt-0.5 font-medium">Volume : 08h00 à {break1Start} (Pause à {break1Start})</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasPendingUpdates('matin') ? (
                    <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold tracking-wide border border-amber-200 animate-pulse font-sans">
                      MODIFS
                    </span>
                  ) : isPeriodApplied('matin') ? (
                    <span className="px-3 py-1.5 rounded-full bg-[#e0f2f1] text-[#0d9488] text-[10px] font-bold tracking-wide border border-[#b2dfdb] font-sans">
                      À JOUR
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-wide border border-slate-200 font-sans">
                      VIDE
                    </span>
                  )}
                </div>
              </div>

              {getPratIdsToRender('matin').length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Veuillez ouvrir la session de l'étage pour configurer les kinés présents aujourd'hui.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#e8eef2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] font-sans mx-1.5 mb-1.5 w-full">
                  <table className="w-full text-left border-collapse text-[9px] table-fixed min-w-[350px]">
                    <thead className="bg-slate-100 text-slate-600 font-sans text-[8px] uppercase tracking-wider border-b border-[#eef2f6]">
                      <tr className="bg-slate-100 border-b border-[#eef2f6] h-6">
                        <th className="py-1 px-1 text-[8px] font-bold text-[#5a7a8a] uppercase tracking-wider text-right w-[60px] border-r border-[#f0f4f8]">Kiné</th>
                        {morningSlots.map(slot => (
                          <th key={slot.start} className="py-1 px-0.5 text-center border-r border-[#f0f4f8] font-bold w-[72px] text-[#5a7a8a] font-mono text-[8px]">
                            {slot.start}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f7f9] text-[#0f2d37]">
                      {getPratIdsToRender('matin').map(pratId => {
                        const practitioner = dbState.praticiens.find(p => p.ID_Prat === pratId);
                        if (!practitioner) return null;

                        const isPratPresent = presentPratIds.includes(pratId);

                        // Calcul de la dernière heure de fin travaillée (Honorée) si absent
                        let lastWorkedEndTime = '';
                        if (!isPratPresent) {
                          const honoredApps = activeAppointments.filter(a => a.ID_Prat === pratId && a.Statut_RDV === 'Honoré');
                          if (honoredApps.length > 0) {
                            lastWorkedEndTime = honoredApps.reduce((max, a) => {
                              if (!max || a.H_Fin_RDV > max) return a.H_Fin_RDV;
                              return max;
                            }, '');
                          }
                        }

                        return (
                          <tr key={`intensif-matin-prat-${pratId}`} className={`hover:bg-slate-50/50 group transition duration-150 h-10 ${!isPratPresent ? 'bg-slate-100/40 text-slate-400' : 'bg-white'}`}>
                            {/* Name panel column */}
                            <td className="py-1 px-1 border-b border-[#f0f4f8] bg-[#fafcfd] text-right w-[80px] border-r border-[#f0f4f8]">
                              <div className="flex items-center gap-1.5">
                                {/* Checkbox to prepare deletion */}
                                {isAuthorizedReceptionniste && (
                                  <input 
                                    type="checkbox"
                                    checked={checkedMatinPratIds.includes(pratId)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCheckedMatinPratIds([...checkedMatinPratIds, pratId]);
                                      } else {
                                        setCheckedMatinPratIds(checkedMatinPratIds.filter(id => id !== pratId));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-3 h-3 cursor-pointer shrink-0"
                                  />
                                )}

                                {/* Trigger icon for deleting OR default avatar */}
                                {isAuthorizedReceptionniste && checkedMatinPratIds.includes(pratId) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleExcludePrat(pratId, 'matin')}
                                    title="Retirer cet aide-kiné pour cette période"
                                    className="w-5.5 h-5.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center cursor-pointer transition shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-650" />
                                  </button>
                                ) : (
                                  <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#0f2d37] to-[#1e5f6f] flex items-center justify-center text-white text-[8px] font-bold shadow-[0_1px_4px_rgba(15,45,55,0.15)] shrink-0 font-sans">
                                    {practitioner.Pseudo ? practitioner.Pseudo.charAt(0).toUpperCase() : practitioner.Prenom_Prat.charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1 text-left">
                                  {!(floorZoneId === 4 || floorZoneId === 5 || floorZoneId === 6) && (
                                    <p className={`text-[10px] font-semibold text-[#0f2d37] leading-tight truncate ${!isPratPresent ? 'text-rose-900 line-through opacity-80' : ''}`} title={`${practitioner.Prenom_Prat} ${practitioner.Nom_Prat}`}>
                                      {practitioner.Pseudo || practitioner.Prenom_Prat}
                                    </p>
                                  )}
                                  {practitioner.Nom_Arb && (
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-[10px] font-semibold text-[#0d9488] font-arabic-elegant leading-none">{practitioner.Nom_Arb}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Slots */}
                            {morningSlots.map(slot => {
                              const app = activeAppointments.find(a => 
                                a.ID_Prat === pratId && a.H_Debut_RDV === slot.start
                              );
                              const patientObj = app ? dbState.patients.find(p => Number(p.ID_Patient) === Number(app.ID_Patient)) : null;

                              // Si le praticien est absent : toutes les cellules situées après sa dernière heure de fin travaillée sont indisponibles
                              const isSlotUnavailableForAbsent = !isPratPresent && (!lastWorkedEndTime || slot.start >= lastWorkedEndTime);

                              if (isSlotUnavailableForAbsent) {
                                return (
                                  <td 
                                    key={slot.start}
                                    className="p-0.5 border-r border-b border-[#f0f4f8] text-center bg-slate-50/70 text-slate-400 select-none relative font-mono text-[7px]"
                                  >
                                    <span className="text-slate-400 flex items-center justify-center py-1 font-semibold">✕ Indisp.</span>
                                  </td>
                                );
                              }

                              const isDragTarget = dragOverCell && 
                                dragOverCell.pratId === pratId && 
                                dragOverCell.slotStart === slot.start && 
                                dragOverCell.period === 'matin';

                              return (
                                <td 
                                  key={slot.start}
                                  onClick={() => {
                                    setActiveCell({ pratId, start: slot.start, end: slot.end });
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    const isCopy = e.ctrlKey || e.metaKey;
                                    e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
                                    if (dragOverCell && dragOverCell.isCopy !== isCopy) {
                                      setDragOverCell({ pratId, slotStart: slot.start, period: 'matin', isCopy });
                                    }
                                  }}
                                  onDragEnter={(e) => {
                                    setDragOverCell({ pratId, slotStart: slot.start, period: 'matin', isCopy: e.ctrlKey || e.metaKey });
                                  }}
                                  onDragLeave={() => {
                                    setDragOverCell(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOverCell(null);
                                    try {
                                      const patientDataStr = e.dataTransfer.getData('application/json');
                                      if (patientDataStr) {
                                        const parsed = JSON.parse(patientDataStr);
                                        const pat = parsed.patient || parsed;
                                        const sourceRdvId = parsed.sourceRdvId || null;
                                        const isDuplicate = e.ctrlKey || e.metaKey;
                                        const id_seance = parsed.id_seance || null;
                                        handleDragDropAssign(pat, pratId, slot.start, slot.end, sourceRdvId, isDuplicate, id_seance);
                                      }
                                    } catch (err) {
                                      console.error("Drop morning error", err);
                                    }
                                  }}
                                  className={`p-0.5 border-r border-b border-[#f0f4f8] text-center transition-all duration-150 cursor-pointer select-none relative ${
                                    isDragTarget
                                      ? app
                                        ? 'bg-rose-100 ring-2 ring-rose-500 border-rose-300 scale-[0.98]'
                                        : dragOverCell?.isCopy
                                          ? 'bg-cyan-100 ring-2 ring-cyan-500 border-cyan-300 scale-[0.98]'
                                          : 'bg-emerald-100 ring-2 ring-emerald-550 border-emerald-300 scale-[0.98]'
                                      : app 
                                        ? 'bg-gradient-to-r from-[#e0f2f1] to-[#f0fdfa]/50 hover:from-emerald-100/50 hover:to-white' 
                                        : 'bg-white hover:bg-emerald-50/20 border-slate-150'
                                  }`}
                                >
                                  {app && patientObj ? (
                                    <div 
                                      draggable
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        e.dataTransfer.setData('application/json', JSON.stringify({
                                          patient: patientObj,
                                          sourceRdvId: app.ID_RDV
                                        }));
                                        e.dataTransfer.effectAllowed = 'copyMove';
                                      }}
                                      className="inline-flex items-center gap-0.5 bg-gradient-to-r from-[#e0f2f1] to-[#f0fdfa] text-black rounded-lg px-1 py-0.5 text-[8.5px] font-bold border border-[#ccfbf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-grab active:cursor-grabbing group relative w-full justify-between"
                                      title="Faites glisser pour déplacer. Maintenez la touche Ctrl enfoncée pour dupliquer."
                                    >
                                      <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-[#0d9488] shadow-xs text-[7px] font-bold shrink-0">
                                        👤
                                      </span>
                                      <span 
                                        className="truncate flex-1 text-left font-sans font-black text-black text-[#000000] text-[10px] leading-normal ml-1 shrink min-w-0" 
                                        title={`${patientObj.Nom_Patient} (${patientObj.Pseudo || ''})`}
                                      >
                                        {patientObj.Pseudo?.trim() || patientObj.Pren_Pat_Arb?.trim() || patientObj.Nom_Patient}
                                      </span>
                                      {app.Statut_RDV === 'Honoré' && (
                                        <span className="text-emerald-600 font-extrabold text-[8px] ml-0.5 shrink-0" title="Séance Honorée">✓</span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickRemoveAssignment(app.ID_RDV);
                                        }}
                                        className="w-3.5 h-3.5 rounded-full bg-white/60 hover:bg-red-50 hover:text-red-500 text-[#94a3b8] flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 shrink-0 font-sans text-[8px] font-bold"
                                        title="Retirer ce patient"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className={`text-[7.5px] font-bold uppercase transition flex items-center justify-center gap-0.5 py-1 font-mono ${
                                      isDragTarget
                                        ? dragOverCell?.isCopy
                                          ? 'text-cyan-700 animate-pulse font-extrabold'
                                          : 'text-emerald-700 animate-pulse font-extrabold'
                                        : 'text-slate-400 opacity-40 hover:opacity-100'
                                    }`}>
                                      {isDragTarget ? (
                                        <>
                                          {dragOverCell?.isCopy ? (
                                            <>
                                              <Copy className="w-2.5 h-2.5 text-cyan-600 animate-bounce" />
                                              <span>Dupliquer</span>
                                            </>
                                          ) : (
                                            <>
                                              <ArrowDown className="w-2.5 h-2.5 text-emerald-600 animate-bounce" />
                                              <span>Déposer</span>
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-1.5 h-1.5 text-teal-600" />
                                          <span className="text-[7px] font-bold text-teal-600 border border-teal-200 rounded px-1 py-0.5 bg-teal-50/50 uppercase tracking-wide">
                                            + Affecter
                                          </span>
                                        </>
                                      )}
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
              )}
            </div>
          </div>



          {/* ==============================================
              🌙 TABLE 2 : AFTERNOON PERIOD
              ============================================== */}
          <div 
            className="transition-all duration-75 flex flex-col shrink-0 min-w-0 w-full xl:w-[calc(50%-8px)]"
            style={isFullScreen ? { width: '100%' } : undefined}
          >
            <div className={`relative bg-white/90 backdrop-blur-md rounded-2xl border border-[#e8eef2] shadow-[0_8px_32px_rgba(31,38,135,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.08)] space-y-4 h-full ${
              isFullScreen && fullScreenPeriod !== 'soir' ? 'hidden' : ''
            }`}>
              {/* Accents fine bar at top */}
              <div className="h-1.5 bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] w-full"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f4f8] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97706] to-[#f59e0b] flex items-center justify-center shadow-[0_4px_12px_rgba(217,119,6,0.3)] shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <h3 className="text-xs font-bold text-[#0f2d37] tracking-tight font-arabic-elegant">
                        الفترة المسائية <span className="text-[9px] text-[#5a7a8a] font-sans ml-1">(Période Après-midi)</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleApplyProgram('soir')}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                        title="Appliquer le programme (MAJ)"
                      >
                        {hasPendingUpdates('soir') ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#5a7a8a] mt-0.5 font-medium">Volume : {break1End} à 17h00 (Pause jusqu'à {break1End})</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasPendingUpdates('soir') ? (
                    <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold tracking-wide border border-amber-200 animate-pulse font-sans">
                      MODIFS
                    </span>
                  ) : isPeriodApplied('soir') ? (
                    <span className="px-3 py-1.5 rounded-full bg-[#e0f2f1] text-[#0d9488] text-[10px] font-bold tracking-wide border border-[#b2dfdb] font-sans">
                      À JOUR
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-wide border border-slate-200 font-sans">
                      VIDE
                    </span>
                  )}
                </div>
              </div>

              {getPratIdsToRender('soir').length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Veuillez ouvrir la session de l'étage pour configurer les kinés présents aujourd'hui.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#e8eef2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] font-sans mx-1.5 mb-1.5 w-full">
                  <table className="w-full text-left border-collapse text-[9px] table-fixed min-w-[350px]">
                    <thead className="bg-slate-100 text-slate-600 font-sans text-[8px] uppercase tracking-wider border-b border-[#eef2f6]">
                      <tr className="bg-slate-100 border-b border-[#eef2f6] h-6">
                        <th className="py-1 px-1 text-[8px] font-bold text-[#5a7a8a] uppercase tracking-wider text-right w-[60px] border-r border-[#f0f4f8]">Kiné</th>
                        {eveningSlots.map(slot => (
                          <th key={slot.start} className="py-1 px-0.5 text-center border-r border-[#f0f4f8] font-bold w-[72px] text-[#5a7a8a] font-mono text-[8px]">
                            {slot.start}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f7f9] text-[#0f2d37]">
                      {getPratIdsToRender('soir').map(pratId => {
                        const practitioner = dbState.praticiens.find(p => p.ID_Prat === pratId);
                        if (!practitioner) return null;

                        const isPratPresent = presentPratIds.includes(pratId);

                        // Calcul de la dernière heure de fin travaillée (Honorée) si absent
                        let lastWorkedEndTime = '';
                        if (!isPratPresent) {
                          const honoredApps = activeAppointments.filter(a => a.ID_Prat === pratId && a.Statut_RDV === 'Honoré');
                          if (honoredApps.length > 0) {
                            lastWorkedEndTime = honoredApps.reduce((max, a) => {
                              if (!max || a.H_Fin_RDV > max) return a.H_Fin_RDV;
                              return max;
                            }, '');
                          }
                        }

                        return (
                          <tr key={`intensif-soir-prat-${pratId}`} className={`hover:bg-slate-50/50 group transition duration-150 h-10 ${!isPratPresent ? 'bg-slate-100/40 text-slate-400' : 'bg-white'}`}>
                            {/* Name panel column */}
                            <td className="py-1 px-1 border-b border-[#f0f4f8] bg-[#fafcfd] text-right w-[80px] border-r border-[#f0f4f8]">
                              <div className="flex items-center gap-1.5">
                                {/* Checkbox to prepare deletion */}
                                <input 
                                  type="checkbox"
                                  checked={checkedSoirPratIds.includes(pratId)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCheckedSoirPratIds([...checkedSoirPratIds, pratId]);
                                    } else {
                                      setCheckedSoirPratIds(checkedSoirPratIds.filter(id => id !== pratId));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-3 h-3 cursor-pointer shrink-0"
                                />

                                {/* Trigger icon for deleting OR default avatar */}
                                {checkedSoirPratIds.includes(pratId) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleExcludePrat(pratId, 'soir')}
                                    title="Retirer cet aide-kiné pour cette période"
                                    className="w-5.5 h-5.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center cursor-pointer transition shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-650" />
                                  </button>
                                ) : (
                                  <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#0f2d37] to-[#1e5f6f] flex items-center justify-center text-white text-[8px] font-bold shadow-[0_1px_4px_rgba(15,45,55,0.15)] shrink-0 font-sans">
                                    {practitioner.Pseudo ? practitioner.Pseudo.charAt(0).toUpperCase() : practitioner.Prenom_Prat.charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1 text-left">
                                  {!(floorZoneId === 4 || floorZoneId === 5 || floorZoneId === 6) && (
                                    <p className={`text-[10px] font-semibold text-[#0f2d37] leading-tight truncate ${!isPratPresent ? 'text-rose-900 line-through opacity-80' : ''}`} title={`${practitioner.Prenom_Prat} ${practitioner.Nom_Prat}`}>
                                      {practitioner.Pseudo || practitioner.Prenom_Prat}
                                    </p>
                                  )}
                                  {practitioner.Nom_Arb && (
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-[10px] font-semibold text-[#0d9488] font-arabic-elegant leading-none">{practitioner.Nom_Arb}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Slots */}
                            {eveningSlots.map(slot => {
                              const app = activeAppointments.find(a => 
                                a.ID_Prat === pratId && a.H_Debut_RDV === slot.start
                              );
                              const patientObj = app ? dbState.patients.find(p => Number(p.ID_Patient) === Number(app.ID_Patient)) : null;

                              // Si le praticien est absent : toutes les cellules situées après sa dernière heure de fin travaillée sont indisponibles
                              const isSlotUnavailableForAbsent = !isPratPresent && (!lastWorkedEndTime || slot.start >= lastWorkedEndTime);

                              if (isSlotUnavailableForAbsent) {
                                return (
                                  <td 
                                    key={slot.start}
                                    className="p-0.5 border-r border-b border-[#f0f4f8] text-center bg-slate-50/70 text-slate-400 select-none relative font-mono text-[7px]"
                                  >
                                    <span className="text-slate-400 flex items-center justify-center py-1 font-semibold">✕ Indisp.</span>
                                  </td>
                                );
                              }

                              const isDragTarget = dragOverCell && 
                                dragOverCell.pratId === pratId && 
                                dragOverCell.slotStart === slot.start && 
                                dragOverCell.period === 'soir';

                              return (
                                <td 
                                  key={slot.start}
                                  onClick={() => {
                                    setActiveCell({ pratId, start: slot.start, end: slot.end });
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    const isCopy = e.ctrlKey || e.metaKey;
                                    e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
                                    if (dragOverCell && dragOverCell.isCopy !== isCopy) {
                                      setDragOverCell({ pratId, slotStart: slot.start, period: 'soir', isCopy });
                                    }
                                  }}
                                  onDragEnter={(e) => {
                                    setDragOverCell({ pratId, slotStart: slot.start, period: 'soir', isCopy: e.ctrlKey || e.metaKey });
                                  }}
                                  onDragLeave={() => {
                                    setDragOverCell(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOverCell(null);
                                    try {
                                      const patientDataStr = e.dataTransfer.getData('application/json');
                                      if (patientDataStr) {
                                        const parsed = JSON.parse(patientDataStr);
                                        const pat = parsed.patient || parsed;
                                        const sourceRdvId = parsed.sourceRdvId || null;
                                        const isDuplicate = e.ctrlKey || e.metaKey;
                                        const id_seance = parsed.id_seance || null;
                                        handleDragDropAssign(pat, pratId, slot.start, slot.end, sourceRdvId, isDuplicate, id_seance);
                                      }
                                    } catch (err) {
                                      console.error("Drop evening error", err);
                                    }
                                  }}
                                  className={`p-0.5 border-r border-b border-[#f0f4f8] text-center transition-all duration-150 cursor-pointer select-none relative ${
                                    isDragTarget
                                      ? app
                                        ? 'bg-rose-100 ring-2 ring-rose-500 border-rose-300 scale-[0.98]'
                                        : dragOverCell?.isCopy
                                          ? 'bg-cyan-100 ring-2 ring-cyan-500 border-cyan-300 scale-[0.98]'
                                          : 'bg-emerald-100 ring-2 ring-emerald-550 border-emerald-300 scale-[0.98]'
                                      : app 
                                        ? 'bg-gradient-to-r from-[#ffe0b2] to-[#fff3e0]/50 hover:from-amber-100/50 hover:to-white' 
                                        : 'bg-white hover:bg-emerald-50/20 border-slate-150'
                                  }`}
                                >
                                  {app && patientObj ? (
                                    <div 
                                      draggable
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        e.dataTransfer.setData('application/json', JSON.stringify({
                                          patient: patientObj,
                                          sourceRdvId: app.ID_RDV
                                        }));
                                        e.dataTransfer.effectAllowed = 'copyMove';
                                      }}
                                      className="inline-flex items-center gap-0.5 bg-gradient-to-r from-[#ffe0b2] to-[#fff3e0] text-black rounded-lg px-1 py-0.5 text-[8.5px] font-bold border border-[#ffe0b2] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-grab active:cursor-grabbing group relative w-full justify-between"
                                      title="Faites glisser pour déplacer. Maintenez la touche Ctrl enfoncée pour dupliquer."
                                    >
                                      <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-[#d97706] shadow-xs text-[7px] font-bold shrink-0">
                                        👤
                                      </span>
                                      <span 
                                        className="truncate flex-1 text-left font-sans font-black text-black text-[#000000] text-[10px] leading-normal ml-1 shrink min-w-0" 
                                        title={`${patientObj.Nom_Patient} (${patientObj.Pseudo || ''})`}
                                      >
                                        {patientObj.Pseudo?.trim() || patientObj.Pren_Pat_Arb?.trim() || patientObj.Nom_Patient}
                                      </span>
                                      {app.Statut_RDV === 'Honoré' && (
                                        <span className="text-emerald-600 font-extrabold text-[8px] ml-0.5 shrink-0" title="Séance Honorée">✓</span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickRemoveAssignment(app.ID_RDV);
                                        }}
                                        className="w-3.5 h-3.5 rounded-full bg-white/60 hover:bg-red-50 hover:text-red-500 text-[#94a3b8] flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 shrink-0 font-sans text-[8px] font-bold"
                                        title="Retirer ce patient"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className={`text-[7.5px] font-bold uppercase transition flex items-center justify-center gap-0.5 py-1 font-mono ${
                                      isDragTarget
                                        ? dragOverCell?.isCopy
                                          ? 'text-cyan-700 animate-pulse font-extrabold'
                                          : 'text-emerald-700 animate-pulse font-extrabold'
                                        : 'text-slate-400 opacity-40 hover:opacity-100'
                                    }`}>
                                      {isDragTarget ? (
                                        <>
                                          {dragOverCell?.isCopy ? (
                                            <>
                                              <Copy className="w-2.5 h-2.5 text-cyan-600 animate-bounce" />
                                              <span>Dupliquer</span>
                                            </>
                                          ) : (
                                            <>
                                              <ArrowDown className="w-2.5 h-2.5 text-emerald-600 animate-bounce" />
                                              <span>Déposer</span>
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-1.5 h-1.5 text-teal-600" />
                                          <span className="text-[7px] font-bold text-teal-600 border border-teal-200 rounded px-1 py-0.5 bg-teal-50/50 uppercase tracking-wide">
                                            + Affecter
                                          </span>
                                        </>
                                      )}
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
              )}
            </div>
          </div>
        </div>

        {/* CONTROLE DE L'INTERVALLE DE LA PAUSE DEJEUNER */}
        <div className="hidden bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-extrabold text-xs text-slate-950">Intervalle de la Pause Déjeuner (Intensif)</h4>
              <p className="text-[10px] text-slate-500 font-medium">
                Définit la fin de la période matinale et le début de la période après-midi pour cet étage.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-3xs">
              <span className="text-[9px] text-slate-400 font-black uppercase font-mono">Début de pause :</span>
              <input
                type="time"
                value={break1Start}
                onChange={(e) => {
                  if (currentUser.Role === 'Administrateur' && onUpdateBreaks) {
                    onUpdateBreaks(floorZoneId, e.target.value, break1End);
                  }
                }}
                disabled={currentUser.Role !== 'Administrateur'}
                className="text-xs font-black text-slate-800 bg-transparent focus:outline-none disabled:opacity-75 font-mono cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-3xs">
              <span className="text-[9px] text-slate-400 font-black uppercase font-mono">Fin de pause :</span>
              <input
                type="time"
                value={break1End}
                onChange={(e) => {
                  if (currentUser.Role === 'Administrateur' && onUpdateBreaks) {
                    onUpdateBreaks(floorZoneId, break1Start, e.target.value);
                  }
                }}
                disabled={currentUser.Role !== 'Administrateur'}
                className="text-xs font-black text-slate-800 bg-transparent focus:outline-none disabled:opacity-75 font-mono cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
            {currentUser.Role !== 'Administrateur' ? (
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg px-2 py-1 font-bold font-mono">
                🔒 Lecture seule (Admin uniquement)
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg px-2 py-1 font-bold font-mono">
                🔓 Ajustable (Administrateur)
              </span>
            )}
          </div>
        </div>

        </div> {/* Fermeture de CONTENEUR DES TABLES DE PLANIFICATION */}
      </div> {/* Fermeture de la structure grid */}

      {/* ==============================================
          MODAL 1 : DAILY JOURNAL OPENING / UPDATE PRESENCES
         ============================================== */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl text-slate-900 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-extrabold text-sm flex items-center gap-2 font-serif">
                    <span className="p-1.5 bg-indigo-950 rounded-xl text-indigo-400"><Users className="w-4 h-4" /></span>
                    <span>Ouverture de la Session Journalière — {serviceName}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Configurez les thérapeutes présents le <strong>{selectedDate}</strong></p>
                </div>
                <button 
                  onClick={() => setShowSessionModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl flex items-start gap-2.5 text-left">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[10.5px]/relaxed text-indigo-900 font-medium">
                    Sélectionnez les Masseurs-Kinésithérapeutes présents sur l'étage pour cette journée. L'insertion va peupler les deux périodes (Matinale et Après-midi). Vous pouvez modifier cette liste à tout moment.
                  </p>
                </div>

                <div className="flex items-center justify-between px-2 bg-slate-50/50 p-2 rounded-2xl border border-slate-150">
                  <span className="text-[10.5px] text-slate-500 font-bold font-sans">
                    {tempSelectedPratIds.filter(id => sortedKines.some(k => k.ID_Prat === id)).length} sélectionné(s) sur {sortedKines.length} praticien(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = sortedKines.length > 0 && sortedKines.every(k => tempSelectedPratIds.includes(k.ID_Prat));
                      if (allSelected) {
                        const toRemove = sortedKines.map(k => k.ID_Prat);
                        setTempSelectedPratIds(tempSelectedPratIds.filter(id => !toRemove.includes(id)));
                        triggerToast("Tous les praticiens de l'étage ont été désélectionnés.", "info");
                      } else {
                        const newIds = [...tempSelectedPratIds];
                        sortedKines.forEach(k => {
                          if (!newIds.includes(k.ID_Prat)) {
                            newIds.push(k.ID_Prat);
                          }
                        });
                        setTempSelectedPratIds(newIds);
                        triggerToast("Tous les praticiens de l'étage ont été sélectionnés.", "success");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-1.5 transition cursor-pointer select-none active:scale-95 ${
                      sortedKines.length > 0 && sortedKines.every(k => tempSelectedPratIds.includes(k.ID_Prat))
                        ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    {sortedKines.length > 0 && sortedKines.every(k => tempSelectedPratIds.includes(k.ID_Prat)) ? (
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

                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wide text-[9px] border-b">
                      <tr>
                        <th className="p-3 w-[80px] text-center">Présent</th>
                        <th className="p-3">Nom & Prénom</th>
                        <th className="p-3">Genre</th>
                        <th className="p-3 text-right">Nom Arabe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800">
                      {sortedKines.map(k => {
                        const isChecked = tempSelectedPratIds.includes(k.ID_Prat);
                        return (
                          <tr 
                            key={`intensif-presence-${k.ID_Prat}`}
                            className={`hover:bg-slate-50/70 transition cursor-pointer select-none ${
                              isChecked ? 'bg-indigo-50/20' : ''
                            }`}
                            onClick={() => {
                              if (isChecked) {
                                setTempSelectedPratIds(tempSelectedPratIds.filter(id => id !== k.ID_Prat));
                              } else {
                                setTempSelectedPratIds([...tempSelectedPratIds, k.ID_Prat]);
                              }
                            }}
                          >
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-semibold text-left">Mme/M. {k.Prenom_Prat} {k.Nom_Prat}</td>
                            <td className="p-3 text-left shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                k.Genre_Prat === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {k.Genre_Prat === 'F' ? 'Femme' : 'Homme'}
                              </span>
                            </td>
                            <td className="p-3 text-right text-indigo-900 font-serif font-black text-[13px]">{k.Nom_Arb}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-xs text-slate-700 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const key = `${selectedDate}_zone_${floorZoneId}`;
                      
                      const nextPresence = {
                        ...(dbState.intensifPresence || {}),
                        [key]: tempSelectedPratIds
                      };
                      
                      // Effacer les exclusions existantes pour cette date et zone
                      const nextExMatin = { ...(dbState.intensifExcludedMatin || {}) };
                      delete nextExMatin[key];
                      
                      const nextExSoir = { ...(dbState.intensifExcludedSoir || {}) };
                      delete nextExSoir[key];

                      localStorage.setItem(`intensif_present_kines_${selectedDate}_zone_${floorZoneId}`, JSON.stringify(tempSelectedPratIds));
                      localStorage.removeItem(`intensif_excluded_matin_${selectedDate}_zone_${floorZoneId}`);
                      localStorage.removeItem(`intensif_excluded_soir_${selectedDate}_zone_${floorZoneId}`);

                      const nextDb = {
                        ...dbState,
                        intensifPresence: nextPresence,
                        intensifExcludedMatin: nextExMatin,
                        intensifExcludedSoir: nextExSoir
                      };

                      onSave(nextDb);
                      setShowSessionModal(false);
                      triggerToast("Configuration des présences mise à jour avec succès !", "success");
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    🚀 Insérer / Mettre à jour
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
          MODAL 2 : CELL PATIENT AFFECTATION (Standard lists)
         ============================================== */}
      <AnimatePresence>
        {activeCell && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl text-slate-900 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-extrabold text-sm flex items-center gap-2">
                    <span className="p-1 bg-indigo-950 text-indigo-400 rounded-lg"><Clock className="w-4 h-4" /></span>
                    <span>Affecter un patient : {activeCell.start} - {activeCell.end}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pour : Mme/M. {dbState.praticiens.find(p => p.ID_Prat === activeCell.pratId)?.Prenom_Prat} {dbState.praticiens.find(p => p.ID_Prat === activeCell.pratId)?.Nom_Prat}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="p-1 text-slate-400 hover:text-white font-black cursor-pointer text-md transition"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const existingApp = activeAppointments.find(a => 
                  a.ID_Prat === activeCell.pratId && a.H_Debut_RDV === activeCell.start
                );

                if (existingApp) {
                  const assignedPatient = dbState.patients.find(p => p.ID_Patient === existingApp.ID_Patient);
                  const activeAbn = assignedPatient ? dbState.abonnements.find(a => a.ID_Patient === assignedPatient.ID_Patient && a.Etat === 'Actif') : null;
                  const activePack = (activeAbn && dbState.packs) ? dbState.packs.find(p => p.ID_Pack === activeAbn.ID_Pack) : null;

                  return (
                    <div className="p-6 space-y-5 text-left">
                      <div className="bg-indigo-50 border border-indigo-150 p-5 rounded-2xl space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="p-3 bg-white text-indigo-700 border rounded-2xl text-lg">👤</span>
                          <div className="space-y-1">
                            {assignedPatient ? (
                              <>
                                <h4 className="font-extrabold text-sm text-[#022]">
                                  👤 {assignedPatient.Pseudo?.trim() || assignedPatient.Pren_Pat_Arb?.trim() || assignedPatient.Nom_Patient}
                                </h4>
                                <p className="text-xs text-slate-600">
                                  Âge : <strong>{assignedPatient.Age_Patient} ans</strong> | Sexe : <strong>{assignedPatient.Genre_Patient}</strong>
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  Téléphone : <strong>{assignedPatient.phone}</strong>
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-500 italic">Patient introuvable.</p>
                            )}
                          </div>
                        </div>

                        {activeAbn && activePack && (
                          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold block">Abonnement Actif</span>
                              <strong className="text-indigo-950 font-sans">{activePack.Libelle_Pack}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold block">Séances Consommées</span>
                              <strong className="text-emerald-700 font-mono">{activeAbn.Nbre_Sean_Consom_Abn} / {activePack.Nbre_Seance_Pack} Séances</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setActiveCell(null)}
                          className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold text-xs cursor-pointer transition text-slate-700"
                        >
                          Fermer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignment(existingApp.ID_RDV)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Retirer du Programme</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                if (optionsPatient) {
                  const lastActiveAbn = dbState.abonnements.find(a => a.ID_Patient === optionsPatient.ID_Patient && a.Etat === 'Actif');
                  const getActeLabel = (id: number | null | undefined) => {
                    if (!id) return null;
                    return dbState.actes.find(act => act.ID_Acte === Number(id))?.Libelle_Acte || `Option #${id}`;
                  };

                  const act1Label = lastActiveAbn ? getActeLabel(lastActiveAbn.ID_Acte_Add1) : null;
                  const act2Label = lastActiveAbn ? getActeLabel(lastActiveAbn.ID_Acte_Add2) : null;

                  return (
                    <div className="p-6 space-y-5 text-left font-sans">
                      <div className="bg-indigo-50 border border-indigo-150 p-5 rounded-2xl space-y-3">
                        <h4 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                          <span>🎯 Options de soin multidisciplinaire</span>
                        </h4>
                        <p className="text-xs text-indigo-900/80 leading-relaxed animate-none">
                          Le patient <strong>{optionsPatient.Pseudo?.trim() || optionsPatient.Nom_Patient}</strong> possède un abonnement multidisciplinaire avec des spécialités complémentaires.
                        </p>
                        <p className="text-xs text-indigo-900/80">
                          Veuillez choisir l'activité / la spécialité à laquelle associer cette séance :
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {/* Option 1: Intensif (Activité Principale) */}
                        <button
                          type="button"
                          onClick={() => {
                            handleAssignPatient(optionsPatient, 10);
                            setOptionsPatient(null);
                          }}
                          className="w-full text-left p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl cursor-pointer transition flex items-center justify-between group shadow-3xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100/60 animate-none">⚡</span>
                            <div>
                              <strong className="text-xs text-slate-800 block">Intensif</strong>
                              <span className="text-[10px] text-slate-500">Activité de rééducation intensive par défaut</span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">Sélectionner</span>
                        </button>

                        {/* Option 2: Acte Optionnel 1 */}
                        {lastActiveAbn && lastActiveAbn.ID_Acte_Add1 !== null && act1Label && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAssignPatient(optionsPatient, Number(lastActiveAbn.ID_Acte_Add1));
                              setOptionsPatient(null);
                            }}
                            className="w-full text-left p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl cursor-pointer transition flex items-center justify-between group shadow-3xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100/60 animate-none">✨</span>
                              <div>
                                <strong className="text-xs text-slate-800 block">{act1Label}</strong>
                                <span className="text-[10px] text-slate-500">Option d'abonnement rattachée</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">Sélectionner</span>
                          </button>
                        )}

                        {/* Option 3: Acte Optionnel 2 */}
                        {lastActiveAbn && lastActiveAbn.ID_Acte_Add2 !== null && act2Label && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAssignPatient(optionsPatient, Number(lastActiveAbn.ID_Acte_Add2));
                              setOptionsPatient(null);
                            }}
                            className="w-full text-left p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl cursor-pointer transition flex items-center justify-between group shadow-3xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100/60 animate-none">✨</span>
                              <div>
                                <strong className="text-xs text-slate-800 block">{act2Label}</strong>
                                <span className="text-[10px] text-slate-500">Option d'abonnement rattachée</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">Sélectionner</span>
                          </button>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => setOptionsPatient(null)}
                          className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold text-xs cursor-pointer transition text-slate-700"
                        >
                          Retour à la liste
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-6 space-y-4 font-sans text-left">
                    <div className="space-y-1 text-left">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Patients affectés à ce service ({serviceName}) :
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Cliquez sur un patient ou double-cliquez pour affecter au créneau actuel.
                      </p>
                    </div>

                    {/* Barre de recherche d'une hauteur limitée */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un patient..."
                        value={intensifSearchQuery}
                        onChange={(e) => setIntensifSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F2D37] focus:bg-white transition"
                        style={{ height: '32px' }}
                      />
                    </div>

                    {filteredEligiblePatients.length === 0 ? (
                      <div className="py-12 text-center space-y-3 border border-dashed rounded-2xl bg-slate-50/50">
                        <ShieldAlert className="w-10 h-10 mx-auto text-indigo-300" />
                        <div>
                          <p className="text-slate-600 text-xs font-bold">Aucun patient IMC correspondant à vos critères.</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto flex-wrap">
                            Rappel : Assurez-vous que l'enfant est de type "Enfant IMC" et possède un abonnement disponible.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-y-auto max-h-[220px] border border-slate-200 rounded-2xl bg-white text-left">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 uppercase tracking-widest text-[9px] font-black">
                            <tr>
                              <th className="p-2.5 font-sans whitespace-nowrap">Nom &amp; Prénom</th>
                              <th className="p-2.5 font-sans whitespace-nowrap text-center">Age</th>
                              <th className="p-2.5 font-sans whitespace-nowrap">Affectation</th>
                              <th className="p-2.5 font-sans whitespace-nowrap text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredEligiblePatients.map(pat => {
                              const lastActiveAbn = dbState.abonnements.find(a => a.ID_Patient === pat.ID_Patient && a.Etat === 'Actif');
                              const packLinked = (lastActiveAbn && dbState.packs) ? dbState.packs.find(p => p.ID_Pack === lastActiveAbn.ID_Pack) : null;

                              let hasRemainingWarning = false;
                              let remainingSessions = 0;
                              let totalSessions = packLinked ? packLinked.Nbre_Seance_Pack : 0;
                              if (lastActiveAbn && packLinked) {
                                remainingSessions = totalSessions - lastActiveAbn.Nbre_Sean_Consom_Abn;
                                if (remainingSessions < 8) {
                                  hasRemainingWarning = true;
                                }
                              }

                              let hasBillingAlert = false;
                              let seancesConsommees = 0;
                              let totalPaidAmount = 0;
                              let montantConsomme = 0;
                              if (lastActiveAbn && packLinked) {
                                seancesConsommees = lastActiveAbn.Nbre_Sean_Consom_Abn;
                                const unitPrice = packLinked.Prix_Pack / totalSessions;
                                montantConsomme = seancesConsommees * unitPrice;
                                totalPaidAmount = dbState.versements
                                  .filter(v => v.ID_Abn === lastActiveAbn.ID_Abn)
                                  .reduce((sum, v) => sum + v.Mont_Vers, 0);

                                if (montantConsomme > totalPaidAmount + 8000) {
                                  hasBillingAlert = true;
                                }
                              }

                              const ageVal = pat.Age_Patient || pat.Age_Pat || 'Néant';
                              const ageStr = typeof ageVal === 'number' ? `${ageVal} ans` : ageVal;
                              const affectationStr = pat.Affect_Pat_IMC || pat.affectation || 'Non affecté';

                              return (
                                <tr 
                                  key={`intensif-selection-patient-${pat.ID_Patient}`}
                                  onDoubleClick={() => {
                                    const lastActiveAbn = dbState.abonnements.find(a => a.ID_Patient === pat.ID_Patient && a.Etat === 'Actif');
                                    const hasOptions = lastActiveAbn && (lastActiveAbn.ID_Acte_Add1 !== null || lastActiveAbn.ID_Acte_Add2 !== null);
                                    if (hasOptions) {
                                      setOptionsPatient(pat);
                                    } else {
                                      handleAssignPatient(pat, 10);
                                      setIntensifSearchQuery('');
                                    }
                                  }}
                                  className="hover:bg-slate-50 border-b border-slate-100 transition duration-150 cursor-pointer select-none group"
                                  title="Double-clic pour sélectionner d'office !"
                                >
                                  <td className="p-2.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-extrabold text-slate-800 text-xs">👤 {pat.Pseudo?.trim() || pat.Pren_Pat_Arb?.trim() || pat.Nom_Patient}</span>
                                      {hasRemainingWarning && (
                                        <span className="text-[9px] text-amber-600 font-bold">⚠️ Reste {remainingSessions} s.</span>
                                      )}
                                      {hasBillingAlert && (
                                        <span className="text-[9px] text-rose-600 font-bold">🚨 Solde négatif !</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-center font-bold text-slate-700 whitespace-nowrap">
                                    {ageStr}
                                  </td>
                                  <td className="p-2.5">
                                    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md ${
                                      affectationStr.toLowerCase().includes('intensif')
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                      {affectationStr}
                                    </span>
                                  </td>
                                  <td className="p-1 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const lastActiveAbn = dbState.abonnements.find(a => a.ID_Patient === pat.ID_Patient && a.Etat === 'Actif');
                                        const hasOptions = lastActiveAbn && (lastActiveAbn.ID_Acte_Add1 !== null || lastActiveAbn.ID_Acte_Add2 !== null);
                                        if (hasOptions) {
                                          setOptionsPatient(pat);
                                        } else {
                                          handleAssignPatient(pat, 10);
                                          setIntensifSearchQuery('');
                                        }
                                      }}
                                      className="bg-[#0F2D37] hover:bg-[#1D4452] text-white font-bold text-[9.5px] px-2.5 py-1 rounded-md transition cursor-pointer active:scale-95 shadow-3xs group-hover:bg-[#1D4452]"
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

                    <div className="flex justify-end pt-2 border-t text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCell(null);
                          setIntensifSearchQuery('');
                        }}
                        className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold text-xs cursor-pointer transition text-slate-700"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
          MODAL 3 : APPLIED PROGRAMS HISTORY (HISTORIQUE)
         ============================================== */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl text-slate-900 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="text-left animate-fade-in animate-duration-100">
                  <h3 className="font-extrabold text-sm flex items-center gap-2 font-serif">
                    <History className="w-5 h-5 text-indigo-400" />
                    <span>Historique d'Application des Programmes — Étage {floorZoneId - 2}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Anciens programmes configurés et validés par votre réception</p>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                {availableHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs italic border border-dashed rounded-xl">
                    Aucun programme n’a encore été appliqué sur cet étage dans cette session.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-80 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[9px] tracking-wider border-b">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Période</th>
                          <th className="p-3 text-center">Aide-Kinés</th>
                          <th className="p-3 text-center">Séances Déduites</th>
                          <th className="p-3">Heure Validation</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-800">
                        {availableHistory.map((h: any, index: number) => (
                          <tr key={`${h.date}-${h.period}-${index}`} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-bold font-mono text-left">{h.date}</td>
                            <td className="p-3 text-left">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                h.period === 'matin' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-150 bg-indigo-100 text-indigo-800'
                              }`}>
                                {h.period === 'matin' ? '☀️ Matin' : '🌙 Après-midi'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-600">{h.kinesCount}</td>
                            <td className="p-3 text-center font-mono font-black text-emerald-700">{h.debitedPatients} ({h.totalPatients} plannings)</td>
                            <td className="p-3 text-slate-500 font-mono text-left">{h.appliedAt}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDate(h.date);
                                  setShowHistoryModal(false);
                                  triggerToast(`Navigation vers le programme du ${h.date} !`, "info");
                                }}
                                className="p-1 px-2.5 bg-indigo-50 border border-indigo-250 text-indigo-700 hover:bg-indigo-100 font-bold rounded text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Voir</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
          MODAL 4 : EFFACER LE PROGRAMME (CLEAR DISPATCH)
         ============================================== */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md text-slate-900 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-extrabold text-sm flex items-center gap-2 font-serif">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Effacer le programme des séances</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Services Intensif 2e, 3e, et 4e</p>
                </div>
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-left">
                <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px]/relaxed text-rose-900 font-semibold">
                    Attention : Cette action va effacer les sessions planifiées et honorées pour les étages 2, 3 et 4. Les séances d'abonnements des patients correspondants seront recréditées automatiquement.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Voulez-vous vraiment effacer TOUTES les séances planifiées et honorées à la date sélectionnée (${selectedDate}) pour les trois services d'Intensif (2e, 3e, 4e) ?`)) {
                        handleClearProgram('selected_date');
                      }
                    }}
                    className="w-full p-3.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl font-bold text-xs text-rose-900 transition flex items-center justify-between cursor-pointer shadow-sm group"
                  >
                    <div className="text-left">
                      <span className="block font-black text-rose-700">🗓️ Effacer la date du {selectedDate}</span>
                      <span className="text-[9.5px] text-rose-600/80 font-mono block mt-0.5">Efface uniquement les plannings et réajuste les consommations du jour sélectionné</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition" />
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowClearModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
          MODAL 5 : FENÊTRE ESSAIS - LISTE COMPLÈTE DES PATIENTS AFFECTÉS
         ============================================== */}
      <AnimatePresence>
        {showEssaisModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[85vh] text-slate-900 overflow-hidden flex flex-col"
            >
              {/* Header de la fenêtre */}
              <div className="bg-gradient-to-r from-[#0F2D37] to-[#1a4a5b] text-white p-5 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block font-mono">
                    🧪 Fenêtre Principale d'Essai &amp; Consultation de l'Étage
                  </span>
                  <h3 className="font-serif font-black text-base flex items-center gap-2 mt-1">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <span>Patients Affectés à l'Étage — {serviceName}</span>
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setShowEssaisModal(false);
                    setEssasQuery('');
                    setSelectedEssaisPatientId(null);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center transition cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Barre d'état & Statistiques de l'étage */}
              <div className="bg-slate-50 border-b border-slate-200/80 p-4 shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border rounded-2xl p-3 flex items-center gap-3 shadow-3xs">
                  <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </span>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Patients de l'étage</span>
                    <strong className="text-sm text-slate-800 font-mono">{allFloorPatients.length} Patients</strong>
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-3 flex items-center gap-3 shadow-3xs">
                  <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Forfaits Actifs</span>
                    <strong className="text-sm text-emerald-700 font-mono">
                      {allFloorPatients.filter(p => dbState.abonnements.some(a => a.ID_Patient === p.ID_Patient && (a.Etat === undefined || a.Etat === 'Actif'))).length} Actifs
                    </strong>
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-3 flex items-center gap-3 shadow-3xs">
                  <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Séances Aujourd'hui</span>
                    <strong className="text-sm text-amber-700 font-mono">
                      {allFloorPatients.filter(p => activeAppointments.some(a => a.ID_Patient === p.ID_Patient)).length} Plannings
                    </strong>
                  </div>
                </div>
              </div>

              {/* Corps de la fenêtre (Split View) */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* PANNEAU GAUCHE : LISTE & RECHERCHE */}
                <div className="w-full md:w-5/12 border-r border-slate-150 flex flex-col h-full bg-slate-50/40 overflow-hidden">
                  {/* Champ de recherche */}
                  <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, téléphone, ville, dossier..."
                        value={essasQuery}
                        onChange={(e) => setEssasQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F2D37] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Liste des patients */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {filteredFloorPatients.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs italic">
                        Aucun patient affecté trouvé.
                      </div>
                    ) : (
                      filteredFloorPatients.map((pat) => {
                        const isSelected = selectedEssaisPatientId === pat.ID_Patient || 
                                           (selectedEssaisPatientId === null && filteredFloorPatients[0]?.ID_Patient === pat.ID_Patient);
                        
                        const lastAbn = dbState.abonnements.find(a => a.ID_Patient === pat.ID_Patient && (a.Etat === undefined || a.Etat === 'Actif'));
                        const hasTodayApp = activeAppointments.some(a => a.ID_Patient === pat.ID_Patient);

                        return (
                          <div
                            key={`intensif-essais-patient-${pat.ID_Patient}`}
                            onClick={() => setSelectedEssaisPatientId(pat.ID_Patient)}
                            className={`p-3.5 rounded-2xl border text-left transition duration-150 cursor-pointer select-none relative flex flex-col gap-1.5 ${
                              isSelected
                                ? 'bg-[#0F2D37]/5 border-[#0F2D37]/35 shadow-sm'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <h4 className="font-extrabold text-[#0F2D37] text-xs font-sans">
                                  👤 {pat.Pseudo?.trim() || pat.Pren_Pat_Arb?.trim() || pat.Nom_Patient}
                                </h4>
                              </div>
                              
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                pat.type_patient === 'Enfant IMC' 
                                  ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}>
                                {pat.type_patient}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>Âge : <strong>{pat.Age_Patient || pat.Age_Pat || 'N/A'} ans</strong></span>
                              <span>Tél : <strong className="font-sans">{pat.phone || 'Non renseigné'}</strong></span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100 mt-1">
                              {lastAbn ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[8.5px] font-black px-2 py-0.5 rounded border border-emerald-100">
                                  {/* ✓ FORFAIT ACTIF Hidden */}
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[8.5px] font-black px-2 py-0.5 rounded border border-slate-200">
                                  SANS SÉANCE ACTIVE
                                </span>
                              )}

                              {hasTodayApp && (
                                <span className="bg-amber-100 text-amber-800 text-[8.5px] font-black px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 animate-pulse">
                                  📅 SÉANCE PLANIFIÉE CE JOUR
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* PANNEAU DROIT : DÉTAILS DU PATIENT SÉLECTIONNÉ */}
                <div className="w-full md:w-7/12 flex flex-col h-full bg-white overflow-y-auto custom-scrollbar p-6">
                  {(() => {
                    const currentPat = dbState.patients.find(p => p.ID_Patient === selectedEssaisPatientId) || filteredFloorPatients[0] || null;
                    if (!currentPat) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-12 text-slate-400">
                          <Users className="w-12 h-12 text-slate-300" />
                          <p className="text-xs font-bold">Aucun patient sélectionné</p>
                          <p className="text-[11px] text-slate-400">Veuillez affecter des patients à ce service ou adapter vos filtres.</p>
                        </div>
                      );
                    }

                    const subHistory = dbState.abonnements.filter(a => a.ID_Patient === currentPat.ID_Patient);
                    const activeSub = subHistory.find(a => a.Etat === undefined || a.Etat === 'Actif');
                    const activePkg = (activeSub && dbState.packs) ? dbState.packs.find(p => p.ID_Pack === activeSub.ID_Pack) : null;
                    
                    const todayApps = activeAppointments.filter(a => a.ID_Patient === currentPat.ID_Patient);

                    return (
                      <div className="space-y-6 text-left">
                        {/* Carte d'identité du patient */}
                        <div className="bg-[#0F2D37]/5 border border-[#0F2D37]/15 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <span className="p-4 bg-white rounded-2xl border text-2xl shadow-sm shrink-0">
                              {currentPat.Genre_Patient === 'Femme' ? '🌸' : '🧒'}
                            </span>
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-900 text-sm font-sans flex items-center gap-2">
                                <span>👤 {currentPat.Pseudo?.trim() || currentPat.Pren_Pat_Arb?.trim() || currentPat.Nom_Patient}</span>
                              </h4>
                              <p className="text-xs text-slate-600 font-medium font-sans">
                                Sexe : <strong>{currentPat.Genre_Patient}</strong> | Type : <strong>{currentPat.type_patient}</strong>
                              </p>
                              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                                📞 Tél : <strong className="font-sans text-slate-800">{currentPat.phone || 'Non renseigné'}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-mono">ID Interne</span>
                            <span className="font-mono font-black text-slate-800 text-xs bg-slate-100 hover:bg-slate-200 rounded px-2.5 py-1 inline-block mt-1 border border-slate-205">
                              #{currentPat.ID_Patient}
                            </span>
                          </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="border border-slate-150 rounded-2xl p-4 text-xs space-y-1 bg-slate-50/10">
                            <span className="text-[9px] uppercase font-bold text-slate-450 font-mono">Date de Naissance :</span>
                            <p className="text-slate-850 font-extrabold">{currentPat.Date_Nais_Pat ? `${currentPat.Date_Nais_Pat} (${currentPat.Age_Patient || currentPat.Age_Pat} ans)` : 'Non renseignée'}</p>
                          </div>
                          <div className="border border-slate-150 rounded-2xl p-4 text-xs space-y-1 bg-slate-50/10">
                            <span className="text-[9px] uppercase font-bold text-slate-455 font-mono">Adresse domiciliaire :</span>
                            <p className="text-slate-850 font-extrabold truncate">
                              {currentPat.address || currentPat.street || ''} {currentPat.city || ''} {currentPat.wilaya ? `(${currentPat.wilaya})` : ''}
                              {(!currentPat.address && !currentPat.city) && 'Non renseignée'}
                            </p>
                          </div>
                        </div>

                        {/* Dossier Médical & Antécédents MPR */}
                        <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-white shadow-3xs">
                          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b pb-1.5">
                            🩺 Dossier Médical &amp; Antécédents MPR
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-indigo-650 block">Observations de Rééducation :</span>
                              <p className="text-[#022] font-semibold bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-50 leading-relaxed italic max-h-28 overflow-y-auto custom-scrollbar">
                                {currentPat.dossier_medical || "Aucune note clinique renseignée pour le dossier de réhabilitation."}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-amber-650 block">Profil Pathologique / Antécédents :</span>
                              <p className="text-[#321] font-semibold bg-amber-50/20 p-2.5 rounded-xl border border-amber-50 leading-relaxed italic max-h-28 overflow-y-auto custom-scrollbar">
                                {currentPat.antecedents || "Aucun antécédent médical pathologique renseigné."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Planification journalière (aujourd'hui) */}
                        <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-white shadow-3xs">
                          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b pb-1.5">
                            📅 Séances planifiées ce jour ({selectedDate})
                          </h5>
                          {todayApps.length === 0 ? (
                            <p className="text-xs text-slate-450 italic p-3 bg-slate-50 rounded-xl text-center">Aucune séance n'est planifiée à cette date pour ce patient sur l'étage.</p>
                          ) : (
                            <div className="space-y-2">
                              {todayApps.map(app => {
                                const kine = dbState.praticiens.find(p => p.ID_Prat === app.ID_Prat);
                                return (
                                  <div key={`intensif-patient-app-${app.ID_RDV}`} className="bg-amber-50/30 border border-amber-100 p-3 rounded-xl flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-600 font-bold">⏱️ {app.H_Debut_RDV} - {app.H_Fin_RDV}</span>
                                      <span className="text-slate-400 font-mono">|</span>
                                      <span className="font-bold">Thérapeute : {kine ? `${kine.Prenom_Prat} ${kine.Nom_Prat}` : `ID Praticien #${app.ID_Prat}`}</span>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg ${
                                      app.Statut_RDV === 'Honoré' 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {app.Statut_RDV === 'Honoré' ? '✓ HONORÉ' : '⏳ EN ATTENTE'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Historique des Forfaits / Abonnements */}
                        <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-white shadow-3xs">
                          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b pb-1.5">
                            💳 État de l'Abonnement Actuel
                          </h5>
                          {activeSub && activePkg ? (
                            <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 text-xs space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Nom du Pack</span>
                                  <strong className="text-slate-800 text-xs font-sans">{activePkg.Libelle_Pack}</strong>
                                </div>
                                <div>
                                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Consommation du Forfait</span>
                                  <strong className="text-emerald-700 text-xs font-mono font-black">{activeSub.Nbre_Sean_Consom_Abn} / {activePkg.Nbre_Seance_Pack} Séances</strong>
                                </div>
                              </div>
                              
                              <div className="pt-2.5 border-t border-emerald-100/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                                <div>
                                  <span>Validité : </span>
                                  <strong className="text-slate-700 font-mono">Du {activeSub.Date_Debut_Abn} au {activeSub.Date_Fin_Abn}</strong>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[9px]">
                                  FORFAIT CONFORME
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl p-4 text-xs text-center italic">
                              ⚠️ Ce patient ne possède aucun forfait actif sur cette période ou le forfait est venu à expiration.
                            </div>
                          )}

                          {/* Historique abrégé */}
                          {subHistory.length > 1 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Autres Forfaits enregistrés :</span>
                              <div className="max-h-24 overflow-y-auto p-1 border rounded-lg divide-y text-[10.5px]">
                                {subHistory.filter(s => s.ID_Abn !== activeSub?.ID_Abn).map(sh => (
                                  <div key={`intensif-sub-history-${sh.ID_Abn}`} className="py-1 flex items-center justify-between text-slate-600">
                                    <span>Abonnement #{sh.ID_Abn} | Consommé : {sh.Nbre_Sean_Consom_Abn} s.</span>
                                    <span className="font-mono text-[9px] bg-slate-100 rounded px-1.5">Historique</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Footer de la fenêtre */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEssaisModal(false);
                    setEssasQuery('');
                    setSelectedEssaisPatientId(null);
                  }}
                  className="px-5 py-2.5 bg-slate-900 font-extrabold text-xs text-white rounded-xl shadow-xs hover:bg-slate-800 transition cursor-pointer select-none"
                >
                  Fermer la vue
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📥 DOCK HORIZONTAL "PATIENTS EN PAUSE" (ÉTAGE 2, 3 ET 4) */}
      {(floorZoneId === 4 || floorZoneId === 5 || floorZoneId === 6) && (
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            const isCopy = e.ctrlKey || e.metaKey;
            e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const patientDataStr = e.dataTransfer.getData('application/json');
              if (patientDataStr) {
                const parsed = JSON.parse(patientDataStr);
                const patient = parsed.patient || parsed;
                const sourceRdvId = parsed.sourceRdvId;
                if (sourceRdvId) {
                  const isDuplicate = e.ctrlKey || e.metaKey;
                  handleDropToPause(patient, sourceRdvId, isDuplicate);
                }
              }
            } catch (err) {
              console.error("Drop to pause error", err);
            }
          }}
          className="fixed bottom-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col animate-fade-in"
          style={{ 
            left: isMenuVisible ? `${sidebarWidth}px` : '76px',
            height: '140px',
            transform: isDockOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Bouton Onglet Rétractable */}
          <button
            type="button"
            onClick={() => setIsDockOpen(!isDockOpen)}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] uppercase px-6 py-2.5 rounded-t-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.05)] flex items-center gap-2 cursor-pointer transition-all select-none font-sans tracking-wide"
            title={hasPraticienEnPause && patientsEnPause.length > 0 ? "Praticien(s) en pause — Patients en attente" : undefined}
          >
            {hasPraticienEnPause && patientsEnPause.length > 0 && (
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            <Pause className="w-3.5 h-3.5 text-slate-500" />
            <span>Patients en Pause ({patientsEnPause.length})</span>
          </button>

          {/* En-tête interne du Dock */}
          <div className="bg-slate-50 border-b border-slate-150 px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-[#0F2D37] uppercase tracking-wide flex items-center gap-1.5">
                ⏸ Patients en Pause ({patientsEnPause.length})
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                <span>| Glissez un patient de la grille vers ce dock pour le mettre en pause. Glissez-le vers le planning pour le replacer.</span>
                <span className="text-cyan-700 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-150 flex items-center gap-1">
                  💡 Maintenez Ctrl + glisser pour dupliquer le patient dans la pause
                </span>
              </span>
            </div>
            
            {/* Close button inside the dock */}
            <button
              type="button"
              onClick={() => setIsDockOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition p-1 rounded hover:bg-slate-200 text-xs font-bold shrink-0"
              title="Fermer le Dock"
            >
              ✕
            </button>
          </div>

          {/* Liste des patients en pause à défilement horizontal */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 py-2 flex items-center gap-3 custom-scrollbar bg-slate-50/20">
            {patientsEnPause.length === 0 ? (
              <div className="w-full text-center text-slate-400 text-xs italic py-2 font-medium flex flex-col items-center justify-center gap-1.5">
                <span>💡 Glissez un patient ici pour le mettre en pause, ou vers un créneau de la grille de planification pour le repositionner.</span>
                <span className="text-[10px] text-cyan-600 font-bold bg-cyan-50/50 px-2.5 py-1 rounded border border-cyan-100/50">
                  Maintenez Ctrl + glisser pour dupliquer le patient dans la pause
                </span>
              </div>
            ) : (
              patientsEnPause.map(item => {
                const patientObj = dbState.patients.find(p => String(p.ID_Patient) === String(item.idPatient));
                if (!patientObj) return null;
                const initial = (patientObj.Pseudo?.trim() || patientObj.Nom_Patient || "?").charAt(0).toUpperCase();

                return (
                  <div
                    key={item.id_seance ? `pause-dock-item-${item.id_seance}` : `pause-dock-item-${item.idPatient}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ 
                        patient: patientObj,
                        isFromPause: true,
                        idPatient: item.idPatient,
                        id_seance: item.id_seance
                      }));
                      e.dataTransfer.effectAllowed = 'copyMove';
                    }}
                    className="bg-white border border-slate-200 rounded-xl p-2 px-3 shadow-2xs cursor-grab active:cursor-grabbing select-none hover:bg-slate-50 transition-all hover:scale-102 flex items-center gap-3 max-w-[240px] shrink-0"
                    title="Glissez vers un créneau pour repositionner"
                  >
                    <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-600 shrink-0 border border-teal-100">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="text-[11px] font-extrabold text-slate-800 truncate">
                        {patientObj.Pseudo?.trim() || patientObj.Pren_Pat_Arb?.trim() || patientObj.Nom_Patient}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">
                        👤 {item.praticienOrigine} — 🕒 {item.creneauOrigine} (pause)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fresh = cloneState(dbState);
                        if (fresh.patientsEnPause) {
                          if (item.id_seance) {
                            fresh.patientsEnPause = fresh.patientsEnPause.filter(
                              p => p.id_seance !== item.id_seance
                            );
                          } else {
                            fresh.patientsEnPause = fresh.patientsEnPause.filter(
                              p => !(String(p.idPatient) === String(item.idPatient) && p.service === serviceName)
                            );
                          }
                        }
                        onSave(fresh);
                        triggerToast(`Patient retiré de la pause.`, 'info');
                      }}
                      className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center transition shrink-0 text-[8px] font-black"
                      title="Retirer de la pause"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default React.memo(IntensifScheduler);
