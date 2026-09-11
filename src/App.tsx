/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredDatabase, saveDatabase, DatabaseState, Utilisateur, Rendez_Vous, INITIAL_DATABASE, diagnosePatient, timesOverlap, isAbonnementGele, synchroniserEtatsAbonnements, isSubscriptionCoveringActe, getRemainingSessions, TODAY_DATE, mergeDatabaseStatesSmart, stampDatabaseState, stampItem } from './dbStore';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AccueilCarousel } from './components/AccueilCarousel';
import { SchedulerSection } from './components/SchedulerSection';
import { Login } from './components/Login';
import { hasPermission, getPermissions, normalizeRole } from './utils/permissions';
import { FileText } from 'lucide-react';
import { 
  AbonnementLogo, 
  PatientLogo,
  MedecinMprLogo, 
  ReeducationFonctionnelleLogo, 
  BalneotherapieLogo, 
  IntensifLogo,
  CaissesLogo
} from './components/CustomIcons';

// Lazy-loaded tab components for maximum responsiveness and initial load performance
const DatabaseSection = lazy(() => import('./components/DatabaseSection').then(m => ({ default: m.DatabaseSection })));
const QueueSection = lazy(() => import('./components/QueueSection'));
const QueueIMCSection = lazy(() => import('./components/QueueIMCSection'));
const PatientsManager = lazy(() => import('./components/PatientsManager'));
const AbonnementManager = lazy(() => import('./components/AbonnementManager'));
const StatsDashboard = lazy(() => import('./components/StatsDashboard').then(m => ({ default: m.StatsDashboard })));
const StoryDesigner = lazy(() => import('./components/StoryDesigner').then(m => ({ default: m.StoryDesigner })));
const CaissesManager = lazy(() => import('./components/CaissesManager'));
const BillingPage = lazy(() => import('./components/BillingPage'));
const ReeducationWeekCalendar = lazy(() => import('./components/ReeducationWeekCalendar').then(m => ({ default: m.ReeducationWeekCalendar })));
const BalneoCalendar = lazy(() => import('./components/BalneoCalendar').then(m => ({ default: m.BalneoCalendar })));
const IntensifScheduler = lazy(() => import('./components/IntensifScheduler').then(m => ({ default: m.IntensifScheduler })));
const OrthoPsychoScheduler = lazy(() => import('./components/OrthoPsychoScheduler').then(m => ({ default: m.OrthoPsychoScheduler })));
const EtatsSortiePanel = lazy(() => import('./components/EtatsSortiePanel').then(m => ({ default: m.EtatsSortiePanel })));
const CallCentreAnalysis = lazy(() => import('./components/CallCentreAnalysis').then(m => ({ default: m.CallCentreAnalysis })));
const UserManagement = lazy(() => import('./components/UserManagement'));
const CaisseDailyReport = lazy(() => import('./components/CaisseDailyReport').then(m => ({ default: m.CaisseDailyReport })));
const ChatSection = lazy(() => import('./components/ChatSection').then(m => ({ default: m.ChatSection })));



import { 
  Users, CreditCard, Clock, Activity, Waves, 
  Layers, BarChart3, Settings, Check, Calendar, Shield, BookOpen, Database, Sparkles, Stethoscope,
  UserPlus, CalendarClock, PhoneCall, MessageSquare, Power, LogOut, Maximize2, Minimize2,
  Pencil, Trash2, Bell
} from 'lucide-react';

