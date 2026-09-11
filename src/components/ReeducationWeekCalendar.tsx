/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, User, Sparkles, Filter, 
  BookOpen, Trash2, CheckCircle2, XCircle, Info, Settings, History, Layers,
  Search, UserPlus, Wallet, Coins
} from 'lucide-react';
import { DatabaseState, Rendez_Vous, Patient, Praticien, Zone, getRemainingSessions, isAbonnementGele, getFilteredActesForRole, timesOverlap, isSubscriptionCoveringActe } from '../dbStore';
import { hasPermission } from '../utils/permissions';
import { PatientAutocomplete } from './PatientAutocomplete';
import { DepenseManager } from './DepenseManager';

interface ReeducationWeekCalendarProps {
  dbState: DatabaseState;
  currentUser: any;
  onUpdateRDVStatus: (rdvId: number, status: Rendez_Vous['Statut_RDV'], priceOverridden?: number) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  break1Start?: string;
  break1End?: string;
  break2Start?: string;
  break2End?: string;
  onAddRDV?: (newRDVData: Omit<Rendez_Vous, 'ID_RDV'>) => void;
  onSave?: (nextState: DatabaseState) => void;
}

// Convert "hh:mm" to minutes for logic
const timeToMin = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

// Help calculate slot end times
const getEndTimeOfSlot = (timeStr: string, durationMin: number = 60): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + durationMin;
  const endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

// Slots array from 08:00 to 20:00 with 1-hour intervals
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

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

