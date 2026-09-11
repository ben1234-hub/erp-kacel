import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Trash2, 
  ShieldAlert, 
  RefreshCw,
  Plus, 
  X, 
  CheckCircle,
  CheckCircle2,
  Search,
  UserPlus,
  ChevronDown,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  Info,
  Activity
} from 'lucide-react';
import { 
  Patient, 
  KinesitherapyAct, 
  BalneotherapieAppointment, 
  KinesitherapyAppointment, 
  GestionAbonnement, 
  Pack,
  Versement
} from '../types';
import { computeSubscriptionDetails } from '../utils';

// Helper formatting Date to String YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${d}`;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
};

interface RendezVousProps {
  currentRole: string;
  patients: Patient[];
  acts: KinesitherapyAct[];
  abonnements: GestionAbonnement[];
  versements: Versement[];
  packs: Pack[];
  balneoApps: BalneotherapieAppointment[];
  kineApps: KinesitherapyAppointment[];
  onAddBalneoApp: (app: Omit<BalneotherapieAppointment, 'id' | 'name'>) => void;
  onAddKineApp: (app: Omit<KinesitherapyAppointment, 'id' | 'name'>) => void;
  onUpdateBalneoState: (id: string, state: BalneotherapieAppointment['state']) => void;
  onUpdateKineState: (id: string, state: KinesitherapyAppointment['state']) => void;
  onToggleBalneoPatientPaid: (appId: string, patientId: string) => void;
  onToggleKineActPaid: (appId: string, actId: string, patientId: string) => void;
  
  // New administrative triggers for correcting entries
  onReactivateBalneoPatient: (appId: string, patientId: string) => void;
  onReactivateKineAct: (appId: string, actId: string, patientId: string) => void;
  
  // Eventual listing modifiers
  onRemoveBalneoPatient: (appId: string, patientId: string) => void;
  onRemoveKineAct: (appId: string, actId: string, patientId: string) => void;
  forcedService?: 'balneo' | 'adultes';
}

const getFrenchDayIndex = (dateStr: string): number => {
  const d = new Date(dateStr);
  const wDay = d.getDay();
  return wDay === 0 ? 6 : wDay - 1;
};

const DEFAULT_POOL_PLAN: Record<number, Record<string, 'H' | 'F'>> = {
  0: { // Lundi
    '08:00': 'F', '09:00': 'F', '10:00': 'F', '11:00': 'F', '12:00': 'F',
    '13:00': 'H', '14:00': 'H', '15:00': 'H', '16:00': 'H', '17:00': 'H', '17:30': 'H', '18:30': 'H', '19:30': 'H', '20:30': 'H'
  },
  1: { // Mardi
    '08:00': 'H', '09:00': 'H', '10:00': 'H', '11:00': 'H', '12:00': 'H',
    '13:00': 'F', '14:00': 'F', '15:00': 'F', '16:00': 'F', '17:00': 'F', '17:30': 'F', '18:30': 'F', '19:30': 'F', '20:30': 'F'
  },
  2: { // Mercredi
    '08:00': 'F', '09:00': 'F', '10:00': 'F', '11:00': 'F', '12:00': 'F',
    '13:00': 'H', '14:00': 'H', '15:00': 'H', '16:00': 'H', '17:00': 'H', '17:30': 'H', '18:30': 'H', '19:30': 'H', '20:30': 'H'
  },
  3: { // Jeudi
    '08:00': 'H', '09:00': 'H', '10:00': 'H', '11:00': 'H', '12:00': 'H',
    '13:00': 'F', '14:00': 'F', '15:00': 'F', '16:00': 'F', '17:00': 'F', '17:30': 'F', '18:30': 'F', '19:30': 'F', '20:30': 'F'
  },
  4: { // Vendredi
    '08:00': 'F', '09:00': 'F', '10:00': 'F', '11:00': 'F', '12:00': 'F',
    '13:00': 'H', '14:00': 'H', '15:00': 'H', '16:00': 'H', '17:00': 'H', '17:30': 'H', '18:35': 'H', '19:30': 'H', '20:30': 'H'
  },
  5: { // Samedi (8h-12h Femmes, 13h-17h Hommes)
    '08:00': 'F', '09:00': 'F', '10:00': 'F', '11:00': 'F', '12:00': 'F',
    '13:00': 'H', '14:00': 'H', '15:00': 'H', '16:00': 'H', '17:00': 'H', '17:30': 'H', '18:30': 'H', '19:30': 'H', '20:30': 'H'
  },
  6: { // Dimanche (8h-12h Hommes, 13h-17h Femmes)
    '08:00': 'H', '09:00': 'H', '10:00': 'H', '11:00': 'H', '12:00': 'H',
    '13:00': 'F', '14:00': 'F', '15:00': 'F', '16:00': 'F', '17:00': 'F', '17:30': 'F', '18:30': 'F', '19:30': 'F', '20:30': 'F'
  }
};

const CONFIG_DAYS = [
  { name: 'Samedi', index: 5, isWeekend: true },
  { name: 'Dimanche', index: 6, isWeekend: true },
  { name: 'Lundi', index: 0, isWeekend: false },
  { name: 'Mardi', index: 1, isWeekend: false },
  { name: 'Mercredi', index: 2, isWeekend: false },
  { name: 'Jeudi', index: 3, isWeekend: false }
];