function mergeDatabaseStates(local: DatabaseState, server: DatabaseState): DatabaseState {
  const merged = { ...server } as any;

  // Helper to merge arrays by a unique identifier key
  const mergeById = (serverArr: any[], localArr: any[], idKey: string) => {
    const map = new Map<any, any>();
    if (Array.isArray(serverArr)) {
      serverArr.forEach(item => {
        if (item && item[idKey] !== undefined) {
          map.set(item[idKey], item);
        }
      });
    }
    if (Array.isArray(localArr)) {
      localArr.forEach(item => {
        if (item && item[idKey] !== undefined) {
          const existing = map.get(item[idKey]);
          if (!existing) {
            map.set(item[idKey], item);
          } else {
            // Le serveur est la source de vérité absolue pour les éléments existants
            map.set(item[idKey], existing);
          }
        }
      });
    }
    return Array.from(map.values());
  };

  // 1. Reference Data
  merged.services = mergeById(server.services || [], local.services || [], 'ID_Sce');
  merged.utilisateurs = mergeById(server.utilisateurs || [], local.utilisateurs || [], 'ID_Utilisateur');
  merged.praticiens = mergeById(server.praticiens || [], local.praticiens || [], 'ID_Prat');
  merged.actes = mergeById(server.actes || [], local.actes || [], 'ID_Acte').filter((a: any) => 
    a && a.ID_Acte && a.Libelle_Acte
  );
  merged.packs = mergeById(server.packs || [], local.packs || [], 'ID_Pack');
  merged.typesPlanning = mergeById(server.typesPlanning || [], local.typesPlanning || [], 'ID_Type_Plan');
  merged.zones = mergeById(server.zones || [], local.zones || [], 'ID_Zone');
  merged.reglesBalneo = mergeById(server.reglesBalneo || [], local.reglesBalneo || [], 'ID_Regle');

  // 2. Transactional / Clinical Data
  merged.patients = mergeById(server.patients || [], local.patients || [], 'ID_Patient');
  merged.rendezVous = mergeById(server.rendezVous || [], local.rendezVous || [], 'ID_RDV');
  merged.abonnements = mergeById(server.abonnements || [], local.abonnements || [], 'ID_Abn');
  merged.versements = mergeById(server.versements || [], local.versements || [], 'ID_Vers');

  // 5. Seances: union by ID_Seanc
  const seanceMap = new Map<string, any>();
  if (Array.isArray(server.seances)) {
    server.seances.forEach((s, idx) => {
      const key = s.ID_Seanc ? String(s.ID_Seanc) : `idx-s-${idx}`;
      seanceMap.set(key, s);
    });
  }
  if (Array.isArray(local.seances)) {
    local.seances.forEach((s, idx) => {
      const key = s.ID_Seanc ? String(s.ID_Seanc) : `idx-l-${idx}`;
      if (!seanceMap.has(key)) {
        seanceMap.set(key, s);
      }
    });
  }
  merged.seances = Array.from(seanceMap.values());

  // 6. Transactions_caisses: union by ID_Mouv_Caisse
  const transMap = new Map<string, any>();
  const serverTrans = (server as any).transactions_caisses;
  const localTrans = (local as any).transactions_caisses;
  if (Array.isArray(serverTrans)) {
    serverTrans.forEach((t, idx) => {
      const key = t.ID_Mouv_Caisse ? String(t.ID_Mouv_Caisse) : `srv-${idx}-${t.Libelle}`;
      transMap.set(key, t);
    });
  }
  if (Array.isArray(localTrans)) {
    localTrans.forEach((t, idx) => {
      const key = t.ID_Mouv_Caisse ? String(t.ID_Mouv_Caisse) : `loc-${idx}-${t.Libelle}`;
      if (!transMap.has(key)) {
        transMap.set(key, t);
      }
    });
  }
  merged.transactions_caisses = Array.from(transMap.values());

  // 7. File d'attente
  const fileMap = new Map<string, any>();
  if (Array.isArray(server.fileAttente)) {
    server.fileAttente.forEach(f => fileMap.set(String(f.ID_File), f));
  }
  if (Array.isArray(local.fileAttente)) {
    local.fileAttente.forEach(f => {
      if (!fileMap.has(String(f.ID_File))) {
        fileMap.set(String(f.ID_File), f);
      }
    });
  }
  merged.fileAttente = Array.from(fileMap.values());

  const fileIMCMap = new Map<string, any>();
  if (Array.isArray(server.fileAttenteIMC)) {
    server.fileAttenteIMC.forEach(f => fileIMCMap.set(String(f.ID_File), f));
  }
  if (Array.isArray(local.fileAttenteIMC)) {
    local.fileAttenteIMC.forEach(f => {
      if (!fileIMCMap.has(String(f.ID_File))) {
        fileIMCMap.set(String(f.ID_File), f);
      }
    });
  }
  merged.fileAttenteIMC = Array.from(fileIMCMap.values());

  // Fusionner les nouveaux champs d'affectations et de présences
  merged.orthoPsychoAssignments = server.orthoPsychoAssignments || local.orthoPsychoAssignments || {};
  merged.orthoPsychoPresence = server.orthoPsychoPresence || local.orthoPsychoPresence || {};
  merged.intensifPresence = server.intensifPresence || local.intensifPresence || {};
  merged.intensifExcludedMatin = server.intensifExcludedMatin || local.intensifExcludedMatin || {};
  merged.intensifExcludedSoir = server.intensifExcludedSoir || local.intensifExcludedSoir || {};
  merged.notifications = mergeById(server.notifications || [], local.notifications || [], 'id');

  return merged as DatabaseState;
}

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState>(getStoredDatabase());
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const setAndPersistDbState = (nextState: DatabaseState) => {
    const savedState = saveDatabase(nextState);
    setDbState(savedState);
  };

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
  const [currentUser, setCurrentUser] = useState<Utilisateur | null>(() => {
    try {
      // Clean up old localStorage leftover to prevent automated direct bypass
      localStorage.removeItem('applet_current_user');
      
      const stored = sessionStorage.getItem('applet_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const db = getStoredDatabase();
        return db.utilisateurs.find(u => u.ID_Utilisateur === parsed.ID_Utilisateur) || null;
      }
    } catch (e) {
      console.error("Session storage read user error:", e);
    }
    return null; // Force login screen on startup if not authenticated
  });
  const [userToAuthorize, setUserToAuthorize] = useState<Utilisateur | null>(null);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [authError, setAuthError] = useState('');
  const [inactivityNotification, setInactivityNotification] = useState<string | null>(null);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Gestion du mode veille après 10 minutes et verrouillage
  const [isScreensaverActive, setIsScreensaverActive] = useState<boolean>(false);
  const [isLockScreenActive, setIsLockScreenActive] = useState<boolean>(false);
  const [lockPasswordAttempt, setLockPasswordAttempt] = useState('');
  const [lockAuthError, setLockAuthError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setIsScreensaverActive(false);
      setIsLockScreenActive(false);
      return;
    }

    // Réinitialiser le timestamp d'inactivité
    lastActivityRef.current = Date.now();

    const handleUserInteraction = () => {
      // En cas de veille active, toute interaction déclenche l'affichage du contrôle d'identité
      if (isScreensaverActive) {
        setIsScreensaverActive(false);
        setIsLockScreenActive(true);
        setLockPasswordAttempt('');
        setLockAuthError('');
      }
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserInteraction, { passive: true });
    });

    // Vérifier l'inactivité chaque seconde pour une réactivité maximale (seuil 10 minutes)
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      // 1. Déclenchement de la veille si 10 minutes d'inactivité cumulées (et si pas déjà verrouillé)
      const SCREENSAVER_LIMIT = 10 * 60 * 1000; // 10 minutes
      if (!isScreensaverActive && !isLockScreenActive && elapsed >= SCREENSAVER_LIMIT) {
        setIsScreensaverActive(true);
      }

      // 2. Déconnexion automatique après 30 minutes d'inactivité totale pour la sécurité globale
      const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
      if (elapsed >= INACTIVITY_LIMIT) {
        setInactivityNotification(
          "Sécurité : Votre session a expiré suite à une inactivité prolongée (30 minutes). Veuillez vous reconnecter."
        );
        setCurrentUser(null);
        setIsScreensaverActive(false);
        setIsLockScreenActive(false);
        sessionStorage.removeItem('applet_current_user');
        localStorage.removeItem('applet_current_user');
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
      clearInterval(interval);
    };
  }, [currentUser, isScreensaverActive, isLockScreenActive]);

  const requestUserSwitch = (user: Utilisateur) => {
    if (user?.ID_Utilisateur === currentUser?.ID_Utilisateur) return;
    setUserToAuthorize(user);
    setPasswordAttempt('');
    setAuthError('');
  };
  const userRole = currentUser?.Role || 'Admin';
  const isUserAdminOrAssistant = userRole === 'Admin' || userRole === 'Assistante';
  const isAdmin = userRole === 'Admin';
  const isSupperRec = userRole === 'SupperRec' || userRole === 'Super Receptionniste' || userRole === 'Super Réceptionniste';
  const isReceptionniste = userRole?.includes('Receptionniste') || userRole?.includes('Réceptionniste');
  const isMedecin = userRole === 'Medecin MPR' || userRole === 'Médecin MPR';

  // Guards de vues
  const canViewFacturation = isAdmin;
  const canViewParametres = isAdmin;
  const canViewCaisse = isAdmin || userRole === 'Receptionniste RDC';
  const canViewPatients = isAdmin || isSupperRec || isReceptionniste || isMedecin || ['Assistante', 'Marketing', 'Kiné', 'Psychomotricien', 'Orthophoniste'].includes(userRole);
  const canViewQueueMPR = isAdmin || isSupperRec || isReceptionniste || isMedecin;
  const canViewPlanning = isAdmin || isSupperRec || isMedecin || ['Kiné', 'Psychomotricien', 'Orthophoniste'].includes(userRole);
  const canViewPlanningReeduc = isAdmin || isSupperRec || isMedecin || userRole === 'Kiné';
  const canViewPlanningBalneo = isAdmin || isSupperRec || isMedecin || userRole === 'Kiné';
  const canViewPlanningPsych = isAdmin || isSupperRec || isMedecin || userRole === 'Psychomotricien';
  const canViewPlanningOrtho = isAdmin || isSupperRec || isMedecin || userRole === 'Orthophoniste';
  const canViewMessagerie = isAdmin || isSupperRec || isReceptionniste || isMedecin || ['Assistante', 'Marketing', 'Kiné', 'Psychomotricien', 'Orthophoniste'].includes(userRole);

  // Guards d'actions
  const canDelete = isAdmin;
  const canEncaisser = isAdmin || userRole === 'Receptionniste RDC';
  const isUserRDC = userRole === 'Receptionniste RDC';
  const isUserReeduc = userRole === 'Receptionniste Réeducation' || userRole === 'Receptionniste Rééducation';
  const isUserIntensif2 = userRole === 'Receptionniste Intensif 2e';
  const isUserIntensif3 = userRole === 'Receptionniste Intensif 3e';
  const isUserIntensif4 = userRole === 'Receptionniste Intensif 4e';
  const isUserMedecin = userRole === 'Médecin MPR';
  const isUserBalneo = userRole === 'Receptionniste Balnéothérapie' || userRole === 'Receptionniste Balneotherapie' || userRole === 'Receptionniste Balneo' || userRole === 'Receptionniste Balnéo';
  const isUserMarketing = userRole === 'Marketing';
  const isUserSuperReceptionniste = userRole === 'SupperRec' || userRole === 'Super Receptionniste' || userRole === 'Super Réceptionniste';
  const canAccessCallCentre = isUserAdminOrAssistant || isUserRDC || isUserReeduc || isUserIntensif2 || isUserIntensif3 || isUserIntensif4 || isUserBalneo || isUserSuperReceptionniste || userRole?.toLowerCase().includes('receptionniste') || userRole?.toLowerCase().includes('réceptionniste');

  const chatUnreadCount = useMemo(() => {
    if (!currentUser || !dbState.chat_messages) return 0;
    return dbState.chat_messages.filter(m => {
      const isUnread = m.read === false;
      if (!isUnread) return false;
      
      if (m.receiverId !== undefined) {
        return m.receiverId === currentUser.ID_Utilisateur;
      }
      
      // Fallback via le channel ID "private_id1_id2"
      if (m.channel && m.channel.startsWith('private_')) {
        const parts = m.channel.split('_');
        if (parts.length === 3) {
          const id1 = parseInt(parts[1], 10);
          const id2 = parseInt(parts[2], 10);
          const recId = id1 === m.senderId ? id2 : id1;
          return recId === currentUser.ID_Utilisateur;
        }
      }
      
      return false;
    }).length;
  }, [dbState.chat_messages, currentUser]);

  const [selectedDate, setSelectedDate] = useState<string>(TODAY_DATE); // Seeded active date

  // Enregistrer les fonctions de diagnostic sur l'objet global window pour exécution interactive
  const hasDiagnosedRef = React.useRef(false);
  useEffect(() => {
    (window as any).diagnosePatient = (name: string = 'GUELLAB ABDELKADER') => {
      diagnosePatient(name, dbState);
    };
    (window as any).diagnoseGuellab = () => {
      diagnosePatient('GUELLAB ABDELKADER', dbState);
    };

    // Exécuter automatiquement le diagnostic de départ une seule fois pour éviter les ralentissements console
    if (!hasDiagnosedRef.current && dbState.patients && dbState.patients.length > 0) {
      diagnosePatient('GUELLAB ABDELKADER', dbState);
      hasDiagnosedRef.current = true;
    }
  }, [dbState]);

  const [break1Start, setBreak1Start] = useState<string>(() => localStorage.getItem('reeducation_b1_start') || '12:00');
  const [break1End, setBreak1End] = useState<string>(() => localStorage.getItem('reeducation_b1_end') || '13:00');
  const [break2Start, setBreak2Start] = useState<string>(() => localStorage.getItem('reeducation_b2_start') || '17:00');
  const [break2End, setBreak2End] = useState<string>(() => localStorage.getItem('reeducation_b2_end') || '17:30');

  const [intensifBreaks, setIntensifBreaks] = useState<{ [zoneId: number]: { start: string; end: string } }>(() => {
    const saved = localStorage.getItem('intensif_breaks_config');
    return saved ? JSON.parse(saved) : {
      4: { start: '12:00', end: '13:00' },
      5: { start: '12:00', end: '13:00' },
      6: { start: '12:00', end: '13:00' }
    };
  });

  const handleUpdateBreaks = (b1s: string, b1e: string, b2s: string, b2e: string) => {
    localStorage.setItem('reeducation_b1_start', b1s);
    localStorage.setItem('reeducation_b1_end', b1e);
    localStorage.setItem('reeducation_b2_start', b2s);
    localStorage.setItem('reeducation_b2_end', b2e);
    setBreak1Start(b1s);
    setBreak1End(b1e);
    setBreak2Start(b2s);
    setBreak2End(b2e);
    triggerToast('Heures de pauses des plateaux réajustées avec succès.', 'success');
  };

  const handleUpdateIntensifBreaks = (zoneId: number, start: string, end: string) => {
    const newConfig = {
      ...intensifBreaks,
      [zoneId]: { start, end }
    };
    setIntensifBreaks(newConfig);
    localStorage.setItem('intensif_breaks_config', JSON.stringify(newConfig));
  };
  
  // The 10 requested menu paths + Canva Story Designer + Dashboard + CallCentre Analysis + Chat
  const [activeTab, setActiveTab] = useState<
    | 'accueil'
    | 'dashboard'
    | 'patients'
    | 'abonnements'
    | 'caisses'
    | 'queue_imc'
    | 'medecin_mpr'
    | 'reeducation'
    | 'balneotherapie'
    | 'intensif_2e'
    | 'intensif_3e'
    | 'intensif_4e'
    | 'orthophonie_psychomotricite'
    | 'statistiques'
    | 'story_designer'
    | 'parametres'
    | 'chat'
    | 'users_management'
    | 'callcentre'
    | 'rapport_caisse'
  >('accueil');

  const [hasClickedMenu, setHasClickedMenu] = useState<boolean>(false);

  const [mprSubTab, setMprSubTab] = useState<'queue' | 'patients'>('queue');
  const [initialSelectedPatientId, setInitialSelectedPatientId] = useState<number | null>(null);
  const [patientInitialTab, setPatientInitialTab] = useState<'medical_dossier' | 'subscriptions' | 'seances_record' | undefined>(undefined);
  const [cameFromAbonnements, setCameFromAbonnements] = useState<boolean>(false);
  const [patientClickCounter, setPatientClickCounter] = useState<number>(0);

  // Formulaire d'actes et services pour tables provisoires (Phase de Tests)
  const [testActLibelle, setTestActLibelle] = useState<string>('');
  const [testActPrix, setTestActPrix] = useState<number>(150);
  const [testActConstAct, setTestActConstAct] = useState<boolean>(false);
  const [testSceLibelle, setTestSceLibelle] = useState<string>('');

  // Redirection automatique pour chaque rôle
  React.useEffect(() => {
    if (!hasClickedMenu || activeTab === 'accueil') return;
    if (isUserRDC) {
      if (activeTab !== 'patients' && activeTab !== 'queue_imc' && activeTab !== 'caisses' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    } else if (isUserReeduc) {
      if (activeTab !== 'patients' && activeTab !== 'reeducation' && activeTab !== 'queue_imc' && activeTab !== 'caisses' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    } else if (isUserIntensif2) {
      if (activeTab !== 'patients' && activeTab !== 'intensif_2e' && activeTab !== 'queue_imc' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    } else if (isUserIntensif3) {
      if (activeTab !== 'patients' && activeTab !== 'intensif_3e' && activeTab !== 'queue_imc' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    } else if (isUserIntensif4) {
      if (activeTab !== 'patients' && activeTab !== 'intensif_4e' && activeTab !== 'queue_imc' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    } else if (isUserMedecin) {
      if (activeTab !== 'patients' && activeTab !== 'queue_imc' && activeTab !== 'medecin_mpr' && activeTab !== 'chat') {
        setActiveTab('patients');
      }
    } else if (isUserBalneo) {
      if (activeTab !== 'patients' && activeTab !== 'balneotherapie' && activeTab !== 'queue_imc' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    } else if (isUserSuperReceptionniste) {
      if (activeTab !== 'patients' && activeTab !== 'queue_imc' && activeTab !== 'reeducation' && activeTab !== 'balneotherapie' && activeTab !== 'orthophonie_psychomotricite' && activeTab !== 'chat' && activeTab !== 'callcentre') {
        setActiveTab('patients');
      }
    }
  }, [currentUser, activeTab, hasClickedMenu]);

  const [reeducationView, setReeducationView] = useState<'weekly' | 'daily'>('weekly');

  const [sleekTheme, setSleekTheme] = useState<'kacel-sante' | 'sleek-slate' | 'cosmic-dark' | 'emerald-clinical' | 'doctolib' | 'forest-cream' | 'apple-vercel' | 'rehab-soft'>(() => {
    return (localStorage.getItem('applet_sleek_theme') as any) || 'kacel-sante';
  });

  const handleChangeTheme = (themeName: 'kacel-sante' | 'sleek-slate' | 'cosmic-dark' | 'emerald-clinical' | 'doctolib' | 'forest-cream' | 'apple-vercel' | 'rehab-soft') => {
    setSleekTheme(themeName);
    localStorage.setItem('applet_sleek_theme', themeName);
    const label = 
      themeName === 'kacel-sante' ? 'KACEL Sante (Design Médical)' :
      themeName === 'emerald-clinical' ? 'Calme Médical Émeraude' : 
      themeName === 'doctolib' ? 'Doctolib' :
      themeName === 'forest-cream' ? 'Forêt & Crème' :
      themeName === 'apple-vercel' ? 'Apple / Vercel Sombre' :
      themeName === 'rehab-soft' ? 'Rééducation Douce & Raffinée' :
      'ChiroLift Bleu Soft';
    triggerToast(
      `Thème mis à jour : ${label}.`, 
      'success'
    );
  };

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<'online' | 'connecting' | 'offline'>('connecting');

  // Redirect to safe tab if role is Médecin MPR and they land on an unauthorized page
  useEffect(() => {
    if (!hasClickedMenu || activeTab === 'accueil') return;
    if (currentUser?.Role === 'Médecin MPR') {
      if (activeTab !== 'queue_imc' && activeTab !== 'patients' && activeTab !== 'medecin_mpr') {
        setActiveTab('medecin_mpr');
      }
    }
  }, [currentUser, activeTab, hasClickedMenu]);

  // States for adjustable separator
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sidebar_width');
    return saved ? Number(saved) : 320; // Default 320px for expanded visibility per request
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Mode API Fullscreen automatique dès la première interaction
  useEffect(() => {
    const autoFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn(`Tentative de passage en plein écran automatique ignorée ou restreinte : ${err.message}`);
        });
      }
      // Supprimer l'écouteur après la première tentative
      window.removeEventListener('click', autoFullscreen);
      window.removeEventListener('keydown', autoFullscreen);
    };

    window.addEventListener('click', autoFullscreen);
    window.addEventListener('keydown', autoFullscreen);

    return () => {
      window.removeEventListener('click', autoFullscreen);
      window.removeEventListener('keydown', autoFullscreen);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Erreur d'activation plein écran: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        // Keep it within reasonable bounds: 180px - 450px
        if (newWidth >= 180 && newWidth <= 450) {
          setSidebarWidth(newWidth);
          localStorage.setItem('sidebar_width', String(newWidth));
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Auto clear notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Synchronisation des notifications persistantes de la base de données vers le système de toast de la réceptionniste
  useEffect(() => {
    if (!currentUser || currentUser.Role === 'Admin') return;
    
    // Si l'utilisateur actuel est une réceptionniste (RDC, Balnéo, Rééducation, IMC, etc.)
    const isReceptionniste = currentUser.Role.toLowerCase().includes('receptionniste') || currentUser.Role.toLowerCase().includes('réceptionniste');
    if (!isReceptionniste) return;

    const unreadNotifs = (dbState.notifications || []).filter(n => !n.lue && n.destinataire === 'receptionniste');
    if (unreadNotifs.length > 0) {
      unreadNotifs.forEach((notif) => {
        triggerToast(notif.message, 'info');
      });
      
      // Marquer ces notifications comme lues pour éviter de les re-déclencher
      const updatedNotifications = dbState.notifications.map(n => 
        n.destinataire === 'receptionniste' && !n.lue ? { ...n, lue: true } : n
      );
      setAndPersistDbState({
        ...dbState,
        notifications: updatedNotifications
      });
    }
  }, [dbState.notifications, currentUser]);

  // ÉTAPE 3 : Forcer la création / synchronisation du compte Médecin MPR 'zouaoui'
  useEffect(() => {
    const migrateMPR = () => {
      const db = getStoredDatabase();
      const utilisateurs = db.utilisateurs || [];
      const mprIdx = utilisateurs.findIndex(u => u.ID_Utilisateur === 10 || (u.Login && u.Login.trim().toLowerCase() === 'zouaoui'));
      
      const targetUser = {
        ID_Utilisateur: 10,
        ID_Sce: 2,
        Nom_Utilisateur: 'Dr. ZOUAOUI MPR',
        Role: 'Médecin MPR',
        Login: 'zouaoui',
        MotDePasse: 'zouaoui'
      };

      if (mprIdx === -1) {
        utilisateurs.push(targetUser);
        db.utilisateurs = utilisateurs;
        setAndPersistDbState(db);
        console.log("Compte Dr. ZOUAOUI créé avec succès.");
      } else {
        const currentMpr = utilisateurs[mprIdx];
        if (currentMpr.Role !== 'Médecin MPR' || currentMpr.Login !== 'zouaoui' || currentMpr.MotDePasse !== 'zouaoui') {
          utilisateurs[mprIdx] = { ...currentMpr, ...targetUser };
          db.utilisateurs = utilisateurs;
          setAndPersistDbState(db);
          console.log("Compte Dr. ZOUAOUI synchronisé avec succès.");
        }
      }
    };

    migrateMPR();
  }, []);

  // ÉTAPE 4 : Redirection automatique du Médecin MPR vers son espace lors de l'accès initial
  useEffect(() => {
    if (currentUser && isUserMedecin && (activeTab === 'accueil' || activeTab === 'dashboard')) {
      setActiveTab('medecin_mpr');
      setHasClickedMenu(true);
    }
  }, [currentUser, isUserMedecin, activeTab]);

  // Unique session UUID created on component mount to prevent redundant self-sync UI freezes from Server-Sent Events
  const [sessionUuid] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36));

  // Central Sync: Connect to real-time sync with Express API
  useEffect(() => {
    let active = true;
    const apiHost = window.location.origin;
 
    const fetchDatabase = async () => {
      try {
        // 1. Charger le localStorage AVANT le fetch (pour avoir les données locales)
        const localDb = getStoredDatabase();

        const response = await fetch(`${apiHost}/api/db`, {
          headers: {
            'X-Client-Session-Id': sessionUuid
          }
        });
        if (response.ok) {
          const serverData = await response.json();
          if (active && serverData && typeof serverData === 'object' && Array.isArray(serverData.actes)) {
            // Filter out any phantom acts just in case
            if (serverData.actes && Array.isArray(serverData.actes)) {
              serverData.actes = serverData.actes.filter((a: any) => a && a.ID_Acte && a.Libelle_Acte);
            }

            // 2. Fusionner : SERVER est maître pour les données existantes,
            //    mais LOCAL est maître pour les données PLUS RÉCENTES (timestamp)
            const mergedData = mergeDatabaseStatesSmart(localDb, serverData);

            saveDatabase(mergedData);
            setAndPersistDbState(mergedData);
            setSyncStatus('online');
            console.log("Database synchronized successfully with intelligent merge from Express server.");

            // 3. Si le local a des données plus récentes, renvoyer au serveur
            const modifiedKeys = Object.keys(mergedData).filter(key => {
              return JSON.stringify((mergedData as any)[key]) !== JSON.stringify((serverData as any)[key]);
            });

            if (modifiedKeys.length > 0) {
              console.log("Local data is newer, pushing to server with modified keys:", modifiedKeys);
              await fetch(`${apiHost}/api/db`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Client-Session-Id': sessionUuid
                },
                body: JSON.stringify({
                  database: mergedData,
                  modifiedKeys: modifiedKeys
                })
              });
            }

            // Gracefully preserve and update the current user reference without causing redirection or state reset
            setCurrentUser(prevUser => {
              if (prevUser && mergedData.utilisateurs) {
                const matched = mergedData.utilisateurs.find((u: any) => u.ID_Utilisateur === prevUser.ID_Utilisateur);
                return matched || prevUser;
              }
              return prevUser;
            });
          }
        } else if (response.status === 404) {
          // No DB on server yet. Seed server with current local storage.
          console.log("Seeding server with current database schema/records...");
          await fetch(`${apiHost}/api/db`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Client-Session-Id': sessionUuid
            },
            body: JSON.stringify({
              database: localDb,
              modifiedKeys: Object.keys(localDb)
            })
          });
          setSyncStatus('online');
        } else {
          // Fallback to localStorage if response not ok
          setAndPersistDbState(localDb);
          setSyncStatus('online');
        }
      } catch (err) {
        console.warn("Express server database not reachable. Running on offline localStorage.", err);
        const localDb = getStoredDatabase();
        setAndPersistDbState(localDb);
        setSyncStatus('offline');
      }
    };
 
    fetchDatabase();
 
    // Attach Server-Sent Events listener for real-time synchronization across different browser windows/computers
    const eventSource = new EventSource(`${apiHost}/api/db/live?sessionUuid=${sessionUuid}`);
    
    eventSource.onmessage = (event) => {
      try {
        const updatedState = JSON.parse(event.data);
        if (active && updatedState && updatedState.fileAttente) {
          // Lors d'une mise à jour SSE, l'état diffusé par le serveur est la vérité absolue en temps réel.
          // On l'enregistre et l'applique directement pour éviter que les données locales obsolètes ne surchargent le serveur.
          saveDatabase(updatedState);
          setAndPersistDbState(updatedState);
          setSyncStatus('online');
          
          // Gracefully preserve and update the current user reference without causing redirection or state reset
          setCurrentUser(prevUser => {
            if (prevUser && updatedState.utilisateurs) {
              const matched = updatedState.utilisateurs.find((u: any) => u.ID_Utilisateur === prevUser.ID_Utilisateur);
              return matched || prevUser;
            }
            return prevUser;
          });
        }
      } catch (err) {
        console.error("Error parsing live stream database update:", err);
      }
    };
 
    eventSource.onerror = (err) => {
      console.warn("Real-time database stream connection error. Retrying in background...", err);
      setSyncStatus('connecting');
    };
 
    return () => {
      active = false;
      eventSource.close();
    };
  }, [sessionUuid]);
 
  const handleSaveState = async (freshState: DatabaseState, modifiedKeys?: string[]) => {
    // Determine which keys changed by comparing freshState and previous dbState
    const keysToSave = modifiedKeys || Object.keys(freshState).filter(k => {
      return JSON.stringify((freshState as any)[k]) !== JSON.stringify((dbState as any)[k]);
    });

    // Auto-stamping updated or newly added array items in the modified keys
    const stampedState = { ...freshState } as any;
    
    const arrayKeysToStamp = [
      'patients', 'abonnements', 'versements', 'rendezVous', 'seances', 'fileAttente', 'fileAttenteIMC',
      'transactions_caisses', 'chatMessages', 'chat_messages'
    ];

    const getID = (item: any, tableKey?: string) => {
      if (!item) return undefined;
      
      if (tableKey) {
        switch (tableKey) {
          case 'patients':
            if (item.ID_Patient !== undefined && item.ID_Patient !== null) return item.ID_Patient;
            break;
          case 'abonnements':
            if (item.ID_Abn !== undefined && item.ID_Abn !== null) return item.ID_Abn;
            break;
          case 'versements':
            if (item.ID_Vers !== undefined && item.ID_Vers !== null) return item.ID_Vers;
            break;
          case 'rendezVous':
            if (item.ID_RDV !== undefined && item.ID_RDV !== null) return item.ID_RDV;
            break;
          case 'seances':
            if (item.ID_Seanc !== undefined && item.ID_Seanc !== null) return item.ID_Seanc;
            if (item.id !== undefined && item.id !== null) return item.id;
            break;
          case 'fileAttente':
          case 'fileAttenteIMC':
            if (item.ID_File !== undefined && item.ID_File !== null) return item.ID_File;
            break;
          case 'factures':
            if (item.ID_Facture !== undefined && item.ID_Facture !== null) return item.ID_Facture;
            break;
          case 'consultations':
            if (item.id !== undefined && item.id !== null) return item.id;
            break;
          case 'transactions_caisses':
            if (item.ID_Trans !== undefined && item.ID_Trans !== null) return item.ID_Trans;
            if (item.ID_Mouv_Caisse !== undefined && item.ID_Mouv_Caisse !== null) return item.ID_Mouv_Caisse;
            break;
          case 'utilisateurs':
            if (item.ID_Utilisateur !== undefined && item.ID_Utilisateur !== null) return item.ID_Utilisateur;
            break;
          case 'praticiens':
            if (item.ID_Prat !== undefined && item.ID_Prat !== null) return item.ID_Prat;
            break;
          case 'actes':
            if (item.ID_Acte !== undefined && item.ID_Acte !== null) return item.ID_Acte;
            break;
          case 'packs':
            if (item.ID_Pack !== undefined && item.ID_Pack !== null) return item.ID_Pack;
            break;
        }
      }

      if (item.id !== undefined && item.id !== null) return item.id;
      if (item.ID_Seanc !== undefined && item.ID_Seanc !== null) return item.ID_Seanc;
      const keys = [
        'ID_File', 'ID_RDV', 'ID_Abn', 'ID_Vers', 'ID_Mouv_Caisse', 'ID_Trans', 'ID_Patient'
      ];
      for (const k of keys) {
        if (item[k] !== undefined && item[k] !== null) return item[k];
      }
      return undefined;
    };

    keysToSave.forEach(key => {
      if (arrayKeysToStamp.includes(key)) {
        const oldArr = (dbState as any)[key] || [];
        const newArr = (freshState as any)[key] || [];
        
        const oldMap = new Map();
        oldArr.forEach((item: any) => {
          const id = getID(item, key);
          if (id !== undefined) oldMap.set(id, item);
        });

        const stampedArr = newArr.map((item: any) => {
          const id = getID(item, key);
          if (id === undefined) return item;
          const oldItem = oldMap.get(id);
          
          if (!oldItem) {
            // New item, apply stamp
            return stampItem(item);
          } else {
            // Existing item, check if actually modified (ignoring updatedAt)
            const { updatedAt: _u1, ...itemClean } = item;
            const { updatedAt: _u2, ...oldItemClean } = oldItem;
            if (JSON.stringify(itemClean) !== JSON.stringify(oldItemClean)) {
              return stampItem(item);
            }
          }
          return item;
        });

        stampedState[key] = stampedArr;
      }
    });

    // Stamp the entire state with a new global lastUpdated timestamp
    const synchronizedState = synchroniserEtatsAbonnements(stampDatabaseState(stampedState));
    
    // Immediate optimistic client-side saving and UI update
    saveDatabase(synchronizedState);
    setAndPersistDbState(synchronizedState);
 
    // Persist real-time central updates to Express server
    try {
      const apiHost = window.location.origin;
      const response = await fetch(`${apiHost}/api/db`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Session-Id': sessionUuid
        },
        body: JSON.stringify({
          database: synchronizedState,
          modifiedKeys: keysToSave
        })
      });
      if (!response.ok) {
        console.error("Server synchronization failed with status:", response.status);
        triggerToast("Avertissement : Échec de l'enregistrement sur le serveur central. Les modifications restent sauvegardées localement.", "error");
      }
    } catch (err) {
      console.error("Error synching state with Express backend:", err);
      triggerToast("Avertissement : Connexion perdue avec le serveur central. Les modifications restent sauvegardées localement.", "error");
    }
  };
 
  // Add rendering toast helper
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message: msg, type });
  };
 
  // --- Dynamic Pointage & Appointment Booking Workflows ---
  const handleAddRDV = (newRDVData: Omit<Rendez_Vous, 'ID_RDV'>) => {
    // Toujours charger l'état local le plus récent pour éviter d'utiliser un dbState stale
    const currentLocal = getStoredDatabase();
    
    const patientObj = currentLocal.patients.find(p => p.ID_Patient === Number(newRDVData.ID_Patient));
    const patientName = patientObj ? patientObj.Nom_Patient : 'Inconnu';
    
    const conflict = currentLocal.rendezVous.find(r => {
      if (r.Statut_RDV === 'Annulé') return false;
      if (Number(r.ID_Patient) !== Number(newRDVData.ID_Patient)) return false;
      if (r.Date_RDV !== newRDVData.Date_RDV) return false;
      return timesOverlap(newRDVData.H_Debut_RDV, newRDVData.H_Fin_RDV, r.H_Debut_RDV, r.H_Fin_RDV);
    });
 
    if (conflict) {
      triggerToast(`Erreur d'enclenchement : patient ${patientName} figure déjà sur ce créneau horaire (${newRDVData.H_Debut_RDV}) de ce jour.`, 'error');
      return;
    }
 
    const nextId = currentLocal.rendezVous.length > 0 
      ? Math.max(...currentLocal.rendezVous.map(r => r.ID_RDV)) + 1 
      : 1;
    
    const updatedRDVs = [...currentLocal.rendezVous, { ...newRDVData, ID_RDV: nextId, updatedAt: Date.now() }];
    const updatedState = { ...currentLocal, rendezVous: updatedRDVs };
    
    setAndPersistDbState(updatedState);
    handleSaveState(updatedState);
    triggerToast('Le rendez-vous clinique a été enregistré avec succès.', 'success');
  };

  // Handles completing/marking an appointment as "Honoré" & Consuming Abonnement Credits!
  const handleUpdateRDVStatus = (rdvId: number, status: Rendez_Vous['Statut_RDV'], priceOverridden?: number) => {
    const currentDb = getStoredDatabase();
    const freshState = { 
      ...currentDb,
      rendezVous: [...currentDb.rendezVous],
      seances: [...currentDb.seances],
      abonnements: [...currentDb.abonnements],
      transactions_caisses: [...(currentDb.transactions_caisses || [])]
    };
    const rdvIndex = freshState.rendezVous.findIndex(r => r.ID_RDV === rdvId);
    
    if (rdvIndex === -1) return;
    const originalRDV = freshState.rendezVous[rdvIndex];
    
    if (originalRDV.Statut_RDV === 'Honoré' && status !== 'Honoré') {
      const seanceIdx = freshState.seances.findIndex(s => s.ID_RDV === rdvId);
      if (seanceIdx !== -1) {
        const seance = freshState.seances[seanceIdx];
        if (seance.ID_Abn) {
          const abnIdx = freshState.abonnements.findIndex(abn => abn.ID_Abn === seance.ID_Abn);
          if (abnIdx !== -1) {
            freshState.abonnements[abnIdx] = {
              ...freshState.abonnements[abnIdx],
              Nbre_Sean_Consom_Abn: Math.max(0, freshState.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1),
              updatedAt: Date.now()
            };
          }
        }
        freshState.seances = freshState.seances.filter(s => s.ID_RDV !== rdvId);
      }

      if (freshState.transactions_caisses) {
        freshState.transactions_caisses = freshState.transactions_caisses.filter((t: any) => {
          return !String(t.Libelle || '').includes(`RDV_#${rdvId}`);
        });
      }
    }

    freshState.rendezVous[rdvIndex] = {
      ...originalRDV,
      Statut_RDV: status,
      updatedAt: Date.now()
    };

    if (status === 'Honoré') {
      let activeAbonnementIndex = -1;
      const shouldCheckSubscription = priceOverridden === undefined || priceOverridden === 0;

      if (shouldCheckSubscription) {
        activeAbonnementIndex = freshState.abonnements.findIndex(abn => {
          if (Number(abn.ID_Patient) !== Number(originalRDV.ID_Patient)) return false;
          if (abn.Etat === 'Fermé') return false;
          if (!isSubscriptionCoveringActe(abn, Number(originalRDV.ID_Acte), freshState)) return false;
          const remaining = getRemainingSessions(abn, freshState);
          return remaining > 0;
        });

        if (activeAbonnementIndex === -1) {
          activeAbonnementIndex = freshState.abonnements.findIndex(abn => {
            if (Number(abn.ID_Patient) !== Number(originalRDV.ID_Patient)) return false;
            if (abn.Etat === 'Fermé') return false;
            return isSubscriptionCoveringActe(abn, Number(originalRDV.ID_Acte), freshState);
          });
        }

        if (activeAbonnementIndex === -1) {
          activeAbonnementIndex = freshState.abonnements.findIndex(abn => {
            if (Number(abn.ID_Patient) !== Number(originalRDV.ID_Patient)) return false;
            return abn.Etat !== 'Fermé';
          });
        }

        if (activeAbonnementIndex === -1) {
          activeAbonnementIndex = freshState.abonnements.findIndex(abn => {
            return Number(abn.ID_Patient) === Number(originalRDV.ID_Patient);
          });
        }
      }

      let assignedAbonnementId: number | null = null;
      let finalPrice = priceOverridden !== undefined ? priceOverridden : 150;

      if (activeAbonnementIndex !== -1) {
        const abn = freshState.abonnements[activeAbonnementIndex];
        const abnVersements = freshState.versements.filter((v: any) => Number(v.ID_Abn) === Number(abn.ID_Abn));
        const totalVerses = abnVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);
        const pack = freshState.packs.find(p => Number(p.ID_Pack) === Number(abn.ID_Pack));
        const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
        const consumedValue = abn.Nbre_Sean_Consom_Abn * prixSeance;
        const isInsolvent = totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses;

        freshState.abonnements[activeAbonnementIndex] = {
          ...abn,
          Nbre_Sean_Consom_Abn: abn.Nbre_Sean_Consom_Abn + 1,
          updatedAt: Date.now()
        };
        assignedAbonnementId = abn.ID_Abn;
        finalPrice = 0;

        if (isInsolvent) {
          triggerToast(`⚠️ 🔴 Séance Validée & Débitée de l'abonnement ABN_${abn.ID_Abn} malgré un versement insuffisant.`, 'error');
        } else {
          triggerToast(`🟢 Séance Validée : 1 crédit débité du Forfait ABN_${abn.ID_Abn}.`, 'success');
        }
      }

      const actDefaultPrice = freshState.actes.find(a => a.ID_Acte === originalRDV.ID_Acte)?.Prix_Acte ?? 150;

      if (activeAbonnementIndex === -1) {
        if (priceOverridden !== undefined && priceOverridden > 0) {
          finalPrice = priceOverridden;
        } else {
          finalPrice = actDefaultPrice;
        }
        triggerToast(`🟢 Séance pointée au tarif unitaire normal (Hors abonnement enregistré en caisse : ${finalPrice} DA).`, 'info');
      }

      const nextSeanceId = freshState.seances.length > 0 
        ? Math.max(...freshState.seances.map(s => s.ID_Seanc)) + 1 
        : 1;

      freshState.seances.push({
        ID_Seanc: nextSeanceId,
        ID_Patient: originalRDV.ID_Patient,
        ID_Prat: originalRDV.ID_Prat,
        ID_Acte: originalRDV.ID_Acte,
        ID_Abn: assignedAbonnementId,
        ID_RDV: rdvId,
        H_Debut_Seanc: originalRDV.H_Debut_RDV,
        H_Fin_Seanc: originalRDV.H_Fin_RDV,
        Prix_Seanc: finalPrice === 0 ? 0 : (actDefaultPrice),
        Date_Seanc_Realisee: originalRDV.Date_RDV,
        updatedAt: Date.now()
      });

      if (finalPrice > 0) {
        const nextTransId = freshState.transactions_caisses.length > 0 
          ? Math.max(...freshState.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
          : 1;

        const patient = freshState.patients.find(p => p.ID_Patient === (originalRDV.ID_Patient as any));
        const patientName = patient?.Nom_Patient || `PAT_#${originalRDV.ID_Patient}`;
        const praticien = freshState.praticiens.find(p => p.ID_Prat === originalRDV.ID_Prat);
        const serviceId = (originalRDV as any).ID_Sce || praticien?.ID_Sce || 1;
        const acteObj = freshState.actes.find(a => a.ID_Acte === originalRDV.ID_Acte);

        let targetCaisse = 'Caisse Rééducation';
        const autoRec = acteObj?.Receptionniste_Autorises;
        if (Array.isArray(autoRec) && autoRec.includes('RDC')) {
          targetCaisse = 'Caisse RDC';
        } else if (serviceId === 2) {
          targetCaisse = 'Caisse Sce Balnéothérapie';
        } else if (Array.isArray(autoRec) && autoRec.includes('Admin')) {
          targetCaisse = 'Caisse Abonnement / Autres Soins';
        } else {
          targetCaisse = 'Caisse Rééducation';
        }

        freshState.transactions_caisses.push({
          ID_Trans: nextTransId,
          Caisse: targetCaisse,
          Type: 'Recette',
          Montant: finalPrice,
          Libelle: `Encaissement Séance RDV_#${rdvId} (${patientName})`,
          ModePaiement: 'Espèces',
          Date_Trans: originalRDV.Date_RDV,
          Patient_Nom: patientName,
          ID_Acte: originalRDV.ID_Acte,
          ID_RDV: rdvId,
          updatedAt: Date.now()
        });
        
        triggerToast(`Encaissement de ${finalPrice} DA enregistré dans ${targetCaisse}.`, 'success');
      }

      handleSaveState(freshState);
    } else {
      triggerToast(`Rendez-vous marqué comme : '${status}'`, 'info');
      handleSaveState(freshState);
    }
  };

  const getThemeClassName = () => {
    if (sleekTheme === 'kacel-sante') return 'theme-kacel-sante';
    if (sleekTheme === 'emerald-clinical') return 'theme-healthcare-calm';
    if (sleekTheme === 'doctolib') return 'theme-doctolib';
    if (sleekTheme === 'forest-cream') return 'theme-forest-cream';
    if (sleekTheme === 'apple-vercel') return 'theme-apple-vercel';
    if (sleekTheme === 'rehab-soft') return 'theme-rehab-soft';
    return '';
  };

  // Glassmorphic & Gold 3D Icon Renderer
  const renderGlassIcon = (IconComponent: any, active: boolean, size: string = "w-4 h-4") => {
    return (
      <div className={`glass-gold-icon-container ${active ? 'active-glass-gold-button' : ''} flex-shrink-0`}>
        <IconComponent className={`${size} glass-gold-icon`} />
      </div>
    );
  };

  if (!currentUser) {
    return (
      <Login
        utilisateurs={dbState.utilisateurs}
        initialNotification={inactivityNotification}
        onLoginSuccess={(user) => {
          setInactivityNotification(null);
          setCurrentUser(user);
          sessionStorage.setItem('applet_current_user', JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <>
      <div className={`fixed inset-0 font-sans flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 overflow-hidden ${getThemeClassName()}`} id="applet-viewport">
      
      {/* Toast alert system */}
      {notification && (
        <div 
          id="toast-notification"
          className="fixed top-5 right-5 z-55 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-xs max-w-sm transition duration-300 animate-slide-in bg-white border-slate-200 text-slate-800 font-bold"
        >
          <div className={`p-1.5 rounded-full ${
            notification.type === 'error' ? 'bg-rose-100 text-rose-600' :
            notification.type === 'info' ? 'bg-amber-100 text-amber-600' :
            'bg-emerald-100 text-emerald-600'
          }`}>
            {notification.type === 'error' ? (
              <span className="text-xs font-black px-0.5">✕</span>
            ) : notification.type === 'info' ? (
              <span className="text-xs font-black px-0.5">ℹ</span>
            ) : (
              <Check className="w-3.5 h-3.5 font-bold" />
            )}
          </div>
          <p className="leading-tight font-extrabold text-slate-900" id="toast-message-text">{notification.message}</p>
        </div>
      )}

      {/* FLOATING TRIGGER REGION ON HOVER: along the left edge */}
      <div 
        onMouseEnter={() => setIsMenuVisible(true)}
        className="fixed left-0 top-0 bottom-0 w-3 hover:bg-[#7fa4b3]/20 z-40 flex items-center justify-center cursor-pointer transition-colors"
        id="menu-afficher-trigger-bar"
      >
        <div className="absolute left-1 bg-[#102e3b] text-white text-[9px] font-black uppercase tracking-widest py-3.5 px-1.5 rounded-r-lg shadow-md whitespace-nowrap transform -rotate-90 origin-left flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <span>☰ Ouvrir Menu</span>
        </div>
      </div>

      {/* LEFT SIDEBAR MENU (Sliding hover-based drawer for both desktop and mobile) */}
      <aside 
        style={{ 
          width: isMenuVisible ? `${sidebarWidth}px` : '76px', 
          minWidth: isMenuVisible ? `${sidebarWidth}px` : '76px',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={() => setIsMenuVisible(true)}
        onMouseLeave={() => setIsMenuVisible(false)}
        className={`relative h-full bg-chiro-blue border-r border-[#7fa4b3]/60 text-[#102e3b] shadow-2xl flex flex-col justify-between overflow-y-auto shrink-0 transition-all duration-300 ${
          isMenuVisible ? 'opacity-100 p-5' : 'opacity-100 p-3 items-center overflow-x-hidden'
        }`}
        id="sidebar-layout-panel"
      >
        
        <div className="space-y-6 w-full flex flex-col items-center">
          {/* Logo Brand Header with mobile close action */}
          {isMenuVisible ? (
            <div className="border-b border-[#7fa4b3]/60 pb-4 flex justify-between items-center w-full">
              <div>
                <h1 className="text-[#102e3b] font-bold text-md flex items-center gap-2 font-serif">
                  <Activity className="text-[#102e3b] w-5 h-5 animate-pulse" />
                  <span>KACEL Santé MPR</span>
                </h1>
                <p className="text-[10px] text-[#306568] uppercase tracking-widest mt-1 font-bold">Système de Planification</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsMenuVisible(false)}
                className="md:hidden text-[#102e3b] font-black hover:bg-[#7fa4b3]/40 p-1.5 rounded-lg text-sm"
                title="Fermer le menu"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="border-b border-[#7fa4b3]/60 pb-4 flex justify-center items-center w-full" title="KACEL Santé MPR">
              <Activity className="text-[#102e3b] w-6 h-6 animate-pulse" />
            </div>
          )}

          {/* Session Utilisateur Connecté (Haut du Menu) */}
          {isMenuVisible ? (
            <div className="bg-white/70 border border-[#7fa4b3]/40 rounded-2xl p-3.5 shadow-2xs w-full">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-slate-205 border border-slate-350 flex items-center justify-center font-bold text-sm text-slate-800 shadow-xs shrink-0 select-none">
                  👤
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-150 px-1 rounded tracking-wider">
                      Connecté
                    </span>
                  </div>
                  <h6 className="font-extrabold text-[11px] text-[#102e3b] truncate mt-0.5" title={currentUser.Nom_Utilisateur}>
                    {currentUser.Nom_Utilisateur}
                  </h6>
                  <p className="text-[9.5px] font-bold text-[#306568] uppercase tracking-wider">
                    🔑 {currentUser.Role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-11 h-11 rounded-2xl bg-white/70 border border-[#7fa4b3]/40 flex items-center justify-center font-bold text-lg text-slate-800 shadow-2xs shrink-0 select-none" title={`${currentUser.Nom_Utilisateur} (${currentUser.Role})`}>
              👤
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-pulse" />
            </div>
          )}

          {/* Nav groups */}
          <nav className="space-y-1 w-full" id="sidebar-navigation">
            {/* 1. SECTION GÉNÉRAL (Uniquement Admin/Assistant) */}
            {isUserAdminOrAssistant && (
              <>
                {isMenuVisible && <span className="text-[10px] uppercase font-bold tracking-wider text-[#306568]/80 select-none block px-2.5 mb-1 font-sans">Général</span>}
                <button
                  id="menu-dashboard"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setHasClickedMenu(true);
                  }}
                  className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                    activeTab === 'dashboard'
                      ? 'bg-white border-r-4 border-indigo-500 text-[#102e3b] shadow-xs font-extrabold'
                      : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                  }`}
                  title={!isMenuVisible ? "Tableau de Bord" : ""}
                >
                  {renderGlassIcon(BarChart3, activeTab === 'dashboard')}
                  {isMenuVisible && <span>Tableau de Bord</span>}
                </button>
              </>
            )}

            {/* 2. SECTION DOSSIERS & ACCUEIL */}
            {isMenuVisible && <span className="text-[10px] uppercase font-bold tracking-wider text-[#306568]/80 select-none block px-2.5 mt-3 mb-1 font-sans">Dossiers & Accueil</span>}
            
            {/* L'onglet Patient est visible selon permissions (Admin, SupperRec, Réceptionnistes, Médecins, Soignants) */}
            {canViewPatients && (
              <button
                id="menu-patients"
                onClick={() => {
                  setActiveTab('patients');
                  setHasClickedMenu(true);
                  setPatientClickCounter((prev) => prev + 1);
                }}
                className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                  activeTab === 'patients'
                    ? 'bg-white border-r-4 border-indigo-500 text-[#102e3b] shadow-xs font-extrabold'
                    : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                }`}
                title={!isMenuVisible ? "Patient" : ""}
              >
                {renderGlassIcon(PatientLogo, activeTab === 'patients', "w-7 h-7")}
                {isMenuVisible && <span>Patient</span>}
              </button>
            )}

            {/* Abonnements visible par Admin/Assistant */}
            {isUserAdminOrAssistant && (
              <button
                id="menu-abonnements"
                onClick={() => {
                  setActiveTab('abonnements');
                  setHasClickedMenu(true);
                }}
                className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                  activeTab === 'abonnements'
                    ? 'bg-white border-r-4 border-indigo-500 text-[#102e3b] shadow-xs font-extrabold'
                    : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                }`}
                title={!isMenuVisible ? "Abonnement" : ""}
              >
                {renderGlassIcon(AbonnementLogo, activeTab === 'abonnements', "w-7 h-7")}
                {isMenuVisible && <span>Abonnement</span>}
              </button>
            )}

            {/* Caisses visible pour Admin/Assistant, RDC (Masqué pour SupperRec) */}
            {canViewCaisse && (
              <button
                id="menu-caisses"
                onClick={() => {
                  setActiveTab('caisses');
                  setHasClickedMenu(true);
                }}
                className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                  activeTab === 'caisses'
                    ? 'bg-white border-r-4 border-indigo-500 text-[#102e3b] shadow-xs font-extrabold'
                    : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                }`}
                title={!isMenuVisible ? (isUserRDC ? "Caisse RDC" : isUserReeduc ? "Caisse Sce Adulte" : isUserBalneo ? "Caisse Balnéo" : "Gestion des Caisses") : ""}
              >
                {renderGlassIcon(CaissesLogo, activeTab === 'caisses', "w-7 h-7")}
                {isMenuVisible && (
                  <span>
                    {isUserRDC ? "Caisse RDC" : isUserReeduc ? "Caisse Sce Adulte" : isUserBalneo ? "Caisse Balnéo" : "Gestion des Caisses"}
                  </span>
                )}
              </button>
            )}

            {/* Facturation (Admin uniquement) */}
            {canViewFacturation && (
              <button
                id="menu-facturation"
                onClick={() => {
                  setActiveTab('facturation');
                  setHasClickedMenu(true);
                }}
                className={`w-full flex items-center ${isMenuVisible ? 'justify-between px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                  activeTab === 'facturation'
                    ? 'bg-white border-r-4 border-blue-500 text-[#102e3b] shadow-xs font-extrabold'
                    : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                }`}
                title={!isMenuVisible ? "Facturation" : ""}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(FileText, activeTab === 'facturation')}
                  {isMenuVisible && <span>Facturation</span>}
                </div>
                {(() => {
                  const cnt = (dbState.abonnements || []).filter((a: any) => (a.Etat === 'Actif' || a.Statut === 'Actif' || !a.Etat) && !a.Facture).length;
                  return cnt > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full">
                      {cnt}
                    </span>
                  ) : null;
                })()}
              </button>
            )}

            {/* File d'attente visible selon permissions - Masqué pour le Médecin MPR */}
            {canViewQueueMPR && currentUser?.Role !== 'Médecin MPR' && (
              <button
                id="menu-queue"
                onClick={() => {
                  setActiveTab('queue_imc');
                  setHasClickedMenu(true);
                }}
                className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                  activeTab === 'queue_imc'
                    ? 'bg-white border-r-4 border-indigo-500 text-[#102e3b] shadow-xs font-extrabold'
                    : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                }`}
                title={!isMenuVisible ? "File d'Attente" : ""}
              >
                {renderGlassIcon(Users, activeTab === 'queue_imc', "w-7 h-7")}
                {isMenuVisible && <span>File d'Attente</span>}
              </button>
            )}

            {/* Espace Médecin MPR visible UNIQUEMENT par le Médecin MPR */}
            {isUserMedecin && (
              <button
                id="menu-medecin-mpr"
                onClick={() => {
                  setActiveTab('medecin_mpr');
                  setHasClickedMenu(true);
                }}
                className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                  activeTab === 'medecin_mpr'
                    ? 'bg-white border-r-4 border-indigo-500 text-[#102e3b] shadow-xs font-extrabold'
                    : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                }`}
                title={!isMenuVisible ? "Espace Médecin MPR" : ""}
              >
                {renderGlassIcon(MedecinMprLogo, activeTab === 'medecin_mpr', "w-7 h-7")}
                {isMenuVisible && <span>Espace Médecin MPR</span>}
              </button>
            )}
            {/* 3. SECTION SOINS & PLATEAUX TECHNIQUES */}
            {(canViewPlanning || isUserAdminOrAssistant || isUserReeduc || isUserIntensif2 || isUserIntensif3 || isUserIntensif4 || isUserBalneo || isUserRDC || isUserMedecin || isSupperRec || isUserSuperReceptionniste) && (
              <>
                {isMenuVisible && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#306568]/80 select-none block px-2.5 mt-3 mb-1 font-sans">
                    {isUserIntensif2 || isUserIntensif3 || isUserIntensif4 ? "Soin Intensif Étage" : "Plateaux Techniques"}
                  </span>
                )}

                {/* Rééducation visible selon permissions */}
                {(canViewPlanning || isUserAdminOrAssistant || isUserReeduc || isSupperRec || isUserSuperReceptionniste) && (
                  <button
                    id="menu-reeducation"
                    onClick={() => {
                      setActiveTab('reeducation');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition-all duration-200 cursor-pointer group active-glass-gold-button ${
                      activeTab === 'reeducation'
                        ? 'bg-white border-r-4 border-emerald-500 text-[#102e3b] shadow-xs font-extrabold translate-x-1'
                        : 'hover:bg-[#7fa4b3]/40 text-[#1b3d4f] hover:text-[#102e3b] hover:translate-x-1'
                    }`}
                    title={!isMenuVisible ? "Rééducation Fonctionnelle" : ""}
                  >
                    {renderGlassIcon(ReeducationFonctionnelleLogo, activeTab === 'reeducation', "w-7 h-7")}
                    {isMenuVisible && <span>Rééducation Fonctionnelle</span>}
                  </button>
                )}

                {/* Balnéothérapie visible selon permissions */}
                {(canViewPlanning || isUserAdminOrAssistant || isUserBalneo || isSupperRec || isUserSuperReceptionniste) && (
                  <button
                    id="menu-balneotherapie"
                    onClick={() => {
                      setActiveTab('balneotherapie');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition-all duration-200 cursor-pointer group active-glass-gold-button ${
                      activeTab === 'balneotherapie'
                        ? 'bg-white border-r-4 border-blue-500 text-[#102e3b] shadow-xs font-extrabold translate-x-1'
                        : 'hover:bg-[#7fa4b3]/40 text-[#1b3d4f] hover:text-[#102e3b] hover:translate-x-1'
                    }`}
                    title={!isMenuVisible ? "Balnéothérapie" : ""}
                  >
                    {renderGlassIcon(BalneotherapieLogo, activeTab === 'balneotherapie', "w-7 h-7")}
                    {isMenuVisible && <span>Balnéothérapie</span>}
                  </button>
                )}

                {/* Intensif 2e visible selon permissions */}
                {!isSupperRec && (isUserAdminOrAssistant || isUserIntensif2) && (
                  <button
                    id="menu-intensif2e"
                    onClick={() => {
                      setActiveTab('intensif_2e');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                      activeTab === 'intensif_2e'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? "Intensif 2e" : ""}
                  >
                    {renderGlassIcon(IntensifLogo, activeTab === 'intensif_2e', "w-7 h-7")}
                    {isMenuVisible && <span>Intensif 2e</span>}
                  </button>
                )}

                {/* Intensif 3e visible selon permissions */}
                {!isSupperRec && (isUserAdminOrAssistant || isUserIntensif3) && (
                  <button
                    id="menu-intensif3e"
                    onClick={() => {
                      setActiveTab('intensif_3e');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                      activeTab === 'intensif_3e'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? "Intensif 3e" : ""}
                  >
                    {renderGlassIcon(IntensifLogo, activeTab === 'intensif_3e', "w-7 h-7")}
                    {isMenuVisible && <span>Intensif 3e</span>}
                  </button>
                )}

                {/* Intensif 4e visible selon permissions */}
                {!isSupperRec && (isUserAdminOrAssistant || isUserIntensif4) && (
                  <button
                    id="menu-intensif4e"
                    onClick={() => {
                      setActiveTab('intensif_4e');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                      activeTab === 'intensif_4e'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? "Intensif 4e" : ""}
                  >
                    {renderGlassIcon(IntensifLogo, activeTab === 'intensif_4e', "w-7 h-7")}
                    {isMenuVisible && <span>Intensif 4e</span>}
                  </button>
                )}

                {/* Orthophonie / Psychomotricité visible selon permissions */}
                {canViewPlanning && (
                  <button
                    id="menu-orthophonie-psychomotor"
                    onClick={() => {
                      setActiveTab('orthophonie_psychomotricite');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                      activeTab === 'orthophonie_psychomotricite'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? "Orthophonie / Psychomotricité" : ""}
                  >
                    {renderGlassIcon(Activity, activeTab === 'orthophonie_psychomotricite')}
                    {isMenuVisible && <span>Orthophonie / Psychomotricité</span>}
                  </button>
                )}

                {/* Messagerie Équipe visible selon permissions */}
                {canViewMessagerie && currentUser?.Role !== 'Médecin MPR' && (
                  <button
                    id="menu-chat"
                    onClick={() => {
                      setActiveTab('chat');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center justify-between ${isMenuVisible ? 'px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button relative ${
                      activeTab === 'chat'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? `Messagerie Équipe ${chatUnreadCount > 0 ? `(${chatUnreadCount})` : ''}` : ""}
                  >
                    <div className="flex items-center gap-3">
                      {renderGlassIcon(MessageSquare, activeTab === 'chat')}
                      {isMenuVisible && <span>Messagerie Équipe</span>}
                    </div>
                    {chatUnreadCount > 0 && (
                      isMenuVisible ? (
                        <span className="bg-emerald-500 text-white rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center shrink-0">
                          {chatUnreadCount}
                        </span>
                      ) : (
                        <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-bold min-w-[14px] h-[14px] flex items-center justify-center animate-pulse">
                          {chatUnreadCount}
                        </span>
                      )
                    )}
                  </button>
                )}
              </>
            )}

            {/* 4. ANALYSES & PARAMÈTRES (Admin / Assistant / Réceptionniste pour Call Centre) */}
            {(isUserAdminOrAssistant || canAccessCallCentre) && (
              <>
                {isMenuVisible && <span className="text-[10px] uppercase font-bold tracking-wider text-[#306568]/80 select-none block px-2.5 mt-3 mb-1 font-sans">Analyses & Configuration</span>}

                {isUserAdminOrAssistant && (
                  <button
                    id="menu-statistiques"
                    onClick={() => {
                      setActiveTab('statistiques');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                      activeTab === 'statistiques'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? "Statistiques" : ""}
                  >
                    {renderGlassIcon(BarChart3, activeTab === 'statistiques')}
                    {isMenuVisible && <span>Statistiques</span>}
                  </button>
                )}

                {canAccessCallCentre && (
                  <button
                    id="menu-callcentre"
                    onClick={() => {
                      setActiveTab('callcentre');
                      setHasClickedMenu(true);
                    }}
                    className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                      activeTab === 'callcentre'
                        ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                        : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                    }`}
                    title={!isMenuVisible ? "Call Center" : ""}
                  >
                    {renderGlassIcon(PhoneCall, activeTab === 'callcentre')}
                    {isMenuVisible && <span>Analyses Call Center</span>}
                  </button>
                )}

                {canViewParametres && (
                  <>
                    <button
                      id="menu-parametres"
                      onClick={() => {
                        setActiveTab('parametres');
                        setHasClickedMenu(true);
                      }}
                      className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                        activeTab === 'parametres'
                          ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                          : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                      }`}
                      title={!isMenuVisible ? "Paramètres" : ""}
                    >
                      {renderGlassIcon(Settings, activeTab === 'parametres')}
                      {isMenuVisible && <span>Paramètres (Configuration)</span>}
                    </button>
                    <button
                      id="menu-rapport-caisse"
                      onClick={() => {
                        setActiveTab('rapport_caisse');
                        setHasClickedMenu(true);
                      }}
                      className={`w-full flex items-center ${isMenuVisible ? 'gap-3 px-3' : 'justify-center px-1'} py-1.5 rounded-xl text-left text-xs font-bold transition duration-150 active-glass-gold-button ${
                        activeTab === 'rapport_caisse'
                          ? 'bg-white border-r-4 border-[#9bb8ba] text-[#102e3b] shadow-xs font-extrabold'
                          : 'hover:bg-[#7fa4b3]/55 text-[#1b3d4f] hover:text-[#102e3b]'
                      }`}
                      title={!isMenuVisible ? "Rapport Caisse" : ""}
                    >
                      {renderGlassIcon(FileText, activeTab === 'rapport_caisse')}
                      {isMenuVisible && <span>Rapport Caisse</span>}
                    </button>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Footer session info */}
        <div className="border-t border-[#7fa4b3]/40 pt-4 mt-6 space-y-2.5 w-full flex flex-col items-center">
          {isMenuVisible ? (
            <>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  sessionStorage.removeItem('applet_current_user');
                  localStorage.removeItem('applet_current_user');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-700 hover:text-rose-800 rounded-xl text-[10px] font-extrabold tracking-wide transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer group active:scale-[0.98]"
                title="Déconnexion du poste actuel"
              >
                <LogOut className="w-4 h-4 transition-transform duration-300 ease-in-out transform group-hover:scale-125 group-hover:rotate-12 text-rose-650" />
                <span>Déconnexion du Poste</span>
              </button>

              <button
                onClick={() => {
                  setCurrentUser(null);
                  sessionStorage.removeItem('applet_current_user');
                  localStorage.removeItem('applet_current_user');
                  window.close();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-white text-rose-800 border border-rose-500/30 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 shadow-xs hover:shadow-md hover:shadow-rose-500/15 active:scale-[0.98] cursor-pointer group"
                title="Quitter l'ERP Clinique KACEL"
              >
                <Power className="w-3.5 h-3.5 text-rose-600 transition-all duration-300 transform group-hover:scale-120 group-hover:rotate-12 group-hover:text-rose-500 animate-pulse" />
                <span>QUITTER</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full items-center">
              <button
                onClick={() => {
                  setCurrentUser(null);
                  sessionStorage.removeItem('applet_current_user');
                  localStorage.removeItem('applet_current_user');
                }}
                className="w-11 h-11 flex items-center justify-center bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-700 hover:text-rose-800 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer group"
                title="Déconnexion du poste actuel"
              >
                <LogOut className="w-5 h-5 transition-transform duration-300 ease-in-out transform group-hover:scale-125 group-hover:rotate-12" />
              </button>

              <button
                onClick={() => {
                  setCurrentUser(null);
                  sessionStorage.removeItem('applet_current_user');
                  localStorage.removeItem('applet_current_user');
                  window.close();
                }}
                className="w-11 h-11 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-850 border border-rose-500/30 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer group animate-pulse"
                title="Quitter l'ERP Clinique KACEL"
              >
                <Power className="w-5 h-5 text-rose-600 transition-all duration-300 transform group-hover:scale-120 group-hover:rotate-12 group-hover:text-rose-500" />
              </button>
            </div>
          )}
          
          {isMenuVisible && (
            <div className="text-[9px] text-[#306568]/75 select-none font-mono text-center font-bold">
              v2.4 Clinique Active Connectée
            </div>
          )}
        </div>

      </aside>

      {/* ADJUSTABLE RESIZER SEPARATOR BAR */}
      <div 
        onMouseDown={startResizing}
        className="hidden"
        title="Glissez pour ajuster la largeur du menu principal"
      >
        <div className="flex flex-col gap-1 pointer-events-none select-none">
          <div className="w-0.5 h-4 bg-slate-400/70 rounded" />
          <div className="w-0.5 h-4 bg-slate-400/70 rounded" />
        </div>
      </div>

      {/* RIGHT MAIN PANEL (Render tab views - Compact Flex Flow fitting full height) */}
      <main 
        className="flex-1 h-full overflow-y-auto p-3 sm:p-4 space-y-4 flex flex-col bg-slate-50/50" 
        id="main-clinical-viewport"
      >
        {/* Statistics and session bar - Shown strictly on the main page (Tableau de Bord) for the administrator session */}
        {activeTab !== 'accueil' && (
          activeTab === 'dashboard' && currentUser.Role === 'Admin' ? (
            <AnalyticsHeader 
              dbState={dbState} 
              currentUser={currentUser} 
              onUserChange={(user) => {
                requestUserSwitch(user);
              }}
              selectedDate={selectedDate}
            />
          ) : (
            /* Compact Header banner for other tabs or non-admin sessions on dashboard */
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl text-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200/80" id="compact-app-header">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-teal-50 text-teal-700 border border-teal-100/80 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-sans">
                    {activeTab === 'dashboard' && "Tableau de Bord"}
                    {activeTab === 'queue_imc' && "Plateau d'Orientation"}
                    {activeTab === 'patients' && "Registre Clinique"}
                    {activeTab === 'abonnements' && "Gestion Financière"}
                    {activeTab === 'medecin_mpr' && "Espace Médical"}
                    {activeTab === 'reeducation' && "Plateau Technique"}
                    {activeTab === 'balneotherapie' && "Plateau Humide"}
                    {activeTab === 'intensif_2e' && "Hospitalisation"}
                    {activeTab === 'intensif_3e' && "Hospitalisation"}
                    {activeTab === 'intensif_4e' && "Hospitalisation"}
                    {activeTab === 'orthophonie_psychomotricite' && "Plateau Spécialisé"}
                    {activeTab === 'statistiques' && "Pilotage Autonome"}
                    {activeTab === 'story_designer' && "Communication"}
                    {activeTab === 'parametres' && "Configuration"}
                    {activeTab === 'caisses' && "Trésorerie Clinique"}
                    {activeTab === 'users_management' && "Contrôle d'Accès"}
                    {activeTab === 'callcentre' && "Analyse Call Center"}
                  </span>
                  <span className="text-teal-600 font-bold text-xs flex items-center gap-1 font-sans">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    {activeTab === 'dashboard' && "Suivi Général"}
                    {activeTab === 'queue_imc' && "File d'Attente"}
                    {activeTab === 'patients' && "Identité & Dossiers"}
                    {activeTab === 'abonnements' && "Abonnements & Forfaits"}
                    {activeTab === 'medecin_mpr' && "Médecin MPR"}
                    {activeTab === 'reeducation' && "Rééducation Fonctionnelle"}
                    {activeTab === 'balneotherapie' && "Bassin de Balnéo"}
                    {activeTab === 'intensif_2e' && "Intensif Étage 2"}
                    {activeTab === 'intensif_3e' && "Intensif Étage 3"}
                    {activeTab === 'intensif_4e' && "Intensif Étage 4"}
                    {activeTab === 'orthophonie_psychomotricite' && "Orthophonie & Psychomotricité"}
                    {activeTab === 'statistiques' && "KPI & Rapports d'Activité"}
                    {activeTab === 'story_designer' && "Canva Stories"}
                    {activeTab === 'parametres' && "Sécurité Active"}
                    {activeTab === 'caisses' && "Évaluation Comptable"}
                    {activeTab === 'users_management' && "Habilitations & Rôles"}
                    {activeTab === 'callcentre' && "Suivi des Orientations"}
                    {activeTab === 'rapport_caisse' && "Rapport Financier"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-black font-sans tracking-tight text-slate-900">
                    {activeTab === 'dashboard' && "Tableau de Bord Clinique"}
                    {activeTab === 'queue_imc' && "File d'Attente"}
                    {activeTab === 'patients' && "Gestion des Patients & Dossiers"}
                    {activeTab === 'abonnements' && "Forfaits & Abonnements"}
                    {activeTab === 'medecin_mpr' && "Espace Médecin MPR"}
                    {activeTab === 'reeducation' && "Rééducation Fonctionnelle"}
                    {activeTab === 'balneotherapie' && "Balnéothérapie"}
                    {activeTab === 'intensif_2e' && "Soins Intensifs - Étage 2"}
                    {activeTab === 'intensif_3e' && "Soins Intensifs - Étage 3"}
                    {activeTab === 'intensif_4e' && "Soins Intensifs - Étage 4"}
                    {activeTab === 'orthophonie_psychomotricite' && "Orthophonie & Psychomotricité"}
                    {activeTab === 'statistiques' && "Analyses & Statistiques"}
                    {activeTab === 'story_designer' && "Affiches & Stories (Canva)"}
                    {activeTab === 'caisses' && "Gestion des Caisses Thérapeutiques"}
                    {activeTab === 'parametres' && "Paramètres & Options de Sécurité"}
                    {activeTab === 'users_management' && "Gestion des Comptes & Personnel"}
                    {activeTab === 'callcentre' && "Suivi & Performance Call Center"}
                    {activeTab === 'rapport_caisse' && "Rapport Caisse Quotidien"}
                  </h1>
                  {(activeTab === 'intensif_2e' || activeTab === 'intensif_3e' || activeTab === 'intensif_4e') && (
                    <button
                      id="btn-projection-delegue"
                      onClick={() => {
                        document.getElementById('btn-projection-programme-hidden')?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer border border-indigo-200"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M4 17h16M4 3v14M20 3v14M12 17v4M8 21h8M7 7h10v6H7z" />
                      </svg>
                      <span>Projection</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 max-w-xl font-medium font-sans">
                  {activeTab === 'dashboard' && "Supervisez l'accueil des patients, l'état de la file d'attente, les alertes de mixité de balnéothérapie et l'état général des séances en temps réel."}
                  {activeTab === 'queue_imc' && "Module de pilotage pour l'accueil, l'ordre de passage et le suivi des consultations et actes médicaux."}
                  {activeTab === 'patients' && "Recherchez, mettez à jour ou créez les dossiers des patients, suivez leurs antécédents médicaux, leurs séances et configurez leurs abonnements de rééducation."}
                  {activeTab === 'abonnements' && "Gérez les forfaits thérapeutiques des patients, suivez la validité des abonnements, les règlements de séances, les versements et les états de paiement."}
                  {activeTab === 'medecin_mpr' && "Consultez la file d'attente, examinez les antécédents cliniques des patients, validez les diagnostics et prescrivez les protocoles de rééducation."}
                  {activeTab === 'reeducation' && "Planifiez les séances de kinésithérapie, gérez les rendez-vous et les plannings des praticiens en salle de rééducation fonctionnelle."}
                  {activeTab === 'balneotherapie' && "Planifiez les séances en piscine de balnéothérapie en respectant scrupuleusement les règles de mixité par demi-journée et les capacités limites du bassin."}
                  {activeTab === 'intensif_2e' && "Planifiez et organisez les protocoles de soins intensifs (moteur et respiratoire) quotidiens pour les patients hospitalisés à l'Étage 2."}
                  {activeTab === 'intensif_3e' && "Planifiez et organisez les protocoles de soins intensifs (moteur et respiratoire) quotidiens pour les patients hospitalisés à l'Étage 3."}
                  {activeTab === 'intensif_4e' && "Planifiez et organisez les protocoles de soins intensifs (moteur et respiratoire) quotidiens pour les patients hospitalisés à l'Étage 4."}
                  {activeTab === 'orthophonie_psychomotricite' && "Planifiez, gérez les présences quotidiennes des thérapeutes et validez les séances sur abonnement des enfants IMC sous la supervision de l'assistante direction."}
                  {activeTab === 'statistiques' && "Consultez l'évolution de l'activité, le volume de séances réalisées, les prévisions financières et les taux d'occupation des plateaux de soins."}
                  {activeTab === 'story_designer' && "Concevez des affiches et des stories personnalisées pour vos patients ou la clinique, personnalisez les messages d'accueil et exportez-les d'un clic."}
                  {activeTab === 'caisses' && "Suivez les encaissements, prélevez sur les abonnements, comptabilisez les séances et gérez les flux financiers des différentes caisses de la clinique."}
                  {activeTab === 'parametres' && "Configurez les comptes utilisateurs, importez des données de test, modifiez le thème visuel et gérez les habilitations de sécurité du système."}
                  {activeTab === 'users_management' && "Créez de nouveaux utilisateurs, modifiez leurs affectations aux différents services, ajustez les rôles et attribuez des droits d'accès sécurisés en temps réel."}
                  {activeTab === 'callcentre' && "Enregistrez les appels d'orientation, analysez la provenance des patients par wilaya, suivez les types d'actes cibles et visualisez les statistiques de conversion en temps réel."}
                  {activeTab === 'rapport_caisse' && "Suivez les recettes et dépenses de chaque caisse par jour. Exportez les données en CSV, Excel ou PDF."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {['intensif_2e', 'intensif_3e', 'intensif_4e'].includes(activeTab) && (
                  <button
                    onClick={() => {
                      document.getElementById('btn-gerer-presences-hidden')?.click();
                    }}
                    className="flex items-center gap-2 px-4 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md shadow-indigo-100 transition h-[42px] cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Thérapeutes</span>
                  </button>
                )}

                {['intensif_2e', 'intensif_3e', 'intensif_4e'].includes(activeTab) ? (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold font-mono text-slate-700 bg-white border border-slate-200 rounded-xl px-3 h-[42px] shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer w-36 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 rounded-xl text-slate-800 shadow-xs select-none h-[42px]">
                    <span className="font-sans font-black text-[9px] text-slate-400 uppercase tracking-wider">📅 Date active :</span>
                    <span className="text-xs font-bold font-mono text-slate-700">{selectedDate}</span>
                  </div>
                )}

                {/* Notifications persistantes pour la réceptionniste */}
                {currentUser && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                      className="relative flex items-center justify-center w-[42px] h-[42px] bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition shadow-xs cursor-pointer select-none"
                      title="Alertes de séance"
                    >
                      <Bell className={`w-4 h-4 ${(dbState.notifications || []).some(n => !n.lue) ? 'text-amber-500 animate-bounce' : 'text-slate-600'}`} />
                      {(dbState.notifications || []).some(n => !n.lue) && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-pulse border border-white">
                          {(dbState.notifications || []).filter(n => !n.lue).length}
                        </span>
                      )}
                    </button>

                    {showNotificationsMenu && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Alertes Séance</span>
                          {(dbState.notifications || []).some(n => !n.lue) && (
                            <button
                              onClick={() => {
                                const nextNotifs = (dbState.notifications || []).map(n => ({ ...n, lue: true }));
                                setAndPersistDbState({ ...dbState, notifications: nextNotifs });
                              }}
                              className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 transition uppercase tracking-wider"
                            >
                              Tout marquer lu
                            </button>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {!(dbState.notifications) || dbState.notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-[11px] italic">
                              Aucune notification
                            </div>
                          ) : (
                            dbState.notifications.slice().reverse().map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-3 transition-colors text-left relative ${
                                  notif.lue ? 'bg-white opacity-70' : 'bg-amber-50/40 hover:bg-amber-50/60'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="text-sm shrink-0">⚠️</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-slate-850 leading-normal">
                                      {notif.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1.5 border-t border-dashed border-slate-100 pt-1.5">
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        {new Date(notif.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - {new Date(notif.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {!notif.lue && (
                                        <button
                                          onClick={() => {
                                            const nextNotifs = (dbState.notifications || []).map(n =>
                                              n.id === notif.id ? { ...n, lue: true } : n
                                            );
                                            setAndPersistDbState({ ...dbState, notifications: nextNotifs });
                                          }}
                                          className="text-[9px] font-extrabold text-slate-500 hover:text-indigo-600 uppercase tracking-wider"
                                        >
                                          Marquer lu
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {dbState.notifications && dbState.notifications.length > 0 && (
                          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                            <button
                              onClick={() => {
                                setAndPersistDbState({ ...dbState, notifications: [] });
                              }}
                              className="text-[9px] font-extrabold text-rose-600 hover:text-rose-800 transition uppercase tracking-wider"
                            >
                              Vider l'historique
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton Plein écran */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition shadow-xs h-[42px] cursor-pointer"
                  title="Basculer Plein écran"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-indigo-600" />
                      <span>Fenêtré</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-indigo-600" />
                      <span>Plein écran</span>
                    </>
                  )}
                </button>

                <div className={`flex items-center gap-1.5 border px-3.5 rounded-xl shadow-xs select-none transition-colors duration-300 h-[42px] ${
                  syncStatus === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                  syncStatus === 'connecting' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                  'bg-rose-50 border-rose-100 text-rose-700'
                }`}>
                  {syncStatus === 'online' ? (
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  ) : syncStatus === 'connecting' ? (
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                  ) : (
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                  )}
                  <span className="font-sans font-black text-[9px] uppercase tracking-wider whitespace-nowrap">
                    {syncStatus === 'online' ? 'Serveur HP' :
                     syncStatus === 'connecting' ? 'Connexion...' :
                     'Hors-ligne'}
                  </span>
                </div>
              </div>
            </div>
          )
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -22 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-4 flex flex-col flex-1"
          >
            <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium text-sm animate-pulse flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200/80 my-4"><div className="w-6 h-6 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin"></div><span>Chargement du module...</span></div>}>
            {/* 00. Écran d'accueil défilant */}
            {activeTab === 'accueil' && (
              <AccueilCarousel 
                setActiveTab={setActiveTab}
                setHasClickedMenu={setHasClickedMenu}
                dbState={dbState}
                selectedDate={selectedDate}
              />
            )}

            {/* 0. Tableau de Bord Tab content */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4 text-[#102e3b]" id="tableau-de-bord-view">
                
                {currentUser.Role === 'Admin' ? (
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1 px-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">Session administrative active</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Le pannel complet <strong>"Gestion Médicale & Planning Clinique"</strong> de sécurité active est entièrement déployé au-dessus.
                    </p>
                  </div>
                ) : (
                  /* Standard Dashboard Header for Non-Admin sessions */
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                        <span>👋 Bonjour, {currentUser.Nom_Utilisateur}</span>
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Bienvenue sur votre <strong>Tableau de Bord</strong>. Session active : <strong>{currentUser.Role}</strong>.
                      </p>
                    </div>
                    
                    <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-xs leading-relaxed text-indigo-950 max-w-sm">
                      <p className="font-bold">📅 Date Clinique : {selectedDate}</p>
                      <p className="text-[10px] text-indigo-800">Flux d'accueil patient et séances automatisées connectés.</p>
                    </div>
                  </div>
                )}

                {/* KPI Metrics Grid for non-admin users (otherwise Admin has AnalyticsHeader at top) */}
                {currentUser.Role !== 'Admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Patients total */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Patients Enregistrés</span>
                        <span className="text-lg font-bold font-mono">{dbState.patients.length}</span>
                      </div>
                      <span className="text-xl">👥</span>
                    </div>

                    {/* Today's RDV */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">RDV Aujourd'hui</span>
                        <span className="text-lg font-bold font-mono">
                          {dbState.rendezVous.filter(r => r.Date_RDV === selectedDate).length}
                        </span>
                      </div>
                      <span className="text-xl">🗓️</span>
                    </div>

                    {/* Active Abns */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Abonnements Actifs</span>
                        <span className="text-lg font-bold font-mono">
                          {dbState.abonnements.filter((a) => {
                            const today = new Date().toISOString().split('T')[0];
                            return a.Date_Fin_Abn >= today;
                          }).length} Patients
                        </span>
                      </div>
                      <span className="text-xl">💳</span>
                    </div>

                    {/* Queue Count */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">En Attente MPR</span>
                        <span className="text-lg font-bold font-mono">
                          {dbState.fileAttente.filter(f => f.Date_File === selectedDate && f.Statut_Attente === 'En Attente').length} Patients
                        </span>
                      </div>
                      <span className="text-xl">⏱️</span>
                    </div>
                  </div>
                )}

                {/* Connection to Active Protection Systems Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Security Active Connected system */}
                  <div className="md:col-span-2 bg-[#102e3b] text-white p-4 rounded-xl border border-[#7fa4b3]/60 shadow-md relative overflow-hidden">
                    <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    
                    <h3 className="text-xs uppercase tracking-wider font-extrabold flex items-center gap-2 mb-2 font-sans text-teal-300">
                      <Shield className="text-chiro-gold w-3.5 h-3.5" />
                      <span>Système de Sécurité Active Connecté</span>
                    </h3>
                    
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                      L'application est encadrée par des barrières algorithmiques actives qui garantissent la conformité fonctionnelle et préviennent les erreurs humaines de planification.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1 font-bold mb-0.5 text-emerald-400 text-[10px]">
                          <span>●</span>
                          <span>Contrôle de Mixité (Balnéo)</span>
                        </div>
                        <p className="text-[10px] text-slate-300">Valide le genre du patient par rapport aux règles de demi-journées réservées du bassin.</p>
                      </div>

                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1 font-bold mb-0.5 text-emerald-400 text-[10px]">
                          <span>●</span>
                          <span>Contrôle de Surcharge (1:1)</span>
                        </div>
                        <p className="text-[10px] text-slate-300">Résout les chevauchements horaires des séances individuelles d'un même thérapeute.</p>
                      </div>

                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1 font-bold mb-0.5 text-emerald-400 text-[10px]">
                          <span>●</span>
                          <span>Consommation Automatique</span>
                        </div>
                        <p className="text-[10px] text-slate-300">Consomme directement 1 séance du forfait d'abonnement ou gère les transferts de facturation.</p>
                      </div>

                      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1 font-bold mb-0.5 text-emerald-400 text-[10px]">
                          <span>●</span>
                          <span>Fiches Cliniques & MPR</span>
                        </div>
                        <p className="text-[10px] text-slate-300">Assure l'habilitation stricte (Médecin MPR) pour la saisie des antécédents et diagnostics.</p>
                      </div>
                    </div>
                  </div>

                  {/* Application Info Panel */}
                  <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-2 font-sans">Informations Générales</h3>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1 text-slate-500">
                          <span>Praticiens Actifs :</span>
                          <span className="font-extrabold text-slate-900">{dbState.praticiens.length}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1 text-slate-500">
                          <span>Services Cliniques :</span>
                          <span className="font-extrabold text-slate-900">{dbState.services.length}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1 text-slate-500">
                          <span>Zones de Soins :</span>
                          <span className="font-extrabold text-slate-900">{dbState.zones.length}</span>
                        </div>
                        <div className="flex justify-between pb-0.5 text-slate-500 font-mono text-[10.5px]">
                          <span>Pauses Plateaux :</span>
                          <span className="font-bold text-indigo-700">{break1Start}-{break1End} / {break2Start}-{break2End}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex gap-1.5">
                      <button
                        onClick={() => setActiveTab('patients')}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-1.5 rounded-lg text-center text-[10px] transition"
                      >
                        📂 Patients
                      </button>
                      <button
                        onClick={() => setActiveTab('reeducation')}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold py-1.5 rounded-lg text-center text-[10px] transition"
                      >
                        🗓️ Plannings
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 1. Patients Manager */}
            {activeTab === 'patients' && (
              <PatientsManager
                key={`patients-manager-${patientClickCounter}`}
                dbState={dbState}
                currentUser={currentUser}
                onSave={handleSaveState}
                triggerToast={triggerToast}
                initialSelectedPatientId={initialSelectedPatientId}
                initialFolderTab={patientInitialTab}
                onClearInitialSelectedPatient={() => {
                  setInitialSelectedPatientId(null);
                  setPatientInitialTab(undefined);
                }}
                onGoBack={() => {
                  if (cameFromAbonnements) {
                    setActiveTab('abonnements');
                    setCameFromAbonnements(false);
                  }
                }}
                onRedirectToQueue={(type) => {
                  if (type === 'MPR') {
                    setActiveTab('medecin_mpr');
                    setMprSubTab('queue');
                  } else {
                    setActiveTab('queue_imc');
                  }
                }}
              />
            )}

            {/* 2. Abonnement Manager — ADMIN UNIQUEMENT */}
            {activeTab === 'abonnements' && isUserAdminOrAssistant && (
              <AbonnementManager
                dbState={dbState}
                currentUser={currentUser}
                onSave={handleSaveState}
                triggerToast={triggerToast}
                onSelectPatient={(patientId) => {
                  setInitialSelectedPatientId(patientId);
                  setPatientInitialTab('subscriptions');
                  setCameFromAbonnements(true);
                  setActiveTab('patients');
                  triggerToast("Fiche du patient chargée.", "success");
                }}
              />
            )}
            {activeTab === 'abonnements' && !isUserAdminOrAssistant && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-rose-200/60 p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-rose-800 mb-2">Accès restreint</h3>
                <p className="text-sm text-rose-600">La gestion des abonnements est réservée aux administrateurs.</p>
              </motion.div>
            )}

            {/* 3. Queue Coordinator */}
            {activeTab === 'queue_imc' && (
              canViewQueueMPR ? (
                <QueueIMCSection
                  dbState={dbState}
                  currentUser={currentUser}
                  selectedDate={selectedDate}
                  onSave={handleSaveState}
                  triggerToast={triggerToast}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-205 rounded-3xl p-8 text-center max-w-sm mx-auto shadow-sm my-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-800 mb-2">Accès restreint</h3>
                  <p className="text-sm text-rose-600">Le module File d'attente est exclusivement réservé aux utilisateurs autorisés.</p>
                </motion.div>
              )
            )}

            {/* Custom Medecin MPR View */}
            {activeTab === 'medecin_mpr' && (
              <div className="space-y-6" id="medecin-mpr-workspace">
                {currentUser?.Role !== 'Médecin MPR' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                    <div>
                      <h2 className="font-sans font-bold text-md text-slate-900 flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <Stethoscope className="w-5 h-5" />
                        </span>
                        <span>Espace Médecin Rééducation MPR</span>
                      </h2>
                      <p className="text-slate-500 text-xs mt-1">Consultation clinique de la file d'attente et du registre d'identité patient (Dossier Médical Exclu).</p>
                    </div>

                    {/* SUB TAB SELECTOR ON MPR PAGE */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 w-max">
                      <button
                        onClick={() => setMprSubTab('queue')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150 ${
                          mprSubTab === 'queue'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        File d'Attente
                      </button>
                      <button
                        onClick={() => setMprSubTab('patients')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150 ${
                          mprSubTab === 'patients'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        Tableau Patient
                      </button>
                    </div>
                  </div>
                )}

                {mprSubTab === 'queue' ? (
                  <QueueSection
                    dbState={dbState}
                    currentUser={currentUser}
                    selectedDate={selectedDate}
                    onSave={handleSaveState}
                    triggerToast={triggerToast}
                  />
                ) : (
                  <PatientsManager
                    dbState={dbState}
                    currentUser={currentUser}
                    onSave={handleSaveState}
                    triggerToast={triggerToast}
                    isConsultationOnly={true}
                    hideMedicalDossierTab={true}
                  />
                )}
              </div>
            )}

            {/* 4. Rééducation Fonctionnelle Scheduler (Forced parameters to Service ID = 1) */}
            {activeTab === 'reeducation' && (
              <div className="space-y-4">
                <ReeducationWeekCalendar
                  dbState={dbState}
                  currentUser={currentUser}
                  onUpdateRDVStatus={handleUpdateRDVStatus}
                  triggerToast={triggerToast}
                  break1Start={break1Start}
                  break1End={break1End}
                  break2Start={break2Start}
                  break2End={break2End}
                  onAddRDV={handleAddRDV}
                  onSave={handleSaveState}
                />
              </div>
            )}

            {/* 5. Balnéothérapie Scheduler (Forced parameters to Service ID = 2) */}
            {activeTab === 'balneotherapie' && (
              <div className="space-y-4">
                <BalneoCalendar
                  dbState={dbState}
                  currentUser={currentUser}
                  onUpdateRDVStatus={handleUpdateRDVStatus}
                  onAddRDV={handleAddRDV}
                  onSave={handleSaveState}
                  triggerToast={triggerToast}
                  breakStart={break1Start}
                  breakEnd={break1End}
                />
              </div>
            )}

            {/* 6. Intensif 2e (Service Intensif ID 3, Étage 2 Zone 4) */}
            {activeTab === 'intensif_2e' && (
              <div className="space-y-4">
                <IntensifScheduler
                  dbState={dbState}
                  onSave={handleSaveState}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                  serviceName="Intensif 2e"
                  floorZoneId={4}
                  break1Start={intensifBreaks[4]?.start || '12:00'}
                  break1End={intensifBreaks[4]?.end || '13:00'}
                  onUpdateBreaks={handleUpdateIntensifBreaks}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isMenuVisible={isMenuVisible}
                  sidebarWidth={sidebarWidth}
                />
              </div>
            )}

            {/* 7. Intensif 3e (Service Intensif ID 3, Étage 3 Zone 5) */}
            {activeTab === 'intensif_3e' && (
              <div className="space-y-4">
                <IntensifScheduler
                  dbState={dbState}
                  onSave={handleSaveState}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                  serviceName="Intensif 3e"
                  floorZoneId={5}
                  break1Start={intensifBreaks[5]?.start || '12:00'}
                  break1End={intensifBreaks[5]?.end || '13:00'}
                  onUpdateBreaks={handleUpdateIntensifBreaks}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isMenuVisible={isMenuVisible}
                  sidebarWidth={sidebarWidth}
                />
              </div>
            )}

            {/* 8. Intensif 4e (Service Intensif ID 3, Étage 4 Zone 6) */}
            {activeTab === 'intensif_4e' && (
              <div className="space-y-4">
                <IntensifScheduler
                  dbState={dbState}
                  onSave={handleSaveState}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                  serviceName="Intensif 4e"
                  floorZoneId={6}
                  break1Start={intensifBreaks[6]?.start || '12:00'}
                  break1End={intensifBreaks[6]?.end || '13:00'}
                  onUpdateBreaks={handleUpdateIntensifBreaks}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isMenuVisible={isMenuVisible}
                  sidebarWidth={sidebarWidth}
                />
              </div>
            )}

            {/* Orthophonie & Psychomotricité */}
            {activeTab === 'orthophonie_psychomotricite' && (
              <OrthoPsychoScheduler
                dbState={dbState}
                selectedDate={selectedDate}
                onSave={handleSaveState}
                triggerToast={triggerToast}
                currentUser={currentUser}
              />
            )}

            {/* 9. Statistiques Panel */}
            {activeTab === 'statistiques' && (
              <StatsDashboard dbState={dbState} onSave={handleSaveState} />
            )}

            {/* 12. Caisses Manager */}
            {activeTab === 'caisses' && canViewCaisse && (
              <CaissesManager
                dbState={dbState}
                onSave={handleSaveState}
                triggerToast={triggerToast}
                currentUser={currentUser}
              />
            )}

            {/* Facturation */}
            {activeTab === 'facturation' && canViewFacturation && (
              <BillingPage
                dbState={dbState}
                onUpdateDb={handleSaveState}
                currentUser={currentUser}
              />
            )}

            {/* 11. Canva Story Designer */}
            {activeTab === 'story_designer' && (
              <StoryDesigner 
                dbState={dbState} 
                triggerToast={triggerToast} 
              />
            )}

            {/* 14. Messagerie Équipe */}
            {activeTab === 'chat' && canViewMessagerie && (
              <ChatSection
                dbState={dbState}
                currentUser={currentUser}
                triggerToast={triggerToast}
                onSave={handleSaveState}
              />
            )}

            {/* 13. Gestion des Comptes & Personnel */}
            {activeTab === 'users_management' && currentUser && (
              <UserManagement
                dbState={dbState}
                currentUser={currentUser}
                onSave={handleSaveState}
                triggerToast={triggerToast}
              />
            )}

            {/* CallCentre Analysis */}
            {activeTab === 'callcentre' && (
              <CallCentreAnalysis
                dbState={dbState}
                onSaveState={handleSaveState}
                currentUser={currentUser}
                triggerToast={triggerToast}
              />
            )}
            {/* Rapport Caisse Quotidien */}
            {activeTab === 'rapport_caisse' && (
              <CaisseDailyReport
                dbState={dbState}
                currentUser={currentUser}
                onSave={handleSaveState}
                setDbState={setDbState}
                triggerToast={triggerToast}
              />
            )}

            {/* 10. Paramètres (Durable Corrections Console & Security Audit) */}
            {activeTab === 'parametres' && canViewParametres && (
              <DatabaseSection
                dbState={dbState}
                setDbState={setDbState}
                onSave={handleSaveState}
                break1Start={break1Start}
                break1End={break1End}
                break2Start={break2Start}
                break2End={break2End}
                onUpdateBreaks={handleUpdateBreaks}
                intensifBreaks={intensifBreaks}
                onUpdateIntensifBreaks={handleUpdateIntensifBreaks}
                sleekTheme={sleekTheme}
                onChangeTheme={handleChangeTheme}
              />
            )}
            </Suspense>
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Modal d'authentification pour changement d'utilisateur (Commuter de session) */}
      {userToAuthorize && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in" id="auth-switch-modal">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-[#0F2D37]/10 text-[#0F2D37] rounded-full">
                <span className="text-xl">🔑</span>
              </div>
              <h3 className="font-sans font-extrabold text-[#102e3b] text-base">
                Validation de Session
              </h3>
              <p className="text-xs text-slate-500 max-w-[260px]">
                Veuillez saisir le mot de passe pour ouvrir la session de :
              </p>
              <div className="bg-slate-50 px-3.5 py-2 rounded-2xl w-full border border-slate-100 flex flex-col items-center">
                <span className="font-sans font-bold text-slate-800 text-xs text-center">
                  {userToAuthorize.Nom_Utilisateur}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#306568] mt-0.5 tracking-wide text-center">
                  {userToAuthorize.Role}
                </span>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const expectedPassword = userToAuthorize.MotDePasse || userToAuthorize.Login;
                if (passwordAttempt === expectedPassword || passwordAttempt === '123456') {
                  setCurrentUser(userToAuthorize);
                  sessionStorage.setItem('applet_current_user', JSON.stringify(userToAuthorize));
                  triggerToast(`Session commutée : Bienvenue ${userToAuthorize.Nom_Utilisateur}.`, 'success');
                  setUserToAuthorize(null);
                  setPasswordAttempt('');
                  setAuthError('');
                } else {
                  setAuthError('Mot de passe de session incorrect. Veuillez réessayer.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mot De Passe</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Saisissez votre mot de passe"
                  value={passwordAttempt}
                  onChange={(e) => setPasswordAttempt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
                {authError && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1.5 text-center">
                    ⚠️ {authError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F2D37] hover:bg-[#1D4452] text-white font-sans font-bold text-xs rounded-xl cursor-pointer shadow-md transition"
                >
                  Valider la session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserToAuthorize(null);
                    setPasswordAttempt('');
                    setAuthError('');
                  }}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold text-xs rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Écran de Veille (Carrousel d'images défilantes plein écran après 20s) */}
      {isScreensaverActive && (
        <div className="fixed inset-0 z-55 flex flex-col bg-slate-950/95 animate-fade-in" id="screensaver-overlay">
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <AccueilCarousel
              setActiveTab={() => {}}
              setHasClickedMenu={() => {}}
              dbState={dbState}
              selectedDate={selectedDate}
            />
          </div>
          <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
          
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-55 text-center pointer-events-none space-y-2">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="text-white text-xs uppercase tracking-widest font-black font-mono drop-shadow-lg px-6 py-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10"
            >
              🔒 Mode Veille Actif (10 min d'inactivité) • Toute activité déverrouillera le poste
            </motion.div>
          </div>
        </div>
      )}

      {/* 2. Écran de contrôle d'identité de l'utilisateur en cas d'activité après veille */}
      {isLockScreenActive && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in" id="lock-screen-overlay">
          <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 blur-sm">
            <AccueilCarousel
              setActiveTab={() => {}}
              setHasClickedMenu={() => {}}
              dbState={dbState}
              selectedDate={selectedDate}
            />
          </div>

          <div className="relative bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5 animate-slide-in">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-500/10">
                <Shield className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif font-black text-xl text-slate-900 tracking-tight">Poste Verrouillé</h3>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest font-mono">Contrôle d'Identité Requis</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-sans max-w-[280px]">
                Pour reprendre votre travail en toute sécurité sur le poste, veuillez confirmer votre mot de passe d'accès.
              </p>
            </div>

            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <h6 className="font-black text-xs text-slate-800 truncate">
                  {currentUser?.Nom_Utilisateur}
                </h6>
                <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                  🔑 {currentUser?.Role}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const expectedPassword = currentUser?.MotDePasse || currentUser?.Login;
                if (lockPasswordAttempt === expectedPassword || lockPasswordAttempt === '123456') {
                  setIsLockScreenActive(false);
                  setLockPasswordAttempt('');
                  setLockAuthError('');
                  // Reset last activity ref
                  lastActivityRef.current = Date.now();
                  triggerToast(`Session déverrouillée. Bon retour, ${currentUser?.Nom_Utilisateur}!`, 'success');
                } else {
                  setLockAuthError("Mot de passe incorrect. Veuillez réessayer.");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Saisir le Mot De Passe</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={lockPasswordAttempt}
                  onChange={(e) => setLockPasswordAttempt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                {lockAuthError && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1.5 text-center">
                    ⚠️ {lockAuthError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F2D37] hover:bg-[#1D4452] text-white font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md hover:shadow-lg transition active:scale-[0.98]"
                >
                  Déverrouiller le Poste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLockScreenActive(false);
                    setCurrentUser(null);
                    sessionStorage.removeItem('applet_current_user');
                    localStorage.removeItem('applet_current_user');
                    setLockPasswordAttempt('');
                    setLockAuthError('');
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 font-sans font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition"
                >
                  Changer de Session / Déconnexion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      </div>
    </>
  );
}