export const ReeducationWeekCalendar: React.FC<ReeducationWeekCalendarProps> = ({
  dbState,
  currentUser,
  onUpdateRDVStatus,
  triggerToast,
  break1Start: propBreak1Start,
  break1End: propBreak1End,
  break2Start: propBreak2Start,
  break2End: propBreak2End,
  onAddRDV,
  onSave
}) => {
  // Show/Hide late hours 17:00 to 20:59
  const [showLateHours, setShowLateHours] = useState<boolean>(() => {
    const saved = localStorage.getItem('reeducation_show_late_hours');
    return saved !== 'false';
  });

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

  // Selected visual Gender/Plateau toggle (1 = Homme, 2 = Femme)
  const [selectedGender, setSelectedGender] = useState<'Homme' | 'Femme'>('Homme');
  
  // Weekly date navigation state (start week from given day)
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  
  // Adjustable breaks - loaded from localstorage or defaulted
  const [break1Start, setBreak1Start] = useState<string>(() => propBreak1Start || localStorage.getItem('reeducation_b1_start') || '12:00');
  const [break1End, setBreak1End] = useState<string>(() => propBreak1End || localStorage.getItem('reeducation_b1_end') || '13:00');
  const [break2Start, setBreak2Start] = useState<string>(() => propBreak2Start || localStorage.getItem('reeducation_b2_start') || '17:00');
  const [break2End, setBreak2End] = useState<string>(() => propBreak2End || localStorage.getItem('reeducation_b2_end') || '17:30');

  const [deleteConfirmRdvId, setDeleteConfirmRdvId] = useState<number | null>(null);

  useEffect(() => {
    if (propBreak1Start) setBreak1Start(propBreak1Start);
  }, [propBreak1Start]);

  useEffect(() => {
    if (propBreak1End) setBreak1End(propBreak1End);
  }, [propBreak1End]);

  useEffect(() => {
    if (propBreak2Start) setBreak2Start(propBreak2Start);
  }, [propBreak2Start]);

  useEffect(() => {
    if (propBreak2End) setBreak2End(propBreak2End);
  }, [propBreak2End]);



  // Booking appointment cell states
  const [bookingCell, setBookingCell] = useState<{ dateStr: string; slotTime: string } | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [highlightedPatientId, setHighlightedPatientId] = useState<number | null>(null);
  const [selectedPratId, setSelectedPratId] = useState<number>(() => {
    const defaultPrat = dbState.praticiens.find(p => p.ID_Sce === 1);
    return defaultPrat ? defaultPrat.ID_Prat : 1;
  });
  const [selectedActeId, setSelectedActeId] = useState<number>(() => {
    const defaultActe = dbState.actes.find(a => a.ID_Acte === 1) || dbState.actes[0];
    return defaultActe ? defaultActe.ID_Acte : 1;
  });
  const [acteSearch, setActeSearch] = useState<string>('');

  // Toggle config breaks modal or section
  const [showBreakForm, setShowBreakForm] = useState(false);
  
  // Toggle historical sessions list drawer
  const [showHistory, setShowHistory] = useState(false);
  const [showDepenses, setShowDepenses] = useState(false);

  // Date range filters for history explorer
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  // Selected appointment detail preview
  const [selectedRDVDetail, setSelectedRDVDetail] = useState<Rendez_Vous | null>(null);

  // Calculate Caisse Sce Adulte Balance
  const caisseBalance = useMemo(() => {
    // 1. Factures
    const computedFactures = (dbState.factures || [])
      .filter((fac) => fac.Statut === 'Payée')
      .map((fac): any => {
        const pat = dbState.patients.find(p => p.ID_Patient === fac.ID_Patient);

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
      })
      .filter(Boolean);

    // 2. Manual/Cash Transactions from rendez-vous checks
    const manualTransList = ((dbState as any).transactions_caisses || [])
      .filter((t: any) => {
        const rdvMatch = String(t.Libelle || '').match(/RDV_#(\d+)/);
        if (rdvMatch) {
          const rdvId = Number(rdvMatch[1]);
          const rdv = dbState.rendezVous.find(r => r.ID_RDV === rdvId);
          if (!rdv || rdv.Statut_RDV !== 'Honoré') return false;
        }
        
        const lib = String(t.Libelle || '').toLowerCase();
        if (lib.includes('versement direct') || lib.includes('encaissement versement') || lib.includes('abn_#')) {
          return false;
        }
        return true;
      });

    // 3. Versements sur les abonnements Adulte (Cat_Pack === 'R')
    const computedVersements = (dbState.versements || [])
      .map((v): any => {
        const abn = dbState.abonnements.find(a => a.ID_Abn === v.ID_Abn);
        const pack = abn ? dbState.packs.find(p => p.ID_Pack === abn.ID_Pack) : null;
        
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

    // Filter all of them by Caisse Sce Adulte or Caisse Rééducation
    const facturesSceAdulte = computedFactures.filter((t: any) => t.Caisse === 'Caisse Sce Adulte' || t.Caisse === 'Caisse Rééducation');
    const manualSceAdulte = manualTransList.filter((t: any) => t.Caisse === 'Caisse Sce Adulte' || t.Caisse === 'Caisse Rééducation');
    const versementsSceAdulte = computedVersements.filter((t: any) => t.Caisse === 'Caisse Sce Adulte' || t.Caisse === 'Caisse Rééducation');

    const allSceAdulteTrans = [...manualSceAdulte, ...facturesSceAdulte, ...versementsSceAdulte];
    
    const totalRecettes = allSceAdulteTrans
      .filter((t: any) => t.Type === 'Recette')
      .reduce((acc: number, curr: any) => acc + (curr.Montant || 0), 0);
      
    const totalDepenses = (dbState.depenses || [])
      .filter((d: any) => d.id_service === 1 && d.statut === 'Validée')
      .reduce((sum: number, d: any) => sum + (d.montant || 0), 0);

    return {
      solde: totalRecettes - totalDepenses,
      recettes: totalRecettes,
      depenses: totalDepenses
    };
  }, [dbState]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' })
      .format(val)
      .replace('DZD', 'DA');
  };

  // Calculate day dates of the week based on currentWeekStart, commencing from start date
  const activeWeekDays = useMemo(() => {
    let start = parseLocalDate(currentWeekStart);

    const result = [];
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    let current = new Date(start);
    while (result.length < 6) {
      const name = dayNames[current.getDay()];
      if (name !== 'Vendredi') {
        const dateStr = getLocalISODate(current);
        result.push({
          dateStr,
          label: `${current.getDate()}/${current.getMonth() + 1}`,
          name
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [currentWeekStart]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const d = parseLocalDate(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(getLocalISODate(d));
  };

  const handleNextWeek = () => {
    const d = parseLocalDate(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(getLocalISODate(d));
  };

  // Check if a slot falls inside a configured break
  const isTimeInBreak = (timeStr: string): { inBreak: boolean; breakNum: number } => {
    const mins = timeToMin(timeStr);
    const b1S = timeToMin(break1Start);
    const b1E = timeToMin(break1End);
    const b2S = timeToMin(break2Start);
    const b2E = timeToMin(break2End);

    if (mins >= b1S && mins < b1E) {
      return { inBreak: true, breakNum: 1 };
    }
    if (mins >= b2S && mins < b2E) {
      return { inBreak: true, breakNum: 2 };
    }
    return { inBreak: false, breakNum: 0 };
  };

  // Save break configurations as Administrator
  const handleSaveBreaks = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('reeducation_b1_start', break1Start);
    localStorage.setItem('reeducation_b1_end', break1End);
    localStorage.setItem('reeducation_b2_start', break2Start);
    localStorage.setItem('reeducation_b2_end', break2End);
    setShowBreakForm(false);
    triggerToast('Heures de pauses réajustées avec succès.', 'success');
  };

  // Filter matching rendez-vous for the calendar grid
  const getRDVsForCell = (dateStr: string, slotTimeStr: string): Rendez_Vous[] => {
    const targetZoneId = selectedGender === 'Homme' ? 1 : 2; // Zone 1 = Plateau Homme, Zone 2 = Plateau Femme
    const slotMinsStart = timeToMin(slotTimeStr);
    const slotMinsEnd = slotMinsStart + 60;

    return dbState.rendezVous.filter(r => {
      if (r.Date_RDV !== dateStr) return false;
      
      // Patient gender validation / Zone selection check
      const patient = dbState.patients.find(p => p.ID_Patient === r.ID_Patient);
      const fitsZone = r.ID_Zone === targetZoneId || (patient?.Genre_Patient === selectedGender);
      if (!fitsZone) return false;

      // Overlap with 1-hour slot check
      const rdvStart = timeToMin(r.H_Debut_RDV);
      const rdvEnd = timeToMin(r.H_Fin_RDV);
      
      return rdvStart < slotMinsEnd && rdvEnd > slotMinsStart;
    });
  };

  // History calculation: list of completed/realized sessions filtered by gender/zone & date range
  const getRealizedSessionsHistory = () => {
    return dbState.seances.filter(s => {
      const patient = dbState.patients.find(p => p.ID_Patient === s.ID_Patient);
      const fitsGender = patient?.Genre_Patient === selectedGender;
      if (!fitsGender) return false;

      if (historyStartDate && s.Date_Seanc_Realisee < historyStartDate) return false;
      if (historyEndDate && s.Date_Seanc_Realisee > historyEndDate) return false;

      return true;
    }).sort((a,b) => b.Date_Seanc_Realisee.localeCompare(a.Date_Seanc_Realisee));
  };

  const historyList = getRealizedSessionsHistory();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4" id="reeducation-week-calendar-workspace">
      
      {/* HEADER CONTROL AREA */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
        
        {/* TITLE AND DESCRIPTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="font-sans font-bold text-sm md:text-sm text-slate-900 uppercase tracking-wide">
              Système de Plannings Hebdomadaires Étalés
            </h3>
          </div>
          <p className="text-slate-500 text-[11px] font-medium sm:mt-0 mt-1">
            Visualisation globale des plateaux de Rééducation Fonctionnelle (Homme & Femme).
          </p>
        </div>

        {/* CONTROLS ROW (TOGGLE ON LEFT, CAISSE ON THE RIGHT TO FILL THE EMPTY SPACE OF THE ROW) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          
          {/* Toggle placed below description on the left */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1 border border-slate-205 w-fit">
            <button
              type="button"
              onClick={() => {
                setSelectedGender('Homme');
                triggerToast('Affichage du Planning Plateau Homme.', 'info');
              }}
              className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer ${
                selectedGender === 'Homme'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-200'
              }`}
            >
              <span>♂</span>
              <span>Planning Homme</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGender('Femme');
                triggerToast('Affichage du Planning Plateau Femme.', 'info');
              }}
              className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer ${
                selectedGender === 'Femme'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-200'
              }`}
            >
              <span>♀</span>
              <span>Planning Femme</span>
            </button>
          </div>

          {/* Right side aligned Caisse box - styled beautifully and identically to the queue cash desk wrapper */}
          <div className="bg-emerald-500 text-white rounded-xl p-2 px-3 shadow-sm flex items-center justify-between border border-emerald-600 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-200 min-w-[210px] shrink-0 self-start sm:self-center">
            <div className="space-y-0.5 z-10">
              <span className="text-[9px] uppercase font-black tracking-wider opacity-90 block">Caisse Sce Adulte</span>
              <span className="text-base font-black font-mono block">
                {caisseBalance.solde.toLocaleString()} DA
              </span>
              <div className="flex gap-2 text-[8px] font-bold text-emerald-100/90 font-mono">
                <span>R: +{caisseBalance.recettes.toLocaleString()}</span>
                <span>D: -{caisseBalance.depenses.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-1.5 bg-white/20 rounded-lg text-white z-10 shadow-sm">
              <Coins className="w-4 h-4" />
            </div>
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>

        </div>

      </div>

      {/* WEEK DATE NAVNAV BAR WITH CENTERED SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 border border-slate-150 rounded-2xl p-3 px-4 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1 px-2.5 bg-white text-slate-707 font-bold border border-slate-200 rounded-lg hover:bg-slate-100 text-xs transition flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Semaine Préc.</span>
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1 px-2.5 bg-white text-slate-707 font-bold border border-slate-200 rounded-lg hover:bg-slate-100 text-xs transition flex items-center gap-1"
          >
            <span>Semaine Suiv.</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Repositioned Patient Search Bar in the middle (styled clearly as drawn on the photo) */}
        <div className="flex items-center gap-2 bg-white p-1 px-2 rounded-xl border border-slate-200 shadow-3xs w-full max-w-[240px] shrink-0">
          <div className="flex-1 w-full">
            <PatientAutocomplete 
              patients={dbState.patients}
              genderRule={selectedGender === 'Homme' ? 'H' : 'F'}
              placeholder="🔍 Chercher patient..."
              onSelect={(patient) => {
                setHighlightedPatientId(patient.ID_Patient);
                triggerToast(`Mise en évidence : ${patient.Nom_Patient}`, 'success');
              }}
              className="w-full text-[10.5px]"
            />
          </div>
          {highlightedPatientId && (
            <button
              type="button"
              onClick={() => {
                setHighlightedPatientId(null);
                triggerToast('Mise en évidence annulée.', 'info');
              }}
              className="p-1 px-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[9px] font-black transition cursor-pointer"
              title="Effacer le filtre"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-indigo-850">
          📍 Période : du <span className="underline font-black">{activeWeekDays[0]?.dateStr}</span> au <span className="underline font-black">{activeWeekDays[activeWeekDays.length - 1]?.dateStr}</span>
        </div>
      </div>

      {/* ADMIN BREAK RE-AJUSTMENTS FLOATING BOX PANEL */}
      {showBreakForm && currentUser.Role === 'Admin' && (
        <form onSubmit={handleSaveBreaks} className="bg-indigo-900 text-white rounded-2.5xl p-5 border border-indigo-950 shadow-md space-y-4 text-xs animate-fade-in">
          <div className="flex justify-between items-center border-b border-indigo-800 pb-2">
            <span className="font-extrabold text-sm flex items-center gap-1.5">⚙️ Administration : Réglage du Calendrier Clinique</span>
            <button type="button" onClick={() => setShowBreakForm(false)} className="text-indigo-200 hover:text-white">✕ Fermer</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-805 space-y-2">
              <span className="font-bold underline text-amber-300">Pause Clinique 1 (Matin/Midi)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-indigo-300">Heure de début</label>
                  <input type="time" className="bg-indigo-950 w-full text-white px-2 py-1 rounded" value={break1Start} onChange={(e) => setBreak1Start(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] text-indigo-300">Heure de fin</label>
                  <input type="time" className="bg-indigo-950 w-full text-white px-2 py-1 rounded" value={break1End} onChange={(e) => setBreak1End(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-805 space-y-2">
              <span className="font-bold underline text-amber-300">Pause Clinique 2 (Fin d'Après-Midi)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-indigo-300">Heure de début</label>
                  <input type="time" className="bg-indigo-950 w-full text-white px-2 py-1 rounded" value={break2Start} onChange={(e) => setBreak2Start(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] text-indigo-300">Heure de fin</label>
                  <input type="time" className="bg-indigo-950 w-full text-white px-2 py-1 rounded" value={break2End} onChange={(e) => setBreak2End(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-amber-450 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-5 py-2 rounded-lg transition">
              Enregistrer les modifications
            </button>
          </div>
        </form>
      )}

      {/* MAIN WEEK GRID VISUALIZER - TABLE */}
      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto custom-scrollbar-horizontal pb-2 w-full">
          <table className="w-full text-left border-collapse table-fixed select-none text-[10px]">
            <thead>
              <tr className="bg-slate-55 bg-slate-50 border-b border-slate-200">
                <th className="p-1.5 font-semibold text-slate-600 w-[70px] min-w-[70px] max-w-[70px] border-r border-slate-100 text-center font-mono">Horaires</th>
                {activeWeekDays.map((d, index) => (
                  <th key={index} className="p-1 border-r border-slate-100 font-sans last:border-0 align-top w-[14%] flex-1 min-w-0 text-center">
                    <span className="block font-black text-slate-800 text-[10px] leading-tight uppercase tracking-wider">{d.name}</span>
                    <span className="block font-bold text-slate-400 mt-0.5 text-[9px]">{d.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const displayedSlots = showLateHours 
                  ? TIME_SLOTS 
                  : TIME_SLOTS.filter(slot => {
                      const hour = parseInt(slot.split(':')[0], 10);
                      return hour < 17;
                    });
                return displayedSlots.map((slot, sIdx) => {
                  const { inBreak, breakNum } = isTimeInBreak(slot);

                  return (
                    <tr 
                      key={sIdx} 
                      className={`border-b last:border-0 border-slate-100 transition duration-100 hover:bg-slate-50/35 ${
                        inBreak ? 'bg-amber-50/40 pattern-stripes' : ''
                      }`}
                    >
                      {/* Time Slot display column */}
                      <td className="p-1 border-r border-slate-150 align-middle text-center font-bold text-slate-500 font-mono bg-slate-50/60 text-[9px] w-[70px] min-w-[70px] max-w-[70px]">
                        {slot}
                      </td>

                      {inBreak ? (
                        <td 
                          colSpan={activeWeekDays.length}
                          className="p-1 align-middle text-center bg-amber-50/20"
                        >
                          <div className="overflow-x-auto whitespace-nowrap custom-scrollbar-horizontal py-1.5 flex items-center justify-center gap-8 scroll-smooth">
                            <span className="text-[10px] font-extrabold text-amber-800 opacity-80 uppercase tracking-widest inline-block px-4">
                              {breakNum === 1 ? '✨ Pause Déjeuner (Fermeture Clinique) ✨' : '☕ Pause Encas ☕'}
                            </span>
                            <span className="text-[10px] font-extrabold text-amber-800 opacity-60 uppercase tracking-widest inline-block px-4">
                              {breakNum === 1 ? '✨ Pause Déjeuner (Fermeture Clinique) ✨' : '☕ Pause Encas ☕'}
                            </span>
                            <span className="text-[10px] font-extrabold text-amber-800 opacity-40 uppercase tracking-widest inline-block px-4">
                              {breakNum === 1 ? '✨ Pause Déjeuner (Fermeture Clinique) ✨' : '☕ Pause Encas ☕'}
                            </span>
                          </div>
                        </td>
                      ) : (
                        activeWeekDays.map((d, dIdx) => {
                          const cellRDVs = getRDVsForCell(d.dateStr, slot);

                        return (
                          <td 
                            key={dIdx} 
                            onClick={() => {
                              setBookingCell({ dateStr: d.dateStr, slotTime: slot });
                            }}
                            className={`p-1 ${cellRDVs.length > 0 ? 'pl-6' : ''} border-r border-slate-100 last:border-0 align-top h-[85px] bg-white hover:bg-slate-50 cursor-pointer relative space-y-0.5 transition duration-150 w-[14%] flex-1 min-w-0`}
                            title={`Cliquer pour programmer un RDV le ${d.dateStr} à ${slot}`}
                          >
                            {cellRDVs.length > 0 && (
                              <div className="absolute left-1 top-1 bottom-1 w-4 bg-indigo-50 border border-indigo-200 text-indigo-750 font-black text-[9px] rounded flex flex-col items-center justify-center shadow-3xs z-20 pointer-events-none" title="Nbre de patients">
                                <span className="block text-[6.5px] text-indigo-400 font-sans leading-none">Nb</span>
                                <span className="block mt-0.5 leading-none">{cellRDVs.length}</span>
                              </div>
                            )}
                          {cellRDVs.length > 0 ? (
                            cellRDVs.map((rdv) => {
                              const patObj = dbState.patients.find(p => p.ID_Patient === rdv.ID_Patient);
                              const drObj = dbState.praticiens.find(p => p.ID_Prat === rdv.ID_Prat);
                              const actObj = dbState.actes.find(a => a.ID_Acte === rdv.ID_Acte);
                              
                              const isHighlighted = highlightedPatientId !== null && rdv.ID_Patient === highlightedPatientId;
                              const hasHighlightActive = highlightedPatientId !== null;
                              const isDimmed = hasHighlightActive && !isHighlighted;

                              const isStartSlot = rdv.H_Debut_RDV === slot;
                              const isAnnule = isRdvCancelled(rdv);

                              if (!isStartSlot) {
                                return (
                                  <div
                                    key={rdv.ID_RDV}
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent opening booking popup
                                      setSelectedRDVDetail(rdv);
                                    }}
                                    className={`p-0.5 px-1 rounded-md border text-[8px] font-bold cursor-pointer flex items-center gap-1 transition whitespace-nowrap overflow-hidden ${
                                      isHighlighted 
                                        ? 'bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-300 animate-pulse scale-[1.02] z-20 font-extrabold'
                                        : isDimmed
                                          ? 'border-slate-100 bg-slate-50/20 text-slate-300 opacity-25 select-none grayscale'
                                          : isAnnule
                                            ? 'border-red-200 bg-red-50 text-red-700 opacity-75'
                                            : 'border-dashed border-slate-200 bg-slate-50/70 text-slate-500 hover:bg-slate-100 opacity-80'
                                    }`}
                                    title={isAnnule ? "Rendez-vous annulé — aucun encaissement reçu avant minuit." : `Suite de la séance de ${patObj?.Nom_Patient} (${rdv.H_Debut_RDV} - ${rdv.H_Fin_RDV})`}
                                  >
                                    {isAnnule && <span className="text-red-500 font-bold shrink-0">✕</span>}
                                    <span className={`truncate flex-1 ${isAnnule ? 'line-through decoration-red-500 text-red-700' : ''}`}>
                                      ↪ [Suite] {patObj?.Nom_Patient} {rdv.Besoin ? `[${rdv.Besoin}]` : ''}
                                    </span>
                                    {isAnnule && <span className="ml-auto text-[7px] font-bold text-red-600 uppercase shrink-0">Annulé</span>}
                                  </div>
                                );
                              }

                              let badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                              if (rdv.Statut_RDV === 'Honoré') {
                                badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                              } else if (isAnnule) {
                                badgeColor = 'bg-red-50 text-red-700 border-red-200 opacity-75';
                              }

                              return (
                                <div
                                  key={rdv.ID_RDV}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening booking popup
                                    setSelectedRDVDetail(rdv);
                                  }}
                                  title={isAnnule ? "Rendez-vous annulé — aucun encaissement reçu avant minuit." : undefined}
                                  className={`p-0.5 px-1 rounded-md border text-[8px] font-bold cursor-pointer transition transform relative ${
                                    isHighlighted
                                      ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400 ring-offset-1 scale-105 z-20 font-black shadow-md'
                                      : isDimmed
                                        ? 'opacity-25 grayscale select-none pointer-events-none'
                                        : `${badgeColor} hover:scale-102 hover:shadow-xs z-10`
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    {isAnnule && <span className="text-red-500 font-bold shrink-0">✕</span>}
                                    <span className={`truncate block max-w-[85px] flex-1 ${isAnnule ? 'line-through decoration-red-500 text-red-700' : ''}`}>
                                      {rdv.debloquePar && <span className="text-amber-600 mr-0.5" title={`Réinitialisé par ${rdv.debloquePar}`}>🔄</span>}
                                      {patObj?.Nom_Patient} {rdv.Besoin ? `[${rdv.Besoin}]` : ''}
                                    </span>
                                    {isAnnule ? (
                                      <span className="ml-auto text-[7px] font-bold text-red-600 uppercase shrink-0">Annulé</span>
                                    ) : isHighlighted ? (
                                      <span className="text-[8px] text-amber-700 font-extrabold">⚡</span>
                                    ) : (
                                      <span className="text-[7px] text-slate-400">#{rdv.ID_RDV}</span>
                                    )}
                                  </div>
                                  <div className={`text-[8px] truncate font-semibold mt-0.5 ${isHighlighted ? 'text-amber-900' : isAnnule ? 'text-red-600/70' : 'text-slate-500'}`}>
                                    {actObj?.Libelle_Acte}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition">
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md">+ Réserver</span>
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}
                  </tr>
                );
              });
            })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLAPSIBLE HISTORICAL ACCORDION DRAWER OVERVIEW */}
      {showHistory && (
        <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-4 text-xs animate-fade-in shadow-inner" id="reeducation-history-view-panel">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-3 gap-4">
            <div className="flex items-center gap-2 font-extrabold text-sm text-slate-800">
              <History className="w-5 h-5 text-emerald-600" />
              <div>
                <span>Explorateur Temporel & Historique</span>
                <p className="text-[10px] text-slate-400 font-medium normal-case">Visualisez le programme de n'importe quelle journée passée ou future.</p>
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
            {/* Left side: History list */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2 px-1">
                <BookOpen className="w-3.5 h-3.5" />
                Dernières séances réalisées ({selectedGender})
              </h4>
              {historyList.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 italic">
                  Aucune séance historique répertoriée pour ce plateau.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {historyList.map((sc) => {
                    const patient = dbState.patients.find(p => p.ID_Patient === sc.ID_Patient);
                    const prat = dbState.praticiens.find(p => p.ID_Prat === sc.ID_Prat);
                    const act = dbState.actes.find(a => a.ID_Acte === sc.ID_Acte);
                    return (
                      <div key={sc.ID_Seanc} className="bg-white p-3 border border-slate-200 rounded-xl flex items-center justify-between shadow-xxs hover:border-indigo-200 transition group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 p-0.5 px-1.5 rounded font-mono text-[9px] font-bold text-slate-500">#{sc.ID_Seanc}</span>
                            <span className="text-slate-400 font-bold">{sc.Date_Seanc_Realisee} • {sc.H_Debut_Seanc}-{sc.H_Fin_Seanc}</span>
                          </div>
                          <p className="font-bold text-slate-800 mt-1">{patient?.Nom_Patient} <span className="text-slate-400 font-medium">({patient?.type_patient})</span></p>
                          <p className="text-slate-500 text-[10px] mt-0.5">Soigné par : <span className="font-bold">Dr. {prat?.Prenom_Prat}</span> • Acte : <span className="text-indigo-600">{act?.Libelle_Acte}</span></p>
                        </div>
                        <div className="text-right ml-4">
                          <span className="block font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-extrabold text-[10px] border border-emerald-100">
                            {sc.Prix_Seanc === 0 ? 'Couvert' : `${sc.Prix_Seanc} DA`}
                          </span>
                          <button 
                            onClick={() => {
                              // Link to that specific day
                              const d = new Date(sc.Date_Seanc_Realisee);
                              const day = d.getDay();
                              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                              const monday = new Date(d.setDate(diff));
                              setCurrentWeekStart(monday.toISOString().split('T')[0]);
                              triggerToast(`Visualisation de la semaine du ${sc.Date_Seanc_Realisee}`, 'info');
                            }}
                            className="mt-2 text-[9px] font-bold text-indigo-500 hover:underline opacity-0 group-hover:opacity-100 transition"
                          >
                            Voir dans le Planning →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side: Quick Links/Stats or similar */}
            <div className="bg-white border border-slate-200 rounded-2.5xl p-5 shadow-3xs space-y-4">
               <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
                 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                 Résumé d'activité
               </h4>
               <div className="grid grid-cols-1 gap-3">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400">Séances ce mois-ci</span>
                    <p className="text-lg font-black text-slate-800 tabular-nums">
                      {historyList.filter(s => s.Date_Seanc_Realisee.startsWith('2026-06')).length}
                    </p>
                 </div>
                 <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="text-[9px] font-bold text-indigo-400">Total recettes (Plateau)</span>
                    <p className="text-lg font-black text-indigo-900 tabular-nums">
                      {historyList.reduce((acc, s) => acc + (s.Prix_Seanc || 0), 0).toLocaleString()} DA
                    </p>
                 </div>
               </div>

               <div className="pt-4 border-t border-slate-100 italic text-[10px] text-slate-400 leading-relaxed">
                 * Utilisez le calendrier ci-dessus pour naviguer rapidement vers une date spécifique et vérifier la charge de travail passée ou future du plateau.
               </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENEUR DE CONTRÔLES RAFFINÉ EN BAS DE LA FENÊTRE */}
      <div className="flex justify-end gap-2 mt-6 mb-2">
        {/* DÉPENSES BUTTON */}
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

        {/* HISTORIQUE POP BUTTON */}
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

      {/* DEPENSE MANAGER DRAWER */}
      {showDepenses && (
        <DepenseManager
          idService={1}
          nomService="Rééducation Adulte"
          dbState={dbState}
          currentUser={currentUser}
          onDbChange={(newState) => onSave && onSave(newState)}
          triggerToast={triggerToast}
        />
      )}

      {/* MODAL DETAILED SHEETS APPOINTMENT PREVIEW */}
      {selectedRDVDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="week-rdv-preview-modal">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-extrabold text-sm text-indigo-900">Détails du Rendez-vous #{selectedRDVDetail.ID_RDV}</span>
              <button onClick={() => setSelectedRDVDetail(null)} className="text-slate-400 hover:text-slate-800 text-md">✕</button>
            </div>

            {(() => {
              const patient = dbState.patients.find(p => p.ID_Patient === selectedRDVDetail.ID_Patient);
              const prat = dbState.praticiens.find(p => p.ID_Prat === selectedRDVDetail.ID_Prat);
              const act = dbState.actes.find(a => a.ID_Acte === selectedRDVDetail.ID_Acte);
              return (
                <div className="space-y-3 font-medium text-slate-700">
                  <div className="bg-slate-50 p-3 rounded-2xl border space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient :</span>
                    <p className="font-bold text-slate-900 text-sm">{patient?.Nom_Patient} ({patient?.Genre_Patient})</p>
                    <p className="text-slate-600 font-semibold">{patient?.phone}</p>
                    <p className="text-[10px] text-slate-400 italic">Code : PAT_#0{patient?.ID_Patient}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Soin Dispensé & Tarif :</span>
                    <p className="font-bold text-slate-900">{act?.Libelle_Acte} — {act?.Prix_Acte} DH</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Horaires Affectés :</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Le {selectedRDVDetail.Date_RDV} de {selectedRDVDetail.H_Debut_RDV} à {selectedRDVDetail.H_Fin_RDV}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Praticien Responsable :</span>
                    <p className="font-bold text-slate-900">Dr. {prat?.Prenom_Prat} {prat?.Nom_Prat}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Statut Actuel :</span>
                    <span className={`inline-block font-bold rounded px-2 py-0.5 text-[10px] ${
                      selectedRDVDetail.Statut_RDV === 'Honoré' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                    }`}>
                      {selectedRDVDetail.Statut_RDV}
                    </span>
                  </div>

                  {selectedRDVDetail.Besoin && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Besoin d'installation :</span>
                      <p className="font-bold text-slate-900 text-sm bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100 w-max">{selectedRDVDetail.Besoin}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedRDVDetail(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl transition"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- CLINICAL BOOKING MODAL FOR CELLS --- */}
      {bookingCell && (() => {
        const cellAppointments = dbState.rendezVous.filter(r => 
          r.Date_RDV === bookingCell.dateStr && 
          r.H_Debut_RDV === bookingCell.slotTime &&
          r.ID_Zone === (selectedGender === 'Homme' ? 1 : 2)
        );

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-200" id="week-rdv-booking-modal">
            <div className="bg-white rounded-xl p-4 border border-slate-200 w-full max-w-4xl shadow-2xl space-y-3 text-xs max-h-[96vh] flex flex-col overflow-hidden">
              
              {/* Header banner */}
              <div className="flex justify-between items-center border-b border-slate-150 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-xs md:text-sm text-indigo-950 font-sans flex items-center gap-1.5 leading-none">
                      Planification Multiple : Plateau {selectedGender}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                      Date : <strong className="text-slate-800">{bookingCell.dateStr}</strong> • Horaire : <strong className="text-indigo-700 font-extrabold">{bookingCell.slotTime}</strong> • {cellAppointments.length} patient(s) programmé(s)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setBookingCell(null);
                    setSelectedPatientId(null);
                  }} 
                  className="text-slate-400 hover:text-slate-800 p-1 hover:bg-slate-100 rounded text-xs transition font-black"
                >
                  ✕
                </button>
              </div>

              {/* SEARCH & ADD BLOCK WITH AUTOCOMPLETE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] uppercase font-black text-slate-505 tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3 h-3 text-indigo-600" />
                    Ajouter un patient (Plateau {selectedGender})
                  </label>
                  <span className="text-[8.5px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 italic">
                    Tapez les premières lettres du nom
                  </span>
                </div>
                
                <PatientAutocomplete 
                  patients={dbState.patients.filter(p => !p.type_patient?.toLowerCase().includes('imc'))}
                  genderRule={selectedGender === 'Homme' ? 'H' : 'F'}
                  onSelect={(patient) => {
                    const slotStart = bookingCell.slotTime;
                    const slotEnd = getEndTimeOfSlot(slotStart, 60);

                    const alreadyScheduled = dbState.rendezVous.some(r => 
                      Number(r.ID_Patient) === Number(patient.ID_Patient) && 
                      r.Date_RDV === bookingCell.dateStr &&
                      r.Statut_RDV !== 'Annulé' &&
                      (r.ID_Sce === 1 || r.Service === 'Rééducation' || r.ID_Sce !== 2)
                    );

                    if (alreadyScheduled) {
                      triggerToast('Ce patient a déjà une séance programmée ce jour', 'error');
                      return;
                    }

                    const patientAbns = dbState.abonnements.filter(a => Number(a.ID_Patient) === Number(patient.ID_Patient));
                    const activeAbn = patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && isSubscriptionCoveringActe(a, 1, dbState) && getRemainingSessions(a, dbState) > 0)
                      || patientAbns.find(a => a.Etat !== 'Fermé' && !(a as any).Est_Gele && isSubscriptionCoveringActe(a, 1, dbState))
                      || patientAbns.find(a => isSubscriptionCoveringActe(a, 1, dbState))
                      || patientAbns.find(a => a.Etat === 'Actif' && !(a as any).Est_Gele && getRemainingSessions(a, dbState) > 0)
                      || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

                    let subActeId = null;
                    if (activeAbn) {
                      if (isSubscriptionCoveringActe(activeAbn, 1, dbState)) {
                        subActeId = 1; // Kinésithérapie
                      } else if (isSubscriptionCoveringActe(activeAbn, 2, dbState)) {
                        subActeId = 2; // Balnéothérapie
                      } else if (isSubscriptionCoveringActe(activeAbn, 3, dbState)) {
                        subActeId = 3; // Psychomot / Intensif
                      } else if (activeAbn.ID_Acte_Add1) {
                        subActeId = activeAbn.ID_Acte_Add1;
                      } else if (activeAbn.ID_Acte_Add2) {
                        subActeId = activeAbn.ID_Acte_Add2;
                      }

                      // Check financial solvency
                      const abnVersements = dbState.versements.filter(v => v.ID_Abn === activeAbn.ID_Abn);
                      const totalVerses = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
                      const isFrozen = !!(activeAbn as any).Est_Gele;
                      const remaining = getRemainingSessions(activeAbn, dbState);

                      const pack = dbState.packs.find(p => p.ID_Pack === activeAbn.ID_Pack);
                      const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
                      const consumedValue = activeAbn.Nbre_Sean_Consom_Abn * prixSeance;
                      
                      const isInsolvent = totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses;

                      if (isFrozen || isInsolvent || remaining <= 0) {
                        let reason = '';
                        if (isFrozen) reason = 'Forfait suspendu / gelé';
                        else if (remaining <= 0) reason = 'Abonnement épuisé (0 séance)';
                        else if (isInsolvent) {
                          if (totalVerses === 0) {
                            reason = 'Insolvable (aucun versement)';
                          } else {
                            reason = `Insolvable (versement insuffisant: reçu ${totalVerses} DA pour une séance de ${prixSeance} DA)`;
                          }
                        }

                        if (triggerToast) {
                          triggerToast(`⚠️ Alerte Solvabilité : Planification effectuée pour ${patient.Nom_Patient} malgré le défaut : ${reason}.`, 'warning');
                        }
                      }
                    }

                    const defaultActe = dbState.actes.find(a => {
                      const lbl = a.Libelle_Acte.toLowerCase();
                      return !lbl.includes("consultation") && !lbl.includes("contrôle");
                    }) || dbState.actes[0];

                    const tableCount = dbState.rendezVous.filter(r => 
                      r.Date_RDV === bookingCell.dateStr && 
                      r.Besoin === 'Table'
                    ).length;

                    if (tableCount >= 8) {
                      triggerToast(`⚠️ Attention : Le nombre maximum de patients nécessitant une Table (8) pour cette journée est dépassé ! (Actuel: ${tableCount + 1})`, 'error');
                    }

                    onAddRDV?.({
                      ID_Patient: patient.ID_Patient,
                      ID_Prat: selectedPratId || dbState.praticiens[0]?.ID_Prat || 1,
                      ID_Acte: subActeId || defaultActe?.ID_Acte || 1,
                      ID_Type_Plan: 1,
                      ID_Zone: selectedGender === 'Homme' ? 1 : 2,
                      ID_Utilisateur: currentUser.ID_Utilisateur || 1,
                      Date_RDV: bookingCell.dateStr,
                      H_Debut_RDV: bookingCell.slotTime,
                      H_Fin_RDV: getEndTimeOfSlot(bookingCell.slotTime, 60),
                      Statut_RDV: 'Planifié',
                      Besoin: 'Table'
                    });

                    triggerToast(`${patient.Nom_Patient} ajouté au créneau.`, 'success');
                  }}
                  placeholder="Ex: 'Ben...', 'Amed...', 'Kac...'"
                  className="w-full text-[11px]"
                />
              </div>

              {/* SCHEDULED APPOINTMENTS VIEWPORT CONTAINER */}
              <div className="border border-slate-200 rounded-xl bg-white flex-1 overflow-hidden flex flex-col min-h-[180px] shadow-sm">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 shrink-0 font-black text-slate-500 text-[9px] uppercase tracking-widest flex justify-between items-center">
                  <span>Patients programmés à {bookingCell.slotTime} ({cellAppointments.length})</span>
                  <span className="text-[8px] text-slate-450 normal-case font-medium italic">Plateau</span>
                </div>

                <div className="overflow-y-auto flex-1 min-h-0 bg-white">
                  {cellAppointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic font-semibold text-[10px]">
                      Aucun rendez-vous sur ce créneau. Utilisez la barre de recherche ci-dessus.
                    </div>
                  ) : (
                    <table className="w-full text-[10.5px] text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 shadow-3xs z-10 text-slate-500 font-black uppercase text-[8.5px] border-b border-slate-200">
                        <tr>
                          <th className="p-2 pl-4">Nom et Prénom</th>
                          <th className="p-2 text-center w-20">Âge</th>
                          <th className="p-2 w-44">Type acte</th>
                          <th className="p-2 w-32">Besoin d'installation</th>
                          <th className="p-2 text-center w-28">Montant acte</th>
                          <th className="p-2 text-center">Abonnement</th>
                          <th className="p-2 text-center pr-4 w-40">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cellAppointments.map((rdv) => {
                          const pat = dbState.patients.find(p => Number(p.ID_Patient) === Number(rdv.ID_Patient));
                          const act = dbState.actes.find(a => Number(a.ID_Acte) === Number(rdv.ID_Acte));
                          
                          const getPatientAge = (p: Patient): number => {
                            if (p.type_patient === 'Enfant' || p.type_patient === 'Enfant IMC') {
                              return 6 + (Number(p.ID_Patient) % 10);
                            }
                            return 24 + ((Number(p.ID_Patient) * 7) % 45);
                          };
                          const age = pat ? getPatientAge(pat) : 32;

                          // Find active first, otherwise most recent created subscription (even if inactive/gelé/exhausted)
                          const rdvPatientId = Number(rdv.ID_Patient);
                          const rdvActeId = Number(rdv.ID_Acte) || 1;
                          const patientAbns = dbState.abonnements.filter(a => Number(a.ID_Patient) === rdvPatientId);
                          const activeAbn = patientAbns.find(a => a.Etat === 'Actif' && !isAbonnementGele(a, dbState) && !(a as any).Est_Gele && isSubscriptionCoveringActe(a, rdvActeId, dbState) && getRemainingSessions(a, dbState) > 0)
                            || patientAbns.find(a => a.Etat !== 'Fermé' && !isAbonnementGele(a, dbState) && !(a as any).Est_Gele && isSubscriptionCoveringActe(a, rdvActeId, dbState))
                            || (patientAbns.length > 0 ? patientAbns[patientAbns.length - 1] : null);

                          const sessionsRemaining = activeAbn ? getRemainingSessions(activeAbn, dbState) : 0;
                          const hasRemainingSessions = activeAbn && sessionsRemaining > 0;

                          // RF Acte compatibility check
                          const isCovered = !!(activeAbn && isSubscriptionCoveringActe(activeAbn, rdvActeId, dbState));
                          const hasActiveCoveringSub = !!(activeAbn && activeAbn.Etat === 'Actif' && !isAbonnementGele(activeAbn, dbState) && !(activeAbn as any).Est_Gele && hasRemainingSessions && isCovered);
                          if (false && activeAbn) {
                            let isCovered = false; const packId = Number(activeAbn.ID_Pack);
                            const acteId = Number(rdv.ID_Acte);

                            if (packId === 1 && acteId === 1) isCovered = true;
                            else if (packId === 2 && acteId === 2) isCovered = true;
                            else if (packId === 3 && [1, 2, 3, 4, 5].includes(acteId)) isCovered = true;
                            else if (packId === 4 && acteId === 1) isCovered = true;
                            
                            if (activeAbn.ID_Acte_Add1 !== null && Number(activeAbn.ID_Acte_Add1) === acteId) {
                              isCovered = true;
                            }
                            if (activeAbn.ID_Acte_Add2 !== null && Number(activeAbn.ID_Acte_Add2) === acteId) {
                              isCovered = true;
                            }
                          }

                          // Solvency & State Evaluation
                          const abnVersements = activeAbn ? dbState.versements.filter(v => Number(v.ID_Abn) === Number(activeAbn.ID_Abn)) : [];
                          const totalVerses = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
                          const isClosed = activeAbn ? (activeAbn.Etat === 'Fermé' || isAbonnementGele(activeAbn, dbState)) : true;
                          
                          const pack = activeAbn ? dbState.packs.find(p => Number(p.ID_Pack) === Number(activeAbn.ID_Pack)) : null;
                          const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack / pack.Nbre_Seance_Pack || 150)) : 150;
                          const consumedValue = activeAbn ? (activeAbn.Nbre_Sean_Consom_Abn * prixSeance) : 0;
                          const isInsolvent = activeAbn ? (totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses) : false;

                          const abnState = (() => {
                            if (!activeAbn) {
                              return {
                                label: "Pas d'Abonnement",
                                badgeClass: "text-slate-450 italic text-[9px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full font-bold",
                                btnLabel: "Reglement",
                                isDeductible: false,
                                isDisabled: false,
                                btnTheme: "bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                              };
                            }

                            const isAdminGele = !!(activeAbn as any).Est_Gele;

                            // Si l'abonnement n'est pas fermé et qu'il reste des séances, toujours autoriser la déduction
                            if (activeAbn && activeAbn.Etat !== 'Fermé' && sessionsRemaining > 0) {
                              const isGele = isAdminGele || activeAbn.Etat === 'Gelé' || totalVerses <= 0 || consumedValue >= totalVerses;
                              return {
                                label: isGele 
                                  ? (totalVerses <= 0 || consumedValue >= totalVerses ? "⚠️ Insolvable (Déductible)" : "❄️ Gelé (Déductible)")
                                  : "🎁 Abonnement",
                                badgeClass: isGele 
                                  ? "text-[9px] font-black uppercase bg-amber-55 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center justify-center gap-1"
                                  : "text-[9px] font-black uppercase bg-emerald-100/90 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center justify-center gap-1",
                                btnLabel: "Déduire",
                                isDeductible: isCovered,
                                isDisabled: false,
                                btnTheme: isGele 
                                  ? "bg-amber-600 hover:bg-amber-700 text-white font-black" 
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white font-black"
                              };
                            }

                            // 3. ÉTAT : DESACTIVE / CLÔTURÉ
                            if (isAdminGele || activeAbn.Etat === 'Fermé') {
                              return {
                                label: "❄️ Désactivé",
                                badgeClass: "text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center justify-center gap-1",
                                btnLabel: "Régler en Espèces",
                                isDeductible: false,
                                isDisabled: false,
                                btnTheme: "bg-amber-600 hover:bg-amber-700 text-white font-black"
                              };
                            }

                            // 4. ÉTAT : ÉPUISÉ
                            if (sessionsRemaining === 0 && totalVerses <= consumedValue) {
                              return {
                                label: "🛑 Épuisé",
                                badgeClass: "text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center justify-center gap-1",
                                btnLabel: "Régler en Espèces",
                                isDeductible: false,
                                isDisabled: false,
                                btnTheme: "bg-rose-600 hover:bg-rose-700 text-white font-black"
                              };
                            }

                            // 2. ÉTAT : INSOLVABLE
                            if (totalVerses <= 0 || consumedValue >= totalVerses) {
                              return {
                                label: "⚠️ Insolvable (Pas de versement)",
                                badgeClass: "text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center justify-center gap-1",
                                btnLabel: "Régler en Espece",
                                isDeductible: false,
                                isDisabled: false,
                                btnTheme: "bg-amber-600 hover:bg-amber-700 text-white font-black"
                              };
                            }

                            // 1. ÉTAT : ACTIF & VALIDE
                            if (sessionsRemaining > 0 && totalVerses > consumedValue) {
                              return {
                                label: "🎁 Abonnement",
                                badgeClass: "text-[9px] font-black uppercase bg-emerald-100/90 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center justify-center gap-1",
                                btnLabel: "Déduire",
                                isDeductible: isCovered,
                                isDisabled: false,
                                btnTheme: "bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                              };
                            }

                            // Fallback
                            return {
                              label: "🎁 Abonnement",
                              badgeClass: "text-[9px] font-black uppercase bg-emerald-100/90 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center justify-center gap-1",
                              btnLabel: "Déduire",
                              isDeductible: isCovered,
                              isDisabled: false,
                              btnTheme: "bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                            };
                          })();

                          const isForfait = abnState.btnLabel === "Déduire";

                          return (
                            <tr key={rdv.ID_RDV} className="hover:bg-slate-50/70 transition group">
                              <td className="p-2.5 pl-5 font-black text-slate-900 border-r border-slate-50">
                                {rdv.debloquePar && <span className="text-amber-600 mr-1" title={`Réinitialisé par ${rdv.debloquePar}`}>🔄</span>}
                                {pat?.Nom_Patient || `PAT_#${rdv.ID_Patient}`}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                                {age} ans
                              </td>
                              <td className="p-2.5">
                                <select
                                  disabled={!hasPermission(currentUser?.Role, 'planning_reeduc_balneo', 'canEdit')}
                                  value={rdv.ID_Acte}
                                  onChange={(e) => {
                                    const nextActeId = Number(e.target.value);
                                    const nextState = {
                                      ...dbState,
                                      rendezVous: dbState.rendezVous.map(r =>
                                        r.ID_RDV === rdv.ID_RDV ? { ...r, ID_Acte: nextActeId, updatedAt: Date.now() } : r
                                      )
                                    };
                                    onSave?.(nextState);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                  {(() => {
                                    const filteredList = getFilteredActesForRole(dbState.actes, currentUser?.Role || 'Admin');
                                    const finalDisplayList = [...filteredList];
                                    if (!finalDisplayList.some(a => a.ID_Acte === rdv.ID_Acte)) {
                                      const currentActeObj = dbState.actes.find(a => a.ID_Acte === rdv.ID_Acte);
                                      if (currentActeObj) {
                                        finalDisplayList.unshift(currentActeObj);
                                      }
                                    }
                                    return finalDisplayList.map(a => (
                                      <option key={a.ID_Acte} value={a.ID_Acte}>
                                        {a.Libelle_Acte}
                                      </option>
                                    ));
                                  })()}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <select
                                  disabled={!hasPermission(currentUser?.Role, 'planning_reeduc_balneo', 'canEdit')}
                                  value={rdv.Besoin || 'Table'}
                                  onChange={(e) => {
                                    const nextBesoin = e.target.value;
                                    
                                    if (nextBesoin === 'Table') {
                                      const tableCount = dbState.rendezVous.filter(r => 
                                        r.Date_RDV === rdv.Date_RDV && 
                                        r.Besoin === 'Table' &&
                                        r.ID_RDV !== rdv.ID_RDV
                                      ).length;
                                      
                                      if (tableCount >= 8) {
                                        triggerToast(`⚠️ Attention : Le nombre maximum de patients nécessitant une Table (8) pour cette journée est dépassé ! (Actuel: ${tableCount + 1})`, 'error');
                                      }
                                    }

                                    const nextState = {
                                      ...dbState,
                                      rendezVous: dbState.rendezVous.map(r =>
                                        r.ID_RDV === rdv.ID_RDV ? { ...r, Besoin: nextBesoin, updatedAt: Date.now() } : r
                                      )
                                    };
                                    onSave?.(nextState);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                  <option value="Table">Table</option>
                                  <option value="Chaise">Chaise</option>
                                </select>
                              </td>
                              <td className="p-2.5 text-center font-mono font-black text-indigo-700">
                                {act?.Prix_Acte} DA
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={abnState.badgeClass}>
                                    {abnState.label}
                                  </span>
                                  {activeAbn && !isClosed && (
                                    <span className="text-[7.5px] text-slate-450 font-mono italic">
                                      {sessionsRemaining} séans. reliquat
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2.5 text-center pr-5">
                                <div className="flex items-center justify-center gap-1.5">
                                  {rdv.Statut_RDV === 'Honoré' ? (
                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl flex items-center gap-1 text-[9px] font-black border border-emerald-100">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Validé
                                    </span>
                                  ) : currentUser?.Role !== 'SupperRec' ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        // 🔧 DÉDUCTION DU FORFAIT + VALIDATION
                                        const fresh = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
                                        
                                        // 1. Passer le RDV en Honoré
                                        const rdvIdx = fresh.rendezVous.findIndex(r => r.ID_RDV === rdv.ID_RDV);
                                        if (rdvIdx !== -1) {
                                          fresh.rendezVous[rdvIdx] = {
                                            ...fresh.rendezVous[rdvIdx],
                                            Statut_RDV: 'Honoré',
                                            updatedAt: Date.now()
                                          };
                                        }
                                        
                                        // 2. Chercher l'abonnement à débiter
                                        const rdvPatientId = Number(rdv.ID_Patient);
                                        const rdvActeId = Number(rdv.ID_Acte) || 1;
                                        const patientAbns = fresh.abonnements.filter(a => Number(a.ID_Patient) === rdvPatientId);
                                        
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
                                          pAbnIdx = patientAbns.findIndex(a => 
                                            isSubscriptionCoveringActe(a, rdvActeId, fresh)
                                          );
                                        }
                                        if (pAbnIdx === -1) {
                                          pAbnIdx = patientAbns.findIndex(a => a.Etat !== 'Fermé');
                                        }
                                        if (pAbnIdx === -1 && patientAbns.length > 0) {
                                          pAbnIdx = 0;
                                        }
                                        
                                        const abn = pAbnIdx !== -1 ? patientAbns[pAbnIdx] : null;
                                        const abnIdx = abn ? fresh.abonnements.findIndex(a => a.ID_Abn === abn.ID_Abn) : -1;
                                        const remaining = abn ? getRemainingSessions(abn, fresh) : 0;
                                        
                                        if (abn && abnIdx !== -1 && remaining > 0) {
                                          // ✅ DÉDUIRE LE FORFAIT
                                          fresh.abonnements[abnIdx] = {
                                            ...abn,
                                            Nbre_Sean_Consom_Abn: abn.Nbre_Sean_Consom_Abn + 1,
                                            updatedAt: Date.now()
                                          };
                                          
                                          // Créer la séance liée
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
                                            Date_Seanc_Realisee: rdv.Date_RDV,
                                            updatedAt: Date.now()
                                          }];
                                          
                                          onSave?.(fresh);
                                          triggerToast(`Séance débitée du forfait de ${pat?.Nom_Patient || 'patient'} !`, 'success');
                                        } else {
                                          // 💵 HORS-FORFAIT : encaissement direct
                                          const price = act?.Prix_Acte || 1500;
                                          if (!fresh.transactions_caisses) fresh.transactions_caisses = [];
                                          const nextTransId = fresh.transactions_caisses.length > 0
                                            ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans || (t as any).ID_Transaction || 0)) + 1
                                            : 1;
                                            
                                          fresh.transactions_caisses.push({
                                            ID_Trans: nextTransId,
                                            Caisse: 'Caisse Sce Adulte',
                                            Type: 'Recette',
                                            Montant: price,
                                            Libelle: `RDV_#${rdv.ID_RDV} - ${act?.Libelle_Acte || 'Soin'} (Hors-forfait)`,
                                            ModePaiement: 'Espèces',
                                            Date_Trans: rdv.Date_RDV,
                                            Patient_Nom: pat?.Nom_Patient || 'Patient',
                                            ID_Acte: rdv.ID_Acte,
                                            ID_RDV: rdv.ID_RDV,
                                            updatedAt: Date.now()
                                          });
                                          
                                          onSave?.(fresh);
                                          triggerToast('Règlement enregistré (hors-forfait) et séance validée.', 'success');
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 text-[9px] font-black shadow-xs transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      {abnState.btnLabel}
                                    </button>
                                  ) : null}
                                  {deleteConfirmRdvId === rdv.ID_RDV ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmRdvId(null);
                                        }}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded cursor-pointer"
                                      >
                                        Non
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const fresh = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
                                          // If the RDV is deleted and it was 'Honoré', revert the associated actions (refund subscriber credits, delete transaction & seance)
                                          if (rdv.Statut_RDV === 'Honoré') {
                                            const seanceIdx = fresh.seances.findIndex(s => s.ID_RDV === rdv.ID_RDV);
                                            if (seanceIdx !== -1) {
                                              const seance = fresh.seances[seanceIdx];
                                              if (seance.ID_Abn) {
                                                const abnIdx = fresh.abonnements.findIndex(abn => abn.ID_Abn === seance.ID_Abn);
                                                if (abnIdx !== -1) {
                                                  fresh.abonnements[abnIdx] = {
                                                    ...fresh.abonnements[abnIdx],
                                                    Nbre_Sean_Consom_Abn: Math.max(0, fresh.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1)
                                                  };
                                                }
                                              }
                                              fresh.seances = fresh.seances.filter(s => s.ID_RDV !== rdv.ID_RDV);
                                            }

                                            if ((fresh as any).transactions_caisses) {
                                              (fresh as any).transactions_caisses = (fresh as any).transactions_caisses.filter((t: any) => {
                                                return !String(t.Libelle || '').includes(`RDV_#${rdv.ID_RDV}`);
                                              });
                                            }
                                          }
                                          fresh.rendezVous = fresh.rendezVous.filter(r => r.ID_RDV !== rdv.ID_RDV);
                                          onSave?.(fresh);
                                          setDeleteConfirmRdvId(null);
                                          triggerToast('Rendez-vous retiré et mouvements de caisse mis à jour.', 'info');
                                        }}
                                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold rounded cursor-pointer"
                                      >
                                        Oui
                                      </button>
                                    </div>
                                  ) : hasPermission(currentUser?.Role, 'planning_reeduc_balneo', 'canDelete') ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmRdvId(rdv.ID_RDV);
                                      }}
                                      title="Supprimer ce rendez-vous"
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-end gap-2.5 border-t border-slate-150 pt-3.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setBookingCell(null);
                    setSelectedPatientId(null);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition cursor-pointer shadow-md"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default React.memo(ReeducationWeekCalendar);