export default function RendezVous({
  currentRole,
  patients,
  acts,
  abonnements,
  versements,
  packs,
  balneoApps,
  kineApps,
  onAddBalneoApp,
  onAddKineApp,
  onUpdateBalneoState,
  onUpdateKineState,
  onToggleBalneoPatientPaid,
  onToggleKineActPaid,
  onReactivateBalneoPatient,
  onReactivateKineAct,
  onRemoveBalneoPatient,
  onRemoveKineAct,
  forcedService
}: RendezVousProps) {
  const [activeServiceState, setActiveServiceState] = useState<'balneo' | 'adultes'>('balneo');
  
  const activeService = forcedService || activeServiceState;
  const setActiveService = (srv: 'balneo' | 'adultes') => {
    if (!forcedService) {
      setActiveServiceState(srv);
    }
  };
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDate(new Date()));
  const [filterTableRange, setFilterTableRange] = useState<'day' | 'week'>('day');
  
  // Modals controllers
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00');

  // Form selections
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedActId, setSelectedActId] = useState<string>(acts[0]?.id || '');
  
  // Slot gender-specific controls and validation
  const [creneauGender, setCreneauGender] = useState<'H' | 'F'>('H');
  const [addError, setAddError] = useState<string>('');

  // Weekly programmable pool plan state (persisted)
  const [poolWeeklyPlan, setPoolWeeklyPlan] = useState<Record<number, Record<string, 'H' | 'F'>>>(() => {
    const saved = localStorage.getItem('pool_weekly_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading pool weekly plan:', e);
      }
    }
    return DEFAULT_POOL_PLAN;
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const handleUpdatePoolPlanCell = (dayIndex: number, hour: string, gender: 'H' | 'F') => {
    const nextPlan = { ...poolWeeklyPlan };
    if (!nextPlan[dayIndex]) {
      nextPlan[dayIndex] = {};
    }
    nextPlan[dayIndex] = { ...nextPlan[dayIndex], [hour]: gender };
    setPoolWeeklyPlan(nextPlan);
    localStorage.setItem('pool_weekly_plan', JSON.stringify(nextPlan));
  };

  // Track direct cash usage vs subscription
  const [useUnitCashPayment, setUseUnitCashPayment] = useState<boolean>(false);

  // Administrative customizable breaks (defaults match 12h00-13h00 and 17h00-17h30)
  const [break1Start, setBreak1Start] = useState('12:00');
  const [break1End, setBreak1End] = useState('13:00');
  const [break2Start, setBreak2Start] = useState('17:00');
  const [break2End, setBreak2End] = useState('17:30');

  const isHourBreak = (hourStr: string) => {
    const toVal = (h: string) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh + mm / 60;
    };
    const val = toVal(hourStr);
    const b1S = toVal(break1Start);
    const b1E = toVal(break1End);
    const b2S = toVal(break2Start);
    const b2E = toVal(break2End);
    return (val >= b1S && val < b1E) || (val >= b2S && val < b2E);
  };

  // Time grid presets of 8h00 to 20h30 in hours (rows of the grid)
  const WORKING_HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '17:30', '18:30', '19:30', '20:30'
  ];

  // Helper calculating the week array starting from Saturday to Thursday (skipping Friday)
  const getWeekDays = (dateStr: string) => {
    const originalDate = new Date(dateStr);
    const days: { dateStr: string; label: string; shortLabel: string; dateObj: Date }[] = [];
    
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const shortDayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    for (let i = 0; i < 6; i++) {
      const nextDay = new Date(originalDate);
      nextDay.setDate(originalDate.getDate() + i);
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const d = String(nextDay.getDate()).padStart(2, '0');
      const dayDateStr = `${year}-${month}-${d}`;
      
      const wDay = nextDay.getDay(); // 0 is Sunday, ..., 6 is Saturday
      
      days.push({
        dateStr: dayDateStr,
        label: `${dayNames[wDay]} ${d}/${month}`,
        shortLabel: `${shortDayNames[wDay]} ${d}/${month}`,
        dateObj: nextDay
      });
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);

  // Week navigation triggers
  const handlePrevWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 7);
    setSelectedDate(formatDate(current));
  };

  const handleNextWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 7);
    setSelectedDate(formatDate(current));
  };

  const handleToday = () => {
    setSelectedDate(formatDate(new Date()));
  };

  // Handle slot selectors
  const handleSlotClick = (hour: string, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    if (dateStr) {
      setSelectedDate(dateStr);
    }
    setSelectedTimeSlot(hour);
    setAddError('');

    const targetDateTime = `${targetDate}T${hour}`;
    const existingApp = balneoApps.find(app => app.appointment_date === targetDateTime);
    
    // Day Index: 0 (Lundi) to 6 (Dimanche)
    const dayIdx = getFrenchDayIndex(targetDate);
    const templateGender = poolWeeklyPlan[dayIdx]?.[hour] || 'H';

    const finalGender = (existingApp?.creneau_gender === 'H' || existingApp?.creneau_gender === 'F')
      ? existingApp.creneau_gender as 'H' | 'F'
      : templateGender;

    setCreneauGender(finalGender);

    // Initialisation du patient sélectionné avec le premier patient éligible par genre
    const firstEligible = patients.find(p => {
      if (activeService === 'balneo') {
        if (finalGender === 'H') return p.gender === 'M';
        if (finalGender === 'F') return p.gender === 'F';
      }
      return true;
    });

    setSelectedPatientId(firstEligible?.id || '');
    setPatientSearchQuery('');
    setShowAddModal(true);
  };

  const handlePatientSelectChange = (patId: string) => {
    setSelectedPatientId(patId);
    setAddError('');
  };

  const handleInsertPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const targetDateTime = `${selectedDate}T${selectedTimeSlot}`;

    if (activeService === 'balneo') {
      const patient = patients.find(p => p.id === selectedPatientId);
      if (!patient) return;

      // Déterminer la demi-journée (Matin: < 13:00, Après-midi: >= 13:00)
      const isMorning = selectedTimeSlot < '13:00';
      
      // Vérifier si le patient est déjà sur un autre créneau de la même demi-journée
      const alreadyInHalfDay = balneoApps.some(app => {
        if (!app.appointment_date.startsWith(selectedDate)) return false;
        const appTime = app.appointment_date.split('T')[1];
        const appIsMorning = appTime < '13:00';
        if (appIsMorning !== isMorning) return false;
        return app.patients.some(p => p.patient_id === selectedPatientId);
      });

      if (alreadyInHalfDay) {
        setAddError("Patient déjà Programmé");
        return;
      }

      // Restreindre si le créneau possède un genre particulier
      if (creneauGender === 'H' && patient.gender === 'F') {
        setAddError("Action refusée : Ce créneau est réservé aux HOMMES.");
        return;
      }
      if (creneauGender === 'F' && patient.gender === 'M') {
        setAddError("Action refusée : Ce créneau est réservé aux FEMMES.");
        return;
      }

      const existingApp = balneoApps.find(app => app.appointment_date === targetDateTime);
      if (existingApp) {
        const isAlreadyRegistered = existingApp.patients.some(p => p.patient_id === selectedPatientId);
        if (isAlreadyRegistered) {
          setAddError("Patient déjà Programmé");
          return;
        }

        const updatedPatients = [...existingApp.patients, { patient_id: selectedPatientId, paid: false }];
        onUpdateBalneoState(existingApp.id, 'draft');
        onAddBalneoApp({
          appointment_date: targetDateTime,
          duration: existingApp.duration || 1.0,
          state: 'draft',
          patients: updatedPatients,
          creneau_gender: creneauGender
        });
      } else {
        onAddBalneoApp({
          appointment_date: targetDateTime,
          duration: 1.0,
          state: 'draft',
          patients: [{ patient_id: selectedPatientId, paid: false }],
          creneau_gender: creneauGender
        });
      }
    } else {
      // Pour le Service Adultes
      const existingApp = kineApps.find(app => app.appointment_date === targetDateTime);
      if (existingApp) {
        const isAlreadyRegistered = existingApp.selected_acts.some(a => a.patient_id === selectedPatientId && a.act_id === selectedActId);
        if (isAlreadyRegistered) {
          setAddError("Cet acte pour ce patient est déjà programmé sur ce créneau.");
          return;
        }

        const updatedActs = [...existingApp.selected_acts, {
          id: `sa-${Date.now()}`,
          act_id: selectedActId,
          patient_id: selectedPatientId,
          paid: false
        }];
        onAddKineApp({
          appointment_date: targetDateTime,
          state: 'draft',
          selected_acts: updatedActs
        });
      } else {
        onAddKineApp({
          appointment_date: targetDateTime,
          state: 'draft',
          selected_acts: [{
            id: `sa-${Date.now()}`,
            act_id: selectedActId,
            patient_id: selectedPatientId,
            paid: false
          }]
        });
      }
    }

    setShowAddModal(false);
  };

  // Helper validation to check if child has subscription left for Balneo / acts
  const getSubscriptionInfo = (patientId: string, actId?: string) => {
    const subs = abonnements.filter(abo => abo.patient_id === patientId);
    if (subs.length === 0) return null;

    // For Balneo, we search matching 'tab-2' (Abonnement Balnéo) or mixed 'tab-3'
    if (activeService === 'balneo') {
      const activeBalneoSub = subs.find(abo => {
        const p = packs.find(p => p.id === abo.pack_id);
        const remaining = (p?.nombre_seance || 0) - (abo.used_sessions || 0);
        return (p?.type_abonnement_id === 'tab-2' || p?.type_abonnement_id === 'tab-3') && remaining > 0;
      });
      if (activeBalneoSub) {
        const p = packs.find(p => p.id === activeBalneoSub.pack_id);
        return {
          code: activeBalneoSub.name,
          remaining: (p?.nombre_seance || 0) - activeBalneoSub.used_sessions
        };
      }
    } else if (actId) {
      // For Adult acts
      const activeKineSub = subs.find(abo => {
        const p = packs.find(p => p.id === abo.pack_id);
        const remaining = (p?.nombre_seance || 0) - (abo.used_sessions || 0);
        return p?.act_id === actId && remaining > 0;
      });
      if (activeKineSub) {
        const p = packs.find(p => p.id === activeKineSub.pack_id);
        return {
          code: activeKineSub.name,
          remaining: (p?.nombre_seance || 0) - activeKineSub.used_sessions
        };
      }
    }
    return null;
  };

  // Determine current role permissions
  const isAdmin = currentRole === 'admin';
  const isBalneoRecept = currentRole === 'recept_balneo' || currentRole === 'admin';
  const isAdultsRecept = currentRole === 'recept_adultes' || currentRole === 'admin';

  return (
    <div className="space-y-6" id="appointments-services-viewport">
      
      {/* Clinic Header controls */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold text-charcoal-900 tracking-tight flex items-center gap-1.5 font-sans">
              <Calendar className="w-5 h-5 text-teal-500" />
              Salles de Programmation & Grille de RDV
            </h3>
            <span className="text-[10px] font-mono font-bold bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-0.5 rounded-full uppercase font-sans">
              Rôle Actif : {currentRole.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl font-sans">
            Cliquez sur un créneau libre pour programmer un rendez-vous patient, puis gérerez les règlements sur le tableau synchronisé en bas.
          </p>
        </div>

        {/* Date visual control strip */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap font-sans">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-3xs bg-white text-xs font-bold leading-5">
            <button 
              type="button"
              onClick={handlePrevWeek}
              className="px-2.5 py-2 hover:bg-slate-50 cursor-pointer text-slate-600 border-r border-slate-200 transition-colors"
              title="Semaine précédente"
            >
              ← Préc.
            </button>
            <button 
              type="button"
              onClick={handleToday}
              className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 border-r border-slate-200 transition-colors"
            >
              Aujourd'hui
            </button>
            <button 
              type="button"
              onClick={handleNextWeek}
              className="px-2.5 py-2 hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"
              title="Semaine suivante"
            >
              Suiv. →
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 bg-charcoal-900 border border-teal-800 text-white p-2 rounded-xl">
            <span className="text-[10px] font-bold text-teal-200 uppercase font-mono tracking-wider">Jour ciblé:</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono font-extrabold text-xs outline-hidden cursor-pointer w-28 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Segment tabs: Services selector */}
      {!forcedService && (
        <div className="flex bg-slate-100 p-1.5 rounded-xl max-w-md border border-slate-200" id="appointments-segments">
          <button
            onClick={() => {
              setActiveService('balneo');
            }}
            className={`flex-1 text-center py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-all ${
              activeService === 'balneo' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            🌊 1 - Balnéothérapie
          </button>
          <button
            onClick={() => {
              setActiveService('adultes');
            }}
            className={`flex-1 text-center py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-all ${
              activeService === 'adultes' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            🏋️ 2 - Kiné Adultes
          </button>
        </div>
      )}

      {currentRole === 'admin' && (
        <div className="bg-slate-50 border border-slate-205 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in font-sans">
          <div className="space-y-1 block shrink-0">
            <h5 className="text-[11px] font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Activity className="w-4 h-4 text-teal-500 animate-pulse" />
              Réglages administratifs des Pauses (Réglable par l'Admin)
            </h5>
            <p className="text-[10px] text-slate-400 font-medium">
              Définissez les créneaux horaires réglementaires pour les pauses repas et de fin de journée.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            {/* Pause 1 */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-3xs">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Pause repas :</span>
              <input 
                type="text" 
                value={break1Start} 
                onChange={(e) => setBreak1Start(e.target.value)}
                className="w-11 text-center font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded p-1 text-[11px] font-mono outline-hidden" 
              />
              <span className="text-slate-300">à</span>
              <input 
                type="text" 
                value={break1End} 
                onChange={(e) => setBreak1End(e.target.value)}
                className="w-11 text-center font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded p-1 text-[11px] font-mono outline-hidden" 
              />
            </div>

            {/* Pause 2 */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-3xs">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Pause seconde :</span>
              <input 
                type="text" 
                value={break2Start} 
                onChange={(e) => setBreak2Start(e.target.value)}
                className="w-11 text-center font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded p-1 text-[11px] font-mono outline-hidden" 
              />
              <span className="text-slate-300">à</span>
              <input 
                type="text" 
                value={break2End} 
                onChange={(e) => setBreak2End(e.target.value)}
                className="w-11 text-center font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded p-1 text-[11px] font-mono outline-hidden" 
              />
            </div>
          </div>
        </div>
      )}

      {/* SERVICE 1: BALNÉOTHÉRAPIE VIEWPORT */}
      {activeService === 'balneo' && (isBalneoRecept) && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Scheduling Clock Weekly Grid */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-charcoal-900 uppercase font-mono tracking-wider flex items-center gap-2 font-sans">
                  <span>🌊 Grille Hebdomadaire de Balnéothérapie Collective (08h00 - 20h30)</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Les lignes représentent les heures et les colonnes les jours de la semaine clinique. Cliquez sur <span className="text-teal-500 font-bold">+</span> pour inscrire un patient.
                </p>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap font-sans">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Créneaux Piscine :</span>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-blue-800 bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>Créneau Hommes (🚹 Bleu)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-pink-800 bg-pink-50/70 border border-pink-100/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                    <span>Créneau Femmes (🚺 Rose)</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] bg-slate-100 text-slate-600 font-bold font-mono py-1 px-2 rounded-md font-sans">
                Horaires d'ouverture : 08:00 - 20:30
              </div>
            </div>

            {/* Programmable Pool Schedule Configurator (Admin Panel) */}
            <div className="border-t border-slate-100 pt-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                  className="text-xs bg-[#26a69a] hover:bg-[#00838f] text-white font-bold py-2 px-4 rounded-full inline-flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 font-sans"
                >
                  <span>{showConfigPanel ? '▲ Masquer configuration' : '⚙️ Configurer Planning Hebdomadaire'}</span>
                </button>
              )}

              {showConfigPanel && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-205 text-xs text-slate-700 space-y-4 animate-fade-in font-sans">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h5 className="font-extrabold text-slate-850 text-[11.5px] uppercase tracking-wide font-sans">
                        ⚙️ Programmation Hebdomadaire des Créneaux Réglementaires
                      </h5>
                      <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 font-sans">
                        Cliquez sur un bouton de la grille ci-dessous pour alterner le genre affecté à cette plage horaire de la semaine. Les réservations correspondantes filtreront les patients selon leur genre.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Réinitialiser le planning de la semaine aux valeurs réglementaires ?")) {
                            setPoolWeeklyPlan(DEFAULT_POOL_PLAN);
                            localStorage.setItem('pool_weekly_plan', JSON.stringify(DEFAULT_POOL_PLAN));
                          }
                        }}
                        className="bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-250 py-1 px-2.5 rounded text-[10.5px] transition-all cursor-pointer font-sans"
                      >
                        Réinitialiser au défaut
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const bulkH: Record<number, Record<string, 'H' | 'F'>> = {};
                          for (let d = 0; d < 7; d++) {
                            bulkH[d] = {};
                            WORKING_HOURS.forEach(h => { bulkH[d][h] = 'H'; });
                          }
                          setPoolWeeklyPlan(bulkH);
                          localStorage.setItem('pool_weekly_plan', JSON.stringify(bulkH));
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 py-1 px-2 rounded text-[10.5px] transition-all cursor-pointer font-sans"
                      >
                        Tout Hommes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const bulkF: Record<number, Record<string, 'H' | 'F'>> = {};
                          for (let d = 0; d < 7; d++) {
                            bulkF[d] = {};
                            WORKING_HOURS.forEach(h => { bulkF[d][h] = 'F'; });
                          }
                          setPoolWeeklyPlan(bulkF);
                          localStorage.setItem('pool_weekly_plan', JSON.stringify(bulkF));
                        }}
                        className="bg-pink-50 hover:bg-pink-100 text-pink-800 font-bold border border-pink-200 py-1 px-2 rounded text-[10.5px] transition-all cursor-pointer font-sans"
                      >
                        Tout Femmes
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-3xs">
                    <table className="w-full text-center border-collapse min-w-[700px] text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase font-mono font-sans">
                          <th className="py-2.5 px-3 border-r border-slate-200 text-left w-20 font-sans">Heure</th>
                          {CONFIG_DAYS.map(dayInfo => (
                            <th key={dayInfo.name} className={`py-2 px-1 border-r border-slate-200 font-sans ${dayInfo.isWeekend ? 'bg-amber-50/40 font-extrabold text-amber-900 border-b-2 border-b-amber-500' : ''}`}>
                              <span>{dayInfo.name}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {WORKING_HOURS.map(hour => {
                          const isPause = isHourBreak(hour);
                          if (isPause) return null; // skip breaks
                          return (
                            <tr key={hour} className="border-b border-slate-150">
                              <td className="py-1.5 px-2.5 font-mono font-bold text-left bg-slate-50 text-slate-600 border-r border-slate-200">
                                {hour}
                              </td>
                              {CONFIG_DAYS.map(dayInfo => {
                                const currentVal = poolWeeklyPlan[dayInfo.index]?.[hour] || 'H';
                                return (
                                  <td key={dayInfo.index} className="p-1 border-r border-slate-150">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextGender = currentVal === 'H' ? 'F' : 'H';
                                        handleUpdatePoolPlanCell(dayInfo.index, hour, nextGender);
                                      }}
                                      className={`w-full py-1 rounded font-black text-[10px] transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1 ${
                                        currentVal === 'H'
                                          ? 'bg-blue-600 hover:bg-blue-700 text-white font-sans'
                                          : 'bg-pink-600 hover:bg-pink-700 text-white font-sans'
                                      }`}
                                      title="Cliquez pour changer"
                                    >
                                      <span>{currentVal === 'H' ? '🚹 H' : '🚺 F'}</span>
                                    </button>
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
              )}
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-3xs">
              <table className="w-full text-center border-collapse min-w-[900px] text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-500 font-mono">
                    <th className="py-3 px-4 text-left border-r border-slate-150 w-24">Heure</th>
                    {weekDays.map(day => {
                      const isCurrentSelected = day.dateStr === selectedDate;
                      return (
                        <th 
                          key={day.dateStr} 
                          className={`py-3 px-2 border-r border-slate-150 transition-colors ${
                            isCurrentSelected ? 'bg-teal-50 text-teal-800 font-extrabold border-b-2 border-b-teal-500' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center w-full">
                            <button
                               type="button"
                               onClick={() => setSelectedDate(day.dateStr)}
                               className="w-full text-center hover:text-teal-500 block focus:outline-none cursor-pointer"
                            >
                               <span className="block text-[11px] font-black uppercase text-center">{day.shortLabel.split(' ')[0]}</span>
                               <span className="block text-[10px] text-slate-400 font-mono font-bold mt-0.5 text-center">{day.shortLabel.split(' ')[1]}</span>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {WORKING_HOURS.map(hour => {
                    const isBreak = isHourBreak(hour);
                    return (
                      <tr 
                        key={hour} 
                        className={`border-b border-slate-100 transition-colors ${
                          isBreak ? 'bg-slate-700' : 'hover:bg-slate-50/10'
                        }`}
                      >
                        <td className={`py-2.5 px-3 border-r border-slate-150 font-mono font-bold text-left flex items-center gap-1.5 min-w-[100px] ${
                          isBreak ? 'bg-slate-800 text-white border-r-slate-600' : 'bg-slate-50/40 text-slate-600'
                        }`}>
                          <Clock className={`w-3.5 h-3.5 ${isBreak ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                          <span>{hour}</span>
                        </td>
                        {isBreak ? (
                          <td colSpan={6} className="py-2.5 px-3 bg-slate-700/80">
                            <div className="flex items-center justify-center gap-4 text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] font-mono py-1 select-none">
                              <span>— PAUSE RÉGLEMENTAIRE —</span>
                            </div>
                          </td>
                        ) : (
                          weekDays.map(day => {
                            const dateTimeKey = `${day.dateStr}T${hour}`;
                            const appObj = balneoApps.find(app => app.appointment_date === dateTimeKey);
                            const patientsInApp = appObj?.patients || [];
                            const countRegistrations = patientsInApp.length;
                            const isCurrentSelected = day.dateStr === selectedDate;
                            const dayIdx = getFrenchDayIndex(day.dateStr);
                            const templateGender = poolWeeklyPlan[dayIdx]?.[hour] || 'H';
                            const slotGender = appObj?.creneau_gender || templateGender;

                            return (
                              <td 
                                key={day.dateStr}
                                className={`p-2 border-r border-slate-100 align-middle transition-all relative group min-w-[110px] ${
                                  isCurrentSelected ? 'bg-teal-50/10' : ''
                                }`}
                              >
                                {countRegistrations > 0 ? (
                                <div className={`border rounded-lg p-2 space-y-1.5 shadow-3xs transition-all text-left ${
                                  slotGender === 'H' 
                                    ? 'bg-blue-50/85 border-blue-200/95 hover:border-blue-350 text-blue-950 font-sans' 
                                    : 'bg-pink-50/85 border-pink-200/95 hover:border-pink-350 text-pink-950 font-sans'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-black font-mono flex items-center gap-0.5 ${
                                      slotGender === 'H' 
                                        ? 'text-blue-800' 
                                        : 'text-pink-800'
                                    }`}>
                                      {slotGender === 'H' ? '🚹' : '🚺'} {countRegistrations} {slotGender === 'H' ? 'Homme' : 'Femme'}{countRegistrations > 1 ? 's' : ''}
                                    </span>
                                    <button
                                      onClick={() => handleSlotClick(hour, day.dateStr)}
                                      className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all shrink-0 flex items-center justify-center gap-0.5 shadow-3xs text-white ${
                                        slotGender === 'H'
                                          ? 'bg-blue-600 hover:bg-blue-700 font-sans'
                                          : 'bg-pink-600 hover:bg-pink-750 font-sans'
                                      }`}
                                      title="Inscrire un autre patient"
                                    >
                                      <span>+</span>
                                      <span>Inscrire</span>
                                    </button>
                                  </div>
                                  <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1 font-mono text-[9px]">
                                    {patientsInApp.map(patLine => {
                                      const patientDetail = patients.find(p => p.id === patLine.patient_id);
                                      return (
                                        <div 
                                          key={patLine.patient_id}
                                          className={`text-[9.5px] px-1.5 py-0.5 rounded flex items-center justify-between gap-1 leading-tight font-bold ${
                                            patLine.paid 
                                              ? 'bg-slate-205 text-slate-400 line-through' 
                                              : slotGender === 'H'
                                              ? 'bg-blue-100 text-blue-900 border border-blue-200/50'
                                              : 'bg-pink-100 text-pink-900 border border-pink-200/50'
                                          }`}
                                        >
                                          <span className="truncate max-w-[65px]" title={patientDetail?.name}>
                                            {patientDetail?.name || 'Inconnu'}
                                          </span>
                                          {patLine.paid ? (
                                            <span className="text-[8px] text-slate-400 font-sans">✔</span>
                                          ) : (
                                            <button
                                              onClick={() => onToggleBalneoPatientPaid(appObj!.id, patLine.patient_id)}
                                              className="text-[8px] font-black bg-emerald-600 hover:bg-emerald-500 text-white p-0.5 rounded cursor-pointer leading-none font-sans"
                                              title="Encaisser"
                                            >
                                              $
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                               ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(hour, day.dateStr)}
                                  className={`w-full py-2.5 border border-dashed rounded-lg transition-all font-black flex items-center justify-center cursor-pointer shadow-3xs ${
                                    slotGender === 'H'
                                      ? 'bg-blue-50/40 hover:bg-blue-600 border-blue-200/60 hover:border-blue-600 text-blue-600 hover:text-white'
                                      : 'bg-pink-50/40 hover:bg-pink-600 border-pink-200/60 hover:border-pink-600 text-pink-600 hover:text-white'
                                  }`}
                                >
                                  <span className="text-lg font-black">+</span>
                                </button>
                               )}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Synchronized bottom table panel with filters */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-teal-50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-extrabold text-charcoal-900 text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
                  📋 Registre des programmations de Balnéothérapie
                </h4>
                <p className="text-[10px] text-slate-400">
                  {filterTableRange === 'day' 
                    ? `Affichage exclusif de la journée choisie du ${selectedDate}` 
                    : `Affichage étendu de la semaine courante (du ${weekDays[0].label} au ${weekDays[5].label})`
                  }
                </p>
              </div>

              {/* Day / Week selection filters */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold leading-5 shadow-3xs">
                <button
                  type="button"
                  onClick={() => setFilterTableRange('day')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    filterTableRange === 'day' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Jour ({selectedDate.split('-')[2]})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTableRange('week')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    filterTableRange === 'week' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semaine complète (7j)
                </button>
              </div>
            </div>

            {(() => {
              // Extract either day or full week
              const balneoAppsFiltered = balneoApps.filter(app => {
                if (filterTableRange === 'day') {
                  return app.appointment_date.startsWith(selectedDate);
                } else {
                  return weekDays.some(w => app.appointment_date.startsWith(w.dateStr));
                }
              });

              // Sort list chronologically
              balneoAppsFiltered.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
              
              if (balneoAppsFiltered.length === 0) {
                return (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl max-w-sm mx-auto p-4 animate-fade-in">
                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-655 block">Aucune planification trouvée</span>
                    <p className="text-[10px] text-slate-400 block mb-2 font-sans">Configurez des séances cliniques sur l'agenda hebdomadaire interactif ci-dessus.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        <th className="py-3 px-2 border-r border-slate-100">Jour</th>
                        <th className="py-3 px-4 border-r border-slate-100">Heure</th>
                        <th className="py-3 px-4">Créneau</th>
                        <th className="py-3 px-4">N° Patient</th>
                        <th className="py-3 px-4">Nom et Prénom</th>
                        <th className="py-3 px-4">N° Téléphone</th>
                        <th className="py-3 px-4">Abonnement actif</th>
                        <th className="py-3 px-4">Règlement</th>
                        {isAdmin && <th className="py-3 px-4 text-right">Admin Correction</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {balneoAppsFiltered.flatMap((app) => {
                        const [appDate, appTime] = app.appointment_date.split('T');
                        const matchedDayName = weekDays.find(w => w.dateStr === appDate)?.shortLabel.split(' ')[0] || appDate;

                        return app.patients.map((patLine) => {
                          const patient = patients.find(p => p.id === patLine.patient_id);
                          const subInfo = getSubscriptionInfo(patLine.patient_id);
                          const isLineGreyed = patLine.paid;

                          return (
                            <tr 
                              key={`${app.id}-${patLine.patient_id}`}
                              className={`border-b border-slate-50 transition-colors ${
                                isLineGreyed ? 'bg-slate-100/50 opacity-60 text-slate-450 font-medium' : 'hover:bg-slate-50/20'
                              }`}
                            >
                              <td className="py-3.5 px-2 font-mono font-black text-center bg-slate-50/30 border-r border-slate-100">
                                <span className="text-[10px] text-teal-800 uppercase tracking-tighter">{matchedDayName}</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-teal-800 border-r border-slate-100 text-center">
                                {appTime}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-center border-r border-slate-100">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  app.creneau_gender === 'F' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {app.creneau_gender === 'F' ? '🚺 F' : '🚹 H'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-500 font-sans">#{patLine.patient_id.substring(4, 9).toUpperCase()}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-850 font-sans">{patient?.name || 'Abonné'}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-655 font-sans">{patient?.phone || '-'}</td>
                              <td className="py-3.5 px-4">
                                {subInfo ? (
                                  <div className="space-y-0.5 font-sans">
                                    <span className="text-[10px] font-bold text-emerald-650 block">✔ Oui (Valide)</span>
                                    <span className="text-[9px] text-slate-400 font-mono block">Plan : {subInfo.code} ({subInfo.remaining} rest.)</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-450 block italic font-sans">Dépôt requis ou direct unitaire</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 font-sans">
                                  {patLine.paid ? (
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-0.5 rounded-full">
                                      ✔ Payé & Clôturé
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      {subInfo ? (
                                        <button
                                          onClick={() => onToggleBalneoPatientPaid(app.id, patLine.patient_id)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-colors shadow-3xs"
                                        >
                                          ✔ Déduire Abo
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => onToggleBalneoPatientPaid(app.id, patLine.patient_id)}
                                          className="bg-charcoal-900 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-colors shadow-3xs"
                                        >
                                          💵 Payé unitaire
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Admin correction triggers */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 font-sans">
                                  {isAdmin && patLine.paid && (
                                    <button
                                      onClick={() => onReactivateBalneoPatient(app.id, patLine.patient_id)}
                                      title="Réactiver pour corrections"
                                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-[9px] font-extrabold px-2 py-1 rounded border border-teal-200 cursor-pointer flex items-center gap-1 shadow-3xs"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Réactiver
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onRemoveBalneoPatient(app.id, patLine.patient_id)}
                                    className="p-1.5 hover:text-red-500 text-slate-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Désinscrire ce patient de la séance"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SERVICE 2: SERVICE ADULTES 1ER ÉTAGE VIEWPORT */}
      {activeService === 'adultes' && (isAdultsRecept) && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Scheduling Clock Weekly Grid */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-charcoal-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <span>🏋️ Grille Hebdomadaire de Kinésithérapie Adultes (08h00 - 20h30)</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Les lignes représentent les heures et les colonnes les jours de la semaine clinique. Cliquez sur <span className="text-teal-500 font-bold">+</span> pour inscrire un patient.
                </p>
              </div>
              <div className="text-[10px] bg-slate-100 text-slate-600 font-bold font-mono py-1 px-2 rounded-md">
                Horaires d'ouverture : 08:00 - 20:30
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-3xs">
              <table className="w-full text-center border-collapse min-w-[900px] text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-500 font-mono">
                    <th className="py-3 px-4 text-left border-r border-slate-150 w-24">Heure</th>
                    {weekDays.map(day => {
                      const isCurrentSelected = day.dateStr === selectedDate;
                      return (
                        <th 
                          key={day.dateStr} 
                          className={`py-3 px-2 border-r border-slate-150 transition-colors ${
                            isCurrentSelected ? 'bg-teal-50 text-teal-800 font-extrabold border-b-2 border-b-teal-500' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center w-full">
                            <button
                               type="button"
                               onClick={() => setSelectedDate(day.dateStr)}
                               className="w-full text-center hover:text-teal-500 block focus:outline-none cursor-pointer"
                            >
                               <span className="block text-[11px] font-black uppercase text-center">{day.shortLabel.split(' ')[0]}</span>
                               <span className="block text-[10px] text-slate-400 font-mono font-bold mt-0.5 text-center">{day.shortLabel.split(' ')[1]}</span>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {WORKING_HOURS.map(hour => {
                    const isBreak = isHourBreak(hour);
                    return (
                      <tr 
                        key={hour} 
                        className={`border-b border-slate-100 transition-colors ${
                          isBreak ? 'bg-slate-700' : 'hover:bg-slate-50/10'
                        }`}
                      >
                        <td className={`py-2.5 px-3 border-r border-slate-150 font-mono font-bold text-left flex items-center gap-1.5 min-w-[100px] ${
                          isBreak ? 'bg-slate-800 text-white border-r-slate-600' : 'bg-slate-50/40 text-slate-600'
                        }`}>
                          <Clock className={`w-3.5 h-3.5 ${isBreak ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                          <span>{hour}</span>
                        </td>
                        {isBreak ? (
                          <td colSpan={6} className="py-2.5 px-3 bg-slate-700/80">
                            <div className="flex items-center justify-center gap-4 text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] font-mono py-1 select-none">
                              <span>— PAUSE RÉGLEMENTAIRE —</span>
                            </div>
                          </td>
                        ) : (
                          weekDays.map(day => {
                            const dateTimeKey = `${day.dateStr}T${hour}`;
                            const appObj = kineApps.find(app => app.appointment_date === dateTimeKey);
                            const selectedActs = appObj?.selected_acts || [];
                            const countRegistrations = selectedActs.length;
                            const isCurrentSelected = day.dateStr === selectedDate;

                            return (
                              <td 
                                key={day.dateStr}
                                className={`p-2 border-r border-slate-100 align-middle transition-all relative group min-w-[110px] ${
                                  isCurrentSelected ? 'bg-teal-50/20' : ''
                                }`}
                              >
                                {countRegistrations > 0 ? (
                                <div className="bg-teal-50/75 border border-teal-200 rounded-lg p-2 space-y-1.5 shadow-3xs hover:border-teal-500 transition-all text-left">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-emerald-700 font-mono">
                                      🏋️ {countRegistrations} Soin(s)
                                    </span>
                                    <button
                                      onClick={() => handleSlotClick(hour, day.dateStr)}
                                      className="text-[9.5px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all shrink-0 flex items-center justify-center gap-0.5 shadow-3xs"
                                      title="Planifier un autre soin"
                                    >
                                      <span>+</span>
                                      <span>Soin</span>
                                    </button>
                                  </div>
                                  <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1 font-mono">
                                    {selectedActs.map(actLine => {
                                      const patientDetail = patients.find(p => p.id === actLine.patient_id);
                                      const actDetail = acts.find(a => a.id === actLine.act_id);
                                      return (
                                        <div 
                                          key={actLine.id || `${actLine.patient_id}-${actLine.act_id}`}
                                          className={`text-[9px] px-1.5 py-0.5 rounded flex flex-col gap-0.5 leading-tight font-medium ${
                                            actLine.paid 
                                              ? 'bg-slate-200 text-slate-400 line-through border border-slate-200/50' 
                                              : 'bg-teal-100 text-teal-900 border border-teal-200/40'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="truncate max-w-[65px] font-black" title={patientDetail?.name}>
                                              {patientDetail?.name || 'Inconnu'}
                                            </span>
                                            {actLine.paid ? (
                                              <span className="text-[8px] text-slate-400 font-bold">✔</span>
                                            ) : (
                                              <button
                                                onClick={() => onToggleKineActPaid(appObj!.id, actLine.act_id, actLine.patient_id)}
                                                className="text-[8px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-1 rounded cursor-pointer leading-none"
                                                title="Encaisser"
                                              >
                                                $
                                              </button>
                                            )}
                                          </div>
                                          <span className="text-[8.5px] text-slate-505 truncate" title={actDetail?.name}>
                                            {actDetail?.name || 'Kiné'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(hour, day.dateStr)}
                                  className="w-full py-2 bg-slate-50 hover:bg-emerald-600 text-slate-500 hover:text-white border border-dashed border-slate-200 hover:border-emerald-600 rounded-lg transition-all font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                                >
                                  <span className="text-xs font-black">+</span>
                                  <span>Planifier</span>
                                </button>
                              )}
                            </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Table synchronized with choice and general filters */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-teal-50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-extrabold text-charcoal-900 text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
                  📋 Registre des programmations de Kinésithérapie Adultes
                </h4>
                <p className="text-[10px] text-slate-400">
                  {filterTableRange === 'day' 
                    ? `Affichage exclusif de la journée choisie du ${selectedDate}` 
                    : `Affichage étendu de la semaine courante (du ${weekDays[0].label} au ${weekDays[5].label})`
                  }
                </p>
              </div>

              {/* Day / Week selection filters */}
              <div className="flex bg-slate-105 p-1 rounded-lg border border-slate-200 text-xs font-bold leading-5 shadow-3xs">
                <button
                  type="button"
                  onClick={() => setFilterTableRange('day')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    filterTableRange === 'day' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Jour ({selectedDate.split('-')[2]})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTableRange('week')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    filterTableRange === 'week' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Semaine complète (7j)
                </button>
              </div>
            </div>

            {(() => {
              // Extract either day or full week
              const kineAppsFiltered = kineApps.filter(app => {
                if (filterTableRange === 'day') {
                  return app.appointment_date.startsWith(selectedDate);
                } else {
                  return weekDays.some(w => app.appointment_date.startsWith(w.dateStr));
                }
              });

              // Sort list chronologically
              kineAppsFiltered.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
              
              if (kineAppsFiltered.length === 0) {
                return (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl max-w-sm mx-auto p-4 animate-fade-in">
                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-655 block">Aucune planification trouvée</span>
                    <p className="text-[10px] text-slate-400 block mb-2 font-sans font-sans">Configurez des séances cliniques sur l'agenda hebdomadaire interactif ci-dessus.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        <th className="py-3 px-2 border-r border-slate-100">Jour</th>
                        <th className="py-3 px-4 border-r border-slate-100">Heure</th>
                        <th className="py-3 px-4">N° Patient</th>
                        <th className="py-3 px-4">Nom et Prénom</th>
                        <th className="py-3 px-4">N° Téléphone</th>
                        <th className="py-3 px-4">Acte médical prescrit</th>
                        <th className="py-3 px-4">Abonnement actif</th>
                        <th className="py-3 px-4">Règlement</th>
                        {isAdmin && <th className="py-3 px-4 text-right">Admin Correction</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {kineAppsFiltered.flatMap((app) => {
                        const [appDate, appTime] = app.appointment_date.split('T');
                        const matchedDayName = weekDays.find(w => w.dateStr === appDate)?.shortLabel.split(' ')[0] || appDate;

                        return app.selected_acts.map((actLine) => {
                          const patient = patients.find(p => p.id === actLine.patient_id);
                          const actDetails = acts.find(a => a.id === actLine.act_id);
                          const subInfo = getSubscriptionInfo(actLine.patient_id, actLine.act_id);
                          const isLineGreyed = actLine.paid;

                          return (
                            <tr 
                              key={`${app.id}-${actLine.patient_id}-${actLine.act_id}`}
                              className={`border-b border-slate-50 transition-colors ${
                                isLineGreyed ? 'bg-slate-100/50 opacity-60 text-slate-450 font-medium' : 'hover:bg-slate-50/20'
                              }`}
                            >
                              <td className="py-3.5 px-2 font-mono font-black text-center bg-slate-50/30 border-r border-slate-100">
                                <span className="text-[10px] text-teal-800 uppercase tracking-tighter">{matchedDayName}</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-teal-800 border-r border-slate-100 text-center">
                                {appTime}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{actLine.patient_id.substring(4, 9).toUpperCase()}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{patient?.name || 'Abonné'}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-655">{patient?.phone || '-'}</td>
                              <td className="py-3.5 px-4">
                                <select
                                  disabled={isLineGreyed}
                                  value={actLine.act_id}
                                  onChange={(e) => {
                                    const nextActId = e.target.value;
                                    const updatedActs = app.selected_acts.map(act => 
                                      act.id === actLine.id ? { ...act, act_id: nextActId } : act
                                    );
                                    onAddKineApp({
                                      appointment_date: app.appointment_date,
                                      state: app.state,
                                      selected_acts: updatedActs
                                    });
                                  }}
                                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 text-[11px] rounded font-semibold text-slate-855 cursor-pointer"
                                >
                                  {acts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3.5 px-4">
                                {subInfo ? (
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-emerald-650 block">✔ Oui (Valide)</span>
                                    <span className="text-[9px] text-slate-400 font-mono block">Plan : {subInfo.code} ({subInfo.remaining} rest.)</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-455 block italic">Dépôt requis ou direct unitaire</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  {actLine.paid ? (
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-0.5 rounded-full">
                                      ✔ Payé & Clôturé
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      {subInfo ? (
                                        <button
                                          onClick={() => onToggleKineActPaid(app.id, actLine.act_id, actLine.patient_id)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-colors shadow-3xs"
                                        >
                                          ✔ Déduire Abo
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => onToggleKineActPaid(app.id, actLine.act_id, actLine.patient_id)}
                                          className="bg-charcoal-900 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-colors shadow-3xs"
                                        >
                                          💵 Payé unitaire
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Admin correction triggers */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isAdmin && actLine.paid && (
                                    <button
                                      onClick={() => onReactivateKineAct(app.id, actLine.act_id, actLine.patient_id)}
                                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-[9px] font-extrabold px-2 py-1 rounded border border-teal-200 cursor-pointer flex items-center gap-1 shadow-3xs"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Réactiver
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onRemoveKineAct(app.id, actLine.act_id, actLine.patient_id)}
                                    className="p-1.5 hover:text-red-555 text-slate-400 hover:bg-red-50 rounded-lg cursor-pointer"
                                    title="Désinscrire ce patient"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* PROGRAMMING PATIENT INSERTER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full flex flex-col font-sans overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm border ${creneauGender === 'F' ? 'border-pink-100 text-pink-600' : 'border-blue-100 text-blue-600'}`}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-center flex-1 text-center">
                  <h3 className="text-lg font-black text-charcoal-900 uppercase tracking-tighter leading-none">
                    Service Balnéothérapie
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-1">
                    Elaboration Du Planning
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 px-3 py-1 rounded-full border ${
                    creneauGender === 'F' 
                      ? 'text-pink-600 bg-pink-50 border-pink-100' 
                      : 'text-blue-600 bg-blue-50 border-blue-100'
                  }`}>
                    Créneau {creneauGender === 'F' ? 'Femme' : 'Homme'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-white hover:text-rose-500 text-slate-400 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertPatient} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
                {/* Search Bar */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Recherche Patient</label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Nom, prénom ou téléphone..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 pl-10 pr-10 py-2.5 rounded-xl text-xs font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-hidden transition-all shadow-xs"
                    />
                    {patientSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setPatientSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Table Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sélectionner dans la liste</label>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">G.</th>
                          <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom & Prénom</th>
                          <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = patients
                            .filter(p => {
                              if (activeService === 'balneo') {
                                if (creneauGender === 'H') return p.gender === 'M';
                                if (creneauGender === 'F') return p.gender === 'F';
                              }
                              return true;
                            })
                            .filter(p => {
                              if (!patientSearchQuery) return true;
                              const s = patientSearchQuery.toLowerCase();
                              return p.name.toLowerCase().includes(s) || (p.phone && p.phone.includes(s));
                            });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={3} className="px-4 py-10 text-center text-[10px] font-bold text-slate-400 italic font-sans">
                                  Aucun patient éligible trouvé
                                </td>
                              </tr>
                            );
                          }

                          return filtered.slice(0, 50).map(p => (
                            <tr 
                              key={p.id} 
                              onClick={() => handlePatientSelectChange(p.id)}
                              className={`border-b border-slate-50 last:border-0 cursor-pointer transition-all ${
                                selectedPatientId === p.id 
                                  ? creneauGender === 'F' 
                                    ? 'bg-pink-50 border-l-4 border-l-pink-600' 
                                    : 'bg-blue-50 border-l-4 border-l-blue-600'
                                  : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                              }`}
                            >
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs shadow-3xs ${
                                  p.gender === 'F' ? 'bg-pink-100 text-pink-600' : p.gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {p.gender === 'F' ? '🚺' : p.gender === 'M' ? '🚹' : '🧒'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className={`text-[11px] font-bold uppercase tracking-tight ${
                                    selectedPatientId === p.id 
                                      ? creneauGender === 'F' ? 'text-pink-800' : 'text-blue-800'
                                      : 'text-slate-700 font-extrabold'
                                  }`}>{p.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono tracking-tighter italic font-sans">REF: {p.id.slice(-6).toUpperCase()}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-black text-slate-505 font-mono text-right">
                                {p.phone || '—'}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {activeService === 'adultes' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest pl-1">Acte à affecter</label>
                    <select
                      value={selectedActId}
                      onChange={(e) => setSelectedActId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-hidden transition-all shadow-xs"
                    >
                      {acts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(() => {
                  if (!selectedPatientId) return null;
                  const abo = abonnements.find(a => {
                    if (a.patient_id !== selectedPatientId) return false;
                    if (a.etat === 'Fermé') return false;
                    const p = packs.find(pk => pk.id === a.pack_id);
                    if (activeService === 'adultes') {
                      return p?.act_id === selectedActId;
                    } else {
                      return p?.type_abonnement_id === 'tab-2' || p?.type_abonnement_id === 'tab-3';
                    }
                  });
                  if (!abo) return null;
                  const details = computeSubscriptionDetails(abo, packs, versements);
                  if (details.is_consumption_warning) {
                    return (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                        <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight leading-relaxed font-sans">
                          ⚠️ Le montant versé est équivalent aux séances consommées
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {addError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-3 animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-tight leading-relaxed font-sans">{addError}</p>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-555 hover:bg-white hover:text-slate-700 transition-all border border-transparent hover:border-slate-200"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  disabled={!selectedPatientId}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg active:scale-95 ${
                    !selectedPatientId
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : creneauGender === 'F' 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Insérer le Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
